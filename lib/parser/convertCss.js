var fs = require('fs'),
	util = require('../util.js'),
	notice = require('../notice.js'),
	styleMap = {};		// KEY 为文件地址

	styleArr = util.charArr,
	styleArrLen = 64;



module.exports = {
	'css': function(cont, prefix, mapfile, rsCall){
		cssQuery(mapfile, function(data, styleList, index){
			cont = cont.replace(/\.wf_m[A-Z][\w\d-]+\b/g, function(str){
				return styleList[str] || (styleList[str] = '.'+prefix+util.cutInt(index++, styleArr, styleArrLen));
			});

			data.index = index;
			rsCall(cont, data);
		});
	},
	'js': function(cont, prefix, mapfile, rsCall){
		cssQuery(mapfile, function(data, styleList, index){
			cont = cont.replace(/(\.)?wf_m[A-Z][\w\d-]+\b/g, function(str, isD){
				if (isD) {
					return styleList[str] || (styleList[str] = '.'+prefix+util.cutInt(index++, styleArr, styleArrLen));
				} else {
					str = '.'+str;
					if (!styleList[str]) styleList[str] = '.'+prefix+util.cutInt(index++, styleArr, styleArrLen);
					return styleList[str].substring(1);
				}
			});

			data.index = index;
			rsCall(cont, data);
		});
	},
	'html': function(cont, prefix, mapfile, rsCall){
		cssQuery(mapfile, function(data, styleList, index){
			cont = cont.replace(/wf_m[A-Z][\w\d-]+\b/g, function(str){
				str = '.'+str;
				if (!styleList[str]) styleList[str] = '.'+prefix+util.cutInt(index++, styleArr, styleArrLen);
				return styleList[str].substring(1);
			});

			data.index = index;
			rsCall(cont, data);
		});
	},
	'save': function(mapfile){
		util.writeFile(mapfile, JSON.stringify(styleMap[mapfile].data));
	}
};



// 初始化query，并获取到一个addFunc
// 注意：和util中的query逻辑完全不同
function initCssQueryList(callback){
	var list = [],
		nextFunc = function(){
			// console.log('query len:'+ list.length);
			list.shift();
			if (list.length) list[0](nextFunc);
		},
		addFunc =  function(callback){
			list.push(callback);

			// 执行队列 使用setTimeout防阻塞
			if (list.length == 1) {
				setTimeout(function(){
					callback(nextFunc);
				}, 100);
			}
		};

	addFunc(callback);
	return addFunc;
}


function cssQuery(mapfile, callback){
	var conf = styleMap[mapfile];
	if (!conf) {
		conf = styleMap[mapfile] = {
			'query': initCssQueryList(function(nextFunc){
				try {
					conf.data = JSON.parse(fs.readFileSync(mapfile).toString());
				} catch (err) {
					notice.warn('cssQuery', err, mapfile);
					conf.data = {
						'map': {},
						'index': 0
					};
				}
				nextFunc();
			})
		};
	}

	conf.query(function(nextFunc){
		callback(conf.data, conf.data.map, conf.data.index);
		nextFunc();
	});
}