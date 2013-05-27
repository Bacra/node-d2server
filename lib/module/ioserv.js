var url = require('url'),
	fs = require('fs'),
	notice = require('../notice.js'),
	util = require('../util.js'),
	zlib = require("zlib"),

	i2serv = require('./initI2serv.js'),
	io = i2serv.io,
	AppConfig = require('./AppConfig.js'),
	d2fsCont;



fs.readFile('./lib/module/server/d2fs.js', function(err, buf){
	if (err) {
		notice.warn('io', 'read d2fs.js'+err);
	} else {
		zlib.gzip(buf, function(err, buf){
			if (err) {
				notice.warn('io', 'gzip d2fs.js'+err);
			} else {
				d2fsCont = buf;
			}
		});
	}
});


i2serv.infoServ.on('request', function(req, res){
	if (req.url == '/d2fs.js') {
		res.writeHead(200, {
			'Content-Type': 'text/javascript',
			'Content-Encoding': 'gzip'
		});
		res.end(d2fsCont);
	}
});


var d2 = io.of('/d2')
	.on('connection', function (socket) {
		socket.on('href', function(href){
			var uri = url.parse(href),
				conf = AppConfig.find(util.parsePath(AppConfig.DRS(uri.hostname) + uri.pathname)) || AppConfig.defaultApp;

			this.join(conf.root);
		});
	});



module.exports = io;