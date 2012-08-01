
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
    this.markerIconNormal = new google.maps.MarkerImage('marker-green.png');
    this.markerIconNormal = new google.maps.MarkerImage('marker-yellow.png');
    google.maps.Marker.prototype.markerIconNormal = this.markerIconNormal;
    google.maps.Marker.prototype.markerIconActive = this.markerIconActive;
    google.maps.Marker.prototype.HighlightMarker = function() {
        this.setIcon(this.markerIconActive);
    };
    google.maps.Marker.prototype.UnHighlightMarker = function() {
        this.setIcon(this.markerIconNormal);
    }
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
            position: position,
            animation: google.maps.Animation.DROP
            //icon: this.markerIconNormal
        });
        this.markers[ukey] = marker;
        google.maps.event.addListener(marker, 'click', function() {
            window.location = json.url;
        });
        google.maps.event.addListener(marker, 'mouseover', function() {
            $('p.row').each(function(key,val) {
                $(this).removeClass('current-listing');
            });
            $($('p.row')[id]).addClass('current-listing').focus();
            $($('p.row')[id]).children().focus();
            //$('#sidebar-header').text(json.title);
            //$('#sidebar-body').text(json.formatted_address);
        });
    }
    //this.map.fitBounds(viewport);
    //this.map.setCenter(position);
    this.FitMarkerInMap(json);
    return marker;
};

Mapper.prototype.FitMarkerInMap = function(json) {
    if (this.swlat === undefined || this.swlat < json.viewport.sw.lat) {
        this.swlat = json.viewport.sw.lat;
    }
    if (this.nelat === undefined || this.nelat > json.viewport.ne.lat) {
        this.nelat = json.viewport.ne.lat;
    }
    if (this.swlng === undefined || this.swlng > json.viewport.sw.lng) {
        this.swlng = json.viewport.sw.lng;
    }
    if (this.nelng === undefined || this.nelng < json.viewport.ne.lng) {
        this.nelng = json.viewport.ne.lng;
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
};

window.mapper = new Mapper();

window.GeocodingQueueCounter = 0;
window.GeocodingQueue = new Array();

function Controller() {
    return this;
}

Controller.prototype.AddMarkersFromPage = function() {
    window.setTimeout(controller.ProcessGeocodingQueue, 1 * 1000);
    var $ps = $('p.row');
    for (var i = 0; i < $ps.length; i++) {
        var $p = $($ps[i]);
        this.GetHtml($p.find('a'), i);
    }
}

Controller.prototype.GetHtml = function($link, id) {
    var $this = this;
    var url = $link.attr('href');
    var content = localStorage.getItem('content:'+url);
    if (content === null) {
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'text',
            success: function(data) {
                $this.ParseHtml(data, url, id);
            }
        });
    } else {
        var content = JSON.parse(content);
        this.ParseHtml(content.content, url, id);
    }
}

Controller.prototype.ParseHtml = function(content, url, id) {
    var json = JSON.stringify({
        content: content
    });
    //localStorage.setItem('content:'+url, json);
    var address = this.ParseAddress(content);
    if (address !== undefined) {
        var geocoded = localStorage.getItem('address:'+address);
        if (geocoded === null) {
            GeocodingQueue.push(JSON.stringify({
                address: address,
                url: url,
                rowId: id
            }));
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
    window.setTimeout(controller.ProcessGeocodingQueue, 1 * 1000);
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

window.controller = new Controller();

function HandleCreateMap() {
    mapper.SetupMarkers();
    window.geocoder = new google.maps.Geocoder();
    mapper.map = new google.maps.Map(document.getElementById("sidebar-map"), {
        center: new google.maps.LatLng(37.446614,-122.159836),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    controller.AddMarkersFromPage();
}

mapper.CreateMap('HandleCreateMap');

