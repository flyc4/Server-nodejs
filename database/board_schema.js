/**
 * @description board의 스키마 정의 
 * @author Chang Hee
 */

const utils = require('../config/utils');
//createSchema 함수를 저장할 객체. module.exports에 할당하기 위함
let SchemaObj = {}; 
/**
 * @description 한 게시판의 스키마 정의 
 * @param {Object} mongoose
 * @returns {Object} boardSchema
 */
SchemaObj.createSchema = function (mongoose) {

	const boardSchema = mongoose.Schema({ 
            userId: {type: mongoose.Schema.ObjectId, ref: 'users'}, //사용자 식별 id. MongoDB의 _id 이용 
            nickNm: {type: String, default: 'noName'},
            profile: {type: String, trim:true, default: ' '}, // 게시글 옆 사진
            likes: {type: Number, unique: false, default: 0}, // 게시글 좋아요 갯수
            likesList: [{ //게시물에 좋아요를 누른 사람들의 목록
                userId: {type: mongoose.Schema.ObjectId, ref: 'users'},  
                nickNm: {type: String, default: 'noName'}
            }],   
            created_at: {type: Date, default: utils.timestamp()}, //게시글 작성 날짜
            title: {type: String, trim:true, default: ' '},
            contents: {type: String, trim:true, default: ' '},
            pictures: {type: String, trim:true, default: ' '}, //게시글 첨부 사진. 링크
            hits: {type: Number, unique: false, default: 0}, //조회 수     
            comments: [{ //댓글              
                _id: {type: mongoose.Schema.ObjectId, default: new mongoose.Types.ObjectId()},
                userId: {type: mongoose.Schema.ObjectId, ref: 'users'},  
                nickNm: {type: String, default: 'noName'},
                boardId: {type: String, trim:true, default: ' '}, 
                parentReplyId: {type: mongoose.Schema.ObjectId, default: ' ' }, //부모 댓글의 id 
                likes: {type: Number, unique: false, default: 0}, 
                likesList: [{ //댓글에 좋아요를 누른 사람들의 목록
                    userId: {type: mongoose.Schema.ObjectId, ref: 'users'},  
                    nickNm: {type: String, default: 'noName'}
                }], 
                contents: {type: String, trim:true, default: 'no contents'},
                pictures: {type: String, trim:true, default: 'no title'}, 
                created_at: {type: Date, default: utils.timestamp()}, 
            }]
    });
    console.log('boardSchema 정의함.');
	return boardSchema;
};
//app.js에서 mongoose 모듈 관련 설정을 일괄적으로 하기 위해서 스키마 객체를 반환
module.exports = SchemaObj;

