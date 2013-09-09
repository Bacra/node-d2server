var http = require('http'),
	infoServ = http.createServer(),
	mod = require('../mod.js'),
	util = mod.util,
	_conf = mod.conf,
	getURI = mod.load('getURI'),
	io = require('socket.io').listen(infoServ, {'log': false}),

	// infoView 拓展方法
	_addListener = [];


infoServ.on('request', function(req, res){
	var uri = getURI(req);
	util.eachArr(_addListener, function(){
		return this(req, res, uri);
	});
});



module.exports = {
	'io': io,
	'infoServ': infoServ,
	'url': 'http://'+_conf.Domain+':'+_conf.InfoServPort+'/',
	'onRequest': function(callback){
		_addListener.push(callback);
	}
};