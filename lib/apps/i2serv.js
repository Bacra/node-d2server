var http = require('http'),
	infoServ = http.createServer(),
	parseUrl = require('url').parse,
	io = require('socket.io').listen(infoServ, {'log': false}),

	// infoView 拓展方法
	util = require('../mod.js').util,
	_addListener = [];


infoServ.on('request', function(req, res){
	var uri = parseUrl(req.url, true),
		is404 = true;
	util.eachArr(_addListener, function(){
		if (this(req, res, uri) === false) {
			is404 = false;
			return false;
		}
	});

	if (is404 && !res.headersSent) {
		res.statusCode = 404;
		res.end();
	}
});



module.exports = {
	'io': io,
	'infoServ': infoServ,
	'onRequest': function(callback){
		_addListener.push(callback);
	}
};