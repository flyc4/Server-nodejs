var LocalStrategy = require('passport-local').Strategy; 
const MongoClient = require("mongodb").MongoClient;
require('dotenv').config();

const client = new MongoClient(process.env.db_url, {
	useNewUrlParser: true,
  });
  let database
  
  const createConn = async () => {
	await client.connect();
	database = client.db('db'); 
	
  }; 
  
  const connection = async function(){  
	if (!client.isConnected()) { 
		// Cold start or connection timed out. Create new connection.
		try {
			await createConn(); 
			console.log("connection completed")
		} catch (e) { 
			res.json({
				error: e.message,
			});
			return;
		}
	}    
  }
module.exports = new LocalStrategy({
    usernameField: 'loginId', 
    passwordField: 'password', 
    passReqToCallback: true 
}, async function(req,loginId, password,done){
    console.log("passport의 local-login 호출: ",loginId,' , ',password); 
    var mongoose = require('mongoose'); 
	await connection(); 
	if(database){
	    database.collection('users').findOne({ 'loginId' :  loginId }, function(err, user) {
	    	if (err) { 
				console.log('계정 조회 중 에러 발생: ' + err.stack);
		        return done(null, false, '계정 조회 중 에러 발생'); 
            }
	    	// 등록된 사용자가 없는 경우
	    	if (!user) {
	    		console.log('해당 아이디와 일치하는 계정이 없음');
	    		return done(null, false, "There's no matching account.");
	    	}
			// 비밀번호 비교하여 맞지 않는 경우 
			let db = req.app.get('database'); 
			let instance_user = db.UserModel({});
			var authenticated = instance_user.authenticate(password, user.salt, user.hashed_password);
			if (!authenticated) {
				console.log('비밀번호 불일치');
				return done(null, false,'Cannot find your account. Please check your email and password again');
			} 
			// 정상인 경우
			console.log('계정과 비밀번호가 일치함.');
			return done(null, user,'환영합니다'); 
		}); 
	} 
	else{
		console.log("local_login 에서 데이터 베이스 연결 불가: " + err.stack); 
		return;
	}
});