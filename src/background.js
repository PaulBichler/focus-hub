chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "OFF",
    });

    chrome.storage.local.set({ IsFocusModeOn: false });
});

let isOn = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.contentScriptQuery){
        case "toggleOnOff":
            sendResponse(toggle());
            break;
    }
});

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if(isOn && changeInfo.status === 'complete') {
        if(checkUrl(tab.url)) {
            redirectTab(tab);
        }
    }
});

function toggle() {
    isOn = !isOn;
    chrome.action.setBadgeText({ text: isOn ? "ON" : "OFF" });

    if(isOn) {
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(tab => {
                if(checkUrl(tab.url)) {
                    redirectTab(tab);
                }
            });
        });
    }

    chrome.storage.local.set({ IsFocusModeOn: isOn });
    return isOn;
}

function checkUrl(url) {
    if(url === undefined) { return false; } 
    
    if(url.includes("facebook.com")) {
        return true;
    }
    
    return false;
}

function redirectTab(tab) {
    console.log('blocking ' + tab.url);
    chrome.tabs.update(tab.id, { url: 'pages/index.html' });
}