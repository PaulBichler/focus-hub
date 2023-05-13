import * as browser from '../../utilities/browser.js';

let params = (new URL(document.location)).searchParams;

if(params.has("url")) {
  document.getElementById("blocked-Url").innerHTML += "<b>URL:</b> " + params.get("url");
}

const focusModeToggle = document.getElementById("focusModeToggle");
browser.load(["IsFocusModeOn"], result => focusModeToggle.checked = result.IsFocusModeOn);

focusModeToggle.onclick = function() {
  browser.sendRuntimeMessage({
      context: "FocusMode",
      action: "toggleOnOff"
  }, function(isOn) {
      if(!isOn && params.has("url")) {
        browser.redirectCurrentTab(params.get("url"));
      }

      focusModeToggle.checked = isOn;
  });
}

document.getElementById("whitelistButton").onclick = function() {
  if(!params.has("url")) {
    return;
  }

  browser.sendRuntimeMessage({
    context: "FocusMode",
    action: "addWhitelistedUrl",
    input: params.get("url"),
    blockCompleteDomain: false
  });
}

browser.addStorageChangeListener((changes, area) => {
  if (area === 'local') {
    if(changes.IsFocusModeOn) {
      if(!changes.IsFocusModeOn.newValue) {
        browser.redirectCurrentTab(params.get("url"));
      }
    }

    if(changes.BlockedUrls || changes.WhitelistedUrls) {
      browser.sendRuntimeMessage({
        context: "FocusMode",
        action: "requestUrlCheck",
        url: params.get("url")
      }, function(response) {
          console.log(response);
          if(!response) {
            browser.redirectCurrentTab(params.get("url"));
          }
      });
    }
  }
});