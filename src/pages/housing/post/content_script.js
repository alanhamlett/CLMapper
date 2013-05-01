
function HousingPost() {
    this.SetupCSS();
    this.SetupFavorites();
    
    return this;
}

HousingPost.prototype.SetupCSS = function() {
    PageInterface.LoadCSS('pages/housing/post/page_style.css');
}

HousingPost.prototype.SetupFavorites = function() {
    this.AddStarIcon(window.location.href);
    var index = this;
    $('img.favorite-icon').on('click', function() {
        index.ToggleFavorite($(this));
    });
}

HousingPost.prototype.ToggleFavorite = function($icon) {
    if ($icon.attr('url') && $icon.attr('favorite')) {
        var url = window.location.href;
        var title = $('h2:first').text();
        var favorite = $icon.attr('favorite');
        if (favorite === 'true') {
            chrome.extension.sendMessage({type: 'RemFavorite', url: url}, $.proxy(function(response) {
                if (!response.error) {
                    $icon.attr('src', chrome.extension.getURL('images/star-empty.png'));
                    $icon.attr('favorite', 'false');
                } else {
                    console.warn(response.error);
                }
            }, this));
        } else if (favorite === 'false') {
            chrome.extension.sendMessage({type: 'AddFavorite', url: url, title: title}, $.proxy(function(response) {
                if (!response.error) {
                    $icon.attr('src', chrome.extension.getURL('images/star.png'));
                    $icon.attr('favorite', 'true');
                } else {
                    console.warn(response.error);
                }
            }, this));
        }
    }
}

HousingPost.prototype.AddStarIcon = function(url) {
    var $starIcon = $('<img class="favorite-icon" />');
    $starIcon.attr('url', url);
    $('h2:first').prepend($starIcon);
    chrome.extension.sendMessage({type: 'GetFavorite', url: url}, $.proxy(function(response) {
        if (!response.error) {
            if (response.favorite) {
                $starIcon.attr('src', chrome.extension.getURL('images/star.png'));
                $starIcon.attr('favorite', 'true');
            } else {
                $starIcon.attr('src', chrome.extension.getURL('images/star-empty.png'));
                $starIcon.attr('favorite', 'false');
            }
        } else {
            console.warn(response.error);
        }
    }, this));
}

