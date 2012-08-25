chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    //console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
    if (sender.tab) {
        if (request.type === 'GetFavorites') {
            var key = 'fav:'+request.url;
            chrome.storage.local.get(function(data) {
                //console.log(data);
                sendResponse({value: data});
            });
        }
        if (request.type === 'AddFavorite') {
            var key = 'fav:'+request.url;
            var keys = {};
            keys[key] = true;
            chrome.storage.local.set(keys, function(value) {
                sendResponse({'success': true});
            });
        }
        if (request.type === 'RemFavorite') {
            var key = 'fav:'+request.url;
            chrome.storage.local.remove(key, function(value) {
                sendResponse({'success': true});
            });
        }
    }
    return true;
});
