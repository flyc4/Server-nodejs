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
var ShowBulletinBoardsList = async function(req, res) {
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
  
  var paramTitle = req.body.title || req.query.title|| "no title";
  var paramContents = req.body.contents || req.query.contents|| "no contents";
  var paramUserId = req.body.userid || req.query.userid; 
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000001"; 
  var paramCommentId = req.body.commentid||req.query.commentid||"000000000000000000000001"; 

  let context = {msg: " "}

  var database = req.app.get('database');      
  console.log(paramEntryId == 1)
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
            context.msg = "success"; 
            res.json(context) 
            res.end() 
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
var ShowBulletinBoard = async function(req, res) {
  console.log('BulletinBoard 모듈 안에 있는 ShowBulletinBoard 호출됨.');
  var database = req.app.get('database');       
  
  var paramboardid = req.body.boardid||req.query.boardid || req.param.boardid;   
  var paramuserid= req.body.userid||req.query.userid || req.param.userid||"5d5373177443381df03f3040";
  var parampostStartIndex = req.body.postStartIndex||req.query.postStartIndex || req.param.postStartIndex||0; 
  var parampostEndIndex = req.body.postEndIndex||req.query.postEndIndex || req.param.postEndIndex||19;  
  var paramSearch = req.body.search||" ";

  console.log("paramboardid: ",paramboardid) 
  console.log("paramuserid: ",paramuserid) 
  console.log("parampostStartIndex: ",parampostStartIndex)
  console.log("parampostEndIndex: ",parampostEndIndex)
  console.log("paramSearch: ",paramSearch)

  parampostStartIndex = parampostStartIndex*1;
  parampostEndIndex = parampostEndIndex*1;

  var context = {
    postslist: [{ 
      boardid: " ", 
      entryid: "", 
      userid: "", 
      username: '', 
      profile: '', 
      likes: 0,
      likespressed: false,
      date: ' ', 
      ismine: false, 
      title: ' ', 
      contents: ' ', 
      pictures: ' ', 
       }]};
  
  if (database.db){        
    
    if(paramSearch !=" "){
      var query = {$or: 
        [{contents: new RegExp(".*"+paramSearch+".*","gi")}, 
          {title: new RegExp(".*"+paramSearch+".*","gi")}, 
          {nickNm: new RegExp(".*"+paramSearch+".*","gi")}
        ], 
        }; 
    } 
    else{
      var query = {};
    }

    //paramboardid == notifications 일 떄, 정렬 기준을 달리하기 위함.
    let sortvalue1 = "created_at";
    let sortvalue2 = "created_at"; 

    //notifications 컬렉션만 date의 역순으로 정렬 
    if(paramboardid == "notifications"){
      sortvalue1 = "isnotice"
      sortvalue2 = "date"; 
    } 
    database.db.collection(paramboardid).find(query).sort({
      [sortvalue1]: -1,
      [sortvalue2]: -1, 
      created_at: -1  
  }).toArray(function(err,data){ 
      if(err){
        utils.log("ShowBulletinBoard에서 collection 조회 중 수행 중 에러 발생"+ err.message);
      }  
      if(parampostEndIndex>=data.length){
        parampostEndIndex = data.length-1;
      } 
      if(parampostStartIndex>=data.length){
        parampostStartIndex = data.length-1;
      }  
      if(parampostStartIndex<0){
        parampostStartIndex = 0;
      }
      for(var i=parampostStartIndex;i<=parampostEndIndex;i++){  
        var localismine = data[i].userid == paramuserid 
        let locallikespressed = false;
        //해당 게시물에 좋아요를 눌렀는지의 여부 확인
        for(let j=0;j<data[i].likeslist.length;j++){
            if(data[i].likeslist[j].userid == paramuserid){
              locallikespressed=true; 
              break;
            }
        }
        
        //notifications일 경우 created_at 대신 date 반환
        let localdate = paramboardid=='notifications'? data[i].date : data[i].created_at;
        
        context.postslist.push(
          {
            boardid: paramboardid, 
            entryid: data[i]._id, 
            userid: data[i].userid, 
            username: data[i].nickNm, 
            profile: data[i].profile, 
            likes: data[i].likes,  
            likespressed: locallikespressed,
            date: localdate, 
            ismine: localismine, 
            title: data[i].title, 
            contents: data[i].contents, 
            pictures: data[i].pictures,
          }); 
        } 
    context.postslist.splice(0,1)   
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
  var context = {msg: " "}
  
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
            likeslist: [],
            created_at: utils.timestamp(),
            pictures: " ",
             hits : 0,
            comments : []
            });
          context.msg = "success"; 
          console.log("글 데이터 추가함.");
          res.json(context) 
          res.end()
          return;
        }  
        context.msg = "success";  
        res.json(context)    			  
        res.end()
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
  let context = {msg: " "}


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
        context.msg = "success";  
        res.json(context)    			  
        res.end() 
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
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000001"; 
  var paramUserId = req.body.userid||"000000000000000000000001";

  var database = req.app.get('database');
  
  console.log('paramBoardId: ' + paramBoardId, 'paramEntryId: ' + paramEntryId, 'paramUserId: ' + paramUserId);

  var context = {
    likesinfo: [{ 
      likes: 0, 
      likespressed: false  
    }], 
    msg: " "}

  // 데이터베이스 객체가 초기화된 경우
  if (database.db) {
      
      database.UserModel.findOne({_id: new ObjectId(paramUserId)},function(err,user){
        if(err){
          utils.log("IncreLikeEntry에서 좋아요를 누른 사용자 조회 중 에러 발생: ",err.message)
        }  
        if(!user){
          utils.log("IncreLikeEntry에서 사용자를 조회할 수 없음") 
          context.msg = "missing"
          res.json(context) 
          res.end() 
          return;
        }
        //이미 좋아요를 눌렀으나 좋아요 요청을 또 다시 해온 경우, 좋아요를 반영하지 않고 반환한다. 
        database.db.collection(paramBoardId).findOne({_id: new ObjectId(paramEntryId), 'likeslist.userid': new ObjectId(paramUserId) },  
          function(err,alreadypressed){
            if (err) {
              utils.log("IncreLikeEntry 안에서 요청한 사용자가 해당 게시물에 이미 좋아요를 눌렀는 지 조회하는 중 에러 발생: "+ err.message)
              res.end(); 
              return;
            }   
            if(alreadypressed)
            {  
              utils.log("IncreLikeEntry 안에서 요청한 사용자가 해당 게시물에 이미 좋아요를 눌렀음")
              context.likesinfo.push({likes: alreadypressed.likes, likespressed: true}) 
              context.likesinfo.splice(0,1)
              console.dir(context)
              res.json(context)
              res.end(); 
              return 
            }  
            //좋아요를 증가시킬 게시물을 조회 
            database.db.collection(paramBoardId).findOneAndUpdate({_id: new ObjectId(paramEntryId)},  
              { 
                $inc: {likes: 1}, 
                $push: { 
                  likeslist: {
                    userid: new ObjectId(paramUserId),  
                    nickNm: user.nickNm 
                }}  
              },
            function(err,data){
              if (err) {
                      utils.log("IncreLikeEntry 안에서 좋아요를 1 증가시킬 게시물 조회 중 에러 발생: "+ err.message)
                      res.end(); 
                      return;
              }		  
              context.likesinfo.push({likes: data.value.likes+1, likespressed: true}) 
              context.likesinfo.splice(0,1)  
              context.msg = "success";
              console.dir(context)
              res.json(context)
              res.end(); 
              return 
              })//findOneAndUpdate 닫기 
          })//findOne({_id: new ObjectId(paramEntryId), 'likeslist.userid': new ObjectId(paramUserId)} 닫기
      })//UserModel.findOne 닫기 
  } else {  
      utils.log('IncreLikeEntry 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }	    
}; //IncreLikeEntry 닫기 

//게시글에 좋아요 1 감소
var DecreLikeEntry = function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 DecreLikeEntry 호출됨.');
  
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000001"; 
  var paramUserId = req.body.userid||"000000000000000000000001";

  var database = req.app.get('database');
  
  console.log('paramBoardId: ' + paramBoardId, 'paramEntryId: ' + paramEntryId, 'paramUserId: ' + paramUserId);

  var context = {
    likesinfo: [{ 
      likes: 0, 
      likespressed: false  
    }], 
    msg: " "}

  // 데이터베이스 객체가 초기화된 경우
  if (database.db) {
      
      database.UserModel.findOne({_id: new ObjectId(paramUserId)},function(err,user){
        if(err){
          utils.log("DecreLikeEntry에서 좋아요를 취소한 사용자 조회 중 에러 발생: ",err.message) 
          res.end() 
          return;
        }   
        if(!user){
          utils.log("DecreLikeEntry에서 사용자를 조회할 수 없음") 
          context.msg = "missing"
          res.json(context) 
          res.end() 
          return;
        }
        
        //좋아요를 누르지 않았으나 좋아요 취소 요청을 해온 경우, 좋아요 취소를 반영하지 않고 반환한다. 
        database.db.collection(paramBoardId).findOne({_id: new ObjectId(paramEntryId), 'likeslist.userid': new ObjectId(paramUserId)},  
          function(err,duplicatedata){
            if (err) {
              utils.log("DecreLikeEntry 안에서 요청한 사용자가 이미 해당 게시물에 좋아요 버튼을 취소했는 지의 여부를 조회하는 중 에러 발생: "+ err.message)
              res.end(); 
              return;
            }   
            if(!duplicatedata)
            {  
              utils.log("DecreLikeEntry 안에서 요청한 사용자가 해당 게시물에 이미 좋아요를 취소했음") 
              context.msg = "duplicate"
              
              console.dir(context)
              res.json(context)
              res.end(); 
              return 
            }   
            //클라이언트에 보낼 좋아요 값 저장 
            console.dir(duplicatedata)
            let locallikes = duplicatedata.likes-1;
            //좋아요를 취소시킬 게시물을 조회 
            database.db.collection(paramBoardId).updateOne({_id: new ObjectId(paramEntryId)},  
              { 
                $pull: {'likeslist': { 'userid': new ObjectId(paramUserId)}},
                $inc: {likes: -1}, 
                
              },
            function(err,data){
              if (err) {
                      utils.log("DecreLikeEntry 안에서 좋아요를 1 감소시킬 게시물 조회 중 에러 발생: "+ err.message)
                      res.end(); 
                      return;
              }		   
              console.dir(data)
              context.likesinfo.push({likes: locallikes, likespressed: false}) 
              context.likesinfo.splice(0,1)  
              context.msg = "success";
              console.dir(context)
              res.json(context)
              res.end(); 
              return 
              })//updateone 닫기 
          })//findOne({_id: new ObjectId(paramEntryId), 'likeslist.userid': new ObjectId(paramUserId)} 닫기
      })//UserModel.findOne 닫기 
  } else {  
      utils.log('IncreLikeEntry 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }	    
}; //DecreLikeEntry 닫기

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
          if(!result){
            res.end(); 
            return;
          }    
          paramCommentEndIndex = paramCommentEndIndex < result.length? paramCommentEndIndex: result.length-1;
          
          if(paramCommentStartIndex>=result.length){
            paramCommentStartIndex = result.length-1;
          }
          if(paramCommentStartIndex<0){
            paramCommentStartIndex = 0;
          }

          for(var i= paramCommentStartIndex; i<= paramCommentEndIndex; i++){  
            var localismine = paramUserId == result[i].comments.userid; 
            var locallikespressed = false; 

            for(let j=0;j<result[i].comments.likeslist.length;j++){
              if(result[i].comments.likeslist.userid.toString() == paramUserId){
                locallikespressed = true
            }

            context.commentslist.push({
              boardid: paramBoardId, 
              entryid: paramEntryId, 
              rootreplyid: result[i].comments.rootreplyid,
              parentreplyid: result[i].comments.parentreplyid, 
              replyid: result[i].comments._id, 
              userid: result[i].comments.userid, 
              username: result[i].comments.nickNm, 
              profile: result[i].comments.profile, 
              likes: result[i].comments.likes, 
              likespressed: locallikespressed,
              date: result[i].comments.created_at, 
              ismine: localismine, 
              contents: result[i].comments.contents,
              pictures: result[i].comments.pictures
            });
          } 
          context.commentslist.splice(0,1)  
          console.dir(context)
          res.json(context); 
          return;
      }//for 닫기  
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
  let context = {msg: " "}
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
            likeslist: [],
            contents: paramContents,
            pictures: paramPictures, 
            created_at: utils.timestamp(), 
        }}}); 

          console.log("댓글 추가함.");    		   
        }     	
      context.msg = "success"; 
      res.json(context) 
      res.end() 		 
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
  let context = {msg: " "}
  var database = req.app.get('database');
  
  console.log(' paramContents: ' + paramContents + ', paramBoardId: ' +  paramBoardId, 
    'paramEntryId: ' + paramEntryId, 'paramCommentId: ' + paramCommentId);

// 데이터베이스 객체가 초기화된 경우
if (database.db) {
         
  //조회 완료한 댓글 내용 덮어쓰기 
  database.db.collection(paramBoardId).updateOne({_id: new ObjectId(paramEntryId), 'comments._id': new ObjectId(paramCommentId)},
  {$set: {'comments.$.contents': paramContents}},
  function(err){ 
    if(err){
      utils.log("EditComment에서 collection 조회 중 수행 중 에러 발생: "+ err.message)
    }      
    console.log("댓글 수정 완료")
    context.msg = "success" 
    res.json(context) 
    res.end()  			 
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
  let context = {msg: ""}
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
    context.msg = "success"; 
    res.json(context) 
    res.end();
    return;   
  })//findOneAndUpdate 닫기 
} else {  
  utils.log('DeleteComment 수행 중 데이터베이스 연결 실패');
  res.end(); 
  return;
}	
}; //DeleteComment 닫기  

//게시글에 좋아요 1 증가
var IncreLikeComment = function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 IncreLikeComment 호출됨.');
  
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000001"; 
  var paramUserId = req.body.userid||"000000000000000000000001";
  var paramCommentId = req.body.replyid||req.query.replyid;

  var database = req.app.get('database');
  
  console.log('paramBoardId: ' + paramBoardId, 'paramEntryId: ' + paramEntryId, 
    'paramUserId: ' + paramUserId, 'paramCommentId: ' + paramCommentId);

  var context = {
    likesinfo: [{ 
      likes: 0, 
      likespressed: false  
    }], 
    msg: " "}

  // 데이터베이스 객체가 초기화된 경우
  if (database.db) {
      
      database.UserModel.findOne({_id: new ObjectId(paramUserId)},function(err,user){
        if(err){
          utils.log("IncreLikeComment에서 좋아요를 누른 사용자 조회 중 에러 발생: ",err.message)
        }  
        if(!user){
          utils.log("IncreLikeComment에서 사용자를 조회할 수 없음") 
          context.msg = "missing"
          res.json(context) 
          res.end() 
          return;
        }
        //이미 좋아요를 눌렀으나 좋아요 요청을 또 다시 해온 경우, 좋아요를 반영하지 않고 반환한다. 
        database.db.collection(paramBoardId).findOne({
            _id: new ObjectId(paramEntryId),  
          },  
          function(err,post){
            if (err) {
              utils.log("IncreLikeComment 안에서 요청한 사용자가 해당 게시물에 이미 좋아요를 눌렀는 지 조회하는 중 에러 발생: "+ err.message)
              res.end(); 
              return;
            }   
            if(!post){
              utils.log("IncreLikeComment 안에서 게시글 조회 실패") 
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
              utils.log("IncreLikeComment 안에서 요청 받은 댓글 조회 실패") 
              context.msg = "empty" 
              res.json(context) 
              res.end() 
              return
            }
            
            //이미 좋아요를 눌렀던 상태일 경우 반환
            for(let j=0;j<post.comments[commentindex].likeslist.length;j++){ 
              if(post.comments[commentindex].likeslist[j].userid.toString() == paramUserId){
                utils.log("IncreLikeComment에서 이미 좋아요를 누른 댓글에 다시 좋아요 요청함")
                context.msg = "duplicate" 
                context.likesinfo.push({likes: locallikes, likespressed: true}) 
                context.likesinfo.splice(0,1)  
                res.json(context)
                res.end()   
                return;
              }
            }

            //좋아요를 증가시킬 댓글을 조회 
            database.db.collection(paramBoardId).findOneAndUpdate({_id: new ObjectId(paramEntryId), 'comments._id': new ObjectId(paramCommentId)},  
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
                      utils.log("IncreLikeComment 안에서 좋아요를 1 증가시킬 게시물 조회 중 에러 발생: "+ err.message)
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
      utils.log('IncreLikeComment 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }	    
}; //IncreLikeComment 닫기 

//댓글에 좋아요 1 감소
var DecreLikeComment = function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 DecreLikeComment 호출됨.');
  
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000001"; 
  var paramUserId = req.body.userid||"000000000000000000000001";
  var paramCommentId = req.body.replyid||req.query.replyid;

  var database = req.app.get('database');
  
  console.log('paramBoardId: ' + paramBoardId, 'paramEntryId: ' + paramEntryId, 
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
          utils.log("DecreLikeComment에서 좋아요를 취소한 사용자 조회 중 에러 발생: ",err.message)
        }  
        if(!user){
          utils.log("DecreLikeComment에서 사용자를 조회할 수 없음") 
          context.msg = "missing"
          res.json(context) 
          res.end() 
          return;
        }
        
        database.db.collection(paramBoardId).findOne({
            _id: new ObjectId(paramEntryId),  
          },  
          function(err,post){
            if (err) {
              utils.log("DecreLikeComment 안에서 요청한 사용자가 해당 게시물에 이미 좋아요를 눌렀는 지 조회하는 중 에러 발생: "+ err.message)
              res.end(); 
              return;
            }   
            if(!post){
              utils.log("DecreLikeComment 안에서 게시글 조회 실패") 
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
              utils.log("DecreLikeComment 안에서 요청 받은 댓글 조회 실패") 
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
              utils.log("DecreLikeComment안에서 likeslist 안에서 요청한 사용자를 찾을 수 없음") 
              context.msg = "empty" 
              res.json(context) 
              res.end() 
              return
            }
            
            //좋아요를 감소시킬 댓글을 조회 및 업데이트 실행
            database.db.collection(paramBoardId).findOneAndUpdate(
              {
                 _id: new ObjectId(paramEntryId), 
                'comments._id': new ObjectId(paramCommentId),
                'comments.likeslist.userid': new ObjectId(paramUserId),
              },  
              { 
                $inc: {'comments.$.likes': -1}, 
                
                $pull: 
                  {'comments.$.likeslist' :{'userid': new ObjectId(paramUserId)}}    
                
              },{upsert: true,new: true},
            function(err,data){
              if (err) {
                      utils.log("DecreLikeComment 안에서 좋아요를 1 감소시킬 게시물 조회 중 에러 발생: "+ err.message)
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
      utils.log('IncreLikeComment 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }	    
}; //DecreLikeComment 닫기 

//////////////////한 게시판의 댓글(comments)과 관련된 함수들 끝 /////////////////////////////////

module.exports.ShowBulletinBoardsList = ShowBulletinBoardsList; 
module.exports.AddReport = AddReport;
module.exports.ShowBulletinBoard = ShowBulletinBoard;  
module.exports.AddEditEntry = AddEditEntry; 
module.exports.DeleteEntry = DeleteEntry;
module.exports.IncreLikeEntry = IncreLikeEntry; 
module.exports.DecreLikeEntry = DecreLikeEntry;
module.exports.ShowComments = ShowComments; 
module.exports.AddComment = AddComment;
module.exports.EditComment = EditComment;  
module.exports.DeleteComment = DeleteComment; 
module.exports.IncreLikeComment = IncreLikeComment;
module.exports.DecreLikeComment = DecreLikeComment;