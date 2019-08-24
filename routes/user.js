var Entities = require('html-entities').AllHtmlEntities;

var mongoose = require('mongoose');
var expressSession = require('express-session');
var jwt = require('jsonwebtoken');

var permittednickNm = {permittednickNm: false}

var checknickNm = function(req, res) {
    console.log('user 모듈 안에 있는 checknickNm 호출됨.');

    var paramnickNm = req.body.nickNm || req.query.nickNm;
    if (paramnickNm == undefined) {
        console.log('닉네임 미입력.');   
        res.send(permittednickNm); 
        return;
    }
    var database = req.app.get('database');
    console.log('요청 파라미터 : ' + paramnickNm);

    // 데이터베이스 객체가 초기화된 경우
    if (database.db) {

        // 1. 아이디를 이용해 사용자 검색
        database.UserModel.findOne( {nickNm: paramnickNm}, function(err, result) {
            if (err) {
                console.error('사용자 조회 중 에러 발생 : ' + err.stack);

                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>사용자 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
                res.end();
                return;
            } 
            if(!(result == null)){
                console.log("중복된 닉네임 입력"); 
                res.send(permittednickNm); 
                res.end();      
                return;
            }   
            else{  
            
            permittednickNm.permittednickNm = true
            res.send(permittednickNm); 
            return; 
            }
    })  
    } 
}; //checknickNm 닫기

var getuserid = function(req, res) {
    console.log('user 모듈 안에 있는 getuserid 호출됨.');
  
    // paramjwt: 요청한 사용자의 jwt 
    // secret: paramjwt decode 위해서 선언  
    // paramnickNm: paramjwt를 verify해서 얻은 nickNm. 요청한 사용자의 nickNm
    
    var paramjwt = req.body.jwt || req.query.jwt || req.params.jwt; 
    var secret = "HS256";
    var paramnickNm = jwt.verify(paramjwt,secret).nickNm;  
    
    var database = req.app.get('database'); 
    
    console.log("요청 파라미터: paramjwt: ",paramjwt, " , ", "paramnickNm: ",paramnickNm)
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
					     
        database.UserModel.findOne({nickNm: paramnickNm}, function(err, user) {
            if (err) {
                console.error('사용자 조회 중 에러 발생 : ' + err.stack);
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>사용자 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
                res.end();
                return;
            } 
            if(user == null){
                console.log("요청 받은 nickNm이 없음"); 
                res.end();      
                return;
            }   
            else{  
                var context = {
                    userid: user._id
                }; 
                console.log("userid: ",context.userid)
                res.send(context); 
                return;     
            }
        })//UserModel.findOne 닫기 
    } else {
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>글 수정 시도 실패</h2>');
        res.end();
        }   
};//getuserid 닫기

module.exports.checknickNm = checknickNm;
module.exports.getuserid = getuserid;