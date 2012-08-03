
function HousingIndex() {
    this.SetupCSS();
    this.SetupSidebar();
    this.SetupJS();
    return this;
}

HousingIndex.prototype.SetupCSS = function() {
    pageInterface.LoadCSS('pages/housing/index/bootstrap.css');
    pageInterface.LoadCSS('pages/housing/index/page_style.css');
}

HousingIndex.prototype.SetupSidebar = function() {
    $('body > *').wrapAll('<div class="row-fluid"><div id="listings" class="span6"></div></div>');
    var $sidebar = $(
        '<div id="right-side" class="span6"><div class="row-fluid">' +
        '<div id="sidebar" class="span6"><div id="sidebar-map"></div></div>' +
        '</div></div>'
    ).insertAfter('#listings');
    $('#listings blockquote:first').addClass('blockquote-first');
}

HousingIndex.prototype.SetupJS = function() {
    pageInterface.LoadJS('pages/housing/index/page_script.js');
}

