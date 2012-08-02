
function Controller() {
    this.SetupSidebar();
    //this.RemoveSearch();
    this.StartPageScript('pages/hhh/list.js');
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

var controller = new Controller();

