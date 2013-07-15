var mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf,
	_domainStr = '.'+_conf.Domain.toLowerCase(),
	_domainLen = _domainStr.length;


exports.alias = {};
exports.add = function(alias, path){
	if (alias in exports.alias) notice.warn('DRS', 'alias('+alias+') is exisist');
	exports.alias[alias] = path;
};
exports.map = function(hostname){		// 注意：是不含端口的
	if (util.endsWidth(hostname, _domainStr)) {
		return exports.alias[hostname.substring(0, hostname.length - _domainLen)] || _conf.DocumentRoot;
	}

	return _conf.DocumentRoot;
};
