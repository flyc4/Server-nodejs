const moment = require('moment')
const jwt = require('jsonwebtoken');


//현재 시간을 ISO 형식으로 반환
const timestamp = function(){         
  return moment().format("YYYY-MM-DDTHH:mm:ss.SSS");
}  

//YYYY-MM-DD 형식의 날짜 파일을 ISO 형식으로 반환
const GetISODate = function(Data){
  const date = new Date(Data+"T00:00:00.000Z")
  return date
} 

//YYYY-MM-DD 형식의 일 수 덧셈
const AddDays = function(StartDay,Days){
  const EndDay = moment(StartDay).add(Days,"days").format("YYYY-MM-DD")
  return EndDay 
}  
//시스템 날짜의 월의 1일 반환. 
// ex. 2019-10-09 => 2019-10-01 반환
const Year = new Date().getFullYear()
const Month = new Date().getMonth() +1; 
//startday를 못 받을 경우 시스템 월의 1일
const defaultstartday = moment(Year + "-" + Month + "-" + "01").format("YYYY-MM-DD") 

//날짜 데이터를 'YYYY-MM-DD' 꼴로 변환
const GetNormalDate = function(Data){
  return moment(Data).format("YYYY-MM-DD")
}

//eventcalendar으로 보낼 때 contents에 날짜를 포함할 거임. 그 날짜와 더불어 들어갈 내용을 정의
const DateToContents = function(date){ 
  return "Date: " + date;
} 

const JWTVerify_id = function(token){
  return jwt.verify(token,"HS256").userid;
}

module.exports.timestamp = timestamp; 
module.exports.GetISODate = GetISODate; 
module.exports.AddDays = AddDays; 
module.exports.defaultstartday = defaultstartday; 
module.exports.GetNormalDate = GetNormalDate 
module.exports.DateToContents = DateToContents;
module.exports.secret = "HS256"; 
module.exports.JWTVerify_id = JWTVerify_id;