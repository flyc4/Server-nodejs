const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const ObjectId = mongoose.Types.ObjectId;  
const utils = require('../config/utils'); 
const serverURL = "http://sususerver.ddns.net:3000";  
const axios = require("axios"); 
const type = ["Official"] //type 항목들    

const ShowBulletinBoardsList = async function(req, res) {
    console.log('BulletinBoards 모듈 안에 있는 ShowBulletinBoardsList 호출됨.');
    var context = {boardslist: [{ boardid: '', boardname: '', contents: ''}]}
    var database = req.app.get('database');      
  
    if (database.db){       
  
      // 모든 게시판 조회 
      database.db.collection("bulletinboardslist").find({}).toArray(function(err,data){ 
        if(err){
          utils.log("BulletinBoards 모듈 안에 있는 ShowBulletinBoardsList에서 collection 조회 중 수행 중 에러 발생"+ err.message)
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
      utils.log("BulletinBoards 모듈 안에 있는 ShowBulletinBoardsList 수행 중 데이터베이스 연결 실패")
      res.end(); 
      return;
    }   
  return;
  };//ShowBulletinBoardsList 닫기 

