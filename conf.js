var SourcePath = ".source/";

module.exports = {
	'DocumentRoot': __dirname + '/wwwroot/',				// 所有项目所在根目录
	'Domain': 'test.com',									// 绑定的顶级域名
	'SourcePath': SourcePath,								// 项目开发文件存放文件夹
	'MainConfigFile': SourcePath + 'ProjConf.js',			// 项目主体配置文件
	'ProjConfigFile': SourcePath + 'wf_ProjConf.js',		// 项目成员各自的配置文件
	'DynamicDataPath': SourcePath + '.data/',				// 存放动态数据的目录
	'DynamicDataFile': SourcePath + '.data/.fileinfo',		// 存放动态数据的配置方案
	'StyleMapFile': SourcePath+'.stylemap',					// 存放样式解析后的映射关系
	'DevServPort': 82,				// 开发服务器端口
	'InfoServPort': 81,				// 信息服务器端口
	'ViewServPort': 80,				// 静态文件浏览服务器端口
	'SpliceServPort': 83,			// 文件拼接服务器端口
	'AutoClearCache': 20*60*1000,		// 自动清除缓存的定时器
	'EJS_openTag': '<%',				// EJS 开始标签
	'EJS_closeTag': '%>'				// EJS 结束标签
};