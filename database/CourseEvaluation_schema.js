/**
 * @description 강의평가의 스키마 정의 
 * @author Chang Hee
 */

//createSchema 함수를 저장할 객체. module.exports에 할당하기 위함
const utils = require('../config/utils');
let SchemaObj = {}; 

/**
 * @description CourseEvaluation의 스키마 정의 
 * @param {Object} mongoose
 * @returns {Object} courseEvaluationSchema
 */
SchemaObj.createSchema = function(mongoose) {

	const courseEvaluationSchema = mongoose.Schema({ 
        
        professorId : {type: mongoose.Schema.ObjectId, ref: 'professors'}, //professors 컬렉션 참조. professor의 id 값 
        subject: {type: String, trim: true, default:''}, // 과목명
        professor: {type: String, trim: true, default:''}, //교수명 
        institution: {type: String, trim: true, default:''}, //교수의 소속 기관
        overallRating : {type: Number, default: 0}, //평점 평균
        exam : {type: String, trim: true, default:''}, //comments.assignment 의 평균 값. 반올림
        assignment : {type: String, index: {unique: false}, trim: true, default:''}, // comments.assignment의 최빈 값
        difficulty : {type: String, trim: true, default:''}, // comments.difficulty 의 최빈 값
        grade : {type: String, trim: true, default:''}, // comments.grades 의 최빈 값
        created_at: {type: Date, default: utils.timestamp()},
        comments: [{ //해당 과목의 개개의 평가 
            _id: {type: mongoose.Schema.ObjectId, default: new mongoose.Types.ObjectId()}, //uniqueId. 신고 기능에 사용하기 위함.  
            userId: {type: mongoose.Schema.ObjectId, ref: 'users'}, //댓글 작성자를 구분하기 위한 id 
            nickNm: {type: String, trim: true, default: 'noName'}, //댓글 작성자의 닉네임
            contents: {type: String, trim: true, default: 'no comment'}, //강의 평가 내용
            exam: {type: String, trim: true, default: 'no comment'}, //해당 사용자가 입력한 해당 과목의 시험 수. 사용자가 입력한 강의 평가가 없을 경우 'N/A'가 되므로 String으로 설정. 
            assignment: {type: String, trim: true, default: 'no comment'}, //해당 사용자가 입력한 과제 수. 사용자가 입력한 강의 평가가 없을 경우 'N/A'가 되므로 String으로 설정.
            grade: {type: String, trim: true}, //해당 사용자가 획득한 해당 과목 학점. 사용자가 입력한 강의 평가가 없을 경우 'N/A'가 되므로 String으로 설정.
            difficulty: {type: String, trim: true}, ////해당 사용자가 입력한 해당 과목의 난이도
			rating: {type: Number, default: 0}, //해당 사용자가 입력한 해당 과목의 평점. 0-5  
            likes: {type: Number, default: 0}, 
            likesList: [{
                userId: {type: mongoose.Schema.ObjectId, ref: 'users'},  
                nickNm: {type: String, default: 'noName'}
            }],  
            created_at: {type: Date, default: utils.timestamp()},
        }]
    });    
    
	courseEvaluationSchema.index({professor: 1 , subject: 1}, {unique: true})
	console.log('CourseEvaluationSchema 정의함.');
	return courseEvaluationSchema;
};

module.exports = SchemaObj;

