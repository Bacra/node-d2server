var nodeLib = 'https://github.com/Bacra/node-d2server',
	version = 'v3.2.3',

	_data = {
		'nodeLib': nodeLib,
		'phpLib': 'https://github.com/Bacra/php-d2server',
		'masterZip': nodeLib+'/archive/master.zip',
		'devZip': nodeLib+'/archive/dev.zip',
		'pageZip': nodeLib+'/archive/gh-pages.zip',
		'releases': nodeLib+'/releases',
		'fork': nodeLib+'/fork',
		'master': nodeLib+'/blob/master/',
		'author': 'https://plus.google.com/102678188433989978435?rel=author',
		'todo': nodeLib+'/blob/dev/TODO.md',
		'version': version,
		'versions': [version]
	},

	indexConf = {},
	getStartedConf = {},
	moduleConf = {},
	downloadConf = {};


function buildData(description){
	var data = Object.create(_data);
	data.description = description;
	return data;
}

function createHTMLConf(htmlSrc, conf, htmlConf, is_cloneRoot){
	conf[version+'/'+htmlSrc] = htmlConf;
	if (is_cloneRoot) conf[htmlSrc] = htmlConf;
	return conf;
}


module.exports = {
	"alias": 'd2',			// 项目的二级域名
	"sync": false,			// fileMap文件同步目录
	"HTML": {
		'footer': 'common/footer-code.html',
		'header': 'common/header-code.html',
		"index/index.html": createHTMLConf('index.html',
			{
				'header': 'common/header.html',
				'footer': 'common/footer.html'
			},
			{
				'title': 'D2Server',
				'data': buildData('下载使用D2Server管理前端项目，进行团队协同开发，让前端开发人员更加集中精力于自己的工作。推荐使用D2Server搭建前端开发服务器环境，代替Apache')
			}, true),
		'getStarted/getStarted.html': createHTMLConf('get-started.html', {},
			{
				'title': 'Get Started',
				'data': buildData('D2Server入门初级中文教程，从下载D2Server开始，一步一步教你如何使用D2Server管理前端项目')
			}),
		'module/module.html': createHTMLConf('module.html', {},
			{
				'title': 'Module',
				'data': buildData('D2Server API中文文档，介绍D2Server各个模块组件的参数配置方法，了解D2Server的强大功能')
			}),
		'getStarted/downloadPage.html': createHTMLConf('download.html', {},
			{
				'title': 'Download',
				'data': buildData('通过git clone D2Server，或则Fork项目。也可以通过Github下载到D2Server的历史版本源码')
			}),
		'feedback/feedback.html': {
			'feedback.html': {
				'header': 'common/header.html',
				'footer': 'common/footer.html',
				'title': 'Feedback',
				'data': buildData(null)
			}
		}
	},						// 配置项目HTML
	"fileMap": {}					// 配置项目文件映射
};