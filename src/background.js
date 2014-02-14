
// setup messaging
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (sender.tab) {
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
