const axios = require("axios");
const cheerio = require("cheerio");
const moment = require('moment'); 
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const ObjectId = mongoose.Types.ObjectId;  
const utils = require('../config/utils'); 
const server_url = "http://sususerver.ddns.net:3000" 
const schedule = require('node-schedule');

_notificationcrawl = async () => {
    let url = server_url + '/process/CrawlNotificationData'; 
        await axios.post(url,{postStartIndex: 0, postEndIndex: 2})
            .then((response) => {    
            })
            .catch(( err ) => {      
                utils.log("클롤링 요청 중 에러 발생: ", err.message)  
                return;
            });    
  }  
//매일 오전 9시 마다 크롤링
let crawlupdate = schedule.scheduleJob({hour: 9, minute: 0}, async function(){
 await _notificationcrawl();    
})

var CrawlNotificationData = async function(req, res) {
    var database = req.app.get('database');
    console.log('Notification 모듈 안에 있는 CrawlNotificationData 호출됨.');

    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {  
        // 해당 일자에 크롤링을 했는 지 여부 확인 
        database.NotificationModel.findOne({}, 
                function(err,cursor){
                 if(err) {
                    utils.log("CrawlNotificationData에서 크롤링 여부를 결정하는 중 에러 발생: ", err.message)
                    res.end(); 
                    return; 
                }    

                // 크롤링 시작
                //파싱할 사이트의 url을 지정 
                const getHtml = async () => {
                    try { 
                        return await axios.get("https://www.dic.hanyang.ac.kr/front/student/notice?page=1&per-page=6")
                    } 
                    catch(error) {
                        utils.log("CrawlNotificationData에서 크롤링 중 에러 발생: " + error.message);
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
                        //cursor(크롤링 반영 전 notifications)에 원소가 하나라도 있고 
                        //notificatinos collection 안에 이미 크롤링해온 data가 있으면 크롤링 중지
                        if(cursor != undefined && cursor.title == data[i].title){ 
                            console.log("더 이상 클롤링할 목록이 없음")
                            break;
                        } 
                        
                        //contents를 채우기 위한 크롤링 (택: crawler2)
                        const getHtml2 = async () => {
                            try { // 파싱할 사이트의 url을 지정
                                return await axios.get(url)
                            } catch(error) {
                                utils.log("CrawlNotificationData에서 contents 크롤링 중 에러 발생: ", error.message);
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
                                    elements.saveNotification(function(err3){
                                        if(err3){
                                            utils.log("CrawlNotificationData에서 크롤링 후 저장 중 에러 발생: ",err3.message)
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
                }).sort({isnotice: -1, date: -1, created_at: 1}) //database.NotificationModel.find (첫 크롤링 시)    
    } 
    else{
        utils.log("CrawlNotificationData 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    }                
};//CrawlNotificationData 닫기

module.exports.CrawlNotificationData = CrawlNotificationData; 
