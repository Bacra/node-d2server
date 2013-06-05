var notice = require('./lib/notice.js'),
	rl = require('./lib/apps/readcmd.js'),
	_conf = require('./conf.js'),

	devServ = require('./lib/apps/devserv.js'),
	downServ = require('./lib/apps/downserv.js'),
	infoServ = require('./lib/apps/infoserv.js'),
	viewServ = require('./lib/apps/viewserv.js'),
	spliceServ = require('./lib/apps/spliceserv.js'),

	listen = function(serv, port, name){
		try {
			serv.listen(port);
			notice.log('SYS', name+' run in Port:'+port);
		} catch (err) {
			notice.error('SYS', name+' '+port+'Port is Occupied');
		}
	};

listen(devServ, _conf.DevServPort, 'Dev Server');
listen(infoServ, _conf.InfoServPort, 'Info Server');
listen(viewServ, _conf.ViewServPort, 'View Server');
listen(spliceServ, _conf.SpliceServPort, 'Splice Server');


setTimeout(function(){
	var appConf = require('./lib/appconfig.js').find(require('./lib/util.js').parsePath('d:/projects/8684passport/'));
	require('./lib/export.js')(appConf);
}, 2000);
