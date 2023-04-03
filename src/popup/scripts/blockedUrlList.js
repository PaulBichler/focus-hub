import * as helper from '../../utilities/urlHelper.js';
import * as browser from '../../utilities/browser.js';
import { addAlert } from '../../utilities/alertSystem.js';

export function Init() {
    browser.load(["BlockedUrls"], result => initUrls(result.BlockedUrls, false));
    browser.load(["WhitelistedUrls"], result => initUrls(result.WhitelistedUrls, true));
} 

export function blockUrl(urlObj) {
    addUrlToHtmlList(urlObj, urlListParentNode);
}

export function whitelistUrl(urlObj) {
    addUrlToHtmlList(urlObj, wlUrlListParentNode);
}

const urlListParentNode = document.getElementById("blockedUrlList");
const addUrlForm = document.getElementById("addUrlForm");

const wlUrlListParentNode = document.getElementById("whitelistedUrlList");
const addWlUrlForm = document.getElementById("addWlUrlForm");

addUrlForm.tabUrlPasteButton.onclick = () => pasteTabUrlToInput(addUrlForm.inputBox);
addWlUrlForm.tabUrlPasteButton.onclick = () => pasteTabUrlToInput(addWlUrlForm.inputBox);

addUrlForm.addEventListener('submit', (event) => onAddUrlFormSubmit(event, false));
addWlUrlForm.addEventListener('submit', (event) => onAddUrlFormSubmit(event, true));

function onAddUrlFormSubmit(event, isWhitelist) {
    event.preventDefault(); //prevents reload

    let urlForm = isWhitelist ? addWlUrlForm : addUrlForm;

    if(isWhitelist)
        console.log("whitelist submit");
    else
        console.log("block submit");

    browser.sendRuntimeMessage({
        context: "FocusMode",
        action: isWhitelist ? "addWhitelistedUrl" : "addBlockedUrl",
        input: urlForm.inputBox.value,
        blockCompleteDomain: isWhitelist ? false : urlForm.blockCompleteDomainCheckbox.checked,
    }, function(response) {
        if(!response) {
            addAlert({ type: "error",  message: "Unknown Error!" });
        }
        else if(response.error) {
            addAlert({ type: "error",  message: response.error });
        }
        else {
            addUrlToHtmlList(response, isWhitelist);
            addAlert({ type: "success",  message: "URL " + (isWhitelist ? "whitelisted" : "blocked") + " successfully!" });
        }
    });
}

function initUrls(urls, isWhitelist) {
    for (let i = 0; i < urls.length; i++) {
        addUrlToHtmlList(urls[i], isWhitelist);
    }
}

function removeUrlFromList(hash, isWhitelist = false) {
    browser.sendRuntimeMessage({
        context: "FocusMode",
        action: isWhitelist ? "removeWhitelistedUrl" : "removeBlockedUrl",
        urlHash: hash,
    }, function(response) {
        if(response) {
            if(isWhitelist) {
                wlUrlListParentNode.removeChild(document.getElementById("whitelistedUrl-" + response.urlHash));
            }
            else{
                urlListParentNode.removeChild(document.getElementById("blockedUrl-" + response.urlHash));
            }
        }
    });
}

function addUrlToHtmlList(urlObj, isWhitelist = false) {
    let hash = helper.urlObjToHash(urlObj);
    let id, node, displayUrl;

    if(isWhitelist) {
        id = "whitelistedUrl-";
        node = wlUrlListParentNode;
        displayUrl = urlObj.fqdn;
    }
    else {
        id = "blockedUrl-";
        node = urlListParentNode;
        displayUrl = getDisplayUrl(urlObj);
    }

    id += hash;
    let entryElement = `<li class="py-3 sm:py-4" id="` + id +`">
        <div class="flex items-center space-x-4">
            <div class="flex-1 items-center min-w-0">
                <p class="text-base text-gray-500 dark:text-gray-400 break-words">` + displayUrl +`</p>
            </div>
            <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                <button type="button" name="urlRemoveButton" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" >
                    <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M17.114,3.923h-4.589V2.427c0-0.252-0.207-0.459-0.46-0.459H7.935c-0.252,0-0.459,0.207-0.459,0.459v1.496h-4.59c-0.252,0-0.459,0.205-0.459,0.459c0,0.252,0.207,0.459,0.459,0.459h1.51v12.732c0,0.252,0.207,0.459,0.459,0.459h10.29c0.254,0,0.459-0.207,0.459-0.459V4.841h1.511c0.252,0,0.459-0.207,0.459-0.459C17.573,4.127,17.366,3.923,17.114,3.923M8.394,2.886h3.214v0.918H8.394V2.886z M14.686,17.114H5.314V4.841h9.372V17.114z M12.525,7.306v7.344c0,0.252-0.207,0.459-0.46,0.459s-0.458-0.207-0.458-0.459V7.306c0-0.254,0.205-0.459,0.458-0.459S12.525,7.051,12.525,7.306M8.394,7.306v7.344c0,0.252-0.207,0.459-0.459,0.459s-0.459-0.207-0.459-0.459V7.306c0-0.254,0.207-0.459,0.459-0.459S8.394,7.051,8.394,7.306" clip-rule="evenodd"></path></svg>
                    <span class="sr-only">Remove URL</span>
                </button>
            </div>
        </div>
    </li>`

    node.insertAdjacentHTML('beforeend', entryElement);
    node.lastChild.querySelector('[name="urlRemoveButton"]').onclick = function() { removeUrlFromList(hash, isWhitelist); };
}

function pasteTabUrlToInput(input) {
    browser.getActiveTab(tabs => {
        input.value = tabs[0].url;
    });
}

function getDisplayUrl(parsedUrlObj) {
    return parsedUrlObj.protocol + (parsedUrlObj.blockCompleteDomain ? parsedUrlObj.fqdn + "/*" : parsedUrlObj.fqdn);
}