module.exports = {
	"name": "console",							// 项目名称
	"alias": "console",							// 项目的默认二级域名
	"baseLess": "common/b.less",					// less公共文件
	"MinCssName": false,							// 压缩样式名的前缀
	"hostname": false,								// 线上资源域名
	"defaultHeader": "common/header.html",			// 公共头部
	"defaultFooter": "common/footer.html",			// 公共尾部
	"dataAPI": false,								// 动态数据接口
	"HTML": {							// 配置项目HTML（公共部分）
		"pages/pages.html": {
			'pages.html': {
				'title': 'Pages'
			}
		},
		"logs/logs.html": {
			'logs.html': {
				'title': 'Logs'
			}
		},
		"watch/watch.html": {
			'watch.html': {
				'title': 'Watch'
			}
		},
		"projects/projects.html": {
			'projects.html': {
				'title': 'Projects'
			}
		},
		"manage/manage.html": {
			'manage.html': {
				'title': 'Manage'
			}
		}
	},
	"fileMap": {						// 配置文件映射（公共部分）
		"/css/base.min.css": [
			'common/reset.css',
			'common/base.css',
			'common/frame.less',

			"pages/pages.less",
			"logs/logs.less",
			"watch/watch.less",
			"projects/projects.less",
			"manage/manage.less"
		],

		"/js/base.min.js": [
			'common/frame.js',
			'common/frame.test.js',

			"pages/pages.js",
			"pages/pages.test.js",
			'logs/logs.js',
			'logs/logs.test.js',
			'watch/watch.js',
			'watch/watch.test.js',
			'projects/projects.js',
			'projects/projects.test.js',
			"manage/manage.js",
			"manage/manage.test.js"
		]
	}
};