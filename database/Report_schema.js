/**
 * @description 신고 내역이 들어온 목록(게시판, 게시글, 댓글)의 스키마 정의 (프런트 엔드 개발 완료 후 수정 가능)
 * @author Chang Hee
 */

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId; 
const ZEROID = new ObjectId('000000000000000000000000');  

const utils = require('../config/utils');
//createSchema 함수를 저장할 객체. module.exports에 할당하기 위함
let SchemaObj = {}; 

/**
 * @description 신고 내역의 스키마 정의 
 * @param {Object} mongoose
 * @returns {Object} reportSchema
 */
SchemaObj.createSchema = function(mongoose) {
	
	// 게시판 스키마 정의
	const reportSchema = mongoose.Schema({ 
    
            userId: {type: mongoose.Schema.ObjectId, ref: 'users'}, 
            nickNm: {type: String, default: 'no Name'},   
            boardId: {type: String, trim: true, default: 'board1'}, 
            entryId: {type: mongoose.Schema.ObjectId, default: utils.ZEROID},  
            parentCommentId: {type: mongoose.Schema.ObjectId, default: utils.ZEROID}, 
            commentId: {type: mongoose.Schema.ObjectId, default: utils.ZEROID},
            title: {type: String, trim:true, default: 'no title'},
            contents: {type: String, trim:true, default: 'no contents'},
            created_at: {type: Date, default: utils.timestamp()},        
              
    });
	console.log('reportSchema 정의함.');
	return reportSchema;
};

module.exports = SchemaObj;

