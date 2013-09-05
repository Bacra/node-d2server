module.exports = {
	"name": "d2server",								// 项目名称
	"alias": 'd2server',							// 项目的默认二级域名
	"sync": 'c:/svn/d2server/',						// fileMap文件同步目录
	"catalog": 'node-d2server/',					// 项目内嵌的二级目录
	"baseLess": "common/b.less",					// less公共文件
	"MinCssName": {									// 压缩样式名的前缀
		'wf_m': 'e'
	},
	"hostname": 'bacra.github.io',					// 线上资源域名
	"defaultHeader": "common/header.html",			// 公共头部
	"defaultFooter": "common/footer.html",			// 公共尾部
	"extra": ["wf_ProjConf.js"],					// 子配置文件
	"dataAPI": {									// 动态数据接口
		'excludeQuery': ['v', 'version', '_'],
		'update': false
	},
	"HTML": {},							// 配置项目HTML（公共部分）
	"fileMap": {						// 配置文件映射（公共部分）
		"css/base.min.css": [
			'common/bootstrap-doc.css',
			'common/frame.less'
		],

		"js/base.min.js": [
			'common/frame.js',
			'common/google-analytics.js'
		]
	}
};