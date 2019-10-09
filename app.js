/**
/**
 * 패스포트 사용하기
 * 
 * 패스포트 모듈에서 로그인 인증을 처리하도록 함
 * 데이터베이스에 저장된 사용자 정보를 사용해 인증할 수 있도록 LocalStrategy를 인증방식으로 사용함.
 *
 * @date 2016-11-10
 * @author Mike
 */
 

// Express 기본 모듈 불러오기
var express = require('express')
  , http = require('http')
const serverless = require('serverless-http');

// Express의 미들웨어 불러오기. (이거 없으면 let a = req.body.~id 이런 식으로 데이터 받기 불가능)
var bodyParser = require('body-parser')
const MongoClient = require("mongodb").MongoClient;

//===== Passport 사용 =====// 
var passport = require('passport'); 
var flash = require('connect-flash'); 


// 모듈로 분리한 설정 파일 불러오기
var config = require('./config/config');

// 모듈로 분리한 데이터베이스 파일 불러오기
var database = require('./database/database');

// 모듈로 분리한 라우팅 파일 불러오기
var route_loader = require('./routes/route_loader');

// 익스프레스 객체 생성
var app = express(); 

//===== 서버 변수 설정 및 연결  =====//
console.log('config.server_port : %d', config.server_port);
app.set('port', process.env.PORT || 3000);
 

// body-parser를 이용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({ extended: false }))

// body-parser를 이용해 application/json 파싱
app.use(bodyParser.json())


//===== Passport 사용 설정 =====//
// Passport의 세션을 사용할 때는 그 전에 Express의 세션을 사용하는 코드가 있어야 함
app.use(passport.initialize());
app.use(passport.session()); 
app.use(flash());

//라우팅 정보를 읽어들여 라우팅 설정
var router = express.Router();
route_loader.init(app, router);  

// 패스포트 설정
var configPassport = require('./config/passport');
configPassport(app, passport);
// 패스포트 라우팅 설정

//패스포트 관련 함수 라우팅 
var userPassport = require('./routes/user_passport');
userPassport(router, passport);     

//===== 서버 시작 =====//  
const client = new MongoClient(process.env.db_url, {
	useNewUrlParser: true,
  }); 

  let databases

  const createConn = async () => {
	await client.connect();
	databases = client.db('db');  
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



//확인되지 않은 예외 처리 - 서버 프로세스 종료하지 않고 유지함
process.on('uncaughtException', function (err) {
	console.log('uncaughtException 발생함 : ' + err);
	console.log('서버 프로세스 종료하지 않고 유지함.');
	
	console.log(err.stack);
});

// 프로세스 종료 시에 데이터베이스 연결 해제
process.on('SIGTERM', function () {
    console.log("프로세스가 종료됩니다.");
    app.close();
});

app.on('close', function () {
	console.log("Express 서버 객체가 종료됩니다.");
	if (database.db) {
		database.db.close();
	}
});

// 시작된 서버 객체를 리턴받도록 합니다. 
var server = http.createServer(app).listen(app.get('port'), function(){
	console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));

	// 데이터베이스 초기화
	database.init(app, config); 
});

module.exports.handler = serverless(app)  

