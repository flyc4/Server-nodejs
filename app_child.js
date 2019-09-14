var forever = require('forever-monitor');



var child = new (forever.Monitor)('app.js',{
	max: 3, 
	slient: false, 
	args: [], 
	
	'minUptime': 2000,     
    'spinSleepTime': 1000, 
}); 

child.on('exit', function(){
	console.log('app.js가 3 번의 재 시작 후에 종료 되었습니다.')
}) 
for(var i=0;i<1;i++){
child.start() 
}