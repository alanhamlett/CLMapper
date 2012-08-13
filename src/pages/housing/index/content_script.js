
function HousingIndex() {
    this.postCacheDays = 7;

    this.SetupCSS();
    this.SetupSidebar();
    this.SetupDonateButton();
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
            var data = event.data.data;
            lscache.set('address:'+data.address, data);
            this.AddMarkersFromPage();
        }
    }, this));
    
    // load map on page
    PageInterface.LoadJS('pages/housing/index/page_script.js');
}

HousingIndex.prototype.AddMarkersFromPage = function() {
    var pattern = /(\d+)\.html$/;
    var $ps = $('p.row');
    this.TotalPosts = $ps.length;
    this.NumMarkersAdded = 0;
    for (var row = 0; row < $ps.length; row++) {
        var url = $($ps[row]).find('a').attr('href');
        if (url) {
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
            console.warn('Could not find url from post link: '+row);
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
    if (address !== undefined) {
        var geocoded = lscache.get('address:'+address);
        if (geocoded === null) {
            var data = {
                address: address,
                url: item.url
            };
            Geocoder.geocode(data, $.proxy(function(result) {
                delete result['url'];
                this.SaveAddress(result);
                this.AddMarker(result, item);
                this.IncrementProgressBar();
            }, this));
        } else {
            this.SaveAddress(geocoded);
            this.AddMarker(geocoded, item);
            this.IncrementProgressBar();
        }
    } else {
        //console.warn('Could not find address for post: '+item.url);
        this.IncrementProgressBar();
    }
}

HousingIndex.prototype.GetAddressFromHtml = function(html) {
    var start = html.indexOf('<a target="_blank" href="http://maps.google.com/?q=loc%3A+');
    if (start < 0) {
        return undefined;
    }
    var address = html.substring(start+'<a target="_blank" href="http://maps.google.com/?q=loc%3A+'.length);
    var end = address.indexOf('"');
    address = address.substring(0, end);
    address = decodeURIComponent(address).replace(/\+/g, ' ');
    return address;
}

HousingIndex.prototype.SaveAddress = function(data) {
    lscache.set('address:'+data.address, data, this.postCacheDays * 1440);
}

HousingIndex.prototype.AddMarker = function(address, item) {
    try {
        window.postMessage({ type: 'AddMarker', data: JSON.stringify({address: address, item: item}) }, '*');
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

