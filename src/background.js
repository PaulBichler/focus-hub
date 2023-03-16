import * as helper from './scripts/helper.js';

let isFocusModeOn = false;
let isCustomRedirectOn = false;
let customRedirectUrl = "";
let blockedUrls = [];

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "OFF",
    });

    chrome.storage.local.set({ IsFocusModeOn: false });
    chrome.storage.local.set({ IsCustomRedirectOn: false });
    chrome.storage.local.set({ CustomRedirectUrl: "" });
    chrome.storage.local.set({ BlockedUrls: [] });
    isFocusModeOn = false;
    isCustomRedirectOn = false;
    customRedirectUrl = "";
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
        case "toggleRedirect":
            sendResponse(handleToggleRedirectRequest());
            break;
        case "redirectUrlChange":
            sendResponse(handleRedirectUrlChangeRequest(request));
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
    
    url = removeTrailingSlash(url);
    url = removeQueryAndHash(url); 
    let foundMatch = false;

    blockedUrls.forEach((blockedUrl) => {
        if(blockedUrl.blockCompleteDomain) {
            if(url.includes(blockedUrl.fqdn)) {
                foundMatch = true;
            }
        } else if(blockedUrl.protocol == '*://') {
            if(removeProtocol(url) == blockedUrl.fqdn) {
                foundMatch = true;
            }
        } else if(url == blockedUrl.protocol + blockedUrl.fqdn) {
            foundMatch = true;
        }
    });
    
    return foundMatch;
}

function redirectTab(tab) {
    chrome.tabs.update(tab.id, { url: isCustomRedirectOn ? customRedirectUrl : 'src/pages/index.html' });
}

function handleToggleRedirectRequest() {
    isCustomRedirectOn = !isCustomRedirectOn;
    chrome.storage.local.set({ IsCustomRedirectOn: isCustomRedirectOn });
    return isCustomRedirectOn;
}

function handleRedirectUrlChangeRequest(request) {
    let parsedUrl = parseUrl(request.redirectUrl, false);

    if(!parsedUrl) {
        return { error: "URL is not valid!" };
    }

    customRedirectUrl = parsedUrl.fqdn;

    if(parsedUrl.protocol === '*://') {
      customRedirectUrl = 'https://' + customRedirectUrl;
    }

    chrome.storage.local.set({ CustomRedirectUrl: customRedirectUrl });
    return { redirectUrl: customRedirectUrl };
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

    urlString = removeProtocol(urlString);
    urlString = removeQueryAndHash(urlString);
    urlString = removeTrailingSlash(urlString);

    let fqdn = blockCompleteDomain ? urlObj[2] : urlString;
    
    if(!urlObj[3]) { //no service specified? --> assume www.
        fqdn = "www." + fqdn;
    }

    return {
        protocol: urlObj[1] ? urlObj[1] : '*://',
        fqdn: fqdn,
        blockCompleteDomain: blockCompleteDomain
    };
}

function removeTrailingSlash(str) {
    return str.replace(/\/+$/, '');
}

function removeProtocol(url) {
    return url.replace(/(^\w+:|^)\/\//, '');
}

function removeQueryAndHash(url) {
    return url.split("?")[0].split("#")[0];
  }