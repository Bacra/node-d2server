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
	_watch = {},						// 文件监视对象
	_gzipReg = /\bgzip\b/i;


function handler(req, res){
	var uri = url.parse(req.url, true),
		file = 'view/'+path.normalize(uri.pathname).toLowerCase(),
		lastModified = _lastModified[file];

	// lastModified = false;
	if (lastModified && lastModified == req.headers['if-modified-since']) {
		res.statusCode = 304;
		res.end();
	} else {

		var cache = _cache[file],
			supGzip = req.headers['accept-encoding'] && _gzipReg.test(req.headers['accept-encoding']),
			param = uri.params;

		if (!supGzip) console.warn('[warn] Browser do not support gzip');

		// supGzip = false;
		if (cache) {
			if (supGzip) {
				res.writeHead(200, cache.gzipHead);
				res.end(cache.zipBuf);
			} else {
				cache.unzip(res);
			}
		} else {

			// 生产（Apache）
			try {
				if (!lastModified) {
					lastModified = fs.statSync(file).mtime.toUTCString();
					_lastModified[file] = lastModified;
				}
			
				var extname = path.extname(file).substring(1),
					fileMime = mime(extname),
					watch;

				if (extname == 'html' || extname == 'less'){
					var cont = fs.readFileSync(file).toString();

					if (extname == 'less') {
						parseLess(cont, file, function(cont){
							res.writeHead(200, {
								'Content-Type': fileMime,
								'Last-Modified': lastModified
							});
							res.end(cont);

							inGzip(cont, function(buf){
								_cache[file] = new Cache(buf, fileMime, lastModified);
							});
						}, function(err){
							res.writeHead(500, 'LESSC Parser ERROR');
							res.end();
						});


						initFsWatch4cache(file, function(buf, callback){
								parseLess(buf.toString(), file, callback, function(err){
									console.error('[LESSC ERROR]' + err);
								});
							}, fileMime);
					} else {		// HTML

						res.writeHead(200, {
							'Content-Type': fileMime,
							'Last-Modified': lastModified
						});
						res.end(cont);

						inGzip(cont, function(buf){
							_cache[file] = new Cache(buf, fileMime, lastModified);
						});

						initFsWatch4cache(file, function(buf, callback){callback(buf);}, fileMime);
					}
				} else {
					var st = fs.createReadStream(file);
					if (extname == 'js' || extname == 'css') {
						res.writeHead(200, {
							'Content-Type': fileMime,
							'Content-Encoding': 'gzip',
							'Last-Modified': lastModified
						});
						
						// 内容缓存
						var cachePipe = stream.PassThrough(),
							bufs = [];
						cachePipe.on('data', function(buf){
							bufs.push(buf);
						});
						cachePipe.on('end', function(){
							_cache[file] = new Cache(Buffer.concat(bufs), fileMime, lastModified);
						});

						st.pipe(zlib.createGzip()).pipe(cachePipe).pipe(res);


						initFsWatch4cache(file, function(buf, callback){callback(buf);}, fileMime);
					} else {
						// 不进行内容缓存的
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
	this.gzipHead = {
		// 'Z-Data-From': 'Server Cache',
		'Content-Type': fileMime,
		'Content-Encoding': 'gzip',
		'Content-Length': zipBuf.length,
		'Last-Modified': lastModified
	};
}

Cache.prototype.unzip = function(res){
	if (this.cont) {
		res.writeHead(200, this.contHead);
		res.end(this.cont);
	} else {
		var self = this;
		zlib.unzip(this.zipBuf, function(err, buf){
			if (err) {
				res.writeHead(500, 'Cache unzip ERROR');
				res.end();
			} else {
				var contHead = {
					// 'Z-Data-From': 'Server Cache',
					'Content-Type': self.gzipHead['Content-Type'],
					'Content-Length': buf.length,
					'Last-Modified': self.gzipHead['Last-Modified']
				};

				res.writeHead(200, contHead);
				res.end(buf);

				self.cont = buf;
				self.contHead = contHead;
			}
		});
	}
};




// 解析less文件
function parseLess(cont, file, callback, errorCallback){
	var parser = new(less.Parser)({
		paths: [path.dirname(file)],
		filename: path.basename(file)
	});

	parser.parse(cont, function (err, tree) {
		if (err) {
			errorCallback(err);
			return;
		}
		cont = tree.toCSS();
		cont = cont.replace(/([\w-]) +\.(--|__)/g, '$1$2');		// BEM支持
		callback(cont);
	});
}


/*function parseAndZipLess(cont, file, callback, errorCallback){
	parseLess(cont, file, function(cont){
		inGzip(cont, function(buf){
			callback(buf, cont);
		});
	}, errorCallback);
}
*/


// 将string压缩成gzip
function inGzip(cont, callback){
	zlib.gzip(cont, function(err, buf){
		if (err) {
			console.error('[ERROR] gzip:'+file);
		} else {
			callback(buf);
		}
	});
}



// 包含调整lastModified操作 关闭watch
function initFsWatch(file, changeFunc, removeFunc) {
	var watch = fs.watch(file);
	_watch[file] = watch;

	watch.on('change', function(e, filename){
		if (e == 'change') {
			var lastModified = new Date().toUTCString();
			_lastModified[file] = lastModified;		// 更新时间

			changeFunc(lastModified);
		} else {
			delete _lastModified[file];
			watch.close();

			if (removeFunc) removeFunc();

			if (e == 'rename') {
				console.log('[Watch] file rename:'+ file);
			} else {
				console.warn('[Watch WARN] undefined Event');
			}
		}
	});
	watch.on('error', function(e){
		console.error('[Watch ERROR] '+e);
	});

	return watch;
}



// 相比于initFsWatch 增加了文件内容读取 解析 gzip压缩步骤
function initFsWatch4cache(file, parseFunc, fileMime) {
	return initFsWatch(file, function(lastModified){
			fs.readFile(file, function(err, buf){
				if (err) {
					console.error('[ERROR] File Read Error:'+file+err);
					return;
				}

				parseFunc(buf, function(cont){
					inGzip(cont, function(buf2){
						_cache[file] = new Cache(buf2, fileMime, lastModified);
					});
				});
			});
		}, function(){
			delete _cache[file];
		});
}


_app.listen(81);