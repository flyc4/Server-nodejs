/*
 * 게시판을 위한 라우팅 함수 정의
 *
 * @date 2016-11-10
 * @author Mike
 */

// html-entities module is required in showpost.ejs
var Entities = require('html-entities').AllHtmlEntities;

var mongoose = require('mongoose');
var expressSession = require('express-session');

var alert = require('alert-node');

// 관리자만 볼 수 있는 페이지로 넘어감.
var addpost_rateclass = function(req, res) {
	console.log('rateclass 모듈 안에 있는 addpost_rateclass 호출됨.');
    
    
    var paramTitle = req.body.title || req.query.title;
    var paramContents = req.body.contents || req.query.contents;
    var paramWriter = expressSession.nickNm; 
    var database = req.app.get('database');
    
    console.log('요청 파라미터 : ' + paramTitle + ', ' + paramContents + ', ' + 
               paramWriter);
	
	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        
        // 1. 아이디를 이용해 사용자 검색
		database.UserModel.findBynickNm(paramWriter, function(err, results) {
			if (err) {
                console.error('게시판 글 추가 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>게시판 글 추가 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                
                return;
            }

			if (results == undefined || results.length < 1) {
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>로그인이 되지 않았거나 끊겨졌습니다. 다시 로그인하시길 바랍니다.</h2>');
				res.redirect('/login');
				
				return;
			}
			
			var userObjectId = results[0]._doc._id;
			console.log('사용자 ObjectId : ' + paramWriter +' -> ' + userObjectId);
			
			// save()로 저장
			// rateclassModel 인스턴스 생성
			var post = new database.RateClassModel({
				title: paramTitle,
				contents: paramContents,
				writer: userObjectId
			});
            post.savePost(function(err, result) {
                    if (err) {
                        console.error('응답 웹문서 생성 중 에러 발생 : ' + err.stack);

                        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                        res.write('<h2>응답 웹문서 생성 중 에러 발생</h2>');
                        res.write('<p>' + err.stack + '</p>');
                        res.end();
                        return;
                    }
                console.log("글 데이터 추가함.");
			    console.log('글 작성', '포스팅 글을 생성했습니다. : ' + post._id);    		
                console.log("글 데이터 추가함.");    
            })			
			    
        console.log('글 작성', '포스팅 글을 생성했습니다. : ' + post._id);
        return res.redirect('/process/showpost_rateclass/' + post._id); 
        })
        
    	
	} else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	}
	
}; //addpost_rateclass 닫기

var listpost_rateclass = function(req, res) {
	console.log(' 모듈 안에 있는 listpost 호출됨.');
    
    var database = req.app.get('database');
    function connectDB() {
    var databaseUrl = exports.config.db_url;
    var mongoose = require('mongoose');
    MongoClient.connect(databaseUrl, function(err, database) {
        if(err) throw err;
         var db = client.db('rateclasses'); // 어떤 컬렉션에서 받을 지 선택하는 듯
        console.log('데이터베이스에 연결됨: '+databaseUrl);
    });
    }
    
    var paramPage = req.body.page || req.query.page || 0;
    var paramPerPage = req.body.perPage || req.query.perPage || 5;
	
    console.log('요청 파라미터 : ' + paramPage + ', ' + paramPerPage);   
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
		// 1. 글 리스트
		var options = {
			page: paramPage,
			perPage: paramPerPage
		}
		var paramrateclassSearchValue = req.body.rateclasssearchvalue || req.query.rateclasssearchvalue|| " ";
        var paramrateclassSearchSelect = req.body.rateclasssearchselect || req.query.rateclasssearchselect||" ";  
        if(paramrateclassSearchValue != " ")
            {    
                var query = {title: new RegExp(".*"+paramrateclassSearchValue+".*")};  
            }
        else{
            var query = { };
        }  
        // 만족하는 문서 갯수 확인 
        database.RateClassModel.find(query, function(err, cursor, options){
            if(err){ console.error('게시판 글 목록 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>게시판 글 목록 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            }  
            var count = cursor.length; //results: Object -> Array 변환 후 길이 구함    
            console.log("count: ",count); 
            var context = {
						title: '글 목록',
						posts: cursor,
						page: parseInt(paramPage),
						pageCount: count,
						perPage: paramPerPage, 
						totalRecords: count,
						size: paramPerPage
					};  
            req.app.render('rateclass', context, function(err, html) {
                if (err) {
                    console.error('응답 웹문서 생성 중 에러 발생 : ' + err.stack);
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>응답 웹문서 생성 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return;
                }  
               else{  
                   res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                   res.end(html); 
               } 
            })//req.app.render 닫기 
        }).populate('writer', 'nickNm loginId').sort({'created_at': -1});
    }//if(database.db) 닫기
     
    else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	} 
}; //listpost_rateclass 닫기   

var showpost_rateclass = function(req, res) {
	console.log('rateclass 모듈 안에 있는 showpost 호출됨.');
  
    // URL 파라미터로 전달됨
    var paramId = req.params.id || req.body.id || req.query.id;
	
    var database = req.app.get('database');
    
    console.log('showpost 요청 파라미터 : ' + paramId);
	
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
		// 1. 글 리스트
		database.RateClassModel.load(paramId, function(err, results) {
			if (err) { 
                console.error('게시판 글 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>게시판 글 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                
                return;
            } 
            if (results) {
				//console.dir(results);
  
                // 조회수 업데이트
                console.log('trying to update hits.');
                
                database.RateClassModel.incrHits(results._doc._id, function(err2, results2) {
                    console.log('incrHits executed.');
                    
                    if (err2) {
                        console.log('incrHits 실행 중 에러 발생.');
                        console.dir(err2);
                        return;
                        
                    }
                });    
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				
				// 뷰 템플레이트를 이용하여 렌더링한 후 전송
				var context = {
					title: '글 조회 ',
					posts: results,
					Entities: Entities
				};
                
				req.app.render('showpost_rateclass', context, function(err, html) {
					if (err) {
                        console.error('응답 웹문서 생성 중 에러 발생 : ' + err.stack);
                
                        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                        res.write('<h2>응답 웹문서 생성 중 에러 발생</h2>');
                        res.write('<p>' + err.stack + '</p>');
                        res.end();

                        return;
                    }
					
					//console.log('응답 웹문서 : ' + html);
					res.end(html);
				});
			 
			} else {
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>글 조회 실패</h2>');
				res.end();
			}
		});
	} else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	}
}; // showpost_rateclass 닫기 

var editpost_rateclass = function(req, res) { //유효 사용자인지 확인 후 edit.ejs 호출
	console.log('rateclass 모듈 안에 있는 editpost 호출됨.');
  
    // URL 파라미터로 전달됨
    var paramId = req.body.id || req.query.id || req.params.id;
    var database = req.app.get('database');
	
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
		// 1. 글 리스트
		database.RateClassModel.load(paramId, function(err, results) {
			if (err) {
                console.error('게시판 글 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>수정 대상 글 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return;
            } 
            if (results) {
				if( expressSession.nickNm!= results._doc.writer.nickNm){
                    console.log("다른 사람의 게시물 수정 시도"); 
                    alert("다른 사람의 게시물 수정 시도");
                    res.redirect("/process/rateclass?page=0,perPage=5");
                } 
                var context = {
					title: '글 편집',
					posts: results,
					Entities: Entities
				};
                req.app.render('editpost',context, function(err, html) {
					if (err) {
                        console.error('응답 웹문서 생성 중 에러 발생 : ' + err.stack);
                
                        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                        res.write('<h2>응답 웹문서 생성 중 에러 발생</h2>');
                        res.write('<p>' + err.stack + '</p>');
                        res.end();
                        return;
                    }
					res.end(html);
				});			 
			} else {
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>글 수정 시도 실패</h2>');
				res.end();
			}
		});
	} else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	   }    
}; // editpost_rateclass 닫기  

var saveeditedpost_rateclass = function(req, res) { //editpost.ejs 에서 작성한 내용을 기존 document에 옮기는 과정.
	console.log('rateclass 모듈 안에 있는 saveeditedpost_rateclass 호출됨.');
        
    var paramTitle = req.body.title || req.query.title;
    var paramContents = req.body.contents || req.query.contents;  
    var paramId = req.body.id || req.query.id || req.params.id;
    
    var database = req.app.get('database');
    
    console.log('요청 파라미터 : ' + paramTitle + ', ' + paramContents + ', ' + paramId);
	
	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
            
            database.RateClassModel.load(paramId,function(err,result){ 
                if(err){
                    console.error('게시판 글 조회 중 에러 발생 : ' + err.stack);
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>수정 대상 글 조회 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return;
                } 
                database.RateClassModel.findOneAndUpdate({_id: paramId}, 
                                                    { $set: { title: paramTitle, contents: paramContents,                   created_at: Date.now()}  
                                                    }, {new: true}, function(err,doc){
                    if(err){
                    console.error('게시판 글 조회 중 에러 발생 : ' + err.stack);
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>수정 대상 글 조회 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return;
                    } 
                   
                    return res.redirect('/process/showpost_rateclass/' + result.id);  
                }) 
            });
    } else {
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }
}; //saveeditedpost_rateclass 닫기 

var deletepost_rateclass = function(req, res) {  // 유효 사용자 확인 후 선택한 포스트 삭제
	console.log('rateclass 모듈 안에 있는 deletepost_rateclass 호출됨.');
  
    // URL 파라미터로 전달됨
    var paramId = req.body.id || req.query.id || req.params.id;
    var database = req.app.get('database');
	
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
		// 1. 글 리스트
		database.RateClassModel.load(paramId, function(err, results) {
			if (err) {
                console.error('게시판 글 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>삭제 대상 글 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return;
            } 
            if (results) {  
                console.log("result's title: ", results._doc.title);
				if( expressSession.nickNm!= results._doc.writer.nickNm && expressSession.isadmin == false){
                    console.log("다른 사람의 게시물 삭제 시도"); 
                    alert("다른 사람의 게시물 삭제 시도")
                    res.redirect("/process/rateclass");
                } 
               database.RateClassModel.deleteOne({_id: paramId}, function(err, results){
               if (err) {
                    console.error('삭제 과정 중 에러 발생 : ' + err.stack);
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>삭제 과정 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return res.redirect("/process/rateclass");
               }		
			     })
		    };
	    })  
        return res.redirect("/process/rateclass");
    }else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	   }    
}; //deletepost_rateclass 닫기 

var addcomment_rateclass = function(req, res) {
	console.log('rateclass 모듈 안에 있는 addcomment_rateclass 호출됨.');
    var paramId = req.body.id || req.query.id || req.param.id;
    var paramContents = req.body.contents || req.query.contents;
    var paramWriter = expressSession.nickNm; 
    //var paramWriter = req.body.writer || req.query.writer;
	
    console.log('요청 파라미터 : ', paramContents + ', ' + paramWriter + ', ' + paramId);
    
	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        
        database.RateClassModel.findByIdAndUpdate(paramId,
            {'$push': {'comments':{'contents':paramContents, 'writer':paramWriter}}},
            {'new':true},function(err,result){
            
        if (err) {
                console.error('댓글 검색 과정 중 에러 발생 : ' + err.stack);
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>댓글 검색 과정 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
                res.end();
                return res.redirect("/process/rateclass");
           }
            console.log("댓글 추가 완료");
            console.log("댓글 추가 후 comment의 길이: ", result._doc.comments.length);
            return res.redirect('/process/showpost_rateclass/' + paramId); 
        }); 
        } else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
        } 	 
}; //addcomment_rateclass 닫기

var deletecomment_rateclass = function(req, res){
    console.log('rateclass 모듈 안에 있는 deletecomment_rateclass 호출됨.');
    var paramId = req.param.id || req.body.id || req.query.id;   
    var postId = req.body.postid || req.query.postid || req.param.postid;
    
    console.log('요청 파라미터 : ', paramId + ", ", postId);
    
	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        database.RateClassModel.findOne( {_id: postId}, function(err,result){
            if (err) {
                console.error('삭제할 댓글이 있는 게시물 조회 과정 중 에러 발생 : ' + err.stack);
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>삭제할 댓글이 있는 게시물 조회 과정 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
                res.end();
                return res.redirect("/process/rateclass");
           } 
            if(result){
                // here 뜸
                var index = function(){
                                for(var i =0 ; i<result._doc.comments.length; i++ ){
                                    if(paramId == result._doc.comments[i]._id){
                                        break;
                                    }
                                }    
                            return i;
                            }  
                console.log("index: ", index);
                if(expressSession.nickNm != result._doc.comments[index()].writer && expressSession.isadmin == false){
                        console.log("다른 사람의 댓글 삭제 시도");  
                        alert("다른 사람의 댓글 삭제 시도") 
                        res.end();
                        return res.redirect("/process/showpost_rateclass/"+postId); 
                        } 
                database.RateClassModel.findByIdAndUpdate(postId,
                    {'$pull': { 'comments': {'_id': paramId}}},function(err,comment){
                    if (err) {
                            console.error('댓글 삭제 과정 중 에러 발생 : ' + err.stack);
                            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                            res.write('<h2>댓글 삭제 과정 중 에러 발생</h2>');
                            res.write('<p>' + err.stack + '</p>');
                            res.end(); 
                            //here 안 뜸
                            return res.redirect("/process/rateclass");
                       }  
                     
                    //here 안 뜸
                    console.log("댓글 삭제 완료");
                    return res.redirect('/process/showpost_rateclass/' + postId); 
                    })   
            } 
        })
    } else {
    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
    res.write('<h2>데이터베이스 연결 실패</h2>');
    res.end();
    } 
    
}; //deletecomment_rateclass 닫기

module.exports.listpost_rateclass = listpost_rateclass;
module.exports.addpost_rateclass = addpost_rateclass;
module.exports.showpost_rateclass = showpost_rateclass; 
module.exports.editpost_rateclass = editpost_rateclass;  
module.exports.saveeditedpost_rateclass = saveeditedpost_rateclass;
module.exports.deletepost_rateclass = deletepost_rateclass; 
module.exports.addcomment_rateclass = addcomment_rateclass; 
module.exports.deletecomment_rateclass = deletecomment_rateclass;