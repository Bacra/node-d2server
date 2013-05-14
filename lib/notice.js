module.exports = function(log, stdout){
	log.log = {};
	log.warn = {};
	log.error = {};
	log.titles = [];

	var build = function(color, type){
			return function(tit, cont, file){
				var data = {
					'title': tit,
					'content': cont,
					'file': file,
					'timestamp': new Date().getTime()
				};
				if (!log[type][tit]) {
					log.titles.push(tit);
					log[type][tit] = [];
				}
				log[type][tit].push(data);
				
				if (stdout) process.stdout.write(color+'['+tit+']\x1B[0m '+cont+(file ? '\t\t'+file : '\n'));
			};
		};

	return {
		'log': build("\x1B[32m", 'log'),
		'warn': build("\x1B[33m", 'warn'),
		'error': build("\x1B[1;31m", 'error')
	};
};