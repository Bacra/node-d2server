var fs = require('fs'),
	mod = require('../../mod.js'),
	util = mod.util,
	cutInt = mod.load('cutInt'),

	styleArr = cutInt.charArr,
	styleArrLen = 64;




module.exports = {
	'readConfig': function(file) {
		return util.fileExists(file) ? JSON.parse(fs.readFileSync(file).toString()) : {'map': {}, 'index': {}};
	},
	'saveConfig': function(file, styleMapConf){
		util.writeFile(file, JSON.stringify(styleMapConf, null, '\t'));
	},
	'parse': function(cont, projConf, styleMapConf){
		return cont.replace(projConf.MinCssNameReg, function(oname, D, prefix){
				if (D) {
					return D + getStyleName(styleMapConf, oname.substring(1), projConf.MinCssName[prefix]);
				} else {
					return getStyleName(styleMapConf, oname, projConf.MinCssName[prefix]);
				}
			});
	},
	'parseWidthPrefix': function(cont, projConf, styleMapConf){
		return cont.replace(projConf.MinCssNameReg, function(oname, D, prefix){
				return D ? D + getStyleName(styleMapConf, oname.substring(1), projConf.MinCssName[prefix]) : oname;
			});
	}
};



function getStyleName(styleMapConf, oname, newPrefix){
	if (styleMapConf.map[oname]) return styleMapConf.map[oname];
	var myIndex,
		styleName;
	if (newPrefix in styleMapConf.index) {
		myIndex = ++styleMapConf.index[newPrefix];
	} else {
		myIndex = styleMapConf.index[newPrefix] = 0;
	}
	styleName = styleMapConf.map[oname] = newPrefix+cutInt(myIndex, styleArr, styleArrLen);

	return styleName;
}