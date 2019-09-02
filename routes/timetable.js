var mongoose = require('mongoose'); 
var jwt = require('jsonwebtoken');
var ObjectId = mongoose.Types.ObjectId;
//기본 보기로 설정한 시간표를 보여줍니다.
var showdefaulttimetable = function(req, res) { //기본 보기로 설정된 시간표를 보여준다.  
	console.log('timetable 모듈 안에 있는 showdefaulttimetable 호출됨.');
    var database = req.app.get('database'); 
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {  
		// 1. 시간표 중에서 기본 시간표로 설정된 시간표를 보여준다.
           
            database.TimetableModel.findOne(
            { 'usernickNm': expressSession.nickNm, isdefaultview: true},   
            function(err,result){ 
                if(err){ console.error('기본 보기로 설정한 시간표 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>기본 보기로 설정한 시간표 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            } 
            if(!result){ //기본 보기로 설정한 시간표가 없으면, userid를 찾은 후 listtimetable로 넘긴다.
                console.log("기본 설정으로 설정한 시간표가 없어서 시간표 목록으로 넘어감"); 
                
                database.UserModel.findOne(
                { 'nickNm': expressSession.nickNm},   
                function(err,userresult){ 
                    if(err){ console.error('시간표 항목을 조회한 사용자를 조회 중 에러 발생 : ' + err.stack);

                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>시간표 항목을 조회한 사용자를 조회 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return; 
                    } 
                return res.redirect("/process/listtimetable/"+userresult._id);  
                
                })
            }
            database.TimetableModel.aggregate([
            // Initial document match (uses index, if a suitable one is available), link: https://stackoverflow.com/questions/13449874/how-to-sort-array-inside-collection-record-in-mongodb
            { $match: { 
                _id: new ObjectId(result._id)}},   
            //Expand the courses array into a stream of documents
            { "$unwind": '$courses'},
            // Sort in ascending order
            { $sort: {
                'courses.day': 1
            }},  
            { $sort: {
                'courses.starttime': 1
            }},   
            ], function(err,data){ 
                if(err){ console.error('시간표 정렬 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>시간표 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            }    
            var maxday = 4;
            if(result.courses.length == 0){ //시간표 안에 신청한 강좌가 없을 때
                var context = {timetable: result,
                                maxday: maxday};
            }
            else{ //시간표 안에 신청 강좌가 있을 때. courses의 days 중 금요일(4) 보다 큰 토요일이나 일요일이 있는 지 확인
                
                for(var i=0;i<data.length;i++){
                    if(data[i].courses.day>maxday){
                        maxday = data[i].courses.day;
                    }
                }
                var context = {timetable: data,
                                maxday: maxday}; 
                
            }  
            req.app.render('showtimetable', context, function(err, html) {
					if (err) {
                        console.error('응답 웹문서 생성 중 에러 발생 : ' + err.stack);
                
                        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                        res.write('<h2>응답 웹문서 생성 중 에러 발생</h2>');
                        res.write('<p>' + err.stack + '</p>');
                        res.end();

                        return;
                    }
               else{  
                   res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                   res.end(html); 
               } 
            })//req.app.render 닫기 
        }) // aggregate 닫기 
                     
        })//findOne 닫기 
    }//if (database.db) 닫기
     
    else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	} 
}; //showdefaulttimetable 닫기 


var addtimetable = function(req, res) {
	console.log('timetable 모듈 안에 있는 addtimetable 호출됨.');
 
    var database = req.app.get('database')
    var paramTitle = req.body.title || req.query.title;
    var userNicknm = expressSession.nickNm; 
    
	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        
        // 1. userId를 획득하는 과정
		database.UserModel.findOneBynickNm(userNicknm, function(err, result) {
			if (err) {
                console.error('사용자 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return;
            }
			if (result == undefined) {
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>로그인이 되지 않았거나 끊겨졌습니다. 다시 로그인하시길 바랍니다.</h2>');
				res.redirect('/login');
				return;
			}
			var userId = result._id;
            
            var timetable = new database.TimetableModel({
                title: paramTitle,
                usernickNm: userNicknm,
                userid: userId, 
                isdefaultview: false
            });
            timetable.saveTimetable(function(err, result) {
                if (err) {
                    console.error('응답 웹문서 생성 중 에러 발생 : ' + err.stack);

                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>응답 웹문서 생성 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return;
                }
                console.log("시간표 추가 완료.");   
                return res.redirect('/process/listtimetable/'+userId);
            })			
             
        })//findBynickNm닫기
} else {
    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
    res.write('<h2>데이터베이스 연결 실패</h2>');
    res.end();
}
	
}; //addtimetable 닫기


var showdefaulttimetable = function(req, res) { //기본 보기로 설정된 시간표를 보여준다.  
	console.log('timetable 모듈 안에 있는 showdefaulttimetable 호출됨.');
    var database = req.app.get('database'); 
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {  
		// 1. 시간표 중에서 기본 시간표로 설정된 시간표를 보여준다.
           
            database.TimetableModel.findOne(
            { 'usernickNm': expressSession.nickNm, isdefaultview: true},   
            function(err,result){ 
                if(err){ console.error('기본 보기로 설정한 시간표 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>기본 보기로 설정한 시간표 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            } 
            if(!result){ //기본 보기로 설정한 시간표가 없으면, userid를 찾은 후 listtimetable로 넘긴다.
                console.log("기본 설정으로 설정한 시간표가 없어서 시간표 목록으로 넘어감"); 
                
                database.UserModel.findOne(
                { 'nickNm': expressSession.nickNm},   
                function(err,userresult){ 
                    if(err){ console.error('시간표 항목을 조회한 사용자를 조회 중 에러 발생 : ' + err.stack);

                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>시간표 항목을 조회한 사용자를 조회 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return; 
                    } 
                return res.redirect("/process/listtimetable/"+userresult._id);  
                
                })
            }
            database.TimetableModel.aggregate([
            // Initial document match (uses index, if a suitable one is available), link: https://stackoverflow.com/questions/13449874/how-to-sort-array-inside-collection-record-in-mongodb
            { $match: { 
                _id: new ObjectId(result._id)}},   
            //Expand the courses array into a stream of documents
            { "$unwind": '$courses'},
            // Sort in ascending order
            { $sort: {
                'courses.day': 1
            }},  
            { $sort: {
                'courses.starttime': 1
            }},   
            ], function(err,data){ 
                if(err){ console.error('시간표 정렬 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>시간표 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            }    
            var maxday = 4;
            if(result.courses.length == 0){ //시간표 안에 신청한 강좌가 없을 때
                var context = {timetable: result,
                                maxday: maxday};
            }
            else{ //시간표 안에 신청 강좌가 있을 때. courses의 days 중 금요일(4) 보다 큰 토요일이나 일요일이 있는 지 확인
                
                for(var i=0;i<data.length;i++){
                    if(data[i].courses.day>maxday){
                        maxday = data[i].courses.day;
                    }
                }
                var context = {timetable: data,
                                maxday: maxday}; 
                
            }  
            req.app.render('showtimetable', context, function(err, html) {
					if (err) {
                        console.error('응답 웹문서 생성 중 에러 발생 : ' + err.stack);
                
                        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                        res.write('<h2>응답 웹문서 생성 중 에러 발생</h2>');
                        res.write('<p>' + err.stack + '</p>');
                        res.end();

                        return;
                    }
               else{  
                   res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                   res.end(html); 
               } 
            })//req.app.render 닫기 
        }) // aggregate 닫기 
                     
        })//findOne 닫기 
    }//if (database.db) 닫기
     
    else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	} 
}; //showdefaulttimetable 닫기   

var listtimetable = function(req,res){ //해당 사용자의 모든 시간표를 보여줌. 파라미터로 받는 id는 user의 id다 
    console.log('timetable 모듈 안에 있는 listtimetable 호출됨.'); 
    
    var database = req.app.get('database');
    var paramUserId = req.query.userid || req.body.userid || req.params.id;
    
    //paramUserId 값이 안 들어 올 때: showdefaulttimetable 에서 기본 보기 설정한 시간표가 없을 때
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
		       
        database.TimetableModel.find({userid: new ObjectId(paramUserId)}, function(err,results){
            
            if(err){ console.error('사용자의 시간표 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자의 시간표 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            } 
            
            var context = {timetable: results};
            req.app.render('listtimetable', context, function(err, html) {    
            if (err) {
                    console.error('응답 웹문서 생성 중 에러 발생 : ' + err.stack);
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>응답 웹문서 생성 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return;
            }  
            else{  
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.end(html); 
               } 
            })//req.app.render 닫기       
        }).sort({'created_at': -1});//find 닫기  
    }//if (database.db) 닫기
    else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	}     
}; //listtimetable 닫기

var setdefaultview = function(req,res){ //해당 시간표를 기본 보기로 설정 
    console.log('timetable 모듈 안에 있는 setdefaultview 호출됨.'); 
    
    var paramId = req.query.id || req.body.id || req.param.id;
    var paramUserId = req.query.userid || req.body.userid || req.param.userid;
    var database = req.app.get('database');
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
		       
        database.TimetableModel.find({userid: new ObjectId(paramUserId), isdefaultview: true}, 
        
        function(err,results){    
            if(err){ console.error('사용자의 시간표 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자의 시간표 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            } 
            if(typeof results != 'undefined'){ // 이미 기본 보기로 설정되어 있는 시간표가 있는 경우
                console.log("이미 기본 보기로 설정되어 있는 시간표가 있는 상태에서 기본 보기 설정 시도"); 
                alert("이미 기본 보기로 설정되어 있는 시간표가 있습니다."); 
                return res.redirect(req.get('referer'));
            } 
            database.TimetableModel.findByIdAndUpdate(paramId,
            { $set: { "isdefaultview" : true}},{'new':true},function(err){
                
                if (err) {
                        console.error('기본 보기로 설정 할 시간표 검색 과정 중 에러 발생 : ' + err.stack);
                        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                        res.write('<h2>기본 보기로 설정 할 시간표 검색 과정 중 에러 발생</h2>');
                        res.write('<p>' + err.stack + '</p>');
                        res.end();
                        return res.redirect(req.get('referer'));
                   }
                console.log("기본 보기 설정 완료");
                return res.redirect(req.get('referer')); 
                
            }); //findByIdAndUpdate 닫기
            }//function(err,results) 닫기  
        ).sort({'created_at': -1});//find 닫기  
    }//if (database.db) 닫기
    else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	}     
}; //setdefaultview 닫기 

var unsetdefaultview = function(req,res){ //해당 시간표를 기본 보기로 설정 
    console.log('timetable 모듈 안에 있는 unsetdefaultview 호출됨.'); 
    
    var paramId = req.query.id || req.body.id || req.params.id;
    var paramUserId = req.query.userid || req.body.userid || req.params.userid;
    var database = req.app.get('database');
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
		       
        database.TimetableModel.findOne({_id: new ObjectId(paramId)}, 
        
        function(err,result){    
            if(err){ console.error('사용자의 시간표 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자의 시간표 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            } 
            if(!(result.isdefaultview)){ // 기본 보기로 설정되지 않은 시간표 일 경우
                console.log("기본 보기로 설정되어 있지 않은 시간표를 기본 보기 해제 시도"); 
                alert("기본 보기로 설정되어 있지 않은 시간표를 기본 보기 해제 시도"); 
                return res.redirect(req.get('referer'));
            } 
            database.TimetableModel.findByIdAndUpdate(paramId,
            { $set: { "isdefaultview" : false}},{'new':true},function(err){
                if (err) {
                        console.error('기본 보기로 설정 할 시간표 검색 과정 중 에러 발생 : ' + err.stack);
                        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                        res.write('<h2>기본 보기로 설정 할 시간표 검색 과정 중 에러 발생</h2>');
                        res.write('<p>' + err.stack + '</p>');
                        res.end();
                        return res.redirect(req.get('referer'));
                   }
                console.log("기본 보기 설정 해제 완료");
                return res.redirect(req.get('referer')); 
                
            }); //findByIdAndUpdate 닫기
            }//function(err,results) 닫기  
        ).sort({'created_at': -1});//find 닫기  
    }//if (database.db) 닫기
    else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	}     
}; //setdefaultview 닫기

var deletetimetable = function(req, res) { //사용자가 요구한 시간표를 삭제한다.  
	console.log('timetable 모듈 안에 있는 deletetimetable 호출됨.');
    var database = req.app.get('database');
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        paramId = req.query.id || req.body.id || req.params.id;
        database.TimetableModel.findOne({ _id: new ObjectId(paramId) }, function(err, result){
            if(err){ 
                console.error('삭제 할 시간표 조회 중 에러 발생 : ' + err.stack);
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>삭제 할 시간표 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            }  
            database.TimetableModel.deleteOne({_id: paramId}, function(err, result){
               if (err) {
                    console.error('삭제 과정 중 에러 발생 : ' + err.stack);
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>삭제 과정 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return res.redirect(req.get('referer'));
                }		
            })
            console.log("시간표 삭제 완료"); 
            return res.redirect('process/listtimetable/'+userid);
        })//findOne 닫기 
    }//if(database.db) 닫기 
    else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	} 
}; //deletetimetable 닫기 

// course에 관련된 함수들  
/*
var addcourse = function(req, res) {  // 수강 과목 추가
	console.log('timetable 모듈 안에 있는 addcourse 호출됨.'); 
    
    var paramId = req.query.id || req.body.id || req.param.id;   
    var paramsubject = req.query.subject || req.body.subject || req.param.subject;
    var paramprofessorname = req.query.professorname || req.body.professorname || req.param.professorname;
    var paramday = req.query.day || req.body.day || req.param.day;
    
    paramday = paramday*1; // 문자로 받은 값을 숫자로 변환
    
    // courses 시작 시간의 시, 분을 가져옴
    var paramstarttimehour = req.query.starttimehour || req.body.starttimehour || req.param.starttimehour;
    var paramstarttimeminute = req.query.starttimeminute || req.body.starttimeminute ||                         req.param.starttimeminute; 
    
    var paramstarttime = paramstarttimehour*100 + paramstarttimeminute*1;
    
    // courses 종료 시간의 시, 분을 가져옴
    var paramendtimehour = req.query.endtimehour || req.body.endtimehour || req.param.endtimehour;
    var paramendtimeminute = req.query.endtimeminute || req.body.endtimeminute ||                         req.param.endtimeminute;  
    
    var paramendtime = paramendtimehour*100 + paramendtimeminute*1;
	
    console.log("파라미터 id: ",paramId);
    console.log("파라미터 과목명: ",paramsubject);
    console.log("파라미터 교수명: ",paramprofessorname); 
    console.log("파라미터 날짜명: ",paramday); 
    console.log("파라미터 시작 시간: ",paramstarttime);
    console.log("파라미터 종료 시간: ",paramendtime);
    
	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        
        database.TimetableModel.findByIdAndUpdate(paramId,
            {'$push': {'courses': {'timetableid': paramId, 'subject':paramsubject, 'professorname': paramprofessorname, 'day': paramday, 'starttime': paramstarttime, 'endtime': paramendtime}}},
            {'new':true},function(err,result){
            
        if (err) {
                console.error('시간표 검색 과정 중 에러 발생 : ' + err.stack);
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>시간표 검색 과정 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
                res.end();
                return res.redirect(req.get('referer'));
           }
            console.log("수강과목 추가 완료");
            return res.redirect(req.get('referer')); 
        }); 
        } else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
        } 	 
}; //addcourse 닫기
*/ 

var deletecourse = function(req, res){  // paramId: course의 id, timetableId: timetable의 Id
    console.log('timetable 모듈 안에 있는 deletecourse 호출됨.');
    var paramId = req.param.id || req.body.id || req.query.id;   
    var courseId = req.body.courseid || req.query.courseid || req.param.courseid;

    console.log('요청 파라미터 : ', paramId + ", ", courseId);
    
	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
        database.TimetableModel.findByIdAndUpdate(paramId,
            {'$pull': {'courses': {'timetableid': paramId, '_id': courseId}}},
            function(err){
            
        if (err) {
                console.error('삭제할 과목이 있는 시간표 검색 과정 중 에러 발생 : ' + err.stack);
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>삭제할 과목이 있는 시간표 검색 과정 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
                res.end();
                return res.redirect(req.get('referer'));
           }
            console.log("수강과목 삭제 완료");
            return res.redirect(req.get('referer')); 
        });     
    } else {
    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
    res.write('<h2>데이터베이스 연결 실패</h2>');
    res.end();
    } 
    
}; //deletecourse 닫기 

//----- react native와 연동 


//기본 보기로 설정한 시간표가 있는 지 확인.  
// 시간표가 있을 시: id& isdefaultview = true / 없을 시: isdefaultview = false
var checkdefaulttimetable = function(req, res) { 
	console.log('timetable 모듈 안에 있는checkdefaulttimetable 호출됨.');
    var database = req.app.get('database');  

    var paramjwt = req.body.jwt||req.query.jwt||req.param.jwt; 
    var secret = "HS256";
    var paramnickNm = jwt.verify(paramjwt,secret).nickNm; 

    /*
    hascourses: 해당 시간표 안에 강의 과목이 하나라도 있는 지 확인 
    couseslist: 시간표들을 시간표들을 시작 시간(hour) 별로 분류한 후, object array 에 저장 
    courseslist.starttimehour: 분류된 각 시간표들의 시작 시간 
    courseslist.maxday: 시간표들의 한 묶음에서 가장 큰 day(요일)의 값을 지닌다 
    courseslist.courses: 시간(hour) 별로 분류한 시간표들을 저장  
    courseslist.courses.index: 해당 시간표의 고유 번호 data 에서의 index 
    courseslist.courses.value: 해당 시간표가 밖으로 보여질 내용 
    courseslist.courses.backgroundcolor: 해당 시간표의 랜덤 backgroundcolor
    courseslist.courses.course: 해당 시간표 저장 
    */ 

   var context = {'default_timetable': false, timetableid: ""}  
    // 데이터베이스 객체가 초기화된 경우. 요청한 사용자를 조회
	if (database.db) {   
        database.UserModel.findOneBynickNm(paramnickNm, function(err,user){
            if(err){ 
                console.error('checkdefaulttimetable를 요청한 사용자를 조회 중 에러 발생 : ' + err.stack); 
                res.end(); 
                return;  
            }
            if(!user){
                console.log('checkdefaulttimetable를 요청한 사용자를 찾을 수 없음'); 
                res.end();   
                return;
            }
            if(user){  
                context.userid = user._id; 
                // 기본 보기로 설정한 시간표가 있는 지 확인
                database.TimetableModel.findOne(
                    { 'userid': user._id, isdefaultview: true},   
                    function(err,result){ 
                        if(err){ 
                        console.error('기본 보기로 설정한 시간표 조회 중 에러 발생 : ' + err.stack);
                        res.end();
                        return; 
                    } 
                    //기본 보기로 설정한 시간표가 없을 경우
                        if(!result){ 
                            console.log("기본 설정으로 설정한 시간표가 없어서 시간표 목록으로 넘어감"); 
                            res.json(context);
                            return;    
                    }
                    //기본 보기로 설정한 시간표가 있을 경우 
                    context.default_timetable = true; 
                    context.timetable = result; 
                    res.json(context);
                    return;  
                })//findOne 닫기  
            } 
        })    
    }else {
        console.log('데이터베이스 연결 실패');
        res.end();
    }             
}; //checkdefaulttimetable 닫기 

//기본 보기로 설정한 시간표가 있다면 해당 시간표를, 없을 경우 시간표의 전체 목록을 보여줍니다. 
//예상 결과: 에러, 기본 보기로 설정한 시간표가 없음, 
//기본 보기로 설정한 시간표가 있으나 시간표 안에 수강 과목이 없음(hascourses == false), 
//기본 보기로 설정한 시간표 + 그 안에 수강 과목 있음  


var showtimetable = function(req, res) { 
    console.log('timetable 모듈 안에 있는 showtimetable 호출됨.');
    
    var database = req.app.get('database');  
    var paramtimetableid = req.body.timetableid||req.query.timetableid||req.param.timetableid; 

    /*
    hascourses: 해당 시간표 안에 강의 과목이 하나라도 있는 지 확인 
    couseslist: 시간표들을 시간표들을 시작 시간(hour) 별로 분류한 후, object array 에 저장 
    courseslist.starttimehour: 분류된 각 시간표들의 시작 시간 
    courseslist.maxday: 시간표들의 한 묶음에서 가장 큰 day(요일)의 값을 지닌다 
    courseslist.courses: 시간(hour) 별로 분류한 시간표들을 저장  
    courseslist.courses.index: 해당 시간표의 고유 번호 data 에서의 index 
    courseslist.courses.value: 해당 시간표가 밖으로 보여질 내용 
    courseslist.courses.backgroundcolor: 해당 시간표의 랜덤 backgroundcolor
    courseslist.courses.course: 해당 시간표 저장 
     */ 
   var context = { timetable: {}, 'hascourses': false, 
   'courseslist': [{'starttimehour': 0, 'maxday': 0, 
                  'courses': [{'index': -1, 'value': "", 'course': {} }] 
   }]
   }; 

    // 데이터베이스 객체가 초기화된 경우. 파라미터로 받은 timetableid(paramtimetableid)로 해당 시간표 조회
	if (database.db) { 
        
        //기본 보기로 설정한 시간표가 있을 경우. document match, link: https://stackoverflow.com/questions/13449874/how-to-sort-array-inside-collection-record-in-mongodb
        database.TimetableModel.aggregate([
        { $match: { 
        _id: new ObjectId(paramtimetableid)}},   

        //Expand the courses array into a stream of documents
        { "$unwind": '$courses'},
        // Sort in ascending order
        { $sort: {
        'courses.day': 1
        }},  
        { $sort: {
        'courses.starttimehour': 1 // 이 정렬이 courses.day의 정렬 보다 우선하는 것 같다.
        }},   
        ], function(err,data){ 
            if(err){ 
                console.error('showtimetable 안에서 시간표 정렬 중 에러 발생 : ' + err.stack);
                res.end();  
            }    
            //시간표 정렬 성공 
            else{                           
                context.hascourses = !(data[0] == 'undefined');    
            
                //기본 시간표에 과목이 없을 경우 끝냄 
                if(!context.hascourses){
                    res.json(context);   
                    return;
                }
                /*
                courseslist 구성하는 과정.   
                context.courses에 data[0].courses 의 정보들 (starttimehout, day, courses를 삽입 후 시작) 
                maxday =-1 => 해당 시간표 배열은 비워 있음을 나타냄.
                
                starttimehour: data[0]의 시간(hour) 로 초기화. 현재의 시간(hour)이 data[i]의 시간(hour) 과 동일한 지 여부의 체크 
                currentstarttimehour: data[i].starttime의 시간(hour) 
                
                starttimehour == currentstarttimehour일 경우, 
                context.courseslist.maxday 교체 및 context.courseslist.courses 에 data[i].courses 추가    
                참고: aggregate를 통해 starttime 의 오름차순으로 정렬함.
                
                starttimehour != currentstarttimehour일 경우, 
                context.courseslist 에 push를 한 후, 새로운 내용(starttimehour, maxday, courses) 삽입 
                starttimehour 를 currentstarttimehour로 변경 

                currentstarttimehour - starttimehour >1 인 경우 
                ex. 금요일 9시 시작 수업 이 후 월요일 14시 시작 수업 삽입하는 경우
                
                courseslist[0] 관련 요소들 정의. 
                원래 courseslist[0] 'courseslist': [{'starttimehour': 0, 'maxday': 0, 
                  'courses': [{'index': -1, 'value': "", 'backgroundcolor': '','course': {} }] 
                이므로 이를 data[0]의 내용으로 바꾸어야 함.
                */    

                var day = ["Mon","Tue","Wed","Thu","Fri"]
                var starttimehour = Math.floor(data[0].courses.starttime/100); 
                var value = data[0].courses.subject + "\n" + data[0].courses.starttime + "\n" + data[0].courses.endtime 
                            + "\n" + day[data[0].courses.day]

                // 각 시간표 별 랜덤 backgroundcolor 생성. 임의로 rgb(204,0,204) ~ rgb(255, 170, 128) 범위만 사용
                
                
                context.courseslist.push({starttimehour: starttimehour, maxday: data[0].courses.day}); 
                context.courseslist[1].courses = [{'index': 0, 'value': value, 'course': data[0].courses }];
                context.courseslist = context.courseslist.splice(1,1); 

                var j = 0; //courseslist의 index
                var maxendtimehour = Math.floor(data[0].courses.endtime/100); //가장 큰 endtimetimehour 저장. 시간표의 전체 행 수를 정하기 위함
                for(var i=1;i<data.length;i++)
                {   
                    var currentstarttimehour = Math.floor(data[i].courses.starttime/100); 
                    var currentendtimehour = Math.floor(data[i].courses.endtime/100);
                    var value = data[i].courses.subject + "\n" + data[i].courses.starttime + "\n" + data[i].courses.endtime 
                                + "\n" + day[data[i].courses.day]
            
                    maxendtimehour = maxendtimehour < currentendtimehour? currentendtimehour:maxendtimehour;  
                    
                    if(starttimehour == currentstarttimehour){
                        context.courseslist[j].maxday = data[i].courses.day; 
                        console.log("data[i].courses.day: ", data[i].courses.day)
                        context.courseslist[j].courses.push({index: i, value: value, course: data[i].courses})
                    }  
            
                    else{  
                        if(currentstarttimehour - starttimehour >1){
                            j++; 
                            for(var k=0;k<currentstarttimehour-starttimehour-1;k++){
                                context.courseslist.push({starttimehour: starttimehour+(k+1), maxday: -1})  
                                context.courseslist[j].courses = [{index: -1, value: "", course: {} }];         
                                j++;
                            } 
                        }   
                        context.courseslist.push({starttimehour: currentstarttimehour, maxday: data[i].courses.day})
                        context.courseslist[j].courses = [{index: i, value: value, course: data[i].courses}];
                        starttimehour = currentstarttimehour; 
                        j++;
                    }
                }//for문 닫기  

                //시간표의 마지막 부분 채우기. ex. 13~15 수업의 경우, 위의 for문으로는 context.courseslist.starttimehour가 13까지 밖에 없다. 나머지 14,15시를 여기서 채운다.
                var laststarttimehour = context.courseslist[context.courseslist.length-1].starttimehour;
                for(var i=0; i< maxendtimehour-laststarttimehour;i++){
                    context.courseslist.push({starttimehour: laststarttimehour+(i+1), maxday: -1})  
                    context.courseslist[j].courses = [{index: -1, value: "", course: {} }]; 
                }  
                console.dir(context.courseslist) 
                console.log(context.courseslist[0].courses[1].course.professor)
                res.json(context);   
                return; 
            }//else 닫기  
        }); // aggregate 닫기   
    }//if (database.db) 닫기                
    else {
        console.log('데이터베이스 연결 실패');
        res.end();
    }  
}; //showtimetable 닫기 


// course에 관련된 함수들  

// 수강 과목 추가. 
// starttimehour, starttimeminute, endtimehour, endtimeminute, day의 기본 값을 0으로 설정(react 에서 0선택이 안 되서) 
var addcourse = function(req, res) {  
	console.log('timetable 모듈 안에 있는 addcourse 호출됨.'); 
    
    var paramId = req.body.timetableid||req.query.timetableid||req.param.timetableid;   
    var paramsubject = req.query.subject || req.body.subject || req.param.subject;
    var paramprofessor = req.query.professor || req.body.professor || req.param.professor;
    var paramday = req.query.day || req.body.day || req.param.day||0;
    
    paramday = paramday*1; // 문자로 받은 값을 숫자로 변환
    
    // courses 시작 시간의 시, 분을 가져옴
    var paramstarttimehour = req.query.starttimehour || req.body.starttimehour || req.param.starttimehour||0;
    var paramstarttimeminute = req.query.starttimeminute || req.body.starttimeminute || req.param.starttimeminute||0; 
    
    var paramstarttime = paramstarttimehour*100 + paramstarttimeminute*1;
    
    // courses 종료 시간의 시, 분을 가져옴
    var paramendtimehour = req.query.endtimehour || req.body.endtimehour || req.param.endtimehour||0;
    var paramendtimeminute = req.query.endtimeminute || req.body.endtimeminute || req.param.endtimeminute||0;  
    
    var paramendtime = paramendtimehour*100 + paramendtimeminute*1;
    
    console.log("paramstarttimehour: ",paramstarttimehour);
    console.log("paramstarttimeminute: ",paramstarttimeminute); 
    console.log("paramendtimehour: ",paramendtimehour);
    console.log("paramendtimeminute: ",paramendtimeminute);


    var backgroundcolortwodigits = function(mul,add){ 
        return Math.floor(Math.random()*mul) + add; 
    }
    var localbackgroundcolor = "rgb("+backgroundcolortwodigits(42,204)+','+backgroundcolortwodigits(171,0)+','
                                +backgroundcolortwodigits(77,128)+')';

    console.log("파라미터 id: ",paramId);
    console.log("파라미터 과목명: ",paramsubject);
    console.log("파라미터 교수명: ",paramprofessor); 
    console.log("파라미터 날짜명: ",paramday); 
    console.log("파라미터 시작 시간: ",paramstarttime);
    console.log("파라미터 종료 시간: ",paramendtime);
    
	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) { 

        //이미 동명의 과목을 추가했다면, backgroundcolor의 값을 그 과목의 색깔로 설정한다.
        database.TimetableModel.findOne({ _id: new ObjectId(paramId)}, function(err,timetable){
            if (err) {
                console.error('시간표 내 동명의 과목 검색 과정 중 에러 발생 : ' + err.stack);
                res.end();
                return;
           } 
           timetable.courses.map( (course) => {    
                if(paramsubject == course.subject){ 
                    console.log("I'm in if statement")
                    localbackgroundcolor = course.backgroundcolor;  
                    console.log("course.backgroundcolor: ",course.backgroundcolor)
                }  
                //중복된 시간대 추가 방지
                if(paramday == course.day&&(paramstarttime<course.endtime||paramendtime>course.starttime)){
                    console.log("기존의 시간표와 중복된 영역") 
                    return;
                } 
                else{ 
                    database.TimetableModel.findByIdAndUpdate(paramId,
                        {'$push': {'courses': {'timetableid': paramId, 'subject':paramsubject, 'professor': paramprofessor, 
                        'day': paramday, 'starttime': paramstarttime, 'starttimehour': Math.floor(paramstarttime/100),
                        'endtime': paramendtime, 'backgroundcolor': localbackgroundcolor}}},
                        {'new':true},function(err,result){
                    
                    if (err) {
                        console.error('시간표 검색 과정 중 에러 발생 : ' + err.stack);
                        res.end();
                        return;
                    }
                    console.log("수강과목 추가 완료");
                    return; 
                    });//findByIdAndUpdate 닫기 
                }//else 닫기 
            })//timetable.courses.map닫기
        })//database.TimetableModel.findOne닫기 
    }else {
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write('<h2>데이터베이스 연결 실패</h2>');
            res.end();
            } 	 
}; //addcourse 닫기


module.exports.addtimetable = addtimetable;
module.exports.showdefaulttimetable = showdefaulttimetable;
module.exports.showtimetable = showtimetable; 
module.exports.listtimetable = listtimetable; 
module.exports.setdefaultview = setdefaultview;
module.exports.unsetdefaultview = unsetdefaultview;
module.exports.deletetimetable = deletetimetable;  
module.exports.addcourse = addcourse;
module.exports.deletecourse = deletecourse;  
module.exports.checkdefaulttimetable = checkdefaulttimetable;

