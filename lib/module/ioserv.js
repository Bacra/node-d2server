var http = require('http'),
	io = require('socket.io');

io.listen(require('./infoserv.js'));
