io.connect('http://{@Domain}:{@IOport}/d2')
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
		div = document.createElement('div');
		div.style.position = 'fixed';
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


		div.innerHTML = '<em style="position: absolute; top: 4px; right: 8px; cursor: pointer; font-size: 16px;">×</em><iframe src="http://{@Domain}:{@IOport}/devServ/redirect.html?root={@appname}" scrolling="no" frameboder="0" marginheight="0" marginwidth="0"></iframe>';

		div.getElementsByTagName('em')[0].onclick = divHide;

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