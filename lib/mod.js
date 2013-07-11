var cache = {
		'conf': require('../conf.js'),
		'mime': require('../mime.js'),
		'util': require('./func/util.js'),
		'notice': require('./func/notice.js')
	},
	modPath = {
		'i2serv': './apps/i2serv.js',
		
		'resHead': './func/resHead.js',
		'mimeTag': './func/mimeTag.js',
		'watchFileCh': './func/watchFileCh.js',

		'p404': './module/404/p404.js',
		'Cache': './module/Cache/Cache.js',
		'export': './module/export/export.js',
		'extraJS': './module/extraJS/extraJS.js',
		'initProject': './module/initProject/initProj.js',
		'parseHTML': './module/parseHTML/parseHTML.js',
		'parseLess': './module/parseLess/parseLess.js',
		'ProjConfig': './module/ProjConfig/ProjConfig.js',
		'servUtil': './module/servUtil/servUtil.js'
	};


module.exports = {
	'conf': cache.conf,
	'mime': cache.mime,
	'util': cache.util,
	'notice': cache.notice,

	'load': function(mod){
		if (!cache[mod]) {
			if (!modPath[mod]) {
				cache.notice.error('SYS', 'mod('+mod+') do not defined');
				return {};
			}
			cache[mod] = require(modPath[mod]);
		}

		return cache[mod];
	}
};