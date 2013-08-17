var fs = require('fs'),
	path = require('path'),
	notice = require('./notice.js'),
	parseUrl = require('url').parse;



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
	'cutInt': cutInt,
	'charArr': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '_', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '$', '&', '%', '=', '+'],
	'query': query,
	'task': task,
	'fileExists': function(file){
		return fs.existsSync(file) && fs.statSync(file).isFile();
	},
	'tpl': tpl,
	'endsWidth': endsWidth,
	'getURI': getURI
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
		if (callback.call(arr[i], i, arr[i], num) === false) break;
	}
}

function eachObject(obj, callback) {
	for (var i in obj) {
		if (callback.call(obj[i], i, obj[i]) === false) break;
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




function cutInt(num, strArr, strArrLen) {
	return num < strArrLen ? strArr[num] : cutInt(Math.floor(num/strArrLen), strArr, strArrLen) + strArr[num%strArrLen];
}



// 初始化query，并获取到一个addFunc
function query(endCall){
	var list = [],
		index = -1,
		endFunc = function(){
			index = -1;
			if (endCall) endCall();
		},
		nextFunc = function(){
			if (++index < list.length) {
				list[index](nextFunc, endFunc);
			} else {
				endFunc();
			}
		};

	return {
		'join': function(callback){
			list.push(callback);
		},
		'start': function(){
			nextFunc();
		},
		'end': endFunc
	};
}


function task(endCall){
	var waitTaskNum = 0,
		list = [],
		complete = function(){
			if (--waitTaskNum < 1) endCall(waitTaskNum);
		};

	return {
		'add': function(callback){
			list.push(callback);
		},
		'start': function(){
			waitTaskNum = list.length;
			list.forEach(function(func){
				func(complete);
			});
		},
		'complete': complete,		// 方便获取到这个方法，与query配合使用的时候，不能在query start之后再去拿complate
		'end': function(){
			endCall(waitTaskNum);
		}
	};
}


function tpl(dataName, cont){
	var reg = {};
	dataName.forEach(function(name){
		reg[name] = new RegExp('__'+name+'__', 'g');
	});
	return function(data, newCont){
		if (!newCont) newCont = cont;
		for(var i in data){
			newCont = newCont.replace(reg[i], data[i]);
		}
		return newCont;
	};
}



function endsWidth(str, endStr) {
	var i = str.lastIndexOf(endStr);
	return i !== -1 && i == str.length - endStr.length;
}

function getURI(req){
	var uri = parseUrl(req.url, true);
	if (!uri.hostname) {
		var uri2 = parseUrl('http://'+req.headers.host+req.url);
		uri2.query = uri.query;
		return uri2;
	}
	return uri;
}

