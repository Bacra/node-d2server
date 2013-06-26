var data = {
	'log': [],
	'warn': [],
	'error': [],
	'titles': []
};

var build = function(color, type){
	return function(tit, cont, file){
		var line = {
			'title': tit,
			'content': cont,
			'file': file,
			'timestamp': new Date().getTime()
		};
		data[type].push(line);
		
		process.stdout.write(color+'['+tit+']\x1B[0m '+cont+(file ? '\t\t'+file : '')+'\n');
	};
};


module.exports = {
	'data': data,
	'log': build("\x1B[32m", 'log'),
	'warn': build("\x1B[33m", 'warn'),
	'error': build("\x1B[1;31m", 'error')
};