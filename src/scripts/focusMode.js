import * as browser from './browser.js';
import * as helper from './helper.js';

let isFocusModeOn = false;
let isCustomRedirectOn = false;
let customRedirectUrl = "";
let blockedUrls = [];

export function OnInstall() {
    console.log("Install Focus Mode");
    browser.setBadgeText("OFF");
    browser.save({ IsFocusModeOn: false });
    browser.save({ IsCustomRedirectOn: false });
    browser.save({ CustomRedirectUrl: "" });
    browser.save({ BlockedUrls: [] });
    isFocusModeOn = false;
    isCustomRedirectOn = false;
    customRedirectUrl = "";
    blockedUrls = [];
}

export function Init() {
    console.log("Init Focus Mode");
    browser.load(["IsFocusModeOn"], result => setActiveFocusMode(result.IsFocusModeOn));
    browser.load(["BlockedUrls"], result => blockedUrls = result.BlockedUrls);
    browser.addTabUpdateListener(handleTabUpdate);
}

export function handleMessage(request) {
    switch(request.action) {
        case "toggleOnOff":
            return setActiveFocusMode(!isFocusModeOn);
        case "toggleRedirect":
            return handleToggleRedirectRequest();
        case "redirectUrlChange":
            return handleRedirectUrlChangeRequest(request);
        case "addBlockedUrl":
            return handleAddUrlRequest(request);
        case "removeBlockedUrl":
            return handleRemoveUrlRequest(request);
    }
}

function setActiveFocusMode(active) {
    isFocusModeOn = active;
    browser.setBadgeText(isFocusModeOn ? "ON" : "OFF");

    if(isFocusModeOn) {
        checkAllActiveTabs();
    }

    browser.save({ IsFocusModeOn: isFocusModeOn });
    return isFocusModeOn;
}

function checkAllActiveTabs() {
    browser.getAllTabs(function(tabs) {
        tabs.forEach(tab => {
            if(checkUrl(tab.url)) {
                redirectTab(tab);
            }
        });
    });
}

function checkUrl(url) {
    if(url === undefined) { return false; } 
    
    url = helper.removeTrailingSlash(url);
    url = helper.removeQueryAndHash(url);
    let foundMatch = false;

    blockedUrls.forEach((blockedUrl) => {
        if(blockedUrl.blockCompleteDomain) {
            if(url.includes(blockedUrl.fqdn)) {
                foundMatch = true;
            }
        } else if(blockedUrl.protocol == '*://') {
            if(helper.removeProtocol(url) == blockedUrl.fqdn) {
                foundMatch = true;
            }
        } else if(url == blockedUrl.protocol + blockedUrl.fqdn) {
            foundMatch = true;
        }
    });
    
    console.log("found match: " + foundMatch);
    return foundMatch;
}

function redirectTab(tab) {
    browser.redirectTab(tab.id, isCustomRedirectOn ? customRedirectUrl : '../pages/index.html');
}

function handleTabUpdate(tabId, changeInfo, tab) {
    if(isFocusModeOn && changeInfo.status === 'complete') {
        if(checkUrl(tab.url)) {
            redirectTab(tab);
        }
    }
}

function handleToggleRedirectRequest() {
    isCustomRedirectOn = !isCustomRedirectOn;
    browser.save({ IsCustomRedirectOn: isCustomRedirectOn });
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

    browser.save({ CustomRedirectUrl: customRedirectUrl });
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
    browser.save({ BlockedUrls: blockedUrls });

    console.log("Removed URL from the blocked list!");
    console.log(blockedUrls);

    return { urlHash: request.urlHash };
}

function addUrlToBlockedList(urlObj) {
    blockedUrls.push(urlObj);
    browser.save({ BlockedUrls: blockedUrls });

    if(isFocusModeOn) {
        checkAllActiveTabs();
    }

    console.log("Added new URL to the blocked list!");
    console.log(blockedUrls);
}

function parseUrl(urlString, blockCompleteDomain) {
    let urlObj = urlString.match(/^(?<protocol>https?:\/\/)?(?=(?<fqdn>[^:/]+))(?:(?<service>www|ww\d|cdn|mail|pop\d+|ns\d+|git)\.)?(?:(?<subdomain>[^:/]+)\.)*(?<domain>[^:/]+\.[a-z0-9]+)(?::(?<port>\d+))?(?<path>\/[^?]*)?(?:\?(?<query>[^#]*))?(?:#(?<hash>.*))?/i);

    if(!urlObj) { return null; }

    urlString = helper.removeProtocol(urlString);
    urlString = helper.removeQueryAndHash(urlString);
    urlString = helper.removeTrailingSlash(urlString);

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