var mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf;



exports.hostname = {};
exports.defaultDirname = _conf.DocumentRoot;
exports.add = function(hostname, path){
	if (hostname in exports.hostname) notice.warn('DRS', 'hostname('+hostname+') is exisist');
	exports.hostname[hostname] = path;
};

exports.map = function(hostname){		// 注意：是不含端口的
	return exports.hostname[hostname] || exports.defaultDirname;
};