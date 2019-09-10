/**
 * 게시판 목록을 위한 데이터베이스 스키마를 정의하는 모듈
 * 
 */

var moment = require('moment')  
var timestamp = function(){            
    return moment().format("YYYY-MM-DD HH:mm:ss");
  }

var SchemaObj = {};
SchemaObj.createSchema = function(mongoose) {
	
	// 게시판 스키마 정의
	var BoardsListSchema = mongoose.Schema({ 
        
	    boardname: {type: String, trim: true, 'default':''}, //게시판 이름. 게시판 전체목록 조회 시 collection(boardname) 이런 식으로
	    contents: {type: String, trim:true, 'default':''}, // 게시판 설명
        created_at: {type: Date, 'default': timestamp()}
        
    });
	console.log('BoardsListSchema 정의함.');
	return BoardsListSchema;
};

// module.exports에 BoardsListSchema 객체 직접 할당
module.exports = SchemaObj;

