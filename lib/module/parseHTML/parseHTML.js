var ejs = require('./ejs.extend.js'),
	
	mod = require('../../mod.js'),
	_conf = mod.conf,
	path = require('path'),
	d2fsJS = mod.load('d2fsJS');



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
	cont = getIncludeCont(cont, file, options);

	var projConf = options.projConf,
		tpl = projConf.cacheTpl[file] || (projConf.cacheTpl[file] = ejs.compile(cont, {
				'filename': file,		// 解析include需要 ejs还需要做debug参数
				'cache': false,
				'projConf': projConf,
				'open': _conf.EJS_openTag,
				'close': _conf.EJS_closeTag
			}));

	return projConf.convertSource4HTML(tpl(options.data), options.htmlVirtualFileDirname);
}


function parseHTMLwithoutCache(cont, file, options) {
	cont = getIncludeCont(cont, file, options);

	return ejs.compile(cont, {
				'filename': file,
				'cache': false,
				'projConf': options.projConf,
				'open': _conf.EJS_openTag,
				'close': _conf.EJS_closeTag
			})(options.data);
}





module.exports = {
	'parse4splice': function(cont, file, options) {
		return parseHTMLwithoutCache(cont, file, options) + d2fsJS.getScriptTag(options.projConf.dirname);
	},
	'parse4export': function(cont, file, options){
		return parseHTMLwithoutCache(cont, file, options);
	},
	'parse4cache': function(cont, file, callback, errorCallback, options){
		try {
			callback(parseHTML(cont, file, options) + d2fsJS.getScriptTag(options.projConf.dirname));
		} catch (err) {
			errorCallback(err);
		}
	}
};