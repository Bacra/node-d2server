var mod = require('../../mod.js'),
	_conf = mod.conf,
	notice = mod.notice,
	util = mod.util,
	ProjConfig = mod.load('ProjConfig'),
	i2serv = mod.load('i2serv'),
	_d2fsContTpl = function(){ return '';};
	d2fsPath = '/devServ/d2fs.js';



require('fs').readFile(__dirname+'/src/d2fs.js', function(err, buf){
	if (err) {
		notice.warn('io', 'read d2fs.js'+err);
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



var mimeTag = mod.load('mimeTag'),
	socketURI = i2serv.url + 'socket.io/socket.io.js',
	d2fsURI = i2serv.url + d2fsPath.substring(1),
	getD2fsURI = function(dirname){
		return d2fsURI+'?dirname='+encodeURIComponent(dirname);
	};

module.exports = {
	'socketURI': socketURI,
	'd2fsURI': d2fsURI,
	'getD2fsURI': getD2fsURI,
	'getScriptTag': function(dirname){
		return ['\n',
		'<script type="text/javascript">',
			'var d2server_date_4448877 = new Date().getTime();',
			'window["module"+d2server_date_4448877] = window.module;',
			'window.module = false;',
			'window["io"+d2server_date_4448877] = window.io;',
		'</script>',
		'\n',
		mimeTag.js(socketURI),
		mimeTag.js(getD2fsURI(dirname)),
		'\n',
		'<script type="text/javascript">',
			'window.module = window["module"+d2server_date_4448877];',
			'window.io = window["io"+d2server_date_4448877];',
		'</script>',
		'\n'].join('');
	}
};