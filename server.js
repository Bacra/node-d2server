var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),
	less = require('less'),
	zlib = require("zlib"),
	stream = require('stream'),
	util = require('util'),
	Event = require("events").EventEmitter,

	_app = http.createServer(handler),
	io = require('socket.io').listen(_app),
	ejs = require('ejs'),

	mime = require('./lib/mime.js'),
	notice = require('./lib/notice.js'),

	_lastModified = {},					// 文件修改时间
	_cache = {},						// 缓存的内容
	_cacheTpl = {},						// 缓存模板解析之后的函数  不使用ejs默认的缓存函数（变量冲突）
	_watch = {},						// 文件监视对象
	_serverStartTime = new Date().toUTCString(),
	// _specialExtname = /html|css|less|js/,		// 需要进行缓存、解析的文件拓展名
	_gzipReg = /\bgzip\b/i;

var DEBUG = true;
if (DEBUG) notice.warn('INFO', 'Server run in debug module');

function handler(req, res){
	var uri = url.parse(req.url, true),
		file = 'view/'+path.normalize(uri.pathname).toLowerCase(),
		lastModified = _lastModified[file];

	if (DEBUG) lastModified = false;
	if (lastModified && lastModified == req.headers['if-modified-since']) {
		res.statusCode = 304;
		res.end();
	} else {

		var cache = _cache[file],
			supGzip = req.headers['accept-encoding'] && _gzipReg.test(req.headers['accept-encoding']);

		if (!supGzip) notice.warn('GZIP', 'Browser do not support gzip');

		if (DEBUG) cache = false;
		if (cache) {
			if (supGzip) {
				res.writeHead(200, cache.zipHead);
				res.end(cache.zipBuf);
			} else {
				cache.sendCont(res);
			}
		} else if (!fs.existsSync(file)) {
			notice.log(404, file);
			res.statusCode = 404;
			res.end();
		} else {
			build(res, file, uri, lastModified);
		}
	}
}



// 生产（Apache）
// 带有缓存的文件，在没有修改的情况下，只可能运行一次（HTML？？）
function build(res, file, uri, lastModified){
	
	if (!lastModified) {
		_lastModified[file] = _serverStartTime;		// 临时缓存
		try {
			lastModified = fs.statSync(file).mtime.toUTCString();
			_lastModified[file] = lastModified;
		} catch (err) {
			notice.error('FS', err);
		}
	}

	var extname = path.extname(file).substring(1),
		fileMime = mime(extname),
		headerParam = {
			'Content-Type': fileMime,
			'Last-Modified': lastModified
		};

	if (extname == 'html' || extname == 'less'){
		fs.readFile(file, function(err, cont){
			if (err) {
				res.writeHead(500, 'FS Can Not ReadFile');
				res.end();
				notice.error('FS', err);
				return;
			}

			cont = cont.toString();

			if (extname == 'less') {
				parseLess(cont, file, function(cont){
					res.writeHead(200, headerParam);
					res.end(cont);

					inGzip(cont, function(buf){
						_cache[file] = new Cache(buf, fileMime, lastModified);
					});
				}, function(err){
					delete _lastModified[file];
					res.writeHead(500, 'LESSC Parser ERROR');
					res.end();
					notice.error('LESSC', err);
				});


				initFsWatch4cache(file, function(buf, callback){
						parseLess(buf.toString(), file, callback, function(err){
							notice.error('LESSC', err);
						});
					}, fileMime);
			} else {		// HTML

				parseHtml(cont, file, function(cont){
					res.writeHead(200, headerParam);
					res.end(cont);

					inGzip(cont, function(buf){
						_cache[file] = new Cache(buf, fileMime, lastModified);
					});
				}, function(err){
					delete _lastModified[file];
					res.writeHead(500, 'EJS Parser ERROR');
					res.end();
					notice.error('EJS', err);
				});
				

				initFsWatch4cache(file, function(buf, callback){
					delete _cacheTpl[file];
					parseHtml(cont, file, callback, function(err){
						notice.error('EJS', err);
					});
				}, fileMime);
			}
		});

	} else {
		var jsOrCss = extname == 'js' || extname == 'css';
		if (jsOrCss) headerParam['Content-Encoding'] = 'gzip';
		res.writeHead(200, headerParam);

		var st = fs.createReadStream(file);
		st.on('error', function(err){
			if (DEBUG) notice.error('Stream', err);
			res.writeHead(504, 'Stream Error');
			res.end();
		});
	
		if (jsOrCss) {
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
			st.pipe(res);
		}
	}
}





function Cache(zipBuf, fileMime, lastModified){
	this.zipStatus = -1;
	this.contStatus = -1;
	this.zipQuery = [];
	this.contQuery = [];

	this.fileMime = fileMime;
	this.lastModified = lastModified;

	this.zipBuf = zipBuf;
	this.zipHead = {
		// 'Z-Data-From': 'Server Cache',
		'Content-Type': fileMime,
		'Content-Encoding': 'gzip',
		'Content-Length': zipBuf.length,
		'Last-Modified': lastModified
	};
}

Cache.prototype = {
	'sendZip': function(res){
		if (this.zipStatus == 1) {

		}
	},
	'updateZip': function(res) {},
	'sendCont': function(res){
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
					self.setCont(buf);

					res.writeHead(200, self.contHead);
					res.end(buf);
				}
			});
		}
	},
	'setCont': function(buf){
		this.cont = buf;
		this.contHead = {
			'Content-Type': this.fileMime,
			'Content-Length': buf.length,
			'Last-Modified': this.lastModified
		};
	}
};

util.inherits(Cache, Event);




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


function parseHtml(cont, file, callback, errorCallback, options) {
	try {
		var tpl = _cacheTpl[file] || (_cacheTpl[file] = ejs.compile(cont, {
			'filename': file
		}));

		callback(tpl(options || {}));
	} catch (err) {
		errorCallback(err);
	}
}



// 将string压缩成gzip
function inGzip(cont, callback){
	zlib.gzip(cont, function(err, buf){
		if (err) {
			notice.error('GZIP', 'in gzip error:'+file);
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

			notice.log('Watch', 'file change:' + file);
		} else {
			delete _lastModified[file];
			watch.close();

			if (removeFunc) removeFunc();

			if (e == 'rename') {
				notice.warn('Watch', 'file rename:' + file);
			} else {
				notice.error('Watch', 'undefined Event:' + file);
			}
		}
	});
	watch.on('error', function(e){
		notice.error('Watch', e);
	});

	return watch;
}





// 相比于initFsWatch 增加了文件内容读取 解析 gzip压缩步骤
function initFsWatch4cache(file, parseFunc, fileMime) {
	return initFsWatch(file, function(lastModified){
			fs.readFile(file, function(err, buf){
				if (err) {
					notice.error('FS', err);
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

notice.log('INFO', 'Server run in Port:81\t\t'+_serverStartTime);


http.createServer(function(req, res){
	res.end('111');
}).listen(82);