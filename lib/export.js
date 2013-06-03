var fs = require('fs'),
	util = require('./util.js'),
	notice = require('./notice.js'),
	StyleMapFile = require('../conf.js').StyleMapFile,
	convertCss = require('./parser/convertCss.js'),
	parseHTML = require('./parser/parseHTML.js').parse4file,
	parseLess = require('./parser/parseLess.js'),
	_testReg = /\.test\.\w{1,5}$/i;


// 导出的时候，不使用cache数据，而是直接读取文件
module.exports = function(appConf){
	var mapfile = appConf.root + StyleMapFile,
		styleQueryLen = 0,
		styleQueryEnd = function(){
			if (!--styleQueryLen) convertCss.save(mapfile);
		};

	// 处理fileMap中的文件
	util.eachObject(appConf.sourceLink, function(outFile, linkFiles){
		styleQueryLen++;

		var wait = linkFiles.length;
		if (!wait) {
			notice.warn('export', 'file map is empty', outFile);
			return;
		}

		var outFileExtname = util.getExtname(outFile),
			query = util.query(),
			cont = [],
			fileReadEnd = function(nextFunc){
				if (!--wait) {
					cont = cont.join('\n\n\n');
					nextFunc();
				}
			},
			convertCssType;

		
		try {
			if (outFileExtname == 'js') {
				convertCssType = 'js';

				query(function(nextFunc){
					linkFiles.forEach(function(srcFile, index){
						if (_testReg.test(srcFile)) {
							fileReadEnd(nextFunc);
							return;
						}
						fs.readFile(srcFile, function(err, buf){
							if (err) {
								notice.warn('export', err, srcFile);
							} else {
								cont[index] = buf.toString();
							}

							fileReadEnd(nextFunc);
						});
					});
				});
				
			} else if (outFileExtname == 'css' || outFileExtname == 'less') {
				convertCssType = 'css';

				query(function(nextFunc){
					linkFiles.forEach(function(srcFile, index){
						if (_testReg.test(srcFile)) {
							fileReadEnd(nextFunc);
							return;
						}

						fs.readFile(srcFile, function(err, buf){
							
							if (err) {
								notice.warn('export', err, srcFile);
							} else if (util.getExtname(srcFile) == 'css') {
								cont[index] = buf.toString();
							} else {
								parseLess(buf.toString(), srcFile, function(cont2){
									cont[index] = cont2;
									fileReadEnd(nextFunc);
								}, function(err){
									notice.warn('export', err, srcFile);
									fileReadEnd(nextFunc);
								}, appConf);
								return;
							}

							fileReadEnd(nextFunc);
						});
					});
				});

				
			} else {
				cont = fs.readFileSync(srcFile);
				util.writeFile(outFile, cont);
				return;
			}


			query(function(nextFunc){
				convertCss[convertCssType](cont, mapfile, function(cont2){
					cont = cont2;
					styleQueryEnd();
					nextFunc();
				});
			});

			query(function(nextFunc){
				fs.writeFile(outFile, cont);
				nextFunc();
			});

		} catch (err) {
			notice.warn('exports', err);
		}
	});



	// 处理html
	util.eachObject(appConf.HTMLData, function(srcFile, outFiles){
		styleQueryLen++;

		fs.readFile(srcFile, function(err, buf){
			if (err) {
				notice.warn('export', err, srcFile);
				return;
			}

			util.eachObject(outFiles, function(outFile, fileConf){
				// 编译html内容 + cssname替换+保存
				convertCss.html(parseHTML(buf.toString(), srcFile, Object.create(fileConf)), mapfile, function(cont){
					styleQueryEnd();
					util.writeFile(outFile, cont);
				});
			});
		});
	});
};