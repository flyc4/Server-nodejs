/**
 *  Board1에 대한 스키마
 * 
 */ 

var utils = require('../config/utils')

var SchemaObj = {};
SchemaObj.createSchema = function(mongoose) {
	
	// 게시판 스키마 정의
	var Board1Schema = mongoose.Schema({ 
    
            userid: {type: mongoose.Schema.ObjectId, ref: 'users'}, 
            nickNm: {type: String, 'default': 'noName'},
            profile: {type: String, trim:true, 'default': ' '},// 게시글 옆 사진
            likes: {type: Number, unique: false, 'default': 0},
            created_at: {type: Date, 'default': utils.timestamp()},
            title: {type: String, trim:true, 'default': ' '},
            contents: {type: String, trim:true, 'default': ' '},
            pictures: {type: String, trim:true, 'default': ' '},  //링크
            hits: {type: Number, unique: false, 'default': 0}, // 조회 수    
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
    console.log('BulletinBoardsSchema 정의함.');
	return Board1Schema;
};



// module.exports에 PostSchema 객체 직접 할당
module.exports = SchemaObj;

