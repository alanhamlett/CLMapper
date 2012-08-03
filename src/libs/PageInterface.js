
function PageInterface() {
    return this;
}

PageInterface.prototype.LoadJS = function(file) {
    var url = chrome.extension.getURL(file);
    var script = $('<script type="text/javascript"></script>').attr('src', url);
    $('head').append(script);
    return this;
}

PageInterface.prototype.LoadCSS = function(file) {
    var url = chrome.extension.getURL(file);
    var style = $('<link rel="stylesheet" type="text/css" media="all" />').attr('href', url);
    $('head').append(style);
    return this;
}
    
PageInterface.prototype.ExecString = function(code) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.innerHTML = code;
    document.body.appendChild(script);
    return this;
}

