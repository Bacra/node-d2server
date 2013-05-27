var ejs = require('ejs'),
	htmlTpl = require('./htmlTpl.js'),
	infoServPort = require('../../conf.js').infoServPort,
	ioScriptStr = '\n<script type="text/javascript" src="//www.test.com:'+infoServPort+'/socket.io/socket.io.js"></script>\n<script type="text/javascript" src="//www.test.com:'+infoServPort+'/d2fs.js"></script>';


// options 必须包含如下内容
// data  appConf
var parseHTML = function(cont, file, options) {
	var appConf = options.appConf;
	cont = htmlTpl(cont, file, options, parseHTML);		// 预处理文本内容
	cont = appConf.convertSource4HTML(cont);

	var tpl = appConf.cacheTpl[file] || (appConf.cacheTpl[file] = ejs.compile(cont, {'filename': file, 'cache': false}));

	return tpl(options.data);
};



module.exports = {
	'parse4file': function(cont, file, options){
		return ejs.compile(htmlTpl(cont, file, options, parseHTML), {'filename': file, 'cache': false})(options.data);
	},
	'parse4serv': function(cont, file, callback, errorCallback, options){
		try {
			callback(parseHTML(cont+ioScriptStr, file, options));
		} catch (err) {
			errorCallback(err);
		}
	}
};