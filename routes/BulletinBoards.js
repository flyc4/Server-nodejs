/*
 * 게시판을 위한 라우팅 함수 정의
 *
 * @date 2018-09-04
 * @author ChangHee
 */

var mongoose = require('mongoose');
var jwt = require('jsonwebtoken'); 
var ObjectId = mongoose.Types.ObjectId;  
var utils = require('../config/utils');
 

///////////////////"bulletinboardslist" collection을 사용하는 함수 /////////////////////////////////////

//게시판 목록 보여 주기 
var ShowBulletinBoardsList = function(req, res) {
  console.log('ShowBulletinBoardsList 모듈 안에 있는 ShowBulletinBoardsList 호출됨.');
  var context = {boardslist: [{ boardid: '', boardname: '', contents: ''}]}
  var database = req.app.get('database');      
  
  if (database.db){       

    // 모든 게시판 조회 
    database.db.collection("bulletinboardslist").find({}).toArray(function(err,data){ 
      if(err){
        utils.log("ShowBulletinBoardsList에서 collection 조회 중 수행 중 에러 발생"+ err.message)
      }
      data.forEach(function(data2){ 
        
        context.boardslist.push({boardid: data2.boardname, boardname: data2.boardname, contents: data2.contents}) 
      });   
    context.boardslist.splice(0,1);  
    res.json(context);
    res.end();
    return;
    });
  }//if(database.db) 닫기  
  else {  
    utils.log("ShowBulletinBoardsList 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
  }   
return;
};//ShowBulletinBoardsList 닫기  

///////////////////"bulletinboardslist" collection을 사용하는 함수 끝 /////////////////////////////////////

//////////////////신고와 관련된 함수 (댓글 도 신고 가능해서 여기에 위치 시킴)/////////////////////////////////

//신고 접수한 내용을 데이터베이스에 저장
var AddReport =function(req, res) {
  console.log('ShowBulletinBoardsList 모듈 안에 있는 AddReport 호출됨.');
  
  var paramTitle = req.body.title || req.query.title;
  var paramContents = req.body.contents || req.query.contents;
  var paramUserId = req.body.userid || req.query.userid; 
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000"; 
  var paramCommentId = req.body.commentid||req.query.commentid||"000000000000000000000000";

  var database = req.app.get('database');      
  
  console.log('paramTitle: ' + paramTitle + ', paramContents: ' + paramContents + ', paramUserId: ' + 
  paramUserId, ', paramBoardId: ' + paramBoardId, ', paramEntryId: ' + paramEntryId + 
  ', paramCommentId: ' + paramCommentId);

  if (database.db){       
    
    //신고를 한 사용자 조회(populate 불가능해서 이렇게 구현함) 
    database.UserModel.findOne({_id: new ObjectId(paramUserId)}, function(err, user) {
      if (err) {
        utils.log("AddReport 안에서 사용자 조회 중 에러발생: " + err.message);
        res.end();
        return;
      } 
      if (user == undefined ) {
        utils.log('AddReport 안에서 사용자가 조회되지 않았습니다.'); 
        res.end(); 
        return;
      } 
      else{   
        //사용자 조회 완료. 신고 내역 추가  
          database.db.collection('reports').insertOne({
            userid: user._id, 
            nickNm: user.nickNm,   
            boardid: paramBoardId, 
            entryid: paramEntryId, 
            commentid: paramCommentId,
            title: paramTitle,
            contents: paramContents,
            created_at: utils.timestamp(), 
            });//insertOne 닫기
           return; 
      }//else{ (사용자 조회 성공 시의 else) 닫기 
    })//UserModel.findOne 닫기
  }//if(database.db) 닫기  
  else {  
    utils.log("AddReport 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
  }   
};//AddReport 닫기

//////////////////신고와 관련된 함수 끝/////////////////////////////////


//////////////////한 게시판(Entry 혹은 BulletinBoard 혹은 Post)과 관련된 함수 들) 시작 /////////////////////////////////

//한 게시판의 모든 게시물 보여주기  
var ShowBulletinBoard = function(req, res) {
  console.log('BulletinBoard 모듈 안에 있는 ShowBulletinBoard 호출됨.');
  var database = req.app.get('database');      
  
  var paramboardid = req.body.boardid||req.query.boardid || req.param.boardid;   
  var paramuserid= req.body.userid||req.query.userid || req.param.userid||"5d5373177443381df03f3040";
  var parampostStartIndex = req.body.postStartIndex||req.query.postStartIndex || req.param.postStartIndex||0; 
  var parampostEndIndex = req.body.postEndIndex||req.query.postEndIndex || req.param.postEndIndex||19;  

  console.log("paramboardid: ",paramboardid) 
  console.log("paramuserid: ",paramuserid) 
  console.log("parampostStartIndex: ",parampostStartIndex)
  console.log("parampostEndIndex: ",parampostEndIndex)

  parampostStartIndex = parampostStartIndex*1;
  parampostEndIndex = parampostEndIndex*1;

  var context = {postslist: [{ boardid: " ", entryid: "", userid: "", username: '', profile: '', likes: 0,
   date: ' ', ismine: false, title: ' ', contents: ' ', pictures: ' ' }]};
  
  if (database.db){    
    database.db.collection(paramboardid).aggregate([
      { $sort: {
        'created_at': -1
      }},  
      ]).toArray(function(err,data){ 
      if(err){
        utils.log("ShowBulletinBoard에서 collection 조회 중 수행 중 에러 발생"+ err.message);
      }  
      if(parampostEndIndex>=data.length){
        parampostEndIndex = data.length-1;
      } 
      for(var i=parampostStartIndex;i<=parampostEndIndex;i++){  
        var localismine = data[i].userid == paramuserid
        context.postslist.push({boardid: paramboardid, entryid: data[i]._id, userid: data[i].userid, 
          username: data[i].userid.nickNm, profile: data[i].profile, likes: data[i].likes, date: data[i].created_at, 
          ismine: localismine, username: data[i].nickNm, title: data[i].title, contents: data[i].title, pictures: data[i].pictures}); 
        } 
    context.postslist.splice(0,1)   
    console.dir(context.postslist)
    res.json(context);
    return;  
  })
    
  }//if(database.db) 닫기 
else {
    
    utils.log(" ShowBulletinBoard 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
}
};//ShowBulletinBoard 닫기   

//param에 대해 camel 표기법 및  적용. ex. paramTitle 
//인자로 받은 paramEntryId가 있다면 수정을, 없다면 추가를 각각 실행

var AddEditEntry = function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 AddEditEntry 호출됨.');
  
  var paramTitle = req.body.title || req.query.title;
  var paramContents = req.body.contents || req.query.contents;
  var paramUserId = req.body.userid || req.query.userid; 
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000";
  var database = req.app.get('database');
  
  console.log('paramTitle: ' + paramTitle + ', paramContents: ' + paramContents + ', paramBoardId: ' + 
  paramBoardId, 'paramEntryId: ' + paramEntryId);

// 데이터베이스 객체가 초기화된 경우
if (database.db) {
      
      // 1. 아이디를 이용해 사용자 검색
  database.UserModel.findOne({_id: new ObjectId(paramUserId)}, function(err, user) {
    if (err) {
      utils.log("AddEditEntry 안에서 사용 자 조회 중 에러발생: " + err.message);
      res.end();
      return;
    } 
    if (user == undefined ) {
      utils.log('AddEditEntry 안에서 사용자가 조회되지 않았습니다.'); 
      res.end(); 
      return;
    } 
    else{   
      //조회 완료한 Post의 제목 및 내용 덮어쓰기 
      database.db.collection(paramBoardId).findOneAndUpdate({_id: new ObjectId(paramEntryId)},
      {$set: {title: paramTitle, contents: paramContents}},  
       function(err,data){ 
        if(err){
          utils.log("AddEditEntry에서 collection 조회 중 수행 중 에러 발생: "+ err.message)
        }  
         // 조회 된 data가 없다면 새로운 document 삽입
         if (data.value == null) {  
          console.log("새로운 게시물 삽입") 
          database.db.collection(paramBoardId).insertOne({
            title: paramTitle,
            contents: paramContents,
            userid : user._id,
            nickNm : user.nickNm,
            profile : " ",
            likes : 0, 
            created_at: utils.timestamp(),
            pictures: " ",
             hits : 0,
            comments : []
            });
          console.log("글 데이터 추가함.");    		   
        }     			 
      return;   
      })//findOneAndUpdate 닫기 
    }
  })//UserModel.findOne 닫기
  } else {  
      utils.log('AddEditEntry 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }	
}; //AddEditEntry 닫기

//게시글 삭제
var DeleteEntry = function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 DeleteEntry 호출됨.');
  
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000";

  var database = req.app.get('database');
  
  console.log('paramBoardId: ' + paramBoardId, 'paramEntryId: ' + paramEntryId);

// 데이터베이스 객체가 초기화된 경우
if (database.db) {
      
      //삭제할 게시물을 조회 
      database.db.collection(paramBoardId).remove({_id: new ObjectId(paramEntryId)},{justone: true}, 
      function(err){
        if (err) {
                utils.log("DeleteEntry 안에서 삭제할 게시물 조회 중 에러 발생: "+ err.message)
                res.end(); 
                return;
          }		 
    console.log("게시물 삭제 완료"); 
    return; 
      })
  } else {  
      utils.log('DeleteEntry 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }	
}; //DeleteEntry 닫기 

//게시글에 좋아요 1 증가
var IncreLikeEntry = function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 IncreLikeEntry 호출됨.');
  
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000"; 
  

  var database = req.app.get('database');
  
  console.log('paramBoardId: ' + paramBoardId, 'paramEntryId: ' + paramEntryId);

  // 데이터베이스 객체가 초기화된 경우
  if (database.db) {
      
      //좋아요를 증가시킬 게시물을 조회 
      database.db.collection(paramBoardId).findOneAndUpdate({_id: new ObjectId(paramEntryId)},  
        {$inc: {likes: 1}},
      function(err){
        if (err) {
                utils.log("IncreLikeEntry 안에서 좋아요를 1 증가시킬 게시물 조회 중 에러 발생: "+ err.message)
                res.end(); 
                return;
          }		  
        return; 
        })
  } else {  
      utils.log('IncreLikeEntry 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }	
}; //IncreLikeEntry 닫기 

//////////////////한 게시판(Entry 혹은 BulletinBoard 혹은 Post)과 관련된 함수 들) 끝 /////////////////////////////////  

//////////////////한 게시판의 댓글(comments)과 관련된 함수들 시작 /////////////////////////////////

//해당 게시물의 모든 댓글 보여주기
var ShowComments = function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 ShowComments 호출됨.');
  var database = req.app.get('database');      
  
  var paramBoardId = req.body.boardid||req.query.boardid || req.param.boardid;   
  var paramEntryId = req.body.entryid||req.query.entryid || req.param.entryid;
  var paramUserId = req.body.userid||req.query.userid || req.param.userid;  
  var paramCommentStartIndex = req.body.commentstartindex||req.query.commentstartindex || req.param.commentstartindex||0; 
  var paramCommentEndIndex = req.body.commentendindex||req.query.commentendindex || req.param.commentendindex||19; 
  
  console.log("paramCommentStartIndex: ",paramCommentStartIndex)
  console.log("paramCommentEndIndex: ",paramCommentEndIndex)


  console.log('paramUserId: ' + paramUserId, ', paramBoardId: ' + paramBoardId, ', paramEntryId: ' + paramEntryId);

  var context = {commentslist: [{ boardid: " ", entryid: "", rootreplyid: "", parentreplyid: "", replyid: "", 
    userid: "", username: " ", profile: '', likes: 0, date: ' ', ismine: false, contents: ' ', pictures: ' ' }]};

  if (database.db){    
    database.db.collection(paramBoardId).aggregate([
      { $match: { 
      _id: new ObjectId(paramEntryId)}},   

      //Expand the courses array into a stream of documents
      { "$unwind": '$comments'},
      // Sort in ascending order
      { $sort: {
          'comments.created_at': -1
      }},  
      ]).toArray(function(err,result){ 
          if(err){ 
              utils.log('ShowComments 안에서 댓글 조회 중 에러 발생 : ' + err.message);
              res.end(); 
              return;  
          }     
          paramCommentEndIndex = paramCommentEndIndex < result.length? paramCommentEndIndex: result.length-1;
          
          for(var i= paramCommentStartIndex; i<= paramCommentEndIndex; i++){  
            var localismine = paramUserId == result[i].comments.userid;
            context.commentslist.push({boardid: paramBoardId, entryid: paramEntryId, rootreplyid: result[i].comments.rootreplyid
            , parentreplyid: result[i].comments.parentreplyid, replyid: result[i].comments._id, userid: result[i].comments.userid, username: result[i].comments.nickNm 
            , profile: result[i].comments.profile, likes: result[i].comments.likes, date: result[i].comments.created_at, ismine: localismine, contents: result[i].comments.contents
            , pictures: result[i].comments.pictures});
          } 
          context.commentslist.splice(0,1) 
          res.json(context); 
          return;
      })//aggregate 닫기 
  }//if(database.db) 닫기 
  else {
  utils.log("ShowComment 수행 중 데이터베이스 연결 실패")
  res.end(); 
  return;
  }  
};//ShowComments 닫기

//현재 게시판에 댓글을 다는 함수 
var AddComment = function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 AddComment 호출됨.');
  
  var paramUserId = req.body.userid || req.query.userid; 
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000"; 
  var paramRootReplyId = req.body.rootreplyid||req.query.rootreplyid||"000000000000000000000000";
  var paramParentReplyId = req.body.parentreplyid||req.query.parentreplyid||"000000000000000000000000";
  var paramContents = req.body.contents || req.query.contents|| "no contents"; 
  var paramPictures = req.body.pictures || req.query.pictures || "no pictures";

  var database = req.app.get('database');
  
  console.log('paramContents: ' + paramContents + ', paramBoardId: ' + 
    paramBoardId, 'paramEntryId: ' + paramEntryId, 'paramParentReplyId: ' + paramParentReplyId, 
    'paramRootReplyId: ' + paramRootReplyId);

// 데이터베이스 객체가 초기화된 경우
if (database.db) { 
  
      
      // 1. 아이디를 이용해 사용자 검색
  database.UserModel.findOne({_id: new ObjectId(paramUserId)}, function(err, user) {
    if (err) {
      utils.log("AddComment 안에서 사용 자 조회 중 에러발생: " + err.message);
      res.end();
      return;
    } 
    if (user == undefined ) {
      utils.log('AddComment 안에서 사용자가 조회되지 않았습니다.'); 
      res.end(); 
      return;
    } 
    else{   
      //조회 완료한 사용자의 이름으로 댓글 추가 
      var objectid = new mongoose.Types.ObjectId();
      database.db.collection(paramBoardId).updateOne(
        {_id: new ObjectId(paramEntryId)}, {"$push": { 
          comments: {
            _id: objectid,
            userid: user._id,  
            nickNm: user.nickNm,
            boardid: paramBoardId,   
            parentreplyid: paramParentReplyId, //부모 댓글의 id
            rootreplyid: paramRootReplyId, //루트 댓글의 id
            likes: 0,
            contents: paramContents,
            pictures: paramPictures, 
            created_at: utils.timestamp(), 
        }}});
          console.log("댓글 추가함.");    		   
        }     			 
      return;  
  })//UserModel.findOne 닫기
  } else {  
      utils.log('AddComment 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }	
}; //AddComment 닫기
 
var EditComment = function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 EditComment 호출됨.');
  
  var paramContents = req.body.contents || req.query.contents; 
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000"; 
  
  //나: commentid, 추: replyid
  var paramCommentId = req.body.replyid||req.query.replyid;

  var database = req.app.get('database');
  
  console.log(' paramContents: ' + paramContents + ', paramBoardId: ' +  paramBoardId, 
    'paramEntryId: ' + paramEntryId, 'paramCommentId: ' + paramCommentId);

// 데이터베이스 객체가 초기화된 경우
if (database.db) {
         
  //조회 완료한 댓글 내용 덮어쓰기 
  database.db.collection(paramBoardId).updateOne({_id: new ObjectId(paramEntryId), 'comments._id': new ObjectId(paramCommentId)},
  {$set: {'comments.$.contents': paramContents}},
  function(err,data){ 
    if(err){
      utils.log("EditComment에서 collection 조회 중 수행 중 에러 발생: "+ err.message)
    }     
    console.log("댓글 수정 완료") 			 
    return;   
  })//findOneAndUpdate 닫기 
} else {  
  utils.log('EditComment 수행 중 데이터베이스 연결 실패');
  res.end(); 
  return;
}	
}; //EditComment 닫기 

//댓글 삭제
var DeleteComment = function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 DeleteComment 호출됨.');
  
  var paramContents = req.body.contents || req.query.contents; 
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000"; 
  
  //나: commentid, 추: replyid
  var paramCommentId = req.body.replyid||req.query.replyid;

  var database = req.app.get('database');
  
  console.log( 'paramBoardId: ' +  paramBoardId, 'paramEntryId: ' + paramEntryId, 'paramCommentId: ' + paramCommentId);

// 데이터베이스 객체가 초기화된 경우
if (database.db) {
         
  //조회 완료한 Post의 제목 및 내용 덮어쓰기 
  database.db.collection(paramBoardId).updateOne({_id: new ObjectId(paramEntryId)},
  {$pull: { 'comments': { '_id': new ObjectId(paramCommentId)}}},
  function(err,data){ 
    if(err){
      utils.log("DeleteComment에서 collection 조회 중 수행 중 에러 발생: "+ err.message) 
      res.end();
      return;
    }       			 
    res.end();
    return;   
  })//findOneAndUpdate 닫기 
} else {  
  utils.log('DeleteComment 수행 중 데이터베이스 연결 실패');
  res.end(); 
  return;
}	
}; //DeleteComment 닫기  

//댓글 좋아요 1 증가
var IncreLikeComment = function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 IncreLikeComment 호출됨.');
  
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000";  
  var paramCommentId = req.body.replyid||req.query.replyid;
  

  var database = req.app.get('database');
  
  console.log('paramBoardId: ' + paramBoardId, ', paramEntryId: ' + paramEntryId, 
    ', paramCommentId: ' + paramCommentId);

  // 데이터베이스 객체가 초기화된 경우
  if (database.db) {
      
      //좋아요를 증가시킬 게시물을 조회 
      database.db.collection(paramBoardId).findOneAndUpdate({_id: new ObjectId(paramEntryId), 'comments._id': new ObjectId(paramCommentId)},  
        {$inc: {'comments.$.likes': 1}},
      function(err){
        if (err) {
                utils.log("IncreLikeComment 안에서 좋아요를 1 증가시킬 게시물 조회 중 에러 발생: "+ err.message)
                res.end(); 
                return;
          }		  
        return; 
        })
  } else {  
      utils.log('IncreLikeComment 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }	
}; //IncreLikeComment 닫기


//////////////////한 게시판의 댓글(comments)과 관련된 함수들 끝 /////////////////////////////////

module.exports.ShowBulletinBoardsList = ShowBulletinBoardsList; 
module.exports.AddReport = AddReport;
module.exports.ShowBulletinBoard = ShowBulletinBoard;  
module.exports.AddEditEntry = AddEditEntry; 
module.exports.DeleteEntry = DeleteEntry;
module.exports.IncreLikeEntry = IncreLikeEntry;
module.exports.ShowComments = ShowComments; 
module.exports.AddComment = AddComment;
module.exports.EditComment = EditComment;  
module.exports.DeleteComment = DeleteComment; 
module.exports.IncreLikeComment = IncreLikeComment;