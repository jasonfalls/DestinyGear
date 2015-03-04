var tabId, csrf, characters;

function openTab() {
    chrome.tabs.create({
        url: chrome.extension.getURL('/index.html'),
        active: false
    }, function(tab) {
        tabId = tab.id;
    });
}

function piggybackToTab() {
    chrome.tabs.sendMessage(tabId, {
        csrfSet: true,
        csrf: csrf,
        characters: characters
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if (request.csrfSet) {
        // https://bungie.net/...
        csrf = request.csrf;
        if (tabId === undefined) {
            openTab();
            return;
        }
        chrome.tabs.get(tabId, function(tab) {
            if (chrome.runtime.lastError) {
                openTab();
            } else {
                tabId = tab.id;
                piggybackToTab();
            }
        });
    } else if (request.piggybackSet) {
        // https://bungie.net/...
        csrf = request.csrf;
        characters = request.characters;
        if (tabId === undefined) {
            openTab();
            return;
        }
        chrome.tabs.get(tabId, function(tab) {
            if (chrome.runtime.lastError) {
                openTab();
            } else {
                tabId = tab.id;
                piggybackToTab();
            }
        });
    } else if (request.piggybackGet) {
        // chrome-extension://...
        sendResponse({
            csrf: csrf,
            characters: characters
        });
    } else if (request.csrfGet) {
        // chrome-extension://...
        sendResponse(csrf);
    }
});
