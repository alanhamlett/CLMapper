/**
 * Google Maps Geocaching API Interface Library
 * Copyright (c) 2012, Alan Hamlett
 *
 */

var Geocoder = function() {

    return {
       
       /**
        * Calls successCallback with data from geocaching api.
        * Combines with data param for passing along defaults or metadata.
        * @param {Object} data
        * @param {Function} successCallback
        * @param {Function} errorCallback
        * @param {number} numErrors
        */ 
        geocode: function(data, successCallback, errorCallback, numErrors) {
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
                            //console.warn('Invalid JSON from Geocoding API: '+jqXHR.responseText);
                        }
                        if (json && json.status === 'OK') {
                            data['lat'] = json.results[0].geometry.location.lat;
                            data['lng'] = json.results[0].geometry.location.lng;
                            data['formatted_address'] = json.results[0].formatted_address;
                            successCallback(data);
                        } else {
                            if (json.status === 'OVER_QUERY_LIMIT') {
                                if (numErrors === undefined)
                                    numErrors = 0;
                                numErrors++;
                                var timeout = (Math.random() * numErrors) * 1000;
                                //console.log('Trying again in '+timeout+' milliseconds');
                                window.setTimeout(
                                    function() {
                                        Geocoder.geocode(data, successCallback, errorCallback, numErrors);
                                    },
                                    timeout
                                );
                            } else {
                                //console.warn('Geocoding API error: '+json.status);
                                errorCallback(json.status);
                            }
                        }
                    } else {
                        errorCallback('responseText is undefined');
                    }
                }
            });
            return;
        }
    };
}();
