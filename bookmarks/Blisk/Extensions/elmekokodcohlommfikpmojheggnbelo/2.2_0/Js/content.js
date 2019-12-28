var _mobileDevice = '';
var _isSwipe = true;

$.fn.scrollTo = function( target, options, callback ){
  if(typeof options == 'function' && arguments.length == 2){ callback = options; options = target; }
  var settings = $.extend({
    scrollTarget  : target,
    offsetTop     : 50,
    duration      : 500,
    easing        : 'swing'
  }, options);
  return this.each(function(){
    var scrollPane = $(this);
    var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
    var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
    scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function(){
      if (typeof callback == 'function') { callback.call(this); }
    });
  });
}

// handle communications being sent from other scripts
chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {	
		//alert(request.mobileDevice);
		if(request.mobileDevice != undefined) {	
			//background.js sending over the mobile device, add to pop up window
			if($('.mobiletest-div').html() === undefined) {	
				if(request.mobileDevice != 'notset' && (request.userAgent.toUpperCase().indexOf('CHROME') == -1 || (request.userAgent.toUpperCase().indexOf('CHROME') > 0 && request.userAgent.toUpperCase().indexOf('ANDROID') > 0))) {
					_mobileDevice = request.mobileDevice;
					_isSwipe = request.swipe;

					$('html').addClass('mobiletest-html');

					//if(request.removeScrollbars == true) {						
						//$('html').addClass('mobiletest-html').css('overflow', 'hidden'); // this runs immediately, to get rid of the scrollbars						
					//}
					//else { // this runs 1.5 seconds later to add the mobile device label and scroll arrows
						//$('body').append('<div class="mobiletest-div"><div>' + request.mobileDevice + '</div><a href="javascript:void(0);" class="mobiletest-scrollup-a" id="lnkUp">↑</a><a class="mobiletest-scrolldown-a" href="javascript:void(0);" id="lnkDown">↓</a></div>');
					//}			
				}
			}
		}
	}
); 

$(document).ready(function() {
	var notFoundCount = 0;

	var id = setInterval(function() {
		if($('html').hasClass('mobiletest-html')) {
			// check to see if we need to imitate swipe
			
			if(_isSwipe) {
				$('html').css('cursor', 'pointer');
				$('html').css('overflow', 'hidden');
								
				$(document).mousewheel(function(event, delta, deltaX, deltaY) {
					var scrollTop = $(this).scrollTop();
					$(this).scrollTop(scrollTop-(delta*100));
				});
			}
			else {
				$('html').css('cursor', 'default');
				$('html').css('overflow-y', 'auto');
				$('html').css('overflow-x', 'hidden');
			}
	
			if($('.mobiletest-div').html() === undefined) {
				$('body').append('<div class="mobiletest-div"><a href="javascript:void(0);" class="mobiletest-back-a">←</a><div>' + _mobileDevice + '</div><!--<a href="javascript:void(0);" class="mobiletest-scrollup-a" id="lnkUp">↑</a><a class="mobiletest-scrolldown-a" href="javascript:void(0);" id="lnkDown">↓</a>--></div>');
			
				if(history.length > 0) {
					$('.mobiletest-back-a').show();
				}
			}

			clearInterval(id);
		}
		else {
			if(notFoundCount > 20) {
				clearInterval(id);
			}

			notFoundCount +=1;
		}

	}, 500)

});

$(document).on('click', 'a', function(e) {
	if($(this).html() == '↑') {
		scrollMobileDevice('up');
	}
	else if($(this).html() == '↓') {
		scrollMobileDevice('down');
	}
	else if($(this).html() == '←') {
		history.back();
	}
});

var clicked = false, clickY, clickX;
$(document).on({
    'mousemove': function(e) {
		if(_isSwipe) {
			clicked && updateScrollPos(e);
		}
    },
    'mousedown': function(e) {
		if(_isSwipe) {
			clicked = true;
			clickY = e.pageY;
			clickX = e.pageX;
		}
    },
    'mouseup': function() {
		if(_isSwipe) {
			clicked = false;
			if($('html').hasClass('mobiletest-html')) {
				$('html').css('cursor', 'pointer');
			}	
		}
    }
});

var updateScrollPos = function(e) {
	if($('html').hasClass('mobiletest-html')) {
		$('html').css('cursor', 'row-resize');
    	$(window).scrollTop($(window).scrollTop() + (clickY - e.pageY));
    	$(window).scrollLeft($(window).scrollLeft() + (clickX - e.pageX));
	} 
}

function scrollMobileDevice(dir) {
	switch(dir) {
		case 'up':
			$('body').scrollTo($('body').scrollTop() -400);
			break;
		case 'down':
			$('body').scrollTo($('body').scrollTop() +400);
			break;
	}
}