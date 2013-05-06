var _app = require('http').createServer(handler),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),
	less = require('less'),
	zlib = require("zlib"),
	stream = require('stream'),
	io = require('socket.io').listen(_app),
	mime = require('./lib/mime.js'),
	_lastModified = {},					// 文件修改时间
	_cache = {},					// 缓存的内容
	_cacheReg = /^css|less|html|js$/,
	_zipReg = /\bgzip\b/i;


function handler(req, res){
	var uri = url.parse(req.url, true),
		file = 'view/'+path.normalize(uri.pathname).toLowerCase(),
		lastModified = _lastModified[file];

	if (lastModified && lastModified == req.headers['if-modified-since']) {
		res.writeHead(304, "Not Modified");
		res.end();
	} else {

		var cache = _cache[file],
			supZip = req.headers['accept-encoding'] && _zipReg.test(req.headers['accept-encoding']),
			param = uri.params;

		if (supZip && cache) {
			// 注意 缓冲的内容都是zip压缩之后的
			res.writeHead(200, cache.httpHead);
			res.end(cache.zipBuf);
		} else {
			try {
				var extname = path.extname(file).substring(1),
					fileMime = mime(extname);
				if (!lastModified) {
					lastModified = fs.statSync(file).mtime.toUTCString();
					_lastModified[file] = lastModified;
				}
			
				if (extname == 'html' || extname == 'less'){
					var cont = fs.readFileSync(file).toString();

					if (extname == 'less') {
						var parser = new(less.Parser)({
						    paths: [path.dirname(file)],
							filename: path.basename(file)
						});

						parser.parse(cont, function (e, tree) {
							if (e) {
								res.statusCode = 504;
								res.end();
								return;
							}
							cont = tree.toCSS();
							res.writeHead(200, {
								'Content-Type': fileMime,
								'Last-Modified': lastModified
							});
							res.end(cont);

							zlib.gzip(cont, function(err, buf){
								if (err) {
									console.error('[ERROR] gzip:'+file);
								} else {
									_cache[file] = new Cache(buf, fileMime, lastModified);
								}
							});
						});
					} else {
						res.writeHead(200, {
							'Content-Type': fileMime,
							'Last-Modified': lastModified
						});
						res.end(cont);

						zlib.gzip(cont, function(err, buf){
							if (err) {
								console.error('[ERROR] gzip:'+file);
							} else {
								_cache[file] = new Cache(buf, fileMime, lastModified);
							}
						});
					}
				} else {
					var st = fs.createReadStream(file);
					if (supZip && extname == 'js' || extname == 'css') {
						res.writeHead(200, {
							'Content-Type': fileMime,
							'Content-Encoding': 'gzip',
							'Last-Modified': lastModified
						});
						
						var cachePipe = stream.PassThrough(),
							bufs = [];
						cachePipe.on('data', function(buf){
							bufs.push(buf);
						});
						cachePipe.on('end', function(){
							_cache[file] = new Cache(Buffer.concat, lastModified(bufs), fileMime);
						});

						st.pipe(zlib.createGzip()).pipe(cachePipe).pipe(res);
					} else {
						res.writeHead(200, {
							'Content-Type': fileMime,
							'Last-Modified': lastModified
						});
						st.pipe(res);
					}

					/*st.on('error', function(err){
						res.statusCode = 404;
						res.end();
					});*/
				}
			} catch(e) {
				res.statusCode = 404;
				res.end();
			}
		}
	}

	
}



function Cache(zipBuf, fileMime, lastModified){
	this.zipBuf = zipBuf;
	this.httpHead = {
		'Content-Type': fileMime,
		'Content-Encoding': 'gzip',
		'Content-Length': zipBuf.length,
		'Last-Modified': lastModified
	};
}

_app.listen(81);