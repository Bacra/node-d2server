var _conf = require('../conf.js'),
	notice = require('./notice.js'),
	util = require('./util.js'),
	AppConfig = require('./AppConfig.js'),
	i2serv = require('./apps/i2serv.js'),

	_d2fsContTpl = function(){ return '';};
	pagesReg = /__pages__/g,

	infoSitePath = 'http://'+_conf.Domain+':'+_conf.InfoServPort,
	d2fsPath = '/devServ/d2fs.min.js';



require('fs').readFile(__dirname+'/src/d2fs.min.js', function(err, buf){
	if (err) {
		notice.warn('io', 'read d2fs.min.js'+err);
	} else {
		_d2fsContTpl = util.tpl(['appRoot', 'Domain', 'IOport', 'devSitePath', 'viewSitePath'], buf.toString());
	}
});


i2serv.onRequest(function(req, res, uri){
	if (uri.pathname == d2fsPath){
		res.writeHead(200, {
			'Content-Type': 'text/javascript'
		});

		var root = uri.query.root,
			appConf;
		if (root) {
			appConf = AppConfig.find(root);
			if (!appConf) appConf = AppConfig.defaultApp;
		} else {
			root = '';
		}
		
		res.end(_d2fsContTpl({
			'appRoot': encodeURIComponent(root),
			'Domain': _conf.Domain,
			'IOport': _conf.InfoServPort,
			'devSitePath': appConf.getSitePath(_conf.DevServPort),
			'viewSitePath': appConf.getSitePath( _conf.ViewServPort)
		}).replace(pagesReg, JSON.stringify(appConf.HTMLLinks)));

		return false;
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
	'socketUri': infoSitePath+'/socket.io/socket.io.js',
	'd2fsUri': infoSitePath+d2fsPath,
	'getD2fsUri': function(root){
		return infoSitePath+d2fsPath+'?root='+encodeURIComponent(root);
	}
};