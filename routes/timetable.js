var mongoose = require('mongoose'); 
var jwt = require('jsonwebtoken');
var ObjectId = mongoose.Types.ObjectId;

//기본 보기로 설정한 시간표가 있는 지 확인.  
// 시간표가 있을 시: id& isdefaultview = true / 없을 시: isdefaultview = false
var checkdefaulttimetable = function(req, res) { 
	console.log('timetable 모듈 안에 있는checkdefaulttimetable 호출됨.');
    var database = req.app.get('database');  

    var paramjwt = req.body.jwt||req.query.jwt||req.param.jwt; 
    var secret = "HS256";
    var paramnickNm = jwt.verify(paramjwt,secret).nickNm; 

    /*
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
//기본 보기로 설정한 시간표 + 그 안에 수강 과목 있음  

var gettimetablelist = function(req, res) { 
	console.log('timetable 모듈 안에 있는 gettimetablelist 호출됨.');
    var database = req.app.get('database');  

    var paramjwt = req.body.jwt||req.query.jwt||req.param.jwt; 
    var secret = "HS256";
    var paramnickNm = jwt.verify(paramjwt,secret).nickNm;  

   var context = {timetable: {}, defaultview: false}  
    // 데이터베이스 객체가 초기화된 경우. 요청한 사용자를 조회
	if (database.db) {   
        database.UserModel.findOneBynickNm(paramnickNm, function(err,user){
            if(err){ 
                console.error('gettimetablelist를 요청한 사용자를 조회 중 에러 발생 : ' + err.stack); 
                res.end(); 
                return;  
            }
            if(!user){
                console.log('gettimetablelist를 요청한 사용자를 찾을 수 없음'); 
                res.end();   
                return;
            }
            if(user){   
                database.TimetableModel.find(
                    { 'userid': user._id}, 
                    function(err,results){ 
                        if(err){ 
                        console.error('gettimetablelist에서 시간표 조회 중 에러 발생 : ' + err.stack);
                        res.end();
                        return; 
                        } 
                        
                        var defaultview = false; 

                        for(var i=0;i<results.length;i++){
                            if(results[i].isdefaultview){
                                defaultview = true;
                            }
                        }
                        context.defaultview = defaultview;
                        context.timetablelist = results;  
                    
                        res.json(context);
                        return;  
                        })//find 닫기  
                } 
            })    
    }else {
        console.log('데이터베이스 연결 실패');
        res.end();
    }             
}; //gettimetablelist 닫기 

var showtimetable = function(req, res) { 
    console.log('timetable 모듈 안에 있는 showtimetable 호출됨.');
    
    var database = req.app.get('database');  
    var paramtimetableid = req.body.timetableid||req.query.timetableid||req.param.timetableid; 

    /*
    couseslist: 시간표들을 시간표들을 시작 시간(hour) 별로 분류한 후, object array 에 저장 
    courseslist.starttimehour: 분류된 각 시간표들의 시작 시간 
    courseslist.maxday: 시간표들의 한 묶음에서 가장 큰 day(요일)의 값을 지닌다 
    courseslist.courses: 시간(hour) 별로 분류한 시간표들을 저장  
    courseslist.courses.index: 해당 시간표의 고유 번호 data 에서의 index 
    courseslist.courses.value: 해당 시간표가 밖으로 보여질 내용 
    courseslist.courses.backgroundcolor: 해당 시간표의 랜덤 backgroundcolor
    courseslist.courses.course: 해당 시간표 저장 
     */ 
   var context = { timetable: {},  
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
                
                //기본 시간표에 과목이 없을 경우 끝냄 
                if(typeof data[0] == 'undefined'){ 
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
                var starttimehour = data[0].courses.starttimehour; 
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
                    var currentstarttimehour = data[i].courses.starttimehour; 
                    var currentendtimehour = Math.floor(data[i].courses.endtime/100);
                    var value = data[i].courses.subject + "\n" + data[i].courses.starttime + "\n" + data[i].courses.endtime 
                                + "\n" + day[data[i].courses.day]
            
                    maxendtimehour = maxendtimehour < currentendtimehour? currentendtimehour:maxendtimehour;  
                   
                    if(starttimehour == currentstarttimehour){
                        context.courseslist[j].maxday = data[i].courses.day; 
                        
                        context.courseslist[j].courses.push({index: i, value: value, course: data[i].courses})
                    }  
                    
                    else{  
                        j++;
                        if(currentstarttimehour - starttimehour >1){
                             
                            for(var k=0;k<currentstarttimehour-starttimehour-1;k++){
                                context.courseslist.push({starttimehour: starttimehour+(k+1), maxday: -1})  
                                context.courseslist[j].courses = [{index: -1, value: "", course: {} }];         
                                j++;
                            } 
                        }  
                        
                        context.courseslist.push({starttimehour: currentstarttimehour, maxday: data[i].courses.day})
                        context.courseslist[j].courses = [{index: i, value: value, course: data[i].courses}];
                        starttimehour = currentstarttimehour; 
                        
                    }
                }//for문 닫기  

                //시간표의 마지막 부분 채우기. ex. 13~15 수업의 경우, 위의 for문으로는 context.courseslist.starttimehour가 13까지 밖에 없다. 나머지 14,15시를 여기서 채운다.
                var laststarttimehour = context.courseslist[context.courseslist.length-1].starttimehour;
                for(var i=0; i< maxendtimehour-laststarttimehour;i++){ 
                    j++;
                    context.courseslist.push({starttimehour: laststarttimehour+(i+1), maxday: -1})  
                    context.courseslist[j].courses = [{index: -1, value: "", course: {} }];  
                }   
                res.json(context);   
                return; 
            }//else 닫기  
        }).collation({locale: "en_US", numericOrdering: true}); // aggregate 닫기   
    }//if (database.db) 닫기                
    else {
        console.log('데이터베이스 연결 실패');
        res.end();
    }  
}; //showtimetable 닫기  

//시간표를 추가한다 
var addtimetable = function(req, res) {
	console.log('timetable 모듈 안에 있는 addtimetable 호출됨.');
 
    var database = req.app.get('database')
    var paramtitle = req.body.title || req.query.title || req.param.title;
    var paramjwt = req.body.jwt||req.query.jwt||req.param.jwt; 
    var secret = "HS256";
    var paramnickNm = jwt.verify(paramjwt,secret).nickNm;  
    var paramdefaultview = req.body.defaultview||req.query.defaultview||req.query.defaultview;
    
	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        
        // 1. userId를 획득하는 과정
		database.UserModel.findOneBynickNm(paramnickNm, function(err, result) {
			if (err) {
                console.error('사용자 조회 중 에러 발생 : ' + err.stack);
				res.end();
                return;
            }
			if (result == undefined) {
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>로그인이 되지 않았거나 끊겨졌습니다. 다시 로그인하시길 바랍니다.</h2>');
				res.end()
				return;
			}
			var userid = result._id;
            
            var timetable = new database.TimetableModel({
                title: paramtitle,
                userid: userid, 
                isdefaultview: !(paramdefaultview)
            });
            timetable.saveTimetable(function(err, result) {
                if (err) {
                    console.error('응답 웹문서 생성 중 에러 발생 : ' + err.stack);
                    res.end();
                    return;
                }
                console.log("시간표 추가 완료.");   
                return;
            })	
        })//findOneBynickNm닫기
} else {
    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
    res.write('<h2>데이터베이스 연결 실패</h2>');
    res.end();
}
	
}; //addtimetable 닫기

//지정한 시간표의 title을 수정한다.
var renametimetable = function(req, res) {  
	console.log('timetable 모듈 안에 있는 renametimetable 호출됨.'); 
    
    var paramtimetableid = req.body.timetableid||req.query.timetableid||req.param.timetableid; 
    var paramtitle = req.body.title||req.query.title||req.param.title;   

    var context = {msg: " "} //사용자에게 전송할 메시지
	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) { 

        database.TimetableModel.findOne({ _id: new ObjectId(paramtimetableid)}, function(err,timetable){
            if (err) {
                console.error('시간표 조회 과정 중 에러 발생 : ' + err.stack);
                res.end();
                return;
           } 
           timetable.title = paramtitle;            
           timetable.saveTimetable(function(err) {
                if (err) {
                    console.error('응답 웹문서 생성 중 에러 발생 : ' + err.stack);
                    return; 
                }
            })			
            console.log("수정 완료") 
            context.msg = "수정 완료" 
            res.json(context); 
            return     
        })//TimetableModel.findOne 닫기
    }else {
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write('<h2>데이터베이스 연결 실패</h2>');
            res.end();
            } 	 
}; //renametimetable 닫기 


//사용자가 요구한 시간표를 삭제한다. 
var deletetimetable = function(req, res) {  
	console.log('timetable 모듈 안에 있는 deletetimetable 호출됨.');
    var database = req.app.get('database'); 

    var context = {msg: " "}
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        paramtimetableid = req.body.timetableid || req.query.timetableid || req.params.timetableid; 
        
        database.TimetableModel.deleteOne({_id: new ObjectId(paramtimetableid)}, function(err){
            if (err) {
                console.error('시간표 삭제 과정 중 에러 발생 : ' + err.stack);
                    context.msg = "시간표 삭제 과정 중 에러 발생"
                    res.json(context);
                    return;
            }		
        })
        console.log("시간표 삭제 완료"); 
        context.msg = "시간표 삭제 완료"
        res.json(context)
        return;
    }//if(database.db) 닫기 
    else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	} 
}; //deletetimetable 닫기

//사용자가 요구한 시간표의 isdefaultview 속성을 변경한다. 
// 이미 기본 보기로 설정한 시간표가 있다면 요청은 취소된다.  

var switchisdefaultview = function(req,res){ //해당 시간표를 기본 보기로 설정 
    console.log('timetable 모듈 안에 있는 setdefaultview 호출됨.'); 
    
    var paramtimetableid = req.query.timetableid || req.body.timetableid || req.param.timetableid;

    var database = req.app.get('database');
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {  
        
        database.TimetableModel.findOne({_id: new ObjectId(paramtimetableid)}, 
            function(err,result){   
                if(err){ console.error('switchisdefaultview에서 요청한 시간표 조회 중 에러 발생 : ' + err.stack);
				    res.end();
                    return; 
                } 
                if(result){ 
                    //isdefaultview를 false=> true로 변경하려는 경우. 해당 사용자의 시간표 중에서 이미 기본 보기로 설정된 시간표가 있는 지 확인한다.
                    var updatevalue = !result.isdefaultview; //업데이트 하고자하는 목표 값
                    if(!result.isdefaultview){
                        database.TimetableModel.findOne({userid: result.userid, isdefaultview: true}, 
                            function(err,timetable){
                                if(err){ console.error('switchisdefaultview에서 시간표의 사용자 조회 중 에러 발생 : ' + err.stack);
                                    res.end();
                                    return; 
                                } 
                                //이미 기본 보기로 설정한 시간표가 있을 때는 종료
                                if(timetable){ 
                                    res.end()
                                    return
                                } 
                        })//TimetableModel.findOne 닫기 
                    }//if(!result.isdefaultview)닫기
                    
                    //업데이트 
                    database.TimetableModel.findByIdAndUpdate(paramtimetableid,
                        { $set: { "isdefaultview" : updatevalue}},{'new':true},function(err){
                            
                            if (err) {
                                    console.error('switchisdefaultview에서 기본 보기를 변경할 시간표 검색 과정 중 에러 발생 : ' + err.stack);
                                    res.end();
                                    return;
                            }
                            console.log("기본 보기 설정 변경 완료");
                            return; 
                    }); //findByIdAndUpdate 닫기
                }// if(result) 닫기
            })//TimetableModel.findOne 닫기
    }//if (database.db) 닫기
    else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	}     
}; //switchisdefaultview 닫기 

// course에 관련된 함수들  

// 수강 과목 추가. 
// starttimehour, starttimeminute, endtimehour, endtimeminute, day의 기본 값을 0으로 설정(react 에서 0선택이 안 되서) 
var addcourse = function(req, res) {  
	console.log('timetable 모듈 안에 있는 addcourse 호출됨.'); 
    
    var paramtimetableid = req.body.timetableid||req.query.timetableid||req.param.timetableid;   
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
    
    if(paramstarttime > paramendtime){
        console.log("시작 시간이 종료 시간보다 큽니다.")
        context.msg = "시작 시간이 종료 시간보다 큽니다." 
        res.json(context)
        return;
    }
    var overrapedcourse = false; //기존의 시간표와 겹치는 지의 여부 나타냄 
    var context = {msg: " "} //사용자에게 전송할 메시지

    console.log("paramstarttimehour: ",paramstarttimehour);
    console.log("paramstarttimeminute: ",paramstarttimeminute); 
    console.log("paramendtimehour: ",paramendtimehour);
    console.log("paramendtimeminute: ",paramendtimeminute);

    
    var backgroundcolortwodigits = function(mul,add){ 
        return Math.floor(Math.random()*mul) + add; 
    }
    var localbackgroundcolor = "rgb("+backgroundcolortwodigits(42,204)+','+backgroundcolortwodigits(171,0)+','
                                +backgroundcolortwodigits(77,128)+')';

    console.log("파라미터 id: ",paramtimetableid);
    console.log("파라미터 과목명: ",paramsubject);
    console.log("파라미터 교수명: ",paramprofessor); 
    console.log("파라미터 날짜명: ",paramday); 
    console.log("파라미터 시작 시간: ",paramstarttime);
    console.log("파라미터 종료 시간: ",paramendtime);
    
	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) { 

        //이미 동명의 과목을 추가했다면, backgroundcolor의 값을 그 과목의 색깔로 설정한다.
        database.TimetableModel.findOne({ _id: new ObjectId(paramtimetableid)}, function(err,timetable){
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
                if(paramday == course.day)
                    if( (paramendtime>course.endtime&&paramstarttime<course.endtime)||
                        (paramendtime<course.endtime&&paramendtime>course.starttime)){
                        console.log("기존의 시간표와 중복된 영역")   
                        overrapedcourse = true; 
                        return;
                }  
            })//timetable.courses.map닫기  
            if(overrapedcourse) 
                {   
                    context.msg = "기존의 시간표와 중복된 영역" 
                    res.json(context);
                    return;
                }
            database.TimetableModel.findByIdAndUpdate(paramtimetableid,
                {'$push': {'courses': {'timetableid': paramtimetableid, 'subject':paramsubject, 'professor': paramprofessor, 
                'day': paramday, 'starttime': paramstarttime, 'starttimehour': Math.floor(paramstarttime/100),
                'endtime': paramendtime, 'backgroundcolor': localbackgroundcolor}}},
                {'new':true},function(err,result){
            
            if (err) {
                console.error('시간표 검색 과정 중 에러 발생 : ' + err.stack);
                res.end();
                return;
            }
            console.log("수강과목 추가 완료");
            context.msg = "수강과목 추가 완료"; 
            res.json(context)
            return; 
            });//findByIdAndUpdate 닫기 
        })//findOne 닫기
    }else {
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write('<h2>데이터베이스 연결 실패</h2>');
            res.end();
            } 	 
}; //addcourse 닫기 

// 수강 과목 추가. 
// starttimehour, starttimeminute, endtimehour, endtimeminute, day의 기본 값을 0으로 설정(react 에서 0선택이 안 되서) 
var editcourse = function(req, res) {  
	console.log('timetable 모듈 안에 있는 editcourse 호출됨.'); 
    
    var paramtimetableid = req.body.timetableid||req.query.timetableid||req.param.timetableid;   
    var paramsubject = req.query.subject || req.body.subject || req.param.subject;
    var paramprofessor = req.query.professor || req.body.professor || req.param.professor;
    var paramday = req.query.day || req.body.day || req.param.day||0;
    var paramcourseid = req.body.courseid||req.query.courseid||req.param.courseid;

    paramday = paramday*1; // 문자로 받은 값을 숫자로 변환
    
    // courses 시작 시간의 시, 분을 가져옴
    var paramstarttimehour = req.query.starttimehour || req.body.starttimehour || req.param.starttimehour||0;
    var paramstarttimeminute = req.query.starttimeminute || req.body.starttimeminute || req.param.starttimeminute||0; 
    
    var paramstarttime = paramstarttimehour*100 + paramstarttimeminute*1;
    
    // courses 종료 시간의 시, 분을 가져옴
    var paramendtimehour = req.query.endtimehour || req.body.endtimehour || req.param.endtimehour||0;
    var paramendtimeminute = req.query.endtimeminute || req.body.endtimeminute || req.param.endtimeminute||0;  
    
    var paramendtime = paramendtimehour*100 + paramendtimeminute*1;
    
    var overrapedcourse = false; //기존의 시간표와 겹치는 지의 여부 나타냄 
    var context = {msg: " "} //사용자에게 전송할 메시지

    console.log("파라미터 id: ",paramtimetableid);
    console.log("파라미터 과목명: ",paramsubject);
    console.log("파라미터 교수명: ",paramprofessor); 
    console.log("파라미터 날짜명: ",paramday); 
    console.log("파라미터 시작 시간: ",paramstarttime);
    console.log("파라미터 종료 시간: ",paramendtime);

    if(paramstarttime > paramendtime){
        console.log("시작 시간이 종료 시간보다 큽니다.")
        context.msg = "시작 시간이 종료 시간보다 큽니다." 
        res.json(context)
        return;
    } 

	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) { 

        //이미 동명의 과목을 추가했다면, backgroundcolor의 값을 그 과목의 색깔로 설정한다.
        database.TimetableModel.findOne({ _id: new ObjectId(paramtimetableid)}, function(err,timetable){
            if (err) {
                console.error('시간표 내 동명의 과목 검색 과정 중 에러 발생 : ' + err.stack);
                res.end();
                return;
           } 
           for(var i =0; i<timetable.courses.length;i++){      
                if(paramday == timetable.courses[i].day)
                    if( (paramendtime>=timetable.courses[i].endtime&&paramstarttime<timetable.courses[i].endtime)||
                        (paramendtime<=timetable.courses[i].endtime&&paramendtime>timetable.courses[i].starttime)){
                        console.log("기존의 시간표와 중복된 영역")   
                        context.msg = "기존의 시간표와 중복된 영역"  
                        break;
                    }  
                    else{
                        if(paramcourseid == timetable.courses[i]._id){
                            timetable.courses[i].subject = paramsubject;
                            timetable.courses[i].professor = paramprofessor; 
                            timetable.courses[i].starttime = paramstarttime; 
                            timetable.courses[i].starttimehour = Math.floor(paramstarttime/100)
                            timetable.courses[i].endtime = paramendtime; 
                            timetable.courses[i].day = paramday;
                        
                            timetable.saveTimetable(function(err) {
                                if (err) {
                                    console.error('응답 웹문서 생성 중 에러 발생 : ' + err.stack);
                                    res.end();
                                    return;
                                }
                                return;
                            })			
                            console.log("수정 완료") 
                            context.msg = "수정 완료"    
                        }
                    }
            }//for 문 닫기
            res.json(context); 
            return  
        })//TimetableModel.findOne 닫기
    }else {
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write('<h2>데이터베이스 연결 실패</h2>');
            res.end();
            } 	 
}; //editcourse 닫기 

var deletecourse = function(req, res){  // paramtimetableid: course의 id, timetableId: timetable의 Id
    console.log('timetable 모듈 안에 있는 deletecourse 호출됨.');
    var paramtimetableid = req.body.timetableid ||req.param.timetableid || req.query.timetableid;   
    var paramcourseid = req.body.courseid || req.query.courseid || req.param.courseid;
    var context = {msg: " ", title: " "} //timetable의 title

    console.log('요청 파라미터 : ', paramtimetableid + ", ", paramcourseid);
    
	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
        database.TimetableModel.findByIdAndUpdate(paramtimetableid,
            {'$pull': {'courses': {'timetableid': paramtimetableid, '_id': paramcourseid}}},
            function(err,timetable){
                if (err) {
                    console.error('삭제할 과목이 있는 시간표 검색 과정 중 에러 발생 : ' + err.stack);
                    res.end();
                    return;
                }
            console.log("수강과목 삭제 완료"); 
            context.msg = "수강과목 삭제 완료" 
            context.title = timetable.title;
            res.json(context)
            return; 
        });     
    } else { 
    res.end(); 
    return;
    } 
}; //deletecourse 닫기 

module.exports.addtimetable = addtimetable;
module.exports.gettimetablelist = gettimetablelist; 
module.exports.showtimetable = showtimetable;  
module.exports.renametimetable = renametimetable;
module.exports.switchisdefaultview = switchisdefaultview;
module.exports.deletetimetable = deletetimetable;  
module.exports.addcourse = addcourse;
module.exports.editcourse = editcourse;
module.exports.deletecourse = deletecourse;  
module.exports.checkdefaulttimetable = checkdefaulttimetable;

