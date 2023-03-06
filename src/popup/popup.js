var focusModeToggle = document.getElementById("focusModeToggle");

focusModeToggle.onclick = function() {
    chrome.runtime.sendMessage({
        action: "toggleOnOff"
    }, function(isOn) {
        console.log(isOn);
        focusModeToggle.checked = isOn;
    });
}

chrome.storage.local.get(["IsFocusModeOn"]).then((result) => {
    focusModeToggle.checked = result.IsFocusModeOn;
});

document.getElementById("focusModeSettingsButton").onclick = function() {
    location.href = '../pages/index.html';
};