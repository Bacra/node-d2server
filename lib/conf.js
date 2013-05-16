var SourcePath = ".source/";
module.exports = {
	// 'DocumentRoot': __dirname + "/../wwwroot/",
	'DocumentRoot': 'w:/',
	'SourcePath': SourcePath,
	'AppConfigFile': SourcePath + '.appconf',
	'DynamicDataPath': SourcePath + '.data/',
	'AutoClearCache': 1200000						// 内存小的 可以设置为60000
};
