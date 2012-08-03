
function Controller() {
    return this;
}

Controller.prototype.Initialize = function() {

    // Chrome pattern matching is too basic
    // so do more fine grain matching here
    var currentUrl = window.location.href;
    if (currentUrl !== undefined) {
        if (/\/\d+\.html$/.test(currentUrl)) {
            // single post
            // noop until pages/hhh/post.js is finished
        } else {
            // not a single post so hopefully a list of posts
            this.
            //this.RemoveSearch();
            this.StartPageScript('pages/hhh/index.js');
        }
    }
    return this;
}

Controller.prototype.SetupSidebar = function() {
    $('body > *').wrapAll('<div class="row-fluid"><div id="listings" class="span6"></div></div>');
    var $sidebar = $(
        '<div id="right-side" class="span6"><div class="row-fluid">' +
        '<div id="sidebar" class="span6"><div id="sidebar-map"></div></div>' +
        '</div></div>'
    ).insertAfter('#listings');
    $('#listings blockquote:first').addClass('blockquote-first');
}

Controller.prototype.RemoveSearch = function() {
    $('.blockquote-first').remove();
}

Controller.prototype.StartPageScript = function(file) {
    Page.LoadScript(chrome.extension.getURL(file));
}

//var controller = new Controller();
//controller.Initialize();

