var fs = require('fs'),
	notice = require('./notice.js'),
	util = require('./util.js'),
	_conf = require('../conf.js'),
	mime = require('../mime.js');


function loadNpm(path){
	return require(path);
}

function getFileExtname(file){
	if (fs.existsSync(file+'.json')) return 'json';
	if (fs.existsSync(file+'.js')) return 'js';
	if (fs.existsSync(file+'.html')) return 'html';
	if (fs.existsSync(file+'.xml')) return 'xml';
	return '';
}

function readDateFile(file){
	try {
		return fs.readFileSync(file);
	} catch(err) {
		util.writeFile(file, '');
		notice.log('dataAPI', 'data file create', file);
		return '';
	}
}

function sendData(file, res, appConf, wait, step, extname){
	if (step > 0) {
		var stepDate = appConf.dataAPIStep[file];
		file += '&&_step'+(appConf.dataAPIStep[file] = !stepDate || step < ++stepDate ? 1 : stepDate);
	}

	if (!extname) extname = getFileExtname(file);
	if (extname) file += '.'+extname;

	var cont = readDateFile(file);

	if (cont.length) {
		res.writeHead(200, {
			'Content-Type': mime(extname)
		});
	} else {
		res.statusCode = 404;
	}

	if (wait) {
		setTimeout(function(){
			res.end(cont);
		}, wait);
	} else {
		res.end(cont);
	}
}

function getDateFile(pathname, query, req){
	var filename = pathname.substring(1).replace(/[\/\\]/g, '_') + '/' + util.sortAndStringifyJSON(query);
	if (req.method == "POST") filename += '&&_post';

	return filename;
}




module.exports = function(confDataAPI, appConf){
	return function(uri, res, req){
		var rs = confDataAPI(uri, {
			'res': res,
			'req': req,
			'root': appConf.root,
			'isPost': function(){
				return req.method == "POST";
			},
			'loadNpm': loadNpm
		});

		if (rs) {
			var filename = rs.filename || getDateFile(rs.pathname || uri.pathname, rs.query || uri.query, req);
			sendData(appConf.root+_conf.DynamicDataPath+filename, res, appConf, rs.wait, rs.step, rs.extname);

			return true;
		}
		return false;
	};
};
	