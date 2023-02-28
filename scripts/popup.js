console.log("This is a popup!")

document.getElementById("toggleButton").onclick = function() {
    chrome.runtime.sendMessage({
        contentScriptQuery: "toggleOnOff"
    }, function(response) {
        console.log("it worked!");
    });
}