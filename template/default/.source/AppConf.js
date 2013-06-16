module.exports = {
	"baseLess": "common/b.less",
	"sync": "D:/svn/产品-{@appName}/",
	"MinCssName": false,
	"alias": "{@appName}",
	"defaultHeader": "common/header.html",
	"defaultFooter": "common/footer.html",
	"dataAPI": false,
	"HTML": {
		"index/index.html": {
			'index.html': {
				'title': '首页-{@appName}'
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