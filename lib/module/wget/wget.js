var http = require('http'),
	path = require('path'),
	zlib = require('zlib'),
	parseURL = require('url').parse,
	mod = require('../../mod.js'),
	notice = mod.notice,
	util = mod.util;



// 相比于wget.request增加redirectNum参数，判断是否跳转次数过多
// PS：调用的时候，不用关redirectNum参数，除非你觉得5次的检测太多了
var wget = function(opts, postData, callback, failCall, redirectNum){
	wget.request(opts, postData, function(res){
		// 处理 300 跳转
		if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
			if (redirectNum > 5) {
				notice.warn('wget', 'redirect to much times');
				failCall();
			} else {
				redirectNum = redirectNum ? ++redirectNum : 1;
				notice.log('wget', 'redirect', res.headers.location);

				// 拼接新的请求配置
				var uri = parseURL(res.headers.location);
				uri.headers = res.headers;
				if (!uri.host) {
					if (opts.hostname) {
						uri.hostname = opts.hostname;
						uri.port = opts.port;
					} else {
						uri.host = uri.host;
					}
				}
				wget(uri, postData, callback, failCall, redirectNum);
			}
		} else {
			callback(res);
		}
	}, failCall);
};


/**
 * opts 基本配置
 * hostname
 * port
 * headers
 * path
 * method
 */
wget.request = function(opts, postData, callback, failCall){
	if (postData && !opts.method) opts.method = 'POST';

	var req = http.request(opts, callback)
		.on('error', function(err){
			notice.log('wget', err, path);
			if (failCall) failCall(err);
		});

	if (postData) req.write(postData);
	req.end();
};


wget.saveFile = function(res, file){
	util.mkdirs(path.dirname(file));
	var st = fs.createWriteStream(file);

	switch(res.headers['content-encoding']) {
		case 'gzip':
			res.pipe(zlib.createGunzip()).pipe(st);
			break;
		case 'deflate':
			res.pipe(zlib.createInflate()).pipe(st);
			break;
		default:
			res.pipe(st);
	}
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
		var buf = Buffer.concat(_buf);
		switch(res.headers['content-encoding']) {
			case 'gzip':
				zlib.gunzip(buf, function(err, buf){
					if (err) {
						failCall(err);
					} else {
						callback(buf);
					}
				});
				break;
			case 'deflate':
				zlib.inflate(buf, function(err, buf){
					if (err) {
						failCall(err);
					} else {
						callback(buf);
					}
				});
				break;
			default:
				callback(buf);
		}
	});
};



module.exports = wget;

