var fs = require('fs'),
	mod = require('../../mod.js'),
	Task = mod.load('Task'),
	notice = mod.notice;


/**
 * 将文件内容合并
 * @param  {Array}          fileArr  文件地址数组
 * @param  {Function}       callback 内容合并完成之后的回调 参数的类型有Buffer/String两种
 * @param  {String}         splitStr 插入文件中间的字符串
 */
module.exports = function(fileArr, callback, splitStr){
	var task = Task(function(){
			// 当splitStr存在时，返回的也是string，否则是buffer
			if (typeof(splitStr) == 'string'){
				callback(_buf.map(function(buf){return buf.toString();}).join(splitStr));
			} else {
				callback(Buffer.concat(_buf));
			}
		}),
		_buf = [];
	
	fileArr.forEach(function(file, index){
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
};

