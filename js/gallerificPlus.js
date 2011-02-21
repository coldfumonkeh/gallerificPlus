/*
 * jQuery gallerificPlus plugin
 *
 * Copyright (c) 2008 Matt Gifford (http://www.mattgifford.co.uk)
 * Licensed under the Creative Commons Attribution-Noncommercial-ShareAlike License
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Thanks to Trent Foley (Gallerific plugin author - http://www.twospy.com) 
 * and Leandro Vieira Pinho (jQuery Lightbox plugin author - http://leandrovieira.com), whose amazing plugins I adapted and integrated to work together.
 * I wouldn't have had anything to work with if it wasn't for those guys, so thank you very VERY much.
 */
;(function($) {

	// Write noscript style
	document.write("<style type='text/css'>.noscript{display:none}</style>");

	var ver = 'gallerifficPlus0.3';
	var galleryOffset = 0;
	var galleries = [];
	var allImages = [];	
	var historyCurrentHash;
	var historyBackStack;
	var historyForwardStack;
	var isFirst = false;
	var dontCheck = false;
	var isInitialized = false;

	function getHash() {
		var hash = location.hash;
		if (!hash) return -1;
		hash = hash.replace(/^.*#/, '');
		if (isNaN(hash)) return -1;
		return (+hash);
	}

	function registerGallery(gallery) {
		galleries.push(gallery);
		
		// update the global offset value
		galleryOffset += gallery.data.length;
	}

	function getGallery(hash) {
		for (i = 0; i < galleries.length; i++) {
			var gallery = galleries[i];
			if (hash < (gallery.data.length+gallery.offset))
				return gallery;
		}
		return 0;
	}
	
	function historyCallback() {
		// Using present location.hash always (seems to work, unlike the hash argument passed to this callback)
		var hash = getHash();
		if (hash < 0) return;

		var gallery = getGallery(hash);
		if (!gallery) return;
		
		var index = hash-gallery.offset;
		gallery.goto(index);
	}
	
	function historyInit() {
		if (isInitialized) return;
		isInitialized = true; 

		var current_hash = location.hash;
		
		historyCurrentHash = current_hash;
		if ($.browser.msie) {
			// To stop the callback firing twice during initilization if no hash present
			if (historyCurrentHash == '') {
				historyCurrentHash = '#';
			}
		} else if ($.browser.safari) {
			// etablish back/forward stacks
			historyBackStack = [];
			historyBackStack.length = history.length;
			historyForwardStack = [];
			isFirst = true;
		}

		setInterval(function() { historyCheck(); }, 100);
	}
	
	function historyAddHistory(hash) {
		// This makes the looping function do something
		historyBackStack.push(hash);
		historyForwardStack.length = 0; // clear forwardStack (true click occured)
		isFirst = true;
	}
	
	function historyCheck() {
		if ($.browser.safari) {
			if (!dontCheck) {
				var historyDelta = history.length - historyBackStack.length;
				
				if (historyDelta) { // back or forward button has been pushed
					isFirst = false;
					if (historyDelta < 0) { // back button has been pushed
						// move items to forward stack
						for (var i = 0; i < Math.abs(historyDelta); i++) historyForwardStack.unshift(historyBackStack.pop());
					} else { // forward button has been pushed
						// move items to back stack
						for (var i = 0; i < historyDelta; i++) historyBackStack.push(historyForwardStack.shift());
					}
					var cachedHash = historyBackStack[historyBackStack.length - 1];
					if (cachedHash != undefined) {
						historyCurrentHash = location.hash;
						historyCallback();
					}
				} else if (historyBackStack[historyBackStack.length - 1] == undefined && !isFirst) {
					historyCallback();
					isFirst = true;
				}
			}
		} else {
			// otherwise, check for location.hash
			var current_hash = location.hash;
			if(current_hash != historyCurrentHash) {
				historyCurrentHash = current_hash;
				historyCallback();
			}
		}
	}

	var defaults = {
		delay:                3000,
		numThumbs:            20,
		preloadAhead:         40, // Set to -1 to preload all images
		enableTopPager:       true,
		enableBottomPager:    true,
		imageContainerSel:    '',
		thumbsContainerSel:   '',
		controlsContainerSel: '',
		titleContainerSel:    '',
		descContainerSel:     '',
		downloadLinkSel:      '',
		renderSSControls:     true,
		renderNavControls:    true,
		playLinkText:         'Play',
		pauseLinkText:        'Pause',
		prevLinkText:         'Previous',
		nextLinkText:         'Next',
		nextPageLinkText:     'Next &rsaquo;',
		prevPageLinkText:     '&lsaquo; Prev',
		autoPlay:			  true,
		
		// Configuration related to overlay
		overlayBgColor: 		'#000',		// (string) Background color to overlay; inform a hexadecimal value like: #RRGGBB. Where RR, GG, and BB are the hexadecimal values for the red, green, and blue values of the color.
		overlayOpacity:			0.8,		// (integer) Opacity value to overlay; inform: 0.X. Where X are number from 0 to 9
		// Configuration related to navigation
		fixedNavigation:		false,		// (boolean) Boolean that informs if the navigation (next and prev button) will be fixed or not in the interface.
		// Configuration related to images
		imageLoading:			'images/lightbox-ico-loading.gif',		// (string) Path and the name of the loading icon
		imageBtnPrev:			'images/lightbox-btn-prev.gif',			// (string) Path and the name of the prev button image
		imageBtnNext:			'images/lightbox-btn-next.gif',			// (string) Path and the name of the next button image
		imageBtnClose:			'images/lightbox-btn-close.gif',		// (string) Path and the name of the close btn
		imageBlank:				'images/lightbox-blank.gif',			// (string) Path and the name of a blank image (one pixel)
		// Configuration related to container image box
		containerBorderSize:	10,			// (integer) If you adjust the padding in the CSS for the container, #lightbox-container-image-box, you will need to update this value
		containerResizeSpeed:	400,		// (integer) Specify the resize duration of container image. These number are miliseconds. 400 is default.
		// Configuration related to texts in caption. For example: Image 2 of 8. You can alter either "Image" and "of" texts.
		txtImage:				'Image',	// (string) Specify text "Image"
		txtOf:					'of',		// (string) Specify text "of"
		// Configuration related to keyboard navigation
		keyToClose:				'c',		// (string) (c = close) Letter to close the jQuery lightBox interface. Beyond this letter, the letter X and the SCAPE key is used to.
		keyToPrev:				'p',		// (string) (p = previous) Letter to show the previous image
		keyToNext:				'n',		// (string) (n = next) Letter to show the next image.
		// Don´t alter these variables in any way
		imageArray:				[],
		activeImage:			0,
		// Allow keyboard navigation on gallery as well as lightbox?
		galleryKeyboardNav:		true		// (boolean) Boolean that informs if the keyboard navigation will be used with the gallery (as it is used with the lightbox).
		
	};
	
	// lightbox specific functions
	
	function buildLightBox(image,gallery,current) {
	
		gallery.pause();
		
		// Hide some elements to avoid conflict with overlay in IE. These elements appear above the overlay.
		$('embed, object, select').css({ 'visibility' : 'hidden' });
		// Call the function to create the markup structure; style some elements; assign events in some elements.
		_set_interface();
		// Unset total images in imageArray
		defaults.imageArray.length = 0;
		// Unset image active information
		defaults.activeImage = 0;
		
		if ( gallery.data.length == 1 ) {
			defaults.imageArray.push(new Array(gallery.data[current].original,gallery.data[current].title));
		} else {
			// Add an Array (as many as we have), with href and title atributes, inside the Array that storage the images references		
			for ( var i = 0; i < gallery.data.length; i++ ) {
				defaults.imageArray.push(new Array(gallery.data[i].original,gallery.data[i].title));
			}
		}
		while ( defaults.imageArray[defaults.activeImage][0] != gallery.data[current].original ) {
			defaults.activeImage++;
		}
		// Call the function that prepares image exibition
		_set_image_to_view();
	}
	
	/**
	 * Create the jQuery lightBox plugin interface
	 *
	 * The HTML markup will be like that:
		<div id="jquery-overlay"></div>
		<div id="jquery-lightbox">
			<div id="lightbox-container-image-box">
				<div id="lightbox-container-image">
					<img src="../fotos/XX.jpg" id="lightbox-image">
					<div id="lightbox-nav">
						<a href="#" id="lightbox-nav-btnPrev"></a>
						<a href="#" id="lightbox-nav-btnNext"></a>
					</div>
					<div id="lightbox-loading">
						<a href="#" id="lightbox-loading-link">
							<img src="../images/lightbox-ico-loading.gif">
						</a>
					</div>
				</div>
			</div>
			<div id="lightbox-container-image-data-box">
				<div id="lightbox-container-image-data">
					<div id="lightbox-image-details">
						<span id="lightbox-image-details-caption"></span>
						<span id="lightbox-image-details-currentNumber"></span>
					</div>
					<div id="lightbox-secNav">
						<a href="#" id="lightbox-secNav-btnClose">
							<img src="../images/lightbox-btn-close.gif">
						</a>
					</div>
				</div>
			</div>
		</div>
	 *
	 */
	function _set_interface() {
		// Apply the HTML markup into body tag
		$('body').append('<div id="jquery-overlay"></div><div id="jquery-lightbox"><div id="lightbox-container-image-box"><div id="lightbox-container-image"><img id="lightbox-image"><div style="" id="lightbox-nav"><a href="#" id="lightbox-nav-btnPrev"></a><a href="#" id="lightbox-nav-btnNext"></a></div><div id="lightbox-loading"><a href="#" id="lightbox-loading-link"><img src="' + defaults.imageLoading + '"></a></div></div></div><div id="lightbox-container-image-data-box"><div id="lightbox-container-image-data"><div id="lightbox-image-details"><span id="lightbox-image-details-caption"></span><span id="lightbox-image-details-currentNumber"></span></div><div id="lightbox-secNav"><a href="#" id="lightbox-secNav-btnClose"><img src="' + defaults.imageBtnClose + '"></a></div></div></div></div>');	
		// Get page sizes
		var arrPageSizes = ___getPageSize();
		// Style overlay and show it
		$('#jquery-overlay').css({
			backgroundColor:	defaults.overlayBgColor,
			opacity:			defaults.overlayOpacity,
			width:				arrPageSizes[0],
			height:				arrPageSizes[1]
		}).fadeIn();
		// Get page scroll
		var arrPageScroll = ___getPageScroll();
		// Calculate top and left offset for the jquery-lightbox div object and show it
		$('#jquery-lightbox').css({
			top:	arrPageScroll[1] + (arrPageSizes[3] / 10),
			left:	arrPageScroll[0]
		}).show();
		// Assigning click events in elements to close overlay
		$('#jquery-overlay,#jquery-lightbox').click(function() {
			_finish();									
		});
		// Assign the _finish function to lightbox-loading-link and lightbox-secNav-btnClose objects
		$('#lightbox-loading-link,#lightbox-secNav-btnClose').click(function() {
			_finish();
			return false;
		});
		// If window was resized, calculate the new overlay dimensions
		$(window).resize(function() {
			// Get page sizes
			var arrPageSizes = ___getPageSize();
			// Style overlay and show it
			$('#jquery-overlay').css({
				width:		arrPageSizes[0],
				height:		arrPageSizes[1]
			});
			// Get page scroll
			var arrPageScroll = ___getPageScroll();
			// Calculate top and left offset for the jquery-lightbox div object and show it
			$('#jquery-lightbox').css({
				top:	arrPageScroll[1] + (arrPageSizes[3] / 10),
				left:	arrPageScroll[0]
			});
		});
	}
	
	
	/**
	 * Prepares image exibition; doing a image´s preloader to calculate it´s size
	 *
	 */
	function _set_image_to_view() { // show the loading
		// Show the loading
		$('#lightbox-loading').show();
		if ( defaults.fixedNavigation ) {
			$('#lightbox-image,#lightbox-container-image-data-box,#lightbox-image-details-currentNumber').hide();
		} else {
			// Hide some elements
			$('#lightbox-image,#lightbox-nav,#lightbox-nav-btnPrev,#lightbox-nav-btnNext,#lightbox-container-image-data-box,#lightbox-image-details-currentNumber').hide();
		}
		// Image preload process
		var objImagePreloader = new Image();
		objImagePreloader.onload = function() {
			$('#lightbox-image').attr('src',defaults.imageArray[defaults.activeImage][0]);
			// Perfomance an effect in the image container resizing it
			_resize_container_image_box(objImagePreloader.width,objImagePreloader.height);
			//	clear onLoad, IE behaves irratically with animated gifs otherwise
			objImagePreloader.onload=function(){};
		};
		objImagePreloader.src = defaults.imageArray[defaults.activeImage][0];
	};
	
	/**
	 * Perfomance an effect in the image container resizing it
	 *
	 * @param integer intImageWidth The image´s width that will be showed
	 * @param integer intImageHeight The image´s height that will be showed
	 */
	function _resize_container_image_box(intImageWidth,intImageHeight) {
		// Get current width and height
		var intCurrentWidth = $('#lightbox-container-image-box').width();
		var intCurrentHeight = $('#lightbox-container-image-box').height();
		// Get the width and height of the selected image plus the padding
		var intWidth = (intImageWidth + (defaults.containerBorderSize * 2)); // Plus the image´s width and the left and right padding value
		var intHeight = (intImageHeight + (defaults.containerBorderSize * 2)); // Plus the image´s height and the left and right padding value
		// Diferences
		var intDiffW = intCurrentWidth - intWidth;
		var intDiffH = intCurrentHeight - intHeight;
		// Perfomance the effect
		$('#lightbox-container-image-box').animate({ width: intWidth, height: intHeight },defaults.containerResizeSpeed,function() { _show_image(); });
		if ( ( intDiffW == 0 ) && ( intDiffH == 0 ) ) {
			if ( $.browser.msie ) {
				___pause(250);
			} else {
				___pause(100);	
			}
		} 
		$('#lightbox-container-image-data-box').css({ width: intImageWidth });
		$('#lightbox-nav-btnPrev,#lightbox-nav-btnNext').css({ height: intImageHeight + (defaults.containerBorderSize * 2) });
	};
	
	/**
	 * Show the prepared image
	 *
	 */
	function _show_image() {
		$('#lightbox-loading').hide();
		$('#lightbox-image').fadeIn(function() {
			_show_image_data();
			_set_navigation();
		});
		_preload_neighbor_images();
	};
	
	/**
	 * Show the image information
	 *
	 */
	function _show_image_data() {
		$('#lightbox-container-image-data-box').slideDown('fast');
		$('#lightbox-image-details-caption').hide();
		if ( defaults.imageArray[defaults.activeImage][1] ) {
			$('#lightbox-image-details-caption').html(defaults.imageArray[defaults.activeImage][1]).show();
		}
		// If we have a image set, display 'Image X of X'
		if ( defaults.imageArray.length > 1 ) {
			$('#lightbox-image-details-currentNumber').html(defaults.txtImage + ' ' + ( defaults.activeImage + 1 ) + ' ' + defaults.txtOf + ' ' + defaults.imageArray.length).show();
		}		
	}
	
	// handles the reloaction of the URL hash variable when the previous/next buttons are clicked within the lightbox UI.
	function changeThumbnail(activeImg) {
		location.href = '#'+activeImg;

		// IE we need to explicity call goto
		/*if ($.browser.msie) {
			this.goto(activeImg);
		}*/
	}
	
	/**
	 * Display the button navigations
	 *
	 */
	function _set_navigation() {
		$('#lightbox-nav').show();

		// Instead to define this configuration in CSS file, we define here. And it´s need to IE. Just.
		$('#lightbox-nav-btnPrev,#lightbox-nav-btnNext').css({ 'background' : 'transparent url(' + defaults.imageBlank + ') no-repeat' });
		
		// Show the prev button, if not the first image in set
		if ( defaults.activeImage != 0 ) {
			if ( defaults.fixedNavigation ) {
				$('#lightbox-nav-btnPrev').css({ 'background' : 'url(' + defaults.imageBtnPrev + ') left 15% no-repeat' })
					.unbind()
					.bind('click',function() {
						defaults.activeImage = defaults.activeImage - 1;
						changeThumbnail();
						_set_image_to_view();
						return false;
					});
			} else {
				// Show the images button for Next buttons
				$('#lightbox-nav-btnPrev').unbind().hover(function() {
					$(this).css({ 'background' : 'url(' + defaults.imageBtnPrev + ') left 15% no-repeat' });
				},function() {
					$(this).css({ 'background' : 'transparent url(' + defaults.imageBlank + ') no-repeat' });
				}).show().bind('click',function() {
					defaults.activeImage = defaults.activeImage - 1;
					changeThumbnail(defaults.activeImage);
					_set_image_to_view();
					return false;
				});
			}
		}
		
		// Show the next button, if not the last image in set
		if ( defaults.activeImage != ( defaults.imageArray.length -1 ) ) {
			if ( defaults.fixedNavigation ) {
				$('#lightbox-nav-btnNext').css({ 'background' : 'url(' + defaults.imageBtnNext + ') right 15% no-repeat' })
					.unbind()
					.bind('click',function() {
						defaults.activeImage = defaults.activeImage + 1;
						changeThumbnail(defaults.activeImage);
						_set_image_to_view();
						return false;
					});
			} else {
				// Show the images button for Next buttons
				$('#lightbox-nav-btnNext').unbind().hover(function() {
					$(this).css({ 'background' : 'url(' + defaults.imageBtnNext + ') right 15% no-repeat' });
				},function() {
					$(this).css({ 'background' : 'transparent url(' + defaults.imageBlank + ') no-repeat' });
				}).show().bind('click',function() {
					defaults.activeImage = defaults.activeImage + 1;
					changeThumbnail(defaults.activeImage);
					_set_image_to_view();
					return false;
				});
			}
		}
		// Enable keyboard navigation
		_enable_keyboard_navigation();
	}
	
	/**
	 * Enable a support to keyboard navigation
	 *
	 */
	function _enable_keyboard_navigation() {
		$(document).keydown(function(objEvent) {
			_keyboard_action(objEvent);
		});
	}
	/**
	 * Disable the support to keyboard navigation
	 *
	 */
	function _disable_keyboard_navigation() {
		$(document).unbind();
	}
	
	
	/**
	 * Perform the keyboard actions
	 *
	 */
	function _keyboard_action(objEvent) {
		// To ie
		if ( objEvent == null ) {
			keycode = event.keyCode;
			escapeKey = 27;
		// To Mozilla
		} else {
			keycode = objEvent.keyCode;
			escapeKey = objEvent.DOM_VK_ESCAPE;
		}
		// Get the key in lower case form
		key = String.fromCharCode(keycode).toLowerCase();
		// Verify the keys to close the ligthBox
		if ( ( key == defaults.keyToClose ) || ( key == 'x' ) || ( keycode == escapeKey ) ) {
			_finish();
		}
		// Verify the key to show the previous image
		if ( ( key == defaults.keyToPrev ) || ( keycode == 37 ) ) {
			// If we´re not showing the first image, call the previous
			if ( defaults.activeImage != 0 ) {
				defaults.activeImage = defaults.activeImage - 1;
				changeThumbnail(defaults.activeImage);
				_set_image_to_view();
				_disable_keyboard_navigation();
			}
		}
		// Verify the key to show the next image
		if ( ( key == defaults.keyToNext ) || ( keycode == 39 ) ) {
			// If we´re not showing the last image, call the next
			if ( defaults.activeImage != ( defaults.imageArray.length - 1 ) ) {
				defaults.activeImage = defaults.activeImage + 1;
				changeThumbnail(defaults.activeImage);
				_set_image_to_view();
				_disable_keyboard_navigation();
			}
		}
	}
	/**
	 * Preload prev and next images being showed
	 *
	 */
	function _preload_neighbor_images() {
		if ( (defaults.imageArray.length -1) > defaults.activeImage ) {
			objNext = new Image();
			objNext.src = defaults.imageArray[defaults.activeImage + 1][0];
		}
		if ( defaults.activeImage > 0 ) {
			objPrev = new Image();
			objPrev.src = defaults.imageArray[defaults.activeImage -1][0];
		}
	}
	/**
	 * Remove jQuery lightBox plugin HTML markup
	 *
	 */
	function _finish() {
		$('#jquery-lightbox').remove();
		$('#jquery-overlay').fadeOut(function() { $('#jquery-overlay').remove(); });
		// Show some elements to avoid conflict with overlay in IE. These elements appear above the overlay.
		$('embed, object, select').css({ 'visibility' : 'visible' });
	}
	/**
	 / THIRD FUNCTION
	 * getPageSize() by quirksmode.com
	 *
	 * @return Array Return an array with page width, height and window width, height
	 */
	function ___getPageSize() {
		var xScroll, yScroll;
		if (window.innerHeight && window.scrollMaxY) {	
			xScroll = window.innerWidth + window.scrollMaxX;
			yScroll = window.innerHeight + window.scrollMaxY;
		} else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
			xScroll = document.body.scrollWidth;
			yScroll = document.body.scrollHeight;
		} else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
			xScroll = document.body.offsetWidth;
			yScroll = document.body.offsetHeight;
		}
		var windowWidth, windowHeight;
		if (self.innerHeight) {	// all except Explorer
			if(document.documentElement.clientWidth){
				windowWidth = document.documentElement.clientWidth; 
			} else {
				windowWidth = self.innerWidth;
			}
			windowHeight = self.innerHeight;
		} else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
			windowWidth = document.documentElement.clientWidth;
			windowHeight = document.documentElement.clientHeight;
		} else if (document.body) { // other Explorers
			windowWidth = document.body.clientWidth;
			windowHeight = document.body.clientHeight;
		}	
		// for small pages with total height less then height of the viewport
		if(yScroll < windowHeight){
			pageHeight = windowHeight;
		} else { 
			pageHeight = yScroll;
		}
		// for small pages with total width less then width of the viewport
		if(xScroll < windowWidth){	
			pageWidth = xScroll;		
		} else {
			pageWidth = windowWidth;
		}
		arrayPageSize = new Array(pageWidth,pageHeight,windowWidth,windowHeight);
		return arrayPageSize;
	};
	/**
	 / THIRD FUNCTION
	 * getPageScroll() by quirksmode.com
	 *
	 * @return Array Return an array with x,y page scroll values.
	 */
	function ___getPageScroll() {
		var xScroll, yScroll;
		if (self.pageYOffset) {
			yScroll = self.pageYOffset;
			xScroll = self.pageXOffset;
		} else if (document.documentElement && document.documentElement.scrollTop) {	 // Explorer 6 Strict
			yScroll = document.documentElement.scrollTop;
			xScroll = document.documentElement.scrollLeft;
		} else if (document.body) {// all other Explorers
			yScroll = document.body.scrollTop;
			xScroll = document.body.scrollLeft;	
		}
		arrayPageScroll = new Array(xScroll,yScroll);
		return arrayPageScroll;
	};
	 /**
	  * Stop the code execution from a escified time in milisecond
	  *
	  */
	 function ___pause(ms) {
		var date = new Date(); 
		curDate = null;
		do { var curDate = new Date(); }
		while ( curDate - date < ms);
	 };
	
	// end of lightbox functions
	

	function clickHandler(gallery) {
		gallery.pause();
		return false;
	}

	$.fn.galleriffic = function(thumbsContainerSel, settings) {
		//  Extend Gallery Object
		$.extend(this, {
			ver: function() {
				return ver;
			},

			buildDataFromThumbs: function() {
				this.data = [];
				var gallery = this;
				this.$thumbsContainer.find('li').each(function(i) {
					var $a = $(this).find('a');
					var $img = $a.find('img:first');
					gallery.data.push({slide:$a.attr('href'),thumb:$img.attr('src'),original:$a.attr('original'),title:$a.attr('title'),description:$a.attr('description'),hash:gallery.offset+i});
				});
				return this;
			},

			isPreloadComplete: false,

			preloadInit: function() {
				if (this.settings.preloadAhead == 0) return this;
				
				this.preloadStartIndex = this.currentIndex;
				var nextIndex = this.getNextIndex(this.preloadStartIndex);
				return this.preloadRecursive(this.preloadStartIndex, nextIndex);
			},
			
			preloadRelocate: function(index) {
				// By changing this startIndex, the current preload script will restart
				this.preloadStartIndex = index;
				return this;
			},

			preloadRecursive: function(startIndex, currentIndex) {
				// Check if startIndex has been relocated
				if (startIndex != this.preloadStartIndex) {
					var nextIndex = this.getNextIndex(this.preloadStartIndex);
					return this.preloadRecursive(this.preloadStartIndex, nextIndex);
				}

				var gallery = this;

				// Now check for preloadAhead count
				var preloadCount = currentIndex - startIndex;
				if (preloadCount < 0)
					preloadCount = this.data.length-1-startIndex+currentIndex;
				if (this.settings.preloadAhead >= 0 && preloadCount > this.settings.preloadAhead) {
					// Do this in order to keep checking for relocated start index
					setTimeout(function() { gallery.preloadRecursive(startIndex, currentIndex); }, 500);
					return this;
				}

				var imageData = this.data[currentIndex];

				// If already loaded, continue
				if (imageData.$image)
					return this.preloadNext(startIndex, currentIndex); 
				
				// Preload the image
				var image = new Image();
				
				image.onload = function() {
					imageData.$image = this;
					gallery.preloadNext(startIndex, currentIndex);
				};

				image.alt = imageData.title;
				image.src = imageData.slide;

				return this;
			},
			
			preloadNext: function(startIndex, currentIndex) {
				var nextIndex = this.getNextIndex(currentIndex);
				if (nextIndex == startIndex) {
					this.isPreloadComplete = true;
				} else {
					// Use set timeout to free up thread
					var gallery = this;
					setTimeout(function() { gallery.preloadRecursive(startIndex, nextIndex); }, 100);
				}
				return this;
			},

			getNextIndex: function(index) {
				var nextIndex = index+1;
				if (nextIndex >= this.data.length)
					nextIndex = 0;
				return nextIndex;
			},
			
			getPrevIndex: function(index) {
				var prevIndex = index-1;
				if (prevIndex < 0)
					prevIndex = this.data.length-1;
				return prevIndex;
			},

			pause: function() {
				if (this.interval)
					this.toggleSlideshow();
				
				return this;
			},

			play: function() {
				if (!this.interval)
					this.toggleSlideshow();
				
				return this;
			},

			toggleSlideshow: function() {
				if (this.interval) {
					clearInterval(this.interval);
					this.interval = 0;
					
					if (this.$controlsContainer) {
						this.$controlsContainer
							.find('div.ss-controls span').removeClass().addClass('play')
							.attr('title', this.settings.playLinkText)
							.html(this.settings.playLinkText);
					}
				} else {
					this.ssAdvance();

					var gallery = this;
					this.interval = setInterval(function() {
						gallery.ssAdvance();
					}, this.settings.delay);
					
					if (this.$controlsContainer) {
						this.$controlsContainer
							.find('div.ss-controls span').removeClass().addClass('pause')
							.attr('title', this.settings.pauseLinkText)
							.html(this.settings.pauseLinkText);
					}
				}

				return this;
			},

			ssAdvance: function() {
				var nextIndex = this.getNextIndex(this.currentIndex);
				var nextHash = this.data[nextIndex].hash;
				
				// Seems to be working on both FF and Safari
				location.href = '#'+nextHash;

				// IE we need to explicity call goto
				if ($.browser.msie) {
					this.goto(nextIndex);
				}

				return this;
			},

			goto: function(index) {
				if (index < 0) index = 0;
				else if (index >= this.data.length) index = this.data.length-1;
				this.currentIndex = index;
				this.preloadRelocate(index);
				return this.refresh();
			},
			
			refresh: function() {
				if (this.$imageContainer) {
					var imageData = this.data[this.currentIndex];
					var isFading = 1;
					var gallery = this;

					// hide img
					this.$imageContainer.fadeOut('fast', function() {
						isFading = 0;

						// Update Controls
						if (gallery.$controlsContainer) {
							gallery.$controlsContainer
								.find('div.nav-controls a.prev').attr('href', '#'+gallery.data[gallery.getPrevIndex(gallery.currentIndex)].hash).end()
								.find('div.nav-controls a.next').attr('href', '#'+gallery.data[gallery.getNextIndex(gallery.currentIndex)].hash);
						}

						// Replace Title
						if (gallery.$titleContainer) {
							gallery.$titleContainer.empty().html(imageData.title);
						}

						// Replace Description
						if (gallery.$descContainer) {
							gallery.$descContainer.empty().html(imageData.description);
						}

						// Update Download Link
						if (gallery.$downloadLink) {
							gallery.$downloadLink.attr('href', imageData.original);
						}

						if (imageData.$image) {
							gallery.buildImage(imageData.$image);
						}
					});
					
					if (this.onFadeOut) this.onFadeOut();

					if (!imageData.$image) {
						var image = new Image();
						// Wire up mainImage onload event
						image.onload = function() {
							imageData.$image = this;

							if (!isFading) {
								gallery.buildImage(imageData.$image);
							}
						};

						// set alt and src
						image.alt = imageData.title;
						image.src = imageData.slide;
					}

					// This causes the preloader (if still running) to relocate out from the currentIndex
					this.relocatePreload = true;
				}

				return this.syncThumbs();
			},
			
			buildImage: function(image) {
				if (this.$imageContainer) {
					this.$imageContainer.empty();

					var gallery = this;
					
					var thisImageIndex = this.currentIndex;

					// Setup image
					this.$imageContainer
						//.append('<span class="image-wrapper"><a class="advance-link" rel="history" href="#'+this.data[this.getNextIndex(this.currentIndex)].hash+'" title="'+image.alt+'"></a></span>')
						.append('<span class="image-wrapper"><a class="advance-link" rel="history" title="'+image.alt+'"></a></span>')
						.find('a')
						.append(image)
						//.click(function() { clickHandler(gallery); })
						.click(function() { buildLightBox(image,gallery,thisImageIndex); })
						.end()
						.fadeIn('fast');
					
					if (this.onFadeIn) this.onFadeIn();
				}

				return this;
			},

			syncThumbs: function() {
		        if (this.$thumbsContainer) {
					var page = Math.floor(this.currentIndex / this.settings.numThumbs);
			        if (page != this.currentPage) {
			            this.currentPage = page;
			            this.updateThumbs();
					} else {
						var selectedThumb = this.currentIndex % this.settings.numThumbs;

						// Remove existing selected class and add selected class to new thumb
						this.$thumbsContainer
							.find('ul.thumbs li.selected')
							.removeClass('selected')
							.end()
							//.find('ul.thumbs a[href="#'+this.currentIndex+'"]')
							.find('ul.thumbs li').eq(selectedThumb)
							.addClass('selected');
					}
				}

				return this;
			},

			updateThumbs: function() {
				if (this.$thumbsContainer) {
					// Initialize currentPage to first page
					if (this.currentPage < 0)
						this.currentPage = 0;
				
					var startIndex = this.currentPage*this.settings.numThumbs;
			        var stopIndex = startIndex+this.settings.numThumbs-1;
			        if (stopIndex >= this.data.length)
						stopIndex = this.data.length-1;

					var needsPagination = this.data.length > this.settings.numThumbs;

					// Clear thumbs container
					this.$thumbsContainer.empty();
				
					// Rebuild top pager
					this.$thumbsContainer.append('<div class="top pagination"></div>');
					if (needsPagination && this.settings.enableTopPager) {
						this.buildPager(this.$thumbsContainer.find('div.top'));
					}

					// Rebuild thumbs
					var $ulThumbs = this.$thumbsContainer.append('<ul class="thumbs"></ul>').find('ul.thumbs');
					for (i=startIndex; i<=stopIndex; i++) {
						var selected = '';
					
						if (i==this.currentIndex)
							selected = ' class="selected"';
						
						var imageData = this.data[i];
						$ulThumbs.append('<li'+selected+'><a rel="history" href="#'+imageData.hash+'" title="'+imageData.title+'"><img src="'+imageData.thumb+'" alt="'+imageData.title+'" /></a></li>');
					}

					// Rebuild bottom pager
					if (needsPagination && this.settings.enableBottomPager) {
						this.$thumbsContainer.append('<div class="bottom pagination"></div>');
						this.buildPager(this.$thumbsContainer.find('div.bottom'));
					}

					// Add click handlers
					var gallery = this;
					this.$thumbsContainer.find('a[rel="history"]').click(function() { clickHandler(gallery); });
				}

				return this;
			},

			buildPager: function(pager) {
				var startIndex = this.currentPage*this.settings.numThumbs;
				
				// Prev Page Link
				if (this.currentPage > 0) {
					var prevPage = startIndex - this.settings.numThumbs;
					pager.append('<a rel="history" href="#'+this.data[prevPage].hash+'" title="'+this.settings.prevPageLinkText+'">'+this.settings.prevPageLinkText+'</a>');
				}
				
				// Page Index Links
				for (i=this.currentPage-3; i<=this.currentPage+3; i++) {
					var pageNum = i+1;
					
					if (i == this.currentPage)
						pager.append('<strong>'+pageNum+'</strong>');
					else {
						var imageIndex = i*this.settings.numThumbs;
						if (i>=0 && i<this.numPages) {
							pager.append('<a rel="history" href="#'+this.data[imageIndex].hash+'" title="'+pageNum+'">'+pageNum+'</a>');
						}
					}
				}
				
				// Next Page Link
				var nextPage = startIndex+this.settings.numThumbs;
				if (nextPage < this.data.length) {
					pager.append('<a rel="history" href="#'+this.data[nextPage].hash+'" title="'+this.settings.nextPageLinkText+'">'+this.settings.nextPageLinkText+'</a>');
				}
				
				return this;
			}
		});

		// Now initialize the gallery
		this.settings = $.extend({}, defaults, settings);
		
		if (this.settings.galleryKeyboardNav) {
			_enable_keyboard_navigation();
		}

		if (this.interval)
			clearInterval(this.interval);

		this.interval = 0;
		
		if (this.settings.imageContainerSel) this.$imageContainer = $(this.settings.imageContainerSel);
		if (this.settings.thumbsContainerSel) this.$thumbsContainer = $(this.settings.thumbsContainerSel);
		if (this.settings.titleContainerSel) this.$titleContainer = $(this.settings.titleContainerSel);
		if (this.settings.descContainerSel) this.$descContainer = $(this.settings.descContainerSel);
		if (this.settings.downloadLinkSel) this.$downloadLink = $(this.settings.downloadLinkSel);

		// Set the hash index offset for this gallery
		this.offset = galleryOffset;

		// This is for backward compatibility
		if (thumbsContainerSel instanceof Array) {
			this.data = thumbsContainerSel;
		} else {
			this.$thumbsContainer = $(thumbsContainerSel);
			this.buildDataFromThumbs();
		}
		
		// Add this gallery to the global galleries array
		registerGallery(this);

		this.numPages = Math.ceil(this.data.length/this.settings.numThumbs);
		this.currentPage = -1;
		this.currentIndex = 0;
		var gallery = this;

		// Setup controls
		if (this.settings.controlsContainerSel) {
			this.$controlsContainer = $(this.settings.controlsContainerSel).empty();
			
			if (this.settings.renderSSControls) {
				this.$controlsContainer
					.append('<div class="ss-controls"><span class="play" title="'+this.settings.playLinkText+'">'+this.settings.playLinkText+'</span></div>')
					.find('div.ss-controls span')
					.click(function() { gallery.toggleSlideshow(); });
			}
		
			if (this.settings.renderNavControls) {					
				this.$controlsContainer
					.append('<div class="nav-controls"><a class="prev" rel="history" title="'+this.settings.prevLinkText+'">'+this.settings.prevLinkText+'</a><a class="next" rel="history" title="Next">'+this.settings.nextLinkText+'</a></div>')
					.find('a[rel="history"]')
					.click(function() { clickHandler(gallery); });
			}
		}

		// Initialize history only once when the first gallery on the page is initialized
		historyInit();

		// Build image
		var hash = getHash();
		var hashGallery = (hash >= 0) ? getGallery(hash) : 0;
		var gotoIndex = (hashGallery && this == hashGallery) ? (hash-this.offset) : 0;
		this.goto(gotoIndex);

		// Kickoff Image Preloader after 1 second
		setTimeout(function() { gallery.preloadInit(); }, 1000);
		
		// autoplay  - run the transitions as soon as the gallery has been loaded if autoPlay is true
		if(this.settings.autoPlay) {
			gallery.play();
		}
		
		return this;
	};

})(jQuery);