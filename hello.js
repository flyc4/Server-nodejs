const api = "AIzaSyATLbXuBnhHhb1Meyv2WFa6Lpw5FCupc8I";
const translate = require('google-translate')(api);
var text = "한ab";
console.log(text[0]);
console.log(text[text.length-1]);

// 첫 글자와 마지막 글자의 언어가 다르면, DetermineTranslation 돌렸을 때 리턴값이 false임.
// 즉, request가 영어나 중국어일 때 DetermineTranslation 값이 false 면 번역 메소드 실행 X
const DetermineTranslation = function(text) {
    if (text == undefined) console.log("DetermineTranslation 함수 실행 중 오류 발생(input parameter 없음");
    var detect = "";
    var isTranslated = true; // 번역되어야 하는지 말아야 하는지 여부를 저장하기 위한 변수
    translate
        .detectLanguage(text[0], function(err, translations) {
            if(err) console.error(err);
            detect = translations.language; // 첫 번째 글자 언어 정보 저장
            return detect;
        })
    console.log(detect);
    translate
        .detectLanguage(text[text.length-1], function(err, translations) {
            if(err) console.error(err);
            if(detect != translations.language) { // 첫 번째 글자와 마지막 글자의 언어 정보가 다를 때,
                isTranslated = false; 
                return isTranslated;
            }
        })
    console.log(isTranslated);
    return isTranslated;
    }

console.log(DetermineTranslation(text)); 