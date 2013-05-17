var notice = require('./lib/notice.js'),
	fileServ = require('./lib/module/fileserv.js'),
	infoServ = require('./lib/module/infoserv.js'),
	rl = require('./lib/module/readcmd.js');

fileServ.listen(82);
infoServ.listen(81);
notice.log('INFO',  'Server run in Port:82');