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
var jwt = require('jsonwebtoken');

var addpost = function(req, res) {
	console.log('post 모듈 안에 있는 addpost 호출됨.');
    
    
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
			// PostModel 인스턴스 생성
			var post = new database.PostModel({
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
        return res.redirect('/process/showpost/' + post._id); 
        })
        
    	
	} else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	}
	
}; //addpost 닫기

/*
var editpost = function(req, res) { //유효 사용자인지 확인 후 edit.ejs 호출
	console.log('post 모듈 안에 있는 editpost 호출됨.');
  
    // URL 파라미터로 전달됨
    var paramId = req.body.id || req.query.id || req.params.id;
    var database = req.app.get('database');
	
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
		// 1. 글 리스트
		database.PostModel.load(paramId, function(err, results) {
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
                    res.redirect("/process/community");
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
}; // editpost 닫기  

var saveeditedpost = function(req, res) { //editpost.ejs 에서 작성한 내용을 기존 document에 옮기는 과정.
	console.log('post 모듈 안에 있는 saveeditedpost 호출됨.');
        
    var paramTitle = req.body.title || req.query.title;
    var paramContents = req.body.contents || req.query.contents;  
    var paramId = req.body.id || req.query.id || req.params.id;
    
    var database = req.app.get('database');
    
    console.log('요청 파라미터 : ' + paramTitle + ', ' + paramContents + ', ' + paramId);
	
	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
            
            database.PostModel.load(paramId,function(err,result){ 
                if(err){
                    console.error('게시판 글 조회 중 에러 발생 : ' + err.stack);
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>수정 대상 글 조회 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return;
                } 
                database.PostModel.findOneAndUpdate({_id: paramId}, 
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
                   
                    return res.redirect('/process/showpost/' + result.id);  
                }) 
            });
    } else {
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }
}; //saveeditedpost 닫기 
*/


var deletepost = function(req, res) {  // 유효 사용자 확인 후 선택한 포스트 삭제
	console.log('post 모듈 안에 있는 deletepost 호출됨.');
  
    // URL 파라미터로 전달됨
    var paramId = req.body.id || req.query.id || req.params.id;
    var database = req.app.get('database');
	
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
		// 1. 글 리스트
		database.PostModel.load(paramId, function(err, results) {
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
				if( expressSession.nickNm != results._doc.writer.nickNm && expressSession.isadmin == false ){
                    console.log("다른 사람의 게시물 삭제 시도"); 
                    alert("다른 사람의 게시물 삭제 시도");
                    res.redirect("/process/community");
                } 
               database.PostModel.deleteOne({_id: paramId}, function(err, results){
               if (err) {
                    console.error('삭제 과정 중 에러 발생 : ' + err.stack);
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>삭제 과정 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return res.redirect("/process/community");
               }		
			     })
		    };
	    })  
        return res.redirect("/process/community");
    }else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	   }    
}; //deletepost 닫기 

var addcomment = function(req, res) {
	console.log('post 모듈 안에 있는 addcomment 호출됨.');
    var paramId = req.body.id || req.query.id || req.param.id;
    var paramContents = req.body.contents || req.query.contents;
    var paramWriter = expressSession.nickNm; 
    //var paramWriter = req.body.writer || req.query.writer;
	
    console.log('요청 파라미터 : ', paramContents + ', ' + paramWriter + ', ' + paramId);
    
	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        
        database.PostModel.findByIdAndUpdate(paramId,
            {'$push': {'comments':{'contents':paramContents, 'writer':paramWriter}}},
            {'new':true},function(err,result){
            
        if (err) {
                console.error('댓글 검색 과정 중 에러 발생 : ' + err.stack);
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>댓글 검색 과정 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
                res.end();
                return res.redirect("/process/community");
           }
            console.log("댓글 추가 완료");
            console.log("댓글 추가 후 comment의 길이: ", result._doc.comments.length);
            return res.redirect('/process/showpost/' + paramId); 
        }); 
        } else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
        } 	 
}; //addcomment 닫기

var deletecomment = function(req, res){
    console.log('post 모듈 안에 있는 deletecomment 호출됨.');
    var paramId = req.param.id || req.body.id || req.query.id;   
    var postId = req.body.postid || req.query.postid || req.param.postid;
    
    console.log('요청 파라미터 : ', paramId + ", ", postId);
    
	var database = req.app.get('database');

	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
        database.PostModel.findOne( {_id: postId}, function(err,result){
            if (err) {
                console.error('삭제할 댓글이 있는 게시물 조회 과정 중 에러 발생 : ' + err.stack);
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>삭제할 댓글이 있는 게시물 조회 과정 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
                res.end();
                return res.redirect("/process/community");
           } 
            if(result){
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
                        return res.redirect("/process/showpost/"+postId); 
                        } 
                database.PostModel.findByIdAndUpdate(postId,
                    {'$pull': { 'comments': {'_id': paramId}}},function(err,comment){
                    if (err) {
                            console.error('댓글 삭제 과정 중 에러 발생 : ' + err.stack);
                            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                            res.write('<h2>댓글 삭제 과정 중 에러 발생</h2>');
                            res.write('<p>' + err.stack + '</p>');
                            res.end(); 
                            //here 안 뜸
                            return res.redirect("/process/community");
                       }  
                     
                    //here 안 뜸
                    console.log("댓글 삭제 완료");
                    return res.redirect('/process/showpost/' + postId); 
                    })   
            } 
        })
    } else {
    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
    res.write('<h2>데이터베이스 연결 실패</h2>');
    res.end();
    } 
    
}; //deletecomment 닫기  

//-------------------react native 와 연동---------------------------------------  

//게시물 목록 보여주기
var listpost = function(req, res) {
	console.log('post 모듈 안에 있는 listpost 호출됨.');
    
    var database = req.app.get('database');
    function connectDB() {
    var databaseUrl = exports.config.db_url;
    var mongoose = require('mongoose');
    MongoClient.connect(databaseUrl, function(err, database) {
        if(err) throw err;
         var db = client.db('communities'); // 어떤 컬렉션에서 받을 지 선택하는 듯
        console.log('데이터베이스에 연결됨: '+databaseUrl);
    });
    }
      
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) { 
		// 1. 글 리스트
		
		var paramCommunitySearchValue = req.body.communitysearchvalue || req.query.communitysearchvalue|| " ";
        var paramCommunitySearchSelect = req.body.communitysearchselect || req.query.communitysearchselect||" ";  
        if(paramCommunitySearchValue != " ")
            {    
                var query = {title: new RegExp(".*"+paramCommunitySearchValue+".*")};  
            }
        else{
            var query = { };
        }  
        // 만족하는 문서 갯수 확인 
        database.PostModel.find(query, function(err, cursor, options){
            if(err){ console.error('게시판 글 목록 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>게시판 글 목록 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return; 
            }  
            var count = cursor.length; //results: Object -> Array 변환 후 길이 구함    
            
            var context = {
						posts: cursor,
						pageCount: count,
					};   
            res.send(context); 
            return;
        }).populate('writer', 'nickNm loginId').sort({'created_at': -1});
    }//if(database.db) 닫기
     
    else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	} 
}; //listpost 닫기    


// 1개의 게시물의 내용을 보여 줌
var showpost = function(req, res) {
	console.log('post 모듈 안에 있는 showpost 호출됨.');
  
    // URL 파라미터로 전달됨
    var paramId = req.params.id || req.body.id || req.query.id;
	
    var database = req.app.get('database');
    
    console.log('showpost 요청 파라미터 : ' + paramId);
	
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
		// 1. 글 리스트
		database.PostModel.load(paramId, function(err, results){
			if (err) { 
                console.error('게시판 글 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>게시판 글 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                
                return;
            } 
            if (results) {
  
                // 조회수 업데이트
                console.log('trying to update hits.');
                
                database.PostModel.incrHits(results._doc._id, function(err2, results2) {
                    console.log('incrHits executed.');
                    
                    if (err2) {
                        console.log('incrHits 실행 중 에러 발생.');
                        console.dir(err2);
                        return;
                        
                    }
                });   
				var context = {
					posts: results,
                }; 
			    res.send(context)  
                return;
			} else {
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>글 조회 실패</h2>');
				return;
			 }
		})
	} else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		return;
	}
}; // showpost 닫기 

//사용자가 요청한 게시물이 해당 사용자가 편집할 수 있는 게시물인지의 여부를 체크 

var checkeditablepost = function(req, res) { //유효 사용자인지 확인 후 edit.ejs 호출
	console.log('post 모듈 안에 있는 checkeditablepost 호출됨.');
  
    // parampostid: 게시물의 ObjectId  
    // paramjwt: 요청한 사용자의 jwt 
    // secret: paramjwt decode 위해서 선언  
    // paramnickNm: paramjwt를 verify해서 얻은 nickNm. 요청한 사용자의 nickNm
    
    var parampostid = req.body.postid || req.query.postid || req.params.postid; 
    var paramjwt = req.body.jwt || req.query.jwt || req.params.jwt; 
    var secret = "HS256";
    var paramnickNm = jwt.verify(paramjwt,secret).nickNm;  
    
    var database = req.app.get('database'); 
    
    console.log("요청 파라미터: parampostid: ",parampostid , " , ", "paramnickNm: ",paramnickNm)
    
    // 데이터베이스 객체가 초기화된 경우
	if (database.db) {
		// 1. 글 리스트
		database.PostModel.load(parampostid, function(err, result) {
			if (err) {
                console.error('게시판 글 조회 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>수정 대상 글 조회 중 에러 발생</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                return;
            } 
            if (result) {
			     
                //paramnickNm을 기반으로 user의 ObjectId 찾기
                database.UserModel.findOne({nickNm: paramnickNm}, function(err, user) {
                    if (err) {
                        console.error('사용자 조회 중 에러 발생 : ' + err.stack);

                        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                        res.write('<h2>사용자 조회 중 에러 발생</h2>');
                        res.write('<p>' + err.stack + '</p>');
                        res.end();
                        return;
                    } 
                    if(user == null){
                        console.log("요청 받은 nickNm이 없음"); 
                        res.end();      
                        return;
                    }   
                    else{  
                        console.log("user._id: ",user._id); 
                        console.log("result.writer._id",result.writer._id);
                        var context = {
                            ismine: user._id.equals(result.writer._id),
				        };
                        res.send(context); 
                        return;     
                    }
                })//UserModel.findOne 닫기 
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
}; // checkeditablepost 닫기  

var saveeditedpost = function(req, res) { //editpost.ejs 에서 작성한 내용을 기존 document에 옮기는 과정.
	console.log('post 모듈 안에 있는 saveeditedpost 호출됨.');
        
    var paramTitle = req.body.title || req.query.title;
    var paramContents = req.body.contents || req.query.contents;  
    var paramId = req.body.id || req.query.id || req.params.id;
    
    var database = req.app.get('database');
    
    console.log('요청 파라미터 : ' + paramTitle + ', ' + paramContents + ', ' + paramId);
	
	// 데이터베이스 객체가 초기화된 경우
	if (database.db) {
            
            database.PostModel.load(paramId,function(err,result){ 
                if(err){
                    console.error('게시판 글 조회 중 에러 발생 : ' + err.stack);
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write('<h2>수정 대상 글 조회 중 에러 발생</h2>');
                    res.write('<p>' + err.stack + '</p>');
                    res.end();
                    return;
                } 
                database.PostModel.findOneAndUpdate({_id: paramId}, 
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
                   
                    return res.redirect('/process/showpost/' + result.id);  
                }) 
            });
    } else {
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }
}; //saveeditedpost 닫기 


module.exports.listpost = listpost;
module.exports.addpost = addpost;
module.exports.showpost = showpost; 
module.exports.checkeditablepost = checkeditablepost;  
module.exports.saveeditedpost = saveeditedpost;
module.exports.deletepost = deletepost; 
module.exports.addcomment = addcomment; 
module.exports.deletecomment = deletecomment;