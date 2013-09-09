var parseUrl = require('url').parse;

/**
 * 通过req获取完整的URI信息
 * @param  {Request} req NodeJS Request对象
 * @return {JSON}        URI信息
 */
module.exports = function(req){
	var uri = parseUrl(req.url, true);

	// 当hostname不存在的情况下，使用req的host来补充
	if (!uri.hostname) {
		var uri2 = parseUrl('http://'+req.headers.host+req.url);
		uri2.query = uri.query;
		return uri2;
	}
	return uri;
};

