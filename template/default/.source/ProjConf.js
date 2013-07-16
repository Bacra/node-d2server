module.exports = {
	"name": "{@projRoot}",							// 项目名称
	"alias": "{@projRoot}",							// 项目的默认二级域名
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
				'title': '首页'
			}
		}
	},
	"fileMap": {						// 配置文件映射（公共部分）
		"/css/base.min.css": [
			'common/reset.css',
			'common/base.css',
			'common/nav.less',
			'common/frame.less'
		],
		"/css/page.min.css": [
			"index/index.less"
		],

		"/js/base.min.js": [
			'common/nav.js',
			'common/nav.test.js',
			'common/frame.js',
			'common/frame.test.js'
		],
		"/js/page.min.js": [
			"index/index.js",
			"index/index.test.js"
		]
	}
};