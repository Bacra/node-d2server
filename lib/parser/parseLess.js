var less = require('less'),
	path = require('path');

// 解析less文件
module.exports = function (cont, file, callback, errorCallback, options){
	try {
		var parser = new(less.Parser)({
			paths: [path.dirname(file)],
			filename: path.basename(file)
		});

		if (options && options.baseLessCont) cont = options.baseLessCont + cont;

		parser.parse(cont, function (err, tree) {
			if (err) {
				errorCallback(err);
				return;
			}
			cont = tree.toCSS();
			cont = cont.replace(/([\w-]) +\.(--|__)/g, '$1$2');		// BEM支持
			callback(cont);
		});
	} catch (err) {
		errorCallback(err.message);
	}
};