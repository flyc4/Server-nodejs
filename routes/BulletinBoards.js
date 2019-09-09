/*
 * 게시판을 위한 라우팅 함수 정의
 *
 * @date 2018-09-04
 * @author ChangHee
 */

var mongoose = require('mongoose');
var jwt = require('jsonwebtoken'); 
var ObjectId = mongoose.Types.ObjectId; 
var MongoClient = require('mongodb').MongoClient;  
var winston = require('winston'); 
var moment = require('moment');   //한국시간을 나타내기 위한 모듈 추가
var fs = require('fs'); 
var logDir ='./logs';

/*로그 만드는 함수(방법)  
link: https://velog.io/@pizzu/nodejs-%EB%A1%9C%EA%B7%B8%ED%8C%8C%EC%9D%BC-%EC%83%9D%EC%84%B1-%ED%95%98%EB%8A%94-%EB%B2%95
var info = "로그로 남길 내용들";
log(info);
*/
function log(info){
    console.log(info);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    var logger = new (winston.Logger)({
        transports: [
          new (winston.transports.Console)({
           colorize: true,
           level: 'info',
           timestamp: function(){             //한국 시간 나타내는법
            return moment().format("YYYY-MM-DD HH:mm:ss");
          }
         }),
          new (require('winston-daily-rotate-file'))({
            level: 'info',
            filename: `${logDir}/log.log`,
            prepend: true,
            timestamp: function(){             //한국 시간 나타내는법
                return moment().format("YYYY-MM-DD HH:mm:ss");
              }
          })
        ]
      });
  try{
      logger.info(info);
    }catch(exception){
      logger.error("ERROR=>" +exception);
    }
}







