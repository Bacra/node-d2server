var ejs = require('./ejs'),
	fs = require('fs'),

	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	
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
		return 'if (!sys.block || sys.block.test("'+match[1]+'")) {';
	}

	return code;
};


/**
 * includeRel的结构
 * 每个include的file对应一个key，值为被哪些文件包含（parentFile为key，只为prarentFile被哪些文件所包含……以次类推）
 * 注意：为防止include的文件具有CacheTpl（很麻烦的情况），include的文件，都不能作为入口HTML
 */
ejs.includeExtFunc = function(inFile, parentFile, options){
	inFile = util.parsePath(inFile);
	parentFile = util.parsePath(parentFile);
	var projConf = options.projConf;

	if (projConf.cacheTpl[inFile]) {
		delete projConf.cacheTpl[inFile];
		delete projConf.cache[inFile];
		notice.warn('SYS', 'Included HTML File can not be visited in Browser directly', inFile);
	}
	
	if (fs.existsSync(inFile)) {
		var rel2 = includeRel[inFile];

		if (!rel2) {
			rel2 = {};
			includeRel[inFile] = rel2;
		}

		rel2[parentFile] = includeRel[parentFile];


		if (!projConf.watchFiles[inFile]) {
			projConf.addPageReloadWatch(inFile, function(){

				util.eachObject(rel2, function(i, v){
					if (v) {
						util.eachObject(v, arguments.callee);		// 如果关联了 include文件，那么继续遍历
					} else {
						// 如果没有值，则表明是入口HTML（解析顺序决定这一判断）
						delete projConf.cache[i];
						delete projConf.cacheTpl[i];
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