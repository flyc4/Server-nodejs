/**
 * @description 사용자(user)에 관련된 라우터들
 * (계정, 사용자 정보 조회, DM 등)의 콜백 함수 정의. 
 * config/config와 route_loader를 이용하여 등록 
 * 
 * 2020/02/29 현재 프런트 엔드, 백엔드 모두에서 GetUserId 함수를 사용하지 않아서 삭제함.  
 * GetUserId: nickNm을 이용하여 해당 사용자의 _id 값  반환
 * 
 * Verify: 사용자가 한양대 이메일을 통한 인증(한양대 이메일로 받은 링크에 접속) 시 
 * '가입을 축하합니다!' 라는 웹 페이지를 보여주는 함수. 2020/02/29 현재 미사용 
 * @author Chang Hee
 */

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const jwt = require('jsonwebtoken');  
const utils = require('../config/utils');  
const getDatabase = require('../database/database').getDatabase;

///////////////////계정과 관련된 함수 시작 /////////////////////////////////////

/**
 * @description 회원 가입. 
 *  1. config/passport/local_signup 을 호출 
 *  2. 'local-signup'이름의 strategy 실행  
 *  3. 'local-signup'의 done 메소드 호출을 통해 여기서 정의한 콜백 함수 실행 (파라미터들은 config/passport/local_signup을 통해 받아 옴.) 
 *  passport._strategies['local_signup'] 에서 'loal_signup' 부분은 변수로 할당 가능하므로 확장에도 용이
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const signUp = async function (req, res) {
    console.log('users/signup 호출 됨'); 
    const passport = req.app.get('passport');
    await passport._strategies['local-signup']._verify(req.body.nickNm, req.body.loginId, req.body.password, function (err, user, msg) {        
        
        let signupinfo = {issignup: false, accesstoken: '', msg: ''} 
        //회원 가입 완료 여부, accesstoken, 가입 실패 시 메시지  
        if (err) { 
            console.log('users/signup에서 사용자 추가 과정 중 에러 발생: ' + err.stack); 
            res.end();
            return; 
        } 
        if (user === false) { 
            signupinfo.msg = msg;    
            res.json(signupinfo); 
            res.end();
            return; 
        } 
        
        signupinfo.issignup = true;
        signupinfo.accesstoken = jwt.sign({ nickNm: user.nickNm, userId: user._id},utils.secret);
        signupinfo.msg = msg;
        
        //사용자에게 전송할 정보 가공
        res.json(signupinfo); 
        res.end();
        return;
    }) 
};

/**
 * @description 로그인. 
 *  1. config/passport/local_login 을 호출 
 *  2. 'local-login'이름의 strategy 실행  
 *  3. 'local-login'의 done 메소드 호출을 통해 여기서 정의한 콜백 함수 실행 (파라미터들은 config/passport/local_login을 통해 받아 옴.) 
 *  passport._strategies['local_login'] 에서 'loal_login' 부분은 변수로 할당 가능하므로 확장에도 용이
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const logIn =  async function (req, res) {
    console.log('users/login 호출 됨'); 
    const passport = req.app.get('passport'); 
    await passport._strategies['local-login']._verify(req.body.loginId, req.body.password, function (err, user, msg) {        

        let logininfo = {islogin: false, accesstoken: '', msg: ''} //로그인 완료 여부, accesstoken, 로그인 실패 시 메시지
    
        if (err) { 
            console.log('users/login에서 사용자 인증 과정 중 에러 발생: ' + err.stack); 
            res.end();
            return;
        }  
        //local_login 에서 done 함수의 두 번째 인자가 false인 경우 
        // 파라미터로 받은 msg: local_login에 정의 됨.
        if (user === false) {
            logininfo.msg = msg;     
            res.json(logininfo);
            res.end(); 
            return;
        }    
        
        logininfo.islogin = true;  
        logininfo.accesstoken = jwt.sign({ nickNm: user.nickNm, userId: user._id}, utils.secret); 
        console.log('jwt: ', logininfo.accesstoken);
        logininfo.msg = msg;
        res.json(logininfo);
        res.end(); 
        return;
    })
};

/**
 * @description 회원 가입 시, 사용자가 입력한 닉네임이 이미 다른 사람이 사용 중인 지의 여부를 조사한다
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const checkNickNm = async function(req, res) {
    
    console.log('users/checknicknm 호출됨.'); 
    const database = await getDatabase(); 
    const paramNickNm = req.body.nickNm || req.query.nickNm || ''; 
    let context = {permittednickNm: false}
    
    if (paramNickNm === '') {
        console.log('users/checknicknm에서 닉네임 미입력.');   
        res.json(context); 
        res.end(); 
        return;
    }
    console.log('paramNickNm: ' + paramNickNm);

    if (!(database instanceof Error)) {

        //중복된 nickNm이 있는 지 확인. 중복 된 nickNm이 없다면 context.permittednickNm = true 로 설정 후 반환
        database
            .collection('users')
            .findOne({nickNm: paramNickNm}, function(err, result) {
                if (err) {
                    console.log('users/checknicknm에서 사용자 조회 중 에러 발생 : ' + err.stack); 
                    res.end();
                    return;
                } 
                if (result) {
                    console.log('중복된 닉네임 입력'); 
                    res.json(context); 
                    res.end();      
                    return;
                }   
                else{  
                    context.permittednickNm = true;
                    res.json(context); 
                    res.end(); 
                    return; 
                }
            })  
    } else {
        console.log('users/checknicknm 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
    } 
}; //checkNickNm 닫기  
 
/**
 * @description 전달 받은 jwt를 verify 하여 사용자 계정의 활성화 상태 여부 체크(isverified === true 체크). 
 * verify 후 userId 속성 활용 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const checkVerified = async function(req, res) {
    const database = await getDatabase();
    console.log('users/checkverified 호출됨.');

    const paramJWT = req.body.jwt || utils.ZEROID; 
    const paramUserId = paramJWT !== utils.ZEROID 
                            ? jwt.verify(paramJWT, utils.secret).userId 
                            : utils.ZEROID;
    let context = {msg: '', isverified: false};

    console.log('paramJWT: ',paramJWT);
    console.log('paramUserId: ',paramUserId);

	if (!(database instanceof Error)) {					     
        database
            .collection('users')
            .findOne({_id: new ObjectId(paramUserId)}, function(err, user) {
                if (err) {
                    console.log('users/checkverified에서 사용자 조회 중 에러 발생 : ' + err.stack);
                    res.end();
                    return;
                } 
                if (!user) {
                    console.log('users/checkverified에서 요청 받은 사용자를 찾을 수 없음'); 
                    res.json(context);
                    res.end();      
                    return;
                }   
                else{     
                    console.log('users/checkverified에서 계정 찾음'); 
                    context.isverified = user.isVerified; 
                    res.json(context);
                    res.end(); 
                    return;
                }
            }); 
    } else {
        console.log('users/checkverified에서 데이터베이스 조회 불가');
        res.end(); 
        return;
    }   
};//checkVerified 닫기

/**
 * @description 전달 받은 jwt를 verify 하여 조회된 사용자 계정 삭제. verify 후 userId 속성 활용 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const deleteAccount = async function(req, res) {
    
    console.log('users/deleteaccount 호출됨.');
    const database = await getDatabase();
 
    let paramUserId = jwt.verify(req.body.jwt, utils.secret).userId;
    
    console.log('paramUserId: ', paramUserId);

    if (!(database instanceof Error)) {
        database
            .collection('users')
            .deleteOne({_id: new ObjectId(paramUserId)}, function(err, account) {
                if (err) {
                    console.log('user/DeleteAccuount에서 에러 발생');
                    res.end();
                    return;
                }  
                if(account.deletedCount === 0){
                    console.log('users/deleteaccount에서 삭제할 계정 조회 불가'); 
                    res.end(); 
                    return;
                } 
                console.log('users/deleteaccount에서 계정 삭제 완료');
                res.end(); 
                return; 
                }) 
    } else {
        console.log('users/deleteaccount에서 데이터베이스 조회 불가'); 
        res.end();
        return;
    }
}; //deleteAccount 닫기 

/**
 * @description 전달 받은 jwt를 verify 하여 조회된 사용자의 nickNm 반환. verify 후 userId 속성 활용 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const getCurrentUserName = async function(req,res) {  

    console.log('user/getcurrentusername 호출됨.');

    const paramNickNm = jwt.verify(req.body.jwt, utils.secret).nickNm;
    
    console.log('paramUserId: ' + paramNickNm); 
    res.json({name: paramNickNm});
    res.end();
    return;
}//getCurrentUserName 닫기

/**
 * @description 모든 사용자의 nickNm 속성 조회. 검색 기능 구현. 
 * 관리하거나 DM 보낼 때 수신인 조회할 때 사용할 예정 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const showUserNameList = async function(req, res) {
    console.log('users/showusernamelist 호출됨.');
    const database = await getDatabase(); 
    
    const paramSearch = req.body.search||'';
    
    console.log('paramSearch: ', paramSearch);

    let context = {msg: ' ', usernamelist: [{username: ' '}]} 
    let query = {};

	if (!(database instanceof Error)) {    
        if(paramSearch !==''){
            query = {  
                nickNm: new RegExp('.*'+paramSearch+'.*','gi')
            }; 
        } 
          
        database
            .collection('users')
            .find(query)
            .toArray(function(err, users) {
                if (err) {
                    console.log('users/showusernamelist에서 사용자 조회 중 에러발생: ' + err.stack);
                    context.msg = 'missing'; 
                    res.json(context);     
                    res.end();
                    return;
                }  
                else {  
                    context.msg = 'succeess'; 
                    users.map((items)=>{
                        context.usernamelist.push({username: items.nickNm})
                    }) 
                    context.usernamelist.splice(0,1); 
                    res.json(context); 
                    res.end(); 
                    return; 
                } 
            })//find 닫기
    } else {
        console.log('users/showusernamelist 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
    }   
};//showUserNameList 닫기

///////////////////계정과 관련된 함수 끝 ///////////////////////////////////// 

///////////////////DM과 관련된 함수 시작 //////////////////////////////////////

/**
 * @description 모든 사용자의 nickNm 속성 조회. 검색 기능 구현. 
 * DM 보낼 시 수신인 조회할 때 사용할 예정 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const showDMList = async function(req, res) {
    
    console.log('users/showdmlist 호출됨.');
    const database = await getDatabase();
      
    const paramUserId = utils.JWTVerifyId(req.body.jwt);
    let paramDMStartIndex = req.body.DMStartIndex || 0; 
    let paramDMEndIndex = req.body.DMEndIndex || 19;  
    const paramSearch = req.body.search || ''; 

    console.log('paramUserId: ',paramUserId);
    console.log('paramDMStartIndex: ',paramDMStartIndex);
    console.log('paramDMEndIndex: ',paramDMEndIndex);
    console.log('paramSearch: ',paramSearch);

    let query = {};

    if (paramSearch !=='') {
        
        query = {
            '_id': new ObjectId(paramUserId), 
            $or: 
                [   {'DM.contents': new RegExp('.*'+paramSearch+'.*','gi')}, 
                    {'DM.title': new RegExp('.*'+paramSearch+'.*','gi')}, 
                    {'DM.senderName': new RegExp('.*'+paramSearch+'.*','gi')}
                ] 
        }; 
    } 
     
    let context = {
        msg: ' ', 
        DMList: [{
            sendername: ' ',
		    senderid: ' ',
		    title: ' ',
		    contents: ' ', 
		    date: ' '
        }]
    };  

	if (!(database instanceof Error)) {     
        database
            .collection('users')
            .aggregate([
                { 
                    $match:  {_id: new ObjectId(paramUserId)}
                },   
                { '$unwind': '$DM'},
                // Sort in ascending order
                { 
                    $sort: {'DM.created_at': -1}
                }, 
                { 
                    $match: query
                },
            ])
            .toArray(function(err,cursor) {		
                if (err) {
                    console.log('users/showdmlist에서 DM 조회 중 에러발생: ' + err.stack);
                    context.msg = 'missing'; 
                    res.json(context);     
                    res.end();
                    return;
                }      
                //검색과 일치하는 DM이 없을 시
                if(cursor.length === 0){
                    context.msg = 'success';   
                    context.DMList.splice(0,1);
                    res.json(context);     
                    res.end();
                    return;
                }
                if(paramDMStartIndex<0){
                    paramDMStartIndex = 0; 
                } 
                if(paramDMEndIndex<0){
                    paramDMEndIndex = 0; 
                }   
                if(paramDMEndIndex>=cursor.length){
                    paramDMEndIndex = cursor.length-1; 
                } 
                for(let i = paramDMStartIndex; i<= paramDMEndIndex; i++){ 
                    context.DMList.push({
                        sendername: cursor[i].DM.senderName,
                        senderid: cursor[i].DM.senderName,
                        title: cursor[i].DM.title,
                        contents: cursor[i].DM.contents, 
                        date: cursor[i].DM.created_at
                    })
                }//for 닫기
                context.DMList.splice(0,1);
                context.msg = 'success';
                res.json(context); 
                res.end(); 
                return;  
            })//toArray 닫기   
    } else {
        console.log('users/showdmlist 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
    }   
};//showDMList 닫기

/**
 * @description 1명의 사용자에게 DM 보내기 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const sendDM = async function(req, res) {
    
    console.log('users/senddm 호출됨.');
    const database = await getDatabase();
    
    const paramReceiverName = req.body.receivername || 'no name'; 
    const paramSenderId = utils.JWTVerifyId(req.body.jwt);
    const paramTitle = req.body.title || 'no title';
    const paramContents = req.body.contents || 'no contents';
    
    console.log('paramSenderId: ', paramSenderId); 
    console.log('paramReceiverName: ', paramReceiverName);  
    console.log('paramTitle: ',paramTitle); 
    console.log('paramContents: ',paramContents);
   
	if (!(database instanceof Error)) { 	     
        database
            .collection('users')
            .findOne({_id: new ObjectId(paramSenderId)}, function(err1, sender) {
                if (err1) {
                    console.log('users/senddm에서 송신자 조회 중 에러발생: '+ err1.stack); 
                    res.json({msg: 'missing'});     
                    res.end();
                    return;
                }   
               
                database
                    .collection('users')
                    .updateOne({nickNm: paramReceiverName}, 
                        {
                        $push: { 
                            DM: {    
                                _id: new mongoose.Types.ObjectId(),
                                senderName: sender.nickNm,
                                senderId: sender._id,
                                title: paramTitle,
                                contents: paramContents, 
                                created_at: utils.timestamp()
                            }
                        }}, function(err, receiver) {		
                                if (err) {
                                    console.log('users/senddm에서 수신자 조회 중 에러발생: '+ err.stack);      
                                    res.end();
                                    return;
                                }
                                if(receiver.matchedCount === 0){
                                    console.log('users/senddm에서 수신자 조회 실패');
                                    res.json({msg: 'missing'});     
                                    res.end();
                                    return;  
                                } 
                                res.json({msg: 'success'}); 
                                res.end(); 
                                return;  
                            })//receiver 조회 닫기 
            })// sender 조회 닫기

    } else {
        console.log('users/senddm 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
    }   
};//sendDM 닫기 

/**
 * @description 선택한 DM 삭제 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const deleteDM = async function(req, res) {
    const database = await getDatabase();
    console.log('users/deletedm 호출됨.');
  
    const paramDMId = req.body.dmid || utils.ZEROID;
    const paramUserId = utils.JWTVerifyId(req.body.jwt);

    console.log('paramDMId: ', paramDMId);  
    console.log('paramUserId: ',paramUserId);

	if (!(database instanceof Error)) { 
        database
            .collection('users')
            .updateOne({_id: new ObjectId(paramUserId)}, {$pull: { 'DM': {_id: new ObjectId(paramDMId)}}},   
                function(err, result) {		
                    if (err) {
                        console.log('users/deletedm에서 DM 삭제 중 에러발생: ',err.stack)
                        context.msg = 'missing' 
                        res.json(context)     
                        res.end();
                        return;
                    }    
                    if(result.modifiedCount === 0){
                        console.log('users/deletedm에서 삭제 할 DM을 찾지 못함');
                        res.json({msg: 'empty'}); 
                        res.end(); 
                        return; 
                    }
                    res.json({msg: 'success'}); 
                    res.end(); 
                    return;  
            })  

    } else {
        console.log('users/deletedm 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
    }   
};//deleteDM 닫기 

///////////////////DM과 관련된 함수 끝 ////////////////////////////////////// 

module.exports.signUp = signUp;
module.exports.logIn = logIn;
module.exports.checkNickNm = checkNickNm; 
module.exports.checkVerified = checkVerified; 
module.exports.deleteAccount = deleteAccount;
module.exports.getCurrentUserName = getCurrentUserName;  
module.exports.showUserNameList = showUserNameList; 
module.exports.showDMList = showDMList;
module.exports.sendDM = sendDM;
module.exports.deleteDM = deleteDM;  
 
/*사용자의 계정 활성화. 현재 미 사용. 로컬 테스트 완료 했으나 lambda에서 사용 불가. 
const Verify = async function(req, res) {
    const database = await getDatabase();
    console.log('user/Verify 호출됨.');

    // paramJWT: 요청한 사용자의 jwt 
    // secret: paramJWT decode 위해서 선언  
    // paramUserId: paramJWT를 verify해서 얻은 nickNm. 요청한 사용자의 nickNm
    
    let paramJWT = req.query.jwt || req.params.jwt; 
    let paramUserId = jwt.verify(paramJWT,utils.secret).nickNm;   
     
    console.log('paramJWT: ',paramJWT);
    console.log('paramUserId: ',paramUserId);
    
    // 데이터베이스 객체가 초기화된 경우
	if (!(database instanceof Error)) {
					     
        database.collection('users').findOneAndUpdate({nickNm: paramUserId}, {$set: {isverified: true}}, function(err, user) {
            if (err) {
                console.log('user/Verify에서 사용자 조회 중 에러 발생 : ' + err.stack);
                res.end();
                return;
            } 
            if(!user){
                console.log('user/Verify에서 요청 받은 사용자를 찾을 수 없음'); 
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<td style='width:100%; height:100%;'>'); 
                res.write('<h4 style='position:absolute;top: 20%; font-size: 300%'>Sorry, we cannot find your account. Please ask us</h4></td>');     
                res.end();
                return; 
            }   
            else{   
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<td style='width:100%; height:100%;'>'); 
                res.write('<h4 style='position:absolute;top: 20%; font-size: 40pt'>Welcome! Turn your app on!</h4></td>');    
                res.end(); 
                return;
            } 
        });//UserModel.findOne 닫기 
    } else {
        console.log('user/Verify에서 데이터베이스 조회 불가')
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<td style='width:100%; height:100%;'>'); 
        res.write('<h4 style='position:absolute;top: 20%; font-size: 300%'>Sorry, we cannot find your account. Please ask us</h4></td>');     
        res.end();
        return;
    }   
};//Verify 닫기 
*/