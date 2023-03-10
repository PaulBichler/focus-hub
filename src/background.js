let isFocusModeOn = false;
let blockedUrls = [];

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "OFF",
    });

    chrome.storage.local.set({ IsFocusModeOn: false });
    chrome.storage.local.set({ BlockedUrls: [] });
    isFocusModeOn = false;
    blockedUrls = [];
});

chrome.storage.local.get(["IsFocusModeOn"]).then((result) => {
    setActiveFocusMode(result.IsFocusModeOn);
});

chrome.storage.local.get(["BlockedUrls"]).then((result) => {
    blockedUrls = result.BlockedUrls;
    console.log(result.BlockedUrls);
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.action){
        case "toggleOnOff":
            sendResponse(toggle());
            break;
    }
});

function toggle() {
    return setActiveFocusMode(!isFocusModeOn);
}

function setActiveFocusMode(active) {
    isFocusModeOn = active;
    chrome.action.setBadgeText({ text: isFocusModeOn ? "ON" : "OFF" });

    if(isFocusModeOn) {
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(tab => {
                if(checkUrl(tab.url)) {
                    redirectTab(tab);
                }
            });
        });
    }

    chrome.storage.local.set({ IsFocusModeOn: isFocusModeOn });
    return isFocusModeOn;
}

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if(isFocusModeOn && changeInfo.status === 'complete') {
        if(checkUrl(tab.url)) {
            redirectTab(tab);
        }
    }
});

function checkUrl(url) {
    if(url === undefined) { return false; } 
    
    let foundMatch = false;
    blockedUrls.forEach((blockedUrl) => {
        let stringToCheck = blockedUrl.blockCompleteDomain ? blockedUrl.fqdn : blockedUrl.input;
        console.log(stringToCheck);
        if(url.includes(stringToCheck)) {
            foundMatch = true;
        }
    });
    
    return foundMatch;
}

function redirectTab(tab) {
    console.log('blocking ' + tab.url);
    chrome.tabs.update(tab.id, { url: 'src/pages/index.html' });
}