import * as helper from './scripts/helper.js';

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
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.action){
        case "toggleOnOff":
            sendResponse(toggle());
            break;
        case "addBlockedUrl":
            sendResponse(handleAddUrlRequest(request));
            break;
        case "removeBlockedUrl":
            sendResponse(handleRemoveUrlRequest(request));
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
        checkAllActiveTabs();
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

function checkAllActiveTabs() {
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
            if(checkUrl(tab.url)) {
                redirectTab(tab);
            }
        });
    });
}

function checkUrl(url) {
    if(url === undefined) { return false; } 
    
    let foundMatch = false;
    blockedUrls.forEach((blockedUrl) => {
        if(url.includes(blockedUrl.fqdn)) {
            foundMatch = true;
        }
    });
    
    return foundMatch;
}

function redirectTab(tab) {
    console.log('blocking ' + tab.url);
    chrome.tabs.update(tab.id, { url: 'src/pages/index.html' });
}

function handleAddUrlRequest(request) {
    let parsedUrl = parseUrl(request.input, request.blockCompleteDomain);

    if(!parsedUrl) {
        return { error: "URL is not valid!" };
    }
    else if(blockedUrls.some(el => helper.urlObjEquals(el, parsedUrl))) {
        return { error: "This URL is already blocked!" };
    }

    addUrlToBlockedList(parsedUrl);
    return parsedUrl;
}

function handleRemoveUrlRequest(request) {
    blockedUrls.splice(blockedUrls.findIndex((el) => helper.urlObjEquals(el, request.urlHash)), 1);
    chrome.storage.local.set({ BlockedUrls: blockedUrls });

    console.log("Removed URL from the blocked list!");
    console.log(blockedUrls);

    return { urlHash: request.urlHash };
}

function addUrlToBlockedList(urlObj) {
    blockedUrls.push(urlObj);
    chrome.storage.local.set({ BlockedUrls: blockedUrls });

    if(isFocusModeOn) {
        checkAllActiveTabs();
    }

    console.log("Added new URL to the blocked list!");
    console.log(blockedUrls);
}

function parseUrl(urlString, blockCompleteDomain) {
    let urlObj = urlString.match(/^(?<protocol>https?:\/\/)?(?=(?<fqdn>[^:/]+))(?:(?<service>www|ww\d|cdn|mail|pop\d+|ns\d+|git)\.)?(?:(?<subdomain>[^:/]+)\.)*(?<domain>[^:/]+\.[a-z0-9]+)(?::(?<port>\d+))?(?<path>\/[^?]*)?(?:\?(?<query>[^#]*))?(?:#(?<hash>.*))?/i);

    if(!urlObj) { return null; } 

    return {
        fqdn: blockCompleteDomain ? urlObj[2] : urlString,
        blockCompleteDomain: blockCompleteDomain
    };
}