/*
 * 게시판을 위한 라우팅 함수 정의
 *
 * @date 2018-09-04
 * @author ChangHee
 */

require('dotenv').config();
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken'); 
var ObjectId = mongoose.Types.ObjectId;  
var utils = require('../config/utils'); 
const axios = require("axios"); 
const MongoClient = require("mongodb").MongoClient; 

const client = new MongoClient(process.env.db_url, {
  useNewUrlParser: true,
});
let database

const createConn = async () => {
  await client.connect();
  database = client.db('db'); 
  
}; 

const connection = async function(){  
  if (!client.isConnected()) { 
      // Cold start or connection timed out. Create new connection.
      try {
          await createConn(); 
          console.log("connection completed")
      } catch (e) { 
          res.json({
              error: e.message,
          });
          return;
      }
  }    
}

///////////////////"bulletinboardslist" collection을 사용하는 함수 /////////////////////////////////////

//게시판 목록 보여 주기 
var ShowBulletinBoardsList = async function(req, res) {  
  console.log('BulletinBoards 모듈 안에 있는 ShowBulletinBoardsList 호출됨.');  
  
  await connection()
  var context = {boardslist: [{ boardid: '', boardname: '', contents: ''}]}
  if (database){           
    
    // 모든 게시판 조회 
    database.collection("bulletinboardslist").find({}).toArray(function(err,data){ 
      if(err){
        console.log("BulletinBoards 모듈 안에 있는 ShowBulletinBoardsList에서 collection 조회 중 수행 중 에러 발생: "+ err.stack)
      }
      data.forEach(function(data2){ 
        context.boardslist.push({boardid: data2.boardname, boardname: data2.boardname, contents: data2.contents}) 
      });   
    context.boardslist.splice(0,1);   
    res.json(context);
    res.end();
    return;
    });
  }//if(database) 닫기   
  
  else {  
    console.log("BulletinBoards 모듈 안에 있는 ShowBulletinBoardsList 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
  }   
return;
};//ShowBulletinBoardsList 닫기  
///////////////////"bulletinboardslist" collection을 사용하는 함수 끝 /////////////////////////////////////

//////////////////신고와 관련된 함수 (댓글 도 신고 가능해서 여기에 위치 시킴)/////////////////////////////////

//신고 접수한 내용을 데이터베이스에 저장
let AddReport = async function(req, res) {
  
  console.log('BulletinBoardsList 모듈 안에 있는 AddReport 호출됨.');
  await connection()
  let paramTitle = req.body.title || req.query.title|| "no title";
  let paramContents = req.body.contents || req.query.contents|| "no contents";
  let paramUserId = req.body.userid || req.query.userid; 
  let paramBoardId = req.body.boardid||req.query.boardid;  
  let paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000"; 
  let paramCommentId = req.body.commentid||req.query.commentid||"000000000000000000000000";
  let paramParentCommentId = req.body.parentcommentid||req.query.parentcommentid||"000000000000000000000000"; 

  let context = {msg: " "}
    
  console.log('paramTitle: ' + paramTitle)
  console.log('paramContents: ' + paramContents)
  console.log('paramUserId: ' + paramUserId)
  console.log('paramBoardId: ' + paramBoardId)
  console.log('paramEntryId: ' + paramEntryId) 
  console.log('paramCommentId: ' + paramCommentId) 
  console.log('paramParentCommentId: '+ paramParentCommentId)

  if (database){       
    
    //신고를 한 사용자 조회(populate 불가능해서 이렇게 구현함) 
    database.collection("users").findOne({_id: new ObjectId(paramUserId)}, function(err, user) {
      if (err) {
        console.log("BulletinBoards 모듈 안에 있는 AddReport 안에서 사용자 조회 중 에러발생: " + err.stack);
        res.end();
        return;
      }  
      if (user == undefined) {
        console.log('BulletinBoards 모듈 안에 있는 AddReport 안에서 사용자가 조회되지 않았습니다.'); 
        res.end(); 
        return;
      } 
      else{   
        //사용자 조회 완료. 신고 내역 추가  
          database.collection('reports').insertOne({
            userid: user._id, 
            nickNm: user.nickNm,   
            boardid: paramBoardId, 
            entryid: paramEntryId, 
            commentid: paramCommentId, 
            parentcommentid: paramParentCommentId,
            title: paramTitle,
            contents: paramContents,
            created_at: utils.timestamp(), 
            });//insertOne 닫기
            context.msg = "success"; 
            res.json(context) 
            res.end() 
            return; 
      }//else{ (사용자 조회 성공 시의 else) 닫기 
    })//collection("users").findOne 닫기
  }//if(database) 닫기  
  else {  
    console.log("BulletinBoards 모듈 안에 있는 AddReport 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
  }   
};//AddReport 닫기

//////////////////신고와 관련된 함수 끝/////////////////////////////////

//////////////////한 게시판(Entry 혹은 BulletinBoard 혹은 Post)과 관련된 함수 들) 시작 /////////////////////////////////

//한 게시판의 모든 게시물 보여주기  
var ShowBulletinBoard = async function(req, res) {
  console.log('BulletinBoard 모듈 안에 있는 ShowBulletinBoard 호출됨.');
  await connection();       
  
  var paramBoardId = req.body.boardid||req.query.boardid || req.param.boardid;   
  var paramuserid= req.body.userid||req.query.userid || req.param.userid||"5d5373177443381df03f3040";
  var parampostStartIndex = req.body.postStartIndex||req.query.postStartIndex || req.param.postStartIndex||0; 
  var parampostEndIndex = req.body.postEndIndex||req.query.postEndIndex || req.param.postEndIndex||19;  
  var paramSearch = req.body.search||" ";  
  var paramLanguage = req.body.language|| " ";

  console.log("paramBoardId: ",paramBoardId) 
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
  
  if (database){         

    //BoardId == 'notifications' 일 경우 따로 처리 
    if(paramBoardId == 'notifications'){
      const url = process.env.lambda_url + '/Notification/ShowNotification'
      await axios.post(url,{
        userid: paramuserid, 
        postStartIndex: parampostStartIndex, 
        postEndIndex: parampostEndIndex,  
        search: paramSearch,
        language: paramLanguage
      })
      .then((response) => {     
        context.postslist = response.data.postslist 
         
        res.json(context)  
        res.end()
        return;   
      })
      .catch(( err ) => {      
          console.log("BulletinBoards 모듈 안에 있는 ShowBulletinBoard에서 /Notification/ShowNotification 요청 중 에러 발생: ", err.stack)  
          res.end();
          return;
      });    
      res.end() 
      return; 
    } //if(paramBoardId == 'notifications') 닫기   

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
   
    database.collection(paramBoardId).find(query).sort({
      created_at: -1  
  }).toArray(function(err,data){ 
      if(err){
        console.log("BulletinBoards 모듈 안에 있는 ShowBulletinBoard에서 collection 조회 중 수행 중 에러 발생"+ err.stack);
      }   

       //조회된 게시물이 없을 시
       if(data.length<1){
          context.postslist.splice(0,1) 
          res.json(context) 
          res.end() 
          return
      }
  
      if(parampostStartIndex<0){
        parampostStartIndex = 0;
      } 
      if(parampostEndIndex<0){
        parampostEndIndex = 0;
      } 
      for(var i=parampostStartIndex;i<=parampostEndIndex;i++){  
        
        if(i>=data.length){
          break;
        }
        var localismine = data[i].userid == paramuserid 
        let locallikespressed = false;
        //해당 게시물에 좋아요를 눌렀는지의 여부 확인
        for(let j=0;j<data[i].likeslist.length;j++){
            if(data[i].likeslist[j].userid == paramuserid){
              locallikespressed=true; 
              break;
            }
        }
        context.postslist.push(
          {
            boardid: paramBoardId, 
            entryid: data[i]._id, 
            userid: data[i].userid, 
            username: data[i].nickNm, 
            profile: data[i].profile, 
            likes: data[i].likes,  
            likespressed: locallikespressed,
            date: data[i].created_at,
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
  }//if(database) 닫기  
else {
    
    console.log("BulletinBoards 모듈 안에 있는 ShowBulletinBoard 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
}   
};//ShowBulletinBoard 닫기   

//param에 대해 camel 표기법 및  적용. ex. paramTitle 
//인자로 받은 paramEntryId가 있다면 수정을, 없다면 추가를 각각 실행

var AddEditEntry = async function(req, res) {
  await connection()
  console.log('BulletinBoards 모듈 안에 있는 AddEditEntry 호출됨.');
  
  var paramTitle = req.body.title || req.query.title;
  var paramContents = req.body.contents || req.query.contents;
  var paramUserId = req.body.userid || req.query.userid; 
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000";
   
  var context = {msg: " "}
  
  console.log('paramTitle: ' + paramTitle + ', paramContents: ' + paramContents + ', paramBoardId: ' + 
  paramBoardId, 'paramEntryId: ' + paramEntryId);

// 데이터베이스 객체가 초기화된 경우
if (database) {

      // 1. 아이디를 이용해 사용자 검색
  database.collection('users').findOne({_id: new ObjectId(paramUserId)}, function(err, user) {
    if (err) {
      console.log("BulletinBoards 모듈 안에 있는 AddEditEntry 안에서 사용 자 조회 중 에러발생: " + err.stack);
      res.end();
      return;
    } 
    if (user == undefined ) {
      console.log('AddEditEntry 안에서 사용자가 조회되지 않았습니다.'); 
      res.end(); 
      return;
    } 
    else{   
      //조회 완료한 Post의 제목 및 내용 덮어쓰기 
      database.collection(paramBoardId).findOneAndUpdate({_id: new ObjectId(paramEntryId)},
      {$set: {title: paramTitle, contents: paramContents}},  
       function(err,data){ 
        if(err){
          console.log("BulletinBoards 모듈 안에 있는 AddEditEntry에서 collection 조회 중 수행 중 에러 발생: "+ err.stack)
        }  
         // 조회 된 data가 없다면 새로운 document 삽입
         if (data.value == null) {  
          console.log("새로운 게시물 삽입") 
          database.collection(paramBoardId).insertOne({
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
  })//collection("users").findOne 닫기
  } else {  
      console.log('BulletinBoards 모듈 안에 있는 AddEditEntry 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }  
}; //AddEditEntry 닫기

//게시글 삭제
var DeleteEntry = async function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 DeleteEntry 호출됨.');
  await connection()
  
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000";
  let context = {msg: " "}

  console.log('paramBoardId: ' + paramBoardId, 'paramEntryId: ' + paramEntryId);

// 데이터베이스 객체가 초기화된 경우
if (database) {
      
      //삭제할 게시물을 조회 
      database.collection(paramBoardId).findOneAndDelete({_id: new ObjectId(paramEntryId)}, 
      function(err, result){
        if (err) {
                console.log("BulletinBoards 모듈 안에 있는 DeleteEntry 안에서 삭제할 게시물 조회 중 에러 발생: "+ err.stack)
                res.end(); 
                return;
          }      
        if(result.value == null){
            console.log("BulletinBoards 모듈 안에 있는 DeleteEntry 안에서 삭제할 게시물을 조회 할 수 없음") 
            context.msg = "empty" 
            res.json(context) 
            res.end() 
            return 
        }
        console.log("게시물 삭제 완료"); 
        context.msg = "success";  
        res.json(context)           
        res.end() 
        return;
      })
  } else {  
      console.log('BulletinBoards 모듈 안에 있는 DeleteEntry 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    } 
}; //DeleteEntry 닫기 

//게시글 또는 댓글에 좋아요 1 증가 혹은 감소
var FlipLikeEntry = async function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 FlipLikeEntry 호출됨.'); 
  await connection()
  
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000"; 
  var paramUserId = req.body.userid||"000000000000000000000000";
  var paramCommentId = req.body.replyid||req.query.replyid||"000000000000000000000000";
  
  console.log('paramBoardId: ' + paramBoardId)
  console.log('paramEntryId: ' + paramEntryId) 
  console.log('paramUserId: ' + paramUserId)   
  console.log('paramCommentId' + paramCommentId);

  var context = {
    likesinfo: [{ 
      likes: 0, 
      likespressed: false  
    }], 
    msg: " "}

  // 데이터베이스 객체가 초기화된 경우
  if (database) {
      
      database.collection("users").findOne({_id: new ObjectId(paramUserId)},async function(err,user){
        if(err){
          console.log("BulletinBoards 모듈 안에 있는 FlipLikeEntry에서 좋아요를 누른 사용자 조회 중 에러 발생: " + err.stack)
        }  
        if(!user){
          console.log("BulletinBoards 모듈 안에 있는 FlipLikeEntry에서 사용자를 조회할 수 없음") 
          context.msg = "missing"
          res.json(context) 
          res.end() 
          return;
        } 
        // 댓글 좋아요로 넘어감
        if(paramCommentId!=0){    
          const url = process.env.lambda_url + '/BulletinBoards/FlipLikeComment'
          console.log("url: ",url)
          await axios.post(url,{
            boardid: paramBoardId,   
            entryid: paramEntryId, 
            userid: paramUserId,
            replyid: paramCommentId
          })
          .then((response) => {    
            context.likesinfo = response.data.likesinfo
            context.msg = response.data.msg
            res.json(context)  
            res.end()
            return;   
          })
          .catch(( err ) => {      
              console.log("BulletinBoards 모듈 안에 있는 FlipLikeEntry에서 FlipLikeComment 요청 중 에러 발생: " + err.stack)  
              res.end();
              return;
          });    
          res.end() 
          return; 
        } //if(paramCommentId!=0) 닫기   

        //이미 좋아요를 눌렀으나 좋아요 요청을 또 다시 해온 경우, 좋아요를 취소한다. 
        database.collection(paramBoardId).findOne({_id: new ObjectId(paramEntryId), 'likeslist.userid': new ObjectId(paramUserId) },  
          function(err,alreadypressed){
            if (err) {
              console.log("BulletinBoards 모듈 안에 있는 FlipLikeEntry 안에서 요청한 사용자가 해당 게시물에 이미 좋아요를 눌렀는 지 조회하는 중 에러 발생: "+ err.stack)
              res.end(); 
              return;
            }     
            if(alreadypressed)
            {  
              console.log("FlipLikeEntry 안에서 요청한 사용자가 해당 게시물에 이미 좋아요를 눌렀음")
              //좋아요를 취소시킬 게시물을 조회 
              database.collection(paramBoardId).updateOne({_id: new ObjectId(paramEntryId)},  
              { 
                $pull: {'likeslist': { 'userid': new ObjectId(paramUserId)}},
                $inc: {likes: -1}, 
              },
            function(err){ 
              if (err) {
                      console.log("BulletinBoards 모듈 안에 있는 FlipLikeEntry 안에서 좋아요를 1 감소시킬 게시물 조회 중 에러 발생: "+ err.stack)
                      res.end(); 
                      return;
              }       
              context.likesinfo.push({likes: alreadypressed.likes-1, likespressed: false}) 
              context.likesinfo.splice(0,1)  
              context.msg = "success";
              res.json(context)
              res.end(); 
              return 
              })//updateone 닫기              
            return;
            }  
            //좋아요를 증가시킬 게시물을 조회 
            database.collection(paramBoardId).findOneAndUpdate({_id: new ObjectId(paramEntryId)},  
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
                        console.log("BulletinBoards 모듈 안에 있는 FlipLikeEntry 안에서 좋아요를 1 증가시킬 게시물 조회 중 에러 발생: "+ err.stack)
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
      })//collection("users").findOne 닫기 
  } else {  
      console.log('BulletinBoards 모듈 안에 있는 IncreLikeEntry 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }     
}; //FlipLikeEntry 닫기 

//////////////////한 게시판(Entry 혹은 BulletinBoard 혹은 Post)과 관련된 함수 들) 끝 /////////////////////////////////  

//////////////////한 게시판의 댓글(comments)과 관련된 함수들 시작 /////////////////////////////////

//해당 게시물의 모든 댓글 보여주기
var ShowComments = async function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 ShowComments 호출됨.'); 
  await connection()
  var paramBoardId = req.body.boardid||req.query.boardid || req.param.boardid;   
  var paramEntryId = req.body.entryid||req.query.entryid || req.param.entryid;
  var paramUserId = req.body.userid||req.query.userid || req.param.userid;  
  var paramCommentStartIndex = req.body.commentstartindex||req.query.commentstartindex || req.param.commentstartindex||0; 
  var paramCommentEndIndex = req.body.commentendindex||req.query.commentendindex || req.param.commentendindex||19; 
  
  paramCommentStartIndex = paramCommentStartIndex*1; 
  paramCommentEndIndex = paramCommentEndIndex*1;

  console.log("paramCommentStartIndex: ",paramCommentStartIndex)
  console.log("paramCommentEndIndex: ",paramCommentEndIndex)

  console.log('paramUserId: ' + paramUserId, ', paramBoardId: ' + paramBoardId, ', paramEntryId: ' + paramEntryId);

  var context = {commentslist: [{ boardid: " ", entryid: "", parentreplyid: "", replyid: "", 
    userid: "", username: " ", profile: '', likes: 0, date: ' ', ismine: false, contents: ' ', pictures: ' ' }]};

  if (database){    
    database.collection(paramBoardId).aggregate([
      { $match: { 
      _id: new ObjectId(paramEntryId)}},   

      //Expand the courses array into a stream of documents
      { "$unwind": '$comments'},
      // Sort in ascending order
      { $sort: { 
          'comments.likes': -1,
          'comments.created_at': 1
      }},  
      ]).toArray(function(err,result){ 
          if(err){ 
              console.log('BulletinBoards 모듈 안에 있는 ShowComments 안에서 댓글 조회 중 에러 발생 : ' + err.stack);
              res.end(); 
              return;  
          }  
          if(!result){
            res.end(); 
            return;
          }    
          paramCommentEndIndex = paramCommentEndIndex < result.length? paramCommentEndIndex: result.length-1;
          
          if(paramCommentEndIndex>=result.length){
            paramCommentEndIndex = result.length-1;
          }
          if(paramCommentStartIndex<0){
            paramCommentStartIndex = 0;
          } 
          
          for(var i = paramCommentStartIndex; i<=paramCommentEndIndex; i++){   
            if(i>=result.length){
              break;
            }
            var localismine = paramUserId == result[i].comments.userid; 
            var locallikespressed = false;  
            
            context.commentslist.push({
              boardid: paramBoardId, 
              entryid: paramEntryId, 
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
          }//for 닫기   
          console.dir(context)
          context.commentslist.splice(0,1)    
          res.json(context); 
          return;
    })//aggregate 닫기
  }//if(database) 닫기 
  else {
  console.log("BulletinBoards 모듈 안에 있는 ShowComment 수행 중 데이터베이스 연결 실패")
  res.end(); 
  return;
  }  
};//ShowComments 닫기

//현재 게시판에 댓글을 다는 함수 
var AddComment = async function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 AddComment 호출됨.');
  await connection()

  var paramUserId = req.body.userid || req.query.userid; 
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000"; 
  var paramParentReplyId = req.body.parentreplyid||req.query.parentreplyid||"000000000000000000000000";
  var paramContents = req.body.contents || req.query.contents|| "no contents"; 
  var paramPictures = req.body.pictures || req.query.pictures || "no pictures";
  let context = {msg: " "}
  
  
  console.log('paramContents: ' + paramContents + ', paramBoardId: ' + 
    paramBoardId, 'paramEntryId: ' + paramEntryId, 'paramParentReplyId: ' + paramParentReplyId);

// 데이터베이스 객체가 초기화된 경우
if (database) { 
      // 1. 아이디를 이용해 사용자 검색
  database.collection("users").findOne({_id: new ObjectId(paramUserId)}, function(err, user) {
    if (err) {
      console.log("BulletinBoards 모듈 안에 있는 AddComment 안에서 사용 자 조회 중 에러발생: " + err.stack);
      res.end();
      return;
    } 
    if (user == undefined ) {
      console.log('BulletinBoards 모듈 안에 있는 AddComment 안에서 사용자가 조회되지 않았습니다.'); 
      res.end(); 
      return;
    } 
    else{   
      //조회 완료한 사용자의 이름으로 댓글 추가 
      var objectid = new mongoose.Types.ObjectId();
      database.collection(paramBoardId).updateOne(
        {_id: new ObjectId(paramEntryId)}, {"$push": { 
          comments: {
           _id: objectid,
            userid: user._id,  
            nickNm: user.nickNm,
            boardid: paramBoardId,   
            parentreplyid: paramParentReplyId, //부모 댓글의 id
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
      console.dir(context)
      res.end()      
      return;  
  })//collection("users").findOne 닫기
  } else {  
      console.log('BulletinBoards 모듈 안에 있는 AddComment 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    } 
}; //AddComment 닫기
 
var EditComment = async function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 EditComment 호출됨.');
  await connection()

  var paramContents = req.body.contents || req.query.contents; 
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000"; 
  
  //나: commentid, 추: replyid
  var paramCommentId = req.body.replyid||req.query.replyid;
  let context = {msg: " "}
  
  console.log(' paramContents: ' + paramContents + ', paramBoardId: ' +  paramBoardId, 
    'paramEntryId: ' + paramEntryId, 'paramCommentId: ' + paramCommentId);

// 데이터베이스 객체가 초기화된 경우
if (database) {
         
  //조회 완료한 댓글 내용 덮어쓰기 
  database.collection(paramBoardId).updateOne({_id: new ObjectId(paramEntryId), 'comments._id': new ObjectId(paramCommentId)},
  {$set: {'comments.$.contents': paramContents}},
  function(err,data){ 
    if(err){
      console.log("BulletinBoards 모듈 안에 있는 EditComment에서 collection 조회 중 수행 중 에러 발생: "+ err.stack)
    }      
    if(data.matchedCount==0){
      console.log("댓글 조회 불가")
      context.msg = "empty" 
      res.json(context) 
      res.end() 
      return
    }
    console.log("댓글 수정 완료")
    context.msg = "success" 
    res.json(context) 
    res.end()        
    return;   
  })//updateOne 닫기 
} else {  
  console.log('BulletinBoards 모듈 안에 있는 EditComment 수행 중 데이터베이스 연결 실패');
  res.end(); 
  return;
} 
}; //EditComment 닫기 

//댓글 삭제
var DeleteComment = async function(req, res) { 
  await connection();
  console.log('BulletinBoards 모듈 안에 있는 DeleteComment 호출됨.');
   
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000"; 
  
  //나: commentid, 추: replyid
  var paramCommentId = req.body.replyid||req.query.replyid;

  
  let context = {msg: ""}
  console.log( 'paramBoardId: ' +  paramBoardId, 'paramEntryId: ' + paramEntryId, 'paramCommentId: ' + paramCommentId);

// 데이터베이스 객체가 초기화된 경우
if (database) {
         
  //조회 완료한 Post의 제목 및 내용 덮어쓰기 
  database.collection(paramBoardId).updateOne({_id: new ObjectId(paramEntryId), 'comments._id': new ObjectId(paramCommentId)},
  {$pull: { 'comments': { '_id': new ObjectId(paramCommentId)}}},
  function(err,data){ 
    if(err){
      console.log("BulletinBoards 모듈 안에 있는 DeleteComment에서 게시글 및 댓글 조회 중 수행 중 에러 발생: "+ err.stack) 
      res.end();
      return;
    }              
    if(data.matchedCount==0){ 
      console.log("댓글 조회 불가")
      context.msg = "empty" 
      res.json(context) 
      res.end() 
      return
    }
    context.msg = "success"; 
    console.log("댓글 삭제 완료")
    res.json(context) 
    res.end();
    return;   
  })//findOneAndUpdate 닫기 
} else {  
  console.log('BulletinBoards 모듈 안에 있는 DeleteComment 수행 중 데이터베이스 연결 실패');
  res.end(); 
  return;
} 
}; //DeleteComment 닫기  

//댓글에 좋아요 변경
var FlipLikeComment = async function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 FlipLikeComment 호출됨.'); 
  await connection()
  
  var paramBoardId = req.body.boardid||req.query.boardid;  
  var paramEntryId = req.body.entryid||req.query.entryid||"000000000000000000000000"; 
  var paramUserId = req.body.userid||"000000000000000000000000";
  var paramCommentId = req.body.replyid||req.query.replyid;

  console.log('paramBoardId: ' + paramBoardId, 'paramEntryId: ' + paramEntryId, 
    'paramUserId: ' + paramUserId, 'paramCommentId: ' + paramCommentId);

  var context = {
    likesinfo: [{ 
      likes: 0, 
      likespressed: false  
    }], 
    msg: " "}

    if (database) {
      
      database.collection("users").findOne({_id: new ObjectId(paramUserId)},function(err,user){
        if(err){
          console.log("BulletinBoards 모듈 안에 있는 FlipLikeComment에서 좋아요를 누른 사용자 조회 중 에러 발생: " + err.stack)
        }  
        if(!user){
          console.log("BulletinBoards 모듈 안에 있는 FlipLikeComment에서 사용자를 조회할 수 없음") 
          context.msg = "missing"
          res.json(context) 
          res.end() 
          return;
        }  
        
        database.collection(paramBoardId).aggregate
          ([
            {$match: { 
                _id: new ObjectId(paramEntryId), 
                'comments._id': new ObjectId(paramCommentId)
              }
          },   
          //Expand the courses array into a stream of documents
          {$unwind: '$comments'}  
          // Sort in ascending order  
            ]).toArray(function(err,comment){
          if (err) {
            console.log("BulletinBoards 모듈 안에 있는 FlipLikeComment 안에서 요청한 게시물/댓글 조회 중 에러 발생: "+ err.stack)
            res.end(); 
            return;
          }   
          let index = -1;
          for(let i=0;i<comment.length;i++){
            if(comment[i].comments._id.toString() == paramCommentId){          
              index = i; 
              break
            }
          } 
          
          if(comment.length == 0|| index == -1){
            console.log("BulletinBoards 모듈 안에 있는 FlipLikeComment 안에서 게시물/댓글 조회 실패") 
            context.msg = "empty"  
            res.json(context) 
            res.end() 
            return;
          }  
          console.log("index: ",index) 
          console.log("comment[index]: ",comment[index])
          //이미 좋아요를 눌렀는 지의 여부 확인 
          let locallikespressed = false 
          let locallikes = comment[index].comments.likes

          //해당 사용자가 이미 해당 댓글에 좋아요를 눌렀는 지 확인
          for(let i = 0; i<comment[index].comments.likeslist.length;i++){
            if(comment[index].comments.likeslist[i].userid.toString() == paramUserId){
              locallikespressed = true 
              break;
            }
          } 

          //이미 좋아요를 눌렀던 상태라면 좋아요를 감소한다.
          if(locallikespressed){
            //좋아요를 감소시킬 댓글을 조회 및 업데이트 실행
            database.collection(paramBoardId).updateOne(
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
            function(err){
              if (err) {
                      console.log("BulletinBoards 모듈 안에 있는 DecreLikeComment 안에서 좋아요를 1 감소시킬 게시물 조회 중 에러 발생: "+ err.stack)
                      res.end(); 
                      return;
              }       
              context.likesinfo.push({likes: comment[index].comments.likes-1, likespressed: false}) 
              context.likesinfo.splice(0,1)  
              context.msg = "success";
              console.dir(context)
              res.json(context)
              res.end(); 
              return 
              })//updateOne 닫기 
            }// if(locallikespressed) 닫기 
          else{
            database.collection(paramBoardId).updateOne({_id: new ObjectId(paramEntryId), 'comments._id': new ObjectId(paramCommentId)},  
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
                    console.log("BulletinBoards 모듈 안에 있는 FlipLikeComment 안에서 좋아요를 1 증가시킬 게시물 조회 중 에러 발생: "+ err.stack)
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
            })//updateOne 닫기 
        }//else 닫기
      })//aggregate 닫기 
    })//findOne(user) 닫기
  } else {  
      console.log('BulletinBoards 모듈 안에 있는 FlipLikeComment 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }     
}; //FlipLikeComment 닫기  

//더미데이터 추가
let AddDummy = async function(req, res) {
  console.log('BulletinBoards 모듈 안에 있는 AddDummy 호출됨.'); 
  await connection()  

  database.collection('courseevaluations').insertOne({
    professorid : ObjectId("5d9ee593c727dd36a8345218"),
    subject : "sub11",
    professor : "pro1",
    institution : "HYU",
    overallrating : 0,
    exam : " ",
    assignment : " ",
    difficulty : " ",
    grade : " ",
    comments : [ 
        {
            _id : ObjectId("5d8aa439298f96aee9332656"),
            userid : ObjectId("5d5373177443381df03f3040"),
            nickNm : "admin",
            contents : "no comment",
            exam : "2",
            assignment : "2",
            grade : "A+",
            difficulty : "Easy",
            rating : 0,
            likes : 0,
            likeslist : [],
            created_at: utils.timestamp()
        }, 
        {
            _id : ObjectId("5d8ac7e1393bb62978398897"),
           userid : ObjectId("5d5374268c9da625c018277e"),
            nickNm : "guest",
            contents : "no comment",
            exam: "1",
            assignment : "1",
            grade : "B+",
            difficulty : "Hard",
            rating : 2,
            likes : 0,
            likeslist : [],
            created_at: utils.timestamp()
        }, 
        {
            _id : ObjectId("5d8ac99dc6c3646222a5d88e"),
            userid : ObjectId("5d5cac858f549f46e0b2a76f"),
            nickNm : "guest2",
            contents : "no comment",
            exam : "4",
            assignment : "3",
            grade : "C0",
            difficulty : "Very Hard",
            rating : 4,
            likes : 0,
            likeslist : [],
            created_at: utils.timestamp()
        }, 
        {
            _id : ObjectId("5d8ac99dc6c3646222a5d88e"),
            userid : ObjectId("5d5cac858f549f46e0b2a76f"),
            nickNm : "dummy",
            contents : "no comment",
            exam : "3",
            assignment : "4",
            grade : "E",
            difficulty : "Average",
            rating : 3,
            likes : 0,
            likeslist : [],
            created_at: utils.timestamp()
        }, 
        {
            _id : ObjectId("5d8aca6fbe835f6ad03a9587"),
            userid : ObjectId("5d7211661f2d6247d4fd2dbd"),
            nickNm : "Cool",
            contents : "no comment",
            exam : "3",
            assignment : "5",
            grade: "F",
            difficulty : "Very Hard",
            rating : 1,
            likes : 0,
            likeslist : [],
            created_at: utils.timestamp()
        }
    ], 
    created_at: utils.timestamp()  
})
  res.json({"insert": "done"})
  return; 

}

//////////////////한 게시판의 댓글(comments)과 관련된 함수들 끝 /////////////////////////////////

module.exports.ShowBulletinBoardsList = ShowBulletinBoardsList; 
module.exports.AddReport = AddReport;
module.exports.ShowBulletinBoard = ShowBulletinBoard;  
module.exports.AddEditEntry = AddEditEntry; 
module.exports.DeleteEntry = DeleteEntry;
module.exports.FlipLikeEntry = FlipLikeEntry; 
module.exports.ShowComments = ShowComments; 
module.exports.AddComment = AddComment;
module.exports.EditComment = EditComment;  
module.exports.DeleteComment = DeleteComment; 
module.exports.FlipLikeComment = FlipLikeComment;
module.exports.AddDummy = AddDummy;
