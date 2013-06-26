var ejs = require('./htmlTpl.js'),
	_conf = require('../../conf.js'),
	infoUrl = 'http://'+_conf.Domain+':'+_conf.InfoServPort+'/',

	path = require('path');



function getIoScriptStr(root){
	return '\n<script type="text/javascript" src="'+infoUrl+'socket.io/socket.io.js" charset="utf-8"></script>\n<script type="text/javascript" src="'+infoUrl+'devServ/d2fs.min.js?root='+encodeURIComponent(root)+'" charset="utf-8"></script>';
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
		return parseHTMLwithoutCache(getIncludeCont(cont, file, options) + getIoScriptStr(options.appConf.root), file, options);
	},
	'parse4export': function(cont, file, options){
		return parseHTMLwithoutCache(getIncludeCont(cont, file, options), file, options);
	},
	'parse4cache': function(cont, file, callback, errorCallback, options){
		try {
			callback(parseHTML(getIncludeCont(cont, file, options) + getIoScriptStr(options.appConf.root), file, options));
		} catch (err) {
			errorCallback(err);
		}
	}
};