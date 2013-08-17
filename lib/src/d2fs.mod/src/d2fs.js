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
	styleElem.textContent = fixStyle(['#d2_extDiv, #d2_extDiv * {',
			'padding:0; margin:0; font-size: 12px; line-height: 1.4; float: none; text-decoration: none; font-style: normal;',
		'}',
		'#d2_extDiv{',
			'padding: 20px; border: #666 3px solid; box-shadow: 3px 3px 10px #ccc; border-radius: 4px; background: #fff; text-align: left; font-size: 12px; color: #333; line-height: 1.4;',
		'}',
		'.d2_extDiv__clear{',
			'clear: both; height: 0; width:100%;',
		'}',
		'#d2_extDiv__closeBt{',
			'position: absolute; top: 4px; right: 8px; cursor: pointer; font-size: 16px;',
		'}',
		'#d2_extDiv a{',
			'margin-right: 12px; white-space: nowrap; float: left; color: #2a6496;',
		'}',
		'#d2_extDiv a:hover{',
			'text-decoration: underline;',
		'}',
		'.d2_extDiv__tag {',
			'font-weight: bold; font-size: 14px; cursor: pointer;',
		'}',
		'.d2_extDiv__box{',
			'margin-top: 4px; display: none;',
		'}',
		'#d2_extDiv__viewTag, #d2_extDiv__spliceTag{',
			'margin-top: 8px;',
		'}'].join(''));
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
			pages1 = [], pages2 = [], pages3= [],
			i;

		div = document.createElement('div');
		div.style.position = ltIE7 ? 'absolute' : 'fixed';
		div.style.zIndex = 99999;
		div.style.top = '200px';
		div.style.left = '50%';
		div.style.marginLeft = '-200px';
		div.style.width = '400px';

		if (window.location.hostname == "__localHostname__") {
			for(i in pages) {
				pages1.push('<a href="//__localHostname__:__DevServPort__/'+i+'">'+pages[i]+'</a>');
				pages2.push('<a href="//__localHostname__:__ViewServPort__/'+i+'">'+pages[i]+'</a>');
				pages3.push('<a href="//__localHostname__:__SpliceServPort__/'+i+'">'+pages[i]+'</a>');
			}
		} else {
			for(i in pages) {
				pages1.push('<a href="//__Domain__:__DevServPort__/__projDirname__/'+i+'">'+pages[i]+'</a>');
				pages2.push('<a href="//__Domain__:__ViewServPort__/__projDirname__/'+i+'">'+pages[i]+'</a>');
				pages3.push('<a href="//__Domain__:__SpliceServPort__/__projDirname__/'+i+'">'+pages[i]+'</a>');
			}
		}

		if (pages1.length) {
			pages1 = pages1.join('');
			pages2 = pages2.join('');
			pages3 = pages3.join('');
		} else {
			pages1 = pages2 = pages2 = 'Project do not has any pages';
		}

		div.innerHTML = fixStyle(['<div id="d2_extDiv">',
				'<div id="d2_extDiv__closeBt">×</div>',
				// dev pages
				'<div class="d2_extDiv__tag" id="d2_extDiv__devTag">Show Dev Pages</div>',
				'<div class="d2_extDiv__box" id="d2_extDiv__devBox">'+pages1+'</div>',
				'<div class="d2_extDiv__clear"></div>',
				// view pages
				'<div class="d2_extDiv__tag" id="d2_extDiv__viewTag">Show View Pages</div>',
				'<div class="d2_extDiv__box" id="d2_extDiv__viewBox">'+pages2+'</div>',
				'<div class="d2_extDiv__clear"></div>',
				// splice pages
				'<div class="d2_extDiv__tag" id="d2_extDiv__spliceTag">Show Splice Pages</div>',
				'<div class="d2_extDiv__box" id="d2_extDiv__spliceBox">'+pages3+'</div>',
				'<div class="d2_extDiv__clear"></div>'].join('')
			+(ltIE7?'<iframe frameBorder="0" style="position:absolute;left:0;top:0;width:100%;z-index:-1;filter:Alpha(Opacity=0);border:solid;"></iframe>' : ''));

		document.body.appendChild(div);

		document.getElementById('d2_extDiv'+styleExt+'__closeBt').onclick = divHide;

		bindTagClick('dev', __DevServPort__);
		bindTagClick('view', __ViewServPort__);
		bindTagClick('splice', __SpliceServPort__);

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

	function bindTagClick(name, port){
		name = 'd2_extDiv'+styleExt+'__'+name;

		var bt = document.getElementById(name+'Tag'),
			box = document.getElementById(name+'Box'),
			func = function(){
				this.onclick = null;
				box.style.display = 'block';
				this.style.cursor = 'auto';
				this.innerHTML = this.innerHTML.substring(5);
			};
		
		bt.onclick = func;
		if (window.location.port == port) func.call(bt);
	}

})();