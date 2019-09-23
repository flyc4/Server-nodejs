
/*
 * 설정. 에러 처리 포함
 */

module.exports = {
	server_port: 3000,
	db_url: 'mongodb://localhost:27017/local',
	db_schemas: [
        {file:'./user_schema', collection:'users', schemaName:'UserSchema', modelName:'UserModel'} 
        ,{file:'./Report_schema', collection:'reports', schemaName:'ReportSchema', modelName:'ReportModel'} 
        ,{file: './CourseEvaluation_schema', collection: 'CourseEvaluation', schemaName: 'CourseEvaluationSchema', modelName: 'CourseEvaluationModel'} 
        ,{file: './Professor_schema', collection: 'Professor', schemaName: 'ProfessorSchema', modelName: 'ProfessorModel'}
        ,{file: './Notification_schema', collection: 'Notification', schemaName: 'NotificationSchema', modelName: 'NotificationModel'} 
        ,{file:'./BulletinBoardsList_schema', collection:'BulletinBoardsList', schemaName:'BulletinBoardsListSchema', modelName:'BulletinBoardsListModel'} 
        ,{file:'./Board1_schema', collection:'Board1', schemaName:'Board1Schema', modelName:'Board1Model'} 
        ,{file:'./Board2_schema', collection:'Board2', schemaName:'Board2Schema', modelName:'Board2Model'}  
               
        ],
	route_info: [
        //user 혹은 인증과 관련된 패스들
         {file:'./user', path:'/process/checknickNm', method:'checknickNm', type:'post'} 
        ,{file:'./user', path:'/process/getuserid', method:'getuserid', type:'post'}
        ,{file:'./user', path:'/process/SendDM', method:'SendDM', type:'post'} 
        ,{file:'./user', path:'/process/ShowUserNameList', method:'ShowUserNameList', type:'post'} 
        ,{file:'./user', path:'/process/DeleteDM', method:'DeleteDM', type:'post'}
        ,{file:'./user', path:'/process/ShowDMList', method:'ShowDMList', type:'post'}

        //BulluetinBoards와 관련된 패스들
        ,{file:'./BulletinBoards', path:'/process/ShowBulletinBoardsList', method:'ShowBulletinBoardsList', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/AddReport', method:'AddReport', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/ShowBulletinBoard', method:'ShowBulletinBoard', type:'post'} 
        ,{file:'./BulletinBoards', path:'/process/AddEditEntry', method:'AddEditEntry', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/DeleteEntry', method:'DeleteEntry', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/IncreLikeEntry', method:'IncreLikeEntry', type:'post'} 
        ,{file:'./BulletinBoards', path:'/process/DecreLikeEntry', method:'DecreLikeEntry', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/ShowComments', method:'ShowComments', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/AddComment', method:'AddComment', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/EditComment', method:'EditComment', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/DeleteComment', method:'DeleteComment', type:'post'} 
        ,{file:'./BulletinBoards', path:'/process/IncreLikeComment', method:'IncreLikeComment', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/DecreLikeComment', method:'DecreLikeComment', type:'post'} 

        //CourseEvaluation과 관련된 패스들 
        ,{file:'./CourseEvaluation', path:'/process/ShowCoursesList', method:'ShowCoursesList', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/ShowCommentsList', method:'ShowCommentsList', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/AddCourseEvaluationComment', method:'AddCourseEvaluationComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/EditCourseEvaluationComment', method:'EditCourseEvaluationComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/DeleteCourseEvaluationComment', method:'DeleteCourseEvaluationComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/IncreLikeCourseEvaluationComment', method:'IncreLikeCourseEvaluationComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/DecreLikeCourseEvaluationComment', method:'DecreLikeCourseEvaluationComment', type: 'post'}
        ,{file:'./CourseEvaluation', path:'/process/ShowProfessorProfile', method:'ShowProfessorProfile', type:'post'} 
        
        //Notification과 관련된 패스들 
        ,{file:'./Notification', path:'/process/CrawlNotificationData', method:'CrawlNotificationData', type:'post'}
        ,{file:'./Notification', path:'/process/TranslateNotification_en', method:'TranslateNotification_en', type:'post'}
        ,{file:'./Notification', path:'/process/TranslateNotification_zh', method:'TranslateNotification_zh', type:'post'}
        ,{file:'./Notification', path:'/process/ShowNotification', method:'ShowNotification', type:'post'}
],      
};  

