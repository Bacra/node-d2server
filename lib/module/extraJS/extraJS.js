var mod = require('../../mod.js'),
	_conf = mod.conf,
	notice = mod.notice,
	util = mod.util,
	ProjConfig = mod.load('ProjConfig'),
	i2serv = mod.load('i2serv'),

	_d2fsContTpl = function(){ return '';};
	pagesReg = /__pages__/g,

	infoSitePath = 'http://'+_conf.Domain+':'+_conf.InfoServPort,
	d2fsPath = '/devServ/d2fs.min.js';



require('fs').readFile(__dirname+'/src/d2fs.min.js', function(err, buf){
	if (err) {
		notice.warn('io', 'read d2fs.min.js'+err);
	} else {
		_d2fsContTpl = util.tpl(['projRoot', 'Domain', 'IOport', 'devSitePath', 'viewSitePath'], buf.toString());
	}
});


i2serv.onRequest(function(req, res, uri){
	if (uri.pathname == d2fsPath){
		res.writeHead(200, {
			'Content-Type': 'text/javascript'
		});

		var root = uri.query.root,
			projConf;
		if (root) {
			projConf = ProjConfig.find(root);
			if (!projConf) projConf = ProjConfig.defaultProj;
		} else {
			root = '';
		}
		
		res.end(_d2fsContTpl({
			'projRoot': encodeURIComponent(root),
			'Domain': _conf.Domain,
			'IOport': _conf.InfoServPort,
			'devSitePath': projConf.getSitePath(_conf.DevServPort),
			'viewSitePath': projConf.getSitePath( _conf.ViewServPort)
		}).replace(pagesReg, JSON.stringify(projConf.HTMLLinks)));

		return false;
	}

});

i2serv.io.of('/d2').on('connection', function (socket) {
	socket.on('joinProj', function(root){
		root = decodeURIComponent(root);
		if (!ProjConfig.projs[root]) root = ProjConfig.defaultProj.root;		// 判断root是否有效
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