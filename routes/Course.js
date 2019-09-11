var jwt = require('jsonwebtoken');

var showcourselist = function(req, res) {
	
    var database = req.app.get('database');
    console.log("showcourselist 호출")
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
       
        var context = {testlist: [{
            courseID : " ",
            professorID : " ",
            subject: ' ',
            professor: ' ',
            overalRating : 0,
            exam : ' ',
            assignment : '0',
            difficulty : 'easy',
            grade : 'B+'}]} 

        // 만족하는 문서 갯수 확인 
        database.CourseModel.find({}, function(err, cursor){
            if(err){ console.error('게시판 글 목록 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>게시판 글 목록 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            }  
            cursor.map(function(items)  
            {   
                console.log("I'm here")
                context.testlist.push({
                    courseID : items._id,
                    professorID : items.professorid,
                    subject: items.subject,
                    professor: items.professor,
                    overalRating : items.overalRating,      
                    exam : items.exam,
                    assignment : items.assignment,
                    difficulty : items.difficulty,
                    grade : items.grade})

            })  
                context.testlist.splice(0,1)
                res.json(context); 
                return;
        }) 
    } 
};

module.exports.showcourselist = showcourselist;