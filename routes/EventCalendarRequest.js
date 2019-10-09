const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const ObjectId = mongoose.Types.ObjectId;  
const utils = require('../config/utils'); 
require('dotenv').config()  
const axios = require("axios");  
const schedule = require('node-schedule');
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
///////////주기적으로 실행하는 함수 시작/////////// 
_checkrequests = async () => { 
 
  let url = process.env.lambda_url + '/process/EventCalendarRequest/CheckRequests'; 
      await axios.post(url)
          .then((response) => {    
          })
          .catch(( err ) => {       
              console.log("EventCalendarRequest/CheckRequests axios 요청 중 에러 발생: " + err.stack)  
              return;
          });    
} 

//매일 오후 9시 마다 크롤링
let updaterequests = schedule.scheduleJob({hour: 21, minute: 0}, async function(){
  await _checkrequests(); 
 })  

///////////주기적으로 실행하는 함수 끝///////////


///////////함수들 및 전역 변수 시작/////////// 

const GetISODate = function(Data){
  const date = new Date(Data+"T00:00:00.000Z")
  return date
} 

const AddDays = function(StartDay,Days){
  const EndDay = moment(StartDay).add(Days,"days").format("YYYY-MM-DD")
  return EndDay 
}  

const Year = new Date().getFullYear()
const Month = new Date().getMonth() +1; 
//startday를 못 받을 경우 시스템 월의 1일
const defaultstartday = moment(Year + "-" + Month + "-" + "01").format("YYYY-MM-DD")

//eventcalendar으로 보낼 때 contents에 날짜를 포함할 거임. 그 날짜와 더불어 들어갈 내용을 정의
const DateToContents = function(date){ 
  return "Date: " + date;
} 

const toeventcalendar = 2;  // eventcalendar 로 이동하기 위해 필요한 요구 수 
const displaydates = 2; // eventcalendar로 이동할 때 보여 지는 날짜의 수  

const type_user = "User" 

///////////함수들  및 전역 변수 끝///////////

//사용자의 요청 목록 보여줌.
const ShowEventsList = async function(req, res) {
  console.log('EventCalendarRequest/ShowEventsList 호출됨.');
  await connection()  
      
  let context = { Events: [{ eventID: ' ', startdate: ' ', enddate: ' ', title : ' ', userid: ' ', nickNm: ' ',type: [], url: ' '}]}   
   
  const paramUserId = req.body.userid;
  const paramStartDay = req.body.startday||defaultstartday; 
  const paramDays = req.body.days||'1'
  const paramStartIndex = req.body.startindex||0;
  const paramEndIndex = req.body.endindex||19;  
  const paramType = req.body.type||[];
  const paramFilter = req.body.filter||" "
  const paramEndDay = AddDays(paramStartDay,paramDays)
  const paramISOStartDay = GetISODate(paramStartDay)  
  const paramISOEndDay = GetISODate(paramEndDay) 
  
  console.log('paramUserId: ',paramUserId)
  console.log('paramStartDay: ',paramStartDay)
  console.log('paramDays: ',paramDays) 
  console.log('paramStartIndex: ',paramStartIndex) 
  console.log('paramEndIndex: ',paramEndIndex)
  console.log('paramType: ',paramType) 
  console.log('paramFilter: ',paramFilter)
  console.log('paramEndDay: ',paramEndDay) 
  console.log('paramISOStartDay: ',paramISOStartDay)
  console.log('paramISOEndDay: ',paramISOEndDay)
  
  if (database){       
    const database = req.app.get('database');
    let query_type = {} 
    let query_filter = {}
    let query_isadmin = {} 

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
        console.log("EventCalendarRequest/ShowEventsList에서 사용자 조회 중 에러 발생: " + err.stack) 
        res.end() 
        return
      } 
      if(!user){
        console.log("EventCalendarRequest/ShowEventsList에서 사용자 조회 불가")  
        res.json({msg: "missing"}) 
        return;
      }
      //요청한 사용자의 isadmin에 따라 query_isadmin이 달라짐. 
      //user: 본인이 작성한 것만 조회, admin: 조건에 맞는 모든 것들 조회  
      if(!(user.isadmin)){
        query_isadmin = {userid: new ObjectId(paramUserId)}
      }
      database.EventCalendarRequestModel.find(
        { 
          startdate: {$gte: paramISOStartDay, $lte: paramISOEndDay}, 
          $and: [query_filter, query_type,query_isadmin]  
        },
            function(err,results){ 
              if(err){
                console.log("EventCalendarRequest/ShowEventsList에서 collection 조회 중 에러 발생: "+ err.stack)
              }  

              if(paramStartIndex<0){
                paramStartIndex = 0
              }
              if(paramEndIndex<0){
                paramEndIndex = 0
              }

              for(let i=paramStartIndex;i<=paramEndIndex;i++){  
                if(i>=results.length){
                  break;
                } 

                context.Events.push({
                  eventID: results[i]._id, 
                  startdate: moment(results[i].startdate).format('YYYY-MM-DD'),
                  enddate: moment(results[i].enddate).format('YYYY-MM-DD'), 
                  title : results[i].title, 
                  userid: user._id, 
                  nickNm: user.nickNm, 
                  type: results[i].type, 
                  url: results[i].url})
              }
              context.Events.splice(0,1); 
              console.dir(context)
              //Event 별로 잘 들어왔나 테스트 
              context.Events.forEach((items)=> 
                console.dir(items)
              )
            res.json(context);
            res.end();
            return;
            }); //EventCalendarRequestModel.find닫기
          })//collection("users").findOne 닫기 
  }//if(database) 닫기  
else {  
  console.log("EventCalendarRequest/ShowEventsList 수행 중 데이터베이스 연결 실패")
  res.end(); 
  return;
}      
};//ShowEventsList 닫기   

//EventCalendarRequest에 이벤트 추가  
//항상 EventCalendar/AddEvent에서 넘어온 것으로 가정.
const AddEvent = async function(req, res) {
  await connection() 
  console.log('EventCalendarRequest 모듈 안에 있는 AddEvent 호출됨.');  
  let context = {msg: " "}

  let paramUserId = req.body.userid
  //항상 EventCalendar/AddEvent에서 넘어온 것으로 가정이 깨질 시 문제가 되는 부분
  let paramNickNm = req.body.nickNm 
  let paramIsadmin = req.body.isadmin||false 
  //항상 EventCalendar/AddEvent에서 넘어온 것으로 가정이 깨질 시 문제가 되는 부분 
  let paramStartDate = req.body.startdate|| defaultstartday 
  let paramEndDate = req.body.enddate|| defaultstartday
  let paramTitle = req.body.title||" " 
  let paramURL = req.body.url||" "  
  let paramType = req.body.type||[] 

  console.log('paramUserId: ', paramUserId)
  console.log('paramNickNm: ', paramNickNm) 
  console.log('paramIsadmin: ', paramIsadmin)
  console.log('paramStartDate: ', paramStartDate)
  console.log('paramEndDate: ', paramEndDate) 
  console.log('paramTitle: ',paramTitle) 
  console.log('paramURL: ', paramURL) 
  console.log('paramType: ', paramType)
  if(database){
    const database = req.app.get('database');
    database.EventCalendarRequestModel.findOne({$and: [{userid: new ObjectId(paramUserId)}, {title: paramTitle}]},
      function(err,result){ 
        if(err){
          console.log("EventCalendarRequest/AddEvent에서 중복 요청 Event 조회 중 에러 발생: " + err.stack) 
          res.end() 
          return
        }  
        //해당 사용자가 이미 동일한 제목으로 요청을 했을 경우 
        if(result!= undefined){
          console.log("EventCalendarRequest/AddEvent에서 사용자의 동일한 제목의 요청을 이미 했음") 
          context.msg = "duplicate" 
          res.json(context) 
          return;
        }  

        paramType.push(type_user)
        //type_official 또는 type_user 가 없고 길이가 1 이상인 paramType의 경우, type_official 또는 type_user를 맨 앞으로 배치 
        if(paramType.length>1){
          let tmp = paramType[0] 
          paramType[0] = paramType[paramType.length-1] 
          paramType[paramType.length-1] = tmp
        } 

        let post = new database.EventCalendarRequestModel({
          startdate: paramStartDate,
          enddate: paramEndDate, 
          title: paramTitle,     
          userid: new ObjectId(paramUserId),
          nickNm: paramNickNm,  
          adminwrote: paramIsadmin, 
          url: paramURL, 
          type: paramType, 
          created_at: moment().utc(Date.now(), "YYYY-MM-DD HH:mm:ss.fff")
        });
        post.saveEventCalendarRequest(function(err) {
          if (err) {
              console.log("EventCalendarRequest 모듈 안에 있는 AddEvent 안에서 Event 저장 중 에러 발생: "+ err.stack)
              res.end();
              return;
          }
          console.log("Event 추가함.");   		    
          context.msg = "success"
          res.json(context) 
          res.end() 
          return
        }) 
    })//EventCalendarRequestModel.findOne닫기
  } else {  
      console.log('EventCalendarRequest 모듈 안에 있는 AddEvent 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    } 
}; //AddEvent 닫기

//요청 받은 게시글의 title 수정 
const EditEvent = async function(req, res) {
  
  console.log('EventCalendarRequest/EditEvent 호출됨.');   
  await connection()
  
  let context = {msg: " "}

  let paramEventId = req.body.eventid
  let paramTitle = req.body.title||" " 
  
  console.log('paramEventId: ', paramEventId)
  console.log('paramTitle: ', paramTitle) 

  if(database){
    const database = req.app.get('database');
    database.EventCalendarRequestModel.findOneAndUpdate({_id: new ObjectId(paramEventId)},{$set: {title: paramTitle}}, 
    function(err,result){
      if (err) {
        console.log("EventCalendarRequest/EditEvent 안에서 수정할 게시물 조회 중 에러 발생: "+ err.stack)
        res.end(); 
        return;
      }    
      if(result == null){
        console.log("EventCalendarRequest/EditEvent 안에서 게시물을 조회 할 수 없음") 
        context.msg = "empty"  
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
      console.log('EventCalendarRequest/EditEvent 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    } 
}; //EditEvent 닫기

//자신이 작성한 일정 혹은 관리자일 경우 선택한 일정 삭제 
const DeleteEvent = async function(req, res) {
  await connection()
  console.log('EventCalendarRequest 모듈 안에 있는 DeleteEvent 호출됨.');  
  
  let context = {msg: " "}
  const database = req.app.get('database');
  let paramEventId = req.body.eventid

  console.log('paramEventId: ', paramEventId)

if(database.db){
             
    database.db.collection("eventcalendarrequests").findOneAndDelete({_id: new ObjectId(paramEventId)}, 
    function(err,result){
      if (err) {
              console.log("EventCalendarRequest 모듈 안에 있는 DeleteEvent 안에서 삭제할 게시물 조회 중 에러 발생: "+ err.stack)
              res.end(); 
              return;
      }     
      if(result.value == null){
        console.log("EventCalendarRequest 모듈 안에 있는 DeleteEvent 안에서 삭제할 이벤트를 조회 할 수 없음") 
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
      console.log('EventCalendarRequest 모듈 안에 있는 DeleteEvent 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    } 
}; //DeleteEvent 닫기 

const CheckRequests = async function(req,res){ 
  await connection();
  console.log('EventCalendarRequest 모듈 안에 있는 CheckRequests 호출됨.');  
  
  if(database){ 
    const database = req.app.get("database")
    database.EventCalendarRequestModel.aggregate([
      {
        $group:
          {
            _id : {title: "$title"}, 
            count: { $sum: 1}
          } 
      }, 
      {
        $match:
          {
            count: {$gte: toeventcalendar}
          }
      }
      ],
      function(err,titles){
        if(err){
          console.log("EventCalendarRequest/CheckRequests에서 title 그룹화 중 에러 발생: " + err.stack) 
          res.end() 
          return
        } 
        titles.forEach(async function(items){ 
          //옮겨야 하는 title 들을 날짜 별로 나누어서 날짜의 최빈값과 2번째로 많이 나오는 date 값을 추출
          database.EventCalendarRequestModel.aggregate([
            {
              $match:
                {
                  title: items._id.title
                }
            }, 
            
            {
              $group:
                {
                  _id : {startdate: "$startdate"}, 
                  count: { $sum: 1}
                }  
            }, 
            {
              $sort: 
                {
                  count: -1
                }
            }
          ],
            async function(err,dates){
              if(err){
                console.log("EventCalendarRequest/CheckRequests에서 date 그룹화 중 에러 발생: " + err.stack) 
                res.end() 
                return
              }  
             await database.EventCalendarRequestModel.find({title: items._id.title}, async function(err,results){
                if(err){
                  console.log("EventCalendarRequest/CheckRequests에서 Event 조회 중 에러 발생: " + err.stack) 
                  res.end() 
                  return
                } 
                //user에 대한 정보를 찾기 위함: 현재: 요청을 가장 처음 보냈던 사람
                await database.UserModel.findOne({_id: results[0].userid}, async function(err,user){
                  if(err){
                    console.log("EventCalendarRequest/CheckRequests에서 사용자 조회 중 에러 발생: " + err.stack) 
                    res.end() 
                    return
                  }   
                  let localcontents = DateToContents(moment(dates[0]._id.startdate).format("YYYY-MM-DD")) + " ~ " + DateToContents(moment(dates[0]._id.enddate).format("YYYY-MM-DD"))
                  for(let i=1;i<displaydates;i++){  
                    localcontents = localcontents + "\n" + DateToContents(moment(dates[i]._id.startdate).format("YYYY-MM-DD")) + " ~ " + DateToContents(moment(dates[0]._id.enddate).format("YYYY-MM-DD"))   
                  }  
                  //Request => EventCalendar로 저장
                  await database.db.collection("eventcalendars").insertOne({
                    startdate: dates[0]._id.startdate, 
                    enddate: results[0].enddate, 
                    contents: localcontents,     
                    userid: new ObjectId(user._id),
                    nickNm: user.nickNm,  
                    adminwrote: user.isadmin, 
                    url: results[0].url, 
                    type: results[0].type, 
                    created_at: moment().utc(Date.now(), "YYYY-MM-DD HH:mm:ss.fff")
                  }); 
                  console.log("EventCalendar에 추가 완료.");   		    
                  database.EventCalendarRequestModel.deleteMany({title: items._id.title},function(err){
                    if (err) {
                      console.log("EventCalendarRequest/CheckRequests에서 저장 완료한 Request 제거 중 에러 발생: "+ err.stack)
                      res.end();
                      return;
                      }  
                    console.log("EventRequest에서 삭제 완료.");
                    res.end() 
                    return
                    })  
                })//collection("users").findOne닫기
              }).sort({created_at: 1})//EventCalendarRequestModel.find 닫기 
            })//aggregate - date 닫기 
        })//titles.forEach닫기 
      })//aggregate - title 닫기
  } 
  else {  
    console.log('EventCalendarRequest/CheckRequests 수행 중 데이터베이스 연결 실패');
    res.end(); 
    return;
  } 
}; //CheckRequests 닫기   

//요청 받은 id에 해당하는 것을 EventCalendarTable로 이동한다.
const MoveToEventCalendar = async function(req,res){
  await connection();
  console.log('EventCalendarRequest/MoveToEventCalendar 호출됨.');  
  
  let context = {msg: " "}
  
  const paramEventId = req.body.eventid; 

  console.log("paramEventId: ", paramEventId) 

  if(database){
    const database = req.app.get("database")
    database.EventCalendarRequestModel.findOne({_id: new ObjectId(paramEventId)},function(err,event){

      if(err){
        console.log("EventCalendarRequest/MoveToEventCalendar에서 Event 조회 중 에러 발생: "+ err.stack)
        res.end();
        return;  
      } 
      if(event == null){
        console.log("EventCalendarRequest/MoveToeEventCalendar에서 Event 조회 불가") 
        context.msg = "missing" 
        res.json(context) 
        res.end() 
        return
      }
      database.db.collection("eventcalendars").insertOne({
        startdate: event.startdate, 
        enddate: event.enddate, 
        title: event.title,
        contents: " ",      
        userid: new ObjectId(event.userid),
        nickNm: event.nickNm,  
        //adminwrote: request에 있는 것들은 무조건 관리자가 아니라고 판단
        adminwrote: false, 
        url: event.url, 
        type: event.type, 
        created_at: event.created_at
      });  
      console.log("EventCalendar에 삽입 완료")
      database.EventCalendarRequestModel.deleteOne({_id: new ObjectId(paramEventId)},function(err){
        if (err) {
          console.log("EventCalendarRequest/MoveToeEventCalendar에서 Request 제거 중 에러 발생: "+ err.stack)
          res.end();
          return;
          }  
        console.log("EventRequest에서 삭제 완료.");
        res.end() 
        return
        })  
    })//EventCalendarRequestModel.findOne닫기
  } 
  else {  
    console.log('EventCalendarRequest/MoveToEventCalendar 수행 중 데이터베이스 연결 실패');
    res.end(); 
    return;
  } 
};//MoveToEventCalendar닫기

module.exports.ShowEventsList = ShowEventsList; 
module.exports.AddEvent = AddEvent;
module.exports.EditEvent = EditEvent;
module.exports.DeleteEvent = DeleteEvent; 
module.exports.CheckRequests = CheckRequests; 
module.exports.MoveToEventCalendar = MoveToEventCalendar;