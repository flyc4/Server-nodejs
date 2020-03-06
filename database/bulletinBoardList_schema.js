/**
 * @description 게시판 목록의 스키마 정의 
 * @author Chang Hee
 */
const utils = require('../config/utils');
let SchemaObj = {}; 
/**
 * @description bulletinBoardsList의 스키마 정의
 * @param {Object} mongoose
 * @returns {Object} bulletinBoardsListSchema
 */
SchemaObj.createSchema = function(mongoose) {
	
	// 게시판 스키마 정의
	const bulletinBoardsListSchema = mongoose.Schema({  

		boardname: {type: String, trim: true, default:''}, //게시판 이름. 게시판 전체목록 조회 시 collection(boardname) 식으로 사용 가능 
	    contents: {type: String, trim:true, default:''}, // 게시판 설명
        created_at: {type: Date, default: utils.timestamp()}
    });
	console.log('bulletinBoardsListSchema 정의함.');
	return bulletinBoardsListSchema;
};

module.exports = SchemaObj;

