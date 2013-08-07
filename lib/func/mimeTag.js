var util = require('./util.js');


function js(path){
	return '<script type="text/javascript" src="'+path+'" charset="utf-8"></script>';
}
function css(path){
	return '<link rel="stylesheet" type="text/css" href="'+path+'" charset="utf-8" />';
}
function def(path){
	return path;
}



/*function getJsReg(path) {
	path = path.replace(urlSplitReg, '/');
	return new RegExp('<script [^>]*src=("|\')'+util.getRegExpUnicode(path)+'\\1[^>]*><\/script>', 'ig');
}
function getCssReg(path){
	path = path.replace(urlSplitReg, '/');
	return new RegExp('<link [^>]*href=("|\')'+util.getRegExpUnicode(path)+'\\1[^>]*>', 'ig');
}
function getDefReg(path){
	path = path.replace(urlSplitReg, '/');
	return new RegExp(util.getRegExpUnicode(path), 'ig');
}*/



module.exports = {
	'js': js,
	'css': css,
	'less': css,
	'def': def,
	'scriptReg': /(<script [^>]*src=("|'))(.+?)(\2[^>]*><\/script>)/ig,
	'linkReg': /(<link [^>]*href=("|'))(.+?)(\2[^>]*>)/ig
	/*'getReg': {
		'js': getJsReg,
		'css': getCssReg,
		'less': getCssReg,
		'def': getDefReg
	}*/
};