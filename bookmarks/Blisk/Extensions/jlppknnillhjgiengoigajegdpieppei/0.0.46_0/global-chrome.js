var ToggleCommand, getHost, getProtocol;

TabState.prototype.send = function(message, data) {
  if (data == null) {
    data = {};
  }
  return chrome.tabs.sendMessage(this.tab, [message, data]);
};

TabState.prototype.bundledScriptURI = function() {
  return chrome.runtime.getURL('livereload.js');
};

LiveReloadGlobal.isAvailable = function(tab) {
  return true;
};

LiveReloadGlobal.initialize();

ToggleCommand = {
  invoke: function() {},
  update: function(tabId) {
    var status;
    status = LiveReloadGlobal.tabStatus(tabId);
    chrome.browserAction.setTitle({
      tabId: tabId,
      title: status.buttonToolTip
    });
    return chrome.browserAction.setIcon({
      tabId: tabId,
      path: {
        '19': status.buttonIcon,
        '38': status.buttonIconHiRes
      }
    });
  }
};

getHost = function(url) {
  var domain, matches;
  matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
  domain = matches && matches[1];
  return domain.split(':')[0];
};

getProtocol = function(url) {
  var matches;
  matches = url.match(/^(https?)\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
  return matches && matches[1];
};

chrome.browserAction.onClicked.addListener(function(tab) {
  var host, protocol;
  host = getHost(tab.url);
  protocol = getProtocol(tab.url);
  LiveReloadGlobal.toggle(tab.id, host, protocol);
  return ToggleCommand.update(tab.id);
});

chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) {
  return ToggleCommand.update(tabId);
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  return LiveReloadGlobal.killZombieTab(tabId);
});

chrome.runtime.onMessage.addListener(function(_arg, sender, sendResponse) {
  var data, eventName, host;
  eventName = _arg[0], data = _arg[1];
  switch (eventName) {
    case 'status':
      host = getHost(sender.tab.url);
      LiveReloadGlobal.updateStatus(sender.tab.id, data, host);
      return ToggleCommand.update(sender.tab.id);
    default:
      return LiveReloadGlobal.received(eventName, data);
  }
});
