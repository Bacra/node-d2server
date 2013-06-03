var util = require('../util.js'),
	styleMap = {};		// KEY 为文件地址

	styleArr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '-', '_'],
	styleArrLen = styleArr.length;



module.exports = {
	'css': function(cont, mapfile, rsCall){
		cssQuery(mapfile, function(data, styleList, index){
			cont = cont.replace(/\.wf_m[A-Z][\w\d-]+\b/g, function(str){
				return styleList[str] || (styleList[str] = '._'+util.cutInt(index++, styleArr, styleArrLen));
			});

			data.index = index;
			rsCall(cont, data);
		});
	},
	'js': function(cont, mapfile, rsCall){
		cssQuery(mapfile, function(data, styleList, index){
			cont = cont.replace(/(\.)?wf_m[A-Z][\w\d-]+\b/g, function(str, isD){
				if (isD) {
					return styleList[str] || (styleList[str] = '._'+util.cutInt(index++, styleArr, styleArrLen));
				} else {
					str = '.'+str;
					if (!styleList[str]) styleList[str] = '._'+util.cutInt(index++, styleArr, styleArrLen);
					return styleList[str].substring(1);
				}
			});

			data.index = index;
			rsCall(cont, data);
		});
	},
	'html': function(cont, mapfile, rsCall){
		cssQuery(mapfile, function(data, styleList, index){
			cont = cont.replace(/wf_m[A-Z][\w\d-]+\b/g, function(str){
				str = '.'+str;
				if (!styleList[str]) styleList[str] = '._'+util.cutInt(index++, styleArr, styleArrLen);
				return styleList[str].substring(1);
			});

			data.index = index;
			rsCall(cont, data);
		});
	},
	'save': function(mapfile){
		util.writeFile(mapfile, JSON.stringify(styleMap[mapfile]));
	}
};



function cssQuery(mapfile, callback){
	var conf = styleMap[mapfile];
	if (!conf) {
		conf = styleMap[mapfile] = {
			'query': util.query(function(nextFunc){
				try {
					conf.data = JSON.parse(fs.readFileSync(mapfile));
				} catch (e) {
					conf.data = {
						'map': {},
						'index': 1			// 不能从0开始，否则cutInt会有一个重复 算法的问题
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