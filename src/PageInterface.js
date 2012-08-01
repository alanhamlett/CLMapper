
function PageInterface() {
    this.scripts = new Array();
    return this;
}

PageInterface.prototype.AddScript = function(url) {
    this.scripts[this.scripts.length] = url;
    return this;
}

PageInterface.prototype.LoadScripts = function() {

    // return if we have no scripts to load
    if (this.scripts.length < 1) {
        return this;
    }

    // get and remove first script in the array
    var url = this.scripts.shift();
    console.log('loading: '+url);

    this.LoadScript(url);

    // do it again until no more scripts to load
    this.LoadScripts();
    return this;
}

PageInterface.prototype.LoadScript = function(url) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    document.body.appendChild(script);
    return this;
}
    
PageInterface.prototype.ExecString = function(code) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.innerHTML = code;
    document.body.appendChild(script);
    /*chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.executeScript(tab.id, {
            code: code,
            runAt: 'document_end'
        });
    });*/
    return this;
}

window.Page = new PageInterface();

