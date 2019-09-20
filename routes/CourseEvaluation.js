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
const axios = require("axios"); 


//////////////////CoursesList의 전체 목록과 관련된 함수 시작 /////////////////////////////////

//DB에 저장된 20개의 과목들을 불러옴.
var ShowCoursesList = async function(req, res) {
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
            var query = {$or: [{professor: new RegExp(".*"+paramSearch+".*","gi")}, 
                {subject: new RegExp(".*"+paramSearch+".*","gi")}]}; 
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
//////////////////CoursesList의 전체 목록과 관련된 함수 끝 /////////////////////////////////

//////////////////Commentes와 관련된 함수 시작 /////////////////////////////////

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
            created_at: " ", 
            ismine: false
        }]}  
        //paramCourseId: 09-14 15:33 현재 프런트엔드: 
        // 'Components\Course_Evaluation\screen\EvaluationScreen.js'에서 courseid 값의 default를 NO-ID 로 설정함.
        var paramCourseId = req.body.courseid == 'NO-ID'? '000000000000000000000001': req.body.courseid;
        var paramUserId = req.body.userid;
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
                {   var localismine = paramUserId == cursor[i].comments.userid;
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
                        created_at: cursor[i].comments.created_at, 
                        ismine: localismine
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
            paramExam = req.body.exam.toString() || "N/A",
            paramAssignment = req.body.assignment.toString() || "N/A",
            paramGrade = req.body.grade || "N/A", 
            paramDifficulty = req.body.difficulty || "N/A",
            paramRating = req.body.rating || 0,
            commentid = new mongoose.Types.ObjectId(); 
        
        let context = {msg: ""}     

        console.log('paramCourseId: ' + paramCourseId + ', paramUserId: ' +  paramUserId, 
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
            
            database.db.collection("courseevaluations").updateOne({_id: new ObjectId(paramCourseId)},
            {'$push': { comments: { 
                            _id: commentid,
                            userid: new ObjectId(paramUserId), 
                            nickNm:user.nickNm, 
                            difficulty: paramDifficulty,
                            assignment: paramAssignment,  
                            exam: paramExam, 
                            grade: paramGrade, 
                            rating: paramRating, 
                            contents:paramContents, 
                            likes: 0, 
                            unlikes: 0,  
                            created_at: utils.timestamp()
                            }
                        }
            },
            function(err2){
                if(err2){
                    utils.log("AddCourseEvaluationComment에서 댓글 추가 중 에러 발생: ", err2.message)
                    return;
                }    
                console.log("댓글 추가함")
                context.msg = "suceess"; 
                res.json(context) 
                res.end()
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

var EditCourseEvaluationComment = function(req, res) {
    var database = req.app.get('database');
    console.log("CourseEvaluation 모듈 안에 있는 EditCourseEvaluationComment 호출")
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
       
        var paramCourseId = req.body.courseid == 'NO-ID'? '000000000000000000000001': req.body.courseid,
            paramCommentId = req.body.commentid,
            paramContents = req.body.contents == " "? "There is no comment":req.body.contents,
            // 숫자 0을 제대로  인식하지 못해서 이렇게 작성함
            paramExam = req.body.exam.toString() || "N/A", 
            paramAssignment = req.body.assignment.toString()|| "N/A",
            paramGrade = req.body.grade || "N/A", 
            paramDifficulty = req.body.difficulty || "N/A",
            paramRating = req.body.rating || 0; 
        let context = {msg: ""}
            
        console.log('paramCourseId: ' + paramCourseId + ', paramContents: ' + paramContents + 
            ', paramExam: ' + paramExam + ', paramAssignment: ' + paramAssignment + 
            ', paramGrade: ' + paramGrade + ', paramDifficulty: ' + paramDifficulty +  
            ', paramRating: ' + paramRating);  
            
            //댓글 수정  
            database.CourseEvaluationModel.updateOne({_id: new ObjectId(paramCourseId), 
                'comments._id': new ObjectId(paramCommentId)},
                {'$set': { 
                            'comments.$.difficulty': paramDifficulty,
                            'comments.$.assignment': paramAssignment,  
                            'comments.$.exam': paramExam, 
                            'comments.$.grade': paramGrade, 
                            'comments.$.rating': paramRating, 
                            'comments.$.contents':paramContents, 
                        }
                },
                {'new':true},function(err){
                    if(err){
                        utils.log("EditCourseEvaluationComment에서 댓글 수정 중 에러 발생: ", err.message)
                        return;
                    }  
                    console.log("댓글 수정함")  
                    context.msg = "success"
                    res.json(context) 
                    res.end()
                    return; 
                }) //updateOne 닫기 

        } 
    else{
        utils.log("EditCourseEvaluationComment 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    }  
}; 

var DeleteCourseEvaluationComment = function(req, res) {
    var database = req.app.get('database');
    console.log("CourseEvaluation 모듈 안에 있는 DeleteCourseEvaluationComment 호출")
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
       
        var paramCourseId = req.body.courseid == 'NO-ID'? '000000000000000000000001': req.body.courseid,
            paramCommentId = req.body.commentid; 
        
        let context = {msg: ""}

        console.log('paramCourseId: ' + paramCourseId + ', paramCommentId: ' + paramCommentId);  
            
            //댓글 삭제  
            database.CourseEvaluationModel.updateOne({_id: new ObjectId(paramCourseId)},
            {$pull: { 'comments': { '_id': new ObjectId(paramCommentId)}}},
            function(err){
                if(err){
                        utils.log("EditCourseEvaluationComment에서 댓글 삭제 중 에러 발생: ", err.message)
                        return;
                    }  
                    context.msg = "success" 
                    res.json(context) 
                    res.end()
                    return; 
                }) //updateOne 닫기 
    } 
    else{
        utils.log("DeleteCourseEvaluationComment 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    }  
}; 

//댓글에 좋아요 1 증가
var IncreLikeCourseEvaluationComment = function(req, res) {
    console.log('CourseEvaluation 모듈 안에 있는 IncreLikeCourseEvaluationComment 호출됨.');
    
    var paramCourseId = req.body.courseid||req.query.courseid;  
    var paramCommentId = req.body.commentid||req.query.commentid||"000000000000000000000001";  
    var paramUserId = req.body.userid||"000000000000000000000001"; 
    
    var database = req.app.get('database');
    console.log(
        'paramCourseId: ' + paramCourseId, 
        'paramCommentId: ' + paramCommentId,
        'paramUSerId: ' + paramUserId
        );
    let context = {
        likesinfo: [{ 
        likes: 0, 
        likespressed: false  
        }], 
        msg: " "}
    
    // 데이터베이스 객체가 초기화된 경우
    if (database.db) {
        database.UserModel.findOne({_id: new ObjectId(paramUserId)},function(err,user){
            if(err){
            utils.log("IncreLikeCourseEvaluationComment에서 좋아요를 누른 사용자 조회 중 에러 발생: ",err.message)
            }  
            if(!user){
            utils.log("IncreLikeCourseEvaluationComment에서 사용자를 조회할 수 없음") 
            context.msg = "missing"
            res.json(context) 
            res.end() 
            return;
            }
            //이미 좋아요를 눌렀으나 좋아요 요청을 또 다시 해온 경우, 좋아요를 반영하지 않고 반환한다. 
            database.CourseEvaluationModel.findOne({
                _id: new ObjectId(paramCourseId),  
            },  
            function(err,post){
                if (err) {
                utils.log("IncreLikeCourseEvaluationComment 안에서 요청한 사용자가 해당 게시물에 이미 좋아요를 눌렀는 지 조회하는 중 에러 발생: "+ err.message)
                res.end(); 
                return;
                }   
                if(!post){
                utils.log("IncreLikeCourseEvaluationComment 안에서 게시글 조회 실패") 
                context.msg = "empty"  
                res.json(context) 
                res.end() 
                return;
                }
                
                let commentindex = -1;
                let locallikes = -1;    
                
                //댓글에 해당하는 인덱스 값(i) 찾기
                for(let i=0;i<post.comments.length;i++){  
                if(post.comments[i]._id.toString() == paramCommentId){
                    commentindex = i;
                    locallikes = post.comments[i].likes 
                    break;
                    }
                }  
                if(commentindex == -1){
                utils.log("IncreLikeCourseEvaluationComment 안에서 요청 받은 댓글 조회 실패") 
                context.msg = "empty" 
                res.json(context) 
                res.end() 
                return
                }
                
                //이미 좋아요를 눌렀던 상태일 경우 반환
                for(let j=0;j<post.comments[commentindex].likeslist.length;j++){ 
                if(post.comments[commentindex].likeslist[j].userid.toString() == paramUserId){
                    utils.log("IncreLikeCourseEvaluationComment에서 이미 좋아요를 누른 댓글에 다시 좋아요 요청함")
                    context.msg = "duplicate" 
                    context.likesinfo.push({likes: locallikes, likespressed: true}) 
                    context.likesinfo.splice(0,1)  
                    res.json(context)
                    res.end()   
                    return;
                }
                }
    
                //좋아요를 증가시킬 댓글을 조회 
                database.CourseEvaluationModel.findOneAndUpdate({_id: new ObjectId(paramCourseId), 'comments._id': new ObjectId(paramCommentId)},  
                { 
                    $inc: {'comments.$.likes': 1}, 
                    $push: { 
                    'comments.$.likeslist': {
                        userid: new ObjectId(paramUserId),  
                        nickNm: user.nickNm 
                    }}  
                },
                function(err){
                if (err) {
                        utils.log("IncreLikeCourseEvaluationComment 안에서 좋아요를 1 증가시킬 게시물 조회 중 에러 발생: "+ err.message)
                        res.end(); 
                        return;
                }		 
                context.likesinfo.push({likes: locallikes+1, likespressed: true}) 
                context.likesinfo.splice(0,1)  
                context.msg = "success";
                console.dir(context)
                res.json(context)
                res.end(); 
                return 
                })//findOneAndUpdate 닫기 
            })//findOne 닫기
        })//UserModel.findOne 닫기 
    } else {  
        utils.log('IncreLikeCourseEvaluationComment 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
        }	     
  }; //IncreLikeCourseEvaluationComment 닫기   

  //댓글에 좋아요 1 감소
var DecreLikeCourseEvaluationComment = function(req, res) {
    console.log('CourseEvaluations 모듈 안에 있는 DecreLikeCourseEvaluationComment 호출됨.');
    
    var paramCourseId = req.body.courseid||req.query.courseid;  
    var paramUserId = req.body.userid||"000000000000000000000001";
    var paramCommentId = req.body.commentid||req.query.commentid;
  
    var database = req.app.get('database');
    
    console.log('paramCourseId: ' + paramCourseId,  
      'paramUserId: ' + paramUserId, 'paramCommentId: ' + paramCommentId);
  
    var context = {
      likesinfo: [{ 
        likes: 0, 
        likespressed: true  
      }], 
      msg: " "}
  
    // 데이터베이스 객체가 초기화된 경우
    if (database.db) {
        database.UserModel.findOne({_id: new ObjectId(paramUserId)},function(err,user){
          if(err){
            utils.log("DecreLikeCourseEvaluationComment에서 좋아요를 취소한 사용자 조회 중 에러 발생: ",err.message)
          }  
          if(!user){
            utils.log("DecreLikeCourseEvaluationComment에서 사용자를 조회할 수 없음") 
            context.msg = "missing"
            res.json(context) 
            res.end() 
            return;
          }
          
          database.CourseEvaluationModel.findOne({
              _id: new ObjectId(paramCourseId),  
            },  
            function(err,post){
              if (err) {
                utils.log("DecreLikeCourseEvaluationComment 안에서 요청한 사용자가 해당 게시물에 이미 좋아요를 눌렀는 지 조회하는 중 에러 발생: "+ err.message)
                res.end(); 
                return;
              }   
              if(!post){
                utils.log("DecreLikeCourseEvaluationComment 안에서 게시글 조회 실패") 
                context.msg = "empty"  
                res.json(context) 
                res.end() 
                return;
              }
              
              let commentindex = -1;
              let locallikes = -1;     
              let isinlikeslist = false;
                
              //업데이트 할 댓글의 인덱스(i) 조회 및 업데이트 전 좋아요 갯수(locallikes) 설정
              for(let i=0;i<post.comments.length;i++){  
                if(post.comments[i]._id.toString() == paramCommentId){
                  commentindex = i;
                  locallikes = post.comments[i].likes 
                  break;
                  }
              } 
              if(commentindex == -1){
                utils.log("DecreLikeCourseEvaluationComment 안에서 요청 받은 댓글 조회 실패") 
                context.msg = "empty" 
                res.json(context) 
                res.end() 
                return
              }   
  
              //좋아요를 누른 사람의 목록에 없으나 좋아요 취소 요청을 해온 경우, 좋아요 취소를 반영하지 않고 반환한다. 
              for(let j=0;j<post.comments[commentindex].likeslist.length;j++){
                if(post.comments[commentindex].likeslist[j].userid.toString() == paramUserId){
                  isinlikeslist = true 
                  break
                }
              }
  
              if(!isinlikeslist){
                utils.log("DecreLikeCourseEvaluationComment안에서 likeslist 안에서 요청한 사용자를 찾을 수 없음") 
                context.msg = "empty" 
                res.json(context) 
                res.end() 
                return
              }
              
              //좋아요를 감소시킬 댓글을 조회 및 업데이트 실행
              database.CourseEvaluationModel.findOneAndUpdate(
                {
                   _id: new ObjectId(paramCourseId), 
                  'comments._id': new ObjectId(paramCommentId),
                  'comments.likeslist.userid': new ObjectId(paramUserId),
                },  
                { 
                  $inc: {'comments.$.likes': -1}, 
                  
                  $pull: 
                    {'comments.$.likeslist' :{'userid': new ObjectId(paramUserId)}}    
                  
                },{upsert: true,new: true},
              function(err){
                if (err) {
                        utils.log("DecreLikeCourseEvaluationComment 안에서 좋아요를 1 감소시킬 게시물 조회 중 에러 발생: "+ err.message)
                        res.end(); 
                        return;
                }		   
                context.likesinfo.push({likes: locallikes-1, likespressed: false}) 
                context.likesinfo.splice(0,1)  
                context.msg = "success";
                console.dir(context)
                res.json(context)
                res.end(); 
                return 
                })//findOneAndUpdate 닫기 
            })//findOne 닫기
        })//UserModel.findOne 닫기 
    } else {  
        utils.log('DecreLikeCourseEvaluationComment 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
      }	    
  }; //DecreLikeCourseEvaluationComment 닫기 

  var ShowProfessorProfile = function(req, res) {
    console.log('CourseEvaluation 모듈 안에 있는 ShowProfessorProfile 호출됨.');
    
    var paramProfessor = req.body.professor||' ';  
    
    var database = req.app.get('database');
    
    console.log('paramProfessor: ' + paramProfessor);
    
    var context = {subjectslist: [{subject: " "}], institution: " "};

    // 데이터베이스 객체가 초기화된 경우
    if (database.db) {
        
        //해당 교수의 모든 과목 조회 
        database.ProfessorModel.findOne({professor: paramProfessor},  
            function(err1, professor){
                if (err1) {
                  utils.log("ShowProfessorProfile 안에서 해당 교수 조회 중 에러 발생: "+ err1.message)
                  res.end(); 
                  return;
                }  
                if(professor == undefined){
                    utils.log("ShowProfessorProfile 수행 중 데이터베이스에서 교수 정보를 찾을 수 없음") 
                    res.end(); 
                    return;
                }
                // institution 값을 변수에 할당
                context.institution =  professor.school  

                //해당 교수의 모든 과목 조회 
                database.CourseEvaluationModel.find({professor: paramProfessor},  
                    function(err, cursor){
                        if (err) {
                            utils.log("ShowProfessorProfile 안에서 해당 교수의 과목들 조회 중 에러 발생: "+ err.message)
                            res.end(); 
                            return;
                        } 
                    cursor.map( (items)=> { 
                        context.subjectslist.push({subject: items.subject})
                    }) 
                    context.subjectslist.splice(0,1)
                    console.dir(context)
                    res.json(context); 
                    res.end();
                    return; 
                })

            })//ProfessorModel.findOne  닫기  
    } else {  
        utils.log('ShowProfessorProfile 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
      }
  }; //ShowProfessorProfile 닫기 

//////////////////Commentes와 관련된 함수 끝 /////////////////////////////////

module.exports.ShowCoursesList = ShowCoursesList;  
module.exports.ShowCommentsList = ShowCommentsList;  
module.exports.AddCourseEvaluationComment = AddCourseEvaluationComment;
module.exports.EditCourseEvaluationComment = EditCourseEvaluationComment;
module.exports.DeleteCourseEvaluationComment = DeleteCourseEvaluationComment; 
module.exports.IncreLikeCourseEvaluationComment = IncreLikeCourseEvaluationComment; 
module.exports.DecreLikeCourseEvaluationComment = DecreLikeCourseEvaluationComment;
module.exports.ShowProfessorProfile = ShowProfessorProfile;  

