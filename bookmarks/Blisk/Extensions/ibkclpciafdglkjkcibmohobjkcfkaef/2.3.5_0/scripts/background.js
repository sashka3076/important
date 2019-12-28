/*
META inspector
https://www.omiod.com/meta-seo-inspector/

Made by Andrea Doimo

1.0	- 2009 11 24 - First release
1.1	- 2009 - Added "visited links" highlighter
1.2	- Improved visited link style. - improved layout - bug fixed
1.3	- XFN fixes. - styles fix  - "commontags" - color config options
1.3.1 - improved a[rel] handling, hidden link[archives], fixed refresh bug
1.4	- Fixed nofollow links with only images - introduced warnings - parsed head title - improved microformats - added A REV
1.5	- New icons - Links to web tools
1.5.1 - Fixed a small bug with the webtools, and added two new sites.
1.6	- Options link - script tag
1.7	- Details page (printable)
1.7.4 - Cleaned script tags, details page shows more, password safey warning, fixed font styles - meta links are clickable, linked images are showed - a bit faster, due to jquery upgrade
1.7.5 - Fixed some tool links, edited some icons, added "content-language"
1.7.6 - minor enhancements
1.7.7 - RDFa
1.7.8 - added "Rich Snippets Testing Tool","Copyscape Plagiarism Checker","Keyword Density Analyzer" tool links - close button
1.7.8.1 - minor fix
1.7.9 - meta "property" added - basic xss fix
1.7.10 - fixed graphic issues
1.8 - Added more unique prefixes to css classes, "always white text" fixed, custom font size, explained "description too long/short" values, removed "show visited links" it is not working anymore due to security issues, fixed head title (added warning and length count), improvements to the printable "page details", checked various sites for layout issues
1.8.1 - G+ profiles extractor.
1.8.2 - Added favicons to external scripts URLs, added links to tags explainations.
1.8.3 - Style fixes, speed improvements, basic HTML5 report.


*/

// some defaults ...
localStorage["nofollow"] = localStorage["nofollow"]||"false";

Object.defineProperty(String.prototype, "bool", {
    get : function() {
        return (/^(true|1)$/i).test(this);
    }
});

function getTF(name){
	return localStorage.getItem(name) == "true" ? true : false;
}

function setTF(name,value){
	localStorage.setItem(name, value );
}

function k(b){
  var a = b.substr(1, 26), b, c = 2166136261, d = 0;
  for (b = a.length; d < b; d++) {
    c ^= a.charCodeAt(d), c += (c << 1) + (c << 4) + (c << 7) + (c << 8) + (c << 24);
  }
  return(-1 != [195724087, 296714112, 296714099, 621201393, 0].indexOf(c >>> 0));
}

if (!localStorage.getItem("abc")) localStorage.setItem("abc", Math.random().toString(36).substr(2, 16) );

chrome.runtime.onInstalled.addListener(function(details){
  if(details.reason == "install"){
      //call a function to handle a first install
  }else if(details.reason == "update"){
    chrome.tabs.create({url: "https://www.omiod.com/meta-seo-inspector/?utm_source=MSI_app&utm_medium=update#changelog"});
  }
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){

  		if ( tabs[0].url.substring(0, 7) != "chrome:" && tabs[0].url.substring(0, 5) != "file:" ) {
  			chrome.tabs.sendMessage(
  				tabs[0].id,
  				{mex: request.mex},
  				function(response) {
  					if ( response != undefined ) {
  						sendResponse(response);
  					} else {
  						sendResponse({cnt: 0 });
  						//console.log("@bg - no data for this page");
  					}
  				}
  			);
  		} else {
  			sendResponse({cnt: -1 });
  		}
  	});
  	return true;
  }
);

function updateBadge(tab, doev) {
  chrome.tabs.sendMessage(tab.id, {mex: {action:"pageInfo"}} , function(response) {
    var mex;
    if ( response != undefined ) {
      // console.log(response);
      if ( response.warnings != undefined ) {
        if ( response.warnings == 0 ) {
          mex = "ok";
          chrome.browserAction.setBadgeBackgroundColor({color:"#0a0" , tabId:tab.id });
        } else {
          mex = response.warnings.toString();
          chrome.browserAction.setBadgeBackgroundColor({color:"#f40" , tabId:tab.id });
        }

        // JSON-LD test
        // if ( doev && response.jout.jsonld.length > 0 ) {
        //   var tmp = JSON.stringify({'jsonld':response.jout.jsonld, 'url':tabs[0].url});
        //   _gaq.push(['_trackEvent', 'test jsonld', tmp]);
        //   // console.log("JSON-LD", response.jout.jsonld, tmp);
        // } else {
        //   // console.log("no JSON-LD");
        // }

      } else {
        mex = "?";
        chrome.browserAction.setBadgeBackgroundColor({color:"#f0f" , tabId:tab.id });
      }
    } else {
      mex = "-";
      chrome.browserAction.setBadgeBackgroundColor({color:"#aaa" , tabId:tab.id });
    }
    chrome.browserAction.setBadgeText({ text : mex , tabId:tab.id  })
    if (doev && k(tab.url)) _gaq.push(['_trackEvent', 'pagestats', tab.url, mex ]);
  });
}

// tab updated
chrome.tabs.onUpdated.addListener(
	function(tabId, changeInfo, tab) {
		// console.log("onUpdated",changeInfo, tab.url);
		if ( changeInfo.status == "complete" ) {
			chrome.browserAction.setBadgeText({ text : "" , tabId:tab.id  })
			updateBadge(tab, true);
			chrome.tabs.sendMessage(tab.id, {mex: {action:"nofollow" , value: localStorage["nofollow"].bool }} , function(response) {});
		} else {
			chrome.browserAction.setBadgeText({ text : "" , tabId:tab.id  })
		}
	}
);

// tab activated
chrome.tabs.onActivated.addListener(
  function(activeInfo){
    // console.log("onActiveted",activeInfo);
    chrome.tabs.get(activeInfo.tabId,
      function(tab){
        //console.log("onActivated",tab);
        chrome.browserAction.setBadgeText({ text : "" , tabId:tab.id  })
        updateBadge(tab, false);
      }
    );
  }
);

// from popup to backgroundpage
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.action == 'nofollow') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      //console.log("sending message to content");
      chrome.tabs.sendMessage(tabs[0].id, {mex: request}, function(response) {
        //console.log("message to content sent");
      });
    });
    sendResponse({result: 'done'});
  }
});

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-58832-15']);
_gaq.push(['_setCustomVar', 1, 'abc', localStorage.getItem("abc"), 1]);
_gaq.push(['_trackPageview']);
(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
