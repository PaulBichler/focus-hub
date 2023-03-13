import * as helper from '../scripts/helper.js';
import { addAlert } from '../scripts/alertSystem.js';

const focusModeToggle = document.getElementById("focusModeToggle");
const urlListParentNode = document.getElementById("blockedUrlList");
const addUrlForm = document.getElementById("addUrlForm");
const addCurrentTabUrlButton = document.getElementById("addCurrentTabUrlButton");

focusModeToggle.onclick = function() {
    chrome.runtime.sendMessage({
        action: "toggleOnOff"
    }, function(isOn) {
        focusModeToggle.checked = isOn;
    });
}

addCurrentTabUrlButton.onclick = function() {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        chrome.runtime.sendMessage({
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
                addAlert({ type: "success",  message: "Success!" });
            }
        });
    });
}

chrome.storage.local.get(["IsFocusModeOn"]).then((result) => {
    focusModeToggle.checked = result.IsFocusModeOn;
});

chrome.storage.local.get(["BlockedUrls"]).then((result) => {
    initBlockedUrls(result.BlockedUrls);
});

function initBlockedUrls(urls) {
    for (let i = 0; i < urls.length; i++) {
        addUrlToHtmlList(urls[i]);
    }
}

addUrlForm.addEventListener('submit', function(event) {
    event.preventDefault(); //prevents reload

    chrome.runtime.sendMessage({
        action: "addBlockedUrl",
        input: addUrlForm.inputBox.value,
        blockCompleteDomain: addUrlForm.blockCompleteDomainCheckbox.checked,
    }, function(response) {
        if(!response) {
            addUrlForm.inputBox.setCustomValidity("Unknown Error!");
            addUrlForm.inputBox.reportValidity();
        }
        else if(response.error) {
            addUrlForm.inputBox.setCustomValidity(response.error);
            addUrlForm.inputBox.reportValidity();
        }
        else {
            addUrlToHtmlList(response);
        }
    });
});

addUrlForm.inputBox.addEventListener('input', function(event) {
    event.target.setCustomValidity('');
});

addUrlForm.inputBox.addEventListener('change', function(event) {
    event.target.setCustomValidity('');
});

addUrlForm.blockCompleteDomainCheckbox.addEventListener('change', function(event) {
    addUrlForm.inputBox.setCustomValidity('');
});

addUrlForm.tabUrlPasteButton.onclick = function() {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        addUrlForm.inputBox.value = tabs[0].url;
        addUrlForm.inputBox.setCustomValidity('');
    });
};

function removeFromBlockedListAt(hash) {
    chrome.runtime.sendMessage({
        action: "removeBlockedUrl",
        urlHash: hash,
    }, function(response) {
        if(response) {
            urlListParentNode.removeChild(document.getElementById("blockedUrl-" + response.urlHash));
            addUrlForm.inputBox.setCustomValidity('');
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

function getDisplayUrl(parsedUrlObj) {
    return parsedUrlObj.blockCompleteDomain ? parsedUrlObj.fqdn + "/*" : parsedUrlObj.fqdn;
}