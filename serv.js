var notice = require('./lib/notice.js'),
	rl = require('./lib/apps/readcmd.js'),
	_conf = require('./conf.js');




require('./lib/apps/fileserv.js').listen(_conf.fileServPort);
require('./lib/apps/downserv.js');
require('./lib/apps/infoserv.js').listen(_conf.infoServPort);
require('./lib/apps/viewserv.js').listen(_conf.viewServPort);
notice.log('INFO',  'File Server run in Port: '+_conf.fileServPort);
notice.log('INFO',  'Info Server run in Port: '+_conf.infoServPort);
notice.log('INFO',  'View Server run in Port: '+_conf.viewServPort);