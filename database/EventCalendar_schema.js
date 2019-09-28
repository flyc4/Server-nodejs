/**
 *  EventCalendar에 대한 스키마
 * 
 */ 
let utils = require('../config/utils')

let SchemaObj = {};
SchemaObj.createSchema = function(mongoose) {
	
	// eventcalendar 스키마 정의
	let EventCalendarSchema = mongoose.Schema({ 

        date: {type: Date, 'default': '2019-01-01'}, //행사 날짜 
        title: {type: String, trim:true, 'default': ' '},
        contents: {type: String, trim:true, 'default': ' '},     
        userid: {type: mongoose.Schema.ObjectId, ref: 'users'}, //작성한 사용자의 Id
        nickNm: {type: String, 'default': 'noName'},  
        adminwrote: {type: Boolean, default: false}, //해당 이벤트가 관리자가 작성한 것인 지를 나타냄.
        url: {type: String, 'default': ' '}, 
        type: [], // 행사의 type 들 ex. Official 
        created_at: {type: Date, 'default': utils.timestamp()}
    });
    EventCalendarSchema.index({date: -1},{autoIndex: false}, {unique: false})
    
    console.log('EventCalendarSchema 정의함.');
	return EventCalendarSchema;
};
module.exports = SchemaObj;

