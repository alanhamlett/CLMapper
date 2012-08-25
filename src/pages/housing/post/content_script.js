
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
        var favorite = $icon.attr('favorite');
        if (favorite === 'true') {
            chrome.extension.sendMessage({type: 'RemFavorite', url: url}, $.proxy(function(response) {
                if (response.success) {
                    $icon.attr('src', chrome.extension.getURL('images/star-empty.png'));
                    $icon.attr('favorite', 'false');
                } else {
                    $icon.attr('src', chrome.extension.getURL('images/star.png'));
                    $icon.attr('favorite', 'true');
                }
            }, this));
        } else if (favorite === 'false') {
            chrome.extension.sendMessage({type: 'AddFavorite', url: url}, $.proxy(function(response) {
                if (response.success) {
                    $icon.attr('src', chrome.extension.getURL('images/star.png'));
                    $icon.attr('favorite', 'true');
                } else {
                    $icon.attr('src', chrome.extension.getURL('images/star-empty.png'));
                    $icon.attr('favorite', 'false');
                }
            }, this));
        }
    }
}

HousingPost.prototype.AddStarIcon = function(url) {
    var $starIcon = $('<img class="favorite-icon" url="'+url+'"/>');
    $('h2:first').prepend($starIcon);
    chrome.extension.sendMessage({type: 'GetFavorites', url: url}, $.proxy(function(response) {
        if (response.value['fav:'+url]) {
            $starIcon.attr('src', chrome.extension.getURL('images/star.png'));
            $starIcon.attr('favorite', 'true');
        } else {
            $starIcon.attr('src', chrome.extension.getURL('images/star-empty.png'));
            $starIcon.attr('favorite', 'false');
        }
    }, this));
}

