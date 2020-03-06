/**
 * @description 사용자 혹은 관리자가 등록하는 일정 일정(eventCalender)에 관련된 라우터의 콜백 함수 정의.  
 * config/config와 route_loader를 이용하여 등록
 * @author Chang Hee
 */

require('dotenv').config();
const mongoose = require('mongoose'); 
const ObjectId = mongoose.Types.ObjectId; 
const axios = require('axios');
const utils = require('../config/utils'); 
const localDB = require('../database/database'); // 로컬로 설정한 데이터베이스를 사용하기 위함. insert시 스키마 적용 용도
const getDatabase = require('../database/database').getDatabase;

///////////전역 변수 선언 시작/////////// 
const TYPE_OFFICIAL = 'Official' //관리자가 작성할 때의 기본 타입. 바꾸기 용이하게 여기에 작성함. 
const TYPE_USER = 'User'  
///////////전역 변수 선언 끝///////////

/**
 * @description paramStartDay ~ paramStartDay+paramDays-1 에 있는 일정들을 보여 줌.
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */  
const showEventsList = async function(req, res) {
  console.log('eventcalendars/showeventslist 호출됨.');
  const database = await getDatabase();
      
  let context = {
        isadmin: false,
        EventEntries: [{
            Date: '', 
            Events: [{ 
              eventID: '',
              title : '', 
              type: [], 
              contents: '', 
              adminwrote: false, 
              ismine: false
            }]
        }]
    }   

  const paramUserId = utils.JWTVerifyId(req.body.jwt);
  const paramStartDay = req.body.startday || utils.defaultStartDay();   
  let paramDays = req.body.days || 1; // 일정가 몇 일 동안 개최될 지 모르거나 0일 경우 1일로 설정
  paramDays = paramDays <= 0 
                ? 1
                : paramDays;
  const paramType = req.body.type || [];
  const paramFilter = req.body.filter || '';
  const paramEndDay = utils.addDays(paramStartDay,paramDays-1);
  const paramISOStartDay = utils.getISODate(paramStartDay);  
  const paramISOEndDay = utils.getISODate(paramEndDay); 

  console.log('paramUserId: ',paramUserId);
  console.log('paramStartDay: ',paramStartDay);
  console.log('paramDays: ',paramDays); 
  console.log('paramType: ',paramType); 
  console.log('paramFilter: ',paramFilter);
  console.log('paramEndDay: ',paramEndDay);
  console.log('paramISOStartDay: ',paramISOStartDay);
  console.log('paramISOEndDay: ',paramISOEndDay);
  
  if (!(database instanceof Error)) {        
    const database = await getDatabase();
    let queryType = {}; 
    let queryFilter = {};
    
    if(paramType.length !==0){
      queryType = {type: {$all: paramType}} 
    }   

    if(paramFilter !==''){
      queryFilter = {$or: 
        [{contents: new RegExp('.*'+paramFilter+'.*','gi')}, 
          {title: new RegExp('.*'+paramFilter+'.*','gi')}, 
          {nickNm: new RegExp('.*'+paramFilter+'.*','gi')}
        ], 
      }; 
    }  
    database
      .collection('users')
      .findOne({_id: new ObjectId(paramUserId)}, function(err,user) { 
        if (err) {
          console.log('eventcalendars/showeventslist에서 사용자 조회 중 에러 발생: '+ err.stack); 
          res.end(); 
          return;
        }   
        if (!user) {
          console.log('eventcalendars/showeventslist에서 사용자 조회 불가');  
          res.json({msg: 'missing'});
          res.end(); 
          return;
        }
        context.isadmin = user.isAdmin;  
        database
          .collection('eventcalendars')
          .find(
          { 
            $and: [{
              $or: [
                {startDate: {$gte: paramISOStartDay, $lte: paramISOEndDay}}, 
                {endDate: {$gte: paramISOStartDay, $lte: paramISOEndDay}},
              ]//or 닫기
            }, queryFilter, queryType]
          })
          .toArray(function(err,results){ 
            if(err){
              console.log('eventcalendars/showeventslist에서 collection 조회 중 에러 발생: '+ err.stack); 
              res.end(); 
              return;
            }  
            let period = paramStartDay;
            while(period<=paramEndDay){
              context.EventEntries.push({Date: period,Events: [] })
              period = utils.addDays(period,1);
            } 
            console.log(results)
            results.forEach(function(items){ 
                let localIsmine = user._id.toString() === items.userId;
                //DB에 저장된 날짜 형식을 'YYYY-MM-DD' 로 변환
                let localStartDate = utils.getNormalDate(items.startDate); 
                let localEndDate = utils.getNormalDate(items.endDate);

                // 조회 기간을 일(day) 단위로 쪼갠다. 그 일(day) 단위에서 items의 기간이 그 일(day)에 
                // 속해 있는 지 판단 후 속한다면 context에 삽입. 
                for(let i=0; i<context.EventEntries.length; i++){                         
                  if(context.EventEntries[i].Date >= localStartDate && 
                    context.EventEntries[i].Date <= localEndDate){    
                      context.EventEntries[i].Events.push({
                          eventID: items._id, 
                          title : items.title, 
                          type: items.type, 
                          contents: items.contents,
                          adminwrote: items.adminWrote, 
                          ismine: localIsmine 
                        })//push 닫기 
                  }
                }
            })    
            context.EventEntries.splice(0,1); 
            res.json(context);
            res.end();
            return;
          })
        })//collection('users').findOne 닫기
  }//if(database) 닫기  
  else {  
    console.log('eventcalendars/showeventslist 수행 중 데이터베이스 연결 실패')
    res.end(); 
    return;
  }      
};//showEventsList 닫기   

/**
 * @description eventCalendarRequest에 일정 추가. 관리자가 아닌 사용자가 추가 시 
 * eventCalendarRequest/addEvent를 호출하여 eventcalendarrequests 컬렉션에 저장.
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const addEvent = async function(req, res) { 
  console.log('eventcalendars/addevent 호출됨.');
  const database = await getDatabase();
    
  const paramUserId = utils.JWTVerifyId(req.body.jwt);
  //utils.timestamp로 인해 .add(9, 'hours') 가 두 번 더해지는 것을 방지하고자 default를 Date.now()로 적음
  const paramStartDate = req.body.startdate || Date.now();  
  const paramEndDate = req.body.enddate || Date.now();
  const paramTitle = req.body.title || ''; 
  const paramContents = req.body.contents || '';
  const paramURL = req.body.url || '';  
  const paramType = req.body.type || [];  

  //일반 사용자가 일정을 등록할 때와 서버에서 Requests => Calendar 로 이동할 때를 구분 짓기 위함.
  const paramFromServer = req.body.fromserver||false;

  let context = {msg: ''}; // axios 요청 후 받는 값을 받기 위해 필요함

  console.log('paramUserId: ', paramUserId);
  console.log('paramStartDate: ', paramStartDate);
  console.log('paramEndDate: ', paramEndDate); 
  console.log('paramTitle: ',paramTitle);
  console.log('paramContents: ', paramContents);  
  console.log('paramURL: ', paramURL);  
  console.log('paramType: ', paramType);
  console.log('paramFromServer: ', paramFromServer);

  if (!(database instanceof Error)) {
    database
      .collection('users')
      .findOne({_id: new ObjectId(paramUserId)}, async function(err,user){
        if (err) {
          console.log('eventcalendars/addevent 안에서 사용자 조회 중 에러 발생: '+ err.stack);
          res.end(); 
          return;
        } 
        if(user === undefined) { 
          console.log('eventcalendars/addevent 안에서 사용자 조회된 사용자가 없음');
          res.json({msg: 'missing'});
          res.end(); 
          return;
        }  
        // 입력한 사용자의 유형에 따라 type[0]에 들어갈 값을 다르게 한다.
        const localType = user.isAdmin
                            ? TYPE_OFFICIAL
                            : TYPE_USER;
        paramType.push(localType);
        
        // TYPE_OFFICIAL 또는 TYPE_USER 가 없고 길이가 1 이상인 paramType의 경우, 
        // TYPE_OFFICIAL 또는 TYPE_USER를 맨 앞으로 배치 
        if(paramType.length>1){
          let tmp = paramType[0]; 
          paramType[0] = paramType[paramType.length-1]; 
          paramType[paramType.length-1] = tmp;
        }       

        //만약 관리자가 아닌 사용자가 요청하였고, 서버 내에서 요청한 경우가 아니라면 
        //Request에 원소를 추가하는 함수를 수행. 
        if(!(user.isAdmin)&&!(paramFromServer)){  
          const url = 'http://localhost:3000/eventcalendarrequests/addevent' //process.env.lambda_url + '/EventCalendarRequest/addEvent'
          await axios.post(url,{
            
            userid: paramUserId, 
            nickNm: user.nickNm, 
            isadmin: user.isAdmin,
            startdate: utils.getISODate(paramStartDate), 
            enddate: utils.getISODate(paramEndDate),
            title: paramTitle, 
            contents: paramContents,
            url: paramURL, 
            type: paramType  
          })
          .then((response) => {    
            context.msg = response.data.msg;
            res.json(context);  
            res.end();
            return;   
          })
          .catch(( err ) => {      
              console.log('eventcalendars/addevent => eventcalendarrequests/addevent 요청 중 에러 발생: ' + err.stack)  
              res.end();
              return;
          });    
          res.end(); 
          return;  
        }  
        
        const newEvent = localDB.EventCalendarModel({
          startDate: utils.getISODate(paramStartDate),
          endDate: utils.getISODate(paramEndDate), 
          title: paramTitle,    
          contents: paramContents,
          userId: new ObjectId(user._id),
          nickNm: user.nickNm,  
          adminWrote: user.isAdmin,
          url: paramURL, 
          type: paramType, 
          created_at: utils.timestamp()
        })
        database
          .collection('eventcalendars')
          .insertOne(newEvent, function(err){
            if (err) {
                console.log('eventcalendars/addevent 안에서 Event 저장 중 에러 발생: '+ err.stack)
                res.end();
                return;
            }
            console.log('Event 추가함.');   		    
            res.json({msg: 'success'}); 
            res.end(); 
            return;
          })
      })//collection('users').findOne 닫기
  } else {  
        console.log('eventcalendars/addevent 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
      } 
}; //addEvent 닫기

/**
 * @description 이미 등록된 일정의 title, contents 수정
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const editEvent = async function(req, res) {
  console.log('eventcalendars/editevent 호출됨.');
  const database = await getDatabase();  

  let paramEventId = req.body.eventid || utils.ZEROID;
  let paramTitle = req.body.title || ''; 
  let paramContents = req.body.contents || '';  
  let paramStartDate = req.body.startdate || ''; 
  let paramEndDate = req.body.enddate || ''; 
  
  console.log('paramEventId: ', paramEventId);
  console.log('paramTitle: ', paramTitle); 
  console.log('paramContents: ', paramContents);
  console.log('paramStartDate: ', paramStartDate);
  console.log('paramEndDate: ', paramEndDate);

  //파라미터로 들어온 항목들에 따라 MongoDB에서 업데이트 할 내용을 담는 객체
  let updates = {};  

  //paramStartDate 와 paramEndDate가 비어져 있는 지의 여부에 따라 $set에 들어갈 값을 달리 함.
  if(paramStartDate === '' && paramEndDate === ''){
    updates = {title: paramTitle, contents: paramContents}
  } 
  else {
      if (paramStartDate === '') {
        updates = {endDate: paramEndDate, title: paramTitle, contents: paramContents};
      } 
      else {
        if (paramEndDate === '') {
          updates = {startDate: paramStartDate,title: paramTitle, contents: paramContents};
        } 
        else {
          updates = {startDate: paramStartDate, endDate: paramEndDate, title: paramTitle, contents: paramContents}
        }
      }
  } 
  if (!(database instanceof Error)) {
    database
      .collection('eventcalendars')
      .findOneAndUpdate({_id: new ObjectId(paramEventId)}, {$set: updates}, function(err,result) {
        if (err) {
          console.log('eventcalendars/editevent 안에서 수정할 게시물 조회 중 에러 발생: '+ err.stack);
          res.end(); 
          return;
        }    
        if(result === null || result.modifiedCount===0) {
          console.log('eventcalendars/editevent 안에서 게시물을 조회 할 수 없음');  
          res.json({msg: 'empty'}); 
          res.end(); 
          return; 
        }    
        res.json({msg: 'success'});           
        res.end(); 
        return;
      }) 
  } else {  
      console.log('eventcalendars/editevent 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
  } 
}; //editEvent 닫기

/**
 * @description 요청한 일정 삭제
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const deleteEvent = async function(req, res) {
  console.log('eventcalendars/deleteevent 호출됨.');
  const database = await getDatabase();  

  const paramEventId = req.body.eventid || utils.ZEROID;

  console.log('paramEventId: ', paramEventId);

  if (!(database instanceof Error)) {         
    database
      .collection('eventcalendars')
      .findOneAndDelete({_id: new ObjectId(paramEventId)}, 
      function(err,result){
        if (err) {
          console.log('eventcalendars/deleteevent 안에서 삭제할 게시물 조회 중 에러 발생: '+ err.stack);
          res.end(); 
          return;
        }     
        if(result.value === null){
          console.log('eventcalendars/deleteevent 안에서 삭제할 게시물을 조회 할 수 없음'); 
          res.json({msg: 'empty'}); 
          res.end(); 
          return; 
        }  
        res.json({msg: 'success'});           
        res.end(); 
        return;
      })
  } else {  
      console.log('eventcalendars/deleteevent 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
  } 
}; //deleteEvent 닫기

module.exports.showEventsList = showEventsList; 
module.exports.addEvent = addEvent;
module.exports.editEvent = editEvent;
module.exports.deleteEvent = deleteEvent;