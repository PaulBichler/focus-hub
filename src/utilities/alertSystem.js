import * as helper from './urlHelper.js';

const maxAlerts = 2;
const alertContainer = document.getElementById("alertContainer");

const alertHtmlElements = new Map();
alertHtmlElements.set('error', { color: 'red', alertTime: 2000 });
alertHtmlElements.set('success', { color: 'green', alertTime: 2000 });
alertHtmlElements.set('info', { color: 'blue', alertTime: 5000 });

const activeAlertHashs = new Map();

let alertCount = 0;

export function addAlert(alert) {
    let alertMessageHash = helper.stringToHash(alert.message);
    let alertSettings = alertHtmlElements.get(alert.type);

    if(activeAlertHashs.has(alertMessageHash)) {
        //alert already exists --> reset the timeout (if there is one)
        let alert = activeAlertHashs.get(alertMessageHash);
        clearTimeout(alert.timeout);
        if(alertSettings.alertTime > 0) {
            alert.timeout = setTimeout(alert.handler, alertSettings.alertTime);
        }
        return;
    }

    if(alertCount == maxAlerts) {
        alertContainer.lastChild.querySelector('[name="dismissButton"]').onclick();
    }

    alertContainer.insertAdjacentHTML('afterbegin', 
    `<div name="` + alertMessageHash + `" class="flex p-4 mt-1 border-t-4 bg-` + alertSettings.color + `-50 text-` + alertSettings.color + `-400 dark:bg-gray-800 border-` + alertSettings.color + `-800" role="alert">
        <svg class="flex-shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
        <div class="ml-3 text-sm font-medium">
        ` + alert.message + `
        </div>
        <button type="button" name="dismissButton" class="ml-auto -mx-1.5 -my-1.5 bg-` + alertSettings.color + `-50 text-` + alertSettings.color + `-500 rounded-lg focus:ring-2 focus:ring-` + alertSettings.color + `-400 p-1.5 hover:bg-` + alertSettings.color + `-200 inline-flex h-8 w-8 dark:bg-gray-800 dark:text-` + alertSettings.color + `-400 dark:hover:bg-gray-700" aria-label="Close">
            <span class="sr-only">Dismiss</span>
            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>
    </div>`
    );

    const targetEl = alertContainer.firstChild;
    const options = {
        transition: 'transition-opacity',
        duration: 500,
        timing: 'ease-out',

        onHide: (context, targetEl) => { 
            alertContainer.removeChild(targetEl);
            alertCount--;
        }
    };

    const dismiss = new Dismiss(targetEl, null, options);

    const hideHandler = () => { 
        if(activeAlertHashs.delete(alertMessageHash)) {
            dismiss.hide(); 
        }
    };

    let alertTimeout = -1;

    if(alertSettings.alertTime > 0) {
        alertTimeout = setTimeout(hideHandler, alertSettings.alertTime);
    }

    targetEl.querySelector('[name="dismissButton"]').onclick = () => { hideHandler(); clearTimeout(alertTimeout); };
    activeAlertHashs.set(alertMessageHash, { handler: hideHandler, timeout: alertTimeout });
    alertCount++;
}