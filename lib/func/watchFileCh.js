var notice = require('./notice.js'),
	fs = require('fs');


// 如果有定义removeFunc 非change事件时，会运行removeFunc，否则运行change事件
// 如果有定义removeFunc error时，会先运行removeFunc，然后再运行errorFunc
module.exports = function(file, changeFunc, removeFunc, errorFunc) {
	var chWaitTime,
		watch = fs.watch(file).on('change', function(e){
				if (e != 'change') {
					if (removeFunc) {
						removeFunc(e, watch);
						return;
					} else {
						if (e == 'rename') {
							notice.warn('Watch', 'file rename', file);
						} else {
							notice.error('Watch', 'undefined Event:'+e, file);
						}
					}
				}


				if (chWaitTime) clearTimeout(chWaitTime);
				chWaitTime = setTimeout(function(){
					chWaitTime = null;
					notice.log('Watch', 'file change', file);
					changeFunc();
				}, 600);
			}).on('error', function(err){
				if (removeFunc) removeFunc('error', watch);
				if (errorFunc) {
					errorFunc(err, watch);
				} else {
					notice.error('Watch', err, file);
				}
			});

	return watch;
};