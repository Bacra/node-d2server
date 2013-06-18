module.exports = {
	"baseLess": "common/b.less",
	"MinCssName": false,
	"defaultHeader": "common/header.html",
	"defaultFooter": "common/footer.html",
	"extra": ["wf_AppConf.js"],
	"HTML": {
		"index/index.html": {
			'index.html': {
				'title': '首页'
			}
		}
	},
	"fileMap": {
		"/css/base.min.css": [
			'common/reset.css',
			'common/base.css',
			'common/nav.less',
			'common/frame.less',
		],
		"/css/page.min.css": [
			"index/index.less",
		],

		"/js/base.min.js": [
			'common/nav.js',
			'common/nav.test.js',
			'common/frame.js',
			'common/frame.test.js',
		],
		"/js/page.min.js": [
			"index/index.js",
			"index/index.test.js",
		]
	}
};