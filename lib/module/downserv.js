var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),
	querystring = require('querystring'),
	
	util = require('../util.js'),
	notice = require('../notice.js'),
	downServ = require('./initI2serv.js').infoServ,
	DocumentRoot = require('../conf.js').DocumentRoot,

	urlReg = /^\/download/i,
	_formBuf = fs.readFileSync(__dirname+'/server/downform.html');


downServ.on('request', function (req, res) {
	if (!urlReg.test(req.url)) return;

	if (req.method === "POST") {
		var postData = '';
		req.on('data', function (chunk) {
			postData += chunk;
		}).on('end', function() {
			//阻止空的请求
			if (!postData) { res.end('no Date'); return;}

			var postDataObject = querystring.parse(postData),
				leaveFileNum = 0;
			postDataObject.files.split(/\s+/).forEach(function(v){
				if (!v) return;		// 删除空行

				var uri = url.parse(v),
					file = DocumentRoot + '/' + uri.hostname + '/' + uri.pathname;
				if (fs.existsSync(file)){
					notice.log('download', 'file exists', v);
					return;
				} else {
					leaveFileNum++;
					var stopTime = util.stRunTime(),
						interval = setInterval(function(){
							notice.warn('download', 'still loading', v);
						}, 5000),
						stop = function(){
							clearInterval(interval);
							if (--leaveFileNum < 1) res.end('Success!!');
						};
					http.get(v, function(rs) {
						if (rs.statusCode != 200) {
							notice.warn('download', 'link file faild', v);
							stop();
						} else {
							util.mkdirs(path.dirname(file));
							rs.on('error', function (err) {
									notice.error('download', err);
									stop();
								})
								.on('end', function(){
									notice.log('download', 'success @ms:'+stopTime(), v);
									stop();
								});
							rs.pipe(fs.createWriteStream(file));
						}
					})
					.on('error', function(err){
						notice.error('download', err);
						stop();
					});
				}
			});

			if (!leaveFileNum) res.end('OK');
		});
	} else {
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(_formBuf);
	}

});



module.exports = downServ;