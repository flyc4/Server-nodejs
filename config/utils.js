var moment = require('moment');   //한국시간을 나타내기 위한 모듈 추가
const timestamp = function(){                
  return moment().format("YYYY-MM-DD HH:mm:ss");
} 

module.exports.timestamp = timestamp; 
