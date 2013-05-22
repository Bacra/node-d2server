var path = require('path'),
	fs = require('fs'),
	
	includeReg = /<% *include +([^ ]+?) *%>/ig,
	loopReg = /<% *loop +(\d+)(?: +: +(\w+))? *%>/ig,
	endLoopReg = /<% *endLoop *%>/ig,
	blockReg = /<% *block *([\w ]+) *%>/ig,
	endBlockReg = /<% *endBlock *%>/ig;


function createArray(len) {
	var arr = [];
	for (i = 0; i < len; i++) arr.push(i);
		
	return arr;
}


module.exports = function(cont, file, options, parseHTML){
	var fileRoot = path.dirname(file)+'/',
		appConf = options.appConf;
	
	cont = cont.replace(includeReg, function(str, inFile) {
			inFile = path.join(fileRoot, inFile);
			return parseHTML(fs.readFileSync(inFile).toString(), inFile, options);
		})
		
		.replace(loopReg, function(str, len, paramName){
			console.log(len, paramName);
			return '<% ['+createArray(len).join(',')+'].forEach(function('+(paramName || '')+'){ %>';
		}).replace(endLoopReg, function(){
			return '<% }); %>';
		})

		.replace(blockReg, function(str, blocks){
			return '<% if (block && ['+blocks.split(/ +/).join(',')+'].indexOf(block)) { %>';
		}).replace(endBlockReg, function(){
			return '<% } %>';
		});


	cont = appConf.convertSource4HTML(cont);
	return cont;
};