/**
 * @description 로컬 로그인 인증 방식 설정. 
 * config/passport 에서 passport.use('local-login', local_login); 로써 'local-login'이라는 이름의 strategy를 등록 
 * config/user_passport에 있는 'passport.authenticate('local-login', ...)' 
 * 가 호출될 때(+passport.authenticate의 콜백함수 실행 전) 호출 되는 함수.
 * 'local-login'이라는 이름의 strategy에 대한 콜백 함수를 정의한다. 
 * 한 파일에 정의하는 함수의 갯수가 1개 이므로 module.exports에 함수를 직접 할당 하였다.   
 * @author Chang Hee
 */

const LocalStrategy = require('passport-local').Strategy; 
const localDB = require('../../database/database');
const getDatabase = require('../../database/database').getDatabase; 

/**
 * @description 'local-login' 이라는 이름으로 접근 가능한 LocalStrategy 및 콜백 함수 정의   
 * @param {String} logindId - 클라이언트 쪽의 'loginId' 이름의 필드 값을 전달 받음. 
 * @param {String} password - 클라이언트 쪽의 'password' 이름의 필드 값을 전달 받음. 
 * @param {function(): null, Object, String} done - passport 모듈의 done 함수.
 * @returns {function(): null, Object, String} done - passport 모듈의 done 함수. 에러 혹은 인증 실패시 Object 자리에 false 삽입.  
 */
module.exports = new LocalStrategy({ 
    usernameField: 'loginId', //클라이언트 쪽의 'loginId' 이름의 필드 값을 전달 받음. 콜백함수의 파라미터로 사용
    passwordField: 'password', //클라이언트 쪽의 'password' 이름의 필드 값을 전달 받음. 콜백함수의 파라미터로 사용
    passReqToCallback: false // 이 옵션을 true로 설정하면 아래 콜백 함수의 첫번째 파라미터로 req 객체 전달됨
}, async function(loginId, password, done){
	
	console.log('config/passport/local_login에서의 local-login 호출됨'); 
	const database = await getDatabase(); 
	
	console.log('logindId: ', loginId);
	console.log('password: ', password);

	if(database){
		database
			.collection('users')
			.findOne({ loginId :  loginId }, function(err, user) {
				if (err) { 
					console.log('config/passport/local_login에서 계정 조회 중 에러 발생: ' + err.stack);
					
					//passport.authenticate('local-login' function(){})의 콜백함수의 인자로 null, false, msg 전달. 
					// msg: 사용자 화면에 띄울 메시지
					return done(null, false, 'err occured during checking the account');  
				}
				// 등록된 사용자가 없는 경우
				if (!user) {
					console.log('config/passport/local_login에서 해당 아이디와 일치하는 계정이 없음');
					return done(null, false, "There's no matching account.");
				} 
				const authenticated = localDB.UserModel({}).authenticate(password, user.salt, user.hashed_password);
			
				// 비밀번호 비교하여 맞지 않는 경우
				if (!authenticated) {
					console.log('config/passport/local_login에서 비밀번호 불일치');
					return done(null, false,'Cannot find your account. Please check your email and password again');
				} 
				// 정상인 경우
				console.log('계정과 비밀번호가 일치함.');
				return done(null, user,'Welcome!'); 
			}); 
	} 
	else{
		console.log("config/passport/local_login에서 데이터베이스 연결 불가: " + err.stack); 
		return done(null, user,'err occured in database');
	}
});