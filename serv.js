var notice = require('./lib/func/notice.js'),
	_conf = require('./lib/config.js');

listen('devServ', _conf.DevServPort, 'Dev Server');
listen('infoServ', _conf.InfoServPort, 'Info Server');
listen('viewServ', _conf.ViewServPort, 'View Server');
listen('spliceServ', _conf.SpliceServPort, 'Splice Server');
require('./lib/module/cmd/cmd.js');

// plugins
require('./lib/plugins/downServ/downServ.js');



function listen(serv, port, name){
	require('./lib/apps/'+serv).on('clientError', function(err){
			notice.warn('Client', name+'('+port+') '+err);
		})
		.on('error', function(err){
			notice.error('SYS', name+' '+err);
		})
		.listen(port);

	notice.log('SYS', name+' run in Port:'+port);
}