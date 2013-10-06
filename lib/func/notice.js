var data = {
	'log': [],
	'warn': [],
	'error': [],
	'info': []
};

var build = function(color, type){
	return function(tit, msg, content){
		var line = {
			'title': tit,
			'msg': msg,
			'content': content,
			'timestamp': new Date().getTime()
		};
		data[type].push(line);
		
		process.stdout.write(color+'['+tit+']\x1B[0m '+msg+'\n');
	};
};


module.exports = {
	'data': data,
	'log': build("\x1B[32m", 'log'),
	'warn': build("\x1B[33m", 'warn'),
	'error': build("\x1B[1;31m", 'error'),
	'info': build("\x1B[32m", 'info'),
	'title': function(tit, msg){
		process.stdout.write('\x1B[33m['+tit+']\x1B[0m '+msg+'\n');
	}
};