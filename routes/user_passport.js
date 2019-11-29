const express = require('express');
const router = express.Router();     
const nodemailer = require('nodemailer');
var mongoose = require('mongoose');
var expressSession = require('express-session');
var jwt = require('jsonwebtoken');  
var utils = require('../config/utils')
require('dotenv').config();

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
    
    
    //로그인
    router.route('/login').post(function(req, res, next){
        console.log("login 호출 됨")

        passport.authenticate('local-login', {session: false},function (err, user, msg) {        
    
        var logininfo = {islogin: false, accesstoken: '', msg: ''} 
        //로그인 완료 여부, accesstoken, 로그인 실패 시 메시지  
        
        if (err) { return next(err); } 
        if (user == false) {
            logininfo.msg = msg;     
            res.json(logininfo);
            res.end(); 
            return;
        }    
        logininfo.islogin = true;  
        logininfo.accesstoken = jwt.sign({ nickNm: user.nickNm, userid: user._id},utils.secret);
        logininfo.msg = msg;
        res.json(logininfo);
        res.end(); 
        return;
    })(req, res, next)
    })

    router.route('/signup').post(function(req, res){


        passport.authenticate('local-signup', {session: false},async function (err, user, msg) {        
            
            var signupinfo = {issignup: false, accesstoken: '', msg: ''} 
            //회원 가입 완료 여부, accesstoken, 가입 실패 시 메시지  
            if (err) { return; } 
            if (user == false) { 
                signupinfo.msg = msg;    
                res.json(signupinfo); 
                res.end();
                return; 
            } 
            
            signupinfo.issignup = true;
            signupinfo.accesstoken = jwt.sign({ nickNm: user.nickNm, userid: user._id},utils.secret);
            signupinfo.msg = msg;
            
        //사용자에게 전송할 정보 가공
        res.json(signupinfo); 
        res.end()
        return;
    })(req, res)
    });
};

