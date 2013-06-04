var notice = require('./lib/notice.js'),
	rl = require('./lib/apps/readcmd.js'),
	_conf = require('./conf.js');




require('./lib/apps/devserv.js').listen(_conf.devServPort);
require('./lib/apps/downserv.js');
require('./lib/apps/infoserv.js').listen(_conf.infoServPort);
require('./lib/apps/viewserv.js').listen(_conf.viewServPort);
require('./lib/apps/splitserv.js').listen(_conf.spliceServPort);
notice.log('INFO',  'Dev Server run in Port: '+_conf.fileServPort);
notice.log('INFO',  'Info Server run in Port: '+_conf.infoServPort);
notice.log('INFO',  'View Server run in Port: '+_conf.viewServPort);
notice.log('INFO',  'Splice Server run in Port: '+_conf.spliceServPort);


setTimeout(function(){
	var appConf = require('./lib/appconfig.js').find(require('./lib/util.js').parsePath('d:/projects/8684passport/'));
	require('./lib/export.js')(appConf);
}, 2000);
