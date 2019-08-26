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

var showtimetable = function(req, res) { //기본 보기로 설정된 시간표를 보여준다.  
	console.log('timetable 모듈 안에 있는 showdtimetable 호출됨.');
    var database = req.app.get('database'); 
    
    var paramId = req.params.id;
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {  
		// 1. 시간표 중에서 기본 시간표로 설정된 시간표를 보여준다.
           
            database.TimetableModel.findOne(
            { _id: new ObjectId(paramId)},   
            function(err,result){ 
                if(err){ console.error('선택한 시간표 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>선택한 시간표 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            } 
            if(!result){ //선택한 시간표가 없으면, userid를 찾은 후 listtimetable로 넘긴다.
                console.log("선택한 시간표가 없어서 시간표 목록으로 넘어감"); 
                
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
}; //showtimetable 닫기   

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

var addcourse = function(req, res) {  // 수강 과목 추가
	console.log('timetable 모듈 안에 있는 addcourse 호출됨.'); 
    
    var paramId = req.query.id || req.body.id || req.param.id;   
    var paramsubjectname = req.query.subjectname || req.body.subjectname || req.param.subjectname;
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
    console.log("파라미터 과목명: ",paramsubjectname);
    console.log("파라미터 교수명: ",paramprofessorname); 
    console.log("파라미터 날짜명: ",paramday); 
    console.log("파라미터 시작 시간: ",paramstarttime);
    console.log("파라미터 종료 시간: ",paramendtime);
    
	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        
        database.TimetableModel.findByIdAndUpdate(paramId,
            {'$push': {'courses': {'timetableid': paramId, 'subjectname':paramsubjectname, 'professorname': paramprofessorname, 'day': paramday, 'starttime': paramstarttime, 'endtime': paramendtime}}},
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

//기본 보기로 설정한 시간표가 있다면 해당 시간표를, 없을 경우 시간표의 전체 목록을 보여줍니다. 

var checkdefaulttimetable = function(req, res) { 
	console.log('timetable 모듈 안에 있는checkdefaulttimetable 호출됨.');
    var database = req.app.get('database');  

    var paramjwt = req.body.jwt||req.query.jwt||req.param.jwt; 
    var secret = "HS256";
    var paramnickNm = jwt.verify(paramjwt,secret).nickNm; 
    var context = {'checkdefaulttimetable': false, 'userid': '', timetable: {} };

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
                    database.TimetableModel.aggregate([
                    //document match, link: https://stackoverflow.com/questions/13449874/how-to-sort-array-inside-collection-record-in-mongodb
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
                        if(err){ 
                            console.error('checkdefaulttimetable 안에서 시간표 정렬 중 에러 발생 : ' + err.stack);
                            res.end();  
                        }    
                        else{                        
                            context.checkdefaulttimetable = true; 
                            context.timetable = data; 
                            console.log('context.checkdefaulttimetable: ', context.checkdefaulttimetable) 
                            res.json(context);   
                            return; 
                        }
                    }) // aggregate 닫기 
                })//findOne 닫기  
            } //if(user) 닫기
        })//UserModel.findOneBynickNm닫기
    }//if (database.db) 닫기                
    else {
        console.log('데이터베이스 연결 실패');
        res.end();
    }  
}; //checkdefaulttimetable 닫기 

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

