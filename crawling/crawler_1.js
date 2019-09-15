const axios = require("axios");
const cheerio = require("cheerio");
const log = console.log;
const dbPort = 27017
const connect = require('./schema/index.js')
const moment = require('moment');

connect(dbPort);

const Inter = require('./schema/interschema.js')

const getHtml = async () => {
    try { // 파싱할 사이트의 url을 지정
        return await axios.get("https://www.dic.hanyang.ac.kr/front/student/notice?page=1&per-page=6")
    } catch(error) {
        console.error(error);
    }
}

getHtml()
    .then(html => {
        let ulList = []; // 파싱한 데이터(제목, url, 날짜)를 담을 리스트 생성
        var store = Boolean; // 저장해야 할 지 말아야 할 지의 여부를 저장하는 bool type 변수
        const $ = cheerio.load(html.data);
        // log($);
        const $bodyList = $("ul.board-default-list").children("li"); // 각각의 제목, 날짜, url이 담겨 있는 DOM 요소(li)를 bodyList로 지정 

        $bodyList.each(function(i, elem) { // li 각각의 title, date, url을 ulList에 저장
            ulList[i] = {
                title: $(this).find('span.subject').text().trim().replace('수정됨', '').replace('새 글', '').replace(/\t/g,''),
                date: $(this).find('div.last span.datetime').text(),
                url: $(this).find('a').attr('href')               
            }
            // log(ulList);
        })
          const data = ulList.filter(n => n.title);
          log(data);
        for(let i = 0; i < data.length; i++) { // db에 저장하기 위해 파싱 결과를 각각의 변수에 저장
          let title = data[i].title;
          let url = "https://www.dic.hanyang.ac.kr" + data[i].url;
          let date = moment(data[i].date).format('YYYY-MM-DD');  
          var date_check = moment(date).isValid(); // 파싱을 통해 얻은 날짜의 포맷이 올바른지 여부 확인
          // log(date_check)

          if(!date_check) date = moment().format('YYYY-MM-DD'); // 포맷이 올바르지 않은 경우(N시간 전), 현재 날짜로 수정
          
          const myData = new Inter({boardid:'', entryid:'', userid:'', username:'', profile:'', likes:'', 
          date: date, isMine: false, title: title, contents:'', pictures:'', url: url}); // 스키마에 맞춰 객체 생성
          // log(myData);

          Inter.find({}, null, { sort: {'date':-1} }, (err, inters) => {
            for(let j = 0; j < inters.length; j++) { // db에 이미 존재하는 데이터인지 검사
              if(err) return log(err);
              else if(title == inters[j].title) {
                store = false;
                log("already existed data");
                return store;
              }
            }

            if(store) {
              myData.save(function(err) {
                if(err) return log(err);
                log('inter saved to the db');
              }) 
            }
          })
        
        }
    })
   /* .then(res => {
      const title = res.title;
      const date = res.date;
      const url = res.url;
      var myData = new Inter({title: title, date: date, url: url});
      log(myData);
      /* myData.save(function(err) {
        if(err) return log(err);
        log('inter saved to the db');
      })
      log(res); 
    }) */