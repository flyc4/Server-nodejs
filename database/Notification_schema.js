/**
 *  공지사항에 대한 스키마
 * 
 */ 

var utils = require('../config/utils')

var SchemaObj = {};
SchemaObj.createSchema = function(mongoose) {
	
	// 공지사항 스키마 정의
	var NotificationSchema = mongoose.Schema({ 
    
            userid: {type: mongoose.Schema.ObjectId, ref: 'users'}, 
            nickNm: {type: String, 'default': 'noName'},
            profile: {type: String, trim:true, 'default': ' '},// 게시글 옆 사진
            likes: {type: Number, unique: false, 'default': 0},
            created_at: {type: Date, 'default': utils.timestamp(), index: {unique: false}}, //크롤링한 날짜
            title: {type: String, trim:true, 'default': ' '},
            contents: {type: String, trim:true, 'default': ' '},
            pictures: {type: String, trim:true, 'default': ' '},  //링크
            hits: {type: Number, unique: false, 'default': 0}, // 조회 수     
            url: {type: String, trim:true, 'default': ' '}, 
            date: {type: Date, 'default': utils.timestamp()}, //게시글 작성일. '4시간 전' 이런 식으로 작성되어있으면 현재 날짜로
            isnotice: {type: Number, unique: false, 'default': 0}, 
            comments: [{   // 댓글           
                userid: {type: mongoose.Schema.ObjectId, ref: 'users'},  
                nickNm: {type: String, 'default': 'noName'},
                boardid: {type: String, trim:true, 'default': ' '}, 
                parentreplyid: {type: mongoose.Schema.ObjectId, 'default': ' ' }, //부모 댓글의 id
                rootreplyid: {type: mongoose.Schema.ObjectId, 'default': ' ' }, //루트 댓글의 id
                likes: {type: Number, unique: false, 'default': 0},
                contents: {type: String, trim:true, 'default': ' '},
                pictures: {type: String, trim:true, 'default': ' '}, 
                created_at: {type: Date, 'default': utils.timestamp()}, 
            }]
    });  
    NotificationSchema.index({created_at: -1}, { autoIndex: false}, {unique: false})

    NotificationSchema.methods = {
		saveNotification: function(callback) {		// 글 저장
			var self = this;
			
			this.validate(function(err) {
				if (err) return callback(err);
				
				self.save(callback);
			});
        } 
    }
    console.log('NotificationSchema 정의함.');
	return NotificationSchema;
};

// module.exports에 NotificationSchema 객체 직접 할당
module.exports = SchemaObj;

