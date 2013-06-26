var ejs = require('./ejs'),
	fs = require('fs'),
	util = require('../util.js'),
	notice = require('../notice.js'),
	
	loopReg = /loop +(\d+)(?: *: *(\w+))?/,
	blockReg = /block *([\w ]+)/,

	includeRel = {};



ejs.parseMethodExtFunc = function(code){
	code = code.trim();
	var match;
	if (code == 'endLoop') {
		return '})';
	} else if (code == 'endBlock'){
		return '}';
	} else if ((match = code.match(loopReg))){
		return '['+createArray(match[1]).join(',')+'].forEach(function('+(match[2] || '')+'){';
	} else if ((match = code.match(blockReg))){
		return 'if (!block || block.test("'+match[1]+'")) {';
	}

	return code;
};


ejs.includeExtFunc = function(inFile, parentFile, options){
	inFile = util.parsePath(inFile);
	parentFile = util.parsePath(parentFile);
	//console.log(options);

	var appConf = options.appConf,
		rel = includeRel[parentFile];		// 如果没有值，则表明是入口HTML（解析顺序决定这一判断）
	if (fs.existsSync(inFile)) {
		var rel2 = includeRel[inFile];
		if (!rel2) {
			rel2 = {};
			includeRel[inFile] = rel2;
		}

		rel2[parentFile] = rel;


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
	} else {
		notice.warn('HTML', 'include file is not exists', inFile);
	}
};


module.exports = ejs;


function createArray(len) {
	var arr = [];
	for (i = 0; i < len; i++) arr.push(i);
		
	return arr;
}