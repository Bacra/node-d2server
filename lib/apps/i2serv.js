var http = require('http'),
	infoServ = http.createServer(),
	io = require('socket.io').listen(infoServ, {'log': false});


module.exports = {
	'io': io,
	'infoServ': infoServ
};