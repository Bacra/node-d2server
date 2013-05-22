var infoServ = require('./initI2serv.js').infoServ,
	fs = require('fs');

module.exports = infoServ;



infoServ.on('request', function(req, res){
	if (req.url == '/' || req.url == '/index.html') {
		res.end(fs.readFileSync('./wwwroot/websocket/index.html'));
	}
});

