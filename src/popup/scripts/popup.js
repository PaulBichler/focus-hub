import * as redirect from './customRedirect.js';
import * as blockedUrlList from './blockedUrlList.js'
import * as browser from '../../utilities/browser.js';
import { addAlert } from '../../utilities/alertSystem.js';

const focusModeToggle = document.getElementById("focusModeToggle");
const addCurrentTabUrlButton = document.getElementById("addCurrentTabUrlButton");

browser.load(["IsFocusModeOn"], result => focusModeToggle.checked = result.IsFocusModeOn);
redirect.Init();
blockedUrlList.Init();

focusModeToggle.onclick = function() {
    browser.sendRuntimeMessage({
        context: "FocusMode",
        action: "toggleOnOff"
    }, function(isOn) {
        focusModeToggle.checked = isOn;
    });
}

addCurrentTabUrlButton.onclick = function() {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        browser.sendRuntimeMessage({
            context: "FocusMode",
            action: "addBlockedUrl",
            input: tabs[0].url,
            blockCompleteDomain: false,
        }, function(response) {
            if(!response) {
                addAlert({ type: "error",  message: "Unknown Error!" });
            }
            else if(response.error) {
                addAlert({ type: "error",  message: response.error });
            }
            else {
                blockedUrlList.blockUrl(response);
                addAlert({ type: "success",  message: "URL was successfully blocked!" });
            }
        });
    });
}
