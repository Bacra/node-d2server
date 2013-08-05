var fs = require('fs'),
	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	styleMap = {};		// KEY 为文件地址

	styleArr = util.charArr,
	styleArrLen = 64;




module.exports = {
	'css': function(cont, projConf, mapfile, rsCall){
		cssQuery(mapfile, function(getStyleName){
			cont = cont.replace(projConf.MinCssNameReg, function(oname, D, prefix){
				return D ? D + getStyleName(oname.substring(1), projConf.MinCssName[prefix]) : oname;
			});

			rsCall(cont);
		});
	},
	'js': function(cont, projConf, mapfile, rsCall){
		cssQuery(mapfile, function(getStyleName){
			cont = cont.replace(projConf.MinCssNameReg, function(oname, D, prefix){
				if (D) {
					return D + getStyleName(oname.substring(1), projConf.MinCssName[prefix]);
				} else {
					return getStyleName(oname, projConf.MinCssName[prefix]);
				}
			});

			rsCall(cont);
		});
	},
	'html': function(cont, projConf, mapfile, rsCall){
		cssQuery(mapfile, function(getStyleName){
			cont = cont.replace(projConf.MinCssNameReg, function(oname, D, prefix){
				return D ? oname : getStyleName(oname, projConf.MinCssName[prefix]);
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
		getStyleName = function(oname, newPrefix){
			if (conf.data.map[oname]) return conf.data.map[oname];
			var myIndex,
				styleName;
			if (newPrefix in conf.data.index) {
				myIndex = ++conf.data.index[newPrefix];
			} else {
				myIndex = conf.data.index[newPrefix] = 0;
			}
			styleName = conf.data.map[oname] = newPrefix+util.cutInt(myIndex, styleArr, styleArrLen);

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
				util.writeFile(mapfile, JSON.stringify(conf.data, null, '\t'));
			})
		};
	}

	conf.query(function(nextFunc){
		callback(getStyleName);
		nextFunc();
	});
}