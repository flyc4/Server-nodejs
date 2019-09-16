const axios = require("axios");
const cheerio = require("cheerio");
const moment = require('moment'); 
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const ObjectId = mongoose.Types.ObjectId;  
const utils = require('../config/utils'); 
const server_url = "http://sususerver.ddns.net:3000"

var CrawlNotificationData = async function(req, res) {
    var database = req.app.get('database');
    console.log('Notification 모듈 안에 있는 CrawlNotificationData 호출됨.');

    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
        // 파싱할 사이트의 url을 지정
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
                        url: $(this).find('a').attr('href')               
                    }
                })
                const data = ulList.filter(n => n.title); 

                data.map( (items)=>{
                
                    // db에 저장하기 위해 파싱 결과를 각각의 변수에 저장
                let title = items.title;
                let url = "https://www.dic.hanyang.ac.kr" + items.url;
                let date = moment(items.date).format('YYYY-MM-DD');  
                // 파싱을 통해 얻은 날짜의 포맷이 올바른지 여부 확인
                var date_check = moment(date).isValid(); 
                
                // 포맷이 올바르지 않은 경우(N시간 전), 현재 날짜로 수정 
                if(!date_check){ 
                    date = moment().format('YYYY-MM-DD');  
                }
                
                    
                database.NotificationModel.findOne({title: title},
                    function(err2,data){
                        if(err2){
                            utils.log("CrawlNotificationData에서 크롤링할 데이터가 이미 있는 지 확인 중 에러 발생: ", err2.message)
                            res.end(); 
                            return; 
                        }  
                        //이미 DB에 있는 데이터의 경우
                        if(data != null){
                            console.log("CrawlNotificationData에서 크롤링할 데이터가 이미 있음")
                            return;
                        }
                        database.db.collection("notifications").insertOne({
                            userid: new ObjectId("5d5373177443381df03f3040"), // 관리자 계정의 ID 부여 
                            nickNm: "admin",
                            profile: " ",// 게시글 옆 사진
                            likes:  0,
                            created_at: utils.timestamp(),
                            title: title,
                            contents: ' ',
                            pictures: ' ',  //링크
                            url: url, 
                            date: date,
                            hits: 0, // 조회 수    
                            comments: []
                        });//insertOne 닫기
                    })//NotificationModel.findOne 닫기
                })//map 닫기
            })//.then 닫기   
        res.end() 
        return;
        } 
        else{
            utils.log("CrawlNotificationData 수행 중 데이터베이스 연결 실패")
            res.end(); 
            return;
        }   
};//CrawlNotificationData 닫기

module.exports.CrawlNotificationData = CrawlNotificationData;