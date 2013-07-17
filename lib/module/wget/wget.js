var http = require('http'),
	mod = require('../../mod.js'),
	notice = mod.notice,
	util = mod.util,
	path = require('path');



// 相比于wget.request增加redirectNum参数，判断是否跳转次数过多
// PS：调用的时候，不用关redirectNum参数，除非你觉得5次的检测太多了
var wget = function(path, isPost, postData, headers, hostname, port, callback, failCall, redirectNum){
	wget.request(path, isPost, postData, headers, hostname, port, function(res){
		// 处理 300 跳转
		if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
			if (redirectNum > 5) {
				notice.warn('wget', 'redirect to much times');
				failCall();
			} else {
				redirectNum = redirectNum ? ++redirectNum : 1;

				notice.log('wget', 'redirect', res.headers.location);
				var uri = util.getURI(res.headers.location);
				wget(uri.path, isPost, postData, res.headers, uri.port, callback, failCall, redirectNum);
			}
		} else {
			callback(res);
		}
	}, failCall);
};


wget.request = function(path, isPost, postData, headers, hostname, port, callback, failCall){
	var req = http.request({
			'hostname': hostname,
			'port': port,
			'headers': headers,
			'path': path,
			'method': isPost ? 'POST' : 'GET'
		}, callback)
		.on('error', function(err){
			notice.log('wget', err, path);
			if (failCall) failCall(err);
		});

	if (postData) req.write(postData);
	req.end();
};


wget.saveFile = function(res, file){
	util.mkdirs(path.dirname(file));
	rs.pipe(fs.createWriteStream(file));
};

wget.getBuffer = function(res, callback, failCall){
	var _buf = [];
	res.on('data', function(buf){
		_buf.push(buf);
	})
	.on('error', function(err){
		notice.log('wget', err);
		if (failCall) failCall(err);
	})
	.on('end', function(){
		callback(Buffer.concat(_buf));
	});
};


module.exports = wget;

