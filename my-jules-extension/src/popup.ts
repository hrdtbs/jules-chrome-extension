const contextDisplay = document.getElementById('contextDisplay') as HTMLDivElement;
const promptInput = document.getElementById('promptInput') as HTMLTextAreaElement;
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
const popupStatusDiv = document.getElementById('status') as HTMLDivElement;

let currentContext: any = null;

// Get context from content script
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getContext' }, (response) => {
            if (chrome.runtime.lastError || !response) {
                contextDisplay.textContent = 'Could not read context from this page. Are you on a GitHub Issue or PR?';
                return;
            }

            currentContext = response;
            let displayHtml = `<strong>Context:</strong> ${response.contextType.toUpperCase()} #${response.number}<br>`;

            if (response.contextType === 'issue') {
                displayHtml += `<em>${response.title}</em>`;
                submitBtn.disabled = false;
            } else if (response.contextType === 'pr') {
                displayHtml += `Branch: <code>${response.headBranch}</code><br>`;
                if (response.ciStatus === 'failed') {
                    displayHtml += `<span style="color:#cf222e">CI Failed: ${response.failedChecks.length} checks</span>`;
                } else if (response.reviewComments.length > 0) {
                    displayHtml += `<span style="color:#9a6700">Review Comments: ${response.reviewComments.length}</span>`;
                } else {
                    displayHtml += `<span style="color:#1a7f37">CI Success</span>`;
                }
                submitBtn.disabled = false;
            } else {
                displayHtml = 'Not a supported GitHub Issue or PR page.';
            }

            contextDisplay.innerHTML = displayHtml;
        });
    }
});

submitBtn.addEventListener('click', () => {
    if (!currentContext) return;

    submitBtn.disabled = true;
    popupStatusDiv.textContent = 'Starting Jules session...';
    popupStatusDiv.className = '';

    const additionalPrompt = promptInput.value.trim();

    chrome.runtime.sendMessage({
        action: 'startJulesSession',
        context: currentContext,
        additionalPrompt: additionalPrompt
    }, (response) => {
        if (chrome.runtime.lastError) {
             popupStatusDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
             popupStatusDiv.className = 'error';
             submitBtn.disabled = false;
             return;
        }

        if (response && response.success) {
            popupStatusDiv.innerHTML = `Success! <a href="${response.url}" target="_blank">Open Jules Session</a>`;
            popupStatusDiv.className = 'success';
        } else {
            popupStatusDiv.textContent = `Error: ${response?.error || 'Unknown error'}`;
            popupStatusDiv.className = 'error';
            submitBtn.disabled = false;
        }
    });
});
