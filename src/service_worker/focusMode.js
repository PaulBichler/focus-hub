import * as browser from '../utilities/browser.js';
import * as helper from '../utilities/urlHelper.js';

const defaultRedirectUrl = './src/pages/index.html';

let isFocusModeOn = false;
let isCustomRedirectOn = false;
let customRedirectUrl = "";
let blockedUrls = [];
let whitelistedUrls = [];

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
            if(isUrlBlocked(tab.url)) {
                redirectTab(tab);
            }
        });
    });
}

function isUrlBlocked(url) {
    if(url === undefined) { return false; } 

    url = url.replace('www.', '');
    url = helper.removeQueryAndHash(url);
    url = helper.removeTrailingSlash(url);
    let foundMatch = false;

    console.log("checking url: " + url + " against: ");
    console.log(blockedUrls);

    blockedUrls.forEach((blockedUrl) => {
        if(compareWithBlockedUrl(url, blockedUrl)) {
            foundMatch = true;
        }
    });
    
    console.log("match found: " + foundMatch);
    return foundMatch;
}

function compareWithBlockedUrl(urlToCompare, blockedUrl) {
    if(blockedUrl.blockCompleteDomain) {
        if(urlToCompare.includes(blockedUrl.fqdn)) {
            return true;
        }
    } else if(blockedUrl.protocol == '*://') {
        if(helper.removeProtocol(urlToCompare) == blockedUrl.fqdn) {
            return true;
        }
    } else if(urlToCompare == blockedUrl.protocol + blockedUrl.fqdn) {
        return true;
    }
}

function redirectTab(tab) {
    let redirectUrl = isCustomRedirectOn ? customRedirectUrl : defaultRedirectUrl;
    console.log("Custom Redirect on: " + isCustomRedirectOn + ", redirecting to: " + redirectUrl);
    browser.redirectTab(tab.id, redirectUrl);
}

function handleTabUpdate(tabId, changeInfo, tab) {
    if(isFocusModeOn && changeInfo.status === 'complete') {
        if(isUrlBlocked(tab.url)) {
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
    let parsedUrl = helper.parseUrl(request.redirectUrl);

    if(!parsedUrl) {
        return { error: "URL is not valid!" };
    }

    if(!parsedUrl[1] === undefined) {
        request.redirectUrl = 'https://' + request.redirectUrl;
    }

    if(isUrlBlocked(request.redirectUrl)) {
        return { error: "Cannot redirect to a blocked URL!" };
    }

    customRedirectUrl = request.redirectUrl;
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
    else if(compareWithBlockedUrl(customRedirectUrl, parsedUrl)) {
        return { error: "Cannot block the redirect URL! Please change your redirect URL and try again!" };
    }

    addUrlToBlockedList(parsedUrl);
    return parsedUrl;
}

function handleRemoveUrlRequest(request) {
    blockedUrls.splice(blockedUrls.findIndex((el) => helper.urlObjToHash(el) === request.urlHash), 1);
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
    let urlObj = helper.parseUrl(urlString);

    if(!urlObj) { return null; }

    urlString = helper.removeProtocol(urlString);
    urlString = urlString.replace('www.', '');
    urlString = helper.removeQueryAndHash(urlString);
    urlString = helper.removeTrailingSlash(urlString);

    let fqdn = blockCompleteDomain ? urlObj[2] : urlString;

    return {
        protocol: urlObj[1] ? urlObj[1] : '*://',
        fqdn: fqdn,
        blockCompleteDomain: blockCompleteDomain
    };
}