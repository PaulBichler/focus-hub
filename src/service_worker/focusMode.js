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
    browser.save({ WhitelistedUrls: [] });
    isFocusModeOn = false;
    isCustomRedirectOn = false;
    customRedirectUrl = "";
    blockedUrls = [];
    whitelistedUrls = [];
}

export function Init() {
    console.log("Init Focus Mode");
    browser.load(["IsFocusModeOn"], result => setActiveFocusMode(result.IsFocusModeOn));
    browser.load(["BlockedUrls"], result => blockedUrls = result.BlockedUrls);
    browser.load(["WhitelistedUrls"], result => whitelistedUrls = result.WhitelistedUrls);
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
        case "addWhitelistedUrl":
            return handleWhitelistUrlRequest(request);
        case "removeBlockedUrl":
            return handleRemoveUrlRequest(request, false);
        case "removeWhitelistedUrl":
            return handleRemoveUrlRequest(request, true)
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
            if(!isUrlWhitelisted(tab.url) && isUrlBlocked(tab.url)) {
                redirectTab(tab, tab.url);
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

function isUrlWhitelisted(url) {
    if(url === undefined) { return false; } 

    url = url.replace('www.', '');
    let matchFound = false;

    whitelistedUrls.forEach((whitelistedUrl) => {
        if(url == whitelistedUrl.fqdn) {
            matchFound = true;
            return;
        }
    });
    
    return matchFound;
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

function redirectTab(tab, blockedUrl) {
    let redirectUrl = isCustomRedirectOn ? customRedirectUrl : defaultRedirectUrl;
    redirectUrl += "?url=" + blockedUrl;
    console.log("Custom Redirect on: " + isCustomRedirectOn + ", redirecting to: " + redirectUrl);
    browser.redirectTab(tab.id, redirectUrl);
}

function handleTabUpdate(tabId, changeInfo, tab) {
    if(isFocusModeOn && changeInfo.status === 'complete') {
        if(isUrlBlocked(tab.url)) {
            redirectTab(tab, tab.url);
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
    let parsedUrl = parseUrl(request.input, request.blockCompleteDomain, false);

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

function handleWhitelistUrlRequest(request) {
    let parsedUrl = parseUrl(request.input, false, true);

    if(!parsedUrl) {
        return { error: "URL is not valid!" };
    }
    else if(whitelistedUrls.some(el => helper.urlObjEquals(el, parsedUrl))) {
        return { error: "This URL is already whitelisted!" };
    }

    addUrlToWhitelist(parsedUrl);
    return parsedUrl;
}

function handleRemoveUrlRequest(request, isWhitelist) {
    if(isWhitelist) {
        whitelistedUrls.splice(whitelistedUrls.findIndex((el) => helper.urlObjToHash(el) === request.urlHash), 1);
        browser.save({ WhitelistedUrls: whitelistedUrls });
        checkAllActiveTabs();
        console.log("Removed URL from the whitelist!");
        console.log(whitelistedUrls);
    }
    else {
        blockedUrls.splice(blockedUrls.findIndex((el) => helper.urlObjToHash(el) === request.urlHash), 1);
        browser.save({ BlockedUrls: blockedUrls });
        console.log("Removed URL from the blocked list!");
        console.log(blockedUrls);
    }

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

function addUrlToWhitelist(urlObj) {
    whitelistedUrls.push(urlObj);
    browser.save({ WhitelistedUrls: whitelistedUrls });

    console.log("Added new URL to the whitelist!");
    console.log(whitelistedUrls);
}

function parseUrl(urlString, blockCompleteDomain, isWhitelist) {
    urlString = urlString.replace('www.', '');
    let urlObj = helper.parseUrl(urlString);

    if(!urlObj) { return null; }

    if(!isWhitelist) {
        urlString = helper.removeProtocol(urlString);
        urlString = helper.removeQueryAndHash(urlString);
        urlString = helper.removeTrailingSlash(urlString);
    }

    let fqdn = blockCompleteDomain ? urlObj[2] : urlString;

    return {
        protocol: urlObj[1] ? urlObj[1] : '*://',
        fqdn: fqdn,
        blockCompleteDomain: blockCompleteDomain
    };
}