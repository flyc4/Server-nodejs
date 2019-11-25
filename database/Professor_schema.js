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