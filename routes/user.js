let Entities = require('html-entities').AllHtmlEntities;
let mongoose = require('mongoose');
let expressSession = require('express-session');
let jwt = require('jsonwebtoken'); 
let ObjectId = mongoose.Types.ObjectId;  
let utils = require('../config/utils'); 
const MongoClient = require("mongodb").MongoClient; 

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

const CheckNickNm = async function(req, res) {
    console.log('user/CheckNickNm 호출됨.'); 
    await connection(); 
    let paramnickNm = req.body.nickNm || req.query.nickNm; 
    let permittednickNm = {permittednickNm: false}
    
    if (paramnickNm == undefined) {
        console.log('user/CheckNickNm에서 닉네임 미입력.');   
        res.json(permittednickNm); 
        res.end(); 
        return;
    }
    console.log('paramnickNm: ' + paramnickNm);

    // 데이터베이스 객체가 초기화된 경우
    if(database) {

        // 1. 닉네임 이용해 사용자 검색
        database.collection("users").findOne({nickNm: paramnickNm}, function(err, result) {
            if (err) {
                console.log('user/CheckNickNm에서 사용자 조회 중 에러 발생 : ' + err.stack); 
                res.end();
                return;
            } 
            if(result){
                console.log("중복된 닉네임 입력"); 
                res.json(permittednickNm); 
                res.end();      
                return;
            }   
            else{  
                permittednickNm.permittednickNm = true
                res.json(permittednickNm); 
                res.end(); 
                return; 
            }
        })  
    } 
    else{
        console.log("user/CheckNickNm 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    } 
}; //CheckNickNm 닫기

const GetUserId = async function(req, res) {
    console.log('user/GetUserId 호출됨.');
    await connection();
    // paramjwt: 요청한 사용자의 jwt 
    // secret: paramjwt decode 위해서 선언  
    // paramnickNm: paramjwt를 verify해서 얻은 nickNm. 요청한 사용자의 nickNm
    
    let paramjwt = req.body.jwt || req.query.jwt || req.params.jwt; 
    let paramnickNm = jwt.verify(paramjwt,utils.secret).nickNm;     
    
    console.log("paramjwt: ",paramjwt)
    console.log("paramnickNm: ", paramnickNm)
    
    // 데이터베이스 객체가 초기화된 경우
	if (database) {
					     
        database.collection("users").findOne( {nickNm: paramnickNm}, function(err, user) {
            if (err) {
                console.log('user/GetUserId에서 사용자 조회 중 에러 발생 : ' + err.stack); 
                res.end();
                return;
            } 
            if(!user){
                console.log("user/GetUserId에서 nickNm을 조회할 수 없음"); 
                res.end();      
                return;
            }   
            else{  
                let context = {
                    userid: user._id
                }; 
                res.json(context); 
                res.end();
                return;     
            }
        })//findOne 닫기 
    } else {
        console.log("user/GetUserId 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
        }   
};//GetUserId 닫기

//사용자 계정의 활성화 상태 여부 체크
const CheckVerified = async function(req, res) {
    await connection();
    console.log('user/CheckVerified 호출됨.');

    // paramjwt: 요청한 사용자의 jwt 
    // secret: paramjwt decode 위해서 선언  
    // paramnickNm: paramjwt를 verify해서 얻은 nickNm. 요청한 사용자의 nickNm
    
    let paramjwt = req.body.jwt || req.query.jwt || req.params.jwt; 
    let paramnickNm = jwt.verify(paramjwt, utils.secret).nickNm;  
    let context = {msg: " ", isverified: false}

    console.log("paramjwt: ",paramjwt);
    console.log("paramnickNm: ",paramnickNm)
    
    // 데이터베이스 객체가 초기화된 경우
	if (database) {					     
        database.collection("users").findOne({nickNm: paramnickNm}, function(err, user) {
            if (err) {
                console.log('user/CheckVerified에서 사용자 조회 중 에러 발생 : ' + err.stack);
                res.end();
                return;
            } 
            if(!user){
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
        return;
        }   
};//CheckVerified 닫기

//사용자의 계정 활성화 
const Verify = async function(req, res) {
    await connection();
    console.log('user/Verify 호출됨.');

    // paramjwt: 요청한 사용자의 jwt 
    // secret: paramjwt decode 위해서 선언  
    // paramnickNm: paramjwt를 verify해서 얻은 nickNm. 요청한 사용자의 nickNm
    
    let paramjwt = req.query.jwt || req.params.jwt; 
    let paramnickNm = jwt.verify(paramjwt,utils.secret).nickNm;   
     
    console.log("paramjwt: ",paramjwt);
    console.log("paramnickNm: ",paramnickNm);
    
    // 데이터베이스 객체가 초기화된 경우
	if (database) {
					     
        database.collection("users").findOneAndUpdate({nickNm: paramnickNm}, {$set: {isverified: true}}, function(err, user) {
            if (err) {
                console.log('user/Verify에서 사용자 조회 중 에러 발생 : ' + err.stack);
                res.end();
                return;
            } 
            if(!user){
                console.log("user/Verify에서 요청 받은 사용자를 찾을 수 없음"); 
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<td style="width:100%; height:100%;">'); 
                res.write('<h4 style="position:absolute;top: 20%; font-size: 300%">Sorry, we cannot find your account. Please ask us</h4></td>');     
                res.end();
                return; 
            }   
            else{   
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<td style="width:100%; height:100%;">'); 
                res.write('<h4 style="position:absolute;top: 20%; font-size: 40pt">Welcome! Turn your app on!</h4></td>');    
                res.end(); 
                return;
            } 
        });//UserModel.findOne 닫기 
    } else {
        console.log("user/Verify에서 데이터베이스 조회 불가")
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<td style="width:100%; height:100%;">'); 
        res.write('<h4 style="position:absolute;top: 20%; font-size: 300%">Sorry, we cannot find your account. Please ask us</h4></td>');     
        res.end();
        return;
    }   
};//Verify 닫기 

//계정 삭제 
const DeleteAccount = async function(req, res) {
    await connection();
    console.log('user/DeleteAccount 호출됨.');

    let paramjwt = req.body.jwt; 
    let paramnickNm = jwt.verify(paramjwt, utils.secret).nickNm;
    
    console.log("paramjwt: ",paramjwt)
    console.log('paramnickNm: ' + paramnickNm);

    // 데이터베이스 객체가 초기화된 경우
    if (database) {
        // 1. 아이디를 이용해 사용자 검색
        database.collection("users").deleteOne({nickNm: paramnickNm}, function(err) {
            if (err) {
                console.log("user/DeleteAccuount에서 에러 발생")
                res.end();
                return;
            } 
            res.end(); 
            return; 
            }) 
    }  
    else{
        console.log("user/DeleteAccount에서 데이터베이스 조회 불가"); 
        res.end();
        return;
    }
}; //DeleteAccount 닫기 

const GetCurrentUserName = async function(req,res){ 
    await connection();
    console.log('user/GetCurrentUserName 호출됨.');
    
    let paramnickNm = jwt.verify(req.body.jwt, utils.secret).nickNm;
    console.log('paramnickNm: ' + paramnickNm); 
    res.json({name: paramnickNm})
    res.end()
    return;
}//GetCurrentUserName 닫기

////////////////////////////////////////////////DM 관련 함수 시작

let SendDM = async function(req, res) {
    await connection();
    console.log('user 모듈 안에 있는 SendDM 호출됨.');

    let paramReceiverName = req.body.receivername||"no name"; 
    let paramSenderId = req.body.senderid|| "000000000000000000000001"
    let paramTitle = req.body.title||"no title";
    let paramContents = req.body.contents||"no contents";

    let context = {msg: " "}

    console.log("paramSenderId: ", paramSenderId) 
    console.log("paramREceiverName: ", paramReceiverName)  
    console.log("paramTitle: ",paramTitle) 
    console.log("paramContents: ",paramContents)
    
    // 데이터베이스 객체가 초기화된 경우
	if (database) {
		 	     
        database.collection("users").findOne({_id: new ObjectId(paramSenderId)}, function(err1, sender) {
            if (err1) {
                console.log("SendDM에서 송신자 조회 중 에러발생: ",err1.toString())
                context.msg = "missing" 
                res.json(context)     
                res.end();
                return;
            } 
            else{  
                
                database.collection("users").updateOne({nickNm: paramReceiverName}, 
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

let DeleteDM = async function(req, res) {
    await connection();
    console.log('user 모듈 안에 있는 DeleteDM 호출됨.');
  
    let paramDMId = req.body.dmid|| "000000000000000000000001"
    let paramUserId = req.body.userid || "000000000000000000000001"

    let context = {msg: " "}

    console.log("paramDMId: ", paramDMId)  
    console.log("paramUserId: ",paramUserId)
    
    // 데이터베이스 객체가 초기화된 경우 
	if (database) { 
        
        database.collection('users').updateOne({'_id': new ObjectId(paramUserId)}, 
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

let ShowDMList = async function(req, res) {
    
    console.log('user 모듈 안에 있는 ShowDMList 호출됨.');
    await connection();
      
    let paramUserId = req.body.userid || "000000000000000000000001" 
    let paramDMStartIndex = req.body.DMStartIndex||0; 
    let paramDMEndIndex = req.body.DMEndIndex||19;  
    let paramSearch = req.body.search||" "; 

    if(paramSearch !=" "){
        let query = {
            '_id': new ObjectId(paramUserId), 
            $or: 
                [   {'DM.contents': new RegExp(".*"+paramSearch+".*","gi")}, 
                    {'DM.title': new RegExp(".*"+paramSearch+".*","gi")}, 
                    {'DM.sendername': new RegExp(".*"+paramSearch+".*","gi")}
                ], 
          }; 
      } 
      else{
        let query = {'_id': new ObjectId(paramUserId)};
      } 


    let context = {msg: " ", 
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
	if (database) { 
        
        database.collection('users').aggregate([
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
            
            for(let i = paramDMStartIndex; i<= paramDMEndIndex; i++){ 
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

let ShowUserNameList = async function(req, res) {
    console.log('user 모듈 안에 있는 ShowUserNameList 호출됨.');
    await connection();
     
    let paramSearch = req.body.search||" ";
    let context = {msg: " ", usernamelist: [{username: ' '}]} 
    
    // 데이터베이스 객체가 초기화된 경우
	if (database) {
        
        if(paramSearch !=" "){
            let query = {  
                nickNm: new RegExp(".*"+paramSearch+".*","gi")
              }; 
          } 
          else{
            let query = {};
          }

        database.collection("users").find(query, function(err, users) {
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

module.exports.CheckNickNm = CheckNickNm;
module.exports.GetUserId = GetUserId; 
module.exports.CheckVerified = CheckVerified; 
module.exports.Verify = Verify;
module.exports.SendDM = SendDM;
module.exports.DeleteDM = DeleteDM;  
module.exports.ShowDMList = ShowDMList;
module.exports.ShowUserNameList = ShowUserNameList; 
module.exports.ShowDMList = ShowDMList; 
module.exports.DeleteAccount = DeleteAccount; 
module.exports.GetCurrentUserName = GetCurrentUserName; 