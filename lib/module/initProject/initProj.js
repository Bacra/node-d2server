var fs = require('fs'),
	notice = require('../notice.js'),
	util = require('../util.js'),
	_conf = require('../../conf.js'),
	ProjConfig = require('../ProjConfig.js');


var _exampleRoot = __dirname+'/../../template/',
	_projTpls = {},
	_projnameReg = /\{@projRoot\}/g;


// 初始化所有的配置方案
fs.readdirSync(_exampleRoot).forEach(function(v){
	if (v == '..' || v=='.') return;

	var planRoot = _exampleRoot + v+'/',
		confFile = planRoot + _conf.MainConfigFile;

	if (!fs.existsSync(confFile)) {
		notice.warn('deploy', 'The plan('+v+') do not has projconf file');
		return;
	}

	_projTpls[v] = {};
	readDir(planRoot, '', _projTpls[v]);
});

// 必须检查 default是否存在
if (!_projTpls['default']) notice.error('deploy', 'Do not has `default` plan');



function readDir(root, path, projTpl){
	fs.readdirSync(root).forEach(function(v){
		if (v == '..' || v=='.') return;

		if (fs.statSync(root+v).isFile()) {
			projTpl[path+v] = fs.readFileSync(root+v);
		} else {
			readDir(root+v+'/', path+v+'/', projTpl);
		}
	});
}




module.exports = function(projName, plan){
	var root = _conf.DocumentRoot + projName +'/',
		confFile = root+_conf.ProjConfigFile;
	if (!fs.existsSync(confFile)) {

		if (!plan || !_projTpls[plan]) {
			notice.warn('deploy', 'The plan('+plan+') switch to `default`');
			plan = _projTpls['default'];
		} else {
			plan = _projTpls[plan];
		}
		try {
			util.eachObject(plan, function(i, v){
				if (_projnameReg.test(v.toString())) v = v.toString().replace(_projnameReg, projName);
				util.writeFile(root+i, v);
			});
			
			// 创建可能遗漏的目录
			var path = root+_conf.SourcePath;
			if (!fs.existsSync(path)) util.mkdirs(path);
			path = root+_conf.DynamicDataPath;
			if (!fs.existsSync(path)) util.mkdirs(path);

			// 初始化项目
			if (ProjConfig.reload(projName, true)) notice.log('Object Init', 'Object create success');
		} catch(err) {
			notice.error('', err);
		}
	} else {
		notice.warn('Object Init', 'Object is exists', root);
	}
};

