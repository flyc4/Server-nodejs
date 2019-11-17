
/*
 * 설정. 에러 처리 포함
 */

module.exports = {
	server_port: 3000,
	db_url: "mongodb+srv://test:test@cluster0-inakp.mongodb.net/db?retryWrites=true&w=majority",
	db_schemas: [
        {file:'./user_schema', collection:'users', schemaName:'UserSchema', modelName:'UserModel'} 
        ,{file:'./Report_schema', collection:'reports', schemaName:'ReportSchema', modelName:'ReportModel'} 
        ,{file: './CourseEvaluation_schema', collection: 'courseevaluations', schemaName: 'CourseEvaluationSchema', modelName: 'CourseEvaluationModel'} 
        ,{file: './Professor_schema', collection: 'professors', schemaName: 'ProfessorSchema', modelName: 'ProfessorModel'}
        ,{file: './EventCalendar_schema', collection: 'eventcalendars', schemaName: 'EventCalendarSchema', modelName: 'EventCalendarModel'} 
        ,{file: './EventCalendarRequest_schema', collection: 'eventcalendarrequests', schemaName: 'EventCalendarRequestSchema', modelName: 'EventCalendarRequestModel'}
        ,{file: './Notification_schema', collection: 'notifications', schemaName: 'NotificationSchema', modelName: 'NotificationModel'} 
        ,{file:'./BulletinBoardsList_schema', collection:'bulletinboardslists', schemaName:'BulletinBoardsListSchema', modelName:'BulletinBoardsListModel'} 
        ,{file:'./Board1_schema', collection:'board1', schemaName:'Board1Schema', modelName:'Board1Model'} 
        ,{file:'./Board2_schema', collection:'board2', schemaName:'Board2Schema', modelName:'Board2Model'}  
        ,{file:'./MainBoard_schema', collection:'mainboards', schemaName:'MainBoardSchema', modelName:'MainBoardModel'}               
        ],
	route_info: [
        //user 혹은 인증과 관련된 패스들
         {file:'./user', path:'/user/checknickNm', method:'checknickNm', type:'post'} 
        ,{file:'./user', path:'/user/getuserid', method:'getuserid', type:'post'}
        ,{file:'./user', path:'/user/SendDM', method:'SendDM', type:'post'} 
        ,{file:'./user', path:'/user/ShowUserNameList', method:'ShowUserNameList', type:'post'} 
        ,{file:'./user', path:'/user/DeleteDM', method:'DeleteDM', type:'post'}
        ,{file:'./user', path:'/user/ShowDMList', method:'ShowDMList', type:'post'}

        //BulluetinBoards와 관련된 패스들
        ,{file:'./BulletinBoards', path:'/BulletinBoards/ShowBulletinBoardsList', method:'ShowBulletinBoardsList', type:'post'}
        ,{file:'./BulletinBoards', path:'/BulletinBoards/AddReport', method:'AddReport', type:'post'}
        ,{file:'./BulletinBoards', path:'/BulletinBoards/ShowBulletinBoard', method:'ShowBulletinBoard', type:'post'} 
        ,{file:'./BulletinBoards', path:'/BulletinBoards/AddEditEntry', method:'AddEditEntry', type:'post'}
        ,{file:'./BulletinBoards', path:'/BulletinBoards/DeleteEntry', method:'DeleteEntry', type:'post'}
        ,{file:'./BulletinBoards', path:'/BulletinBoards/FlipLikeEntry', method:'FlipLikeEntry', type:'post'} 
        ,{file:'./BulletinBoards', path:'/BulletinBoards/ShowComments', method:'ShowComments', type:'post'}
        ,{file:'./BulletinBoards', path:'/BulletinBoards/AddComment', method:'AddComment', type:'post'}
        ,{file:'./BulletinBoards', path:'/BulletinBoards/EditComment', method:'EditComment', type:'post'}
        ,{file:'./BulletinBoards', path:'/BulletinBoards/DeleteComment', method:'DeleteComment', type:'post'} 
        ,{file:'./BulletinBoards', path:'/BulletinBoards/FlipLikeComment', method:'FlipLikeComment', type:'post'}
        //Add Dummy 
        ,{file:'./BulletinBoards', path:'/BulletinBoards/AddDummy', method:'AddDummy', type:'post'}
        


        //CourseEvaluation과 관련된 패스들 
        ,{file:'./CourseEvaluation', path:'/CourseEvaluation/ShowCoursesList', method:'ShowCoursesList', type:'post'}
        ,{file:'./CourseEvaluation', path:'/CourseEvaluation/ShowCommentsList', method:'ShowCommentsList', type:'post'}
        ,{file:'./CourseEvaluation', path:'/CourseEvaluation/AddComment', method:'AddComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/CourseEvaluation/EditComment', method:'EditComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/CourseEvaluation/DeleteComment', method:'DeleteComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/CourseEvaluation/IncreLikeComment', method:'IncreLikeComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/CourseEvaluation/DecreLikeComment', method:'DecreLikeComment', type: 'post'}
        ,{file:'./CourseEvaluation', path:'/CourseEvaluation/ShowProfessorProfile', method:'ShowProfessorProfile', type:'post'} 
        
        //Notification과 관련된 패스들 
        ,{file:'./Notification', path:'/Notification/CrawlData', method:'CrawlData', type:'post'}
        ,{file:'./Notification', path:'/Notification/UpdateCrawlData', method:'UpdateCrawlData', type:'post'}
        ,{file:'./Notification', path:'/Notification/Translate_en', method:'Translate_en', type:'post'}
        ,{file:'./Notification', path:'/Notification/Translate_zh', method:'Translate_zh', type:'post'}
        ,{file:'./Notification', path:'/Notification/ShowNotification', method:'ShowNotification', type:'post'}
        
        //EventCalendar과 관련된 패스들
        ,{file:'./EventCalendar', path:'/EventCalendar/ShowEventsList', method:'ShowEventsList', type:'post'}
        ,{file:'./EventCalendar', path:'/EventCalendar/AddEvent', method:'AddEvent', type:'post'}
        ,{file:'./EventCalendar', path:'/EventCalendar/EditEvent', method:'EditEvent', type:'post'}
        ,{file:'./EventCalendar', path:'/EventCalendar/DeleteEvent', method:'DeleteEvent', type:'post'}
        
        //EventCalendarRequest와 관련된 패스들
        ,{file:'./EventCalendarRequest', path:'/EventCalendarRequest/ShowEventsList', method:'ShowEventsList', type:'post'}
        ,{file:'./EventCalendarRequest', path:'/EventCalendarRequest/AddEvent', method:'AddEvent', type:'post'}
        ,{file:'./EventCalendarRequest', path:'/EventCalendarRequest/EditEvent', method:'EditEvent', type:'post'}
        ,{file:'./EventCalendarRequest', path:'/EventCalendarRequest/DeleteEvent', method:'DeleteEvent', type:'post'}
        ,{file:'./EventCalendarRequest', path:'/EventCalendarRequest/CheckRequests', method:'CheckRequests', type:'post'}
        ,{file:'./EventCalendarRequest', path:'/EventCalendarRequest/MoveToEventCalendar', method:'MoveToEventCalendar', type:'post'}
],      
};  

