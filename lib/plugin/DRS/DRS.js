var mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf,
	_domainStr = '.'+_conf.Domain.toLowerCase(),
	_domainLen = _domainStr.length;


exports.alias = {};
exports.addAlias = function(alias, path){
	if (alias in exports.alias) notice.warn('DRS', 'alias('+alias+') is exisist');
	exports.alias[alias] = path;
};

exports.hostname = {};
exports.addHostname = function(hostname, path){
	if (hostname in exports.hostname) notice.warn('DRS', 'hostname('+hostname+') is exisist');
	exports.hostname[hostname] = path;
};

exports.map = function(hostname){		// 注意：是不含端口的
	if (exports.hostname[hostname]) return exports.hostname[hostname];
	if (util.endsWidth(hostname, _domainStr)) {
		return exports.alias[hostname.substring(0, hostname.length - _domainLen)] || _conf.DocumentRoot;
	}

	return _conf.DocumentRoot;
};
