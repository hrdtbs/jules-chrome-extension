const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const optionsStatusDiv = document.getElementById('status') as HTMLDivElement;

// Load stored API key
chrome.storage.local.get(['julesApiKey'], (result) => {
    if (result.julesApiKey) {
        apiKeyInput.value = result.julesApiKey as string;
    }
});

// Save API key
saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    chrome.storage.local.set({ julesApiKey: apiKey }, () => {
        optionsStatusDiv.textContent = 'Options saved.';
        setTimeout(() => {
            optionsStatusDiv.textContent = '';
        }, 2000);
    });
});
