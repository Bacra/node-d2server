var fs = require('fs'),
	gcc = require('gcc'),
	yui = require('yuicompressor'),

	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf,
	Query = mod.load('Query'),
	Task = mod.load('Task'),
	combo = mod.load('combo'),
	convertCss = mod.load('convertCss'),
	parseHTML = mod.load('parseHTML').parse4export,
	parseLess = mod.load('parseLess');


// 排除测试用的文件
var _testReg = /\.test\.\w{1,5}$/i;
function excludeTestFile(files){
	var arr = [];
	files.forEach(function(file){
		if (_testReg.test(file)) {
			notice.log('export', 'The test file will exclude', file);
		} else {
			arr.push(file);
		}
	});
	return arr;
}





// 导出的时候，不使用cache数据，而是直接读取文件
module.exports = function(projConf){
	var styleMapfile = projConf.root + _conf.StyleMapFile,
		styleMapConf = convertCss.readConfig(styleMapfile),
		mainTask = Task(function(){
			convertCss.saveConfig(styleMapfile, styleMapConf);
			notice.log('export', 'Everything is done');
		});


	// 处理fileMap中的文件
	util.eachObject(projConf.sourceLink, function(outFile, linkFiles){
		if (projConf.catalog) outFile = projConf.removeCatalog(outFile);

		linkFiles = excludeTestFile(linkFiles);

		var wait = linkFiles.length;
		if (!wait) {
			notice.warn('export', 'file map is empty', outFile);
			return;
		}

		var outFileExtname = util.getExtname(outFile),
			outFileType = outFileExtname.toLowerCase(),
			query = Query(mainTask.complete),
			_cont;

	
		if (outFileType == 'js' || outFileType == 'css' || outFileType == 'less') {
			if (outFileType == 'js') {
				query.join(function(nextFunc){
					combo.file(linkFiles, '\n\n\n', function(buf){
						_cont = buf.toString();
						nextFunc();
					});
				});
			} else {
				query.join(function(nextFunc){
					_cont = [];
					var task = Task(function(){
						_cont = _cont.join('\n\n\n');
						nextFunc();
					});

					linkFiles.forEach(function(srcFile, index){
						task.add(function(complete){
							fs.readFile(srcFile, function(err, buf){
								if (err) {
									notice.warn('export', err, srcFile);
								} else if (util.getExtname(srcFile) == 'less') {
									parseLess(buf.toString(), srcFile, function(cont){
										_cont[index] = cont;
									}, function(err){
										notice.warn('export', err, srcFile);
									}, projConf);
								} else {
									_cont[index] = buf.toString();
								}

								complete();
							});
						});
					});

					task.start();
				});
			}

			
			// js css转化样式名
			if (projConf.MinCssName) {
				query.join(function(nextFunc){
					_cont = convertCss[(outFileType == 'js' ? 'parse' : 'parseWidthPrefix')](_cont, projConf, styleMapConf);
					nextFunc();
				});
			}


			// 压缩
			var fileWidthoutExtname = outFile.substring(0, outFile.length - outFileExtname.length),
				nominFile;
			if (util.endsWidth(fileWidthoutExtname, '.min.')) {
				nominFile = fileWidthoutExtname.substring(0, fileWidthoutExtname.length - 4) + outFileExtname;
			} else {
				nominFile = fileWidthoutExtname + 'origin.'+outFileExtname;
			}

			// 保留一份未压缩版本
			query.join(function(nextFunc){
				util.writeFile(nominFile, _cont);
				// notice.log('export', 'sync nominFile success', nominFile);
				nextFunc();
			});

			if (outFileType == 'js') {
				query.join(function(nextFunc, endFunc){
					gcc.compile(nominFile, function(err, cont, extra){
						if (err) {
							notice.warn('js compile', err, outFile);
							endFunc();
						} else {
							_cont = cont;
							util.writeFile(outFile, cont);
							// notice.log('export', 'sync outFile success', outFile);
							nextFunc();
						}
					});
				});
			} else {
				query.join(function(nextFunc, endFunc){
					yui.compress(_cont, {type: 'css'}, function(err, cont, extra) {
						if (err) {
							notice.warn('css compile', err, outFile);
							endFunc();
						} else {
							_cont = cont;
							util.writeFile(outFile, cont);
							// notice.log('export', 'sync outFile success', outFile);
							nextFunc();
						}
					});
				});
			}


		} else {
			// 字节合并的文件
			notice.warn('export', outFileType+' can not splice', outFile);
			
			jquery.join(function(nextFunc, endFunc){
				combo.file(linkFiles, function(buf){
					_cont = buf;
					nextFunc();
				});
			});

			jquery.join(function(nextFunc){
				util.writeFile(outFile, _cont);
				nextFunc();
			});
		}



		// 同步文件
		if (projConf.sync) {
			query.join(function(nextFunc){
				util.writeFile(projConf.sync + outFile.substring(projConf.root.length), _cont);
				nextFunc();
			});
		}

		mainTask.add(function(){
			query.start();
		});
	});



	// 处理html
	var HTMLcont = {};
	util.eachObject(projConf.HTMLData, function(virtualFile, fData){
		var query = Query(mainTask.complete),
			srcFile = fData.srcFile,
			_cont;


		// 读取文件内容
		query.join(function(nextFunc, endFunc){
			if (HTMLcont[srcFile]) {
				_cont = HTMLcont[srcFile];
				nextFunc();
			} else {
				fs.readFile(srcFile, function(err, buf){
					if (err) {
						notice.warn('export', err, srcFile);
						endFunc();
					} else {
						_cont = buf.toString();
						HTMLcont[srcFile] = _cont;
						nextFunc();
					}
				});
			}
		});


		query.join(function(nextFunc){
			// 编译html内容 + cssname替换+保存
			_cont = parseHTML(_cont, srcFile, fData);
			if (projConf.MinCssName) _cont = convertCss.parse(_cont, projConf, styleMapConf);
			util.writeFile(fData.outFile, _cont);
			nextFunc();
		});


		mainTask.add(function(){
			query.start();
		});
	});

	// 启动所有任务
	mainTask.start();
};