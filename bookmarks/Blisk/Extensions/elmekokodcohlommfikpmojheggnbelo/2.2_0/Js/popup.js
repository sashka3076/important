$(document).ready(function() {// popup page load event
	populateDevices();

	// grab the current URL and put into textbox
	setTimeout(function() {
		chrome.extension.sendMessage(
			{
				//instruct background.js to get the current tab URL
				getWindowUrl: true
			}, 
			function(response) {
				//alert(response);
			}
		);
	}, 100);
	
	// handle communications being sent from other scripts
	chrome.extension.onMessage.addListener(
		function(request, sender, sendResponse) {	
			if(request.test != undefined) {
				//get current tab url and put into textbox (sent from background.js)
				$('.url-txt').val(request.test);
				$('.url-txt').putCursorAtEnd();
			};
		}
	); 

	$('a').click(function() { // link clicked on popup.html		
		var popWidth = $(this).parent().attr('popWidth');
		var popHeight = $(this).parent().attr('popHeight');
		var selectedUserAgent = $(this).parent().attr('userAgent');
		var selectedDevice = $(this).parent().html().substring(1, $(this).parent().html().indexOf('('));
		var url = $('.url-txt').val();
		var isSwipe = true;
		
		if($(this).attr('class') == 'submit-a') {
			popWidth = $('#txtWidth').val();
			popHeight = $('#txtHeight').val();
			selectedUserAgent = $('#txtUserAgent').val();
			selectedDevice = 'Custom';
		}
		
		if(url == 'http://') {
			alert('Please enter a website URL');
		}
		else {
			if($(this).attr('class') == 'mobile-landscape-a') {
				// landscape mode
				var originalWidth = popWidth;
				
				popWidth = popHeight;
				popHeight = originalWidth;
			}
			
			if($('#chkSwipe').attr('checked') != 'checked') {
				isSwipe = false;
				
				// add 17 pixels to account for the scrollbar
				popWidth = parseInt(popWidth) + 17; 
			}
		
			// account for Chrome border, add 16px
			popWidth = parseInt(popWidth) + 16; 
			
			// account for Chrome border add 39px and an additional 30px in height to leave room for the mobile device label
			popHeight = parseInt(popHeight) + 69;
			
			// open new window with specified dimensions, go to the URL specified in the textbox
			//window.open(url, '','width=' + popWidth + ',height=' + popHeight);			
			
			// inform background script what the specified user agent is
			chrome.extension.sendMessage(
				{
					//selectedMobileDeviceInfo: selectedUserAgent + '|' + selectedMobileDevice
					selectedUserAgent: selectedUserAgent, 
					selectedDevice: selectedDevice,
					selectedUrl: url,
					selectedDeviceWidth: popWidth,
					selectedDeviceHeight: popHeight,
					swipe: isSwipe
				}, 
				function(response) {
					//alert(response.test);
				}
			);
		}
	});
	
	LoadRandomDonationCopy();
});

function populateDevices() {
	populateDevice(getPhones(), 'phones-fs');
	populateDevice(getPhablets(), 'phablets-fs');
	populateDevice(getTablets(), 'tablets-fs');
}

function populateDevice(devices, deviceClass) {
	var isLast;
	
	for(var i = 0; i < devices.length; i++) {
		if(i == devices.length -1) {
			isLast = true;
		}
		else {
			isLast = false;
		}
				
		$('.' + deviceClass).append(getDeviceTemplateHTML(devices[i].userAgent, devices[i].name, devices[i].width, devices[i].height, isLast));
	}
}

function getPhones() {
	return [
		getDevice('Iphone 6', 375, 667, 'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25'),
		getDevice('Iphone 5', 320, 568, 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3'),		
		getDevice('Iphone 4', 320, 480, 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_0 like Mac OS X; en-us) AppleWebKit/532.9 (KHTML, like Gecko) Version/4.0.5 Mobile/8A293 Safari/6531.22.7'),
		getDevice('Galaxy S6', 360, 640, 'Mozilla/5.0 (Linux; Android 5.0; SM-G920A Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.109 Mobile Safari/537.36'),
		getDevice('Xperia Z3', 360, 598, 'Mozilla/5.0 (Linux; Android 4.4; D6603 Build/23.0.A.2.93) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.141 Mobile Safari/537.36'),
		getDevice('Lumia 920', 384, 640, 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920))')		
	];
}

function getPhablets() {
	return [
		getDevice('Nexus 6', 412, 690, 'Mozilla/5.0 (Linux; Android 5.0; Nexus 6 Build/LRX21D) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/37.0.0.0 Mobile Safari/537.36'),
		getDevice('Iphone 6 Plus', 414, 736, 'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25'),
		getDevice('Galaxy Note 4', 480, 853, 'Mozilla/5.0 (Linux; Android 4.4.2; SM-N9005 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.114 Mobile Safari/537.36'),
		getDevice('Galaxy Note II', 360, 640, 'Mozilla/5.0 (Linux; Android 4.2.2; SPH-L900 Build/JDQ39E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.55 Mobile Safari/537.36')
	];
}

function getTablets() {
	return [
		getDevice('iPad Air', 768, 1024, 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25'),
		getDevice('Galaxy Tab 2 10.1', 800, 1280, 'Mozilla/5.0 (Linux; U; Android 4.04; en-us; GT-P7510 Build/IML74K) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30'),
		getDevice('Galaxy Nexus 7', 603, 966, 'Mozilla/5.0 (Linux; U; Android 4.04; en-us; GT-P7510 Build/IML74K) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30'),
		getDevice('Kindle Fire', 600, 1024, 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.1.0-80) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true'),
		getDevice('Kindle Fire HD 7"', 533, 853, 'Mozilla/5.0 (Linux; U; en-us; KFOT Build/IML74K) AppleWebKit/535.19 (KHTML, like Gecko) Silk/2.2 Safari/535.19 Silk-Accelerated=true'),
		getDevice('Kindle Fire HD 8.9"', 800, 1280, 'Mozilla/5.0 (Linux; U; en-us; KFOT Build/IML74K) AppleWebKit/535.19 (KHTML, like Gecko) Silk/2.2 Safari/535.19 Silk-Accelerated=true'),	
	];
}

function getDevice(deviceName, deviceWidth, deviceHeight, deviceUserAgent) {
	return {
		name : deviceName,
		width : deviceWidth,
		height : deviceHeight,
		userAgent : deviceUserAgent
	};
}

function getDeviceTemplateHTML(deviceUserAgent, deviceName, deviceWidth, deviceHeight, isLast){
	var html = '<div class="mobile-div';
	
	if(isLast) {
		html = html + ' mobile-last-div';
	}
	
	html = html + '" popWidth="' + deviceWidth + '" popHeight="' + deviceHeight + '" useragent="' + deviceUserAgent + '">\n';
	html = html + '<div>\n' + deviceName + ' (' + deviceWidth + ' x ' + deviceHeight + ')\n</div>\n<a href="javascript:void(0);" class="mobile-landscape-a"></a>\n<a href="javascript:void(0);" class="mobile-portrait-a"></a></div>';
	
	return html;						
}

function LoadRandomDonationCopy() {
	var copy = ['Is this extension helpful? I gladly accept donations!', 'Like this extension? Care to by me a beverage?', 'Would you like to contribue to the Human Fund?', 'Drinks on you right?... Maybe?', 'I have no money for lunch today...', 'Can I get a quarter? uh.. I need to make a phone call.', 'Just pretend this says whatever it needs to say to get you to donate.', 'Day Care is expensive, you know what I\'m saying?', 'If PBS pledge drives weren\'t bad enough, now you have to deal with this?', 'How about we go halfsies on lunch?', 'Remember that time I made that sweet Chrome extension? That was cool wasn\'t it?', 'In lieu of flowers, please send lunch.'];
	
	$('.donate-div p').html(copy[Math.floor(Math.random() * copy.length)]);
}