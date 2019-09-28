/**
 *  EventCalendarRequest에 대한 스키마
 * 
 */ 
let utils = require('../config/utils')

let SchemaObj = {};
SchemaObj.createSchema = function(mongoose) {
	
	// eventcalendar 스키마 정의
	let EventCalendarRequestSchema = mongoose.Schema({ 
        date: {type: Date, 'default': '0000-01-01'}, //행사 날짜 
        title: {type: String, trim:true, 'default': ' '},     
        userid: {type: mongoose.Schema.ObjectId, ref: 'users'}, //작성한 사용자의 Id
        nickNm: {type: String, 'default': 'noName'}, 
        type: [], // 행사의 type 들 ex. 한양대 공식
        url: {type: String, 'default': ' '},
        created_at: {type: Date, 'default': utils.timestamp()} 

    });
    EventCalendarRequestSchema.index({date: -1},{autoIndex: false}, {unique: false})
    
    EventCalendarRequestSchema.methods = {
		saveEventCalendarRequest: function(callback) {		
			var self = this;
			this.validate(function(err) {
				if (err) return callback(err);
				self.save(callback);
			});
        } 
    }
    console.log('EventCalendarRequestSchema 정의함.');
	return EventCalendarRequestSchema;
};
module.exports = SchemaObj;

