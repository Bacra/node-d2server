if (window.io && io.connect) {
	io.connect('http://{@Domain}:{@IOport}/d2')
		.on('connect', function(){
			this.emit('joinProj', "{@projRoot}");
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
}







// 额外的信息列表
;(function(div, isVisible){

	var IEversion = 3,
		IEdiv = document.createElement('div'),
		IEelems = IEdiv.getElementsByTagName('i');

	do {
		IEdiv.innerHTML = '<!--[if gt IE ' + (++IEversion) + ']><i></i><![endif]-->';
	} while (IEelems[0]);

	if (window.addEventListener) {
		window.addEventListener('keydown', bindEvent, false);
	} else if (window.attachEvent) {
		document.attachEvent('onkeydown', bindEvent);
	}


	function bindEvent(e){
		if (e.keyCode == 192){
			if (isVisible) {
				divHide();
			} else {
				if (div) {
					divShow();
				} else {
					buildDiv();
					isVisible = true;
				}
			}
		}
	}


	function buildDiv(){
		var pages = __pages__,
			devSitePath = "{@devSitePath}", viewSitePath = "{@viewSitePath}",
			pages1 = [], pages2 = [];

		div = document.createElement('div');
		div.style.position = !IEversion || IEversion > 6 ? 'fixed' : 'absolute';
		div.style.zIndex = 99999;
		div.style.top = '30%';
		div.style.left = '50%';
		div.style.marginLeft = '-150px';
		div.style.width = '300px';
		div.style.padding = '20px';

		div.style.border = '#666 3px solid';
		div.style.boxShadow = '3px 3px 10px #ccc';
		div.style.borderRadius = '4px';
		div.style.background = '#fff';
		
		div.style.textAlign = 'left';
		div.style.fontSize = '12px';
		div.style.color = '#333';
		div.style.lineHeight = '1.4';

		for(var i in pages) {
			pages1.push('<a href="'+devSitePath+i+'" style="margin-right: 12px; white-space: nowrap; float: left;">'+pages[i]+'</a>');
			pages2.push('<a href="'+viewSitePath+i+'" style="margin-right: 12px; white-space: nowrap; float: left;">'+pages[i]+'</a>');
		}

		if (pages1.length) {
			pages1 = pages1.join('');
			pages2 = pages2.join('');
		} else {
			pages1 = pages2 = 'APP do not has any pages';
		}

		div.innerHTML = '<em style="position: absolute; top: 4px; right: 8px; cursor: pointer; font-size: 16px;">×</em><h2 style="font-weight: bold; font-size: 14px;">Dev Pages</h2><p>'+pages1+'</p><div style="clear: both; height: 0; width:100%;"></div><h2 style="margin-top: 8px; font-weight: bold; font-size: 14px; cursor: pointer;">Show View Pages</h2><p style="display: none;">'+pages2+'</p>';

		div.getElementsByTagName('em')[0].onclick = divHide;
		div.getElementsByTagName('h2')[1].onclick = function(){
			div.getElementsByTagName('p')[1].style.display = 'block';
			this.style.cursor = 'auto';
		};

		document.body.appendChild(div);
	}


	function divShow(){
		div.style.display = "block";
		isVisible = true;
	}

	function divHide(){
		div.style.display = "none";
		isVisible = false;
	}

})();