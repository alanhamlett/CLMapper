
function Geocoder() {
    window.geocoder = this;
    return this;
}

Geocoder.prototype.Geocode = function(data, successCallback, numErrors) {
    var url = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address='+encodeURIComponent(data.address)
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'text',
        complete: function(jqXHR) {
            if (jqXHR.responseText !== undefined) {
                var json;
                try {
                    json = JSON.parse(jqXHR.responseText);
                } catch (e) {
                    console.warn('Invalid JSON from Geocoding API: '+jqXHR.responseText);
                }
                if (json && json.status === 'OK') {
                    data['lat'] = json.results[0].geometry.location.lat;
                    data['lng'] = json.results[0].geometry.location.lng;
                    data['formatted_address'] = json.results[0].formatted_address;
                    data['viewport'] = json.results[0].geometry.viewport;
                    successCallback(data);
                } else {
                    console.warn('Geocoding API error: '+json.status);
                    if (json.status === 'OVER_QUERY_LIMIT') {
                        if (numErrors === undefined)
                            numErrors = 0;
                        numErrors++;
                        var timeout = (Math.random() * numErrors) * 1000;
                        //console.log('Trying again in '+timeout+' milliseconds');
                        window.setTimeout(
                            function() {
                                window.geocoder.Geocode(data, successCallback, numErrors);
                            },
                            timeout
                        );
                    }
                }
            }
        }
    });
}

