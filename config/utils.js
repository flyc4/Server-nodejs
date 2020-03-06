/**
 * @description 다양한 function 저장  
 * @author Chang Hee
 */

const moment = require('moment');
const jwt = require('jsonwebtoken'); 
const axios = require('axios'); 
//번역에 필요한 api
const api = 'AIzaSyATLbXuBnhHhb1Meyv2WFa6Lpw5FCupc8I';
const googleTranslate = require('google-translate')(api);

/**
 * @description Array 내의 최빈값 반환. 출연 횟수 동일 시 사전 편찬 순으로 가장 우선되는 값 반환. 
 * @param {Array} array - 최빈값 조사 대상 array 
 * @param {*} defaultValue - 조사할 array가 비워져 있을 시 반환되는 값   
 * @returns {*} maxElement - array 내의 최빈값. 빈 array일 경우 defaultValue가 반환됨.    
 */
const getMostFrequentElement = function(array, defaultValue){  

  let elements = {}; // {array의 원소: 출연 횟수} 꼴로 저장 
  let maxElement = defaultValue; //반환 및 최빈값 저장  
  
  elements[maxElement] = -1;
    //현재 조사 중인 원소(item)가 elements에 없다면 {item: 1} 로 저장하고,
    // 이미 출연한 원소라면 기존 출연 횟수를 증가시킨다.  
    array.map( (item) => {                  
          if(elements[item] === null){
              elements[item] = 1;   
          } 
          else{
              elements[item]++;
          }   
          // maxElement === defaultValue 이거나 (array의 가장 처음 원소를 elements에 등록하는 경우)
          // 현재 조회 중인 원소의 출연 횟수가 maxElement의 출연 횟수 보다 많거나
          // 현재 조회 중인 원소의 출연 횟수가 maxElement의 출연 횟수와 같고 
          // && 사전 편찬 순으로 현재 조회 중인 원소가 더 우선할 경우 maxElement 값을 업데이트한다.
          if( maxElement === defaultValue || 
            elements[item]>elements[maxElement] ||  
            (elements[item]===elements[maxElement] && (item<maxElement))){
              maxElement = item; 
          }  
      }) 
  return maxElement;
}

/**
 * @description GMT + 9 기준 현재 시간을 'YYYY-MM-DD HH:mm:ss' 꼴로 반환
 * @returns {*} moment().format()   
 */ 
const timestamp = function(){
  return new Date(moment().add(9, 'hours').format("YYYY-MM-DD HH:mm:ss"));
}

/**
 * @description 날짜 형식을 ISO 형식으로 반환  
 * @param {String} Data - ISO 형식으로 바꾸고자 하는 날짜. '2019-01-01' 형식 등
 * @returns {Object} date - ISO Date 형식. T00:00:00.000Z. EventCalendar에서만 사용하므로 시간, 분, 초는 미지정  
 */ 
const getISODate = function(Data){ 
  // eventCalendar/addEvent 처럼 인풋 값이 ISO 형식으로 들어오는 경우도 있으므로 moment(Data).format을 먼저 쓴다
  const date = new Date(moment(Data).format("YYYY-MM-DD")+"T00:00:00.000Z");
  return date;
} 

/**
 * @description YYYY-MM-DD 형식의 일 수 덧셈. EventCalendar에서 이벤트 종료일 계산 시 활용  
 * @param {String} StartDay - '2019-01-01' 형식
 * @param {Number} days - 더할 일 수. 
 * @returns {Object} EndDay - Startday로부터 Days일 후의 날짜. '2019-01-01' 형식   
 */
const addDays = function(StartDay, days){
  const EndDay = moment(StartDay).add(days,"days").format("YYYY-MM-DD");
  return EndDay; 
}  

/**
 * @description 시스템 날짜의 월의 1일 반환. ex. 시스템 날짜: 2019-10-09 일 경우 2019-10-01 반환  
 * @returns {Object} moment().format() - 시스템 날짜에서 해당 월의 1일 날짜 반환  
 */ 
const defaultStartDay = function(){
  const Year = new Date().getFullYear();
  let Month = new Date().getMonth() + 1;  
  Month = Month < 10 
          ? "0"+ Month
          : Month;    
  
  return moment(Year + "-" + Month + "-" + "01").format("YYYY-MM-DD"); 
} 

/**
 * @description ISO 객체를 'YYYY-MM-DD' 꼴로 변환. EventCalendar에서 데이터 베이스에 저장된 날짜 정보를 
 *              프런트 엔드에 전송 시 사용 
 * @param {Object} Data - ISO 날짜 형식 
 * @returns {Object} moment.format() - '2019-01-01' 형식   
 */
const getNormalDate = function(Data){
  return moment(Data).format("YYYY-MM-DD");
}

/**
 * @description EventCalendar로 보낼 때 contents에 포함될 날짜 정보. 그 날짜와 더불어 들어갈 내용을 정의
 *              (프런트 엔드에서 개발을 진행하지 못해서 들어갈 내용은 날짜 앞 "Date: "를 붙이는 것으로 임의로 정함)
 * @param {String} date - '2019-01-01' 형식 
 * @returns {String} - 'Date: 2019-01-01' 형식   
 */
const dateToContents = function(date){ 
  return "Date: " + date;
} 

/**
 * @description JWT를 verify 하여 나온 userId를 반환 
 * @param {String} token - JWT 토큰 
 * @returns {String} jwt.verify().userId - JWT가 포함한 userId 값  
 */
const JWTVerifyId = function(token){
  return jwt.verify(token,"HS256").userId;
} 

/**
 * @description 요청 객체에 파라미터 없이 axios를 이용하여 요청을 보냄. 웹 페이지 크롤링 용도.
 * @param {String} url - 요청하고자 하는 url 
 * @param {String} errMSG - 에러 시 출력할 메시지   
 * @returns {Promise} axios.get(url) - url에서 크롤링 한 결과 값을 반환하는 Promise 객체
 */
const axiosNoParameter = async function(url, errMSG){
  return axios
          .get(url) 
          .catch(err => {
            console.log(errMSG + err.stack); 
            res.end(); 
            return;
          })
} 
////////////////////전역변수////////////////////
/**
 * @description JWT 암호화 알고리즘
 */
const secret = "HS256";

/**
 * @description ObjectId 값이 0일 때 사용하는 string 
 */
const ZEROID = '000000000000000000000000';

module.exports.getMostFrequentElement = getMostFrequentElement; 
module.exports.timestamp = timestamp;
module.exports.getISODate = getISODate; 
module.exports.addDays = addDays; 
module.exports.defaultStartDay = defaultStartDay; 
module.exports.getNormalDate = getNormalDate 
module.exports.dateToContents = dateToContents; 
module.exports.axiosNoParameter = axiosNoParameter; 
////////////////////전역변수////////////////////
module.exports.secret = secret; 
module.exports.JWTVerifyId = JWTVerifyId;
module.exports.ZEROID = ZEROID;