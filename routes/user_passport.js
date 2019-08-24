/**
 * 패스포트 라우팅 함수 정의
 *
 * @date 2016-11-10
 * @author Mike
 */
const express = require('express');
const router = express.Router();    
var mongoose = require('mongoose');
var expressSession = require('express-session');
var jwt = require('jsonwebtoken');

function connectDB() {
    var databaseUrl = exports.config.db_url;
     
    MongoClient.connect(databaseUrl, function(err, database) {
        if(err) throw err;
         var db = client.db('local');
        console.log('데이터베이스에 연결됨: '+databaseUrl);
    });
}
module.exports = function(router, passport) {
    console.log('user_passport 호출됨.');

    // 홈 화면
    router.route('/').get(function(req, res) {
        console.log('/ 패스 요청됨.');

        console.log('req.user의 정보');
        console.dir(req.user);

        // 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.render('public/login.html');//res.render('index.ejs', {login_success:false}); : 원래 코드
        } else {
            console.log('사용자 인증된 상태임.');
            res.render('public/login.html');//res.render('index.ejs', {login_success:true}); : 원래 코드
        }
    });
     
    // 회원가입 화면
    router.route('/signup').get(function(req, res) {
        console.log('/signup 패스 요청됨.');
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });
	 
    // 로그인 후 홈 화면
    router.route('/home').get(function(req, res) {
        console.log('/home 패스 요청됨.');

        // 인증된 경우, req.user 객체에 사용자 정보 있으며, 인증안된 경우 req.user는 false값임
        console.log('req.user 객체의 값');
        console.dir(req.user);

        // 인증 안된 경우
        if (!req.user) {
            console.log('계정 없이 홈 들어옴.');
            res.redirect('/');
        } else {
            console.log('사용자 인증된 상태임.');
            console.log('/home 패스 요청됨.');
            console.dir(req.user); 
            expressSession.nickNm = req.user.nickNm;
            res.render('home.ejs');
            }
    });  
    // 커뮤니티 접속 화면
    router.route('/community').get(function(req, res) {
    console.log('/community 패스 요청됨.');
    console.log('req.user 객체의 값');
    console.dir(req.user);
        // 인증 안된 경우
    if (!req.user) {
        console.log('계정 없이 홈 들어옴.');
        res.redirect('/');
    } else {
        console.log('사용자 인증된 상태임.');
        console.log('/community 패스 요청됨.');
        console.dir(req.user);
        res.render('community.ejs');
        }
    });  
    
//-------------------react native 와 연동---------------------------------------    
    //데이터 전송을 하기 위한 테스트 용도 
    router.route('/data').post(function(req, res) {     
        console.log("/data 패스 요청됨");
        var account = {
            id: req.body.loginId,
            password: req.body.password} 
            console.log("account.id: ",account.id);
            console.log("account.password: ",account.password); 
            res.send(account);
    }) 

    //로그인
    router.route('/login').post(function(req, res, next){

        passport.authenticate('local-login', {session: false},function (err, user, msg) {        
    
        var logininfo = {islogin: false, accesstoken: '', msg: ''} 
        //로그인 완료 여부, accesstoken, 로그인 실패 시 메시지  
        
        if (err) { return next(err); } 
        if (user == false) {
            logininfo.msg = msg;    
            return res.send(logininfo);res.end();
        }    
        logininfo.islogin = true;
        var secret = "HS256";    
        logininfo.accesstoken = jwt.sign({ loginId: user.loginId, nickNm: user.nickNm},secret);
        logininfo.msg = msg;
        res.send(logininfo);
    })(req, res, next)
    })
    router.route('/signup').post(function(req, res, next){

        passport.authenticate('local-signup', {session: false},function (err, user, msg) {        
    
        var signupinfo = {issignup: false, accesstoken: '', msg: ''} 
        //회원 가입 완료 여부, accesstoken, 가입 실패 시 메시지  
        
        if (err) { return next(err); } 
        if (user == false) {
            signupinfo.msg = msg;    
            return res.send(signupinfo);res.end();
        }    
        signupinfo.issignup = true;
        var secret = "HS256";    
        signupinfo.accesstoken = jwt.sign({ loginId: user.loginId, nickNm: user.nickNm},secret);
        signupinfo.msg = msg;
        res.send(signupinfo);
    })(req, res, next)
    })
};

