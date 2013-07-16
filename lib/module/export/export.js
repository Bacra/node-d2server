var fs = require('fs'),
	gcc = require('gcc'),
	yui = require('yuicompressor'),

	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf,
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
	var mapfile = projConf.root + _conf.StyleMapFile,
		mainTask = util.task(function(){
			notice.log('export', 'Everything is done');
		});


	// 处理fileMap中的文件
	util.eachObject(projConf.sourceLink, function(outFile, linkFiles){
		linkFiles = excludeTestFile(linkFiles);

		var wait = linkFiles.length;
		if (!wait) {
			notice.warn('export', 'file map is empty', outFile);
			return;
		}

		var outFileExtname = util.getExtname(outFile).toLowerCase(),
			query = util.query(mainTask.complete),
			_cont;

	
		if (outFileExtname == 'js') {
			query.join(function(nextFunc){
				combo.file(linkFiles, '\n\n\n', function(buf){
					_cont = buf.toString();
					nextFunc();
				});
			});
			
		} else if (outFileExtname == 'css' || outFileExtname == 'less') {
			query.join(function(nextFunc){
				_cont = [];
				var task = util.task(function(){
					_cont = _cont.join('\n\n\n');
					nextFunc();
				});

				linkFiles.forEach(function(srcFile, index){
					task.add(function(complete){
						fs.readFile(srcFile, function(err, buf){
							if (err) {
								notice.warn('export', err, srcFile);
							} else if (util.getExtname(srcFile).toLowerCase() == 'less') {
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

		} else {
			// 字节合并的文件
			notice.warn('export', outFileExtname+' can not splice', outFile);
			
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

			mainTask.add(function(){
				query.start();
			});
			return;
		}


		// js css转化样式名
		if (projConf.MinCssName) {
			query.join(function(nextFunc){
				convertCss[(outFileExtname == 'js' ? 'js' : 'css')](_cont, projConf, mapfile, function(cont){
					_cont = cont;
					nextFunc();
				});
			});
		}



		// 压缩
		var fileWidthoutExtname = outFile.substring(0, outFile.length - outFileExtname.length),
			nominFile, minFile;
		if (util.endsWidth(fileWidthoutExtname, '.min.')) {
			nominFile = fileWidthoutExtname.substring(0, fileWidthoutExtname.length - 4) + outFileExtname;
			minFile = outFile;
		} else {
			minFile = outFile;
			nominFile = fileWidthoutExtname + 'origin.'+outFileExtname;
		}

		// 保留一份未压缩版本
		query.join(function(nextFunc){
			util.writeFile(nominFile, _cont);
			// notice.log('export', 'sync nominFile success', nominFile);
			nextFunc();
		});

		if (outFileExtname == 'js') {
			query.join(function(nextFunc, endFunc){
				gcc.compile(nominFile, function(err, cont, extra){
					if (err) {
						notice.warn('js compile', err, outFile);
						endFunc();
					} else {
						util.writeFile(minFile, cont);
						// notice.log('export', 'sync minFile success', minFile);
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
						util.writeFile(minFile, cont);
						// notice.log('export', 'sync minFile success', minFile);
						nextFunc();
					}
				});
			});
		}

		mainTask.add(function(){
			query.start();
		});
	});



	// 处理html
	util.eachObject(projConf.HTMLData, function(srcFile, outFiles){
		var query = util.query(mainTask.complete),
			_cont;

		// 读取文件内容
		query.join(function(nextFunc, endFunc){
			fs.readFile(srcFile, function(err, buf){
				if (err) {
					notice.warn('export', err, srcFile);
					endFunc();
				} else {
					_cont = buf.toString();
					nextFunc();
				}
			});
		});

		// 将一个源文件编辑成多个HTML副本文件
		query.join(function(mainNextFunc, mainEndFunc){
			var task = util.task(mainNextFunc);

			util.eachObject(outFiles, function(outFile, fileConf){
				var query2 = util.query(task.complete),
					_cont2 = parseHTML(_cont, srcFile, Object.create(fileConf));


				if (projConf.MinCssName) {
					query2.join(function(nextFunc){
						// 编译html内容 + cssname替换+保存
						convertCss.html(_cont2, projConf, mapfile, function(cont){
							_cont2 = cont;
							nextFunc();
						});
					});
				}

				query2.join(function(nextFunc){
					util.writeFile(outFile, _cont2);
					nextFunc();
				});

				task.add(function(){
					query2.start();
				});
			});

			// HTML副本任务开始
			task.start();
		});

		mainTask.add(function(){
			query.start();
		});
	});


	mainTask.start();
};