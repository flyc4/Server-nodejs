/**
 * 신고 게시판을 위한 데이터베이스 스키마를 정의하는 모듈
 * 
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId; 
var zeroId = new ObjectId('000000000000000000000000');  
var utils = require('../config/utils')

var SchemaObj = {};
SchemaObj.createSchema = function(mongoose) {
	
	// 게시판 스키마 정의
	var ReportSchema = mongoose.Schema({ 
    
            userid: {type: mongoose.Schema.ObjectId, ref: 'users'}, 
            nickNm: {type: String, 'default': 'noName'},  
            //boardid: collection() 에 넣을 값. 
            boardid: {type: String, trim: true, default: 'board1'}, 
            entryid: {type: mongoose.Schema.ObjectId, default: zeroId},  
            parentcommentid: {type: mongoose.Schema.ObjectId, default: zeroId}, 
            commentid: {type: mongoose.Schema.ObjectId, default: zeroId},
            title: {type: String, trim:true, 'default': ''},
            contents: {type: String, trim:true, 'default': ''},
            created_at: {type: Date, default: utils.timestamp()},        
              
    });
	console.log('ReportSchema 정의함.');
	return ReportSchema;
};
// module.exports에 ReportSchema 객체 직접 할당
module.exports = SchemaObj;

