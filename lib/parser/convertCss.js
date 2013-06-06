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



function cssQuery(mapfile, callback){
	var conf = styleMap[mapfile];
	if (!conf) {
		conf = styleMap[mapfile] = {
			'query': util.query(function(nextFunc){
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