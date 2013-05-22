var socket = io.connect('http://www.test.com:81/d2');
socket.on('connect', function(){
		socket.emit('href', window.location.href);
	})
	.on('fsCh', function (data) {
		console.log(data);
		if (data.extname == 'less' || data.extname == 'css') {
			var css = document.getElementsByTagName('link');
			for (var i = 0, num = css.length; i < num; i++) {
				if (css[i].href.toLowerCase().indexOf(data.pathfilename) !== -1) {
					css[i].href = data.pathname + '?v='+(new Date().getTime());
					return;
				}
			}
		}
		// window.location.reload();
	})
	.on('error', function(err){
		if (console && console.error) {
			console.error(err);
		} else {
			alert(err);
		}
	});