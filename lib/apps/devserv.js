var fs = require('fs'),

	servUtil = require('../servutil.js'),
	notice = require('../notice.js'),

	i2serv = require('./i2serv.js'),
	_d2fsCont,
	d2fsUrlReg = /^\/d2fs\.js(?:\?root=(.*))$/i,
	encodeDocumentRoot = encodeURIComponent(require('../../conf.js').DocumentRoot);




fs.readFile(__dirname+'/../src/d2fs.js', function(err, buf){
	if (err) {
		notice.warn('io', 'read d2fs.js'+err);
	} else {
		_d2fsCont = buf.toString();
	}
});

i2serv.infoServ.on('request', function(req, res){
	var match = req.url.match(d2fsUrlReg);
	if (match) {
		res.writeHead(200, {
			'Content-Type': 'text/javascript'
		});
		
		res.end(_d2fsCont.replace('{@appname}', match[1] || encodeDocumentRoot));
	}
});

i2serv.io.of('/d2').on('connection', function (socket) {
	socket.on('joinApp', function(root){
		this.join(decodeURIComponent(root));
	});
});





module.exports = require('http').createServer(servUtil.getListenFunc(servUtil.cacheServer));