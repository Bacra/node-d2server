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

function createHTMLConf(htmlSrc, htmlConf){
	var conf = {};
	conf[version+'/'+htmlSrc] = htmlConf;
	return conf;
}


module.exports = {
	"alias": 'd2',			// 项目的二级域名
	"sync": false,			// fileMap文件同步目录
	"HTML": {				// 配置项目HTML
		'header': 'common/header-code.html',
		'footer': 'common/footer-code.html',
		'common/redirect.html': {
			'header': false,
			'footer': false,
			'index.html': {
				'title': 'redirect index',
				'data': {
					'version': version
				}
			},
			'get-started.html': {
				'title': 'redirect get-started',
				'data': {
					'version': version
				}
			},
			'module.html': {
				'title': 'redirect module',
				'data': {
					'version': version
				}
			},
			'download.html': {
				'title': 'redirect download',
				'data': {
					'version': version
				}
			},
			'feedback.html': {
				'title': 'redirect feedback',
				'data': {
					'version': version
				}
			}
		},
		"index/index.html": createHTMLConf('index.html', {
				'header': 'common/header.html',
				'footer': 'common/footer.html',
				'title': 'D2Server',
				'data': buildData('下载使用D2Server管理前端项目，进行团队协同开发，让前端开发人员更加集中精力于自己的工作。推荐代替Apache使用D2Server搭建前端开发服务器环境')
			}),
		'getStarted/getStarted.html': createHTMLConf('get-started.html', {
				'title': 'Get Started',
				'data': buildData('D2Server入门中文教程，从下载D2Server开始，一步一步教你如何使用D2Server管理前端项目，进行团队协作开发，可替代Apache搭建前端服务器开发环境')
			}),
		'module/module.html': createHTMLConf('module.html', {
				'title': 'Module',
				'data': buildData('D2Server API中文文档，介绍D2Server各个模块组件的参数配置方法，了解D2Server的强大功能，可替代Apache搭建前端服务器开发环境')
			}),
		'getStarted/downloadPage.html': createHTMLConf('download.html', {
				'title': 'Download',
				'data': buildData('通过git下载安装更新D2Server，或通过Github下载到D2Server的历史版本源码。项目开源，基于NodeJS开发，可方便地进行自定义前端服务器开发环境')
			}),
		'feedback/feedback.html': createHTMLConf('feedback.html', {
				'header': 'common/header.html',
				'footer': 'common/footer.html',
				'title': 'Feedback',
				'data': buildData(null)
			}),
		'versions/versions.html': {
			'versions.html': {
				'header': false,
				'footer': false,
				'title': 'Version History',
				'data': buildData(null)
			}
		}
	},
	"fileMap": {}			// 配置项目文件映射
};