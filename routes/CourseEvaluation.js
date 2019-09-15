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

//DB에 저장된 20개의 과목들을 불러옴.
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
            grade : " ", 
            place: " ",
        }]}

        var paramCoursesListStartIndex = req.body.commentsliststartindex|| 0;
        var paramCoursesListEndIndex = req.body.commentslistendindex|| 19;   
        var paramSearch = req.body.search|| '';

        //교수명 혹은 과목명을 검색 
        if(paramSearch !=" "){
            var query = {$or: [{professor: new RegExp(".*"+paramSearch+".*")}, 
                {subject: new RegExp(".*"+paramSearch+".*")}]}; 
        } 
        else{
            var query = {};
        }

        // 만족하는 문서 갯수 확인  

        database.CourseEvaluationModel.find(query, function(err, cursor){
            if(err){ 
                utils.log('강의평가 목록 조회 중 에러 발생 : ' + err.message);
				res.end();
                return; 
            }   
            if(paramCoursesListEndIndex>=cursor.length){
                paramCoursesListEndIndex = cursor.length-1;
              } 
            for(var i = paramCoursesListStartIndex; i<= paramCoursesListEndIndex; i++)  
            {   
                //overallrating의 합계를 구하기 위함
                //comments에 있는 exam& assignment& difficulty& grade의 값들을 담은 array. splice(0,1) 로 제거 예정 
                //exam, assignment, difficulty, grade의 값: comments 가 없을 때의 값
                var overallrating = 0;  
                var examlist = ["dummy"],
                    assignmentlist = ["dummy"], 
                    difficultylist = ["dummy"],
                    gradelist = ["dummy"], 
                    exam = "N/A", 
                    assignment = "N/A", 
                    difficulty = "N/A", 
                    grade  = "N/A";
                    

                if(cursor[i].comments.length>0){
                    
                    cursor[i].comments.map( (items)=> {
                        overallrating = overallrating+items.rating; 
                        examlist.push(items.exam); 
                        assignmentlist.push(items.assignment); 
                        difficultylist.push(items.difficulty); 
                        gradelist.push(items.grade);
                   })  
                   
                   //overallrating, exam, assignment, difficulty, grade의 값 계산 
                   overallrating = Math.round(overallrating/cursor[i].comments.length); 
                   examlist.splice(0,1)
                   assignmentlist.splice(0,1)
                   difficultylist.splice(0,1)
                   gradelist.splice(0,1) 

                   //최빈값 조회 함수
                   var GetCommonElement = function(array){ 
                    //maxelement 편집 시 104번 줄 ||maxelement =="empty" 도 편집해야 함
                    var elements = {}, maxelement = "empty", maxcount=-1; 
                    elements[maxelement] = maxcount;
                        array.map( (item) => {                  
                            if(elements[item] == null){
                                elements[item] = 1;   
                            } 
                            else{
                                elements[item]++
                            }   
                            //items의 출연 횟수 >= maxelement의 출연 횟수 && 사전 편찬 순으로 itmes 더 먼저 나올 경울
                            if( (elements[item]==elements[maxelement]&&(item<maxelement)) 
                                || elements[item]>elements[maxelement] || maxelement =="empty"){
                                maxelement = item; 
                                maxcount = elements[item]; 
                            }  
                        }) 
                        return maxelement;
                   } 

                    exam = GetCommonElement(examlist);   
                    assignment = GetCommonElement(assignmentlist);
                    difficulty = GetCommonElement(difficultylist);
                    grade = GetCommonElement(gradelist);  
                }//if(cursor[i].comments.length>0)닫기

                context.courseslist.push({
                    courseID : cursor[i]._id.toString(),
                    professorID : cursor[i].professorid.toString(),
                    subject: cursor[i].subject,
                    professor: cursor[i].professor,
                    overallRating : overallrating,      
                    exam : exam,
                    assignment : assignment,
                    difficulty : difficulty,
                    grade : grade, 
                    place: cursor[i].institution})

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

// 한 과목의 댓글 20개를 불러옴
var ShowCommentsList = function(req, res) {
    var database = req.app.get('database');
    console.log("CourseEvaluation 모듈 안에 있는 ShowCommentsList 호출")
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
       
        //09-14 15:33 현재 프런트엔드: 'Components\Course_Evaluation\screen\EvaluationScreen.js'에서 
        //username과 contents만 사용하지만, 추 후 필요할 것을 대비하여 comments의 모든 요소를 삽입함
        var context = {commentslist: [{
            commentid: " ",
            userid: " ",
            username: " ", 
            contents: " ", 
            exam: " ",
            assignment: " ",
            grade: " ",
            difficulty: " ",
            rating: 0,   
            likes: 0, 
            unlikes: 0,
            created_at: " "
        }]}  
        //paramCourseId: 09-14 15:33 현재 프런트엔드: 
        // 'Components\Course_Evaluation\screen\EvaluationScreen.js'에서 courseid 값의 default를 NO-ID 로 설정함.
        var paramCourseId = req.body.courseid == 'NO-ID'? '000000000000000000000001': req.body.courseid;

        var paramCommentsListStartIndex = req.body.commentsliststartindex;
        var paramCommentsListEndIndex = req.body.commentslistendindex ;   
        
        console.log("paramCommentsListStartIndex: ",paramCommentsListStartIndex); 
        console.log("paramCommentsListEndIndex: ",paramCommentsListEndIndex);


        // 만족하는 문서 갯수 확인  

        database.CourseEvaluationModel.aggregate([
            { $match: { 
            _id: new ObjectId(paramCourseId)}},   
            
            //Expand the comments array into a stream of documents
            { "$unwind": '$comments'},
            // Sort in ascending order
            { $sort: {
                'comments.created_at': -1
            }}    
            ], function(err, cursor){
                
                if(err){ 
                    utils.log('ShowCommentsList에서 댓글 조회 중 에러 발생 : ' + err.message);
                    res.end();
                    return; 
                }   
                if(paramCommentsListEndIndex>=cursor.length){
                    paramCommentsListEndIndex = cursor.length-1;
                }  


                for(var i = paramCommentsListStartIndex; i<= paramCommentsListEndIndex; i++)  
                {   
                    context.commentslist.push({ 
                        commentid: cursor[i].comments._id,
                        userid: cursor[i].comments.userid,
                        username: cursor[i].comments.nickNm, 
                        contents: cursor[i].comments.contents, 
                        exam: cursor[i].comments.exam,
                        assignment: cursor[i].comments.assignment,
                        grade: cursor[i].comments.grade,
                        difficulty: cursor[i].comments.difficulty,
                        rating: cursor[i].comments.rating,   
                        likes: cursor[i].comments.likes, 
                        unlikes: cursor[i].comments.unlikes,
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

var AddCourseEvaluationComment = function(req, res) {
    var database = req.app.get('database');
    console.log("CourseEvaluation 모듈 안에 있는 AddCourseEvaluationComment 호출")
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
       
        var paramCourseId = req.body.courseid == 'NO-ID'? '000000000000000000000001': req.body.courseid,
            paramUserId = req.body.userid,
            paramContents = req.body.contents == " "? "There is no comment":req.body.contents,
            paramExam = req.body.exam || "N/A",
            paramAssignment = req.body.assignment || "N/A",
            paramGrade = req.body.grade || "N/A", 
            paramDifficulty = req.body.difficulty || "N/A",
            paramRating = req.body.rating || 0,
            commentid = new mongoose.Types.ObjectId(); 
            
        console.log('paramCourseId: ' + paramcoourseid + ', paramUserId: ' +  paramUserId, 
        ', paramDifficulty: ' + paramDifficulty, ', paramAssignment: ' + paramAssignment + 
        ', paramExam: ' + paramExam + ', paramGrade: ' + paramGrade + 
        ', paramRating: ' + paramRating + ', paramContents: ' + paramContents); 

        // 사용자 조회  
        database.UserModel.findOne({_id: new ObjectId(paramUserId)}, function(err,user){            
            if(err){ 
                utils.log('AddCourseEvaluationComment에서 사용자 조회 중 에러 발생: ' + err.message);
                res.end();
                return; 
            }     
            // 사용자가 존재하지 않을 경우 
            if(user == null){
                utils.log('AddCourseEvaluationComment에서 조회된 사용자가 없음') 
                res.end(); 
                return;
            }
            //댓글 삽입  
            
            database.CourseEvaluationModel.findByIdAndUpdate(paramCourseId,
            {'$push': { 'comments': { 
                            '_id': commentid,
                            'userid': paramUserId, 
                            'nickNm':user.nickNm, 
                            'difficulty': paramDifficulty,
                            'assignment': paramAssignment,  
                            'exam': paramExam, 
                            'grade': paramGrade, 
                            'rating': paramRating, 
                            'contents':paramContents, 
                            'likes': 0, 
                            'unlikes': 0, 
                            }
                        }
            },
            {'new':true},function(err2){
                if(err2){
                    utils.log("AddCourseEvaluationComment에서 댓글 추가 중 에러 발생: ", err2.message)
                    return;
                }  
                console.log("댓글 추가함")
                return; 
            }) //findByIdAndUpdate닫기 

        })//UserModel.findOne 닫기
    } 
    else{
        utils.log("AddCourseEvaluationComment 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    } 
}; 

module.exports.ShowCoursesList = ShowCoursesList;  
module.exports.ShowCommentsList = ShowCommentsList;  
module.exports.AddCourseEvaluationComment = AddCourseEvaluationComment;