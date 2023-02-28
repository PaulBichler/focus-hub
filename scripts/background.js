chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "OFF",
    });
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
            console.log('blocking ' + tab.url);
            chrome.tabs.update(tabId, { url: 'pages/index.html' });
        }
    }
});

function toggle() {
    isOn = !isOn;
    chrome.action.setBadgeText({ text: isOn ? "ON" : "OFF" });
    return isOn;
}

function checkUrl(url) {
    if(url === undefined) { return false; } 
    
    if(url.includes("facebook.com")) {
        return true;
    }
    
    return false;
}