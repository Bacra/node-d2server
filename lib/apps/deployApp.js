var fs = require('fs'),
	notice = require('../notice.js'),
	util = require('../util.js'),
	_conf = require('../../conf.js'),
	AppConfig = require('../AppConfig.js');


var _exampleRoot = __dirname+'/../../template/',
	_appTpls = {},
	_appnameReg = /\{@appRoot\}/g;


// 初始化所有的配置方案
fs.readdirSync(_exampleRoot).forEach(function(v){
	if (v == '..' || v=='.') return;

	var planRoot = _exampleRoot + v+'/',
		confFile = planRoot + _conf.MainConfigFile;

	if (!fs.existsSync(confFile)) {
		notice.warn('deploy', 'The plan('+v+') do not has appconf file');
		return;
	}

	_appTpls[v] = {};
	readDir(planRoot, '', _appTpls[v]);
});

// 必须检查 default是否存在
if (!_appTpls['default']) notice.error('deploy', 'Do not has `default` plan');



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

		if (!plan || !_appTpls[plan]) {
			notice.warn('deploy', 'The plan('+plan+') switch to `default`');
			plan = _appTpls['default'];
		} else {
			plan = _appTpls[plan];
		}
		try {
			util.eachObject(plan, function(i, v){
				if (_appnameReg.test(v.toString())) v = v.toString().replace(_appnameReg, appName);
				util.writeFile(root+i, v);
			});
			
			// 创建可能遗漏的目录
			var path = root+_conf.SourcePath;
			if (!fs.existsSync(path)) util.mkdirs(path);
			path = root+_conf.DynamicDataPath;
			if (!fs.existsSync(path)) util.mkdirs(path);

			// 初始化项目
			if (AppConfig.reload(appName, true)) notice.log('Object Init', 'Object create success');
		} catch(err) {
			notice.error('', err);
		}
	} else {
		notice.warn('Object Init', 'Object is exists', root);
	}
};


