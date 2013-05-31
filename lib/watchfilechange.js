var notice = require('./notice.js'),
	fs = require('fs');

module.exports = function(file, changeFunc, removeFunc, errorFunc) {
	var chWaitTime,
		watch = fs.watch(file).on('change', function(e){
				if (e == 'change') {
					if (chWaitTime) {
						clearTimeout(chWaitTime);
						chWaitTime = null;
					}
					chWaitTime = setTimeout(function(){
						chWaitTime = null;
						notice.log('Watch', 'file change', file);
						changeFunc();
					}, 600);
				} else {
					watch.close();

					if (e == 'rename') {
						notice.warn('Watch', 'file rename', file);
					} else {
						notice.error('Watch', 'undefined Event:'+e, file);
					}

					if (removeFunc) removeFunc(e);
				}
			}).on('error', function(err){
				notice.error('Watch', err, file);
				if (errorFunc) errorFunc(err);
			});

	return watch;
};