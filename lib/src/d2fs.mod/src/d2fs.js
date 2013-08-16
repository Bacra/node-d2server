if (window.io && io.connect) {
	io.connect('http://__Domain__:__IOport__/d2')
		.on('connect', function(){
			this.emit('joinProj', "__projDirname__");
		})
		.on('cssReload', function (data) {
			var cssElem = document.getElementsByTagName('link'),
				filename = data.filename.toLowerCase();
			for (var i = 0, num = cssElem.length; i < num; i++) {
				if (cssElem[i].href.toLowerCase().indexOf(filename) !== -1) {
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
;(function(div, isVisible, ltIE7){

	var IEdiv = document.createElement('div'),
		IEelems = IEdiv.getElementsByTagName('i');

	IEdiv.innerHTML = '<!--[if lt IE 7]><i></i><![endif]-->';
	ltIE7 = IEelems.length;

	if (window.addEventListener) {
		window.addEventListener('keydown', bindEvent, false);
	} else if (window.attachEvent) {
		document.attachEvent('onkeydown', bindEvent);
	}


	// div样式
	var styleExt = new Date().getTime(),
		styleReg = /d2_extDiv/g,
		styleElem = document.createElement('style');

	styleElem.type = 'text/css';
	styleElem.textContent = fixStyle('#d2_extDiv, #d2_extDiv * {padding:0; margin:0; font-size: 12px; line-height: 1.4; float: none; text-decoration: none; font-style: normal;}.d2_extDiv__clear{clear: both; height: 0; width:100%;}#d2_extDiv{padding: 20px; border: #666 3px solid; box-shadow: 3px 3px 10px #ccc; border-radius: 4px; background: #fff; text-align: left; font-size: 12px; color: #333; line-height: 1.4;}#d2_extDiv__closeBt{position: absolute; top: 4px; right: 8px; cursor: pointer; font-size: 16px;}#d2_extDiv a{margin-right: 12px; white-space: nowrap; float: left; color: #2a6496;}#d2_extDiv a:hover{text-decoration: underline;}.d2_extDiv__h2 {font-weight: bold; font-size: 14px;}.d2_extDiv__box{margin-top: 4px;}#d2_extDiv__viewTag{margin-top: 8px; cursor: pointer;}#d2_extDiv__viewBox{display: none;}');
	document.body.appendChild(styleElem);

	function fixStyle(cont) {
		return cont.replace(styleReg, function(match){
			return match+styleExt;
		});
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
			devSitePath = "__devSitePath__", viewSitePath = "__viewSitePath__",
			pages1 = [], pages2 = [];

		div = document.createElement('div');
		div.style.position = ltIE7 ? 'absolute' : 'fixed';
		div.style.zIndex = 99999;
		div.style.top = '200px';
		div.style.left = '50%';
		div.style.marginLeft = '-200px';
		div.style.width = '400px';

		for(var i in pages) {
			pages1.push('<a href="'+devSitePath+i+'">'+pages[i]+'</a>');
			pages2.push('<a href="'+viewSitePath+i+'">'+pages[i]+'</a>');
		}

		if (pages1.length) {
			pages1 = pages1.join('');
			pages2 = pages2.join('');
		} else {
			pages1 = pages2 = 'APP do not has any pages';
		}

		div.innerHTML = fixStyle('<div id="d2_extDiv"><div id="d2_extDiv__closeBt">×</div><div class="d2_extDiv__h2">Dev Pages</div><div class="d2_extDiv__box">'+pages1+'</div><div class="d2_extDiv__clear"></div><div class="d2_extDiv__h2" id="d2_extDiv__viewTag">Show View Pages</div><div class="d2_extDiv__box" id="d2_extDiv__viewBox">'+pages2+'</div><div style="clear: both; height: 0; width:100%;"></div>'+(ltIE7?'<iframe frameBorder="0" style="position:absolute;left:0;top:0;width:100%;z-index:-1;filter:Alpha(Opacity=0);border:solid;"></iframe>' : ''));

		document.body.appendChild(div);

		document.getElementById('d2_extDiv'+styleExt+'__closeBt').onclick = divHide;
		document.getElementById('d2_extDiv'+styleExt+'__viewTag').onclick = function(){
			document.getElementById('d2_extDiv'+styleExt+'__viewBox').style.display = 'block';
			this.style.cursor = 'auto';
		};
	}


	function divShow(){
		div.style.display = "block";
		isVisible = true;

		if (ltIE7) div.style.top = 400 + document.documentElement.scrollTop + 'px';
	}

	function divHide(){
		div.style.display = "none";
		isVisible = false;
	}

})();