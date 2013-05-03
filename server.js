var app = require('http').createServer(handler),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),
	less = require('less'),
	zlib = require("zlib"),
	stream = require('stream'),
	io = require('socket.io').listen(app),
	mime = require('./lib/mime.js'),
	cache = {},
	cacheReg = /^css|less|html|js$/;		// 缓存的内容，都是经过zlib压缩的


function handler(req, res){
	var uri = url.parse(req.url, true),
		param = uri.params,
		file = path.normalize('w:/'+uri.pathname).toLowerCase(),
		extname = path.extname(file).substring(1),
		acceptEncoding = req.headers['Accept-Encoding'] || "",
		cont, st, cachePipe;



	if (cache[file]) {
		cont = cache[file].cont;
		if (/^css|less|html|js$/.test(extname)) {
			res.writeHead(200, { 'Content-Encoding': 'gzip' });
		}
		res.end(cont);
	} else {
		st = fs.createReadStream(file);
		
		if (/^css|less|html|js$/.test(extname)) {
			res.writeHead(200, { 'Content-Encoding': 'gzip' });
			
			cachePipe = stream.PassThrough();
			cont = [];
			cachePipe.on('data', function(buf){
				cont.push(buf);
			});
			cachePipe.on('end', function(){
				console.log(Buffer.concat(cont).toString());
				cache[file] = new Cache(Buffer.concat(cont), extname);
			});

			st.pipe(zlib.createGzip()).pipe(cachePipe).pipe(res);
		} else {
			st.pipe(res);
		}

		st.on('error', function(err){
			res.statusCode = 404;
			res.end();
		});
	}
}


function showCont(cont, extname, res) {
	res.writeHeader(200, {
		'Content-Length': Buffer.byteLength(cont),
		'Content-Type': mime(extname)
	});
	res.end(cont);
}


function Cache(cont, extname, room){
	this.extname = extname;
	this.room = room;
	this.update(cont);
}

Cache.prototype.update = function(cont){
	this.cont = cont;
	this.timestamp = new Date().getTime();
};

app.listen(81);