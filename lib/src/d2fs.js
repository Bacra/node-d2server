io.connect('http://www.test.com:81/d2')
	.on('connect', function(){
		this.emit('joinApp', "{@appname}");
	})
	.on('cssReload', function (data) {
		var cssElem = document.getElementsByTagName('link');
		for (var i = 0, num = cssElem.length; i < num; i++) {
			if (cssElem[i].href.toLowerCase().indexOf(data.filename) !== -1) {
				cssElem[i].href = data.pathname + '?v='+(new Date().getTime());
				return;
			}
		}

		window.location.reload();
	})
	.on('pageReload', function(){
		window.location.reload();
	})
	.on('error', function(err){
		if (console && console.error) {
			console.error(err);
		} else {
			alert(err);
		}
	});