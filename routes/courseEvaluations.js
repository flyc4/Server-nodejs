/**
 * @description 강의 평가(courseEvaluation)에 관련된 라우터의 콜백 함수 정의. 
 * 한양대의 강의 목록을 어떻게 불러올지는 미결정. 
 * config/config와 route_loader를 이용하여 등록  
 * @author Chang Hee
 */

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;     
const utils = require('../config/utils');
const getDatabase = require('../database/database').getDatabase;

//////////////////CoursesList의 전체 목록과 관련된 함수 시작 /////////////////////////////////

/**
 * @description 미리 작성한 강의 목록 중 20개를 보여줌. 검색 기능 구현함
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const showCoursesList = async function(req, res) { 
    console.log('courseevaluations/showcourseslist 호출')
    const database = await getDatabase();
    // 데이터베이스 객체가 초기화된 경우
	if (!(database instanceof Error)) {
        //2019/09/14 15:33 현재 프런트엔드: 'Components\Course_Evaluation\screen\EvaluationScreen.js'에서 
        //username과 contents만 사용하지만, 추 후 필요할 것을 대비하여 comments의 모든 요소를 삽입함
        let context = {
            courseslist: [{
                courseID: '',
                professorID: '',
                subject: '',
                professor: '',
                overallRating: 0,      
                exam: '',
                assignment: '',
                difficulty: '',
                grade: '', 
                place: '',
            }]
        }

        let paramCoursesListStartIndex = req.body.commentsliststartindex || 0;
        let paramCoursesListEndIndex = req.body.commentslistendindex || 19;   
        const paramSearch = req.body.search || '';
        let query = {};

        //교수명 혹은 과목명을 검색 
        if (paramSearch !== '') {
             query = {$or: [{professor: new RegExp('.*'+paramSearch+'.*','gi')}, 
                {subject: new RegExp('.*'+paramSearch+'.*','gi')}]}; 
        } 

        database
            .collection('courseevaluations')
            .find(query)
            .sort({'created_at': -1})
            .toArray(function(err, cursor) {
                if (err) { 
                    console.log('courseevaluations/showcourseslist에서 강의평가 목록 조회 중 에러 발생 : ' + err.stack);
                    res.end();
                    return; 
                }   
                //조회된 강의가 없을 시
                if(cursor.length<1){
                    context.postslist.splice(0,1); 
                    res.json(context); 
                    res.end(); 
                    return;
                }
                // 프런트엔드에서 Index가 0 미만으로 입력될 때 대비. 
                // startIndex > endIndex 의 경우는 for에서 걸러짐. 
                if(paramCoursesListStartIndex<0){
                    paramCoursesListStartIndex = 0;
                } 
                if(paramCoursesListEndIndex<0){
                    paramCoursesListEndIndex = 0;
                } 
                if(paramCoursesListEndIndex>=cursor.length){
                    paramCoursesListEndIndex = cursor.length-1;
                }
                for(let i = paramCoursesListStartIndex; i<= paramCoursesListEndIndex; i++)  
                {   
                    if(i>=cursor.length) {
                        break;
                    }

                    // overallRating의 합계를 구하기 위함
                    // comments에 있는 exam& assignment& difficulty& grade의 값들을 담은 array. splice(0,1) 로 제거 예정 
                    // exam, assignment, difficulty, grade의 값: comments 가 없을 때의 값 
                    let overallRating = 0;  
                    let examList = ['dummy'];
                    let assignmentList = ['dummy']; 
                    let difficultyList = ['dummy'];
                    let gradeList = ['dummy']; 
                    let exam = 'N/A'; 
                    let assignment = 'N/A'; 
                    let difficulty = 'N/A'; 
                    let grade  = 'N/A';

                    if (cursor[i].comments.length>0) {
                        //조회된 항목들을 지역 변수들에 담기
                        cursor[i].comments.map( (items)=> {
                            overallRating = overallRating+items.rating; 
                            examList.push(items.exam); 
                            assignmentList.push(items.assignment); 
                            difficultyList.push(items.difficulty); 
                            gradeList.push(items.grade);
                        })  
                    
                        //overallRating, exam, assignment, difficulty, grade의 값 계산 후 'dummy'제거
                        overallRating = Math.round(overallRating/cursor[i].comments.length); 
                        examList.splice(0,1);
                        assignmentList.splice(0,1);
                        difficultyList.splice(0,1);
                        gradeList.splice(0,1); 
                        exam = utils.getMostFrequentElement(examList,'empty');   
                        assignment = utils.getMostFrequentElement(assignmentList,'empty');
                        difficulty = utils.getMostFrequentElement(difficultyList, 'empty');
                        grade = utils.getMostFrequentElement(gradeList, 'empty');  
                    }//if(cursor[i].comments.length>0)닫기

                    context.courseslist.push({
                        courseID : cursor[i]._id.toString(),
                        professorID : cursor[i].professorId.toString(),
                        subject: cursor[i].subject,
                        professor: cursor[i].professor,
                        overallRating : overallRating,      
                        exam : exam,
                        assignment : assignment,
                        difficulty : difficulty,
                        grade : grade, 
                        place: cursor[i].institution
                    })
                }//for 문 닫기
                context.courseslist.splice(0,1);  
                res.json(context); 
                return;
            });//find 닫기 
    } 
    else {
        console.log('courseevaluations/showcourseslist 수행 중 데이터베이스 연결 실패')
        res.end(); 
        return;
    } 
}; 
//////////////////CoursesList의 전체 목록과 관련된 함수 끝 /////////////////////////////////

//////////////////각각의 강의 평가와 관련된 함수 시작 /////////////////////////////////

/**
 * @description 한 과목의 강의 평가 내용들을 불러옴 (기본: 0 ~ 19번째 강의 평가)
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const showCommentsList = async function(req, res) {
    console.log('courseevaluations/showcommentslist 호출');
    const database = await getDatabase();
    // 데이터베이스 객체가 초기화된 경우
	if (!(database instanceof Error)){ 
        // 2019/09/14 15:33 현재 프런트엔드: 'Components\Course_Evaluation\screen\EvaluationScreen.js'에서 
        // username과 contents만 사용하지만, 추 후 필요할 것을 대비하여 comments의 모든 요소를 삽입함
        
        let context = {
            commentslist: [{
                commentid: '',
                userid: '',
                username: '', 
                contents: '', 
                exam: '',
                assignment: '',
                grade: '',
                difficulty: '',
                rating: 0,   
                likes: 0, 
                unlikes: 0,
                created_at: '', 
                ismine: false
            }]
        }  
        //paramCourseId: 2019/09/14 15:33 현재 프런트엔드: 
        // 'Components\Course_Evaluation\screen\EvaluationScreen.js'에서 courseid 값의 default를 NO-ID 로 설정함.
        const paramCourseId = req.body.courseid === 'NO-ID'
                                ? utils.ZEROID
                                : req.body.courseid; 

        let paramUserId = utils.JWTVerifyId(req.body.jwt);
        let paramCommentsListStartIndex = req.body.commentsliststartindex || 0;
        let paramCommentsListEndIndex = req.body.commentslistendindex || 19;   
        
        console.log('paramCourseId: ', paramCourseId); 
        console.log('paramUserId: ', paramUserId);
        console.log('paramCommentsListStartIndex: ',paramCommentsListStartIndex); 
        console.log('paramCommentsListEndIndex: ',paramCommentsListEndIndex);

        database
            .collection('courseevaluations')
            .aggregate([
                { 
                    $match: { 
                        _id: new ObjectId(paramCourseId)
                    }
                },   
                {$unwind: '$comments'},
                { $sort: {
                    'comments.created_at': -1
                    }
                }    
            ])
            .toArray(function(err, cursor) {               
                if(err){ 
                    console.log('courseevaluations/showcommentslist에서 강의 평가 조회 중 에러 발생 : ' + err.stack);
                    res.end();
                    return; 
                }    
                // 프런트엔드에서 Index가 0 미만으로 입력될 때 대비. 
                // startIndex > endIndex 의 경우는 for에서 걸러짐.                 
                if(paramCommentsListStartIndex<0){
                    paramCommentsListStartIndex = 0;
                }  
                if(paramCommentsListEndIndex<0){
                    paramCommentsListEndIndex = 0;
                }
                if(paramCommentsListEndIndex >= cursor.length){
                    paramCommentsListEndIndex = cursor.length-1;
                } 

                for (let i = paramCommentsListStartIndex; i<= paramCommentsListEndIndex; i++) {   
                    if(i>= cursor.length){
                        break;
                    }
                    let localIsmine = paramUserId === cursor[i].comments.userId;
                    
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
                        //unlikes: cursor[i].comments.unlikes, => 스키마에는 없는 데, 여기에는 있어서 남겨봄
                        created_at: cursor[i].comments.created_at, 
                        ismine: localIsmine
                    })
                } 
            context.commentslist.splice(0,1);
            res.json(context);  
            res.end();
            return;
        }) 
    } 
    else {
        console.log('courseevaluations/showcommentslist 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
    } 
}; 

/**
 * @description 1개의 강의 평가 추가
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const addComment = async function(req, res) {
    const database = await getDatabase();
    console.log('courseevaluations/addcomment 호출');

	if (!(database instanceof Error)) {  
        const paramCourseId = req.body.courseid === 'NO-ID'
                                ? utils.ZEROID
                                : req.body.courseid;

        const paramUserId = utils.JWTVerifyId(req.body.jwt);

        const paramContents = req.body.contents === ''
                                ? 'There is no comment'
                                : req.body.contents; 

        const paramExam = req.body.exam ==='' 
                            ? req.body.exam.toString() 
                            : 'N/A'; 

        const paramAssignment = req.body.assignment === '' 
                                    ? req.body.assignment.toString()
                                    : 'N/A';
        const paramGrade = req.body.grade || 'N/A'; 
        const paramDifficulty = req.body.difficulty || 'N/A';
        const paramRating = req.body.rating || 0;
        const commentId = new mongoose.Types.ObjectId(); 

        console.log('paramCourseId: ' + paramCourseId); 
        console.log('paramUserId: ' +  paramUserId);
        console.log('paramDifficulty: ' + paramDifficulty);
        console.log('paramAssignment: ' + paramAssignment); 
        console.log('paramExam: ' + paramExam);
        console.log('paramGrade: ' + paramGrade); 
        console.log('paramRating: ' + paramRating);
        console.log('paramContents: ' + paramContents); 
  
        database
            .collection('users')
            .findOne({_id: new ObjectId(paramUserId)}, function(err,user){            
                if(err){ 
                    console.log('courseevaluations/addcomment에서 사용자 조회 중 에러 발생: ' + err.stack);
                    res.end();
                    return; 
                }     
                // 사용자가 존재하지 않을 경우 
                if (user === null) {
                    console.log('courseevaluations/addcomment에서 조회된 사용자가 없음');  
                    res.json({msg: 'missing'});
                    res.end(); 
                    return;
                } 
                //이미 강의 평가를 작성했는 지 확인
                database
                    .collection('courseevaluations')
                    .findOne({'comments.userId': new ObjectId(paramUserId)}, function(err,data){
                        if (err) {
                            console.log('courseevaluations/addcomment에서 강의 평가 작성 여부 확인 중 에러 발생 ' + err.stack);
                            res.end();
                            return;
                        } 
                        //이미 강의 평가를 작성한 경우
                        if (data !== null) {
                            console.log('courseevaluations/addcomment에서 이미 강의 평가를 작성한 사용자가 강의 평가 작성 요청함'); 
                            res.json({msg: 'duplicate'});
                            res.end(); 
                            return;
                        } 
                        
                        //강의평가 삽입   
                        database
                            .collection('courseevaluations')
                            .updateOne({_id: new ObjectId(paramCourseId)},
                                {'$push': { comments: { 
                                                _id: commentId,
                                                userId: new ObjectId(paramUserId), 
                                                nickNm: user.nickNm, 
                                                difficulty: paramDifficulty,
                                                assignment: paramAssignment,  
                                                exam: paramExam, 
                                                grade: paramGrade, 
                                                rating: paramRating, 
                                                contents: paramContents, 
                                                likes: 0, 
                                                unlikes: 0,  
                                                likesList: [], 
                                                created_at: utils.timestamp()
                                                }
                                            }
                                }, function(err2){
                                        if(err2){
                                            console.log('courseevaluations/addcomment에서 강의 평가 추가 중 에러 발생: ' + err2.stack)
                                            return;
                                        }    
                                        console.log('강의 평가 추가함'); 
                                        res.json({msg: 'success'}); 
                                        res.end();
                                        return; 
                                    }) //updateOne닫기 
                    })//database.collection('courseevaluations').findOne 닫기    
            })//collection('users').findOne 닫기
    } else {
        console.log('courseevaluations/addcomment 수행 중 데이터베이스 연결 실패')
        res.end(); 
        return;
    } 
}; 

/**
 * @description 편집한 강의평가 내용을 데이터베이스에 저장 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const editComment = async function(req, res) {
    const database = await getDatabase();
    console.log('courseevaluations/editcomment 호출');

    if (!(database instanceof Error)){ 
        const paramCourseId = req.body.courseid === 'NO-ID'
                                ? utils.ZEROID
                                : req.body.courseid; 

        const paramCommentId = req.body.commentid || utils.ZEROID;
        const paramContents = req.body.contents === ''
                                ? 'There is no comment'
                                : req.body.contents; 

        const paramExam = req.body.exam !== undefined || req.body.exam === '' 
                            ? req.body.exam.toString()  
                            : 'N/A';  // 숫자 0을 제대로  인식하지 못해서 이렇게 작성함
        
        const paramAssignment = req.body.assignment !== undefined
                                    ? req.body.assignment.toString()
                                    : 'N/A';
        const paramGrade = req.body.grade || 'N/A'; 
        const paramDifficulty = req.body.difficulty || 'N/A';
        const paramRating = req.body.rating || 0; 
                    
        console.log('paramCourseId: ' + paramCourseId); 
        console.log('paramCommentId: ' + paramCommentId); 
        console.log('paramContents: ' + paramContents); 
        console.log('paramExam: ' + paramExam);
        console.log('paramAssignment: ' + paramAssignment); 
        console.log('paramGrade: ' + paramGrade);
        console.log('paramDifficulty: ' + paramDifficulty);  
        console.log('paramRating: ' + paramRating);  
            
        //강의 평가 수정  
        database
            .collection('courseevaluations')
            .updateOne({_id: new ObjectId(paramCourseId), 'comments._id': new ObjectId(paramCommentId)},
            {$set: { 
                        'comments.$.difficulty': paramDifficulty,
                        'comments.$.assignment': paramAssignment,  
                        'comments.$.exam': paramExam, 
                        'comments.$.grade': paramGrade, 
                        'comments.$.rating': paramRating, 
                        'comments.$.contents':paramContents, 
                    }
            },
            {'new':true}, function(err, result){
                if (err) {
                    console.log('courseevaluations/editcomment에서 강의 평가 수정 중 에러 발생: ' + err.stack)
                    return;
                }   
                //조회된 강의 평가가 없는 경우   
                if(result.modifiedCount === 0 || result === null){
                    console.log('courseevaluations/editcomment에서 수정할 강의 평가 조회 불가');
                    res.json({msg: 'empty'}); 
                    res.end();
                    return;
                }
                console.log('강의 평가 수정함');   
                res.json({msg: 'success'}); 
                res.end();
                return; 
            }) //updateOne 닫기 
    } 
    else {
        console.log('courseevaluations/editcomment 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
    }  
}; 

/**
 * @description 강의평가 삭제 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const deleteComment = async function(req, res) { 
    const database = await getDatabase();
    console.log('courseevaluations/deletecomment 호출');

	if (!(database instanceof Error)){
        const paramCourseId = req.body.courseid === 'NO-ID'
                                ? utils.ZEROID
                                : req.body.courseid; 

        const paramCommentId = req.body.commentid || utils.ZEROID; 
        
        console.log('paramCourseId: ' + paramCourseId); 
        console.log('paramCommentId: ' + paramCommentId);  
            
        //강의 평가 삭제  
        database
            .collection('courseevaluations')
            .updateOne({_id: new ObjectId(paramCourseId)},
            {$pull: { 'comments': { '_id': new ObjectId(paramCommentId)}}}, function(err, result){
                if (err) {
                        console.log('courseevaluations/editcomment에서 강의 평가 삭제 중 에러 발생: ' + err.stack);
                        res.end();
                        return;
                } 
                //조회된 강의 평가가 없는 경우   
                if(result.modifiedCount === 0 || result === null){
                    console.log('courseevaluations/editcomment에서 삭제할 강의 평가 조회 불가');
                    res.json({msg: 'empty'}); 
                    res.end();
                    return;
                }
                res.json({msg: 'success'}); 
                res.end();
                return; 
            }) //updateOne 닫기 
    } else {
        console.log('courseevaluations/deletecomment 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
    }  
}; 

/**
 * @description 강의평가에 좋아요 1 증가 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const increLikeComment = async function(req, res) {
    console.log('courseevaluations/increlikecomment 호출됨.');
    const database = await getDatabase();

    const paramCourseId = req.body.courseid || utils.ZEROID;  
    const paramCommentId = req.body.commentid || utils.ZEROID;  
    const paramUserId = utils.JWTVerifyId(req.body.jwt); 
    
    console.log('paramCourseId: ' + paramCourseId); 
    console.log('paramCommentId: ' + paramCommentId);
    console.log('paramUSerId: ' + paramUserId);

    let context = {
        likesinfo: [{ 
            likes: 0, 
            likespressed: false  
        }], 
        msg: ''};

    if (!(database instanceof Error)){
        database
            .collection('users')
            .findOne({_id: new ObjectId(paramUserId)},function(err,user){
                if (err) {
                    console.log('courseevaluations/increlikecomment에서 좋아요를 누른 사용자 조회 중 에러 발생: ' + err.stack);
                    res.end(); 
                    return;
                }  
                if (!user) {
                    console.log('courseevaluations/increlikecomment에서 사용자를 조회할 수 없음'); 
                    res.json({msg: 'missing'}); 
                    res.end(); 
                    return;
                }
                //이미 좋아요를 눌렀으나 좋아요 요청을 또 다시 해온 경우, 좋아요를 반영하지 않고 반환한다. 
                database
                    .collection('courseevaluations')
                    .findOne({_id: new ObjectId(paramCourseId)}, function(err,post){
                        if (err) {
                            console.log('courseevaluations/increlikecomment 안에서 요청한 사용자가 해당 게시물에 이미 좋아요를 눌렀는 지 조회하는 중 에러 발생: '+ err.stack)
                            res.end(); 
                            return;
                        }   
                        if (!post) {
                            console.log('courseevaluations/increlikecomment 안에서 게시글 조회 실패');   
                            res.json({msg: 'empty'}); 
                            res.end(); 
                            return;
                        }
                        // commentIndex: 좋아요를 누르고자 하는 게시글이 array 내에서 지니는 인덱스 번호 
                        // localLikes 
                        let commentIndex = -1;
                        let localLikes = -1;    
                        
                        //강의 평가에 해당하는 인덱스 값(i) 찾기
                        for(let i=0;i<post.comments.length;i++){  
                            if(post.comments[i]._id.toString() === paramCommentId){
                                commentIndex = i;
                                localLikes = post.comments[i].likes 
                                break;
                                }
                            }  
                        if (commentIndex === -1) {
                            console.log('courseevaluations/increlikecomment 안에서 요청 받은 강의 평가 조회 실패');  
                            res.json({msg: 'empty'}); 
                            res.end();
                            return;
                        }
                        //이미 좋아요를 눌렀던 상태일 경우 반환
                        for(let j=0; j<post.comments[commentIndex].likesList.length; j++){ 
                            if (post.comments[commentIndex].likesList[j].userId.toString() === paramUserId) {
                                console.log('courseevaluations/increlikecomment에서 이미 좋아요를 누른 강의 평가에 다시 좋아요 요청함')
                                context.msg = 'duplicate'; 
                                context.likesinfo.push({likes: localLikes, likespressed: true}); 
                                context.likesinfo.splice(0,1);  
                                res.json(context);
                                res.end();   
                                return;
                            }
                        }
                        //좋아요를 증가시킬 강의 평가를 조회 
                        database
                            .collection('courseevaluations')
                            .findOneAndUpdate({_id: new ObjectId(paramCourseId), 'comments._id': new ObjectId(paramCommentId)},  
                            { 
                                $inc: {'comments.$.likes': 1}, 
                                $push: { 
                                    'comments.$.likesList': {
                                        userId: new ObjectId(paramUserId),  
                                        nickNm: user.nickNm 
                                }}  
                            }, function (err) {
                                    if (err) {
                                            console.log('courseevaluations/increlikecomment 안에서 좋아요를 1 증가시킬 게시물 조회 중 에러 발생: '+ err.stack)
                                            res.end(); 
                                            return;
                                    }		 
                                    context.likesinfo.push({likes: localLikes+1, likespressed: true}) 
                                    context.likesinfo.splice(0,1);  
                                    context.msg = 'success';
                                    res.json(context);
                                    res.end(); 
                                    return; 
                                })//findOneAndUpdate 닫기 
                    })//findOne 닫기
            })//collection('users').findOne 닫기 

    } else {  
        console.log('courseevaluations/increlikecomment 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
    }	     
}; //increLikeComment 닫기   
  
/**
 * @description 강의평가에 좋아요 1 감소 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const decreLikeComment = async function(req, res) { 
    const database = await getDatabase();
    console.log('courseevaluations/decrelikecomment 호출됨.');
    
    const paramCourseId = req.body.courseid || utils.ZEROID;  
    const paramUserId = utils.JWTVerifyId(req.body.jwt);
    const paramCommentId = req.body.commentid || utils.ZEROID;
    
    console.log('paramCourseId: ' + paramCourseId);  
    console.log('paramUserId: ' + paramUserId); 
    console.log('paramCommentId: ' + paramCommentId);
  
    let context = {
      likesinfo: [{ 
        likes: 0, 
        likespressed: true  
      }], 
      msg: ' '};

    if (!(database instanceof Error)){
        database
            .collection('users')
            .findOne({_id: new ObjectId(paramUserId)}, function(err,user){
                if(err){
                    console.log('courseevaluations/decrelikecomment에서 좋아요를 취소한 사용자 조회 중 에러 발생: ' + err.stack);
                }
                if(!user){
                    console.log('courseevaluations/decrelikecomment에서 사용자를 조회할 수 없음');
                    res.json({msg: 'missing'}); 
                    res.end(); 
                    return;
                }
                database
                    .collection('courseevaluations')
                    .findOne({_id: new ObjectId(paramCourseId)}, function(err,post){
                        if (err) {
                            console.log('courseevaluations/decrelikecomment 안에서 요청한 사용자가 해당 게시물에 이미 좋아요를 눌렀는 지 조회하는 중 에러 발생: '+ err.stack);
                            res.end(); 
                            return;
                        }   
                        if(!post){
                            console.log('courseevaluations/decrelikecomment 안에서 게시글 조회 실패')   
                            res.json({msg: 'empty'}); 
                            res.end(); 
                            return;
                        }
                        
                        let commentIndex = -1;
                        let localLikes = -1;     
                        let isinLikedList = false;
                            
                        //업데이트 할 강의 평가의 인덱스(i) 조회 및 업데이트 전 좋아요 갯수(localLikes) 설정
                        for(let i=0;i<post.comments.length;i++){  
                            if(post.comments[i]._id.toString() === paramCommentId){
                            commentIndex = i;
                            localLikes = post.comments[i].likes; 
                            break;
                            }
                        } 
                        //좋아요 갯수를 감소하고자 하는 강의 평가 조회 실패
                        if(commentIndex === -1){
                            console.log('courseevaluations/decrelikecomment 안에서 요청 받은 강의 평가 조회 실패');  
                            res.json({msg: 'empty'}); 
                            res.end(); 
                            return;
                        }   
                        for(let j=0; j<post.comments[commentIndex].likesList.length; j++){
                            if(post.comments[commentIndex].likesList[j].userId.toString() === paramUserId){
                            isinLikedList = true;
                            break;
                            }
                        }
                        //좋아요를 누른 사람의 목록에 없으나 좋아요 취소 요청을 해온 경우, 좋아요 취소를 반영하지 않고 반환한다. 
                        if(!isinLikedList) {
                            console.log('courseevaluations/decrelikecomment에서 likesList 안에서 요청한 사용자를 찾을 수 없음');  
                            res.json({msg: 'empty'}); 
                            res.end(); 
                            return;
                        }
                        
                        //좋아요를 감소시킬 강의 평가를 조회 및 업데이트 실행
                        database
                            .collection('courseevaluations')
                            .findOneAndUpdate(
                            {
                            _id: new ObjectId(paramCourseId), 
                            'comments._id': new ObjectId(paramCommentId),
                            'comments.likesList.userId': new ObjectId(paramUserId),
                            },  
                            { 
                            $inc: {'comments.$.likes': -1}, 
                            $pull: 
                                {'comments.$.likesList' :{'userId': new ObjectId(paramUserId)}}    
                            
                            },{upsert: true,new: true}, function(err){
                                if (err) {
                                        console.log('courseevaluations/decrelikecomment 안에서 좋아요를 1 감소시킬 게시물 조회 중 에러 발생: '+ err.stack)
                                        res.end(); 
                                        return;
                                }		   
                                context.likesinfo.push({likes: localLikes-1, likespressed: false}); 
                                context.likesinfo.splice(0,1);  
                                context.msg = 'success';
                                res.json(context);
                                res.end(); 
                                return; 
                            })//findOneAndUpdate 닫기 
                    })//findOne 닫기
            })//collection('users').findOne 닫기 
    } else {  
        console.log('courseevaluations/decrelikecomment 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
    }	    
}; //decreLikeComment 닫기 

/**
 * @description 조회한 교수의 과목 정보 조회. 검색한 교수명 (혹은 일부) 으로 조회 가능 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const showProfessorProfile = async function(req, res) {
    console.log('courseevaluation/showprofessorprofile 호출됨.');
    const database = await getDatabase();
    const paramProfessor = req.body.professor || ''; 
    
    console.log('paramProfessor: ' + paramProfessor);
    
    let context = {
        professorinfo: 
            [{
                subjectslist: [
                    {subject: ''}
                ], 
                institution: '', 
                professor: ''
            }]
    };
    let query = {};
    if(paramProfessor !== ' '){
        query = {professor: new RegExp('.*'+paramProfessor+'.*','gi')} 
    } 
    if (!(database instanceof Error)){
        //해당 교수의 모든 과목 조회 
        database
            .collection('professors')
            .find(query)
            .toArray(function(err1, professor){
                    if (err1) {
                    console.log('courseevaluation/showprofessorprofile 안에서 해당 교수 조회 중 에러 발생: '+ err1.stack)
                    res.end(); 
                    return;
                    }  
                    console.log(professor)
                    if(professor.length === 0){
                        console.log('courseevaluation/showprofessorprofile 수행 중 데이터베이스에서 교수 정보를 찾을 수 없음') 
                        res.end(); 
                        return;
                    } 
                    let index = 0;
                    //교수 정보 입력
                    professor.forEach( function(items){                   
                        context.professorinfo.push({institution: items.school, professor: items.professor, subjectslist: []});
                    
                    //해당 교수의 모든 과목 조회 
                    database
                        .collection('courseevaluations')
                        .find({professor: items.professor})
                        .toArray(function(err, cursor){
                            if (err) {
                                console.log('courseevaluation/showprofessorprofile 안에서 해당 교수의 과목들 조회 중 에러 발생: '+ err.stack)
                                res.end(); 
                                return;
                            } 
                            cursor.map( (subjects) => {    
                                context.professorinfo[index].subjectslist.push({subject: subjects.subject});
                            }); 
                            context.professorinfo.splice(0,1); 
                            res.json(context); 
                            res.end();
                            return; 
                            })
                    index++;
                    })//professor.forEach 닫기   
                })//collection('professors').findOne  닫기  
    } else {  
        console.log('courseevaluation/showprofessorprofile 수행 중 데이터베이스 연결 실패');
        res.end(); 
        return;
      }
  }; //showProfessorProfile 닫기 

//////////////////각각의 강의평가와 관련된 함수 끝 /////////////////////////////////

module.exports.showCoursesList = showCoursesList;  
module.exports.showCommentsList = showCommentsList;  
module.exports.addComment = addComment;
module.exports.editComment = editComment;
module.exports.deleteComment = deleteComment; 
module.exports.increLikeComment = increLikeComment; 
module.exports.decreLikeComment = decreLikeComment;
module.exports.showProfessorProfile = showProfessorProfile;  