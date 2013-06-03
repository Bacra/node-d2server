var ejs = require('ejs'),
	htmlTpl = require('./htmlTpl.js'),
	_conf = require('../../conf.js'),
	infoUrl = 'http://'+_conf.Domain+':'+_conf.infoServPort+'/',

	path = require('path');



function getIoScriptStr(root){
	return '\n<script type="text/javascript" src="'+infoUrl+'socket.io/socket.io.js"></script>\n<script type="text/javascript" src="'+infoUrl+'d2fs.js?root='+encodeURIComponent(root)+'"></script>';
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
	cont = htmlTpl(cont, file, options, parseHTML);		// 预处理文本内容
	cont = appConf.convertSource4HTML(cont);

	var tpl = appConf.cacheTpl[file] || (appConf.cacheTpl[file] = ejs.compile(cont, {'filename': file, 'cache': false}));

	return tpl(options.data);
}


function parseHTMLwithoutCache(cont, file, options) {
	cont = htmlTpl(cont, file, options, parseHTMLwithoutCache);		// 预处理文本内容
	return ejs.compile(cont, {'filename': file, 'cache': false})(options.data);
}





module.exports = {
	'parse4file': function(cont, file, options){
		return parseHTMLwithoutCache(getIncludeCont(cont, file, options), file, options);
	},
	'parse4serv': function(cont, file, callback, errorCallback, options){
		try {
			callback(parseHTML(getIncludeCont(cont, file, options) + getIoScriptStr(options.appConf.root), file, options));
		} catch (err) {
			errorCallback(err);
		}
	}
};