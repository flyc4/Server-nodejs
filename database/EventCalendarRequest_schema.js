/**
 * @description 이벤트 캘린더 요청(사용자의 등록 후 관리자가 승인 처리 안 한 이벤트)의 
 *              스키마 정의 (프런트 엔드 개발 완료 후 수정 가능)
 * @author Chang Hee
 */
const utils = require('../config/utils');
//createSchema 함수를 저장할 객체. module.exports에 할당하기 위함
let SchemaObj = {}; 

/**
 * @description 이벤트 캘린더 요청의 스키마 정의 
 * @param {Object} mongoose
 * @returns {Object} eventCalendarRequestSchema
 */
SchemaObj.createSchema = function(mongoose) {
	
	// eventcalendar 스키마 정의
	const eventCalendarRequestSchema = mongoose.Schema({ 
        
        startDate: {type: Date, default: utils.getISODate(utils.timestamp())}, //행사 시작 날짜 
        endDate: {type: Date, default: utils.getISODate(utils.timestamp())}, // 행사 종료 날짜 
        title: {type: String, trim:true, default: ' '},     
        userId: {type: mongoose.Schema.ObjectId, ref: 'users'}, //작성한 사용자의 Id
        nickNm: {type: String, default: 'noName'}, 
        type: [], // 행사의 type 들 ex. 한양대 공식
        url: {type: String, default: ' '},
        created_at: {type: Date, default: utils.timestamp()} 

    });
    eventCalendarRequestSchema.index({date: -1},{autoIndex: false}, {unique: false})
    console.log('eventCalendarRequestSchema 정의함.');
	return eventCalendarRequestSchema;
};
module.exports = SchemaObj;

