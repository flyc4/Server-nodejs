var SchemaObj = {};
var mongoose = require('mongoose'); 
var ObjectId = mongoose.Types.ObjectId; 

SchemaObj.createSchema = function(mongoose) {
	
	// 시간표 리스트 스키마 정의
	var TimetableSchema = mongoose.Schema({ 
        
        //_id: 각 시간표들을 구분하는 ObjectId. MongoDB에서 기본적으로 주어지는 값이므로 미작성
	    userid: {type: mongoose.Schema.ObjectId, ref: 'users'}, //시간표 주인   
        title: {type: String, trim: true, 'default':'no title', required: true}, // 2019년 1학기 처럼 제목.
        isdefaultview: {type: Boolean, defualt: false }, // 기본적으로 보여지는 시간표
        created_at: {type: Date, 'default': Date.now}, //생성 날짜
        
        // 과목
        courses: [{		
	    	//_id: 각 과목들을 구분하는 ObjectId. MongoDB에서 기본적으로 주어지는 값이므로 미작성
            subject: {type: String, trim: true, 'default':'no name', required: true}, //과목명
            professor: {type: String, trim: true, 'default':'no professor'}, //교수명
            starttime: {type: Number, trim: true, 'default':' ', required: true}, // 수업 시작 시간  
            starttimehour: {type: Number, trim: true, 'default':' ', required: true}, // 수업 시작 시간의 시(hour). 정렬 용도
            endtime: {type: Number, trim: true, 'default':' ', required: true}, // 수업 종료 시간 
            place: {type: String, trim: true, 'default':'no place'}, // 장소 
            day: {type: Number, trim: true, 'default':' ', required: true}, // 수강 요일( 0: 월요일, 1: 화요일...) 
            backgroundcolor: {type: String, trim: true, 'default':'#000000'}, //시간표에 나타낼 배경색

            timetableid: {type: mongoose.Schema.ObjectId, ref: 'timetable'},  //timetable 참조 
               
            created_at: {type: Date, 'default': Date.now},  //생성 날짜  
            
            // 하나의 시간표가 복수의 starttime, endtime, day를 지닐 경우 사용.  
            //starttime, endtime 은 하나의 시간표 안에서 day, starttime 를 기준으로 오름차순 정렬 시 0번 인덱스를 가지는 정보 
	    }], 
	});
module.exports = SchemaObj; 
    
TimetableSchema.methods = {

    saveTimetable: function(callback) {		// 시간표 저장
			var self = this;
			
			this.validate(function(err) {
				if (err) return callback(err);
				
				self.save(callback);
			});
		},    
    },    
    
    
TimetableSchema.statics = {
    // defaultview로 설정되어 있는 게 없으면 기본 보기로 설정. 아니면 반환
    setdefaultview: function(userId, Id, callback) {
        database.TimetableModel.find({userid: userId}, function(err,results){
            if (err) {
                    console.error('시간표 조회 중 에러 발생 : ' + err.stack);
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>시간표 조회 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return;
                }  
            var i = 0;
            for(; i<results.length; i++){ // 기존에 defaultview로 설정 되어 있는 게 있는 지 확인
                if(results.isdefaultview == true){
                    break;
                }
            }
            if(i<results.length){
                alert("이미 기본 보기로 설정한 시간표가 있습니다."); 
                res.redirect("process/timetable");
            } 
            else{
               database.TimetableModel.findOneAndUpdate({_id: Id}, 
                    { $set: { isdefaultview: true}}, {new: true}, function(err,doc){
                    if(err){
                    console.error('기본 보기로 설정할 시간표 조회 중 에러 발생 : ' + err.stack);
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>기본 보기로 설정할 시간표 조회 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return;
                    } 
                database.TimetableModel.save({_id: Id});
               })
                res.redirect("process/showdefaulttimetable/" + Id);        
            }    
        })            
    },             

}//imetableSchema.statics 닫기
return TimetableSchema;
};
module.exports = SchemaObj;
// module.exports에 TimetableSchema 객체 직접 할당
