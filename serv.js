var notice = require('./lib/notice.js'),
	rl = require('./lib/apps/readcmd.js'),
	_conf = require('./conf.js'),

	devServ = require('./lib/apps/devserv.js'),
	downServ = require('./lib/apps/downserv.js'),
	infoServ = require('./lib/apps/infoserv.js'),
	viewServ = require('./lib/apps/viewserv.js'),
	spliceServ = require('./lib/apps/spliceserv.js'),

	listen = function(serv, port, name){
		serv.on('clientError', function(err){
				notice.warn('Client', name+'('+port+') '+err);
			})
			.on('error', function(err){
				notice.error('SYS', name+' '+err);
			})
			.listen(port);

		notice.log('SYS', name+' run in Port:'+port);
	};

listen(devServ, _conf.DevServPort, 'Dev Server');
listen(infoServ, _conf.InfoServPort, 'Info Server');
listen(viewServ, _conf.ViewServPort, 'View Server');
listen(spliceServ, _conf.SpliceServPort, 'Splice Server');
