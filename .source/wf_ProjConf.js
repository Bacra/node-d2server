var nodeLib = 'https://github.com/Bacra/node-d2server',
	phpLib = 'https://github.com/Bacra/php-d2server',
	masterZip = nodeLib+'/archive/master.zip',
	pageZip = nodeLib+'/archive/gh-pages.zip',
	releases = nodeLib+'/releases',
	fork = nodeLib+'/fork',
	master = nodeLib+'/blob/master/';


module.exports = {
	"alias": 'd2',			// 项目的二级域名
	"sync": false,			// fileMap文件同步目录
	"HTML": {
		'footer': 'common/footer-code.html',
		'getStarted/getStarted.html': {
			'get-started.html': {
				'title': 'Get Started',
				'data': {
					'nodeLib': nodeLib,
					'phpLib': phpLib,
					'masterZip': masterZip,
					'pageZip': pageZip,
					'releases': releases,
					'fork': fork,
					'master': master
				}
			}
		},
		'common/building.html': {
			'note.html': {
				'title': 'Note'
			},
			'module.html': {
				'title': 'Module'
			}
		}
		/*'note/note.html': {
			'note.html': {
				'title': 'Note'
			}
		},
		'module/module.html': {
			'module.html': {
				'title': 'Module'
			}
		}*/
	},						// 配置项目HTML
	"fileMap": {}					// 配置项目文件映射
};