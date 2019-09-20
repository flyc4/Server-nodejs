const api = "AIzaSyATLbXuBnhHhb1Meyv2WFa6Lpw5FCupc8I";
const translate = require('google-translate')(api);
var text = "한ab";

const DetectLanguage = async(text) => {
    var detect = "";
    firsttext = text[0];
    lasttext = text[-1];
    translate
        .detectLanguage(text[0], async function(err, translations) {
            if(err) console.error(err);
            // console.log("", translations.language);
            detect = translations.language;
            return await detect;
    })
    console.log(detect); 
}

DetectLanguage(text);