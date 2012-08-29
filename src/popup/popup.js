
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
}

Popup.prototype.SetupFavorites = function() {
    chrome.extension.sendMessage({type: 'GetFavorites', include_titles: true}, $.proxy(function(response) {
        if (!response.error) {
            var $favorites = $('#favorites');
            if (Object.keys(response.favorites).length > 0) {
                var star = chrome.extension.getURL('images/star.png');
                var star_empty = chrome.extension.getURL('images/star-empty.png');
                $.each(response.favorites, function(key, value) {
                    var $li = $('<div><img class="favorite-icon" src="'+star+'" /><a target="_blank"></a></div>');
                    var $a = $li.find('a');
                    $a.attr('href', key);
                    $a.text(value.title);
                    $li.find('img').attr('url', key);
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