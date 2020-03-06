/**
 * @description 서버 포트, db 주소, 라우팅 정보 등록 (요청 패스를 통해 이를 처리 가능한 함수로 기능을 전달) 
 * @author Chang Hee
 */

require('dotenv').config();

module.exports = {
	server_port: 3000,
	db_url: process.env.db_url,
        
        db_schemas: [ 
                {file:'./user_schema', collection:'users', schemaName:'userSchema', modelName:'UserModel'} 
                ,{file:'./report_schema', collection:'reports', schemaName:'reportSchema', modelName:'ReportModel'} 
                ,{file: './courseEvaluation_schema', collection: 'courseEvaluations', schemaName: 'courseEvaluationSchema', modelName: 'CourseEvaluationModel'} 
                ,{file: './professor_schema', collection: 'professors', schemaName: 'ProfessorSchema', modelName: 'ProfessorModel'}
                ,{file: './eventCalendar_schema', collection: 'eventCalendars', schemaName: 'eventCalendarSchema', modelName: 'EventCalendarModel'} 
                ,{file: './eventCalendarRequest_schema', collection: 'eventCalendarrequests', schemaName: 'eventCalendarRequestSchema', modelName: 'EventCalendarRequestModel'}
                ,{file: './notification_schema', collection: 'notifications', schemaName: 'notificationSchema', modelName: 'NotificationModel'} 
                ,{file:'./bulletinBoardList_schema', collection:'bulletinBoardlists', schemaName:'bulletinBoardListSchema', modelName:'BulletinBoardListModel'} 
                ,{file:'./board_schema', collection:'board1', schemaName:'board1Schema', modelName:'BoardModel'} 
                ,{file:'./board_schema', collection:'board2', schemaName:'board2Schema', modelName:'BoardModel'}  
                ,{file:'./board_schema', collection:'mainboards', schemaName:'mainBoardSchema', modelName:'BoardModel'}               
        ], 

        // RESTful 방식에 맞게 path naming을 할까 생각했다. 
        // 하지만 method 이름은 동사명인데, path 이름은 명사형으로 작성해야 하므로 보수 및 확장에 큰 어려움이 생길 것으로 예상된다. 
        // 따라서 2020/03/06 현재 path 이름을 작성할 때 아래와 같은 기준을 적용한다. 
        // 1. path의 가장 앞에는 파일명을 적고 하위에 method 명을 소문자로 적는다. ex. users/deleteaccount 
        // 2. HTTP method는 전부 post 로 작성한다. (RESTful 방식과 다르므로 method를 달리 쓰는 것이 무의미하다고 생각함)   
	route_info: [
                //계정, 사용자 정보와 관련된 패스들   
                {file:'./users', path:'/users/signup', method:'signUp', type:'post'}
                ,{file:'./users', path:'/users/login', method:'logIn', type:'post'}
                ,{file:'./users', path:'/users/checknicknm', method:'checkNickNm', type:'post'} 
                ,{file:'./users', path:'/users/checkverified', method:'checkVerified', type:'post'}
                ,{file:'./users', path:'/users/deleteaccount', method:'deleteAccount', type:'post'} 
                ,{file:'./users', path:'/users/getcurrentusername', method:'getCurrentUserName', type:'post'}
                
                //DM과 관련된 패스들
                ,{file:'./users', path:'/users/senddm', method:'sendDM', type:'post'} 
                ,{file:'./users', path:'/users/showusernamelist', method:'showUserNameList', type:'post'} 
                ,{file:'./users', path:'/users/deletedm', method:'deleteDM', type:'post'}
                ,{file:'./users', path:'/users/showdmlist', method:'showDMList', type:'post'} 
                
                //BulluetinBoards와 관련된 패스들
                ,{file:'./bulletinBoards', path:'/bulletinboards/showbulletinboardslist', method:'showBulletinBoardsList', type:'post'}
                ,{file:'./bulletinBoards', path:'/bulletinboards/addreport', method:'addReport', type:'post'}
                ,{file:'./bulletinBoards', path:'/bulletinboards/showbulletinboard', method:'showBulletinBoard', type:'post'} 
                ,{file:'./bulletinBoards', path:'/bulletinboards/addeditentry', method:'addEditEntry', type:'post'}
                ,{file:'./bulletinBoards', path:'/bulletinboards/deleteentry', method:'deleteEntry', type:'post'}
                ,{file:'./bulletinBoards', path:'/bulletinboards/fliplikeentry', method:'flipLikeEntry', type:'post'} 
                ,{file:'./bulletinBoards', path:'/bulletinboards/showcomments', method:'showComments', type:'post'}
                ,{file:'./bulletinBoards', path:'/bulletinboards/addcomment', method:'addComment', type:'post'}
                ,{file:'./bulletinBoards', path:'/bulletinboards/editcomment', method:'editComment', type:'post'}
                ,{file:'./bulletinBoards', path:'/bulletinboards/deletecomment', method:'deleteComment', type:'post'} 
                ,{file:'./bulletinBoards', path:'/bulletinboards/fliplikecomment', method:'flipLikeComment', type:'post'}
                
                //courseEvaluation과 관련된 패스들 
                ,{file:'./courseEvaluations', path:'/courseEvaluations/showcourseslist', method:'showCoursesList', type:'post'}
                ,{file:'./courseEvaluations', path:'/courseEvaluations/showcommentslist', method:'showCommentsList', type:'post'}
                ,{file:'./courseEvaluations', path:'/courseEvaluations/addcomment', method:'addComment', type:'post'}
                ,{file:'./courseEvaluations', path:'/courseEvaluations/editcomment', method:'editComment', type:'post'}
                ,{file:'./courseEvaluations', path:'/courseEvaluations/deletecomment', method:'deleteComment', type:'post'}
                ,{file:'./courseEvaluations', path:'/courseEvaluations/increlikecomment', method:'increLikeComment', type:'post'}
                ,{file:'./courseEvaluations', path:'/courseEvaluations/decrelikecomment', method:'decreLikeComment', type: 'post'}
                ,{file:'./courseEvaluations', path:'/courseEvaluations/showprofessorprofile', method:'showProfessorProfile', type:'post'} 
                
                //notification과 관련된 패스들 
                ,{file:'./notifications', path:'/notifications/crawldata', method:'crawlData', type:'post'}
                ,{file:'./notifications', path:'/notifications/deleteolddata', method:'deleteOldData', type:'post'}
                ,{file:'./notifications', path:'/notifications/translatedata', method:'translateData', type:'post'}
                ,{file:'./notifications', path:'/notifications/shownotification', method:'showNotification', type:'post'}
                
                //eventCalendar과 관련된 패스들
                ,{file:'./eventCalendars', path:'/eventcalendars/showeventslist', method:'showEventsList', type:'post'}
                ,{file:'./eventCalendars', path:'/eventcalendars/addevent', method:'addEvent', type:'post'}
                ,{file:'./eventCalendars', path:'/eventcalendars/editevent', method:'editEvent', type:'post'}
                ,{file:'./eventCalendars', path:'/eventcalendars/deleteevent', method:'deleteEvent', type:'post'}
                
                //eventCalendarRequest와 관련된 패스들
                ,{file:'./eventCalendarRequests', path:'/eventcalendarrequests/showeventslist', method:'showEventsList', type:'post'}
                ,{file:'./eventCalendarRequests', path:'/eventcalendarrequests/addevent', method:'addEvent', type:'post'}
                ,{file:'./eventCalendarRequests', path:'/eventcalendarrequests/editevent', method:'editEvent', type:'post'}
                ,{file:'./eventCalendarRequests', path:'/eventcalendarrequests/deleteevent', method:'deleteEvent', type:'post'}
                ,{file:'./eventCalendarRequests', path:'/eventcalendarrequests/checkandmoverequests', method:'checkAndMoveRequests', type:'post'}
                ,{file:'./eventCalendarRequests', path:'/eventcalendarrequests/movetoeventcalendar', method:'moveToEventCalendar', type:'post'}
        ],      
};  

