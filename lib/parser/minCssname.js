var cssQuery = require('./cssQuery.js');

module.exports = function(cont, appConf){
	cssQuery(cont, appConf, function(data, nextFunc){
		var styleList = data.map,
			index = data.index;
		
		cont.replace(/\.wf_m([\w\d-]*(--|__)[\w\d-]*)+[\w\d]+/g, function(str){
			return styleList[str] || (styleList[str] = '.$'+util.cutInt(index++));
		});

		data.index = index;
		nextFunc();
	});
};