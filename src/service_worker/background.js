import * as browser from '../utilities/browser.js';
import * as focusMode from './focusMode.js';

browser.addOnInstalledListener(() => {
    focusMode.OnInstall();
});

focusMode.Init();

browser.addRuntimeMessageListener(function(request, sender, sendResponse) {
    switch(request.context) {
        case "FocusMode":
            sendResponse(focusMode.handleMessage(request));
            break;
    }
});
