const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const ObjectId = mongoose.Types.ObjectId;  
const utils = require('../config/utils'); 
require('dotenv').config()
const axios = require("axios");  
const moment = require('moment'); 
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
///////////함수들 및 전역 변수 시작/////////// 

const type_official = "Official" //관리자가 작성할 때의 기본 타입. 바꾸기 용이하게 여기에 작성함. 
const type_user = "User"  
///////////함수들  및 전역 변수 끝///////////

// paramStartDay ~ paramStartDay+paramDays-1 에 있는 이벤트들을 보여 줌. 
const ShowEventsList = async function(req, res) {
  await connection()
  console.log('EventCalendar 모듈 안에 있는 ShowEventsList 호출됨.');
      
  let context = {isadmin: false,
      EventEntries: [{Date: ' ', Events: [{ eventID: '',title : ' ', type: [], contents: ' ', 
                                            adminwrote: false, ismine: false}]}]}   

  const paramUserId = req.body.userid;
  const paramStartDay = req.body.startday||utils.defaultstartday;  
  let paramDays = req.body.days||"1" 
  paramDays = paramDays == 0 ? 1:paramDays
const paramType = req.body.type||[];
  const paramFilter = req.body.filter||" "
  const paramEndDay = utils.AddDays(paramStartDay,paramDays-1)
  const paramISOStartDay = utils.GetISODate(paramStartDay)  
  const paramISOEndDay = utils.GetISODate(paramEndDay) 
  console.log('paramUserId: ',paramUserId)
  console.log('paramStartDay: ',paramStartDay)
  console.log('paramDays: ',paramDays) 
  console.log('paramType: ',paramType) 
  console.log('paramFilter: ',paramFilter)
  console.log('paramEndDay: ',paramEndDay) 
  console.log('paramISOStartDay: ',paramISOStartDay)
  console.log('paramISOEndDay: ',paramISOEndDay)
  
  if (database){        
    const database = req.app.get('database');
    let query_type = {} 
    let query_filter = {}
    
    if(paramType.length !=0){
      query_type = {type: {$all: paramType}} 
    }   

    if(paramFilter !=" "){
      query_filter = {$or: 
        [{contents: new RegExp(".*"+paramFilter+".*","gi")}, 
          {title: new RegExp(".*"+paramFilter+".*","gi")}, 
          {nickNm: new RegExp(".*"+paramFilter+".*","gi")}
        ], 
      }; 
    }  
    database.UserModel.findOne({_id: new ObjectId(paramUserId)},function(err,user){ 
      if(err){
        console.log("EventCalendar 모듈 안에 있는 ShowEventsLis에서 사용자 조회 중 에러 발생: "+ err.stack) 
        res.end() 
        return;
      }   
      if(!user){
        console.log("EventCalendar/ShowEventsList에서 사용자 조회 불가")  
        res.json({msg: "missing"}) 
        return;
      }
      context.isadmin = user.isadmin  
      database.EventCalendarModel.find(
        { 
          $or: [
            {startdate: {$gte: paramISOStartDay, $lte: paramISOEndDay}}, 
            {enddate: {$gte: paramISOStartDay, $lte: paramISOEndDay}},
            //일정이 조회 보다 길 경우
            {
              $and: 
                [
                    {startdate: {$lte: paramISOStartDay}}, 
                    {enddate: {$gte: paramISOEndDay}},
                ]
            }
          ]//or 닫기
        },query_filter,query_type,
      function(err,results){ 
        if(err){
          console.log("EventCalendar 모듈 안에 있는 ShowEventsList에서 collection 조회 중 에러 발생: "+ err.stack)
        }  

        let period = paramStartDay;
        while(period<=paramEndDay){
          context.EventEntries.push({Date: period,Events: [] })
          period = utils.AddDays(period,1)
        } 
        results.forEach(function(items){
          let localismine = user._id.toString() == items.userid 
          //DB에 저장된 날짜 형식을 'YYYY-MM-DD' 로 변환
          let localstartdate = utils.GetNormalDate(items.startdate) 
          let localenddate = utils.GetNormalDate(items.enddate)
          
          //조회된 이벤트 각각을 for문 돌리면서 알맞은 eventlist에 삽입
          for(let currentdate = localstartdate;currentdate<=localenddate;){  
            for(let i=0;i<context.EventEntries.length;i++){
              if(currentdate==context.EventEntries[i].Date){
                
                context.EventEntries[i].Events.push({
                  eventID: items._id, 
                  title : items.title, 
                  type: items.type, 
                  contents: items.contents,
                  adminwrote: items.adminwrote, 
                  ismine: localismine 
                })//push 닫기
              }//if 닫기
            }// i for문 닫기 
            //context.EventEntries[i].splice(0,1)
            currentdate = utils.AddDays(currentdate,1)
          }// currentdate for 문 닫기
        })//forEach 닫기   
      context.EventEntries.splice(0,1); 
      
      //Event 별로 잘 들어왔나 테스트 
      context.EventEntries.forEach((items)=> 
        console.dir(items.Events)
      )
      res.json(context);
      res.end();
      return;
      })
  })//UserModel.findOne 닫기
  }//if(database.db) 닫기  
  else {  
    console.log("EventCalendar 모듈 안에 있는 ShowEventsList 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
  }      
  };//ShowEventsList 닫기   

//EventCalendar에 이벤트 추가 
const AddEvent = async function(req, res) { 

  await connection()
  console.log('EventCalendar 모듈 안에 있는 AddEvent 호출됨.');  
  let context = {msg: " "}

  let paramUserId = req.body.userid
  let paramStartDate = req.body.startdate|| "0000-0-0"
  let paramEndDate = req.body.enddate|| "0000-0-0"
  let paramTitle = req.body.title||" " 
  let paramContents = req.body.contents||" "
  let paramURL = req.body.url||" "  
  let paramType = req.body.type||[]  
  
  //일반 사용자가 일정을 등록할 때와 서버에서 Requests => Calendar 로 이동할 때를 구분 짓기 위함.
  let paramFromServer = req.body.fromserver||false

  console.log('paramUserId: ', paramUserId)
  console.log('paramStartDate: ', paramStartDate)
  console.log('paramEndDate: ', paramEndDate) 
  console.log('paramTitle: ',paramTitle)
  console.log('paramContents: ', paramContents)  
  console.log('paramURL: ', paramURL)  
  console.log('paramType: ', paramType)
  console.log('paramFromServer: ', paramFromServer)

  if(database){
    const database = req.app.get('database');
    database.UserModel.findOne({_id: new ObjectId(paramUserId)}, async function(err,user){
      if(err){
        console.log("EventCalendar 모듈 안에 있는 AddEvent 안에서 사용자 조회 중 에러 발생: "+ err.stack)
        res.end(); 
        return;
      } 
      if(user == undefined) { 
        console.log("EventCalendar 모듈 안에 있는 AddEvent 안에서 사용자 조회된 사용자가 없음")
        context.msg = "missing" 
        res.json(context)
        res.end(); 
        return;
      }  

      //입력한 사용자의 유형에 따라 type[0]에 들어갈 값을 다르게 한다.
      let localtype = user.isadmin? type_official:type_user
      paramType.push(localtype)
      
      //type_official 또는 type_user 가 없고 길이가 1 이상인 paramType의 경우, type_official 또는 type_user를 맨 앞으로 배치 
      if(paramType.length>1){
        let tmp = paramType[0] 
        paramType[0] = paramType[paramType.length-1] 
        paramType[paramType.length-1] = tmp
      }       

      //만약 관리자가 아닌 사용자가 요청하였고, 서버 내에서 요청한 경우가 아니라면 
      //Request에 원소를 추가하는 함수를 수행. 
      if(!(user.isadmin)&&!(paramFromServer)){  
        const url = process.env.lambda_url + '/EventCalendarRequest/AddEvent'
        await axios.post(url,{
          userid: paramUserId, 
          nickNm: user.nickNm, 
          isadmin: user.isadmin,
          startdate: utils.GetISODate(paramStartDate), 
          enddate: utils.GetISODate(paramEndDate),
          title: paramTitle, 
          contents: paramContents,
          url: paramURL, 
          type: paramType  
        })
        .then((response) => {    
          context.msg = response.data.msg
          res.json(context)  
          res.end()
          return;   
        })
        .catch(( err ) => {      
            console.log("EventCalendar/AddEvent => EventCalendarRequest/AddEvent 요청 중 에러 발생: " + err.stack)  
            res.end();
            return;
        });    
        res.end() 
        return;  
      }  
      
      database.db.collection("eventcalendars").insertOne({
        startdate: utils.GetISODate(paramStartDate),
        enddate: utils.GetISODate(paramEndDate), 
        title: paramTitle,
        contents: paramContents,     
        userid: new ObjectId(user._id),
        nickNm: user.nickNm,  
        adminwrote: user.isadmin, 
        url: paramURL, 
        type: paramType, 
        created_at: utils.timestamp()
    },function(err){
        if (err) {
            console.log("EventCalendar 모듈 안에 있는 AddEvent 안에서 Event 저장 중 에러 발생: "+ err.stack)
            res.end();
            return;
        }
        console.log("Event 추가함.");   		    
        context.msg = "success"
        res.json(context) 
        res.end() 
        return
      })
    })//UserModel.findOne 닫기

  } else {  
      console.log('EventCalendar 모듈 안에 있는 AddEvent 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    } 
}; //AddEvent 닫기

//요청 받은 게시글의 title, contents 수정 
const EditEvent = async function(req, res) {
  await connection()
  console.log('EventCalendar 모듈 안에 있는 EditEvent 호출됨.');  
  
  let context = {msg: " "}

  let paramEventId = req.body.eventid
  let paramTitle = req.body.title||" " 
  let paramContents = req.body.contents||" "  
  let paramStartDate = req.body.startdate||" " 
  let paramEndDate = req.body.enddate||" " 
  
  console.log('paramEventId: ', paramEventId)
  console.log('paramTitle: ', paramTitle) 
  console.log('paramContents: ', paramContents)
  console.log('paramStartDate: ', paramStartDate)
  console.log('paramEndDate: ', paramEndDate)

  let set_query; 
  //paramStartDate 와 paramEndDate가 비어져 있는 지의 여부에 따라 $set에 들어갈 값을 달리 함.
  if(paramStartDate == " "&&paramEndDate== " "){
    set_query = {title: paramTitle, contents: paramContents}
  } 
  else{
    if(paramStartDate == " "){
      set_query = {enddate: paramEndDate, title: paramTitle, contents: paramContents}
    } 
    else{
      if(paramEndDate == " "){
        set_query = {startdate: paramStartDate,title: paramTitle, contents: paramContents}
      } 
      else{
        set_query = {startdate: paramStartDate, enddate: paramEndDate, title: paramTitle, contents: paramContents}
      }
    }
  } 
  if(database){
    const database = req.app.get('database');
    database.EventCalendarModel.findOneAndUpdate({_id: new ObjectId(paramEventId)},
      {$set: set_query}, 
    function(err,result){
      if (err) {
              console.log("EventCalendar 모듈 안에 있는 EditEvent 안에서 수정할 게시물 조회 중 에러 발생: "+ err.stack)
              res.end(); 
              return;
      }    
      if(result == null){
        console.log("EventCalendar 모듈 안에 있는 EditEvent 안에서 게시물을 조회 할 수 없음") 
        context.msg = "empty" 
        console.log(context.msg) 
        res.json(context) 
        res.end() 
        return 
      }  
      context.msg = "success";  
      console.log(context.msg)
      res.json(context)           
      res.end() 
      return;
    }) 
  } else {  
      console.log('EventCalendar 모듈 안에 있는 EditEvent 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    } 
}; //EditEvent 닫기

//자신이 작성한 일정 혹은 관리자일 경우 선택한 일정 삭제 
const DeleteEvent = async function(req, res) {
  await connection()
  console.log('EventCalendar 모듈 안에 있는 DeleteEvent 호출됨.');  
  
  let context = {msg: " "}

  let paramEventId = req.body.eventid

  console.log('paramEventId: ', paramEventId)

if(database){
  const database = req.app.get('database');         
    database.db.collection("eventcalendars").findOneAndDelete({_id: new ObjectId(paramEventId)}, 
    function(err,result){
      if (err) {
              console.log("EventCalendar 모듈 안에 있는 DeleteEvent 안에서 삭제할 게시물 조회 중 에러 발생: "+ err.stack)
              res.end(); 
              return;
      }     
      if(result.value == null){
        console.log("EventCalendar 모듈 안에 있는 DeleteEvent 안에서 삭제할 게시물을 조회 할 수 없음") 
        context.msg = "empty" 
        res.json(context) 
        res.end() 
        return 
      }
      context.msg = "success";  
      res.json(context)           
      res.end() 
      return;
    })
  } else {  
      console.log('EventCalendar 모듈 안에 있는 DeleteEvent 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    } 
}; //DeleteEvent 닫기

module.exports.ShowEventsList = ShowEventsList; 
module.exports.AddEvent = AddEvent;
module.exports.EditEvent = EditEvent;
module.exports.DeleteEvent = DeleteEvent;