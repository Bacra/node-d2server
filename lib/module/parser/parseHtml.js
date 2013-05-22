var ejs = require('ejs'),
	htmlTpl = require('./htmlTpl.js'),
	infoServPort = require('../../conf.js').infoServPort,
	ioScriptStr = '\n<script type="text/javascript" src="//www.test.com:'+infoServPort+'/socket.io/socket.io.js"></script>\n<script type="text/javascript" src="//www.test.com:'+infoServPort+'/d2fs.js"></script>';


// options 必须包含如下内容
// data  appConf
var parseHTML = function(cont, file, options) {
	var appConf = options.appConf;
	cont = htmlTpl(cont, file, options, parseHTML);		// 预处理文本内容

	var tpl = appConf.cacheTpl[file] || (appConf.cacheTpl[file] = ejs.compile(cont, {'filename': file}));

	return tpl(options.data);
};






module.exports = {
	'parse': parseHTML,
	'parseCall': function(cont, file, callback, errorCallback, options){
		try {
			callback(parseHTML(cont+ioScriptStr, file, options));
		} catch (err) {
			errorCallback(err);
		}
	}
};