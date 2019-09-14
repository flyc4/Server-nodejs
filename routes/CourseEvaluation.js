/*
 * 강의평가를 위한 라우팅 함수 정의
 *
 * @date 2018-09-13
 * @author ChangHee
 */

var mongoose = require('mongoose');
var jwt = require('jsonwebtoken'); 
var ObjectId = mongoose.Types.ObjectId;  
var utils = require('../config/utils');

var ShowCoursesList = function(req, res) {
    var database = req.app.get('database');
    console.log("CourseEvaluation 모듈 안에 있는 ShowCoursesList 호출")
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
       
        //09-14 15:33 현재 프런트엔드: 'Components\Course_Evaluation\screen\EvaluationScreen.js'에서 
        //username과 contents만 사용하지만, 추 후 필요할 것을 대비하여 comments의 모든 요소를 삽입함
        var context = {courseslist: [{
            courseID: " ",
            professorID: " ",
            subject: " ",
            professor: " ",
            overallRating: 0,      
            exam : " ",
            assignment : " ",
            difficulty : " ",
            grade : " "
        }]}

        var paramcoursesliststartindex = req.body.commentsliststartindex|| 0;
        var paramcourseslistendindex = req.body.commentslistendindex|| 19;   
        var paramsearch = req.body.search|| '';

        //교수명 혹은 과목명을 검색 
        if(paramsearch !=" "){
            var query = {$or: [{professor: new RegExp(".*"+paramsearch+".*")}, 
                {subject: new RegExp(".*"+paramsearch+".*")}]}; 
        } 
        else{
            var query = {};
        }

        // 만족하는 문서 갯수 확인  

        database.CourseEvaluationModel.find(query, function(err, cursor){
            if(err){ 
                logger.log('강의평가 목록 조회 중 에러 발생 : ' + err.message);
				res.end();
                return; 
            }   
            if(paramcourseslistendindex>=cursor.length){
                paramcourseslistendindex = cursor.length-1;
              } 
            for(var i = paramcoursesliststartindex; i<= paramcourseslistendindex; i++)  
            {   
                context.courseslist.push({
                    courseID : cursor[i]._id.toString(),
                    professorID : cursor[i].professorid.toString(),
                    subject: cursor[i].subject,
                    professor: cursor[i].professor,
                    overallRating : cursor[i].overallrating,      
                    exam : cursor[i].exam,
                    assignment : cursor[i].assignment,
                    difficulty : cursor[i].difficulty,
                    grade : cursor[i].grade})

            } 
            context.courseslist.splice(0,1) 
            console.dir(context.courseslist)
            res.json(context); 
            return;
        }).sort({'created_at': -1});//find 닫기 
    } 
    else{
        utils.log("ShowCoursesList 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    } 
}; 

var ShowCommentsList = function(req, res) {
    var database = req.app.get('database');
    console.log("CourseEvaluation 모듈 안에 있는 ShowCommentsList 호출")
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
       
        //09-14 15:33 현재 프런트엔드: 'Components\Course_Evaluation\screen\EvaluationScreen.js'에서 
        //username과 contents만 사용하지만, 추 후 필요할 것을 대비하여 comments의 모든 요소를 삽입함
        var context = {commentslist: [{
            userid: " ",
            username: " ", 
            contents: " ", 
            exam: " ",
            assignment: " ",
            grade: " ",
            difficulty: " ",
			rating: 0,  
            created_at: " "
        }]}  
        //paramcourseid: 09-14 15:33 현재 프런트엔드: 
        // 'Components\Course_Evaluation\screen\EvaluationScreen.js'에서 courseid 값의 default를 NO-ID 로 설정함.
        var paramcourseid = req.body.courseid == 'NO-ID'? '000000000000000000000001': req.body.courseid;
        var paramcommentsliststartindex = req.body.commentsliststartindex;
        var paramcommentslistendindex = req.body.commentslistendindex ;   
        
        console.log("paramcommentsliststartindex: ",paramcommentsliststartindex); 
        console.log("paramcommentslistendindex: ",paramcommentslistendindex);


        // 만족하는 문서 갯수 확인  

        database.CourseEvaluationModel.aggregate([
            { $match: { 
            _id: new ObjectId(paramcourseid)}},   
            
            //Expand the comments array into a stream of documents
            { "$unwind": '$comments'},
            // Sort in ascending order
            { $sort: {
                'comments.created_at': -1
            }}    
            ], function(err, cursor){
                
                if(err){ 
                    logger.log('ShowCommentsList에서 댓글 조회 중 에러 발생 : ' + err.message);
                    res.end();
                    return; 
                }   
                if(paramcommentslistendindex>=cursor.length){
                    paramcommentslistendindex = cursor.length-1;
                }  


                for(var i = paramcommentsliststartindex; i<= paramcommentslistendindex; i++)  
                {   
                    context.commentslist.push({
                        userid: cursor[i].comments.userid,
                        username: cursor[i].comments.nickNm, 
                        contents: cursor[i].comments.contents, 
                        exam: cursor[i].comments.exam,
                        assignment: cursor[i].comments.assignment,
                        grade: cursor[i].comments.grade,
                        difficulty: cursor[i].comments.difficulty,
                        rating: cursor[i].comments.rating,  
                        created_at: cursor[i].comments.created_at 
                    })
                } 
            context.commentslist.splice(0,1) 
            console.dir(context.commentslist)
            res.json(context); 
            return;
        }) 
    } 
    else{
        utils.log("ShowCommentsList 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    } 
}; 

module.exports.ShowCoursesList = ShowCoursesList;  
module.exports.ShowCommentsList = ShowCommentsList; 