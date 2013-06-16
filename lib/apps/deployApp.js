var fs = require('fs'),
	notice = require('../notice.js'),
	util = require('../util.js'),
	_conf = require('../../conf.js'),
	AppConfig = require('../appconfig.js');


var _exampleRoot = __dirname+'/../../template/',
	_appTpls = {},
	_appnameReg = /\{@appName\}/;


// 初始化所有的配置方案
fs.readdirSync(_exampleRoot).forEach(function(v){
	if (v == '..' || v=='.') return;

	var planRoot = _exampleRoot + v+'/',
		confFile = planRoot + _conf.AppConfigFile;

	if (!fs.existsSync(confFile)) {
		notice.warn('deploy', 'The plan do not has appconf file', v);
		return;
	}

	_appTpls[v] = {};
	readDir(planRoot, '', _appTpls[v]);
});


function readDir(root, path, appTpl){
	fs.readdirSync(root).forEach(function(v){
		if (v == '..' || v=='.') return;

		if (fs.statSync(root+v).isFile()) {
			appTpl[path+v] = fs.readFileSync(root+v);
		} else {
			readDir(root+v+'/', path+v+'/', appTpl);
		}
	});
}




module.exports = function(appName, plan){
	var root = _conf.DocumentRoot + appName +'/',
		confFile = root+_conf.AppConfigFile;
	if (!fs.existsSync(confFile)) {

		plan = !plan || !_appTpls[plan] ? _appTpls['default'] : _appTpls[plan];
		try {
			util.eachObject(plan, function(i, v){
				if (_appnameReg.test(v.toString())) v = v.toString().replace(_appnameReg, appName);
				util.writeFile(root+i, v);
			});
			
			AppConfig.init(util.parsePath(root));
			
			// 创建可能遗漏的目录
			var path = root+_conf.SourcePath;
			if (!fs.existsSync(path)) util.mkdirs(path);
			path = root+_conf.DynamicDataPath;
			if (!fs.existsSync(path)) util.mkdirs(path);

			notice.log('Object Init', 'Object create success');
		} catch(err) {
			notice.error('', err);
		}
	} else {
		notice.warn('Object Init', 'Object is exists', root);
	}
};


