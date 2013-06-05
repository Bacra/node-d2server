var notice = require('./lib/notice.js'),
	rl = require('./lib/apps/readcmd.js'),
	_conf = require('./conf.js');




require('./lib/apps/devserv.js').listen(_conf.DevServPort);
require('./lib/apps/downserv.js');
require('./lib/apps/infoserv.js').listen(_conf.InfoServPort);
require('./lib/apps/viewserv.js').listen(_conf.ViewServPort);
require('./lib/apps/spliceserv.js').listen(_conf.SpliceServPort);
notice.log('INFO',  'Dev Server run in Port: '+_conf.DevServPort);
notice.log('INFO',  'Info Server run in Port: '+_conf.InfoServPort);
notice.log('INFO',  'View Server run in Port: '+_conf.ViewServPort);
notice.log('INFO',  'Splice Server run in Port: '+_conf.SpliceServPort);


setTimeout(function(){
	var appConf = require('./lib/appconfig.js').find(require('./lib/util.js').parsePath('d:/projects/8684passport/'));
	require('./lib/export.js')(appConf);
}, 2000);
