/**
 * 常用空白函数合集
 */
function noop(){}
noop.rFalse = function(){
	return false;
};
noop.rTrue = function(){
	return true;
};
noop.rParam = function(param){
	return param;
};
/*noop.rArgs = function(){
	return arguments;
};*/

module.exports = noop;