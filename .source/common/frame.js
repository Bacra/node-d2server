;(function($){
	$(function(){
		var $win = $(window),
			$body = $(document.body),
			navHeight = $('.navbar').outerHeight(true) + 10;

		$body.scrollspy({
			target: '.bs-sidebar',
			offset: navHeight
		});


		$body.on('click', '.bs-sidenav [href^=#]', function(e) {
			var $target = $(this.getAttribute('href'));
			e.preventDefault(); // prevent browser scroll
			$win.scrollTop($target.offset().top - navHeight + 10);
		});



		// 处理hash值
		var hashchange = function(){
			setTimeout(function(){
				if (window.location.hash) {
					var $target = $(window.location.hash);
					if ($target.length) {
						$win.scrollTop($target.offset().top - navHeight + 10);
					}
				}
			}, 100);
		};

		hashchange();
		$win.on('hashchange', hashchange);

	});
})(window.jQuery);