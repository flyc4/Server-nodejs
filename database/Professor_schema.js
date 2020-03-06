/**
 * @description 교수 정보를 저장하는 스키마 정의 (프런트 엔드 개발 완료 후 수정 가능)
 * @author Chang Hee
 */

const utils = require('../config/utils');
//createSchema 함수를 저장할 객체. module.exports에 할당하기 위함  
let SchemaObj = {}; 

/**
 * @description 교수 정보의 스키마 정의 
 * @param {Object} mongoose
 * @returns {Object} professorSchema
 */
SchemaObj.createSchema = function(mongoose) {
    
    // 스키마 정의. 
	professorSchema = mongoose.Schema({
      
        professor: {type: String, trim: true, default:''}, 
        school: {type: String, trim: true, default:''}, //해당 교수의 소속 학교  
        created_at: {type: Date, index: {unique: false}, default: utils.timestamp()} //index 부여를 위한 필드
    });  
	console.log('professorSchema 정의함.');
	return professorSchema;
} 

module.exports = SchemaObj;