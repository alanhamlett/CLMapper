
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
    this.markerNormalActive = new google.maps.MarkerImage(localStorage.getItem('lscache-ext_base_dir')+'images/marker-normal-active.png');
    this.markerFeeActive = new google.maps.MarkerImage(localStorage.getItem('lscache-ext_base_dir')+'images/marker-fee-active.png');
    this.markerNormalVisited = new google.maps.MarkerImage(localStorage.getItem('lscache-ext_base_dir')+'images/marker-normal-visited.png');
    this.markerFeeVisited = new google.maps.MarkerImage(localStorage.getItem('lscache-ext_base_dir')+'images/marker-fee-visited.png');
    this.markerShadow = new google.maps.MarkerImage(localStorage.getItem('lscache-ext_base_dir')+'images/marker-shadow.png');
    window.addEventListener('message', function(event) {
        if (event.source !== window) {
            return;
        }
        if (event.data.type) {
            if (event.data.type === 'AddMarker') {
                mapper.AddMarker(event.data.data);
            }
            if (event.data.type === 'HoverMarker') {
                mapper.HoverMarker(event.data.data.url);
            }
            if (event.data.type === 'ClickMarker') {
                mapper.ClickMarker(event.data.data.url);
            }
        }
    });
}

Mapper.prototype.HoverMarker = function(url) {
    if (this._active_marker !== undefined) {
        this._active_marker['active'] = false;
        this.UpdateIcon(this._active_marker);
        this._active_marker = undefined;
    }
    var marker = this.GetMarker(url);
    if (marker !== undefined) {
        marker['active'] = true;
        this._active_marker = marker;
        this.CenterMapOnMarker(marker);
        this.UpdateIcon(marker);
    }
}

Mapper.prototype.ClickMarker = function(url) {
    var marker = this.GetMarker(url);
    if (marker !== undefined) {
        if (marker.address.visited !== true) {
            marker.address['visited'] = true;
            window.postMessage({ type: 'UpdateAddress', data: marker.address }, '*');
        }
        this.UpdateIcon(marker);
    }
}

Mapper.prototype.UpdateIcon = function(marker) {
    if (marker.fee) {
        if (marker.active) {
            marker.setIcon(this.markerFeeActive);
        } else if (marker.address.visited) {
            marker.setIcon(this.markerFeeVisited);
        } else {
            marker.setIcon(this.markerFee);
        }
    } else {
        if (marker.active) {
            marker.setIcon(this.markerNormalActive);
        } else if (marker.address.visited) {
            marker.setIcon(this.markerNormalVisited);
        } else {
            marker.setIcon(this.markerNormal);
        }
    }
}

Mapper.prototype.GetMarker = function(url) {
    if (url in this.markers) {
        return this.markers[url];
    } else {
        return undefined;
    }
}

Mapper.prototype.DeleteMarker = function(url) {
    var marker = this.GetMarker(url);
    if (marker !== undefined) {
        marker.setMap(null);
        return delete this.markers[url];
    } else {
        return false;
    }
}

Mapper.prototype.GetMarkers = function() {
    return this.markers;
}

Mapper.prototype.AddMarker = function(json) {
    var position = new google.maps.LatLng(json.address.lat, json.address.lng);
    var icon = this.markerNormal;
    var fee = false;
    if (json.item.cat === 'fee' || json.item.cat === 'aiv') {
        icon = this.markerFee;
        fee = true;
    }
    if (this.markers[json.item.url] === undefined) {
        var marker = new google.maps.Marker({
            map: this.map,
            icon: icon,
            shadow: this.markerShadow,
            position: position
        });
        marker['address'] = json.address;
        marker['item'] = json.item;
        marker['fee'] = fee;
        marker['title'] = json.title;
        this.markers[marker.item.url] = marker;
        var $this = this;
        google.maps.event.addListener(marker, 'click', function() {
            $this.ClickMarker(this.item.url);
            window.open(this.item.url);
        });
        google.maps.event.addListener(marker, 'mouseover', function() {
            window.postMessage({ type: 'HoverListing', data: { url: this.item.url } }, '*');
        });
        google.maps.event.addListener(marker, 'mouseout', function() {
            window.postMessage({ type: 'HoverListing', data: { url: undefined } }, '*');
        });
        if (marker.address.visited)
            this.ClickMarker(marker.item.url);
    }
    this.FitMarkerInMap(marker.address);
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

Mapper.prototype.CenterMapOnMarker = function(marker) {
    var viewport = new google.maps.LatLng(marker.lat, marker.lng);
    //this.map.panTo(viewport);
}

Mapper.prototype.ClearMarkers = function() {
    for (var url in this.markers) {
        this.markers[url].setMap(null);
    }
    this.markers = {};
}

Mapper.prototype.SignalExtensionReady = function() {
    window.postMessage({ type: 'MapReady' }, '*');
}

window.mapper = new Mapper();

