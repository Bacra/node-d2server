var nodeLib = 'https://github.com/Bacra/node-d2server',
	masterZip = nodeLib+'/archive/master.zip',
	fork = nodeLib+'/fork',
	master = nodeLib+'/blob/master/';

module.exports = {
	"name": "d2server",								// 项目名称
	"alias": 'd2server',							// 项目的默认二级域名
	"sync": 'c:/svn/d2server/',						// fileMap文件同步目录
	"catalog": 'node-d2server/',					// 项目内嵌的二级目录
	"baseLess": "common/b.less",					// less公共文件
	"MinCssName": false,							// 压缩样式名的前缀
	"hostname": false,								// 线上资源域名
	"defaultHeader": "common/header.html",			// 公共头部
	"defaultFooter": "common/footer.html",			// 公共尾部
	"extra": ["wf_ProjConf.js"],						// 子配置文件
	"dataAPI": false,								// 动态数据接口
	"HTML": {							// 配置项目HTML（公共部分）
		"index/index.html": {
			'index.html': {
				'title': 'D2Server',
				'data': {
					'nodeLib': nodeLib,
					'master': master,
					'masterZip': masterZip,
					'fork': fork
				}
			}
		}
	},
	"fileMap": {						// 配置文件映射（公共部分）
		"css/base.min.css": [
			'common/bootstrap-doc.css',
			'common/nav.less',
			'common/frame.less',

			"index/index.less"
		],

		"js/base.min.js": [
			'common/nav.js',
			'common/nav.test.js',
			'common/frame.js',
			'common/frame.test.js',

			"index/index.js",
			"index/index.test.js"
		]
	}
};