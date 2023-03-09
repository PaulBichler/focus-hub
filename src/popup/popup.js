var focusModeToggle = document.getElementById("focusModeToggle");
var urlListParentNode = document.getElementById("blockedUrlList");
var addUrlForm = document.getElementById("addUrlForm");
var blockedUrls = [];

focusModeToggle.onclick = function() {
    chrome.runtime.sendMessage({
        action: "toggleOnOff"
    }, function(isOn) {
        focusModeToggle.checked = isOn;
    });
}

chrome.storage.local.get(["IsFocusModeOn"]).then((result) => {
    focusModeToggle.checked = result.IsFocusModeOn;
});

addUrlForm.addEventListener('submit', function(event) {
    event.preventDefault(); //prevents reload

    let url = addUrlForm.inputBox.value;
    if(!url.match(/^(?<protocol>https?:\/\/)?(?=(?<fqdn>[^:/]+))(?:(?<service>www|ww\d|cdn|mail|pop\d+|ns\d+|git)\.)?(?:(?<subdomain>[^:/]+)\.)*(?<domain>[^:/]+\.[a-z0-9]+)(?::(?<port>\d+))?(?<path>\/[^?]*)?(?:\?(?<query>[^#]*))?(?:#(?<hash>.*))?/i)) {
        //url is invalid
        addUrlForm.inputBox.setCustomValidity("URL is not valid!");
        addUrlForm.inputBox.reportValidity();
    }
    else if(blockedUrls.includes(url)) {
        //url is already blocked
        addUrlForm.inputBox.setCustomValidity("This URL is already blocked!");
        addUrlForm.inputBox.reportValidity();
    }
    else {
        addUrlToBlockedList(url);
        addUrlForm.inputBox.value = "";
    }
});

addUrlForm.inputBox.addEventListener('change', function(event) {
    event.target.setCustomValidity("");
});

chrome.storage.local.get(["BlockedUrls"]).then((result) => {
    initBlockedUrls(result.BlockedUrls);
});

function initBlockedUrls(urls) {
    blockedUrls = urls;
    
    for (let i = 0; i < blockedUrls.length; i++) {
        addUrlToHtmlList(blockedUrls[i], i);
    }
}

function addUrlToBlockedList(url) {
    addUrlToHtmlList(url, blockedUrls.push(url) - 1);
    chrome.storage.local.set({ BlockedUrls: blockedUrls });
}

function removeFromBlockedListAt(index) {
    blockedUrls.splice(index, 1);
    chrome.storage.local.set({ BlockedUrls: blockedUrls });
    urlListParentNode.removeChild(document.getElementById("blockedUrl-" + index));
}

function addUrlToHtmlList(url, indexInArr) {
    urlListParentNode.insertAdjacentHTML('beforeend',
        `<li class="py-3 sm:py-4" id="blockedUrl-` + indexInArr +`">
            <div class="flex items-center space-x-4">
                <div class="flex-1 items-center min-w-0">
                    <p class="text-base text-gray-500 dark:text-gray-400">` + url +`</p>
                </div>
                <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                    <button type="button" id="urlRemoveButton-` + indexInArr + `" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" >
                        <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                        <span class="sr-only">Remove URL</span>
                    </button>
                </div>
            </div>
        </li>`);

    document.getElementById("urlRemoveButton-" + indexInArr).onclick = function() { removeFromBlockedListAt(indexInArr); };
}