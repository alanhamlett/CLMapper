
function Popup() {
    this._empty_msg = '<div>No favorites yet.<br />Click a listing\'s star to save a favorite.</div>';
    this.SetupNavbar();
    this.SetupFavorites();
}

Popup.prototype.SetupNavbar = function() {
    // Populate navbar. Can't do this in html because Chrome will focus the first link.
    $('#nav-brand').on('click', function() {
        chrome.tabs.create({
            url: 'http://www.craigslist.org/hhh/'
        });
    });
    $('div.navbar-inner .collaborate').on('click', function() {
        var $e = $(this);
        if ($e.data('showing-collaborate')) {
            $e.text($e.data('showing-collaborate'));
            $e.data('showing-collaborate', '');
            $('#collaborate-content').hide();
            $('#favorites').show();
        } else {
            $e.data('showing-collaborate', $e.text());
            $e.text('Back');
            $('#favorites').hide();
            $('#collaborate-content').show();
            chrome.extension.sendMessage({type: 'GetMySecret', include_titles: true}, function(response) {
                if (!response.error) {
                    $('.my-secret').text(response.mysecret);
                } else {
                    $('.my-secret').text('Error: Could not get secret');
                }
            });
        }
    });
    $('#collaborate-content form.join').on('submit', function(e) {
        e.preventDefault();
        chrome.extension.sendMessage({type: 'MergeFavorites', secret: $('.friend-secret').val()}, $.proxy(function(response) {
            if (!response.error) {
                $('.friend-secret-flash').text('It worked!');
            } else {
                console.warn(response.error);
                $('.friend-secret-flash').text('Error: Invalid secret');
            }
        }, this));
    });
}

Popup.prototype.SetupFavorites = function() {
    chrome.extension.sendMessage({type: 'GetFavorites', include_titles: true}, $.proxy(function(response) {
        if (!response.error) {
            var $favorites = $('#favorites').empty();
            if (Object.keys(response.favorites).length > 0) {
                var star = chrome.extension.getURL('images/star.png');
                var star_empty = chrome.extension.getURL('images/star-empty.png');
                $.each(response.favorites, function(key, value) {
                    if (!$.trim(value.title))
                        value.title = 'unknown';
                    var $li = $('<div><img class="favorite-icon" src="'+star+'" /><a target="_blank"></a></div>');
                    var $a = $li.find('a');
                    $a.attr('href', value.url);
                    $a.text(value.title);
                    $li.find('img').attr('url', value.url);
                    $favorites.append($li);
                });
                var empty_msg = this._empty_msg;
                $('.favorite-icon').on('click', function() {
                    var url = $(this).attr('url');
                    $(this).attr('src', star_empty);
                    chrome.extension.sendMessage({type: 'RemFavorite', url: url}, $.proxy(function(response) {
                        if (!response.error) {
                            $(this).parent().hide('slow', function() {
                                $(this).remove();
                                if ($('#favorites > div').length === 0) {
                                    $('#favorites').html(empty_msg);
                                }
                            });
                        } else {
                            console.warn(response.error);
                        }
                    }, this));
                });
            } else {
                $favorites.html(this._empty_msg);
            }
        } else {
            console.warn(response.error);
        }
    }, this));
}

$(document).ready(function() {
    var popup = new Popup();
});
