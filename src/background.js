
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
        if (request.type === 'SetOptions') {
            lscache.set('options', request.options);
            sendResponse({});
        }
        if (request.type === 'GetOptions') {
            var options = lscache.get('options');
            if (!options) {
                options = {
                    'autoscroll': true,
                };
            }
            sendResponse({options:options});
        }
    }
    return true;
});

// open Craigslist housing page when extension is first installed
var installed = localStorage.getItem('installed');
if (!installed)
    chrome.tabs.create({url: 'http://www.craigslist.org/hhh/'});
localStorage.setItem('installed', true);
