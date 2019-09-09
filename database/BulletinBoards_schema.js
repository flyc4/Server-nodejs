/**
 * 하나의 게시판을 위한 데이터베이스 스키마를 정의하는 모듈
 * 
 */

var SchemaObj = {};
SchemaObj.createSchema = function(mongoose) {
	
	// 게시판 스키마 정의
	var BulletinBoardsSchema = mongoose.Schema({ 
    
            userid: {type: mongoose.Schema.ObjectId, ref: 'users'}, 
            profile: {type: String, trim:true, 'default': ' '},// 게시글 옆 사진
            likes: {type: Number, unique: false, 'default': 0},
            created_at: {type: Date, 'default': Date.now},
            title: {type: String, trim:true, 'default': ' '},
            contents: {type: String, trim:true, 'default': ' '},
            pictures: {type: String, trim:true, 'default': ' '},  //링크
            hits: {type: Number, unique: false, 'default': 0}, // 조회 수    
            comments: [{   // 댓글           
                parentreplyid: {type: mongoose.Schema.ObjectId, 'default': ' ' }, //부모 댓글의 id
                rootreplyid: {type: mongoose.Schema.ObjectId, 'default': ' ' }, //루트 댓글의 id
                userid: {type: mongoose.Schema.ObjectId, ref: 'users'},
                likes: {type: Number, unique: false, 'default': 0},
                created_at: {type: Date, 'default': Date.now},
                contents: {type: String, trim:true, 'default': ' '},
                pictures: {type: String, trim:true, 'default': ' '}, 
            }]
    });
	console.log('BulletinBoardsSchema 정의함.');
	return BulletinBoardsSchema;
};

// module.exports에 PostSchema 객체 직접 할당
module.exports = SchemaObj;

