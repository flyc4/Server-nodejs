
/*
 * 설정
 */

module.exports = {
	server_port: 3000,
	db_url: 'mongodb://localhost:27017/local',
	db_schemas: [
        {file:'./user_schema', collection:'users', schemaName:'UserSchema', modelName:'UserModel'}
        ,{file:'./post_schema', collection:'communities', schemaName:'PostSchema', modelName:'PostModel'}  
        ,{file:'./rateclass_schema', collection:'rateclasses', schemaName:'RateClassSchema', modelName:'RateClassModel'} 
        ,{file:'./timetable_schema', collection:'timetables', schemaName:'TimetableSchema', modelName:'TimetableModel'}
	],
	route_info: [
        //user 혹은 인증과 관련된 패스들
        {file:'./user', path:'/process/checknickNm', method:'checknickNm', type:'post'} 
        ,{file:'./user', path:'/process/getuserid', method:'getuserid', type:'post'}
        
        //community(게시판)와 관련된 패스 들 
        ,{file:'./post', path:'/process/addpost', method:'addpost', type:'post'} 
        ,{file:'./post', path:'/process/showpost', method:'showpost', type:'post'} 
        ,{file:'./post', path:'/process/community', method:'listpost', type:'post'}
        ,{file:'./post', path:'/process/checkeditablepost', method:'checkeditablepost', type:'post'}
        ,{file:'./post', path:'/process/editpost', method:'editpost', type:'post'} 
        ,{file:'./post', path:'/process/deletepost', method:'deletepost', type:'post'} 
        ,{file:'./post', path:'/process/addcomment', method:'addcomment', type:'post'} 
        ,{file:'./post', path:'/process/deletecomment', method:'deletecomment', type:'post'} 
        
        //rateclass(강의평가)와 관련된 패스들 
        ,{file:'./rateclass', path:'/process/addpost_rateclass', method:'addpost_rateclass', type:'post'} 
        ,{file:'./rateclass', path:'/process/showpost_rateclass/:id', method:'showpost_rateclass', type:'get'}
        ,{file:'./rateclass', path:'/process/rateclass', method:'listpost_rateclass', type:'get'}  
        ,{file:'./rateclass', path:'/process/rateclass', method:'listpost_rateclass', type:'post'}
        ,{file:'./rateclass', path:'/process/editpost_rateclass/:id', method:'editpost_rateclass', type:'get'}
        ,{file:'./rateclass', path:'/process/saveeditedpost_rateclass/:id', method:'saveeditedpost_rateclass', type:'post'} 
        ,{file:'./rateclass', path:'/process/deletepost_rateclass/:id', method:'deletepost_rateclass', type:'get'} 
        ,{file:'./rateclass', path:'/process/addcomment_rateclass', method:'addcomment_rateclass', type:'post'} 
        ,{file:'./rateclass', path:'/process/deletecomment_rateclass', method:'deletecomment_rateclass', type:'post'}   
        
        //timetable(시간표)과 관련된 패스들  
        ,{file:'./timetable', path:'/process/checkdefaulttimetable', method:'checkdefaulttimetable', type:'post'}
        ,{file:'./timetable', path:'/process/addtimetable', method:'addtimetable', type:'get'}
        ,{file:'./timetable', path:'/process/showdefaulttimetable', method:'showdefaulttimetable', type:'get'} 
        ,{file:'./timetable', path:'/process/showtimetable', method:'showtimetable', type:'post'} 
        //listtimetable가 파라미터로 받는 id는 user의 id다
        ,{file:'./timetable', path:'/process/listtimetable/:id', method:'listtimetable', type:'get'}
        ,{file:'./timetable', path:'/process/listtimetable/:id', method:'listtimetable', type:'post'} 
        ,{file:'./timetable', path:'/process/setdefaultview', method:'setdefaultview', type:'post'}
        ,{file:'./timetable', path:'/process/unsetdefaultview', method:'unsetdefaultview', type:'post'}
        ,{file:'./timetable', path:'/process/deletetimetable/:id', method:'deletetimetable', type:'post'} 
        ,{file:'./timetable', path:'/process/addcourse', method:'addcourse', type:'post'} 
        ,{file:'./timetable', path:'/process/deletecourse', method:'deletecourse', type:'post'}
    ], 
}