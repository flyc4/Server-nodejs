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
    
//-------------------react native 와 연동---------------------------------------    
    //로그인
    router.route('/login').post(function(req, res, next){
        console.log("in login")

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

