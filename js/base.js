


;(function($){
	var $win = $(window),
		$body = $(document.body),
		navHeight = $('.navbar').outerHeight(true) + 10;

	$body.scrollspy({
		target: '.bs-sidebar',
		offset: navHeight
	});

	$('.bs-docs-container [href=#]').click(function(e) {
		e.preventDefault()
	});

	$body.on('click', '.bs-sidenav [href^=#]', function(e) {
		var $target = $(this.getAttribute('href'))

		e.preventDefault() // prevent browser scroll

		$win.scrollTop($target.offset().top - navHeight);
	});

	// back to top
	setTimeout(function() {
		var $sideBar = $('.bs-sidebar')

		$sideBar.affix({
			offset: {
				top: function() {
					var offsetTop = $sideBar.offset().top
					var sideBarMargin = parseInt($sideBar.children(0).css('margin-top'), 10)
					var navOuterHeight = $('.wf_mNavbar').height()

					return (this.top = offsetTop - navOuterHeight - sideBarMargin)
				},
				bottom: function() {
					return (this.bottom = $('.bs-footer').outerHeight(true))
				}
			}
		})
	}, 100)

	setTimeout(function() {
		$('.bs-top').affix()
	}, 100)

	// tooltip demo
	$('.tooltip-demo').tooltip({
		selector: "[data-toggle=tooltip]"
	})

	$('.tooltip-test').tooltip()
	$('.popover-test').popover()

	$('.bs-docs-navbar').tooltip({
		selector: "a[data-toggle=tooltip]",
		container: ".bs-docs-navbar .nav"
	})

	// popover demo
	$("[data-toggle=popover]")
		.popover()

	// button state demo
	$('#fat-btn')
		.click(function() {
			var btn = $(this)
			btn.button('loading')
			setTimeout(function() {
				btn.button('reset')
			}, 3000)
		})

	// carousel demo
	$('.bs-docs-carousel-example').carousel()

	// javascript build logic
	var inputsComponent = $("#less input"),
		inputsPlugin = $("#plugins input"),
		inputsVariables = $("#less-variables input");

	// toggle all plugin checkboxes
	$('#less .toggle').on('click', function(e) {
		e.preventDefault()
		inputsComponent.prop('checked', !inputsComponent.is(':checked'))
	})

	$('#plugins .toggle').on('click', function(e) {
		e.preventDefault()
		inputsPlugin.prop('checked', !inputsPlugin.is(':checked'))
	})

	$('#less-variables .toggle').on('click', function(e) {
		e.preventDefault()
		inputsVariables.val('')
	})
})(window.jQuery);


