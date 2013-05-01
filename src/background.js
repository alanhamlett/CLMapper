
// setup messaging
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (sender.tab) {
        if (request.type === 'GetFavorites') {
            $.ajax({
                type: 'GET',
                url: 'https://clmapper.firebaseio.com/'+lscache.get('mysecret')+'/favorites.json',
                dataType: 'json',
                success: function(response) {
                    if (!response)
                        response = {};
                    sendResponse({favorites: response});
                },
                error: function(error) {
                    sendResponse({error: error});
                },
            });
        }
        if (request.type === 'GetFavorite') {
            $.ajax({
                type: 'GET',
                url: 'https://clmapper.firebaseio.com/'+lscache.get('mysecret')+'/favorites/'+md5(request.url)+'.json',
                dataType: 'json',
                success: function(response) {
                    sendResponse({favorite: response});
                },
                error: function(error) {
                    sendResponse({error: error});
                },
            });
        }
        if (request.type === 'MergeFavorites') {
            $.ajax({
                type: 'GET',
                url: 'https://clmapper.firebaseio.com/'+encodeURIComponent(request.secret)+'/favorites.json',
                dataType: 'json',
                success: function(newfavorites) {
                    if (newfavorites !== null) {
                        $.ajax({
                            type: 'GET',
                            url: 'https://clmapper.firebaseio.com/'+lscache.get('mysecret')+'/favorites.json',
                            dataType: 'json',
                            success: function(response) {
                                if (!response)
                                    response = {};
                                $.ajax({
                                    type: 'PATCH',
                                    url: 'https://clmapper.firebaseio.com/'+request.secret+'/favorites.json',
                                    dataType: 'json',
                                    contentType: 'application/json',
                                    data: JSON.stringify(response),
                                    success: function() {
                                        $.ajax({
                                            type: 'DELETE',
                                            url: 'https://clmapper.firebaseio.com/'+lscache.get('mysecret')+'.json',
                                            dataType: 'json',
                                            success: function() {
                                                lscache.set('mysecret', request.secret);
                                                sendResponse({});
                                            },
                                            error: function(error) {
                                                sendResponse({error: error});
                                            },
                                        });
                                    },
                                    error: function(error) {
                                        sendResponse({error: error});
                                    },
                                });
                            },
                            error: function(error) {
                                sendResponse({error: error});
                            },
                        });
                    } else {
                        sendResponse({error: 'Invalid secret'});
                    }
                },
                error: function(error) {
                    sendResponse({error: error});
                },
            });
        }
        if (request.type === 'AddFavorite') {
            $.ajax({
                type: 'PATCH',
                url: 'https://clmapper.firebaseio.com/'+lscache.get('mysecret')+'/favorites/'+md5(request.url)+'.json',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({
                    url: request.url,
                    title: request.title,
                }),
                success: function(response) {
                    sendResponse({});
                },
                error: function(error) {
                    sendResponse({error: error});
                },
            });
        }
        if (request.type === 'RemFavorite') {
            $.ajax({
                type: 'DELETE',
                url: 'https://clmapper.firebaseio.com/'+lscache.get('mysecret')+'/favorites/'+md5(request.url)+'.json',
                dataType: 'json',
                success: function(response) {
                    sendResponse({});
                },
                error: function(error) {
                    sendResponse({error: error});
                },
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
        if (request.type === 'GetMySecret') {
            var s = lscache.get('mysecret');
            if (!s) {
                sendResponse({error:true});
            } else {
                sendResponse({mysecret:s});
            }
        }
    }
    return true;
});

// generate new secret if one does not exist
var mysecret = lscache.get('mysecret');
if (!mysecret) {
    mysecret = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
    lscache.set('mysecret', mysecret);
}

// sync favorites to firebase api
chrome.storage.local.get(function(data) {
    if (chrome.extension.lastError) {
        console.warn(chrome.extension.lastError);
    } else {
        $.each(data, function(key, value) {
            if (key.indexOf('fav:http') === 0) {
                var url = key.replace(/^fav:/, '');
                var json = {};
                json[md5(url)] = {
                    url: url,
                    title: value.title,
                };
                $.ajax({
                    type: 'PATCH',
                    url: 'https://clmapper.firebaseio.com/'+lscache.get('mysecret')+'/favorites.json',
                    data: JSON.stringify(json),
                    dataType: 'json',
                    contentType: 'application/json',
                    success: function(response) {
                        chrome.storage.local.remove(key, function() {
                            if (chrome.extension.lastError)
                                console.warn(chrome.extension.lastError);
                        });
                    },
                });
            }
        });
    }
});

// open Craigslist housing page when extension is first installed
var installed = localStorage.getItem('installed');
if (!installed)
    chrome.tabs.create({url: 'http://www.craigslist.org/hhh/'});
localStorage.setItem('installed', true);
