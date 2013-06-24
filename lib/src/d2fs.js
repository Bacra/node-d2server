if (window.io && io.connect) {
	io.connect('http://{@Domain}:{@IOport}/d2')
		.on('connect', function(){
			this.emit('joinApp', "{@appRoot}");
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
			alias = "{@alias}",
			pageNum = pages.length,
			host1, host2, pages1, pages2;

		div = document.createElement('div');
		div.style.position = 'fixed';
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


		if (pageNum) {
			pages1 = [];
			pages2 = [];

			if (alias) {
				host1 = 'http://'+alias+'.{@Domain}:{@DevPort}/';
				host2 = 'http://'+alias+'.{@Domain}:{@ViewPort}/';
			} else {
				host1 = 'http://{@Domain}:{@DevPort}/{@dirname}/';
				host2 = 'http://{@Domain}:{@ViewPort}/{@dirname}/';
			}

			for(var i = 0; i < pageNum; i++) {
				pages1.push('<a href="'+host1+pages[i].href+'" style="margin-right: 12px; white-space: nowrap; float: left;">'+pages[i].title+'</a>');
				pages2.push('<a href="'+host2+pages[i].href+'" style="margin-right: 12px; white-space: nowrap; float: left;">'+pages[i].title+'</a>');
			}

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