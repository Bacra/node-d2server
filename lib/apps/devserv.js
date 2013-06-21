var fs = require('fs'),

	servUtil = require('../servutil.js'),
	notice = require('../notice.js'),
	util = require('../util.js'),
	_conf = require('../../conf.js'),
	AppConfig = require('../appconfig.js'),

	i2serv = require('./i2serv.js'),
	_d2fsCont, _redirectCont,
	d2fsUrlReg = /^\/devServ\/d2fs\.js(?:\?root=(.*))$/i,
	redirectUrlReg = /^\/devServ\/redirect\.html(?:\?root=(.*))$/i,
	encodeDocumentRoot = encodeURIComponent(require('../../conf.js').DocumentRoot);




fs.readFile(__dirname+'/../src/d2fs.js', function(err, buf){
	if (err) {
		notice.warn('io', 'read d2fs.js'+err);
	} else {
		_d2fsCont = buf.toString();
	}
});

fs.readFile(__dirname+'/../src/redirect.html', function(err, buf){
	if (err) {
		notice.warn('io', 'read redirect.html'+err);
	} else {
		_redirectCont = buf.toString();
	}
});


i2serv.infoServ.on('request', function(req, res){
	var match = req.url.match(d2fsUrlReg),
		cont;
	if (match) {
		res.writeHead(200, {
			'Content-Type': 'text/javascript'
		});

		cont = _d2fsCont.replace(/\{@appname\}/g, match[1] || encodeDocumentRoot)
			.replace(/\{@Domain\}/g, _conf.Domain)
			.replace(/\{@IOport\}/g, _conf.InfoServPort);
		
		res.end(cont);
	} else {
		match = req.url.match(redirectUrlReg);
		if (match) {
			res.writeHead(200, {
				'Content-Type': 'text/HTML'
			});

			var appConf = AppConfig.find(decodeURIComponent(match[1])),
				cont2;
			if (appConf) {
				cont2 = '';
				util.eachObject(appConf.HTMLData, function(srcFile, outFiles){
					util.eachObject(outFiles, function(outFile, fileConf){
						cont2 += '<a href="'+fileConf.href+'" target="_top">'+fileConf.title+'</a>';
					});
				});
				cont = _redirectCont.replace('{@pages}', cont2)
					.replace('{@ports}', '<label><input type="radio" value="'+_conf.DevServPort+'" />开发模式('+_conf.DevServPort+')</label><label><input type="radio" value="'+_conf.ViewServPort+'" />导出模式('+_conf.ViewServPort+')</label>');

				res.end(cont);
			} else {
				res.end('App is not exists');
			}
		}
	}
});

i2serv.io.of('/d2').on('connection', function (socket) {
	socket.on('joinApp', function(root){
		this.join(decodeURIComponent(root));
	});
});





module.exports = require('http').createServer(servUtil.getListenFunc(servUtil.cacheServer));