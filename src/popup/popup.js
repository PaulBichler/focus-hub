var focusModeToggle = document.getElementById("focusModeToggle");

focusModeToggle.onclick = function() {
    chrome.runtime.sendMessage({
        contentScriptQuery: "toggleOnOff"
    }, function(response) {
        console.log("it worked!");
    });
}

focusModeToggle.checked = false;