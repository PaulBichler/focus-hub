
export function save(obj, callback) {
    chrome.storage.local.set(obj).then(() => callback?.());
}

export function load(key, callback) {
    chrome.storage.local.get(key).then((result) => callback?.(result));
}

export function addOnInstalledListener(listener) {
    chrome.runtime.onInstalled.addListener(listener);
}

export function addRuntimeMessageListener(listener) {
    chrome.runtime.onMessage.addListener(listener);
}

export function sendRuntimeMessage(messageObj, responseCallback) {
    chrome.runtime.sendMessage(messageObj, responseCallback);
}

export function addTabUpdateListener(listener) {
    chrome.tabs.onUpdated.addListener(listener);
}

export function getAllTabs(callback) {
    chrome.tabs.query({}, tabs => callback?.(tabs));
}

export function getActiveTab(callback) {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => callback?.(tabs));
}

export function redirectTab(tabId, redirectURL) {
    chrome.tabs.update(tabId, { url: redirectURL });
}

export function redirectCurrentTab(redirectURL) {
    chrome.tabs.update({ url: redirectURL });
}

export function setBadgeText(text) {
    chrome.action.setBadgeText({ text: text });
}