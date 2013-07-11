var ejs = require('./getEjs.js'),
	
	mod = require('../../mod.js'),
	_conf = mod.conf,
	path = require('path'),
	mimeTag = mod.load('mimeTag'),
	extraJS = mod.load('extraJS');


function getIoScriptTag(root){
	return '\n'+mimeTag.js(extraJS.socketUri)+'\n'+mimeTag.js(extraJS.getD2fsUri(root));
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
	var root = options.projConf.root+_conf.SourcePath,
		fileRoot = path.dirname(file);		// relative不晓得为什么，会多出一级来，貌似文件也当作了一集，所以^^
	if (options.footer) cont += getIncludeTpl(path.relative(fileRoot, root+options.footer));
	if (options.header) cont = getIncludeTpl(path.relative(fileRoot, root+options.header), true) + cont;
	
	return cont;
}


// options 必须包含如下内容
// data  projConf
function parseHTML(cont, file, options) {
	var projConf = options.projConf;

	var tpl = projConf.cacheTpl[file] || (projConf.cacheTpl[file] = ejs.compile(cont, {'filename': file, 'cache': false, 'projConf': projConf}));

	return tpl(options.data);
}


function parseHTMLwithoutCache(cont, file, options) {
	return ejs.compile(cont, {'filename': file, 'cache': false, 'projConf': options.projConf, 'noConvertSource': true})(options.data);
}





module.exports = {
	'parse4splice': function(cont, file, options) {
		return parseHTMLwithoutCache(getIncludeCont(cont, file, options) + getIoScriptTag(options.projConf.root), file, options);
	},
	'parse4export': function(cont, file, options){
		return parseHTMLwithoutCache(getIncludeCont(cont, file, options), file, options);
	},
	'parse4cache': function(cont, file, callback, errorCallback, options){
		try {
			callback(parseHTML(getIncludeCont(cont, file, options) + getIoScriptTag(options.projConf.root), file, options));
		} catch (err) {
			errorCallback(err);
		}
	}
};