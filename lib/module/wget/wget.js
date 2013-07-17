var http = require('http'),
	mod = require('../../mod.js'),
	notice = mod.notice,
	util = mod.util,
	path = require('path');


var wget = function(path, isPost, postData, headers, hostname, port, callback, failCall){
	var req = http.request({
			'hostname': hostname,
			'port': port,
			'headers': headers,
			'path': path,
			'method': isPost ? 'POST' : 'GET'
		}, function(res){
			// 处理 300 跳转
			if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
				notice.log('wget', 'redirect', res.headers.location);
				var uri = util.getURI(res.headers.location);
				wget(uri.path, isPost, postData, res.headers, uri.port, callback, failCall);
			} else {
				callback(res);
			}
		})
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

