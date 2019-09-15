/**
 * 강의 평가 게시물을 위한 데이터베이스 스키마를 정의하는 모듈
 *
 * @date 2019-09-13
 * @author 김창희
 */

var SchemaObj = {};
SchemaObj.createSchema = function(mongoose) {
	
	//스키마 정의
	var CourseEvaluationSchema = mongoose.Schema({ 
        
        professorid : {type: mongoose.Schema.ObjectId, ref: 'Professor'}, //professorID 임
        subject: {type: String, trim: true, 'default':''},
        professor: {type: String, trim: true, 'default':''},
        institution: {type: String, trim: true, 'default':''}, //교수의 소속
        overallrating : {type: Number, 'default': 0}, //평점 평균. 반올림 
        exam : {type: String, trim: true, 'default':''},
        assignment : {type: String, index: {unique: false}, trim: true, 'default':''}, // comments.assignment 의 최빈 값
        difficulty : {type: String, trim: true, 'default':''}, // comments.difficulty 의 최빈 값
        grade : {type: String, trim: true, 'default':''}, // comments.grades 의 최빈 값
        created_at: {type: Date, 'default': Date.now},
        comments: [{ 
            _id: {type: mongoose.Schema.ObjectId}, //uniqueId. 신고 기능에 사용하기 위함.
            userid: {type: mongoose.Schema.ObjectId, ref: 'users'}, //commenterID
            nickNm: {type: String, trim: true, 'default': 'noName'}, //commenterName
            contents: {type: String, trim: true, 'default': 'no comment'}, //comment : 댓글 : String.
            exam: {type: String, trim: true, 'default': 'no comment'}, //commenterExam : commenter가 입력한 시험수. String
            assignment: {type: String, trim: true, 'default': 'no comment'}, //commenterAssignment : commenter가 입력한 과제수. String
            grade: {type: String, trim: true},//commenterGrade : commenter가 입력한 학점. String
            difficulty: {type: String, trim: true},//commenterDifficulty : commenter가 입력한 수준. String
			rating: {type: Number, 'default': 0}, //rating : commenter가 입력한 rating. number (0-5) 
            likes: {type: Number, 'default': 0}, 
            unlikes: {type: Number, 'default': 0}, //싫어요  
            created_at: {type: Date, 'default': Date.now},
        }]
	});    
	CourseEvaluationSchema.index({professor: 1 , subject: 1}, { autoIndex: false}, {unique: true})
	
	console.log('CourseEvaluationSchema 정의함.');
	return CourseEvaluationSchema;
};

// module.exports에 CourseEvaluationSchema 객체 직접 할당
module.exports = SchemaObj;

