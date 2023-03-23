import * as browser from '../scripts/browser.js';
import * as helper from '../scripts/helper.js';
import { addAlert } from '../scripts/alertSystem.js';

const focusModeToggle = document.getElementById("focusModeToggle");
const addCurrentTabUrlButton = document.getElementById("addCurrentTabUrlButton");

const customRedirectForm = document.getElementById("customRedirectForm");

const urlListParentNode = document.getElementById("blockedUrlList");
const addUrlForm = document.getElementById("addUrlForm");

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
                addUrlToHtmlList(response);
                addAlert({ type: "success",  message: "URL was successfully blocked!" });
            }
        });
    });
}

browser.load(["IsFocusModeOn"], result => focusModeToggle.checked = result.IsFocusModeOn);

browser.load(["IsCustomRedirectOn"], result => {
    customRedirectForm.toggleCheckbox.checked = result.IsCustomRedirectOn;
    customRedirectForm.inputBox.disabled = !result.IsCustomRedirectOn;
    customRedirectForm.tabUrlPasteButton.disabled = !result.IsCustomRedirectOn;
});

browser.load(["CustomRedirectUrl"], result => customRedirectForm.inputBox.value = result.CustomRedirectUrl);

browser.load(["BlockedUrls"], result => initBlockedUrls(result.BlockedUrls));

function initBlockedUrls(urls) {
    for (let i = 0; i < urls.length; i++) {
        addUrlToHtmlList(urls[i]);
    }
}

customRedirectForm.toggleCheckbox.onclick = function() {
    browser.sendRuntimeMessage({
        context: "FocusMode",
        action: "toggleRedirect"
    }, function(isRedirectOn) {
        customRedirectForm.toggleCheckbox.checked = isRedirectOn;
        customRedirectForm.inputBox.disabled = !isRedirectOn;
        customRedirectForm.tabUrlPasteButton.disabled = !isRedirectOn;
    });
};

customRedirectForm.inputBox.addEventListener('change', function(event) {
    changeRedirectUrl(customRedirectForm.inputBox.value);
});

function changeRedirectUrl(newUrl) {
    browser.sendRuntimeMessage({
        context: "FocusMode",
        action: "redirectUrlChange",
        redirectUrl: newUrl
    }, function(response) {
        if(!response) {
            addAlert({ type: "error",  message: "Unknown Error!" });
        }
        else if(response.error) {
            addAlert({ type: "error",  message: response.error });
        }
        else {
            customRedirectForm.inputBox.value = response.redirectUrl;
            addAlert({ type: "success",  message: "Redirect URL was changed!" });
        }
    });
}

customRedirectForm.tabUrlPasteButton.onclick = () => {
    pasteTabUrlToInput(customRedirectForm.inputBox, () => {
        changeRedirectUrl(customRedirectForm.inputBox.value);
    });
};

addUrlForm.tabUrlPasteButton.onclick = () => pasteTabUrlToInput(addUrlForm.inputBox);

addUrlForm.addEventListener('submit', function(event) {
    event.preventDefault(); //prevents reload

    browser.sendRuntimeMessage({
        context: "FocusMode",
        action: "addBlockedUrl",
        input: addUrlForm.inputBox.value,
        blockCompleteDomain: addUrlForm.blockCompleteDomainCheckbox.checked,
    }, function(response) {
        if(!response) {
            addAlert({ type: "error",  message: "Unknown Error!" });
        }
        else if(response.error) {
            addAlert({ type: "error",  message: response.error });
        }
        else {
            addUrlToHtmlList(response);
        }
    });
});

function removeFromBlockedListAt(hash) {
    browser.sendRuntimeMessage({
        context: "FocusMode",
        action: "removeBlockedUrl",
        urlHash: hash,
    }, function(response) {
        if(response) {
            urlListParentNode.removeChild(document.getElementById("blockedUrl-" + response.urlHash));
        }
    });
}

function addUrlToHtmlList(urlObj) {
    let hash = helper.urlObjToHash(urlObj);
    let entryElement = `<li class="py-3 sm:py-4" id="blockedUrl-` + hash +`">
        <div class="flex items-center space-x-4">
            <div class="flex-1 items-center min-w-0">
                <p class="text-base text-gray-500 dark:text-gray-400 break-words">` + getDisplayUrl(urlObj) +`</p>
            </div>
            <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                <button type="button" name="urlRemoveButton" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" >
                    <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M17.114,3.923h-4.589V2.427c0-0.252-0.207-0.459-0.46-0.459H7.935c-0.252,0-0.459,0.207-0.459,0.459v1.496h-4.59c-0.252,0-0.459,0.205-0.459,0.459c0,0.252,0.207,0.459,0.459,0.459h1.51v12.732c0,0.252,0.207,0.459,0.459,0.459h10.29c0.254,0,0.459-0.207,0.459-0.459V4.841h1.511c0.252,0,0.459-0.207,0.459-0.459C17.573,4.127,17.366,3.923,17.114,3.923M8.394,2.886h3.214v0.918H8.394V2.886z M14.686,17.114H5.314V4.841h9.372V17.114z M12.525,7.306v7.344c0,0.252-0.207,0.459-0.46,0.459s-0.458-0.207-0.458-0.459V7.306c0-0.254,0.205-0.459,0.458-0.459S12.525,7.051,12.525,7.306M8.394,7.306v7.344c0,0.252-0.207,0.459-0.459,0.459s-0.459-0.207-0.459-0.459V7.306c0-0.254,0.207-0.459,0.459-0.459S8.394,7.051,8.394,7.306" clip-rule="evenodd"></path></svg>
                    <span class="sr-only">Remove URL</span>
                </button>
            </div>
        </div>
    </li>`

    urlListParentNode.insertAdjacentHTML('beforeend', entryElement);
    urlListParentNode.lastChild.querySelector('[name="urlRemoveButton"]').onclick = function() { removeFromBlockedListAt(hash); };
}

function pasteTabUrlToInput(input, callback) {
    browser.getActiveTab(tabs => {
        input.value = tabs[0].url;

        if(callback)
            callback();
    });
}

function getDisplayUrl(parsedUrlObj) {
    return parsedUrlObj.protocol + (parsedUrlObj.blockCompleteDomain ? parsedUrlObj.fqdn + "/*" : parsedUrlObj.fqdn);
}