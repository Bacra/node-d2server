var fs = require('fs'),
	path = require('path'),
	gcc = require('gcc'),
	yui = require('yuicompressor'),

	util = require('../util.js'),
	notice = require('../notice.js'),
	_conf = require('../../conf.js'),
	convertCss = require('../parser/convertCss.js'),
	parseHTML = require('../parser/parseHTML.js').parse4export,
	parseLess = require('../parser/parseLess.js'),
	_testReg = /\.test\.\w{1,5}$/,
	_minReg = /\.min$/;


// 导出的时候，不使用cache数据，而是直接读取文件
module.exports = function(appConf){
	var mapfile = appConf.root + _conf.StyleMapFile,
		rootLen = appConf.root.length - 1,
		mainQueryLen = 0,
		mainQueryEnd = function(){
			if (!--mainQueryLen) notice.log('export', 'query end');
		},
		styleQueryLen = 0,
		styleQueryEnd = function(){
			if (!--styleQueryLen) {
				// notice.log('export', 'style query end', appConf.root);
				convertCss.save(mapfile);
			}
		};


	// 处理fileMap中的文件
	util.eachObject(appConf.sourceLink, function(outFile, linkFiles){

		var wait = linkFiles.length;
		if (!wait) {
			notice.warn('export', 'file map is empty', outFile);
			return;
		}

		mainQueryLen++;

		var outFileExtname = path.extname(outFile),
			syncFile = outFile.substring(rootLen),
			query = util.query(mainQueryEnd),
			_cont = [],
			fileReadEnd = function(nextFunc){
				if (!--wait) {
					_cont = _cont.join('\n\n\n');
					// notice.log('export', 'file read and splice success', outFile);
					nextFunc();
				}
			},
			convertCssType;

		
		try {
			if (outFileExtname == '.js') {
				convertCssType = 'js';

				query.join(function(nextFunc){
					linkFiles.forEach(function(srcFile, index){
						if (_testReg.test(srcFile)) {
							fileReadEnd(nextFunc);
							return;
						}
						fs.readFile(srcFile, function(err, buf){
							if (err) {
								notice.warn('export', err, srcFile);
							} else {
								_cont[index] = buf.toString();
							}

							fileReadEnd(nextFunc);
						});
					});
				});
				
			} else if (outFileExtname == '.css' || outFileExtname == '.less') {
				convertCssType = 'css';

				query.join(function(nextFunc){
					linkFiles.forEach(function(srcFile, index){
						if (_testReg.test(srcFile)) {
							fileReadEnd(nextFunc);
							return;
						}

						fs.readFile(srcFile, function(err, buf){
							
							if (err) {
								notice.warn('export', err, srcFile);
							} else if (util.getExtname(srcFile) == 'css') {
								_cont[index] = buf.toString();
								fileReadEnd(nextFunc);
							} else {
								parseLess(buf.toString(), srcFile, function(cont){
									_cont[index] = cont;
									fileReadEnd(nextFunc);
								}, function(err){
									notice.warn('export', err, srcFile);
									fileReadEnd(nextFunc);
								}, appConf);
							}
						});
					});
				});

				
			} else {
				// 不能合并的文件类型
				notice.warn('export', outFileExtname+' can not splice', outFile);
				
				jquery.join(function(nextFunc, endFunc){
					fs.readFile(linkFiles[0], function(err, buf){
						if (err) {
							notice.warn('export', err, linkFiles[0]);
							endFunc();
						} else {
							_cont = buf;
							nextFunc();
						}
					});
				});

				jquery.join(function(nextFunc){
					util.writeFile(outFile, _cont);
					nextFunc();
				});

				if (appConf.sync) {
					jquery.join(function(nextFunc){
						util.writeFile(appConf.sync + syncFile, _cont);
						nextFunc();
					});
				}

				query.start();
				// notice.log('export', 'do complete', outFile);
				return;
			}


			// js css转化样式名
			if (appConf.MinCssName) {
				styleQueryLen++;
				query.join(function(nextFunc){
					convertCss[convertCssType](_cont, appConf.MinCssName, mapfile, function(cont){
						_cont = cont;
						styleQueryEnd();
						nextFunc();
					});
				});
			}

			// 保存文件
			query.join(function(nextFunc){
				util.writeFile(outFile, _cont);
				// notice.log('export', 'write file to object success', outFile);
				nextFunc();
			});



			// 同步及压缩
			if (appConf.sync) {
				var syncFileWidthoutExtname = syncFile.substring(0, syncFile.length - outFileExtname.length),
					nominFile, minFile;
				if (_minReg.test(syncFileWidthoutExtname)) {
					nominFile = syncFileWidthoutExtname.substring(0, syncFileWidthoutExtname.length - 4) + outFileExtname;
					minFile = syncFile;
				} else {
					minFile = syncFile;
					nominFile = syncFileWidthoutExtname + '.origin'+outFileExtname;
				}

				minFile = appConf.sync + minFile;
				nominFile = appConf.sync + nominFile;

				query.join(function(nextFunc){
					util.writeFile(nominFile, _cont);
					// notice.log('export', 'sync nominFile success', nominFile);
					nextFunc();
				});

				if (convertCssType == 'js') {
					query.join(function(nextFunc, endFunc){
						gcc.compile(outFile, function(err, cont, extra){
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
				} else if (convertCssType == 'css') {
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
			}

			query.start();

		} catch (err) {
			notice.warn('exports', err);
		}
	});



	// 处理html
	util.eachObject(appConf.HTMLData, function(srcFile, outFiles){
		mainQueryLen++;

		var query = util.query(mainQueryEnd),
			_cont;

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

		query.join(function(mainNextFunc, mainEndFunc){
			var queryLen = 0;

			util.eachObject(outFiles, function(outFile, fileConf){
				queryLen++;

				var query2 = util.query(function(){
						if (!--queryLen) mainNextFunc();
					}),
					_cont2 = parseHTML(_cont, srcFile, Object.create(fileConf));


				if (appConf.MinCssName) {
					styleQueryLen++;
					query2.join(function(nextFunc){
					// 编译html内容 + cssname替换+保存
						convertCss.html(_cont2, appConf.MinCssName, mapfile, function(cont){
							_cont2 = cont;
							styleQueryEnd();
							nextFunc();
						});
					});
				}

				query2.join(function(nextFunc){
					util.writeFile(outFile, _cont2);
					nextFunc();
				});

				if (appConf.sync) {
					query2.join(function(nextFunc){
						var syncFile = appConf.sync + outFile.substring(rootLen);
						util.writeFile(syncFile, _cont2);
						// notice.log('export', 'sync htmlFile success', syncFile);
						nextFunc();
					});
				}


				setTimeout(function(){query2.start();}, 10);			// 由于队列中不包含异步方法，所以需要手动延迟
			});

			if (!queryLen) mainNextFunc();
		});

		query.start();
	});
};