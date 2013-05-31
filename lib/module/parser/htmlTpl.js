var path = require('path'),
	fs = require('fs'),
	util = require('../../util.js'),
	
	includeReg = /<% *include +([^ ]+?) *%>/ig,
	loopReg = /<% *loop +(\d+)(?: +: +(\w+))? *%>/ig,
	endLoopReg = /<% *endLoop *%>/ig,
	blockReg = /<% *block *([\w ]+) *%>/ig,
	endBlockReg = /<% *endBlock *%>/ig,

	includeRel = {};


function createArray(len) {
	var arr = [];
	for (i = 0; i < len; i++) arr.push(i);
		
	return arr;
}


module.exports = function(cont, file, options, parseHTML){
	var fileRoot = path.dirname(file)+'/',
		appConf = options.appConf;

	var rel = includeRel[file];		// 如果没有值，则表明是入口HTML（解析顺序决定这一判断）
	
	cont = cont.replace(includeReg, function(str, inFile) {
			inFile = util.parsePath(fileRoot+ inFile);

			var rel2 = includeRel[inFile];
			if (!rel2) {
				rel2 = {};
				includeRel[inFile] = rel2;
			}

			rel2[file] = rel;
			
			if (!appConf.watchFiles[inFile]) {
				appConf.addPageReloadWatch(inFile, function(){
					delete appConf.cacheTpl[inFile];

					util.eachObject(rel2, function(i, v){
						delete appConf.cacheTpl[i];
						if (v) {
							util.eachObject(v, arguments.callee);		// 如果关联了 include文件，那么继续遍历
						} else {
							delete appConf.cache[i];					// 如果关联的是入口HTML，那么删除入口HTML的缓存
						}
					});
				});
			}
			return parseHTML(fs.readFileSync(inFile).toString(), inFile, options)+'\n';
		})
		
		.replace(loopReg, function(str, len, paramName){
			return '<% ['+createArray(len).join(',')+'].forEach(function('+(paramName || '')+'){ %>';
		}).replace(endLoopReg, function(){
			return '<% }); %>';
		})

		.replace(blockReg, function(str, blocks){
			return '<% if (block && ['+blocks.split(/ +/).join(',')+'].indexOf(block)) { %>';
		}).replace(endBlockReg, function(){
			return '<% } %>';
		});

	return cont;
};