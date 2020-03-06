/**
 * @description 게시판(bulletinBoard)에 관련된 라우터들의 콜백 함수 정의. 
 *              config/config와 route_loader를 이용하여 등록
 * @author Chang Hee
 */

require('dotenv').config(); 
const mongoose = require('mongoose'); 
const ObjectId = mongoose.Types.ObjectId;
const axios = require('axios');    
const utils = require('../config/utils'); 
const localDB = require('../database/database'); // 로컬로 설정한 데이터베이스를 사용하기 위함. insert시 스키마 적용 용도
const getDatabase = require('../database/database').getDatabase;

///////////////////'bulletinBoardlist' collection을 사용하는 함수 /////////////////////////////////////

/**
 * @description 미리 만든 게시판(bulletinBoard)들의 목록을 보여줌.
 *              boardid: 게시판을 구별하기 위한 고유 값. 현재는 boardname을 사용 중. 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const showBulletinBoardsList = async function(req, res) {  
  console.log('bulletinboards/showbulletinboardslist 호출됨.');  
  const database = await getDatabase();  
  let context = {boardslist: [{ boardid: '', boardname: '', contents: ''}]}
  
  if (!(database instanceof Error)) {           
    database
      .collection('bulletinboardslist')
      .find({})
      .toArray(function(err,data) { 
        if (err) {
          console.log('bulletinboards/showbulletinboardslist에서 collection 조회 중 수행 중 에러 발생: '+ err.stack); 
          res.end(); 
          return;
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
    console.log('bulletinboards/showbulletinboardslist 수행 중 데이터베이스 연결 실패: ' + database.stack);
    res.end(); 
    return;
  }   
};//showBulletinBoardsList 닫기  

///////////////////'bulletinBoardlist' collection을 사용하는 함수 끝 /////////////////////////////////////

//////////////////신고와 관련된 함수/////////////////////////////////

/**
 * @description 게시판, 게시글, 댓글, 대댓글 신고 내역을 데이터베이스에 저장. 검색 기능 구현
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const addReport = async function(req, res) {
  console.log('bulletinboard/addreport 호출됨.');
  const database = await getDatabase(); 

  const paramUserId = utils.JWTVerifyId(req.body.jwt);  
  const paramTitle = req.body.title || '';
  const paramContents = req.body.contents || ''; 
  const paramBoardId = req.body.boardid || utils.ZEROID;  
  const paramEntryId = req.body.entryid || utils.ZEROID; 
  const paramCommentId = req.body.commentid || utils.ZEROID;
  const paramParentCommentId = req.body.parentcommentid || utils.ZEROID; 

  console.log('paramUserId: ' + paramUserId);
  console.log('paramTitle: ' + paramTitle);
  console.log('paramContents: ' + paramContents);
  console.log('paramBoardId: ' + paramBoardId);
  console.log('paramEntryId: ' + paramEntryId); 
  console.log('paramCommentId: ' + paramCommentId); 
  console.log('paramParentCommentId: '+ paramParentCommentId);

  if (!(database instanceof Error)) {       
    //신고를 한 사용자 조회 
    database
      .collection('users')
      .findOne({_id: new ObjectId(paramUserId)}, function(err, user) {
        if (err) {
          console.log('bulletinboards/addreport 안에서 사용자 조회 중 에러발생: ' + err.stack);
          res.end();
          return;
        } else if (user === undefined || user === null) {
          console.log('bulletinboards/addreport 안에서 사용자가 조회되지 않았습니다.'); 
          res.json({msg: 'missing'});
          res.end(); 
          return;
        } else {   
            //사용자 조회 완료. 신고 내역 추가  
            const newReport = localDB.ReportModel({
              userId: user._id, 
              nickNm: user.nickNm,   
              boardId: paramBoardId, 
              entryId: paramEntryId, 
              commentId: paramCommentId, 
              parentCommentId: paramParentCommentId,
              title: paramTitle,
              contents: paramContents
            });
            database.collection('reports').insertOne(
              newReport, function(err){
                if(err){
                  console.log('bulletinboards/addreport에서 신고 내역 저장 중 에러 발생: ' + err.stack); 
                  res.end(); 
                  return; 
                }     
                res.json({msg: 'success'}); 
                res.end(); 
                return;
            });//insertOne 닫기 
        }//else{ (사용자 조회 성공 시의 else) 닫기 
      })//collection('users').findOne 닫기
  }//if(database) 닫기  
  else {  
    console.log('bulletinboards/addreport 수행 중 데이터베이스 연결 실패')
    res.end(); 
    return;
  }   
};//addReport 닫기

//////////////////신고와 관련된 함수 끝/////////////////////////////////

//////////////////한 게시판(Entry 혹은 BulletinBoard 혹은 Post)과 관련된 함수 들) 시작 /////////////////////////////////

/**
 * @description 한 게시판의 모든 게시글 보여주기. 기본: 0 ~ 19번째 게시글. 검색 기능 구현함 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */  
const showBulletinBoard = async function(req, res) {
  console.log('bulletinboards/showbulletinboard 호출됨.');
  const database = await getDatabase();       
  
  const paramUserId = utils.JWTVerifyId(req.body.jwt);
  const paramBoardId = req.body.boardid || 'board1';   
  let paramPostStartIndex = req.body.postStartIndex || 0; 
  let paramPostEndIndex = req.body.postEndIndex || 19;  
  const paramSearch = req.body.search || '';  
  const paramLanguage = req.body.language;

  console.log('paramUserId: ',paramUserId);
  console.log('paramBoardId: ',paramBoardId);  
  console.log('paramPostStartIndex: ',paramPostStartIndex);
  console.log('paramPostEndIndex: ',paramPostEndIndex);
  console.log('paramSearch: ',paramSearch);

  //Number 타입으로 변경
  paramPostStartIndex = paramPostStartIndex*1;
  paramPostEndIndex = paramPostEndIndex*1;

  let context = {
    postslist: [{ 
      boardid: '', 
      entryid: '', 
      userid: '', 
      username: '', 
      profile: '', 
      likes: 0,
      likespressed: false,
      date: '', 
      ismine: false, 
      title: '', 
      contents: '', 
      pictures: '', 
    }]
  };
  
  if (!(database instanceof Error)) {         
    //BoardId == 'notifications' 일 경우 따로 처리 
    if (paramBoardId === 'notifications') {
      //const url = process.env.lambda_url + '/Notification/ShowNotification'
      const url = 'localhost:3000/notifications/shownotification';
      await axios.post(url,{
        userId: paramUserId, 
        postStartIndex: paramPostStartIndex, 
        postEndIndex: paramPostEndIndex,  
        search: paramSearch,
        language: paramLanguage
      })
      .then((response) => {     
        context.postslist = response.data.postslist 
        res.json(context);  
        res.end();
        return;   
      })
      .catch(( err ) => {      
          console.log('bulletinboards/showbulletinboard에서 /notification/shownotification 요청 중 에러 발생: ', err.stack)  
          res.end();
          return;
      });    
      res.end(); 
      return; 
    } //if(paramBoardId == 'notifications') 닫기   

    //contents, title, nickNm 검색어
    let query = {};

    if (paramSearch !=='') {
      query = {$or: 
        [{contents: new RegExp('.*'+paramSearch+'.*','gi')}, 
          {title: new RegExp('.*'+paramSearch+'.*','gi')}, 
          {nickNm: new RegExp('.*'+paramSearch+'.*','gi')}
        ], 
        }; 
      }  
   
    database
      .collection(paramBoardId)
      .find(query)
      .sort({
        created_at: -1  
      })
      .toArray(function(err,data) { 
        if (err) {
          console.log('bulletinboards/showbulletinboard에서 collection 조회 중 수행 중 에러 발생'+ err.stack);
        } 
        //조회된 게시글이 없을 시
        else if (data.length<1) { 
            context.postslist.splice(0,1); 
            res.json(context); 
            res.end(); 
            return;
        }
        // 프런트엔드에서 Index가 0 미만으로 입력될 때 대비. 
        // startIndex > endIndex 의 경우는 for에서 걸러짐. 
    
        if (paramPostStartIndex<0) {
          paramPostStartIndex = 0;
        } 
        if (paramPostEndIndex<0) {
          paramPostEndIndex = 0;
        }  
        if (paramPostEndIndex >= data.length){
          paramPostEndIndex = data.length-1;
        }

        for (let i=paramPostStartIndex; i<=paramPostEndIndex; i++) {  
          if(i>=data.length){
            break;
          }
          const localIsmine = (data[i].userId === paramUserId);
          let localLikesPressed = false;
          //해당 게시글에 좋아요를 눌렀는지의 여부 확인
          for(let j=0; j<data[i].likesList.length; j++){
            if(data[i].likesList[j].userId === paramUserId){
              localLikesPressed=true; 
              break;
            }
          }
          context.postslist.push(
            {
              boardid: paramBoardId, 
              entryid: data[i]._id, 
              userid: data[i].userId, 
              username: data[i].nickNm, 
              profile: data[i].profile, 
              likes: data[i].likes,  
              likespressed: localLikesPressed,
              date: data[i].created_at,
              ismine: localIsmine, 
              title: data[i].title, 
              contents: data[i].contents, 
              pictures: data[i].pictures, 
            }); 
        }//for(let i=paramPostStartIndex;i<=paramPostEndIndex;i++) 닫기
        context.postslist.splice(0,1);   
        res.json(context);
        return;  
      })
  }//if(database) 닫기  
  else {
    console.log('bulletinboards/showbulletinboard 수행 중 데이터베이스 연결 실패');
    res.end(); 
    return;
  }   
};//showBulletinBoard 닫기   

/**
 * @description 한 게시글을 데이터베이스에 추가 혹은 기존 게시글 내용 수정 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */   
const addEditEntry = async function(req, res) {
  console.log('bulletinBoard/addeditentry 호출됨.');
  const database = await getDatabase();

  const paramUserId = utils.JWTVerifyId(req.body.jwt);
  const paramTitle = req.body.title || '';
  const paramContents = req.body.contents || ''; 
  const paramBoardId = req.body.boardid || 'board1';  
  const paramEntryId = req.body.entryid || utils.ZEROID;

  console.log('paramTitle: ' + paramTitle);
  console.log('paramContents: ' + paramContents); 
  console.log('paramBoardId: ' + paramBoardId); 
  console.log('paramEntryId: ' + paramEntryId);
  console.log('paramUserId: ', paramUserId);

  // 데이터베이스 객체가 초기화된 경우
  if (!(database instanceof Error)) {
    // 고유 번호를 이용해 사용자 검색
    database
      .collection('users')
      .findOne({_id: new ObjectId(paramUserId)}, function(err, user) {
        if (err) {
          console.log('bulletinboards/addeditentry 안에서 사용 자 조회 중 에러발생: ' + err.stack);
          res.end();
          return;
        } else if (user === undefined || user === null) {
          console.log('bulletinboards/addeditentry 안에서 사용자가 조회되지 않았습니다.'); 
          res.json({msg: 'missing'});
          res.end(); 
          return;
        } else {   
            //조회 완료한 Post의 제목 및 내용 덮어쓰기 
            database
              .collection(paramBoardId)
              .findOneAndUpdate({_id: new ObjectId(paramEntryId)},
                {$set: {title: paramTitle, contents: paramContents}}, function(err,data){ 
                  if(err){
                    console.log('bulletinboards/addeditentry에서 collection 조회 중 수행 중 에러 발생: '+ err.stack); 
                    res.end();
                    return;
                  }  
                  // 조회 된 data가 없다면 새로운 document 삽입
                  else if (data.value === null) {  
                    console.log('새로운 게시글 삽입'); 
                    const newEntry = localDB.BoardModel({
                      title: paramTitle,
                      contents: paramContents,
                      userId : user._id,
                      nickNm : user.nickNm,
                      profile : '',
                      likes : 0,  
                      likeslist: [],
                      created_at: utils.timestamp(),
                      pictures: '',
                      hits : 0,
                      comments : {likesList : []}
                    });  
                    database
                      .collection(paramBoardId)
                      .insertOne(newEntry, function(err){
                        if(err){
                          console.log('bulletinboard/addeditentry에서 게시글 생성 중 에러 발생: ' + err.stack); 
                          res.end(); 
                          return; 
                        }      
                      });//insertOne 닫기  
                  } // if (data.value == null) 닫기
                  res.json({msg: 'success'}); 
                  res.end(); 
                  return; 
                })//findOneAndUpdate 닫기 
            }
      })//collection('users').findOne 닫기
  } else {  
      console.log('bulletinboard/addeditentry 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
  }  
}; //addEditEntry 닫기

/**
 * @description 한 게시글을 데이터베이스로부터 삭제 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const deleteEntry = async function(req, res) {
  console.log('bulletinboards/deleteentry 호출됨.');
  const database = await getDatabase();
  
  const paramBoardId = req.body.boardid || 'board1';  
  const paramEntryId = req.body.entryid || utils.ZEROID;

  console.log('paramBoardId: ' + paramBoardId); 
  console.log('paramEntryId: ' + paramEntryId);

  // 데이터베이스 객체가 초기화된 경우
  if (!(database instanceof Error)) {      
    //삭제할 게시글을 조회 
    database
      .collection(paramBoardId)
      .findOneAndDelete({_id: new ObjectId(paramEntryId)}, function(err, result){
        if (err) {
          console.log('bulletinboards/deleteentry 안에서 삭제할 게시글 조회 중 에러 발생: '+ err.stack);
          res.end(); 
          return;
        } else if (result.value === null) {
            console.log('bulletinboards/deleteentry 안에서 삭제할 게시글을 조회 할 수 없음'); 
            res.json({msg: 'empty'}); 
            res.end(); 
            return; 
        }
        console.log('게시글 삭제 완료');  
        res.json({msg: 'success'});           
        res.end(); 
        return;
      });
  } else {  
      console.log('bulletinboards/deleteentry 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
  } 
}; //deleteEntry 닫기 

/**
 * @description 게시글 또는 댓글에 좋아요 1 증가 혹은 감소 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const flipLikeEntry = async function(req, res) {
  console.log('bulletinboards/fliplikeentry 호출됨.'); 
  const database = await getDatabase();
  
  const paramUserId = utils.JWTVerifyId(req.body.jwt);
  const paramBoardId = req.body.boardid || 'baord1';  
  const paramEntryId = req.body.entryid || utils.ZEROID; 
  const paramCommentId = req.body.replyid || utils.ZEROID;
  
  console.log('paramUserId: ' + paramUserId);
  console.log('paramBoardId: ' + paramBoardId);
  console.log('paramEntryId: ' + paramEntryId);    
  console.log('paramCommentId: ' + paramCommentId);

  let context = {
    likesinfo: [{ 
      likes: 0, 
      likespressed: false  
    }], 
    msg: ' '};

  // 데이터베이스 객체가 초기화된 경우
  if (!(database instanceof Error)) {
      database
        .collection('users')
        .findOne({_id: new ObjectId(paramUserId)}, async function(err,user){
          if (err) {
            console.log('bulletinboards/fliplikeentry에서 좋아요를 누른 사용자 조회 중 에러 발생: ' + err.stack);
          }  
          if (!user) {
            console.log('bulletinboards/fliplikeentry에서 사용자를 조회할 수 없음'); 
            context.msg = 'missing';
            res.json(context); 
            res.end(); 
            return;
          } 
          // 댓글 좋아요로 넘어감
          if (paramCommentId !== utils.ZEROID) {    
            const url = 'http://localhost:3000/bulletinboards/fliplikecomment'// process.env.lambda_url + '/bulletinboards/fliplikecomment';
            console.log('url: ',url);
            await axios.post(url,{
              boardid: paramBoardId,   
              entryid: paramEntryId, 
              userid: paramUserId,
              replyid: paramCommentId
            })
            .then((response) => {    
              context.likesinfo = response.data.likesinfo;
              context.msg = response.data.msg;
              res.json(context);  
              res.end();
              return;   
            })
            .catch(( err ) => {      
                console.log('bulletinboards/fliplikeentry에서 flipLikeComment 요청 중 에러 발생: ' + err.stack);  
                res.end();
                return;
            });    
            res.end(); 
            return; 
        } //if(paramCommentId!=0) 닫기   

        //이미 좋아요를 눌렀으나 좋아요 요청을 또 다시 해온 경우, 좋아요를 취소한다. 
        database
          .collection(paramBoardId)
          .findOne({_id: new ObjectId(paramEntryId), 'likesList.userId': new ObjectId(paramUserId)}, function(err,alreadyPressed){
            if (err) {
              console.log('bulletinboards/fliplikeentry 안에서 요청한 사용자가 해당 게시글에 이미 좋아요를 눌렀는 지 조회하는 중 에러 발생: '+ err.stack);
              res.end(); 
              return;
            }     
            if (alreadyPressed) {  
              console.log('bulletinboards/fliplikeentry 안에서 요청한 사용자가 해당 게시글에 이미 좋아요를 눌렀음');
              //좋아요를 취소시킬 게시글을 조회 
              database
                .collection(paramBoardId)
                .updateOne({_id: new ObjectId(paramEntryId)},  
                  { 
                    $pull: {likesList: { 'userId': new ObjectId(paramUserId)}},
                    $inc: {likes: -1}, 
                  }, function(err){ 
                    if (err) {
                      console.log('bulletinboards/fliplikeentry 안에서 좋아요를 1 감소시킬 게시글 조회 중 에러 발생: '+ err.stack)
                      res.end(); 
                      return;
                    }       
                    context.likesinfo.push({likes: alreadyPressed.likes-1, likespressed: false}); 
                    context.likesinfo.splice(0,1);  
                    context.msg = 'success';
                    res.json(context);
                    res.end(); 
                    return; 
                })//updateone 닫기              
            } else  {  
              //좋아요를 증가시킬 게시글을 조회 
              database
                .collection(paramBoardId)
                .findOneAndUpdate({_id: new ObjectId(paramEntryId)},  
                { 
                  $inc: {likes: 1}, 
                  $push: { 
                    likesList: {
                      userId: new ObjectId(paramUserId),  
                      nickNm: user.nickNm 
                  }}  
                }, function(err,data){
                    if (err) {
                      console.log('bulletinboards/fliplikeentry 안에서 좋아요를 1 증가시킬 게시글 조회 중 에러 발생: '+ err.stack);
                      res.end(); 
                      return;
                    }     
                    context.likesinfo.push({likes: data.value.likes+1, likespressed: true}); 
                    context.likesinfo.splice(0,1);  
                    context.msg = 'success';
                    res.json(context);
                    res.end(); 
                    return; 
                })//findOneAndUpdate 닫기 
            }
          })//findOne({_id: new ObjectId(paramEntryId), 'likeslist.userId': new ObjectId(paramUserId)} 닫기
        })//collection('users').findOne 닫기 
  } else {  
      console.log('bulletinboards/fliplikeentry 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }     
}; //flipLikeEntry 닫기 

//////////////////한 게시판(Entry 혹은 BulletinBoard 혹은 Post)과 관련된 함수 들) 끝 /////////////////////////////////  

//////////////////한 게시판의 댓글(comments)과 관련된 함수들 시작 /////////////////////////////////

/**
 * @description 해당 게시글의 모든 댓글 보여주기
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const showComments = async function(req, res) {
  console.log('bulletinboards/showcomments 호출됨.'); 
  const database = await getDatabase();

  const paramUserId = utils.JWTVerifyId(req.body.jwt);
  const paramBoardId = req.body.boardid || utils.ZEROID;   
  const paramEntryId = req.body.entryid || utils.ZEROID;  
  let paramCommentStartIndex = req.body.commentstartindex || 0; 
  let paramCommentEndIndex = req.body.commentendindex || 19; 
  
  //Number 형식으로 변경
  paramCommentStartIndex = paramCommentStartIndex*1; 
  paramCommentEndIndex = paramCommentEndIndex*1;

  console.log('paramUserId: ', paramUserId); 
  console.log('paramBoardId: ', paramBoardId);
  console.log('paramEntryId: ', paramEntryId);
  console.log('paramCommentStartIndex: ', paramCommentStartIndex);
  console.log('paramCommentEndIndex: ',paramCommentEndIndex);

  let context = {commentslist: 
                  [{ boardid: ' ', 
                     entryid: '', 
                     parentreplyid: '', 
                     replyid: '', 
                     userid: '', 
                     username: ' ', 
                     profile: '', 
                     likes: 0, 
                     date: ' ', 
                     ismine: false, 
                     contents: ' ', 
                     pictures: ' ' 
                  }]
                };
  if (!(database instanceof Error)) {    
    database
      .collection(paramBoardId)
      .aggregate([
        { 
          $match: { 
            _id: new ObjectId(paramEntryId)}
        },   
        { '$unwind': '$comments'},
        { 
          $sort: { 
            'comments.likes': -1,
            'comments.created_at': 1
          }
        },  
      ])
      .toArray(function(err,result){ 
          if (err) { 
              console.log('bulletinboards/showcomments 안에서 댓글 조회 중 에러 발생 : ' + err.stack);
              res.end(); 
              return;  
          }  
          else if (!result) {
            res.end(); 
            return;
          } 

          if(paramCommentStartIndex<0){
            paramCommentStartIndex = 0;
          } 
          if(paramCommentStartIndex<0){
            paramCommentEndIndex = 0;
          } 
          if(paramCommentEndIndex>=result.length){
            paramCommentEndIndex = result.length-1;
          }
 
          for(let i = paramCommentStartIndex; i<=paramCommentEndIndex; i++){   
            if(i>=result.length){
              break;
            }
            const localIsmine = (paramUserId === result[i].comments.userId); 
            let localLikesPressed = false;  
            
            context.commentslist.push({
              boardid: paramBoardId, 
              entryid: paramEntryId, 
              parentreplyid: result[i].comments.parentreplyId, 
              replyid: result[i].comments._id, 
              userid: result[i].comments.userId, 
              username: result[i].comments.nickNm, 
              profile: result[i].comments.profile, 
              likes: result[i].comments.likes, 
              likespressed: localLikesPressed,
              date: result[i].comments.created_at, 
              ismine: localIsmine, 
              contents: result[i].comments.contents,
              pictures: result[i].comments.pictures
            });
          }//for 닫기   
          context.commentslist.splice(0,1);    
          res.json(context);  
          res.end();
          return;
        })//aggregate 닫기
  }//if(database) 닫기 
  else {
    console.log('bulletinboards/showcomments 수행 중 데이터베이스 연결 실패');
    res.end(); 
    return;
  }  
};//showComments 닫기

/**
 * @description 현재 게시글에 댓글 달기 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const addComment = async function(req, res) {
  console.log('bulletinboards/addcomment 호출됨.');
  const database = await getDatabase();

  const paramUserId = utils.JWTVerifyId(req.body.jwt); 
  const paramBoardId = req.body.boardid || 'board1';  
  const paramEntryId = req.body.entryid || utils.ZEROID; 
  const paramParentReplyId = req.body.parentreplyid || utils.ZEROID;
  const paramContents = req.body.contents || ''; 
  const paramPictures = req.body.pictures || '';
  
  console.log('paramUserId: ', paramUserId);
  console.log('paramBoardId: ', paramBoardId);
  console.log('paramEntryId: ', paramEntryId); 
  console.log('paramParentReplyId: ', paramParentReplyId); 
  console.log('paramContents: ', paramContents); 
  console.log('paramPictures: ', paramPictures);
  
  if (!(database instanceof Error)) { 
    database
      .collection('users')
      .findOne({_id: new ObjectId(paramUserId)}, function(err, user) {
        if (err) {
          console.log('bulletinboards/addcomment 안에서 사용 자 조회 중 에러발생: ' + err.stack);
          res.end();
          return;
        } else if (user === undefined  || user === null) {
        console.log('bulletinboards/addcomment 안에서 사용자가 조회되지 않았습니다.');  
        res.json({msg: 'missing'});
        res.end(); 
        return;
      } else {   
        //조회 완료한 사용자의 이름으로 댓글 추가  
        //objectid: 새로운 Objectid 생성
        const objectid = new mongoose.Types.ObjectId();
        database
          .collection(paramBoardId)
          .updateOne({_id: new ObjectId(paramEntryId)},
          {'$push': { 
            comments: {
              _id: objectid,
              userId: user._id,  
              nickNm: user.nickNm,
              boardid: paramBoardId,   
              parentreplyid: paramParentReplyId, //부모 댓글의 id
              likes: 0, 
              likesList: [],
              contents: paramContents,
              pictures: paramPictures, 
              created_at: utils.timestamp(), 
          }}}); 
          console.log('댓글 추가함.');          
        }        
        res.json({msg: 'success'}); 
        res.end();      
        return;  
    })//collection('users').findOne 닫기
  } else {  
      console.log('bulletinboards/addcomment 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    } 
}; //addComment 닫기

/**
 * @description 현재 댓글 수정 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const editComment = async function(req, res) {
  console.log('bulletinboards/editcomment 호출됨.');
  const database = await getDatabase();

  const paramContents = req.body.contents || ''; 
  const paramBoardId = req.body.boardid || 'board1';  
  const paramEntryId = req.body.entryid || utils.ZEROID;
  const paramCommentId = req.body.replyid || utils.ZEROID;//나: commentid, 추: replyid 

  console.log('paramContents: ', paramContents);  
  console.log('paramBoardId: ', paramBoardId); 
  console.log('paramEntryId: ', paramEntryId); 
  console.log('paramCommentId: ', paramCommentId);

  if (!(database instanceof Error)) {       
    //조회한 댓글 내용 수정 
    database
      .collection(paramBoardId)
      .updateOne({_id: new ObjectId(paramEntryId), 'comments._id': new ObjectId(paramCommentId)},
        {$set: {'comments.$.contents': paramContents}}, function(err,data){ 
          if(err){
            console.log('bulletinboards/editcomment에서 collection 조회 중 수행 중 에러 발생: '+ err.stack); 
            res.end(); 
            return;
          }      
          if(data.modifiedCount===0){
            console.log('댓글 조회 불가'); 
            res.json({msg: 'empty'}); 
          } else {
          console.log('댓글 수정 완료');
          res.json({msg: 'success'});  
          }
          res.end();        
          return;   
        })//updateOne 닫기 
  } else {  
    console.log('bulletinboards/editcomment 수행 중 데이터베이스 연결 실패');
    res.end(); 
    return;
  } 
}; //editComment 닫기 

/**
 * @description 현재 댓글 삭제 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */ 
const deleteComment = async function(req, res) { 
  const database = await getDatabase();
  console.log('bulletinboards/deletecomment 호출됨.');
   
  const paramBoardId = req.body.boardid || 'board1';  
  const paramEntryId = req.body.entryid || utils.ZEROID; 
  const paramCommentId = req.body.replyid || utils.ZEROID; //나: commentid, 추: replyid

  console.log('paramBoardId: ', paramBoardId); 
  console.log('paramEntryId: ', paramEntryId); 
  console.log('paramCommentId: ', paramCommentId);

  if (!(database instanceof Error)) {
    database
      .collection(paramBoardId)
      .updateOne({_id: new ObjectId(paramEntryId), 'comments._id': new ObjectId(paramCommentId)},
        {$pull: { 'comments': { '_id': new ObjectId(paramCommentId)}}}, function(err,data) { 
          if (err) {
            console.log('bulletinboards/deletecomment에서 게시글 및 댓글 조회 중 수행 중 에러 발생: '+ err.stack); 
            res.end();
            return;
          }              
          if (data.modifiedCount===0) { 
            console.log('댓글 조회 불가');
            res.json({msg: 'empty'}); 
            res.end(); 
            return;
          } 
          console.log('댓글 삭제 완료');
          res.json({msg: 'success'}); 
          res.end();
          return;   
        })//findOneAndUpdate 닫기 
  } else {  
      console.log('bulletinboards/deletecomment 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
  } 
}; //deleteComment 닫기  

/**
 * @description 댓글에 좋아요 1 증가 혹은 감소 
 * @param {Object} req - express의 req 객체 
 * @param {Object} res - express의 res 객체
 */
const flipLikeComment = async function(req, res) {
  console.log('bulletinboards/fliplikecomment 호출됨.'); 
  const database = await getDatabase();
  
  const paramUserId = req.body.userid || utils.JWTVerifyId(req.body.jwt);
  const paramBoardId = req.body.boardid || 'board1';  
  const paramEntryId = req.body.entryid || utils.ZEROID; 
  const paramCommentId = req.body.replyid || utils.ZEROID;

  console.log('paramUserId: ', paramUserId); 
  console.log('paramBoardId: ', paramBoardId);  
  console.log('paramCommentId: ', paramCommentId);

  let context = {
    likesinfo: [{ 
      likes: 0, 
      likespressed: false  
    }], 
    msg: ' '}

    if (!(database instanceof Error)) {
      database
        .collection('users')
        .findOne({_id: new ObjectId(paramUserId)}, function(err,user) {
          if (err) {
            console.log('bulletinboards/fliplikecomment에서 좋아요를 누른 사용자 조회 중 에러 발생: ' + err.stack);
            res.end(); 
            return;
          } else if (!user) {
            console.log('bulletinboards/fliplikecomment에서 사용자를 조회할 수 없음') 
            context.msg = 'missing';
            res.json(context); 
            res.end(); 
            return;
          } 

        database
          .collection(paramBoardId).aggregate
            ([
              {
                $match: { 
                  _id: new ObjectId(paramEntryId), 
                  'comments._id': new ObjectId(paramCommentId)
                }
            },   
            {$unwind: '$comments'}    
            ])
          .toArray(function(err,comment){
            if (err) {
              console.log('bulletinboards/fliplikecomment 안에서 요청한 게시글/댓글 조회 중 에러 발생: '+ err.stack);
              res.end(); 
              return;
            }   
            let index = -1;
            for(let i=0;i<comment.length;i++){
              if(comment[i].comments._id.toString() === paramCommentId){          
                index = i; 
                break;
              }
            } 
            if (comment.length === 0|| index === -1) {
              console.log('bulletinboards/fliplikecomment 안에서 게시글/댓글 조회 실패');
              res.json({msg: 'empty'}); 
              res.end(); 
              return;
            }  
            //이미 좋아요를 눌렀는 지의 여부 확인 
            let localLikesPressed = false;
            let localLikes = comment[index].comments.likes;

            //해당 사용자가 이미 해당 댓글에 좋아요를 눌렀는 지 확인
            for(let i = 0; i<comment[index].comments.likesList.length; i++){
              if(comment[index].comments.likesList[i].userId.toString() === paramUserId){
                localLikesPressed = true;
                break;
              }
            }  
            //이미 좋아요를 눌렀던 상태라면 좋아요를 감소한다.
            if (localLikesPressed) { 
              //좋아요를 감소시킬 댓글을 조회 및 업데이트 실행
              database
                .collection(paramBoardId)
                .updateOne({
                  _id: new ObjectId(paramEntryId), 
                  'comments._id': new ObjectId(paramCommentId),
                  'comments.likesList.userId': new ObjectId(paramUserId),
                },  
                { 
                  $inc: {'comments.$.likes': -1},  
                  $pull: 
                    {'comments.$.likesList' :{'userId': new ObjectId(paramUserId)}}    
                
                }, {upsert: true,new: true}, function(err) {
                  if (err) {
                    console.log('bulletinboards/decrelikecomment 안에서 좋아요를 1 감소시킬 게시글 조회 중 에러 발생: '+ err.stack); 
                    res.end(); 
                    return;
                  }        
                  context.likesinfo.push({likes: comment[index].comments.likes-1, likespressed: false}); 
                  context.likesinfo.splice(0,1);  
                  context.msg = 'success';
                  res.json(context);
                  res.end(); 
                  return; 
                })//updateOne 닫기 
            }// if(localLikesPressed) 닫기 
            else {
              database
                .collection(paramBoardId)
                .updateOne({_id: new ObjectId(paramEntryId), 'comments._id': new ObjectId(paramCommentId)},  
                  { 
                    $inc: {'comments.$.likes': 1}, 
                    $push: { 
                      'comments.$.likesList': {
                        userId: new ObjectId(paramUserId),  
                        nickNm: user.nickNm 
                    }}  
              }, function(err) {
                  if (err) {
                    console.log('bulletinboards/fliplikecomment 안에서 좋아요를 1 증가시킬 게시글 조회 중 에러 발생: '+ err.stack);
                    res.end(); 
                    return;
                  }    
                  context.likesinfo.push({likes: localLikes+1, likespressed: true}); 
                  context.likesinfo.splice(0,1);  
                  context.msg = 'success';
                  console.dir(context)
                  res.json(context);
                  res.end(); 
                  return; 
                })//updateOne 닫기 
            }//else 닫기
          })//aggregate 닫기 
      })//findOne(user) 닫기
    } else {  
      console.log('bulletinboards/fliplikecomment 수행 중 데이터베이스 연결 실패');
      res.end(); 
      return;
    }     
}; //flipLikeComment 닫기  

/*더미데이터 추가
let AddDummy = async function(req, res) {
  console.log('bulletinBoard/AddDummy 호출됨.'); 
  const database = await getDatabase()  

  database.collection('courseevaluations').insertOne({
    professorid : ObjectId('5d9ee593c727dd36a8345218'),
    subject : 'sub11',
    professor : 'pro1',
    institution : 'HYU',
    overallrating : 0,
    exam : ' ',
    assignment : ' ',
    difficulty : ' ',
    grade : ' ',
    comments : [ 
        {
            _id : ObjectId('5d8aa439298f96aee9332656'),
            userId : ObjectId('5d5373177443381df03f3040'),
            nickNm : 'admin',
            contents : 'no comment',
            exam : '2',
            assignment : '2',
            grade : 'A+',
            difficulty : 'Easy',
            rating : 0,
            likes : 0,
            likeslist : [],
            created_at: utils.timestamp()
        }, 
        {
            _id : ObjectId('5d8ac7e1393bb62978398897'),
           userId : ObjectId('5d5374268c9da625c018277e'),
            nickNm : 'guest',
            contents : 'no comment',
            exam: '1',
            assignment : '1',
            grade : 'B+',
            difficulty : 'Hard',
            rating : 2,
            likes : 0,
            likeslist : [],
            created_at: utils.timestamp()
        }, 
        {
            _id : ObjectId('5d8ac99dc6c3646222a5d88e'),
            userId : ObjectId('5d5cac858f549f46e0b2a76f'),
            nickNm : 'guest2',
            contents : 'no comment',
            exam : '4',
            assignment : '3',
            grade : 'C0',
            difficulty : 'Very Hard',
            rating : 4,
            likes : 0,
            likeslist : [],
            created_at: utils.timestamp()
        }, 
        {
            _id : ObjectId('5d8ac99dc6c3646222a5d88e'),
            userId : ObjectId('5d5cac858f549f46e0b2a76f'),
            nickNm : 'dummy',
            contents : 'no comment',
            exam : '3',
            assignment : '4',
            grade : 'E',
            difficulty : 'Average',
            rating : 3,
            likes : 0,
            likeslist : [],
            created_at: utils.timestamp()
        }, 
        {
            _id : ObjectId('5d8aca6fbe835f6ad03a9587'),
            userId : ObjectId('5d7211661f2d6247d4fd2dbd'),
            nickNm : 'Cool',
            contents : 'no comment',
            exam : '3',
            assignment : '5',
            grade: 'F',
            difficulty : 'Very Hard',
            rating : 1,
            likes : 0,
            likeslist : [],
            created_at: utils.timestamp()
        }
    ], 
    created_at: utils.timestamp()  
})
  res.json({'insert': 'done'})
  return; 

}
*/
//////////////////한 게시판의 댓글(comments)과 관련된 함수들 끝 /////////////////////////////////

module.exports.showBulletinBoardsList = showBulletinBoardsList; 
module.exports.addReport = addReport;
module.exports.showBulletinBoard = showBulletinBoard;  
module.exports.addEditEntry = addEditEntry; 
module.exports.deleteEntry = deleteEntry;
module.exports.flipLikeEntry = flipLikeEntry; 
module.exports.showComments = showComments; 
module.exports.addComment = addComment;
module.exports.editComment = editComment;  
module.exports.deleteComment = deleteComment; 
module.exports.flipLikeComment = flipLikeComment;
