
function Mapper() {
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
};

Mapper.prototype.HighlightMarker = function(key) {
    var marker = this.GetMarker(key);
    if (marker !== undefined) {
        marker.HighlightMarker();
    }
};

Mapper.prototype.UnHighlightMarker = function(key) {
    var marker = this.GetMarker(key);
    if (marker !== undefined) {
        marker.UnHighlightMarker();
    }
};

Mapper.prototype.GetMarker = function(key) {
    if (name in this.markers) {
        return this.markers[key];
    } else {
        return undefined;
    }
};

Mapper.prototype.DeleteMarker = function(key) {
    var marker = this.GetMarker(key);
    if (marker !== undefined) {
        marker.setMap(null);
        return delete this.markers[key];
    } else {
        return false;
    }
};

Mapper.prototype.GetMarkers = function() {
    return this.markers;
};

Mapper.prototype.AddMarker = function(json, id) {
    var position = new google.maps.LatLng(json.lat, json.lng);
    var ukey = json.lat+','+json.lng;
    if (this.markers[ukey] === undefined) {
        var marker = new google.maps.Marker({
            map: this.map,
            position: position
        });
        this.markers[ukey] = marker;
    }
    this.map.setCenter(position);
    return marker;
};

Mapper.prototype.ClearMarkers = function() {
    for (var i in this.markers) {
        this.markers[i].setMap(null);
    }
    this.markers = {};
};

window.mapper = new Mapper();

window.GeocodingQueueCounter = 0;
window.GeocodingQueue = new Array();

function Controller() {
    return this;
}

Controller.prototype.GetHtml = function(url, id) {
    var $this = this;
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'text',
        success: function(data) {
            $this.ParseHtml(data, url, id);
        }
    });
}

Controller.prototype.ParseHtml = function(content, url, id) {
    var json = JSON.stringify({
        content: content
    });
    var address = this.ParseAddress(content);
    if (address !== undefined) {
        var geocoded = localStorage.getItem('address:'+address);
        if (geocoded === null) {
            GeocodingQueue.push(JSON.stringify({
                address: address,
                url: url,
                rowId: id
            }));
            controller.ProcessGeocodingQueue();
        } else {
            mapper.AddMarker(JSON.parse(geocoded), id);
        }
    } else {
        //console.warn('Address is undefined from url: '+url);
    }
}

Controller.prototype.ProcessGeocodingQueue = function() {
    if (GeocodingQueue.length > 0) {
        var job = JSON.parse(GeocodingQueue.shift());
        var geocoded = localStorage.getItem('address:'+job.address);
        if (geocoded === null) {
            geocoder.geocode({'address': job.address}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var southWest = results[0].geometry.viewport.getSouthWest();
                    var northEast = results[0].geometry.viewport.getNorthEast();
                    var json = {
                        url: job.url,
                        address: job.address,
                        formatted_address: results[0].formatted_address,
                        address_components: results[0].address_components,
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng(),
                        viewport: {
                            sw: {
                                lat: southWest.lat(),
                                lng: southWest.lng()
                            },
                            ne: {
                                lat: northEast.lat(),
                                lng: northEast.lng()
                            },
                        }
                    };
                    try {
                        localStorage.setItem('address:'+job.address, JSON.stringify(json));
                    } catch(e) {
                        if (e.name === 'QUOTA_EXCEEDED_ERR') {
                            console.warn('Quota exceeded when saving address: '+job.address);
                            controller.TrimStorage();
                            localStorage.setItem('address:'+job.address, JSON.stringify(json));
                        }
                    }
                    mapper.AddMarker(json, job.rowId);
                } else {
                    //console.warn('Geocoding "'+job.address+'" failed because: '+status);
                    GeocodingQueue.push(JSON.stringify(job));
                }
            });
        } else {
            mapper.AddMarker(JSON.parse(geocoded), job.rowId);
        }
    }
    controller.SetGeocodingQueueTimeout();
}

Controller.prototype.ParseAddress = function(html) {
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

Controller.prototype.TrimStorage = function() {
    if (localStorage.length > 0) {
        localStorage.removeItem(localStorage.key(0));
    }
}

Controller.prototype.SetGeocodingQueueTimeout = function() {
    window.setTimeout(controller.ProcessGeocodingQueue, 0.1 * 1000);
}

window.controller = new Controller();

function HandleCreateMap() {
    mapper.SetupMarkers();
    window.geocoder = new google.maps.Geocoder();
    mapper.map = new google.maps.Map(document.getElementById("sidebar-map"), {
        center: new google.maps.LatLng(37.446614,-122.159836),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    controller.AddMarkerFromPost();
}

mapper.CreateMap('HandleCreateMap');

