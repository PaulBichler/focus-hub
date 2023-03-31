import * as browser from '../../utilities/browser.js';
import { addAlert } from '../../utilities/alertSystem.js';

export function Init() {
    browser.load(["IsCustomRedirectOn"], result => {
        customRedirectForm.toggleCheckbox.checked = result.IsCustomRedirectOn;
        customRedirectForm.inputBox.disabled = !result.IsCustomRedirectOn;
        customRedirectForm.tabUrlPasteButton.disabled = !result.IsCustomRedirectOn;
    });
    
    browser.load(["CustomRedirectUrl"], result => customRedirectForm.inputBox.value = result.CustomRedirectUrl);
} 

const customRedirectForm = document.getElementById("customRedirectForm");

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

customRedirectForm.tabUrlPasteButton.onclick = () => {
    browser.getActiveTab(tabs => {
        changeRedirectUrl(tabs[0].url);
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
            customRedirectForm.inputBox.value = "";
        }
        else {
            customRedirectForm.inputBox.value = response.redirectUrl;
            addAlert({ type: "success",  message: "Redirect URL was changed!" });
        }
    });
}