var fs = require('fs'),
	util = require('../util.js'),
	notice = require('../notice.js'),
	styleMap = {};		// KEY 为文件地址

	styleArr = util.charArr,
	styleArrLen = 64;




module.exports = {
	'css': function(cont, projConf, mapfile, rsCall){
		cssQuery(mapfile, function(getStyleName){
			cont = cont.replace(new RegExp('\\.('+projConf.MinCssNameKeyStr+')[A-Z][\\w\\d-]+\\b', 'g'), function(oname, prefix){
				return getStyleName(oname, prefix, projConf);
			});

			rsCall(cont);
		});
	},
	'js': function(cont, projConf, mapfile, rsCall){
		cssQuery(mapfile, function(getStyleName){
			cont = cont.replace(new RegExp('(\\.)?('+projConf.MinCssNameKeyStr+')[A-Z][\\w\\d-]+\\b', 'g'), function(oname, isD, prefix){
				if (isD) {
					return getStyleName(oname, prefix, projConf);
				} else {
					return getStyleName('.'+oname, prefix, projConf).substring(1);
				}
			});

			rsCall(cont);
		});
	},
	'html': function(cont, projConf, mapfile, rsCall){
		cssQuery(mapfile, function(getStyleName){
			cont = cont.replace(new RegExp('('+projConf.MinCssNameKeyStr+')[A-Z][\\w\\d-]+\\b', 'g'), function(oname, prefix){
				return getStyleName('.'+oname, prefix, projConf).substring(1);
			});

			rsCall(cont);
		});
	}
};



// 初始化query，并获取到一个addFunc
// 注意：和util中的query逻辑完全不同
function initCssQueryList(startFunc, endFunc){
	var list = [],
		nextFunc = function(){
			list.shift();
			if (list.length) {
				list[0](nextFunc);
			} else {
				endFunc();
			}
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

	addFunc(startFunc);
	return addFunc;
}


function cssQuery(mapfile, callback){
	var conf = styleMap[mapfile],
		getStyleName = function(oname, prefix, projConf){
			if (conf.data.map[oname]) return conf.data.map[oname];
			var myIndex,
				styleName;
			if (prefix in conf.data.index) {
				myIndex = ++conf.data.index[prefix];
			} else {
				myIndex = conf.data.index[prefix] = 0;
			}
			styleName = conf.data.map[oname] = '.'+projConf.MinCssName[prefix]+util.cutInt(myIndex, styleArr, styleArrLen);

			return styleName;
		};
	if (!conf) {
		conf = styleMap[mapfile] = {
			'query': initCssQueryList(function(nextFunc){
				fs.readFile(mapfile, function(err, buf){
					if (err) {
						notice.warn('cssQuery', err, mapfile);
						conf.data = {
							'map': {},
							'index': {}
						};
					} else {
						conf.data = JSON.parse(fs.readFileSync(mapfile).toString());
					}

					nextFunc();
				});
			}, function(){
				util.writeFile(mapfile, JSON.stringify(conf.data));
			})
		};
	}

	conf.query(function(nextFunc){
		callback(getStyleName);
		nextFunc();
	});
}