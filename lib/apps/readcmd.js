process.stdin.setEncoding('utf8');

// 命令行拓展
var readline = require('readline'),
	fs = require('fs'),
	_conf = require('../../conf.js'),
	util = require('../util.js'),
	notice = require('../notice.js'),

	rl = readline.createInterface(process.stdin, process.stdout),
	yesReg = /^y(es)?$/i,

	AppConfig = require('../appconfig.js');

rl.setPrompt('D2> ');
rl.prompt();


rl.on('line', function(data){
	data = data.trim();

	if (data == 'rs') {
		rl.prompt();
		return;
	}

	var cmd = data.split(/\s+/),
		cmdName = cmd[0].toLowerCase();

	switch(cmdName) {
		case 'init':
			if (!cmd[1]) {
				notice.warn('Object Init', 'Enter the project path');
			} else if (cmd[1].indexOf('/') == -1) {
				question('Do you want create "'+cmd[1]+'" project?', function() {
					require('./deployApp.js')(cmd[1], cmd[2]);
				});
			} else {
				notice.warn('Object Init', 'Does not support the two directories', cmd[1]);
			}
			break;

		case 'export':
			if (!cmd[1]) {
				notice.warn('Object Export', 'Specifying the project name');
			} else {
				var appConf = AppConfig.find(util.parsePath(_conf.DocumentRoot+cmd[1]+'/'));
				if (appConf) {
					require('./export.js')(appConf);
				} else {
					notice.warn('Object Export', 'app not exists', cmd[1]);
				}
			}
			break;


		case 'cls':
		case 'clear':
			AppConfig.clearCache();
			notice.log('Cache', 'clear Cache success');
			break;

		default:
			notice.warn('cmd', 'what do you mean? --'+data);
	}

	rl.prompt();
}).on('close', function() {
	console.log('Have a great day!');
	process.exit(0);
});





module.exports = {
	'origin': rl,
	'question': question
};


function question(ques, yes, no){
	rl.question(ques+' (yes/no) ', function(answer){
		if (yesReg.test(answer)) {
			yes();
		} else if (no) {
			no();
		}

		rl.prompt();
	});
}
