var fs = require('fs'),
	path = require('path');



module.exports = {
	'mkdirs': mkdirs,
	'writeFile': writeFile,
	'copyFile': copyFile,
	'getRegExpUnicode': getRegExpUnicode,
	'zeroize': zeroize,
	'getUTCtime': getUTCtime,
	'eachArr': eachArr,
	'eachObject': eachObject,
	'cloneObject': cloneObject,
	'sortAndStringifyJSON': sortAndStringifyJSON,
	'parsePath': parsePath,
	'stRunTime': stRunTime,
	'getExtname': getExtname,
	
	'fileExists': function(file){
		return fs.existsSync(file) && fs.statSync(file).isFile();
	},
	'endsWidth': endsWidth,
	'addPath': addPath
};


function mkdirs(p){
	if (!fs.existsSync(p)) {
		mkdirs(path.join(p, '..'));
		fs.mkdirSync(p);
	}
}

function writeFile(file, buf){
	mkdirs(path.dirname(file));
	fs.writeFileSync(file, buf);
}

function copyFile(from, to){
	writeFile(to, fs.readFileSync(from));
}





function stRunTime(){
	var time = new Date().getTime();
	return function(){
		return new Date().getTime() - time;
	};
}



function getRegExpUnicode(str){
	var rs = '', code;
	for (var i = 0, num = str.length; i < num; i++) {
		// console.log(str.charCodeAt(i).toString(16));
		code = str.charCodeAt(i).toString(16);
		code = zeroize(code, 4);

		rs += '\\u' + code;
	}
	return rs;
}

function zeroize(value, length) {
	if (!length) return value;

	value = String(value);		// 必须转化为字符串才行
	for (var i = (length - value.length), zeros = ''; i > 0; i--) {
		zeros += '0';
	}
	return zeros + value;
}



function getUTCtime(){
	return new Date().toUTCString();
}


function eachArr(arr, callback) {
	for (var i = 0, num = arr.length; i < num; i++) {
		if (callback.call(arr[i], i, arr[i], num) === false) return false;
	}
}

function eachObject(obj, callback) {
	for (var i in obj) {
		if (callback.call(obj[i], i, obj[i]) === false) return false;
	}
}


// 一些Object不能用create复制时，使用这个函数
function cloneObject(obj){
	var obj2 = {};
	for(var i in obj){
		if (obj.hasOwnProperty(i)) obj2[i] = obj[i];
	}
	return obj2;
}


function sortAndStringifyJSON(json) {
	var arr = [],
		str = [];
	for (var i in json) {
		arr.push(i);
	}
	arr.sort();

	arr.forEach(function(v){
		str.push(v + '=' +json[v]);
	});

	return str.join('&');
}

function parsePath(str) {
	return path.normalize(str);
}


function getExtname(file) {
	return path.extname(file).substring(1).toLowerCase();
}





function endsWidth(str, endStr) {
	var i = str.lastIndexOf(endStr);
	return i !== -1 && i == str.length - endStr.length;
}



function addPath(path, root) {
	path = parsePath(root+'/'+path);
	return path == root || path.indexOf(root) ? false : path;
}