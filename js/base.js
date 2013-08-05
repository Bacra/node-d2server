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


(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-42846617-1', 'bacra.github.io');
ga('send', 'pageview');