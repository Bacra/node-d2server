var http = require('http'),
	infoServ = http.createServer(),
	parseUrl = require('url').parse,
	io = require('socket.io').listen(infoServ, {'log': false}),

	// infoView 拓展方法
	util = require('../mod.js').util,
	_addListener = [];


infoServ.on('request', function(req, res){
	var uri = parseUrl(req.url, true);
	util.eachArr(_addListener, function(){
		return this(req, res, uri);
	});
});



module.exports = {
	'io': io,
	'infoServ': infoServ,
	'onRequest': function(callback){
		_addListener.push(callback);
	}
};