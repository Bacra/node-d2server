var ejs = require('./getEjs.js'),
	
	mod = require('../../mod.js'),
	_conf = mod.conf,
	path = require('path'),
	mimeTag = mod.load('mimeTag'),
	d2fsJS = mod.load('d2fsJS');


function getIoScriptTag(dirname){
	return '\n'+mimeTag.js(d2fsJS.socketUri)+'\n'+mimeTag.js(d2fsJS.getD2fsUri(dirname));
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

	var tpl = projConf.cacheTpl[file] || (projConf.cacheTpl[file] = ejs.compile(cont, {
				'filename': file,		// 解析include需要 ejs还需要做debug参数
				'cache': false,
				'projConf': projConf,
				'open': _conf.EJS_openTag,
				'close': _conf.EJS_closeTag,
				'htmlVirtualFileDirname': options.htmlVirtualFileDirname	// 解析script link资源需要（转化为绝对路径）
			}));

	return tpl(options.data);
}


function parseHTMLwithoutCache(cont, file, options) {
	return ejs.compile(cont, {
				'filename': file,
				'cache': false,
				'projConf': options.projConf,
				'noConvertSource': true,
				'open': _conf.EJS_openTag,
				'close': _conf.EJS_closeTag,
				'htmlVirtualFileDirname': options.htmlVirtualFileDirname
			})(options.data);
}





module.exports = {
	'parse4splice': function(cont, file, options) {
		return parseHTMLwithoutCache(getIncludeCont(cont, file, options) + getIoScriptTag(options.projConf.dirname), file, options);
	},
	'parse4export': function(cont, file, options){
		return parseHTMLwithoutCache(getIncludeCont(cont, file, options), file, options);
	},
	'parse4cache': function(cont, file, callback, errorCallback, options){
		try {
			callback(parseHTML(getIncludeCont(cont, file, options) + getIoScriptTag(options.projConf.dirname), file, options));
		} catch (err) {
			errorCallback(err);
		}
	}
};