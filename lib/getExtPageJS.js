var _conf = require('../conf.js'),
	notice = require('./notice.js'),
	util = require('./util.js'),
	AppConfig = require('./AppConfig.js'),

	i2serv = require('./apps/i2serv.js'),
	_d2fsCont = '',
	d2fsUrlReg =  /^\/devServ\/d2fs\.min\.js(?:\?root=(.*))$/i,
	encodeDocumentRoot = encodeURIComponent(_conf.DocumentRoot);

	infoSitePath = 'http://'+_conf.Domain+':'+_conf.InfoServPort+'/',
	socketUrl = infoSitePath+'socket.io/socket.io.js',
	d2fsUrl = infoSitePath+'devServ/d2fs.min.js',

	appRootReg = /\{@appRoot\}/g,
	domainReg = /\{@Domain\}/g,
	IOportReg = /\{@IOport\}/g,
	devSitePathReg = /\{@devSitePath\}/g,
	viewSitePathReg = /\{@viewSitePath\}/g,
	pagesReg = /__pages__/g;



require('fs').readFile(__dirname+'/src/d2fs.min.js', function(err, buf){
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

		cont = _d2fsCont.replace(appRootReg, match[1] || encodeDocumentRoot)
			.replace(domainReg, _conf.Domain)
			.replace(IOportReg, _conf.InfoServPort)
			.replace(devSitePathReg, appConf.getSitePath(_conf.DevServPort))
			.replace(viewSitePathReg, appConf.getSitePath( _conf.ViewServPort))
			.replace(pagesReg, JSON.stringify(pages));
		
		res.end(cont);
	}
});

i2serv.io.of('/d2').on('connection', function (socket) {
	socket.on('joinApp', function(root){
		this.join(decodeURIComponent(root));
	});
});



module.exports = {
	'socketUrl': socketUrl,
	'd2fsUrl': d2fsUrl,
	'getIoScriptTag': function(root){
		return '\n<script type="text/javascript" src="'+socketUrl+'" charset="utf-8"></script>\n<script type="text/javascript" src="'+d2fsUrl+'?root='+encodeURIComponent(root)+'" charset="utf-8"></script>';
	}
};