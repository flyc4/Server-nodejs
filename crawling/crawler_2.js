// crawler_1을 통해 db에 저장된 url에 있는 글 내용, 이미지 링크를 파싱하여 db에 저장

const axios = require("axios");
const cheerio = require("cheerio");
const log = console.log;
const dbPort = 27017
const connect = require('./schema/index.js')

connect(dbPort);

const Inter = require('./schema/interschema.js')

Inter.find({}, null, { sort: {'date':-1} }, (err, inters) => {
    for(let j = 0; j < inters.length; j++) { // db에 존재하는 데이터 가져오기
      if(err) return log(err);
      else var url = inters[j].url;

      const getHtml = async () => {
        try { // 파싱할 사이트의 url을 지정
            return await axios.get(url)
        } catch(error) {
            console.error(error);
        }
    }
    
    getHtml()
        .then(html => {
            let ulList = []; // 파싱한 데이터(글 내용, 이미지 링크)를 담을 리스트 생성
            let contents = "";
            const $ = cheerio.load(html.data);
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
                ulList[i] = {
                    contents: contents,
                    pictures: $(this).find('img').attr('src')                   
                }
            log(ulList);

            contents = ulList[i].contents;
            pictures = ulList[i].pictures; 

            log(contents)
            log(pictures) 
            Inter.findByIdAndUpdate(inters[j]._id, { $set: {contents: contents, pictures: pictures } }, {'new':true}, function(err, res){
                if(err) return log(err);
                else return log("db update is executed successfully");
            });//update 닫기
            
            })//each 닫기
        })//.then 닫기
        }//for 닫기
    })