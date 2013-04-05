
function HousingIndex() {
    this.postCacheDays = 7;
    this.options = {};

    this.SetupOptions();
    this.SetupCSS();
    this.SetupSidebar();
    this.SetupDonateButton();
    this.SetupListings();
    this.SetupFavorites();
    this.SetupMap();

    return this;
}

HousingIndex.prototype.SetupCSS = function() {
    PageInterface.LoadCSS('pages/housing/index/bootstrap.css');
    PageInterface.LoadCSS('pages/housing/index/page_style.css');
}

HousingIndex.prototype.SetupSidebar = function() {
    $('body > *').wrapAll('<div><div id="listings"></div></div>');
    var $sidebar = $(
        '<div id="sidebar">' +
        '<div id="sidebar-map"></div>' +
        '</div>' +
        '<div class="progress progress-striped active" id="marker-progress"><div class="bar"></div></div>'
    ).insertAfter('#listings');
    $('#listings blockquote:first').addClass('blockquote-first');
}

HousingIndex.prototype.SetupDonateButton = function() {
    $('<a id="donate-link" href="https://www.wepay.com/donations/clmapper"><img src="'+chrome.extension.getURL('images/donate-green.png')+'" border="0" title="Keep the features rollin, donate!" /></a>').insertAfter('#listings');
}

HousingIndex.prototype.SetupOptions = function() {
    var $elem = $('<div><span><input type="checkbox" name="autoscroll" checked="checked">Auto-Scroll to Listing</span></div>');
    $elem.css({
        'z-index': '2',
        'font-family': 'Arial, sans-serif',
        'font-size': '14px',
        'color': 'rgb(68, 68, 68)',
        'height': '22px',
        'line-height': '19px',
        'background-color': 'rgb(245, 245, 245)',
        'border': '1px solid rgb(220, 220, 220)',
        'padding': '0px',
        'position': 'fixed',
        'bottom': '24px',
        'right': '0px',
    });
    $elem.find('input').css({
        'position': 'relative',
        'top': '2px',
    });
    $('body').append($elem);
    chrome.extension.sendMessage({type: 'GetOptions'}, $.proxy(function(response) {
        if (!response.error) {
            HousingIndex.options = response.options;
            $elem.find('input[name="autoscroll"]').prop('checked', response.options.autoscroll);
        } else {
            console.warn(response.error);
        }
    }, this));
    $elem.find('input[name="autoscroll"]').click(function(e) {
        HousingIndex.options.autoscroll = $(e.target).prop('checked');
        chrome.extension.sendMessage({type: 'SetOptions', options: HousingIndex.options}, $.proxy(function(response) {
            if (response.error) {
                console.warn(response.error);
            }
        }, this));
    });
}

HousingIndex.prototype.SetupMap = function() {

    // save location of marker icons
    lscache.set('ext_base_dir', chrome.extension.getURL('/'));

    // setup listener to handle MapReady message
    window.addEventListener('message', $.proxy(function(event) {
        if (event.source !== window) {
            return;
        }
        if (event.data.type && event.data.type === 'MapReady') {
            this.AddMarkersFromPage();
        }
    }, this));

    // setup listener to handle UpdateAddress message
    window.addEventListener('message', $.proxy(function(event) {
        if (event.source !== window) {
            return;
        }
        if (event.data.type && event.data.type === 'UpdateAddress') {
            lscache.set('address:'+event.data.data.address, event.data.data);
        }
    }, this));

    // load map on page
    PageInterface.LoadJS('pages/housing/index/page_script.js');
}

HousingIndex.prototype.SetupListings = function() {
    var index = this;

    window.addEventListener('message', $.proxy(function(event) {
        if (event.source !== window) {
            return;
        }
        if (event.data.type && event.data.type === 'HoverListing') {
            this.HoverListing(event.data.data.url);
            if (HousingIndex.options.autoscroll)
                this.ScrollToListing(event.data.data.url);
        }
    }, this));

    $('p.row').hover(
        function() {
            var url = $(this).find('a').attr('href');
            if (url) {
                index.HoverListing(url);
            } else {
                console.warn('Could not find url for listing.');
            }
        },
        function() {
            index.HoverListing();
        }
    );
    $('p.row > a').on('click', function(e) {
        e.preventDefault();
        var url = $(this).attr('href');
        if (url) {
            index.ClickListing(url);
        } else {
            console.warn('Could not find url for listing.');
        }
        return false;
    });
}

HousingIndex.prototype.HoverListing = function(url) {
    if (this.Listings !== undefined) {
        if (this._active_listing !== undefined) {
            this.Listings[this._active_listing].$row.removeClass('current-listing');
        }
        if (this.Listings[url] !== undefined) {
            this._active_listing = url;
            this.Listings[url].$row.addClass('current-listing');
        }
        try {
            window.postMessage({ type: 'HoverMarker', data: {url: url} }, '*');
        } catch (e) { }
    }
}

HousingIndex.prototype.ScrollToListing = function(url) {
    if (this.Listings[url] !== undefined) {
        var $listings = $('#listings');
        var halfPageHeight = $listings.height() / -2;
        $('body').animate({
            scrollTop: Math.floor(this.Listings[url].$row.offset().top - $listings.offset().top + $listings.scrollTop() + halfPageHeight)
        }, 100);
    }
}

HousingIndex.prototype.ClickListing = function(url) {
    try {
        window.postMessage({ type: 'ClickMarker', data: {url: url} }, '*');
    } catch (e) { }
    window.open(url);
}

HousingIndex.prototype.SetupFavorites = function() {
    var $ps = $('p.row');
    for (var row = 0; row < $ps.length; row++) {
        this.AddStarIcon($($ps[row]));
    }
    var index = this;
    $('img.favorite-icon').on('click', function() {
        index.ToggleFavorite($(this));
    });
}

HousingIndex.prototype.ToggleFavorite = function($icon) {
    if ($icon.attr('data-url') && $icon.attr('favorite')) {
        var url = $icon.attr('data-url');
        var title = $icon.attr('data-title');
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

HousingIndex.prototype.AddStarIcon = function($row) {
    var url = $row.find('a:first').prop('href');
    var title = url;
    $row.find('a').each(function() {
        var $this = $(this);
        if ($this.text()) {
            url = $this.prop('href');
            title = $this.text();
            return false;
        }
        return true;
    });
    var $starIcon = $('<img class="favorite-icon" />');
    $starIcon.attr('data-url', url);
    $starIcon.attr('data-title', title);
    $row.prepend($starIcon);
    chrome.extension.sendMessage({type: 'GetFavorites'}, $.proxy(function(response) {
        if (!response.error) {
            if (response.favorites[url]) {
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

HousingIndex.prototype.AddMarkersFromPage = function() {
    var pattern = /(\d+)\.html$/;
    var $ps = $('p.row');
    this.TotalPosts = $ps.length;
    this.NumMarkersAdded = 0;
    this.Listings = {};
    for (var row = 0; row < $ps.length; row++) {
        var url = $($ps[row]).find('a').attr('href');
        if (url) {
            this.Listings[url] = {
                $row: $($ps[row])
            };
            var category = url.split('/');
            var id = category.pop();
            category = category.pop();
            id = id.replace(pattern, '$1');
            var item = {
                id: id,
                cat: category,
                url: url,
                row: row
            };
            this.GetHtml(item);
        } else {
            //console.warn('Could not find url from post link: '+row);
            this.IncrementProgressBar();
        }
    }
}

HousingIndex.prototype.GetHtml = function(item) {
    $.ajax({
        url: item.url,
        type: 'GET',
        dataType: 'text',
        success: $.proxy(function(responseText) {
            this.ProcessHtml(responseText, item);
        }, this),
        error: $.proxy(function() {
            this.IncrementProgressBar();
        }, this)
    });
}

HousingIndex.prototype.ProcessHtml = function(responseText, item) {
    var address = this.GetAddressFromHtml(responseText);
    var title = this.GetTitleFromHtml(responseText);
    if (address && title) {
        var geocoded = lscache.get('address:'+address);
        if (geocoded === null) {
            var data = {
                address: address,
                url: item.url
            };
            Geocoder.geocode(
                data,
                $.proxy(function(result) {
                    delete result['url'];
                    this.SaveAddress(result);
                    this.AddMarker(result, item, title);
                    this.IncrementProgressBar();
                }, this),
                $.proxy(function(errorMsg) {
                    this.IncrementProgressBar();
                }, this)
            );
        } else {
            this.SaveAddress(geocoded);
            this.AddMarker(geocoded, item, title);
            this.IncrementProgressBar();
        }
    } else {
        //console.warn('Could not find address for post: '+item.url);
        this.IncrementProgressBar();
    }
}

HousingIndex.prototype.GetTitleFromHtml = function(html) {
    try {
        var start = html.indexOf('<h2 class="postingtitle">');
        if (start < 0) {
            return undefined;
        }
        var text = html.substring(start+'<h2 class="postingtitle">'.length);
        var end = text.indexOf('</h2>');
        text = text.substring(0, end);
        text = text.replace(/%/g, '%25');
        text = decodeURIComponent(text);
        return text;
    } catch (e) {
        return undefined;
    }
}

HousingIndex.prototype.GetAddressFromHtml = function(html) {
    try {
        var start = html.indexOf('<a target="_blank" href="http://maps.google.com/?q=loc%3A+');
        if (start < 0) {
            return undefined;
        }
        var address = html.substring(start+'<a target="_blank" href="http://maps.google.com/?q=loc%3A+'.length);
        var end = address.indexOf('"');
        address = address.substring(0, end);
        address = decodeURIComponent(address).replace(/\+/g, ' ');
        return address;
    } catch (e) {
        return undefined;
    }
}

HousingIndex.prototype.SaveAddress = function(data) {
    lscache.set('address:'+data.address, data, this.postCacheDays * 1440);
}

HousingIndex.prototype.AddMarker = function(address, item, title) {
    try {
        window.postMessage({ type: 'AddMarker', data: {address: address, item: item, title: title} }, '*');
        return true;
    } catch (e) {
        return false;
    }
}

HousingIndex.prototype.IncrementProgressBar = function() {
    this.NumMarkersAdded++;
    if (this.NumMarkersAdded >= this.TotalPosts) {
        $('#marker-progress').remove();
    } else {
        $('#marker-progress > div').css('width', (this.NumMarkersAdded / this.TotalPosts * 100)+'%');
    }
}

