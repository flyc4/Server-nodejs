var Entities = require('html-entities').AllHtmlEntities;
var mongoose = require('mongoose');
var expressSession = require('express-session');
var jwt = require('jsonwebtoken'); 
var ObjectId = mongoose.Types.ObjectId;  
var utils = require('../config/utils'); 

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

//사용자 계정의 활성화 여부 체크
let CheckVerified = function(req, res) {
    console.log('user/CheckVerified 호출됨.');

    // paramjwt: 요청한 사용자의 jwt 
    // secret: paramjwt decode 위해서 선언  
    // paramnickNm: paramjwt를 verify해서 얻은 nickNm. 요청한 사용자의 nickNm
    
    var paramjwt = req.body.jwt || req.query.jwt || req.params.jwt; 
    var secret = "HS256";
    var paramnickNm = jwt.verify(paramjwt,secret).nickNm;  
    var context = {msg: " ", isverified: false}
    var database = req.app.get('database'); 
    

    console.log("요청 파라미터: paramjwt: ",paramjwt, " , ", "paramnickNm: ",paramnickNm)
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
					     
        database.UserModel.findOne({nickNm: paramnickNm}, function(err, user) {
            if (err) {
                console.log('user/CheckVerified에서 사용자 조회 중 에러 발생 : ' + err.stack);
                res.end();
                return;
            } 
            if(user == null){
                console.log("user/CheckVerified에서 요청 받은 사용자를 찾을 수 없음"); 
                res.json(context);
                res.end();      
                return;
            }   
            else{     
                console.log("user/CheckVerified에서 계정 찾음") 
                context.isverified = user.isverified; 
                res.json(context);
                res.end(); 
                return;
            }
        });//UserModel.findOne 닫기 
    } else {
        console.log("user/CheckVerified에서 데이터베이스 조회 불가")
        res.end(); 
        return
        }   
};//CheckVerified 닫기

//사용자의 계정 활성화 
const Verify = function(req, res) {
    console.log('user/CheckVerify 호출됨.');

    // paramjwt: 요청한 사용자의 jwt 
    // secret: paramjwt decode 위해서 선언  
    // paramnickNm: paramjwt를 verify해서 얻은 nickNm. 요청한 사용자의 nickNm
    
    var paramjwt = req.query.jwt || req.params.jwt; 
    var secret = "HS256";
    var paramnickNm = jwt.verify(paramjwt,secret).nickNm;  
    var database = req.app.get('database'); 
     

    console.log("요청 파라미터: paramjwt: ",paramjwt, " , ", "paramnickNm: ",paramnickNm)
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
					     
        database.UserModel.findOne({nickNm: paramnickNm}, function(err, user) {
            if (err) {
                console.log('user/Verify에서 사용자 조회 중 에러 발생 : ' + err.stack);
                res.end();
                return;
            } 
            if(user == null){
                console.log("user/Verify에서 요청 받은 사용자를 찾을 수 없음"); 
                context.msg = "missing";
                res.json(context) 
                res.end();      
                return;
            }   
            else{   
                database.UserModel.findOneAndUpdate({ _id: new ObjectId(user._id)},{isverified: true}, function(err){
                    if(err){
                        console.log('user/Verify에서 업데이트 중 에러 발생 : ' + err.stack);
                        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                        res.write('<td style="width:100%; height:100%;">'); 
                        res.write('<h4 style="position:absolute;top: 20%; font-size: 300%">Sorry, we cannot find your account. Please ask us</h4></td>');     
                        res.end();
                        return;
                    }   
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<td style="width:100%; height:100%;">'); 
                    res.write('<h4 style="position:absolute;top: 20%; font-size: 40pt">Welcome! Turn your app on!</h4></td>');    
                    res.end(); 
                    return;
                });//findOneAndUpdate 닫기
            }
        });//UserModel.findOne 닫기 
    } else {
        console.log("user/Verify에서 데이터베이스 조회 불가")
        res.end(); 
        return
        }   
};//Verify 닫기 

//계정 삭제 
const DeleteAccount = function(req, res) {
    console.log('user/DeleteAccount 호출됨.');

    let paramjwt = req.body.jwt; 
    console.log("paramjwt: ",paramjwt)
    let secret = "HS256";
    let paramnickNm = jwt.verify(paramjwt,secret).nickNm;
    
    var database = req.app.get('database');
    console.log('요청 파라미터 : ' + paramnickNm);

    // 데이터베이스 객체가 초기화된 경우
    if (database.db) {
        // 1. 아이디를 이용해 사용자 검색
        database.UserModel.deleteOne({nickNm: paramnickNm}, function(err) {
            if (err) {
                console.log("user/DeleteAccuount에서 에러 발생")
                res.end();
                return;
            } 
            res.end() 
            return; 
            }) 
    }  
    else{
        console.log("user/DeleteAccount에서 데이터베이스 조회 불가"); 
        res.end();
        return;
    }
}; //DeleteAccount 닫기

////////////////////////////////////////////////DM 관련 함수 시작

var SendDM = function(req, res) {
    console.log('user 모듈 안에 있는 SendDM 호출됨.');
  
    var database = req.app.get('database'); 

    var paramReceiverName = req.body.receivername||"no name"; 
    var paramSenderId = req.body.senderid|| "000000000000000000000001"
    var paramTitle = req.body.title||"no title";
    var paramContents = req.body.contents||"no contents";

    var context = {msg: " "}

    console.log("paramSenderId: ", paramSenderId) 
    console.log("paramREceiverName: ", paramReceiverName)  
    console.log("paramTitle: ",paramTitle) 
    console.log("paramContents: ",paramContents)
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
		 	     
        database.UserModel.findOne({_id: new ObjectId(paramSenderId)}, function(err1, sender) {
            if (err1) {
                console.log("SendDM에서 송신자 조회 중 에러발생: ",err1.toString())
                context.msg = "missing" 
                res.json(context)     
                res.end();
                return;
            } 
            else{  
                
                database.db.collection("users").updateOne({nickNm: paramReceiverName}, 
                    {"$push": { 
                        DM: {   
                            sendername: sender.nickNm,
                            senderid: sender._id,
                            title: paramTitle,
                            contents: paramContents, 
                            created_at: utils.timestamp()
                        }}
                    },
                    function(err, receiver) {		
                    if (err) {
                        console.log("SendDM에서 수신자 조회 중 에러발생: ",err.toString())
                        context.msg = "missing" 
                        res.json(context)     
                        res.end();
                        return;
                    }
                    if(!receiver){
                        console.log("SendDM에서 수신자 조회 실패")
                        context.msg = "missing" 
                        res.json(context)     
                        res.end();
                        return;  
                    }
                    context.msg = "success" 
                    res.json(context) 
                    res.end() 
                    return;  
                })//receiver 조회 닫기 
            }//else 닫기
        })// sender 조회 닫기   

    } else {
        console.log('sendDM 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
        }   
};//sendDM 닫기 

var DeleteDM = function(req, res) {
    console.log('user 모듈 안에 있는 DeleteDM 호출됨.');
  
    var database = req.app.get('database'); 
 
    var paramDMId = req.body.dmid|| "000000000000000000000001"
    var paramUserId = req.body.userid || "000000000000000000000001"

    var context = {msg: " "}

    console.log("paramDMId: ", paramDMId)  
    console.log("paramUserId: ",paramUserId)
    
    // 데이터베이스 객체가 초기화된 경우 
	if (database.db) { 
        
        database.db.collection('users').updateOne({'_id': new ObjectId(paramUserId)}, 
            {$pull: { 'DM': {'_id': new ObjectId(paramDMId)}}},   
            function(err) {		
            if (err) {
                console.log("DeleteDM에서 DM 삭제 중 에러발생: ",err.toString())
                context.msg = "missing" 
                res.json(context)     
                res.end();
                return;
            }  
            context.msg = "success"   
            res.json(context) 
            res.end() 
            return;  
        })//findOne 조회 닫기   
    } else {
        console.log('DeleteDM 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
        }   
};//DeleteDM 닫기 

var ShowDMList = function(req, res) {
    console.log('user 모듈 안에 있는 ShowDMList 호출됨.');
  
    var database = req.app.get('database');  
    var paramUserId = req.body.userid || "000000000000000000000001" 
    var paramDMStartIndex = req.body.DMStartIndex||0; 
    var paramDMEndIndex = req.body.DMEndIndex||19;  
    var paramSearch = req.body.search||" "; 

    if(paramSearch !=" "){
        var query = {
            '_id': new ObjectId(paramUserId), 
            $or: 
                [   {'DM.contents': new RegExp(".*"+paramSearch+".*","gi")}, 
                    {'DM.title': new RegExp(".*"+paramSearch+".*","gi")}, 
                    {'DM.sendername': new RegExp(".*"+paramSearch+".*","gi")}
                ], 
          }; 
      } 
      else{
        var query = {'_id': new ObjectId(paramUserId)};
      } 


    var context = {msg: " ", 
        DMList: [{
            sendername: " ",
		    senderid: " ",
		    title: " ",
		    contents: " ", 
		    date: " "
        }]
    } 
 
    console.log("paramUserId: ",paramUserId)
    console.log("paramDMStartIndex: ",paramDMStartIndex)
    console.log("paramDMEndIndex: ",paramDMEndIndex) 
    console.log("paramSearch: ",paramSearch) 
    console.log("query: ",query)
    
    // 데이터베이스 객체가 초기화된 경우 
	if (database.db) { 
        
        database.db.collection('users').aggregate([
            { $match:  
                {_id: new ObjectId(paramUserId)}
            },   
            { "$unwind": '$DM'},
            // Sort in ascending order
            { $sort: {
                'DM.created_at': -1
            }}, 
            { $match: query
            },
            ]).toArray(
            function(err,cursor) {		
            if (err) {
                console.log("ShowDMList에서 DM 조회 중 에러발생: ",err.toString())
                context.msg = "missing" 
                res.json(context)     
                res.end();
                return;
            }      
            //검색과 일치하는 DM이 없을 시
            if(cursor.length == 0){
                context.msg = "success"   
                context.DMList.splice(0,1)
                res.json(context)     
                res.end();
                return;
            }
            if(paramDMStartIndex<0){
                paramDMStartIndex = 0; 
            } 
            if(paramDMEndIndex<0){
                paramDMEndIndex = 0; 
            }  
            if(paramDMStartIndex>=cursor.length){
                paramDMStartIndex = cursor.length-1; 
            } 
            if(paramDMEndIndex>=cursor.length){
                paramDMEndIndex = cursor.length-1; 
            } 
            
            for(var i = paramDMStartIndex; i<= paramDMEndIndex; i++){ 
                context.DMList.push({
                    sendername: cursor[i].DM.sendername,
		            senderid: cursor[i].DM.sendername,
		            title: cursor[i].DM.title,
		            contents: cursor[i].DM.contents, 
		            date: cursor[i].DM.created_at
                })
            }//for 닫기
            context.DMList.splice(0,1) 
            context.msg = "success" 
            console.dir(context.DMList)
            res.json(context) 
            res.end() 
            return;  
        })//find 닫기   
    } else {
        console.log('ShowDMList 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
        }   
};//ShowDMList 닫기

var ShowUserNameList = function(req, res) {
    console.log('user 모듈 안에 있는 ShowUserNameList 호출됨.');
  
    var database = req.app.get('database'); 
    var paramSearch = req.body.search||" ";
    var context = {msg: " ", usernamelist: [{username: ' '}]} 
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        
        if(paramSearch !=" "){
            var query = {  
                nickNm: new RegExp(".*"+paramSearch+".*","gi")
              }; 
          } 
          else{
            var query = {};
          }

        database.UserModel.find(query, function(err, users) {
            if (err) {
                console.log("ShowUserNameLis에서 사용자 조회 중 에러발생: ",err.toString())
                context.msg = "missing" 
                res.json(context)     
                res.end();
                return;
            }  
            else{  
                context.msg = "succeess"; 
                users.map((items)=>{
                    context.usernamelist.push({username: items.nickNm})
                }) 
                context.usernamelist.splice(0,1) 
                res.json(context) 
                res.end() 
                return 
            } 
        })//find 닫기
    } else {
        console.log('ShowUserNameList 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
        }   
};//ShowUserNameList 닫기
////////////////////////////////////////////////DM 관련 함수 끝

module.exports.checknickNm = checknickNm;
module.exports.getuserid = getuserid; 
module.exports.CheckVerified = CheckVerified; 
module.exports.Verify = Verify;
module.exports.SendDM = SendDM;
module.exports.DeleteDM = DeleteDM;  
module.exports.ShowDMList = ShowDMList;
module.exports.ShowUserNameList = ShowUserNameList; 
module.exports.ShowDMList = ShowDMList; 
module.exports.DeleteAccount = DeleteAccount;