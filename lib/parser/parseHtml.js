var ejs = require('./getEjs.js'),
	_conf = require('../../conf.js'),
	path = require('path'),
	mimeTag = require('../mimeTag.js'),
	extJSuri = require('../extJSuri.js');


function getIoScriptTag(root){
	return '\n'+mimeTag.js(extJSuri.socketUri)+'\n'+mimeTag.js(extJSuri.getD2fsUri(root));
}

function getIncludeTpl(path, isBegin){
	var str = '<% include '+path+' %>';
	if (isBegin) {
		str += '\n\n\n\n\n\n<!-- Content Begin -->\n';
	} else {
		str = '\n<!-- Content End -->\n\n\n\n\n\n' + str;
	}
	return str;
}

function getIncludeCont(cont, file, options) {
	var root = options.appConf.root+_conf.SourcePath,
		fileRoot = path.dirname(file);		// relative不晓得为什么，会多出一级来，貌似文件也当作了一集，所以^^
	if (options.footer) cont += getIncludeTpl(path.relative(fileRoot, root+options.footer));
	if (options.header) cont = getIncludeTpl(path.relative(fileRoot, root+options.header), true) + cont;
	
	return cont;
}


// options 必须包含如下内容
// data  appConf
function parseHTML(cont, file, options) {
	var appConf = options.appConf;

	var tpl = appConf.cacheTpl[file] || (appConf.cacheTpl[file] = ejs.compile(cont, {'filename': file, 'cache': false, 'appConf': appConf}));

	return tpl(options.data);
}


function parseHTMLwithoutCache(cont, file, options) {
	return ejs.compile(cont, {'filename': file, 'cache': false, 'appConf': options.appConf, 'noConvertSource': true})(options.data);
}





module.exports = {
	'parse4splice': function(cont, file, options) {
		return parseHTMLwithoutCache(getIncludeCont(cont, file, options) + getIoScriptTag(options.appConf.root), file, options);
	},
	'parse4export': function(cont, file, options){
		return parseHTMLwithoutCache(getIncludeCont(cont, file, options), file, options);
	},
	'parse4cache': function(cont, file, callback, errorCallback, options){
		try {
			callback(parseHTML(getIncludeCont(cont, file, options) + getIoScriptTag(options.appConf.root), file, options));
		} catch (err) {
			errorCallback(err);
		}
	}
};