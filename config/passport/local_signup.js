//402쪽 
var LocalStrategy = require('passport-local').Strategy; 
var jwt = require('jsonwebtoken');

module.exports = new LocalStrategy({
        
        usernameField : 'loginId',
		passwordField : 'password',
		passReqToCallback : true    // 이 옵션을 설정하면 아래 콜백 함수의 첫번째 파라미터로 req 객체 전달됨
	}, function(req,loginId,password,done) {
        var paramloginId = req.body.loginId || req.query.loginId;  
        var parampassword = req.body.password || req.query.password;
        var paramnickNm = req.body.nickNm || req.query.nickNm; 
        console.log('passport의 local-signup 호출됨 : ' + paramloginId + ' , ' + paramnickNm);



            // 요청 파라미터 중 name 파라미터 확인
            
            // findOne 메소드가 blocking되지 않도록 하고 싶은 경우, async 방식으로 변경
            
            process.nextTick(function() {
                var database = req.app.get('database'); 
                database.UserModel.findOne( { 'loginId' :  loginId}, function(err, user) {
                    // 에러 발생 시
                    if (err) {
                        console.log('기존에 계정이 있는 지 확인하는 과정에서 에러 발생.');
                        return done(null, false, '기존에 계정이 있는 지 확인하는 과정에서 에러 발생');
                    }
                    /* 기존에 사용자 정보가 있는 경우
                    else if (user) {
                        console.log('사용 중인 아이디');
                        return done(null, false, 'Somebody is already using the account.');
                    }     
                    */ 
                    //토큰 생성 
                    else{ 
                    
                    var newuser = new database.UserModel({'loginId':paramloginId, 'password':parampassword, 'nickNm': paramnickNm}); 
                    newuser.save(function(err) {
                            if (err) {
                                throw err;
                            }
                            console.log("사용자 데이터 추가함.");  
                    });    
                    return done(null, newuser, "Welcome!");
                    }
                    
            }) //findOne 닫기 
        }); //nextTick 닫기 
    
}) //LocalStrategty 닫기
    

