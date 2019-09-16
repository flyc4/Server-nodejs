/**
 * 강의 평가 게시물의 교수 프로필 저장을 위한 데이터베이스 스키마를 정의하는 모듈
 *
 * @date 2019-09-13
 * @author 김창희
 */

var SchemaObj = {};
SchemaObj.createSchema = function(mongoose) {
    
    // 스키마 정의. 
	ProfessorSchema = mongoose.Schema({
      
        professor: {type: String, trim: true, 'default':''}, 
        school: {type: String, trim: true, 'default':''}, //해당 교수의 소속 학교  
        created_at: {type: Date, index: {unique: false}, 'default': Date.now} //index 부여를 위한 필드
    });  

	console.log('ProfessorSchema 정의함.');
	return ProfessorSchema;
} 

module.exports = SchemaObj;