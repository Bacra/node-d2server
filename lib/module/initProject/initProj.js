var fs = require('fs'),
	mod = require('../../mod.js'),
	notice = mod.notice,
	util = mod.util,
	_conf = mod.conf,
	ProjConfig = mod.load('ProjConfig');


var _exampleRoot = mod.dirname+'/../template/',
	_projTpls = {},
	_projnameTestReg = /\{@projRoot\}/,
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
if (!_projTpls['default']) notice.error('Object Init', 'Do not has `default` plan');



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
	if (!util.fileExists(confFile)) {

		if (!plan || !_projTpls[plan]) {
			notice.log('deploy', 'The plan('+plan+') switch to `default`');
			plan = _projTpls['default'];
		} else {
			plan = _projTpls[plan];
		}
		try {
			util.eachObject(plan, function(i, v){
				var cont = v.toString();
				if (_projnameTestReg.test(cont)) v = cont.replace(_projnameReg, projName);
				util.writeFile(root+i, v);
			});
			
			// 创建可能遗漏的目录
			var path = root+_conf.SourcePath;
			if (!fs.existsSync(path)) util.mkdirs(path);
			// path = root+_conf.DynamicDataPath;
			// if (!fs.existsSync(path)) util.mkdirs(path);

			// 初始化项目
			if (ProjConfig.reload(projName, true)) notice.log('Object Init', 'Object create success');
		} catch(err) {
			notice.error('', err);
		}
	} else {
		notice.warn('Object Init', 'Object is exists', root);
	}
};


