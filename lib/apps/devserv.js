var fs = require('fs'),

	servUtil = require('../servutil.js'),
	notice = require('../notice.js'),
	util = require('../util.js'),
	_conf = require('../../conf.js'),
	AppConfig = require('../appconfig.js'),

	i2serv = require('./i2serv.js'),
	_d2fsCont,
	d2fsUrlReg = /^\/devServ\/d2fs\.min\.js(?:\?root=(.*))$/i,
	encodeDocumentRoot = encodeURIComponent(require('../../conf.js').DocumentRoot);




fs.readFile(__dirname+'/../src/d2fs.min.js', function(err, buf){
	if (err) {
		notice.warn('io', 'read d2fs.min.js'+err);
	} else {
		_d2fsCont = buf.toString();
	}
});


i2serv.infoServ.on('request', function(req, res){
	var match = req.url.match(d2fsUrlReg),
		cont;
	if (match) {
		res.writeHead(200, {
			'Content-Type': 'text/javascript'
		});

		var appConf = AppConfig.find(decodeURIComponent(match[1])),
			pages = [],
			alias = '',
			dirname = '';
		if (appConf) {
			util.eachObject(appConf.HTMLData, function(srcFile, outFiles){
				util.eachObject(outFiles, function(outFile, fileConf){
					pages.push({
						'href': fileConf.href,
						'title': fileConf.title
					});
				});
			});

			alias = appConf.alias;
			dirname = appConf.dirname;
		}

		cont = _d2fsCont.replace(/\{@appRoot\}/g, match[1] || encodeDocumentRoot)
			.replace(/\{@Domain\}/g, _conf.Domain)
			.replace(/\{@IOport\}/g, _conf.InfoServPort)
			.replace(/\{@ViewPort\}/g, _conf.ViewServPort)
			.replace(/\{@DevPort\}/g, _conf.DevServPort)
			.replace(/__pages__/g, JSON.stringify(pages))
			.replace(/\{@alias\}/g, alias)
			.replace(/\{@dirname\}/g, dirname);
		
		res.end(cont);
	}
});

i2serv.io.of('/d2').on('connection', function (socket) {
	socket.on('joinApp', function(root){
		this.join(decodeURIComponent(root));
	});
});





module.exports = require('http').createServer(servUtil.getListenFunc(servUtil.cacheServer));