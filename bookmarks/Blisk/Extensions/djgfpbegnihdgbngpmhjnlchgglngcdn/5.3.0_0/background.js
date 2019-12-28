let icon = localStorage["toolbar_icon"] || 'dark',
    surfix = icon === 'light' ? '_light.png' : '.png';
chrome.browserAction.setIcon({path: {"19": "icon/icon19" + surfix, "38": "icon/icon38" + surfix}});
chrome.browserAction.setTitle({title: 'What Font (WhatFont. reload tab to enable)'});
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.sendRequest(tab.id, {action: 'initOrRestore'}, function (loaded) {
        if(typeof loaded == "undefined" ){
            chrome.tabs.executeScript(tab.id , {"file": "libs/jquery.js"});
            chrome.tabs.executeScript(tab.id , {"file": "libs/html2canvas.min.js"});
            chrome.tabs.executeScript(tab.id , {"file": "chrome.js"});
            chrome.browserAction.enable(tab.id);
            chrome.browserAction.setTitle({title: 'WhatFont'});
            chrome.tabs.sendRequest(tab.id, {action: 'initOrRestore'}, function () {});
            chrome.tabs.sendRequest(tab.id, {action: 'initOrRestore'}, function () {});
            chrome.tabs.sendRequest(tab.id, {action: 'initOrRestore'}, function () {});
        }
    });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action == 'onload') {
        let id = sender.tab.id;
        chrome.browserAction.enable(id);
        chrome.browserAction.setTitle({title: 'WhatFont'});
    } else if (message.method == 'getUid') {

        sendResponse({});
    }
});
