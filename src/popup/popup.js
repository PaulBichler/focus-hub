var focusModeToggle = document.getElementById("focusModeToggle");

focusModeToggle.onclick = function() {
    chrome.runtime.sendMessage({
        contentScriptQuery: "toggleOnOff"
    }, function(response) {
        console.log("it worked!");
    });
}

chrome.storage.local.get(["IsFocusModeOn"]).then((result) => {
    focusModeToggle.checked = result.IsFocusModeOn;
});

document.getElementById("focusModeSettingsButton").onclick = function() {
    location.href = '../pages/index.html';
};