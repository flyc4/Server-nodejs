/**
 * @description 사용자의 등록 후, 관리자의 승인을 받지 않은 일정 일정(eventCalenderRequests)에 
 * 관련된 라우터의 콜백 함수 정의. eventCalendar 와는 달리 contents 부재. title만 존재. 
 * config/config와 route_loader를 이용하여 등록
 * @author Chang Hee
 */
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;  
require('dotenv').config();
const axios = require('axios');  
const schedule = require('node-schedule');
const moment = require('moment');   
const utils = require('../config/utils'); 
const localDB = require('../database/database'); // 로컬로 설정한 데이터베이스를 사용하기 위함. insert시 스키마 적용 용도
const getDatabase = require('../database/database').getDatabase;

///////////주기적으로 실행하는 함수 시작/////////// 
const _checkAndMoveRequests = async function(){ 
 
  let url = process.env.lambda_url + '/eventcalendarrequests/checkandmoverequests'; 
      await axios.post(url)
          .then((response) => {    
          })
          .catch(( err ) => {       
              console.log('eventcalendarrequests/checkandmoverequests axios 요청 중 에러 발생: ' + err.stack)  
              return;
          });    
} 

//매일 오후 9시 마다 크롤링
let updaterequests = schedule.scheduleJob({hour: 21, minute: 0}, async function(){
  await _checkAndMoveRequests(); 
 })  

///////////주기적으로 실행하는 함수 끝///////////


///////////함수들 및 전역 변수 시작/////////// 
const REQUEIRED_REQUESTS = 2;  // eventcalendar 로 이동하기 위해 필요한 요구 수 
const DISPLAY_DATES = 2; // eventcalendar로 이동할 때 보여 지는 날짜의 수  
const TYPE_USER = 'User'
///////////함수들  및 전역 변수 끝///////////

/**
 * @description 사용자가 등록한 일정들을 보여 줌. 기본: 0 ~ 19번째. 
 * 관리자가 아닐 경우 본인이 작성한 목록만, 관리자일 경우 모든 목록 조회 가능 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */  
const showEventsList = async function(req, res) {
  console.log('eventcalendarrequests/showeventslist 호출됨.');
  const database = await getDatabase();
      
  let context = { 
        Events: [{ 
          eventID: '', 
          startdate: '', 
          enddate: '', 
          title : '', 
          userid: '', 
          nickNm: '',
          type: [], 
          url: ''
        }]
      }; 

  const paramUserId = utils.JWTVerifyId(req.body.jwt) || utils.ZEROID;
  const paramStartDay = req.body.startday || utils.defaultStartDay(); 
  const paramDays = req.body.days || '1';
  const paramStartIndex = req.body.startindex || 0;
  const paramEndIndex = req.body.endindex || 19;  
  const paramType = req.body.type || [];
  const paramFilter = req.body.filter || '';
  const paramEndDay = utils.addDays(paramStartDay,paramDays);
  const paramISOStartDay = utils.getISODate(paramStartDay);  
  const paramISOEndDay = utils.getISODate(paramEndDay); 
  
  console.log('paramUserId: ',paramUserId);
  console.log('paramStartDay: ',paramStartDay);
  console.log('paramDays: ',paramDays); 
  console.log('paramStartIndex: ',paramStartIndex);
  console.log('paramEndIndex: ',paramEndIndex);
  console.log('paramType: ',paramType); 
  console.log('paramFilter: ',paramFilter);
  console.log('paramEndDay: ',paramEndDay); 
  console.log('paramISOStartDay: ',paramISOStartDay);
  console.log('paramISOEndDay: ',paramISOEndDay);
  
  if (!(database instanceof Error)) {       
    let queryType = {}; 
    let queryFilter = {};
    let queryIsadmin = {};

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
      .findOne({_id: new ObjectId(paramUserId)}, function(err,user){
        if (err) {
          console.log('eventcalendarrequests/showeventslist에서 사용자 조회 중 에러 발생: ' + err.stack); 
          res.end(); 
          return;
        } 
        if (!user) {
          console.log('eventcalendarrequests/showeventslist에서 사용자 조회 불가');  
          res.json({msg: 'missing'}); 
          res.end();
          return;
        }
        //요청한 사용자의 isadmin에 따라 queryIsadmin이 달라짐. 
        //user: 본인이 작성한 것만 조회, admin: 조건에 맞는 모든 것들 조회  
        if(!(user.isAdmin)){
          queryIsadmin = {userId: new ObjectId(paramUserId)}
        }
        database
          .collection('eventcalendarrequests')
          .find({ 
            startDate: {$gte: paramISOStartDay, $lte: paramISOEndDay}, 
            $and: [queryFilter, queryType,queryIsadmin]  
          }) 
          .toArray(function(err,results){ 
                if (err) {
                  console.log('eventcalendarrequests/showeventslist에서 collection 조회 중 에러 발생: '+ err.stack)
                  res.end(); 
                  return;
                }  

                if (paramStartIndex<0) {
                  paramStartIndex = 0
                }

                if (paramEndIndex<0) { 
                  paramEndIndex = 0
                }  
                console.log(results)
                for(let i=paramStartIndex;i<=paramEndIndex;i++){  
                  if(i>=results.length){
                    break;
                  } 

                  context.Events.push({
                    eventID: results[i]._id, 
                    startdate: moment(results[i].startDate).format('YYYY-MM-DD'),
                    enddate: moment(results[i].endDate).format('YYYY-MM-DD'), 
                    title : results[i].title, 
                    userid: user._id, 
                    nickNm: user.nickNm, 
                    type: results[i].type, 
                    url: results[i].url
                  })
                }
              context.Events.splice(0,1); 
              res.json(context);
              res.end();
              return;
            }); //EventCalendarRequestModel.find닫기
      })//collection('users').findOne 닫기 
  }//if(database) 닫기  
  else {  
    console.log('eventcalendarrequests/showeventslist 수행 중 데이터베이스 연결 실패')
    res.end(); 
    return;
  }      
};//showEventsList 닫기   

/**
 * @description eventrequestcalendaars에 일정 추가. 항상 eventCalendar/addEvent에 의해서만 호출된다고 가정
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */  
const addEvent = async function(req, res) {
  console.log('eventcalendarrequests/addevent 호출됨.');
  const database = await getDatabase();  

  const paramUserId = req.body.userid || utils.JWTVerifyId(req.body.jwt);
  const paramNickNm = req.body.nickNm || ''; //항상 EventCalendar/addEvent에서 넘어온 것으로 가정이 깨질 시 문제가 되는 부분
  const paramIsadmin = req.body.isadmin || false;
  const paramStartDate = req.body.startdate || utils.defaultStartDay(); //항상 EventCalendar/addEvent에서 넘어온 것으로 가정이 깨질 시 문제가 되는 부분 
  const paramEndDate = req.body.enddate || utils.defaultStartDay();
  const paramTitle = req.body.title || ''; 
  const paramURL = req.body.url || '';  
  const paramType = req.body.type || []; 

  console.log('paramUserId: ', paramUserId);
  console.log('paramNickNm: ', paramNickNm); 
  console.log('paramIsadmin: ', paramIsadmin);
  console.log('paramStartDate: ', paramStartDate);
  console.log('paramEndDate: ', paramEndDate); 
  console.log('paramTitle: ',paramTitle); 
  console.log('paramURL: ', paramURL); 
  console.log('paramType: ', paramType);

  if (!(database instanceof Error)) {
    database
      .collection('eventcalendarrequests')
      .findOne({
        $and: [{
          userId: new ObjectId(paramUserId)}, 
          {title: paramTitle}
        ]}, function(err,result){ 
          if(err){
            console.log('eventcalendarrequests/addevent에서 중복 요청 Event 조회 중 에러 발생: ' + err.stack);
            res.end(); 
            return;
          }  
          //해당 사용자가 이미 동일한 제목으로 요청을 했을 경우 
          if(result!== null){
            console.log('eventcalendarrequests/addevent에서 사용자의 동일한 제목의 요청을 이미 했음');
            res.json({msg: 'duplicate'}); 
            res.end();
            return;
          }  
          paramType.push(TYPE_USER);
          //TYPE_OFFICIAL 또는 TYPE_USER 가 없고 길이가 1 이상인 paramType의 경우, TYPE_OFFICIAL 또는 TYPE_USER를 맨 앞으로 배치 
          if(paramType.length>1){
            let tmp = paramType[0]; 
            paramType[0] = paramType[paramType.length-1]; 
            paramType[paramType.length-1] = tmp;
          } 
          const newEvent = localDB.EventCalendarRequestModel({
            startDate: utils.getISODate(paramStartDate),
            endDate: utils.getISODate(paramEndDate), 
            title: paramTitle,     
            userId: new ObjectId(paramUserId),
            nickNm: paramNickNm,   
            url: paramURL, 
            type: paramType, 
            created_at: utils.timestamp()
          })
          database
            .collection('eventcalendarrequests')
            .insertOne(newEvent, function(err) {
              if (err) {
                console.log('eventcalendarrequests/addevent 안에서 일정 저장 중 에러 발생: '+ err.stack);
                res.end();
                return;
              }
              console.log('일정 추가함.');   		  
              res.json({msg: 'success'}); 
              res.end(); 
              return;
            }) 
      })//EventCalendarRequestModel.findOne닫기
  } else {  
      console.log('eventcalendarrequests/addevent 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
  } 
}; //addEvent 닫기

/**
 * @description 이미 등록된 일정의 title 수정
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const editEvent = async function(req, res) {
  
  console.log('eventcalendarrequests/editevent 호출됨.');   
  const database = await getDatabase();

  let paramEventId = req.body.eventid || utils.ZEROID;
  let paramTitle = req.body.title || ''; 
  
  console.log('paramEventId: ', paramEventId);
  console.log('paramTitle: ', paramTitle); 
  
  if (!(database instanceof Error)) {  
    database
      .collection('eventcalendarrequests')
      .findOneAndUpdate({_id: new ObjectId(paramEventId)},{$set: {title: paramTitle}}, function(err,result){
        if (err) {
          console.log('eventcalendarrequests/editevent 안에서 수정할 게시물 조회 중 에러 발생: '+ err.stack);
          res.end(); 
          return;
        }    
        if(result.value === null){
          console.log('eventcalendarrequests/editevent 안에서 게시물을 조회 할 수 없음');  
          res.json({msg: 'empty'}); 
          res.end(); 
          return; 
        }    
        res.json({msg: 'success'});           
        res.end(); 
        return;
      }) 
  } else {  
      console.log('eventcalendarrequests/editevent 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
  } 
}; //editEvent 닫기

/**
 * @description 요청한 일정 삭제. 작성자 혹은 관리자만 가능
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const deleteEvent = async function(req, res) {
  console.log('eventcalendarrequests/deleteevent 호출됨.');
  const database = await getDatabase();  
  
  let paramEventId = req.body.eventid || utils.ZEROID;

  console.log('paramEventId: ', paramEventId);

  if (!(database instanceof Error)) {        
      database
        .collection('eventcalendarrequests')
        .findOneAndDelete({_id: new ObjectId(paramEventId)}, function(err,result){
          if (err) {
            console.log('eventcalendarrequests/deleteevent 안에서 삭제할 게시물 조회 중 에러 발생: '+ err.stack);
            res.end(); 
            return;
          }     
          if(result.value === null){
            console.log('eventcalendarrequests/deleteevent 안에서 삭제할 일정을 조회 할 수 없음');  
            res.json({msg: 'empty'}); 
            res.end(); 
            return; 
          }  
          res.json({msg: 'success'});           
          res.end(); 
          return;
      })
  } else {  
      console.log('eventcalendarrequests/deleteevent 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    } 
}; //deleteEvent 닫기 

/**
 * @description 동일한 title을 가진 request들이 REQUEIRED_REQUESTS 보다 많이 저장될 경우 
 * 해당 request를 eventcalendarrequests에서 전부 삭제 후 eventcalendars로 옮긴다. 
 * 작성자 정보: 가장 처음에 request를 작성한 사람 
 * 날짜 정보: 모든 request 들 중에서 가장 많은 startDate와 endDate
 * 이전 시 contents: localContents에 저장된 방식
 *  
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const checkAndMoveRequests = async function(req,res){ 
  console.log('eventcalendarrequests/checkandmoverequests 호출됨.');
  const database = await getDatabase();  

  if (!(database instanceof Error)) {   
    database
      .collection('eventcalendarrequests')
      .aggregate([
        {
          $group:
            { //_id: 그룹화 할 field를 설정.
              //count: 그룹 당 포함된 원소의 갯수
               _id : {title: '$title'}, 
              count: { $sum: 1}
            } 
        }, 
        {
          $match:
            {
              count: {$gte: REQUEIRED_REQUESTS}
            }
        }
      ], function(err,titles){
          if(err){
            console.log('eventcalendarrequests/checkandmoverequests에서 title 그룹화 중 에러 발생: ' + err.stack); 
            res.end(); 
            return;
          } 
          titles.forEach( function(items) {  
            //옮겨야 하는 title 들을 날짜 별로 나누어서 날짜의 최빈값과 2번째로 많이 나오는 date 값을 추출
            database
              .collection('eventcalendarrequests')
              .aggregate([
                {
                  $match:
                    {
                      title: items._id.title
                    }
                }, 
                {
                  $group:
                    {
                      _id : {startDate: '$startDate'}, 
                      count: { $sum: 1}
                    }  
                }, 
                {
                  $sort: 
                    {
                      count: -1
                    }
                }
              ])
              .toArray( function(err,dates){
                  if (err) {
                    console.log('eventcalendarrequests/checkandmoverequests에서 date 그룹화 중 에러 발생: ' + err.stack); 
                    res.end(); 
                    return;
                  }  
                  database
                    .collection('eventcalendarrequests')
                    .find({title: items._id.title}) 
                    .sort({created_at: 1})
                    .toArray( function(err,results) {
                      if (err) {
                        console.log('eventcalendarrequests/checkandmoverequests에서 일정 조회 중 에러 발생: ' + err.stack); 
                        res.end(); 
                        return;
                      }  
                      //user에 대한 정보를 찾기 위함: 현재: 요청을 가장 처음 보냈던 사람
                      database
                        .collection('users')
                        .findOne({_id: results[0].userId}, function (err,user){
                          if (err) {
                            console.log('eventcalendarrequests/checkandmoverequests에서 사용자 조회 중 에러 발생: ' + err.stack); 
                            res.end(); 
                            return;
                          }    
                          let localContents = utils.dateToContents(moment(dates[0]._id.startDate).format('YYYY-MM-DD')) + 
                                              ' ~ ' + utils.dateToContents(moment(dates[0]._id.endDate).format('YYYY-MM-DD'));
                          
                          //dates.length < DISPLAY_DATES 일 때를 고려하여 loopCount 추가
                          const loopCount = dates.length < DISPLAY_DATES 
                                              ? dates.length 
                                              : DISPLAY_DATES;
                          
                          for(let i=1; i<loopCount; i++){  
                            localContents = localContents + '\n' + utils.dateToContents(moment(dates[i]._id.startDate).format('YYYY-MM-DD')) 
                                            + ' ~ ' + utils.dateToContents(moment(dates[0]._id.endDate).format('YYYY-MM-DD'));   
                          }  
                          //Request => EventCalendar로 저장
                          const newEvent = localDB.EventCalendarModel({
                            startDate: dates[0]._id.startDate, 
                            endDate: results[0].endDate, 
                            title: results[0].title,
                            contents: localContents,     
                            userId: new ObjectId(user._id),
                            nickNm: user.nickNm,  
                            adminWrote: user.isadmin, 
                            url: results[0].url, 
                            type: results[0].type, 
                            created_at: utils.timestamp()
                          })
                          database
                            .collection('eventcalendars')
                            .insertOne(newEvent, function(err) {
                              if (err) {
                                  console.log('eventcalendarrequests/checkandmoverequests 안에서 일정을 eventcalendars에 저장 중 에러 발생: '+ err.stack);
                                  res.end();
                                  return;
                              } 
                            }); 
                          console.log('EventCalendar에 추가 완료.');   		    
                          //eventcalendarrequests에서 해당 일정 전부 삭제
                          database
                            .collection('eventcalendarrequests')
                            .deleteMany({title: items._id.title}, function (err) {
                              if (err) {
                                console.log('eventcalendarrequests/checkandmoverequests에서 저장 완료한 Request 제거 중 에러 발생: '+ err.stack)
                                res.end();
                                return;
                              }  
                              console.log('EventRequest에서 삭제 완료.');
                              res.json({msg: 'success'});
                              res.end(); 
                              return;
                            })  
                        })//collection('users').findOne닫기
                    })//collection('eventcalendarrequests').find 닫기 
              })//aggregate - date 닫기 
          })//titles.forEach닫기 
          res.json({msg: 'success'});           
          res.end(); 
          return;
        })//aggregate - title 닫기 
  } else {  
    console.log('eventcalendarrequests/checkandmoverequests 수행 중 데이터베이스 연결 실패');
    res.end(); 
    return;
  } 
}; //checkAndMoveRequests 닫기   

/**
 * @description 요청 받은 id에 해당하는 일정을 eventcalendarrequests => eventcalendar로 이동.
 * checkAndMoveRequests에 해당하지 않거나 에러를 방지하고자 만듦. 프런트엔드에서는 구현X. contents: 없음
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const moveToEventCalendar = async function(req,res){
  console.log('eventcalendarrequests/movetoeventcalendar 호출됨.');
  const database = await getDatabase();  
  
  const paramEventId = req.body.eventid || utils.ZEROID; 

  console.log('paramEventId: ', paramEventId); 

  if (!(database instanceof Error)) {
    database
      .collection('eventcalendarrequests')
      .findOne({_id: new ObjectId(paramEventId)}, function(err,event){
        if(err){
          console.log('eventcalendarrequests/movetoeventcalendar에서 일정 조회 중 에러 발생: '+ err.stack);
          res.end();
          return;  
        } 
        if(event === null){
          console.log('eventcalendarrequests/movetoeventcalendar에서 Event 조회 불가'); 
          res.json({msg: 'missing'}); 
          res.end(); 
          return;
        } 
        const newEvent = localDB.EventCalendarModel({
          startDate: event.startdate, 
          endDate: event.enddate, 
          title: event.title,
          contents: ' ',      
          userId: new ObjectId(event.userid),
          nickNm: event.nickNm,  
          //adminwrote: request에 있는 것들은 무조건 관리자가 아니라고 판단
          adminWrote: false, 
          url: event.url, 
          type: event.type, 
          created_at: event.created_at
        })
        database
          .collection('eventcalendars')
          .insertOne(newEvent, function(err) {
            if (err) {
                console.log('eventcalendarrequests/movetoeventcalendar 안에서 일정을 eventcalendars에 저장 중 에러 발생: '+ err.stack);
                res.end();
                return;
            } 
          });   
        console.log('EventCalendar에 삽입 완료');
        database
          .collection('eventcalendarrequests')
          .deleteOne({_id: new ObjectId(paramEventId)}, function (err) {
            if (err) {
              console.log('eventcalendarrequests/movetoeventcalendar에서 Request 제거 중 에러 발생: '+ err.stack);
              res.end();
              return;
            }  
            console.log('EventRequest에서 삭제 완료.');
            res.json({msg: 'success'});
            res.end(); 
            return;
          })  
      })//EventCalendarRequestModel.findOne닫기
  } else {  
    console.log('eventcalendarrequests/movetoeventcalendar 수행 중 데이터베이스 연결 실패');
    res.end(); 
    return;
  } 
};//moveToEventCalendar닫기

module.exports.showEventsList = showEventsList; 
module.exports.addEvent = addEvent;
module.exports.editEvent = editEvent;
module.exports.deleteEvent = deleteEvent; 
module.exports.checkAndMoveRequests = checkAndMoveRequests; 
module.exports.moveToEventCalendar = moveToEventCalendar;