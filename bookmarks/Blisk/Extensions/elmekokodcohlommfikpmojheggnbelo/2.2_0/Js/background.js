var _isLoggingEnabled = true;
var _originalChromeUserAgent = 'notset';
var _userAgent =  'notset';
var _mobileDevice = 'notset';
var _isLinkClicked = false;
var _arrWindowMobileDeviceInfo = []; 
var _hasBeforeSendRunOnce = false;
var _isSwipe = true;

// handle communications being sent from other scripts
chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {		
		if(request.selectedUserAgent != undefined && request.selectedUserAgent != '') {
			// user clicked a link in popup.html that has mobile device info associated with it
			// this should theoretically get set before the onBeforeSendHeaders fires
			_userAgent = $.trim(request.selectedUserAgent);
			_mobileDevice = $.trim(request.selectedDevice);
			_isLinkClicked = true;
			_isSwipe = request.swipe;
			
			chrome.windows.create(
				{
					'url': request.selectedUrl, 
					'type': 'popup',
					'width': parseInt(request.selectedDeviceWidth),
					'height': parseInt(request.selectedDeviceHeight),
					'incognito': false					
				}, 
				function(window) {
			
				}
			);
		}
		else if(request.getWindowUrl != undefined) {
			//popup.js asking for what the current tab url is
			var currentTabUrl = 'notset';
			
			chrome.tabs.getSelected(null,function(tab) {
				currentTabUrl = tab.url;
				//can't use sendResponse because it fires before tabs.getSelected finishes, so we need to send back the response another way
				chrome.extension.sendMessage(
					{
						test: currentTabUrl
					}, 
					function(response) {
						//alert(response.test);
					}
				);	
			});
		}
	}
);  

chrome.webRequest.onBeforeSendHeaders.addListener(
	function(details) {	
		var currentTabId = details.tabId;
				
		if(! _hasBeforeSendRunOnce) {	
			_hasBeforeSendRunOnce = true;
						
			var blockingResponse = {};

			if(_arrWindowMobileDeviceInfo.length == 0) {
				var origUA = getCurrentUserAgent(details);
				
				if(origUA.length > 0 && origUA != 'notset') {
					_originalChromeUserAgent = origUA; // store original user agent for later use
				}				
			}

			if(_isLinkClicked) {
				// user clicked link from popup.html and mobile device info was set with values from attributes on link		
				insertWindowInMobileDeviceInfoArray(currentTabId, _userAgent, _mobileDevice);	// associate mobile device info with this window and store in array
			}
			else {
				// link was NOT clicked from popup.html. Need to check array to see if window/mobile device info was previously stored in array
				if(! isWindowInMobileDeviceInfoArray(currentTabId)) { 
					// window not in array list, this insinuates normal browsing since window would exist in array if mobile testing was being performed
					_userAgent = $.trim(_originalChromeUserAgent);	// get original user agent that was stored previously	
					_mobileDevice = 'notset'; // reset mobile device
					// store mobile device info in array and associated with current window id
					insertWindowInMobileDeviceInfoArray(currentTabId, _userAgent, _mobileDevice);					
				}
				else {
					// Get mobile device info stored in array that is associated with window (this could be normal browsing or mobile testing)
					_userAgent = $.trim(getUserAgentFromArray(currentTabId));	
					_mobileDevice = $.trim(getMobileDeviceFromArray(currentTabId));					
				}
			}

			// send mobile device to content.js, which will update the web page display	(remove the scrollbars quickly)
			if(currentTabId > 0) {					
				chrome.tabs.sendMessage(					
					currentTabId, 
					{
						mobileDevice: _mobileDevice,
						userAgent: _userAgent,
						removeScrollbars: true,
						swipe: _isSwipe
					}, 
					function(response) {
						//console.log(response.farewell);
					}
				);

				setTimeout(function() { // hang on a bit, need to make sure the listener has enough time to initialize before shooting off the message
					chrome.tabs.sendMessage(					
						currentTabId, 
						{
							mobileDevice: _mobileDevice,
							userAgent: _userAgent,
							removeScrollbars: false
						}, 
						function(response) {
							//console.log(response.farewell);
						}
					);
				}, 1500); // waiting this long is the only thing that prevents the "receiving end does not exist error"
			}

			// update user agent
			blockingResponse.requestHeaders = getHeadersWithModifiedUserAgent(_userAgent, details);
			return blockingResponse;
		}
	},
	{
		urls: ["<all_urls>"],
		//tabId: this.tabId_ couldn't get this to work. Maybe get it working in the future
	},
	['requestHeaders','blocking']
); 

chrome.webRequest.onCompleted.addListener(
	function(details) {
		_hasBeforeSendRunOnce = false;
		_isLinkClicked = false;
	}, 
	{urls: ["<all_urls>"]},
	["responseHeaders"]
);

chrome.tabs.onRemoved.addListener(function(tabId) {
	//logToConsole(tabId);
	removeWindowInMobileDeviceInfoArray(tabId);
});	


function getUserAgentFromArray(windowId) {
	var userAgent = '';
	
	for(i = 0; i < _arrWindowMobileDeviceInfo.length; ++i) {
		if(_arrWindowMobileDeviceInfo[i]['windowId'] == windowId) {
			userAgent = _arrWindowMobileDeviceInfo[i]['userAgent'];
			break;
		}
	}
	
	return userAgent;
}

function getMobileDeviceFromArray(windowId) {
	var mobileDevice = '';
	
	for(i = 0; i < _arrWindowMobileDeviceInfo.length; ++i) {
		if(_arrWindowMobileDeviceInfo[i]['windowId'] == windowId) {
			mobileDevice = _arrWindowMobileDeviceInfo[i]['mobileDevice'];
			break;
		}
	}
	
	return mobileDevice;
}

function isWindowInMobileDeviceInfoArray(windowId) {
	var isWindowIdFound = false;
	
	for(i = 0; i < _arrWindowMobileDeviceInfo.length; ++i) {
		if(_arrWindowMobileDeviceInfo[i]['windowId'] == windowId) {
			isWindowIdFound = true;			
			break;
		}
	}
		
	return isWindowIdFound;
}

function insertWindowInMobileDeviceInfoArray(windowId, userAgent, mobileDevice) {
	_arrWindowMobileDeviceInfo.push({'windowId': windowId, 'userAgent': userAgent, 'mobileDevice': mobileDevice});
}

function updateWindowInMobileDeviceInfoArray(windowId, userAgent) {
	for(i = 0; i < _arrWindowMobileDeviceInfo.length; ++i) {
		if(_arrWindowMobileDeviceInfo[i]['windowId'] == windowId) {
			_arrWindowMobileDeviceInfo[i]['userAgent'] = userAgent;
			break;
		}
	}
}

function removeWindowInMobileDeviceInfoArray(windowId) {
	var index = -1;
	
	for(i = 0; i < _arrWindowMobileDeviceInfo.length; ++i) {
		if(_arrWindowMobileDeviceInfo[i]['windowId'] == windowId) {
			index = i;
			break;
		}
	}
	
	if(index != -1) {
		_arrWindowMobileDeviceInfo.splice(index, 1);
	}
}

function getHeadersWithModifiedUserAgent(userAgent, details) {
	var headers = details.requestHeaders;

	for( var i = 0, l = headers.length; i < l; ++i ) {
		if( headers[i].name == 'User-Agent' ) {		
			headers[i].value = userAgent;		
			//logToConsole('SET: ' + userAgent);
			break;
		}
	}
	
	return headers;
}

function getCurrentUserAgent(details) {
	var headers = details.requestHeaders;
	var userAgent = '';

	for(var i=0,l = headers.length; i < l; ++i) {
		if(headers[i].name == 'User-Agent') {		
			userAgent = headers[i].value;
			//alert(userAgent);
			break;
		}
	}
	
	return userAgent;
}

function logToConsole(msg) {
	if(_isLoggingEnabled) {
		console.log(msg);
	}
}