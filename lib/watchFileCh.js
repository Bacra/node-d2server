var notice = require('./notice.js'),
	fs = require('fs');

module.exports = function(file, changeFunc, removeFunc, errorFunc) {
	var chWaitTime,
		watch = fs.watch(file).on('change', function(e){
				if (e == 'change') {
					if (chWaitTime) return;
					chWaitTime = setTimeout(function(){
						chWaitTime = null;
					}, 300);

					changeFunc();
					notice.log('Watch', 'file change', file);
				} else {
					watch.close();

					if (removeFunc) removeFunc(e);

					if (e == 'rename') {
						notice.warn('Watch', 'file rename', file);
					} else {
						notice.error('Watch', 'undefined Event', file);
					}
				}
			}).on('error', function(err){
				if (errorFunc) errorFunc(err);
				notice.error('Watch', err, file);
			});

	return watch;
};