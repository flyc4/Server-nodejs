/**
 * @description 회원가입 혹은 로그인 이후의 세션 관련 함수. 현재는 모바일만 구현 중이기에 미 사용. 
 * 웹 페이지 개설을 대비해 파일을 남겨 둠.
 * serializeUser: 세션 생성 후 저장할 정보를 두 번째 파라미터(done)로 넘김 
 * deserializeUser: serializeUser 이후 사용자의 요청 시 마다 serializeUser에서 저장한 내용을 읽어옴. 
 * 
 * config/passport 에서 passport.use('local-login', local_login); 로만 쓰임. 
 * 'local-login'이라는 이름의 strategy에 대한 콜백 함수를 정의한다. 
 * 한 파일에 정의하는 함수의 갯수가 1개 이므로 module.exports에 함수를 직접 할당 하였다.   
 * @author Chang Hee
 */
const local_login = require('./passport/local_login');
const local_signup = require('./passport/local_signup');

/**
 * @description passport 모듈의 serializeUser 와 deserializeUser 설정 후 현재 서버에 적용 
 * @param {Object} app - passport 설정을 적용할 app.  
 * @param {Object} passport - 파라미터로 받은 app에 적용할 passport 모듈의 설정들을 정의 
 */
module.exports = function (app, passport) {
	console.log('config/passport 호출됨.');

    // 사용자 인증 성공 시 호출
    // 사용자 정보를 이용해 세션을 만듦
    // 로그인 이후에 들어오는 요청은 deserializeUser 메소드 안에서 이 세션을 확인할 수 있음
    passport.serializeUser(function(user, done) {
        console.log('serializeUser() 호출됨.');
        console.dir(user);

        done(null, user);  // 이 인증 콜백에서 넘겨주는 user 객체의 정보를 이용해 세션 생성
    });

    // 사용자 인증 이후 사용자 요청 시마다 호출
    // user -> 사용자 인증 성공 시 serializeUser 메소드를 이용해 만들었던 세션 정보가 파라미터로 넘어온 것임
    passport.deserializeUser(function(user, done) {
        console.log('deserializeUser() 호출됨.');
        console.dir(user);

        // 사용자 정보 중 id나 email만 있는 경우 사용자 정보 조회 필요 - 여기에서는 user 객체 전체를 패스포트에서 관리
        // 두 번째 파라미터로 지정한 사용자 정보는 req.user 객체로 복원됨
        // 여기에서는 파라미터로 받은 user를 별도로 처리하지 않고 그대로 넘겨줌
        done(null, user);  
    });

    // 인증방식 설정. passport.use(스트래터지 이름, 인증 방식을 정의한 객체)
	passport.use('local-login', local_login);
	passport.use('local-signup', local_signup);	
};