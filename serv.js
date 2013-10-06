var notice = require('./lib/func/notice.js'),
	_conf = require('./lib/func/config.js');

notice.title('SYS', 'start servers');
listen('devServ', _conf.DevServPort, 'Dev Server');
listen('infoServ', _conf.InfoServPort, 'Info Server');
listen('viewServ', _conf.ViewServPort, 'View Server');
listen('spliceServ', _conf.SpliceServPort, 'Splice Server');
require('./lib/module/cmd/cmd.js');


// 加载plugins
notice.title('SYS', 'start load plugins');
require('fs').readdirSync(__dirname+'/lib/plugins/').forEach(function(dirname){
	if (dirname != '.'&& dirname != '..') {
		require('./lib/plugins/'+dirname+'/'+dirname+'.js');
		notice.info('SYS', 'load '+dirname+' plugin successs');
	}
});



// 读取配置文件
notice.title('SYS', 'start load Project Config');
require('./lib/module/ProjConfig/runProjConfig.js');


function listen(serv, port, name){
	require('./lib/apps/'+serv).on('clientError', function(err){
			notice.warn('Client', name+'('+port+') '+err);
		})
		.on('error', function(err){
			notice.error('SYS', name+' '+err);
		})
		.listen(port);

	notice.info('SYS', name+' run in Port:'+port);
}