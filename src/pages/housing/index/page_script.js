
function Mapper() {
    this.swlat=this.nelat=this.swlng=this.nelng=undefined;
    this.numPans = 0;
    this.maxPans = 15;
    this.CreateMap('HandleCreateMap');
    return this;
}

Mapper.prototype.CreateMap = function(callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCU2bdwTlToSTQrf8_8pO89olYKr_9tknY&sensor=false&callback='+callback;
    document.body.appendChild(script);
}

function HandleCreateMap() {
    mapper.SetupMarkers();
    mapper.map = new google.maps.Map(document.getElementById("sidebar-map"), {
        center: new google.maps.LatLng(37.446614,-122.159836),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    mapper.SignalExtensionReady();
}

Mapper.prototype.SetupMarkers = function() {
    this.markers = {};
    this.markerNormal = new google.maps.MarkerImage(localStorage.getItem('lscache-ext_base_dir')+'images/marker-normal.png');
    this.markerFee = new google.maps.MarkerImage(localStorage.getItem('lscache-ext_base_dir')+'images/marker-fee.png');
    var markerNormalVisited = this.markerNormalVisited = new google.maps.MarkerImage(localStorage.getItem('lscache-ext_base_dir')+'images/marker-normal-visited.png');
    var markerFeeVisited = this.markerFeeVisited = new google.maps.MarkerImage(localStorage.getItem('lscache-ext_base_dir')+'images/marker-fee-visited.png');
    this.markerShadow = new google.maps.MarkerImage(localStorage.getItem('lscache-ext_base_dir')+'images/marker-shadow.png');
    google.maps.Marker.prototype.HighlightMarker = function() {
        if (this.address.visited !== true) {
            this.address['visited'] = true;
            window.postMessage({ type: 'UpdateAddress', data: this.address }, '*');
        }
        if (this.fee) {
            this.setIcon(markerFeeVisited);
        } else {
            this.setIcon(markerNormalVisited);
        }
    };
    window.addEventListener('message', function(event) {
        if (event.source !== window) {
            return;
        }
        if (event.data.type && event.data.type === 'AddMarker') {
            mapper.AddMarker(JSON.parse(event.data.data));
        }
    });
}

Mapper.prototype.HighlightMarker = function(key) {
    var marker = this.GetMarker(key);
    if (marker !== undefined) {
        marker.HighlightMarker();
    }
}

Mapper.prototype.GetMarker = function(key) {
    if (name in this.markers) {
        return this.markers[key];
    } else {
        return undefined;
    }
}

Mapper.prototype.DeleteMarker = function(key) {
    var marker = this.GetMarker(key);
    if (marker !== undefined) {
        marker.setMap(null);
        return delete this.markers[key];
    } else {
        return false;
    }
}

Mapper.prototype.GetMarkers = function() {
    return this.markers;
}

Mapper.prototype.AddMarker = function(json) {
    var position = new google.maps.LatLng(json.address.lat, json.address.lng);
    var ukey = json.address.lat+','+json.address.lng;
    var icon = this.markerNormal;
    var fee = false;
    if (json.item.cat === 'fee' || json.item.cat === 'aiv') {
        icon = this.markerFee;
        fee = true;
    }
    if (this.markers[ukey] === undefined) {
        var marker = new google.maps.Marker({
            map: this.map,
            icon: icon,
            shadow: this.markerShadow,
            position: position
        });
        marker['address'] = json.address;
        marker['item'] = json.item;
        marker['fee'] = fee;
        if (json.address.visited)
            marker.HighlightMarker();
        this.markers[ukey] = marker;
        var $this = this;
        google.maps.event.addListener(marker, 'click', function() {
            this.HighlightMarker();
            window.open(json.item.url);
        });
        google.maps.event.addListener(marker, 'mouseover', function() {
            $('p.row').each(function(key,val) {
                $(this).removeClass('current-listing');
            });
            $($('p.row')[json.item.row]).addClass('current-listing');
            $($('p.row')[json.item.row]).children().focus();
        });
    }
    this.FitMarkerInMap(json.address);
    return marker;
}

Mapper.prototype.FitMarkerInMap = function(json) {
    if (this.numPans > this.maxPans) {
        return;
    }
    this.numPans++;
    if (this.swlat === undefined || this.swlat < json.lat) {
        this.swlat = json.lat;
    }
    if (this.nelat === undefined || this.nelat > json.lat) {
        this.nelat = json.lat;
    }
    if (this.swlng === undefined || this.swlng > json.lng) {
        this.swlng = json.lng;
    }
    if (this.nelng === undefined || this.nelng < json.lng) {
        this.nelng = json.lng;
    }
    var sw = new google.maps.LatLng(this.swlat, this.swlng);
    var ne = new google.maps.LatLng(this.nelat, this.nelng);
    var viewport = new google.maps.LatLngBounds(sw, ne);
    this.map.fitBounds(viewport);
}

Mapper.prototype.ClearMarkers = function() {
    for (var i in this.markers) {
        this.markers[i].setMap(null);
    }
    this.markers = {};
}

Mapper.prototype.SignalExtensionReady = function() {
    window.postMessage({ type: 'MapReady' }, '*');
}

window.mapper = new Mapper();

