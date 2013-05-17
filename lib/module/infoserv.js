var http = require('http'),
	_infoServer = http.createServer(function(req, res){
		res.end('111');
	});


module.exports = _infoServer;