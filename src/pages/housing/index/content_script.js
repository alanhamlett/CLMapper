
function HousingIndex() {
    this.SetupGeocoder();
    this.SetupCSS();
    this.SetupSidebar();
    this.WaitForMap();
    this.SetupMap();
    return this;
}

HousingIndex.prototype.SetupCSS = function() {
    pageInterface.LoadCSS('pages/housing/index/bootstrap.css');
    pageInterface.LoadCSS('pages/housing/index/page_style.css');
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
    pageInterface.LoadJS('pages/housing/index/page_script.js');
}

HousingIndex.prototype.SetupGeocoder = function() {
    this.geocoder = new Geocoder();
}

HousingIndex.prototype.WaitForMap = function() {
    window.addEventListener('message', $.proxy(function(event) {
        if (event.source !== window) {
            return;
        }
        if (event.data.type && event.data.type === 'MapReady') {
            this.AddMarkersFromPage();
        }
    }, this));
}

HousingIndex.prototype.AddMarkersFromPage = function() {
    var $ps = $('p.row');
    for (var i = 0; i < $ps.length; i++) {
        var $p = $($ps[i]);
        this.GetHtml($p.find('a').attr('href'), i);
    }
}

HousingIndex.prototype.GetHtml = function(url, id) {
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'text',
        success: $.proxy(function(data) {
            this.ProcessHtml(data, url, id);
        }, this)
    });
}

HousingIndex.prototype.ProcessHtml = function(content, url, id) {
    var address = this.GetAddressFromHtml(content);
    if (address !== undefined) {
        var geocoded = localStorage.getItem('address:'+address);
        if (geocoded === null) {
            var data = {
                address: address,
                url: url,
                id: id
            };
            this.geocoder.Geocode(data, $.proxy(function(result) {
                this.SaveAddress(result);
                this.AddMarker(result);
            }, this));
        } else {
            try {
                var json = JSON.parse(geocoded);
                json['id'] = id;
                json['url'] = url;
                this.AddMarker(json);
            } catch (e) {
                console.warn('Invalid JSON from localStorage: '+geocoded);
            }
        }
    } else {
        //console.warn('Address is undefined from url: '+url);
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
    try {
        localStorage.setItem('address:'+data.address, JSON.stringify(data));
    } catch(e) {
        if (e.name === 'QUOTA_EXCEEDED_ERR') {
            console.warn('localStorage quota exceeded when saving address: '+data.address);
            this.TrimStorage();
            localStorage.setItem('address:'+data.address, JSON.stringify(data));
        }
    }
}

HousingIndex.prototype.AddMarker = function(data) {
    window.postMessage({ type: 'AddMarker', data: JSON.stringify(data) }, '*');
}

HousingIndex.prototype.TrimStorage = function() {
    if (localStorage.length > 0) {
        localStorage.removeItem(localStorage.key(0));
    }
}

