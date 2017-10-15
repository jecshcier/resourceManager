/*加载动画js
author: chenshenhao
*/
(function($) {
	$.fn.mLoading = function(type) {
		switch(type)
			{
				case 1:
				$(this).append('<article class="loader"><article class="dot"></article><article class="dot"></article><article class="dot"></article><article class="dot"></article><article class="dot"></article></article>');
				break;
			}
	}
}(jQuery));