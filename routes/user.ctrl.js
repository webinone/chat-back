const User = require('../schemas/user');
const bcrypt = require('bcrypt-nodejs');
const passport = require('passport');

exports.signupUser = async (req, res, next) => {
	try {
		// 이미 사용자가 있는지 확인하는 로직
		const exUser = await User.find({ userId: req.body.userId });
		if (exUser.length !== 0) {
			return res.status(403).send('이미 사용 중인 아이디입니다.');
		}
		// Bcrypt를 이용한 회원 가입 암호 비밀화

		bcrypt.hash(req.body.userPassword, null, null, async (err, hash) => {
			if (err) {
				console.log('bcrypt.genSalt() Error: ', err.message);
			} else {
				const user = new User({
					userId: req.body.userId,
					password: hash,
					nickname: req.body.userNickname,
					job: req.body.userJob,
					profile: req.body.userProfile
				});
				const newUser = await user.save();
				const filterUser = Object.assign({}, newUser.toJSON());
				delete filterUser.password;
				return res.status(200).send(filterUser);
			}
		});
	} catch (e) {
		console.error(e);
		next(e);
	}
};

exports.loginUser = async (req, res, next) => {
	passport.authenticate('local', (err, user, info) => {
		if (err) {
			console.error(err);
			return next(err);
		}
		if (info) {
			console.log(info);
			return res.status(401).send(info.reason);
		}
		return req.login(user, (loginErr) => {
			if (loginErr) {
				return next(loginErr);
			}
			const [ filterUser ] = user; // 얕은 복사로 인해 참조가 변하지 않는 듯하다.
			const filterUserShallow = Object.assign({}, filterUser);
			delete filterUserShallow._doc.password; // 비밀번호를 제거해서 보안을 높여야한다.
			return res.json(filterUser._doc);
		});
	})(req, res, next);
};

exports.logoutUser = (req, res, next) => {
	req.logout();
	req.session.destroy();
	return res.status(200).send('ok');
};
