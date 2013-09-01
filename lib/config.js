var fs = require('fs'),
	notice = require('./func/notice.js'),
	_conf;


// 读取Server配置文件
if (fs.existsSync(__dirname+'/../conf.js')) {
	_conf = require('../conf.js');
} else {
	notice.error('SYS', 'Please edit "'+require('path').normalize(__dirname+'/../conf.js.example')+'" file and create "conf.js" file');
	throw 'sys error';
}


// 读取package的信息，并合并到_conf中
if (fs.existsSync(__dirname+'/../package.json')) {
	try {
		var json = JSON.parse(fs.readFileSync(__dirname+'/../package.json'));
		_conf.name = 'D2Server';
		_conf.version = json.version;
		_conf.homepage = json.homepage;
		_conf.repository = json.repository.url || json.repository;
		_conf.bugs = json.bugs.url || json.bugs;
		_conf.license = json.license;
	} catch(e) {
		notice.error('SYS', 'Get package infomation error');
		throw e;
	}
} else {
	notice.error('SYS', 'Can not find the package file');
	throw 'sys error';
}



module.exports = _conf;