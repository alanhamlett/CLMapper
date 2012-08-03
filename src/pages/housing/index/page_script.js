
function Mapper() {
    this.swlat=this.nelat=this.swlng=this.nelng=undefined;
    this.numPans = 0;
    this.maxPans = 15;
    return this;
}

Mapper.prototype.CreateMap = function(callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCU2bdwTlToSTQrf8_8pO89olYKr_9tknY&sensor=false&callback='+callback;
    document.body.appendChild(script);
}

Mapper.prototype.SetupMarkers = function() {
    this.markers = {};
    window.addEventListener('message', function(event) {
        if (event.source !== window) {
            return;
        }
        if (event.data.type && event.data.type === 'AddMarker') {
            mapper.AddMarker(JSON.parse(event.data.data));
        }
    });
    /*this.markerIconNormal = new google.maps.MarkerImage('marker-green.png');
    this.markerIconNormal = new google.maps.MarkerImage('marker-yellow.png');
    google.maps.Marker.prototype.markerIconNormal = this.markerIconNormal;
    google.maps.Marker.prototype.markerIconActive = this.markerIconActive;
    google.maps.Marker.prototype.HighlightMarker = function() {
        this.setIcon(this.markerIconActive);
    };
    google.maps.Marker.prototype.UnHighlightMarker = function() {
        this.setIcon(this.markerIconNormal);
    }*/
}

Mapper.prototype.HighlightMarker = function(key) {
    var marker = this.GetMarker(key);
    if (marker !== undefined) {
        marker.HighlightMarker();
    }
}

Mapper.prototype.UnHighlightMarker = function(key) {
    var marker = this.GetMarker(key);
    if (marker !== undefined) {
        marker.UnHighlightMarker();
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
    var position = new google.maps.LatLng(json.lat, json.lng);
    var ukey = json.lat+','+json.lng;
    if (this.markers[ukey] === undefined) {
        var marker = new google.maps.Marker({
            map: this.map,
            position: position
        });
        this.markers[ukey] = marker;
        google.maps.event.addListener(marker, 'click', function() {
            window.open(json.url);
        });
        google.maps.event.addListener(marker, 'mouseover', function() {
            $('p.row').each(function(key,val) {
                $(this).removeClass('current-listing');
            });
            $($('p.row')[json.id]).addClass('current-listing').focus();
            $($('p.row')[json.id]).children().focus();
            //$('#sidebar-header').text(json.title);
            //$('#sidebar-body').text(json.formatted_address);
        });
    }
    this.FitMarkerInMap(json, position);
    return marker;
}

Mapper.prototype.FitMarkerInMap = function(json, position) {
    if (this.numPans > this.maxPans) {
        return;
    }
    this.numPans++;
    if (this.swlat === undefined || this.swlat < json.viewport.southwest.lat) {
        this.swlat = json.viewport.southwest.lat;
    }
    if (this.nelat === undefined || this.nelat > json.viewport.northeast.lat) {
        this.nelat = json.viewport.northeast.lat;
    }
    if (this.swlng === undefined || this.swlng > json.viewport.southwest.lng) {
        this.swlng = json.viewport.southwest.lng;
    }
    if (this.nelng === undefined || this.nelng < json.viewport.northeast.lng) {
        this.nelng = json.viewport.northeast.lng;
    }
    var sw = new google.maps.LatLng(this.swlat, this.swlng);
    var ne = new google.maps.LatLng(this.nelat, this.nelng);
    var viewport = new google.maps.LatLngBounds(sw, ne);
    this.map.setCenter(position);
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

function HandleCreateMap() {
    mapper.SetupMarkers();
    mapper.map = new google.maps.Map(document.getElementById("sidebar-map"), {
        center: new google.maps.LatLng(37.446614,-122.159836),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    mapper.SignalExtensionReady();
}

window.mapper = new Mapper();
mapper.CreateMap('HandleCreateMap');

