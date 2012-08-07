init();

function init() {
}

function save() {
    // If account changed then reset all the data.
    if (localStorage['account'] && localStorage['account'] != account.value) {
        localStorage.clear();
    }

    var defaultBvr = '1';
    for(var i = 0; i < defaultRadio.length; i++) {
        if(defaultRadio[i].checked) {
            defaultBvr = defaultRadio[i].value;
        }
    }

    localStorage['default'] = defaultBvr;
    localStorage['linksOff'] = links.checked ? '' : '1';
    localStorage['selectOff'] = selectable.checked ? '' : '1';
    localStorage['alertOff'] = alertSound.checked ? '' : '1';
    localStorage['account'] = account.value || '0';

    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
        status.innerHTML = "";
    }, 4000);
}

function clearData() {
    if (confirm('Clear data in extension? (includes extension settings)')) {
        localStorage.clear();
        alert('Extension data cleared. Click the extension icon to sync again.');
    }
}

