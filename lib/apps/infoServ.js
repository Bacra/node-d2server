var i2serv = require('./i2serv.js'),
	fs = require('fs'),
	path = require('path'),
	querystring = require('querystring'),
	mod = require('../mod.js'),
	mime = mod.mime,
	notice = mod.notice,
	util = mod.util,
	ejs = require('ejs');

module.exports = i2serv.infoServ;


i2serv.onRequest(function(req, res, uri){
	if (!uri.pathname.indexOf('/console/')) {
		var file = mod.dirname+'/src/console/'+uri.pathname,
			extname = util.getExtname(file);

		if (!extname) {
			var filename = path.basename(uri.pathname);
			if (req.method == 'GET') {
				endResquest(res, uri, file, require(mod.dirname+'/src/console/get/'+filename+'.js')(uri));
			} else {
				var postData = '';
				res.on('data', function(buf){
					postData += buf;
				});
				res.on('end', function(){
					endResquest(res, uri, file, require(mod.dirname+'/src/console/get/'+filename+'.js')(uri, querystring.parse(postData.toString())));
				});
			}
		} else if (!util.fileExists(file)) {
			res.statusCode = 400;
			res.end();
			notice.warn('404', 'Console Server file is not exists', file);
		} else {
			res.writeHeader(200, {
				'Content-Type': mime(extname)
			});
			res.end(fs.readFileSync(file));
		}

		return false;
	}
});



function endResquest(res, uri, file, data) {
	if (uri.query.format == 'json') {
		res.writeHeader(200, {
			'Content-Type': mime('json')
		});
		res.end(JSON.stringify(data));
	} else if (uri.query.format == 'jsonp') {
		res.writeHeader(200, {
			'Content-Type': mime('jsonp')
		});
		res.end((uri.query.callback || 'consoleCallback')+'('+JSON.stringify(data)+')');
	} else {
		res.writeHeader(200, {
			'Content-Type': mime('html')
		});
		res.end(ejs.compile(fs.readFileSync(file+'.html').toString(), {'open': '{{', 'close': '}}'})(data));
	}
}

