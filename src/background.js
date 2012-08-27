
// setup messaging
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (sender.tab) {
        if (request.type === 'GetFavorites') {
            chrome.storage.local.get(function(data) {
                if (chrome.extension.lastError) {
                    sendResponse({error: chrome.extension.lastError.message});
                } else {
                    var favorites = {};
                    for (var key in data) {
                        if (key.indexOf('fav:http') === 0) {
                            var url = key.replace(/^fav:/, '');
                            favorites[url] = data[key];
                        }
                    }
                    sendResponse({favorites: favorites});
                }
            });
        }
        if (request.type === 'AddFavorite') {
            var key = 'fav:'+request.url;
            var keys = {};
            keys[key] = {
                title: request.title
            };
            chrome.storage.local.set(keys, function() {
                if (chrome.extension.lastError) {
                    sendResponse({error: chrome.extension.lastError.message});
                } else {
                    sendResponse({});
                }
            });
        }
        if (request.type === 'RemFavorite') {
            var key = 'fav:'+request.url;
            chrome.storage.local.remove(key, function() {
                if (chrome.extension.lastError) {
                    sendResponse({error: chrome.extension.lastError.message});
                } else {
                    sendResponse({});
                }
            });
        }
    }
    return true;
});

// open Craigslist housing page when extension is first installed
if (chrome.runtime) {
    chrome.runtime.onInstalled.addListener(function() {
        chrome.tabs.create({url: 'http://www.craigslist.org/hhh/'});
    });
} else {
    chrome.storage.local.get(function(data) {
        if (chrome.extension.lastError) {
            console.warn(chrome.extension.lastError.message);
        } else {
            if (!data['installed']) {
                chrome.tabs.create({url: 'http://www.craigslist.org/hhh/'});
                chrome.storage.local.set({installed: true}, function() {
                    if (chrome.extension.lastError) {
                        console.warn(chrome.extension.lastError.message);
                    }
                });
            }
        }
    });
}

