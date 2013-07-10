var _conf = require('../conf.js'),
	notice = require('./notice.js'),
	util = require('./util.js'),
	AppConfig = require('./AppConfig.js'),

	i2serv = require('./apps/i2serv.js'),
	_d2fsCont = '',
	d2fsUriReg =  /^\/devServ\/d2fs\.min\.js(?:\?root=(.*))$/i,

	infoSitePath = 'http://'+_conf.Domain+':'+_conf.InfoServPort+'/',
	socketUri = infoSitePath+'socket.io/socket.io.js',
	d2fsUri = infoSitePath+'devServ/d2fs.min.js',

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
	var match = req.url.match(d2fsUriReg),
		cont;
	if (match) {
		res.writeHead(200, {
			'Content-Type': 'text/javascript'
		});

		var appConf = AppConfig.find(decodeURIComponent(match[1]));
		if (!appConf) appConf = AppConfig.defaultApp;

		cont = _d2fsCont.replace(appRootReg, match[1])
			.replace(domainReg, _conf.Domain)
			.replace(IOportReg, _conf.InfoServPort)
			.replace(devSitePathReg, appConf.getSitePath(_conf.DevServPort))
			.replace(viewSitePathReg, appConf.getSitePath( _conf.ViewServPort))
			.replace(pagesReg, JSON.stringify(appConf.HTMLLinks));
		
		res.end(cont);
	}
});

i2serv.io.of('/d2').on('connection', function (socket) {
	socket.on('joinApp', function(root){
		root = decodeURIComponent(root);
		if (!AppConfig.apps[root]) root = AppConfig.defaultApp.root;		// 判断root是否有效
		this.join(root);
	});
});



module.exports = {
	'socketUri': socketUri,
	'd2fsUri': d2fsUri,
	'getD2fsUri': function(root){
		return d2fsUri+'?root='+encodeURIComponent(root);
	}
};