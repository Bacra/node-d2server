var fs = require('fs'),
	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf,
	ProjConfig = mod.load('ProjConfig'),
	reloadProjConfig = require('./reloadProjConfig.js');




// 每xxx分钟，清除缓存一次
setInterval(ProjConfig.clearCache, _conf.AutoClearCache);
if (!fs.existsSync(_conf.DocumentRoot)) {
	util.mkdirs(_conf.DocumentRoot);
	notice.warn('SYS', 'Create DocumentRoot auto', _conf.DocumentRoot);
}

// 初始化项目属性
fs.readdir(_conf.DocumentRoot, function(err, files) {
	if (err) {
		notice.error('SYS', err, _conf.DocumentRoot);
		return;
	}
	files.forEach(function(dirname){
		if (dirname != '.'&& dirname != '..') initProjConfig(dirname);
	});
});


// 监视整个目录，动态获取项目配置信息
// 仅仅针对初始化，其他导致文件夹改变的操作，不做处理
fs.watch(_conf.DocumentRoot, function(e, dirname){
	if (ProjConfig.projDirname[dirname] || e == 'change') return;
	initProjConfig(dirname);
});


// 附加了配置文件的存在判断
function initProjConfig(dirname){
	var file = _conf.DocumentRoot +dirname+'/'+_conf.MainConfigFile;
	fs.exists(file, function(exists){
		if (exists) {
			reloadProjConfig(dirname, function(mainConf){
				if (mainConf) new ProjConfig.class(dirname, mainConf);
			});
		} else {
			fs.watchFile(file, function(curr, prev){
				fs.unwatchFile(file, arguments.callee);
				initProjConfig(dirname);
			});
		}
	});
}
