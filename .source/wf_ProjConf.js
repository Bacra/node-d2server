var nodeLib = 'https://github.com/Bacra/node-d2server',
	phpLib = 'https://github.com/Bacra/php-d2server',
	masterZip = nodeLib+'/archive/master.zip',
	devZip = nodeLib+'/archive/dev.zip',
	pageZip = nodeLib+'/archive/gh-pages.zip',
	releases = nodeLib+'/releases',
	fork = nodeLib+'/fork',
	master = nodeLib+'/blob/master/',

	_data = {
		'nodeLib': nodeLib,
		'phpLib': phpLib,
		'masterZip': masterZip,
		'devZip': devZip,
		'pageZip': pageZip,
		'releases': releases,
		'fork': fork,
		'master': master
	};


module.exports = {
	"alias": 'd2',			// 项目的二级域名
	"sync": false,			// fileMap文件同步目录
	"HTML": {
		'footer': 'common/footer-code.html',
		'header': 'common/header-code.html',
		"index/index.html": {
			'header': 'common/header.html',
			'footer': 'common/footer.html',
			'index.html': {
				'title': 'D2Server',
				'data': _data
			}
		},
		'getStarted/getStarted.html': {
			'get-started.html': {
				'title': 'Get Started',
				'data': _data
			}
		},
		'module/module.html': {
			'module.html': {
				'title': 'Module',
				'data': _data
			}
		},
		'getStarted/downloadPage.html': {
			'download.html': {
				'title': 'Download',
				'data': _data
			}
		},
		'feedback/feedback.html': {
			'feedback.html': {
				'header': 'common/header.html',
				'footer': 'common/footer.html',
				'title': 'Feedback',
				'data': _data
			}
		}
	},						// 配置项目HTML
	"fileMap": {}					// 配置项目文件映射
};