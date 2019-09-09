/*
 * 게시판을 위한 라우팅 함수 정의
 *
 * @date 2018-09-04
 * @author ChangHee
 */

var mongoose = require('mongoose');
var jwt = require('jsonwebtoken'); 
var ObjectId = mongoose.Types.ObjectId;  
var logger = require('../config/errorhandler');

//게시판 목록 보여 주기 
var ShowBulletinBoardsList = function(req, res) {
  console.log('ShowBulletinBoardsList 모듈 안에 있는 ShowBulletinBoardsList 호출됨.');

  var context = {boardlist: [{ boardname: '', contents: ''}]}
  var database = req.app.get('database');      
  
  if (database.db){       

    // 모든 게시판 조회 
    database.db.collection("bulletinboardslist").find({}).toArray(function(err,data){ 
      if(err){
        logger.log("ShowBulletinBoardsList에서 collection 조회 중 수행 중 에러 발생"+ err.message)
      }
      data.forEach(function(data2){
        context.boardlist.push({boardname: data2.boardname, contents: data2.contents}) 
      });   
    context.boardlist.splice(0,1); 
    res.json(context);
    return;
    });
  }//if(database.db) 닫기 
else {
    
    logger.log(" ShowBoardsListsList 수행 중 database 연결 실패")
    res.end(); 
    return;
}
};//ShowBoardsList 닫기 

//게시글 목록 보여 주기 
var ShowBulletinBoard = function(req, res) {
  console.log('BoardsListsList 모듈 안에 있는 ShowBoard 호출됨.');
  var database = req.app.get('database');      
  var paramboardname = req.body.boardname;  
  var context = {postlist: [{ board: {} }]};
  
  if (database.db){    
      // 모든 게시판 조회
    database.db.collection(paramboardname).find({}, async function(err, cursor){
      if(err){ 
            logger.log(err.message);
            res.end();
            return; 
        }     
      //각각의 게시물 loop
      cursor.forEach(function(document, index){
          context.boardlist[index] = document;
      });
      //console.dir(context)
      res.json(context);
      return;
    });// database.BoardsListsModel.find 닫기
}//if(database.db) 닫기 
else {
    
  logger.log(" ShowBoard 수행 중 database 연결 실패")
    res.end(); 
    return;
}    
};//ShowBoard 닫기

module.exports.ShowBulletinBoardsList = ShowBulletinBoardsList;
module.exports.ShowBulletinBoard = ShowBulletinBoard; 

