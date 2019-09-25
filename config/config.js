
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
         {file:'./user', path:'/process/user/checknickNm', method:'checknickNm', type:'post'} 
        ,{file:'./user', path:'/process/user/getuserid', method:'getuserid', type:'post'}
        ,{file:'./user', path:'/process/user/SendDM', method:'SendDM', type:'post'} 
        ,{file:'./user', path:'/process/user/ShowUserNameList', method:'ShowUserNameList', type:'post'} 
        ,{file:'./user', path:'/process/user/DeleteDM', method:'DeleteDM', type:'post'}
        ,{file:'./user', path:'/process/user/ShowDMList', method:'ShowDMList', type:'post'}

        //BulluetinBoards와 관련된 패스들
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/ShowBulletinBoardsList', method:'ShowBulletinBoardsList', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/AddReport', method:'AddReport', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/ShowBulletinBoard', method:'ShowBulletinBoard', type:'post'} 
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/AddEditEntry', method:'AddEditEntry', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/DeleteEntry', method:'DeleteEntry', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/IncreLikeEntry', method:'IncreLikeEntry', type:'post'} 
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/DecreLikeEntry', method:'DecreLikeEntry', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/ShowComments', method:'ShowComments', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/AddComment', method:'AddComment', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/EditComment', method:'EditComment', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/DeleteComment', method:'DeleteComment', type:'post'} 
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/IncreLikeComment', method:'IncreLikeComment', type:'post'}
        ,{file:'./BulletinBoards', path:'/process/BulletinBoards/DecreLikeComment', method:'DecreLikeComment', type:'post'} 

        //CourseEvaluation과 관련된 패스들 
        ,{file:'./CourseEvaluation', path:'/process/CourseEvaluation/ShowCoursesList', method:'ShowCoursesList', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/CourseEvaluation/ShowCommentsList', method:'ShowCommentsList', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/CourseEvaluation/AddComment', method:'AddComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/CourseEvaluation/EditComment', method:'EditComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/CourseEvaluation/DeleteComment', method:'DeleteComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/CourseEvaluation/IncreLikeComment', method:'IncreLikeComment', type:'post'}
        ,{file:'./CourseEvaluation', path:'/process/CourseEvaluation/DecreLikeComment', method:'DecreLikeComment', type: 'post'}
        ,{file:'./CourseEvaluation', path:'/process/CourseEvaluation/ShowProfessorProfile', method:'ShowProfessorProfile', type:'post'} 
        
        //Notification과 관련된 패스들 
        ,{file:'./Notification', path:'/process/Notification/CrawlData', method:'CrawlData', type:'post'}
        ,{file:'./Notification', path:'/process/Notification/Translate_en', method:'Translate_en', type:'post'}
        ,{file:'./Notification', path:'/process/Notification/Translate_zh', method:'Translate_zh', type:'post'}
        ,{file:'./Notification', path:'/process/Notification/ShowNotification', method:'ShowNotification', type:'post'}
],      
};  

