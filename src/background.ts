async function startJulesSession(context: any, additionalPrompt: string) {
    const data = await chrome.storage.local.get(['julesApiKey']);
    const apiKey = data.julesApiKey as string;

    if (!apiKey) {
        throw new Error("Jules API Key is not set. Please set it in options.");
    }

    const { owner, repo, number, title, bodyText, headBranch, ciStatus, failedChecks, reviewComments, contextType } = context;
    const sourceContext = `sources/github/${owner}/${repo}`;

    // Check if repo is connected
    const sourcesRes = await fetch('https://jules.googleapis.com/v1alpha/sources', {
        headers: { 'X-Goog-Api-Key': apiKey }
    });
    if (!sourcesRes.ok) {
         throw new Error(`Failed to check sources: ${sourcesRes.statusText}`);
    }
    const sourcesData = await sourcesRes.json();
    const isConnected = sourcesData.sources?.some((s: any) => s.name === sourceContext);
    if (!isConnected) {
        throw new Error(`Repository ${owner}/${repo} is not connected to Jules.`);
    }

    // Prepare prompt
    let promptText = "";
    let branch = "";

    if (contextType === 'issue') {
        promptText = `issue #${number}『${title}』に対応せよ。\n本文:\n${bodyText}`;
    } else if (contextType === 'pr') {
        branch = headBranch;
        if (ciStatus === 'failed') {
            promptText = `PR #${number} の失敗チェック（${failedChecks.join(', ')}）を調査し修正せよ。`;
        } else if (reviewComments.length > 0) {
            promptText = `PR #${number} の未対応レビューコメントに対応せよ:\n${reviewComments.join('\n')}`;
        } else {
             promptText = `PR #${number} を確認して。`;
        }
    }

    if (additionalPrompt) {
        promptText += `\n\n追加指示:\n${additionalPrompt}`;
    }

    // Start session
    const requestBody: any = {
         sourceContext: sourceContext,
         automationMode: "AUTO_CREATE_PR",
         prompt: promptText
    };
    if (branch) {
         requestBody.startingBranch = branch;
    }

    const sessionRes = await fetch('https://jules.googleapis.com/v1alpha/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey
        },
        body: JSON.stringify(requestBody)
    });

    if (!sessionRes.ok) {
        const errData = await sessionRes.text();
        throw new Error(`Failed to start session: ${sessionRes.status} ${errData}`);
    }

    const sessionData = await sessionRes.json();

    // A simplified URL logic, assumes Jules web UI format:
    const sessionUrl = `https://jules.google.com/session/${sessionData.name.split('/').pop()}`;

    return { success: true, url: sessionUrl, sessionData };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startJulesSession') {
        startJulesSession(request.context, request.additionalPrompt)
            .then(res => sendResponse(res))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep message channel open for async response
    }
});
