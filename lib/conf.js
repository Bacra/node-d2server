var SourcePath = ".source/";

module.exports = {
	// 'DocumentRoot': __dirname+"/../wwwroot/",
	'DocumentRoot': 'w:/',
	'Domain': 'test.com',
	'SourcePath': SourcePath,
	'AppConfigFile': SourcePath + '.appconf',
	'DynamicDataPath': SourcePath + '.data/',
	'fileServPort': 82,
	'infoServPort': 81,
	'viewServPort': 80,
	'AutoClearCache': 1200000
};