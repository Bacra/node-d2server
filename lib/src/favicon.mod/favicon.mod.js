var mod = require('../../mod.js'),
	endsWidth = mod.util.endsWidth,
	_faviconIcoBuf;


require('fs').readFile(__dirname+'/favicon.ico', function(err, buf){
	if (err) {
		mod.notice.warn('SYS', 'favicon not exists');
	} else {
		_faviconIcoBuf = buf;
	}
});


module.exports = function(req, res){
	if (endsWidth(req.url, '/favicon.ico')) {
		res.statusCode = 200;
		res.end(_faviconIcoBuf);
		return false;
	}
	
	return true;
};