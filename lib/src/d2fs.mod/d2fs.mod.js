var mod = require('../../mod.js'),
	_conf = mod.conf,
	notice = mod.notice,
	util = mod.util,
	ProjConfig = mod.load('ProjConfig'),
	i2serv = mod.load('i2serv'),

	_d2fsContTpl = function(){ return '';};

	infoSitePath = 'http://'+_conf.Domain+':'+_conf.InfoServPort,
	d2fsPath = '/devServ/d2fs.min.js';



require('fs').readFile(__dirname+'/src/d2fs.min.js', function(err, buf){
	if (err) {
		notice.warn('io', 'read d2fs.min.js'+err);
	} else {
		_d2fsContTpl = util.tpl(['projDirname', 'Domain', 'IOport', 'pages', 'DevServPort', 'ViewServPort', 'SpliceServPort', 'localHostname'], buf.toString());
	}
});


i2serv.onRequest(function(req, res, uri){
	if (uri.pathname == d2fsPath){
		res.writeHead(200, {
			'Content-Type': 'text/javascript'
		});

		var projConf = ProjConfig.projDirname[uri.query.dirname] || ProjConfig.defaultProj;
		
		res.end(_d2fsContTpl({
			'projDirname': encodeURIComponent(projConf.dirname),
			'Domain': _conf.Domain,
			'IOport': _conf.InfoServPort,
			'pages': JSON.stringify(projConf.HTMLLinks),
			'DevServPort': _conf.DevServPort,
			'ViewServPort': _conf.ViewServPort,
			'SpliceServPort': _conf.SpliceServPort,
			'localHostname': projConf.localHostname
		}));

		return false;
	}

});

i2serv.io.of('/d2').on('connection', function (socket) {
	socket.on('joinProj', function(dirname){
		dirname = decodeURIComponent(dirname);
		this.join(dirname && ProjConfig.projDirname[dirname] ? ProjConfig.projDirname[dirname].root : ProjConfig.defaultProj.root);
	});
});




module.exports = {
	'socketUri': infoSitePath+'/socket.io/socket.io.js',
	'd2fsUri': infoSitePath+d2fsPath,
	'getD2fsUri': function(dirname){
		return infoSitePath+d2fsPath+'?dirname='+encodeURIComponent(dirname);
	}
};