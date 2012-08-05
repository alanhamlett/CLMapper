/**
 * Interface For Injecting Into Page
 * Copyright (c) 2012, Alan Hamlett
 *
 */

var PageInterface = function() {

    return {
       
       /**
        * Loads Javascript from extension local file and executes on content script's view.
        * @param {String} file
        * @return {this}
        */ 
        LoadJS: function(file) {
            var url = chrome.extension.getURL(file);
            var script = $('<script type="text/javascript"></script>').attr('src', url);
            $('head').append(script);
            return this;
        },

       /**
        * Loads CSS from extension local file and applies it on content script's view.
        * @param {String} file
        * @return {this}
        */ 
        LoadCSS: function(file) {
            var url = chrome.extension.getURL(file);
            var style = $('<link rel="stylesheet" type="text/css" media="all" />').attr('href', url);
            $('head').append(style);
            return this;
        },
            
       /**
        * Executes code on content script's view.
        * @param {String} code
        * @return {this}
        */ 
        ExecString: function(code) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.innerHTML = code;
            document.body.appendChild(script);
            return this;
        }
    };
}();
