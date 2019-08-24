var LocalStrategy = require('passport-local').Strategy; 

module.exports = new LocalStrategy({
    usernameField: 'loginId', 
    passwordField: 'password', 
    passReqToCallback: true 
}, function(req,loginId, password,done){
    console.log("passport의 local-login 호출: ",loginId,' , ',password); 
    var mongoose = require('mongoose');
    var database = req.app.get('database');
	    database.UserModel.findOne({ 'loginId' :  loginId }, function(err, user) {
	    	if (err) { 
                console.log('계정 조회 중 에러 발생');
		        return done(null, false, '계정 조회 중 에러 발생'); 
            }
	    	// 등록된 사용자가 없는 경우
	    	if (!user) {
	    		console.log('해당 아이디와 일치하는 계정이 없음');
	    		return done(null, false, '해당 아이디와 일치하는 계정이 없음.');
	    	}
	    	// 비밀번호 비교하여 맞지 않는 경우
			var authenticated = user.authenticate(password, user._doc.salt, user._doc.hashed_password);
			if (!authenticated) {
				console.log('비밀번호 불일치');
				return done(null, false,'비밀번호 불일치');
			} 
			// 정상인 경우
			console.log('계정과 비밀번호가 일치함.');
			return done(null, user,'환영합니다'); 
	    });
});