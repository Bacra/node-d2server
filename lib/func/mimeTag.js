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



function getJsReg(path) {
	return new RegExp('<script [^>]*src=("|\\\')'+util.getRegExpUnicode(path)+'\\1[^>]*><\/script>', 'i');
}
function getCssReg(path){
	return new RegExp('<link [^>]*href=("|\\\')'+util.getRegExpUnicode(path)+'\\1[^>]*>', 'i');
}
function getDefReg(path){
	return new RegExp(util.getRegExpUnicode(path), 'i');
}



module.exports = {
	'js': js,
	'css': css,
	'less': css,
	'def': def,
	'getReg': {
		'js': getJsReg,
		'css': getCssReg,
		'less': getCssReg,
		'def': getDefReg
	}
};