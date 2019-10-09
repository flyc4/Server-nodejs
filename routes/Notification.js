const axios = require("axios");
const cheerio = require("cheerio");
const moment = require('moment'); 
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const ObjectId = mongoose.Types.ObjectId;  
const utils = require('../config/utils'); 
require('dotenv').config() 
const schedule = require('node-schedule');
const api = "AIzaSyATLbXuBnhHhb1Meyv2WFa6Lpw5FCupc8I";
const translate = require('google-translate')(api); 
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

_notificationcrawl = async () => {
    let url = process.env.lambda_url + '/process/Notification/CrawlData'; 
        await axios.post(url)
            .then((response) => {     
                
            })
            .catch(( err ) => {       
                console.log("Notification 모듈 안에 있는 _notificationcrawl에서 클롤링 요청 중 에러 발생: " + err.stack)  
                return;
            });    
  }    

  _crawlupdate = async () => {
    let url = process.env.lambda_url + '/process/Notification/UpdateCrawlData'; 
        await axios.post(url)
            .then((response) => {     
                
            })
            .catch(( err ) => {                       
                console.log("Notification 모듈 안에 있는 _crawlupdate에서 클롤링 요청 중 에러 발생: " + err.stack)  
                return;
            });    
  }   

  _translate_en = async () => {
    let url = process.env.lambda_url + '/process/Notification/Translate_en'; 
        await axios.post(url)
            .then((response) => {   
            }) 
            .catch(( err ) => {  
                console.log("Notification 모듈 안에 있는 _translate_en에서 에러 발생: " + err.stack)  
                return;
            });    
  }   

  _translate_zh = async () => {
    let url = process.env.lambda_url + '/process/Notification/Translate_zh'; 
        await axios.post(url)
            .then((response) => {    
                
            })
            .catch((err) => {     
                if(err.response.status){
                    console.log("Notification 모듈 안에 있는 _translate_zn에서 에러 발생: " + err.stack)  
                }
                return;
            });    
  } 
  
//매일 오전 9시 마다 크롤링
let newcrawl = schedule.scheduleJob({hour: 9, minute: 0}, async function(){
 await _notificationcrawl(); 
})   

//매일 오전 9시 10분 마다 유효하지 않은 url을 지닌 공지사항 삭제 
let updatetcrawl =  schedule.scheduleJob({hour: 9, minute: 10}, async function(){
    await _crawlupdate();
   })

//매일 오전 9시 20분 마다 크롤링한 것들 영어 번역 
let updatetranslate_en =  schedule.scheduleJob({hour: 9, minute: 20}, async function(){
    await _translate_en();
   })  
//매일 오전 9시 30분 마다 크롤링한 것들 중국어 번역 
let updatetranslate_zh =  schedule.scheduleJob({hour: 9, minute: 30}, async function(){
    await _translate_zh();
   })  

var CrawlData = async function(req, res) { 
    await connection();
    console.log('Notification 모듈 안에 있는 CrawlData 호출됨.');

    // 데이터베이스 객체가 초기화된 경우
    if (database) {  
        // 해당 일자에 크롤링을 했는 지 여부 확인 
        // 크롤링 시작
        //파싱할 사이트의 url을 지정 
        const database = req.app.get('database');
        const getHtml = async () => {
            try { 
                return await axios.get("https://www.dic.hanyang.ac.kr/front/student/notice?page=1&per-page=6")
            } 
            catch(err) {
                console.log("Notification 모듈 안에 있는 CrawlData에서 크롤링 중 에러 발생: " + err.stack);
            }
        }
        getHtml()
            .then(html => {
                let ulList = []; // 파싱한 데이터(제목, url, 날짜)를 담을 리스트 생성
                const $ = cheerio.load(html.data);
                
                const $bodyList = $("ul.board-default-list").children("li"); // 각각의 제목, 날짜, url이 담겨 있는 DOM 요소(li)를 bodyList로 지정 
        
                $bodyList.each(function(i, elem) { // li 각각의 title, date, url을 ulList에 저장
                    ulList[i] = {
                        title: $(this).find('span.subject').text().trim().replace('수정됨', '').replace('새 글', '').replace(/\t/g,''),
                        date: $(this).find('div.last span.datetime').text(),
                        url: $(this).find('a').attr('href'),
                        isnotice: $(this).find('a div.first span').text().replace(/\t/g,'').replace(/\n/g,'').replace('공지공지','').trim()
                    }
                })
                
                const data = ulList.filter(n => n.title);
                
                //클롤링한 데이터들을 비교하던 중, cursor[0].title == data[i].title이면 break 하려고 for 문 사용
                for(let i = 0; i < data.length; i++) {
                
                // db에 저장하기 위해 파싱 결과를 각각의 변수에 저장
                let title = data[i].title;
                let url = "https://www.dic.hanyang.ac.kr" + data[i].url;
                let date = moment(data[i].date).format('YYYY-MM-DD');
                
                let isnotice = (data[i].isnotice == "공지") ? 1 : 0; 
                // 파싱을 통해 얻은 날짜의 포맷이 올바른지 여부 확인
                var date_check = moment(date).isValid(); 
                
                // 포맷이 올바르지 않은 경우(N시간 전), 현재 날짜로 수정 
                if(!date_check){ 
                    date = moment().format('YYYY-MM-DD');  
                }  

                const today = moment().format('YYYY-MM-DD') 
                //오늘 새로 작성된 공지사항이 아니라면 삽입하지 않고 넘어간다.
                
                if(today != date){
                    console.log("오늘 업로드 된 내용이 아니라서 크롤링 하지 않고 다음 항목으로 넘어감")
                    continue;
                }  
                
                //contents를 채우기 위한 크롤링 (택: crawler2)
                const getHtml2 = async () => {
                    try { // 파싱할 사이트의 url을 지정
                        return await axios.get(url)
                    } catch(err) { 
                        console.log("Notification 모듈 안에 있는 CrawlData에서 contents 크롤링 중 에러 발생: "+ err.stack);
                    }
                }
            
                getHtml2()
                    .then(html2 => {
                        let ulList2 = []; // 파싱한 데이터(글 내용, 이미지 링크)를 담을 리스트 생성
                        let contents = "";
                        const $ = cheerio.load(html2.data);
                        const $bodyList = $("div.content");

                        if(Boolean($bodyList.find('p'))) { // DOM 요소 p를 만날 때마다 그 안의 텍스트 저장 + 개행
                            $bodyList.find('p').each(function(i, elem) {
                                if(Boolean($(this).text())) {
                                    contents = contents + $(this).text().trim() + "\n";
                                    return contents;
                                }  
                            })
                        }

                        else if(Boolean($bodyList.find('div'))) { // DOM 요소 div를 만날 때마다 그 안의 텍스트 저장 + 개행
                            $bodyList.find('div').each(function(i, elem) {
                                if(Boolean($(this).text())) {
                                    contents = contents + $(this).text().trim() + "\n";
                                    return contents;
                                }
                            })
                        }   
                        $bodyList.each(function(i, elem) {
                            ulList2[i] = {
                                contents: contents,
                                pictures: $(this).find('img').attr('src')                   
                            }
                            contents = ulList2[i].contents;
                            pictures = ulList2[i].pictures;             
                            
                            var elements = new database.NotificationModel({
                                userid: new ObjectId("5d5373177443381df03f3040"), // 관리자 계정의 ID 부여 
                                nickNm: "admin", //관리자 계정의 닉네임
                                profile: " ",// 게시글 옆 사진
                                likes:  0, 
                                likeslist: [], //게시물에 좋아요를 누른 사람들의 목록
                                created_at: moment().utc(Date.now(), "YYYY-MM-DD HH:mm:ss"), //bulletinboard의 created_at과 다르다
                                title: title,
                                contents: contents,
                                pictures: pictures,  //링크
                                url: url, 
                                date: date,
                                hits: 0, // 조회 수    
                                comments: [],
                                isnotice: isnotice
                            }); 
                            elements.saveNotification(function(err){
                                if(err){
                                    console.log("Notification 모듈 안에 있는 CrawlData에서 크롤링 후 저장 중 에러 발생: " + err.stack)
                                }  
                            }) 
                            console.log("삽입 완료") 
                            res.end() 
                            return;  
                        })// $bodyList.each 닫기 
                    })// gethtml2 .then 닫기
                }//for 문 닫기  
                res.end(); 
                return;      
            })//.then 닫기   
                   
    } 
    else{
        console.log("Notification 모듈 안에 있는 CrawlData 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    }                
};//CrawlData 닫기 

//현재 공지사항 중 원본 목록에 존재하지 않은 것들을 삭제한다.
var UpdateCrawlData = async function(req, res) {
    await connection();
    console.log('Notification 모듈 안에 있는 UpdateCrawlData 호출됨.');

    // 데이터베이스 객체가 초기화된 경우
    if (database) {   
        const database = req.app.get('database');
        database.NotificationModel.find({},async function(err,results){
            if(err){
                console.log("Notification 모듈 안에 있는 UpdateCrawlData에서 게시물 조회 중 에러 발생: " + err.stack)
                res.end(); 
                return;
            }
            results.forEach(async (items) => {
                await axios.post(items.url)
                    .then((response) => {     
                    })
                    .catch(( err ) => {       
                        if(err.response.status == '404'){
                            database.NotificationModel.deleteOne({_id: new ObjectId(items._id)},
                            function(err1){
                                if(err1){
                                    console.log("Notification 모듈 안 UpdateCrawl에서 게시글 삭제 중 에러 발생: "+ err1.stack)
                                    res.end(); 
                                    return;
                                }
                            })
                            return;
                        }    
                    })   
            })
        })
    } 
    else{
        console.log("Notification 모듈 안에 있는 UpdateCrawlData 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    }                
};//UpdateCrawlData 닫기

//크롤링한 게시판의 내용을 영어로 번역 (notifications collection의 title_en, contents_en에 저장)
var Translate_en = async function(req, res) {
    console.log('Notification 모듈 안에 있는 Translate_en 호출됨.'); 
    await connection() 

    if(database) { 
        const database = req.app.get('database'); 
        database.NotificationModel.find({title_en: " "},
            function(err, cursor) {
                if(err) {
                    console.log("Notification 모듈 안에 있는 Translate_en에서 번역할 게시물 조회 중 에러 발생: "+ err.stack)
                    res.end(); 
                    return;    
                }   
                cursor.map( (items) =>  {   
                    var startLanguage = "und"; //첫 글자 언어
                    var middleLanguage = "und"; // 중간 글자 언어  
                    var i =0;  
                    var j = 0;
                    var regex_kor = new RegExp("^[\uac00-\ud7a3]*$"); //한국어 정규표현식
                    var regex_eng = new RegExp("^[A-Za-z]*$"); //영어 정규표현식
                    var regex_zh = new RegExp("^[\u4e00-\u9fff]*$","u") //중국어 정규표현식
                    
                    // 유효한 첫 글자의 언어를 파악하기 위함.
                    if(items.contents.length>0){
                        do { 
                            if(regex_kor.test(items.contents.charAt(i))){
                                startLanguage = "ko" 
                                break;
                            } 
                            if(regex_eng.test(items.contents.charAt(i))){
                                startLanguage = "en"  
                                break;
                            }                         
                            if(regex_zh.test(items.contents.charAt(i))){  
                                startLanguage = "zh"
                                break;
                            }    
                            i++;
                        } while (true);  

                        //유효한 중간 글자의 언어를 파악하기 위함.    
                        do { 
                            if(regex_kor.test(items.contents.charAt(Math.floor(items.contents.length/2)-j))){
                                middleLanguage = "ko"     
                                break;
                            } 
                            if(regex_eng.test(items.contents.charAt(Math.floor(items.contents.length/2)-j))){
                                middleLanguage = "en" 
                                break;
                            }                         
                            if(regex_zh.test(items.contents.charAt(Math.floor(items.contents.length/2)-j))){
                                middleLanguage = "zh"   
                                break;
                            }    
                            j++;
                        }while (true); 
                    }//if 문 닫기 
                
                    var toTranslate = (startLanguage == middleLanguage) && startLanguage != "en"
 
                        var localcontents = items.contents  
                        var localtitle = items.title // 제목은 조건 상관없이 번역한다. 
                        //title 번역 
                        translate
                            .translate(items.title, "en", function(err, translated_title) {
                                if(err){        
                                    console.log("Notification 모듈 안에 있는 Translate_en 중 if(toTranslate) 내에서 title 번역 중 에러 발생: " + err.stack)
                                    res.end(); 
                                    return; 
                                }  
                                console.log("title을 en으로 번역 완료, 번역 내역: ",translated_title)
                            localtitle = translated_title;
                        
                        //contents 번역시
                        if(toTranslate){ 
                            
                            translate
                                .translate(localcontents, "en", function(err, translated_contents) {
                                    if(err){
                                        console.log("Notification 모듈 안에 있는 Translate_en 중 if(toTranslate) 내에서 contents 번역 중 에러 발생: " + err.stack)
                                        res.end(); 
                                        return; 
                                    }
                                    localcontents = translated_contents;  
                                    database.NotificationModel.findByIdAndUpdate(new ObjectId(items._id), 
                                        {title_en: localtitle.translatedText, contents_en: localcontents.translatedText},
                                        function(err){
                                            if(err){
                                                console.log("Notification 모듈 안에 있는 Translate_en 중 if(toTranslate) 내에서 title_en, contents_en 삽입 중 에러 발생: " + err.stack)
                                                res.end(); 
                                                return; 
                                            } 
                                            console.log("contents를 en으로 번역 완료, 번역 내역: ",localcontents)
                                        }) 
                                })//translate - contents 닫기 
                        }//if(toTranslate) 닫기   
                        else{ 
                            database.NotificationModel.findByIdAndUpdate(new ObjectId(items._id), 
                            {title_en: localtitle.translatedText},
                            function(err){
                                if(err){
                                    console.log("Notification 모듈 안에 있는 Translate_en 중 title_en, contents_en 삽입 중 에러 발생: " + err.stack)
                                    res.end(); 
                                    return; 
                                }
                            }) 
                        }
                    })//translate - title 닫기 
                })//cursor.map 닫기 
            console.log("Translate_en 완료")    
            res.end(); 
            return;             
        })//NotificationModel.find 닫기         
    }//if(database) 닫기 
    else{
        console.log("Notification 모듈 안에 있는 Translate_en 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    }   
};  

//크롤링한 게시판의 내용을 중국어로 번역 (notifications collection의 title_zh, contents_zh에 저장)
var Translate_zh = async function(req, res) {
    console.log('Notification 모듈 안에 있는 Translate_zh 호출됨.'); 
    await connection() 

    if(database) {  
        const database = req.app.get('database');
        database.NotificationModel.find({title_zh: " "},
            function(err, cursor) {
                if(err) {
                    console.log("Notification 모듈 안에 있는 Translate_zh에서 번역할 게시물 조회 중 에러 발생: " + err.stack)
                    res.end(); 
                    return;    
                }   
                cursor.map( (items) =>  {   
                    var startLanguage = "und"; //첫 글자 언어
                    var middleLanguage = "und"; // 중간 글자 언어  
                    var i =0;  
                    var j = 0;
                    var regex_kor = new RegExp("^[\uac00-\ud7a3]*$"); //한국어 정규표현식
                    var regex_eng = new RegExp("^[A-Za-z]*$"); //영어 정규표현식
                    var regex_zh = new RegExp("^[\u4e00-\u9fff]*$","u") //중국어 정규표현식
                    
                    // 유효한 첫 글자의 언어를 파악하기 위함.
                    if(items.contents.length>0){
                        do { 
                            if(regex_kor.test(items.contents.charAt(i))){
                                startLanguage = "ko"  
                                break;
                            } 
                            if(regex_eng.test(items.contents.charAt(i))){
                                startLanguage = "en" 
                                break;
                            }                         
                            if(regex_zh.test(items.contents.charAt(i))){
                                startLanguage = "zh"  
                                break;
                            }    
                            i++;
                        } while (true);  

                        //유효한 중간 글자의 언어를 파악하기 위함.    
                        do { 
                            if(regex_kor.test(items.contents.charAt(Math.floor(items.contents.length/2)-j))){
                                middleLanguage = "ko"     
                                break;
                            } 
                            if(regex_eng.test(items.contents.charAt(Math.floor(items.contents.length/2)-j))){
                                middleLanguage = "en" 
                                break;
                            }                         
                            if(regex_zh.test(items.contents.charAt(Math.floor(items.contents.length/2)-j))){
                                middleLanguage = "zh"   
                                break;
                            }    
                            j++;
                        }while (true); 
                    }//if 문 닫기 
                    
                   
                    var toTranslate = (startLanguage == middleLanguage) && startLanguage != "zh"
 
                        var localcontents = items.contents  
                        var localtitle = items.title // 제목은 조건 상관없이 번역한다. 
                        //title 번역 
                        translate
                            .translate(items.title, "zh", function(err, translated_title) {
                                if(err){
                                    console.log("Notification 모듈 안에 있는 Translate_zh 중 if(toTranslate) 내에서 title 번역 중 에러 발생: " + err.stack)
                                    res.end(); 
                                    return; 
                                } 
                                console.log("title을 zh으로 번역 완료, 번역 내역: ",translated_title) 
                            localtitle = translated_title;
                        
                        //contents 번역시
                        if(toTranslate){ 
                            
                            translate
                                .translate(localcontents, "zh", function(err, translated_contents) {
                                    if(err){
                                        console.log("Notification 모듈 안에 있는 Translate_zh 중 if(toTranslate) 내에서 contents 번역 중 에러 발생: " + err.stack)
                                        res.end(); 
                                        return; 
                                    } 
                                    console.log("contents를 zh으로 번역 완료, 번역 내역: ",translated_contents)
                                    localcontents = translated_contents;  
                                    database.NotificationModel.findByIdAndUpdate(new ObjectId(items._id), 
                                        {title_zh: localtitle.translatedText, contents_zh: localcontents.translatedText},
                                        function(err){
                                            if(err){
                                                console.log("Notification 모듈 안에 있는 Translate_zh 중 if(toTranslate) 내에서 title_en, contents_en 삽입 중 에러 발생: " + err.stack)
                                                res.end(); 
                                                return; 
                                            }
                                        }) 
                                })//translate - contents 닫기 
                        }//if(toTranslate) 닫기   
                        else{ 
                            database.NotificationModel.findByIdAndUpdate(new ObjectId(items._id), 
                            {title_en: localtitle.translatedText},
                            function(err){
                                if(err){
                                    console.log("Notification 모듈 안에 있는 Translate_zh 중 title_zh, contents_zh 삽입 중 에러 발생: " + err.stack)
                                    res.end(); 
                                    return; 
                                }
                            }) 
                        }
                    })//translate - title 닫기 
                })//cursor.map 닫기        
            console.log("Translate_zh 완료")   
            res.end(); 
            return;   
        })//NotificationModel.find 닫기         
    }//if(database) 닫기 
    else{
        console.log("Notification 모듈 안에 있는 Translate_en 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    }   
}; 

//사용자 조건에 맞는 (영어, 중국어, start&end Index) 공지사항들 보여줌 
var ShowNotification = async function(req, res) {
    console.log('Notification 모듈 안에 있는 ShowNotification 호출됨.');
    await connection()       
    
    var paramUserId= req.body.userid||req.query.userid || req.param.userid||"5d5373177443381df03f3040";
    var parampostStartIndex = req.body.postStartIndex||req.query.postStartIndex || req.param.postStartIndex||0; 
    var parampostEndIndex = req.body.postEndIndex||req.query.postEndIndex || req.param.postEndIndex||19;  
    var paramSearch = req.body.search||" "; 
    var paramLanguage = req.body.language||" ";
  
    
    console.log("paramUserId: ",paramUserId) 
    console.log("parampostStartIndex: ",parampostStartIndex)
    console.log("parampostEndIndex: ",parampostEndIndex)
    console.log("paramSearch: ",paramSearch)
    console.log("paramLanguage: ",paramLanguage)

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
        const database = req.app.get('database');
        //검색어가 입력 될 시 
        if(paramSearch!=" "){
            var query = {$or: 
              [  
                {nickNm: new RegExp(".*"+paramSearch+".*","gi")}
              ], 
              }; 
            
              switch(paramLanguage){
                
                //공지사항 언어: 영어
                case("en"): 
                    query.$or.push({contents_en: new RegExp(".*"+paramSearch+".*","gi")})
                    query.$or.push({title_en: new RegExp(".*"+paramSearch+".*","gi")}) 
                    break 

                //공지사항 언어: 중국어 
                case("zh"): 
                    query.$or.push({contents_zh: new RegExp(".*"+paramSearch+".*","gi")})
                    query.$or.push({title_zh: new RegExp(".*"+paramSearch+".*","gi")}) 
                    break                    

                //공지사항 언어: 한국어
                default: 
                    query.$or.push({title: new RegExp(".*"+paramSearch+".*","gi")})
                    query.$or.push({contents: new RegExp(".*"+paramSearch+".*","gi")}) 
                    break
              }
            }
        else{
          var query = {};
        }   

      database.db.collection("notifications").find(query).sort({
        isnotice: -1,
        date: -1   
    }).toArray(function(err,data){ 
        if(err){
          console.log("ShowNotification에서 collection 조회 중 수행 중 에러 발생"+ err.stack);
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
          var localismine = data[i].userid == paramUserId 
          let locallikespressed = false;
          //해당 게시물에 좋아요를 눌렀는지의 여부 확인
          for(let j=0;j<data[i].likeslist.length;j++){
              if(data[i].likeslist[j].userid == paramUserId){
                locallikespressed=true; 
                break;
              }
          }
          
          let localtitle = " "; 
          let localcontents = " ";
          switch(paramLanguage){

            //공지사항 언어: 영어
            case("en"): 
                localtitle = data[i].title_en
                localcontents = data[i].contents_en
                break; 

            //공지사항 언어: 중국어 
            case("zh"): 
                localtitle = data[i].title_zh
                localcontents = data[i].contents_zh 
                break                    

            //공지사항 언어: 한국어
            default: 
                localtitle = data[i].title
                localcontents = data[i].contents
                break
          } 
          let localdate = moment(data[i].date).format("YYYY-MM-DD") 
          context.postslist.push(
            {
              boardid: "notifications", 
              entryid: data[i]._id, 
              userid: data[i].userid, 
              username: data[i].nickNm, 
              profile: data[i].profile, 
              likes: data[i].likes,  
              likespressed: locallikespressed,
              date: localdate,
              ismine: localismine, 
              title: localtitle, 
              contents: localcontents, 
              pictures: data[i].pictures,
            }); 
          } 
      context.postslist.splice(0,1)   
      res.json(context);
      return;  
    })
    }//if(database.db) 닫기  
  else {
      
      console.log(" Notifications 모듈 안 ShowNotification 수행 중 데이터베이스 연결 실패")
      res.end(); 
      return;
  }   
  };//ShowNotification 닫기   

module.exports.CrawlData = CrawlData; 
module.exports.Translate_en = Translate_en; 
module.exports.Translate_zh = Translate_zh; 
module.exports.ShowNotification = ShowNotification;
module.exports.UpdateCrawlData = UpdateCrawlData; 
