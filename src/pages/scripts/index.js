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
      focusModeToggle.checked = isOn;
  });
}