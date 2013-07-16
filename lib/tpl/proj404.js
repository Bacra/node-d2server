var cont = '',
	mod = require('../mod.js'),
	notice = mod.notice,
	util = mod.util,
	projNamePreg = /\{@projName\}/g,
	projPagesPreg = /\{@projPages\}/g;

require('fs').readFile(__dirname+'/proj404.html', function(err, buf){
	if (err) {
		notice.warn('tpl', err);
	} else {
		cont = buf.toString();
	}
});


module.exports = function(projConf, port){
	var pages, name;

	if (projConf && port) {
		var sitePath = projConf.getSitePath(port);
		pages = '';
		name = projConf.name;
		util.eachObject(projConf.HTMLLinks, function(href, title){
			pages += '<a href="'+sitePath+href+'">'+title+'</a>';
		});
	} else {
		name = 'No Project';
		pages = '<no html file>';
	}

	return cont.replace(projNamePreg, name).replace(projPagesPreg, pages);
};