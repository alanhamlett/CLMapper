
function HousingIndex() {
    this.postCacheDays = 50;
    this.SetupCSS();
    this.SetupSidebar();
    this.SetupMap();
    return this;
}

HousingIndex.prototype.SetupCSS = function() {
    PageInterface.LoadCSS('pages/housing/index/bootstrap.css');
    PageInterface.LoadCSS('pages/housing/index/page_style.css');
}

HousingIndex.prototype.SetupSidebar = function() {
    $('body > *').wrapAll('<div class="row-fluid"><div id="listings" class="span6"></div></div>');
    var $sidebar = $(
        '<div id="right-side" class="span6"><div class="row-fluid">' +
        '<div id="sidebar" class="span6"><div id="sidebar-map"></div></div>' +
        '</div></div>'
    ).insertAfter('#listings');
    $('#listings blockquote:first').addClass('blockquote-first');
}

HousingIndex.prototype.SetupMap = function() {

    // setup listener to handle MapReady message
    window.addEventListener('message', $.proxy(function(event) {
        if (event.source !== window) {
            return;
        }
        if (event.data.type && event.data.type === 'MapReady') {
            this.AddMarkersFromPage();
        }
    }, this));
    
    // load map on page
    PageInterface.LoadJS('pages/housing/index/page_script.js');
}

HousingIndex.prototype.AddMarkersFromPage = function() {
    var $ps = $('p.row');
    for (var i = 0; i < $ps.length; i++) {
        var $p = $($ps[i]);
        this.GetHtml($p.find('a').attr('href'), i);
    }
}

HousingIndex.prototype.GetHtml = function(url, rowNum) {
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'text',
        success: $.proxy(function(data) {
            this.ProcessHtml(data, url, rowNum);
        }, this)
    });
}

HousingIndex.prototype.ProcessHtml = function(content, url, rowNum) {
    var address = this.GetAddressFromHtml(content);
    if (address !== undefined) {
        var geocoded = lscache.get('address:'+address);
        var markerData = {
            rowNum: rowNum,
            url: url
        };
        if (geocoded === null) {
            var data = {
                address: address,
                url: url
            };
            Geocoder.geocode(data, $.proxy(function(result) {
                delete result['url'];
                this.SaveAddress(result);
                this.AddMarker(result, markerData);
            }, this));
        } else {
            this.SaveAddress(geocoded);
            this.AddMarker(geocoded, markerData);
        }
    } else {
        //console.warn('Could not find address for post: '+url);
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

HousingIndex.prototype.AddMarker = function(addressData, markerData) {
    try {
        window.postMessage({ type: 'AddMarker', data: JSON.stringify({address: addressData, marker: markerData}) }, '*');
        return true;
    } catch (e) {
        return false;
    }
}

