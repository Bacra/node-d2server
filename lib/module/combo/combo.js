var fs = require('fs'),
	mod = require('../../mod.js'),
	util = mod.util,
	notice = util.notice;

module.exports = {
	'buf': comboBuf,
	'file': comboFile
};


function comboBuf(bufArr, splitStr){
	var arr2 = [];
	if (splitStr) splitStr = new Buffer(splitStr);
	bufArr.forEach(function(buf){
		arr2.push(buf);
		if (splitStr) arr2.push(splitStr);
	});

	if (splitStr && arr2.length) arr2.pop();

	return Buffer.concat(arr2);
}


// 注意：是基于字节的文件合并
function comboFile(arr, splitStr, callback){
	var task = util.task(function(){
			callback(comboBuf(_buf, splitStr));
		}),
		_buf = [];
	
	arr.forEach(function(file, index){
		task.add(function(complete){
			fs.readFile(file, function(err, buf){
				if (err) {
					notice.warn('combo', err, file);
				} else {
					_buf[index] = buf;
				}
				complete();
			});
		});
	});

	task.start();
}
