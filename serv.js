var notice = require('./lib/func/notice.js');

if (require('fs').existsSync('./conf.js')){
	var _conf = require('./conf.js');

	listen('devServ', _conf.DevServPort, 'Dev Server');
	listen('infoServ', _conf.InfoServPort, 'Info Server');
	listen('viewServ', _conf.ViewServPort, 'View Server');
	listen('spliceServ', _conf.SpliceServPort, 'Splice Server');

	// plugs
	require('./lib/module/downServ/downServ.js');
	require('./lib/module/cmd/cmd.js');
} else {
	notice.error('SYS', 'Please edit "'+__dirname+require('path').sep+'conf.js.example" file and creates "conf.js" file');
}




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