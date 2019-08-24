var SchemaObj = {};

SchemaObj.createSchema = function(mongoose) {
	
	// 시간표 리스트 스키마 정의
	var TimetableSchema = mongoose.Schema({ 
    
	    userid: {type: mongoose.Schema.ObjectId, ref: 'users'}, //시간표 주인  
	    usernickNm:{type: String, default: " "}, 
        title: {type: String, trim: true, 'default':'no title', required: true}, // 2019년 1학기 처럼 제목.
        isdefaultview: {type: Boolean, defualt: false }, // 기본적으로 볼 시간표
        created_at: {type: Date, 'default': Date.now},
        courses: [{		// 과목
	    	timetableid: {type: mongoose.Schema.ObjectId, ref: 'timetable'},  //timetablechema 참조
            subjectname: {type: String, trim: true, 'default':'no name', required: true}, //과목명
            professorname: {type: String, trim: true, 'default':'no professor'}, //교수명
            day: {type: Number, trim: true, 'default':' ', required: true}, // 수강 요일( 0: 월요일, 1: 화요일...)   
            starttime: {type: Number, trim: true, 'default':' ', required: true}, // 수업 시작 시간 
            endtime: {type: Number, trim: true, 'default':' ', required: true},
	    	created_at: {type: Date, 'default': Date.now},  
            
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
    
    /*sortcourses: function(Id){
        TimetableSchema.timetables.aggregate(
            // Initial document match (uses index, if a suitable one is available), link: https://stackoverflow.com/questions/13449874/how-to-sort-array-inside-collection-record-in-mongodb
            
            { $match: {
                _id : Id
            }},
            // Expand the courses array into a stream of documents
            { $unwind: '$courses'},

            // Sort in ascending order
            { $sort: {
                'courses.day': 1
            }},  
            
            { $sort: {
                'courses.starttime': 1
            }}
        ) 
    return TimetableSchema;
    }*/ 
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
                if(results._doc.isdefaultview == true){
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
