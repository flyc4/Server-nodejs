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
       
        var context = {courseslist: [{
            courseID : " ",
            professorID : " ",
            subject: ' ',
            professor: ' ',
            overalRating : 0,
            exam : ' ',
            assignment : '0',
            difficulty : '',
            grade : ' '}]}  

        var paramcoursesliststartindex = req.body.coursesliststartindex|| 0;
        var paramcourseslistendindex = req.body.courseslistendindex|| 19;   


        // 만족하는 문서 갯수 확인 
        database.CourseEvaluationModel.find({}, function(err, cursor){
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
        })//find 닫기 
    } 
    else{
        utils.log("ShowCoursesList 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    } 
};

module.exports.ShowCoursesList = ShowCoursesList;