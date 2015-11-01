define(['lp_libs'], function(lp) {
	function lazyImg(scope) {
		this.imgs = [];
		this.scan();
		this.maxHeight = window.screen.height,
		this.maxWidth = window.screen.width;
	}
	lazyImg.prototype = {
		scan: function (el) {
			el = el || window.document;
			this.imgs = Array.prototype.filter.call(el.getElementsByTagName('img'), function (d) {
				return d.hasAttribute('data-lazy-src');
			});
			this.spy();
		},
		spy: function () {
			var me = this;
			function _spy() {
				if (me.imgs.length === 0) {
					window.removeEventListener("scroll", _spy);
					return;
				}
				me.imgs = me.imgs.filter(function (d, i, arr) {
					var pos = d.getBoundingClientRect();
					if (pos.top >= -100 && pos.top < me.maxHeight && pos.left < me.maxWidth) {
						if (d.dataset)
							d.src = d.dataset['lazySrc'];
						else
							d.src = d.getAttribute('data-lazy-src');
						d.removeAttribute('data-lazy-src');
						return false;
					} else {
						return true;
					}
				})
			}
			window.addEventListener('scroll', _spy);
		}
	}
	return lazyImg;
});
