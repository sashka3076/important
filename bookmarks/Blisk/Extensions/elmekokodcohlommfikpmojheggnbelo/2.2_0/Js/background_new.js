var _hasBeforeRequestRunOnce = false;
var _hasBeforeSendRunOnce = false;
var _currentUrl = 'http://';
var _userAgent =  'notset' //'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.1 (KHTML like Gecko) Chrome/22.0.1181.0 Safari/537.1';

// handle communications being sent from other scripts
chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {		
		if(request.userAgent != undefined) {
			// user clicked a link in popup.html that has a user agent associated with it
			// this should theoretically get set before the onBeforeSendHeaders fires
			_userAgent = request.userAgent;
		}
		else if(request.windowUrl != undefined) {
			//content.js sending back the current tab url, save for later
			_currentUrl = request.windowUrl;
		}
		else if(request.getWindowUrl != undefined) {
			//popup.js asking for what the current tab url is, grab the last one saved
			sendResponse({windowUrl: _currentUrl});
		}
	}
);  
var _currentTabId;

chrome.webRequest.onBeforeSendHeaders.addListener(
	function(details) {	
		_currentTabId = details.tabId;

		if(! _hasBeforeSendRunOnce) {		
			_hasBeforeSendRunOnce = true;
			
			var blockingResponse = {};
			
			// update user agent
			blockingResponse.requestHeaders = getHeadersWithModifiedUserAgent(_userAgent, details);
			return blockingResponse;
		}
	},
	{
		urls: ["<all_urls>"],
		tabId: _currentTabId //this.tabId_
	},
	['requestHeaders','blocking']
); 

chrome.webRequest.onCompleted.addListener(
	function(details) {
		_hasBeforeRequestRunOnce = false;
		_hasBeforeSendRunOnce = false;
		
		chrome.tabs.executeScript(null, { file: "content.js" });
	}, 
	{urls: ["<all_urls>"]},
	["responseHeaders"]
);

function getHeadersWithModifiedUserAgent(userAgent, details) {
	var headers = details.requestHeaders;

	for( var i = 0, l = headers.length; i < l; ++i ) {
		if( headers[i].name == 'User-Agent' ) {		
			headers[i].value = userAgent;			
			break;
		}
	}
	
	return headers;
}

function logToConsole(msg) {
	if(_isLoggingEnabled) {
		console.log(msg);
	}
}












