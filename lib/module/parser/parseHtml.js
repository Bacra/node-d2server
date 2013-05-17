var ejs = require('ejs');

module.exports = function parseHtml(cont, file, callback, errorCallback, options) {
	try {
		cont = options.convertSource4HTML(cont);

		var tpl = options.cacheTpl[file] || (options.cacheTpl[file] = ejs.compile(cont, {
			'filename': file
		}));

		callback(tpl(options || {}));
	} catch (err) {
		errorCallback(err);
	}
};