var notice = require('./lib/notice.js'),
	rl = require('./lib/module/readcmd.js'),
	_conf = require('./lib/conf.js');



require('./lib/module/fileserv.js').listen(_conf.fileServPort);
require('./lib/module/ioserv.js');
require('./lib/module/infoserv.js').listen(_conf.infoServPort);
notice.log('INFO',  'File Server run in Port: '+_conf.fileServPort);
notice.log('INFO',  'IO Server run in Port: '+_conf.infoServPort);