function getContext() {
    const path = location.pathname;
    const matchIssue = path.match(/^\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    const matchPR = path.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);

    let contextType = 'unknown';
    let owner = '';
    let repo = '';
    let number = '';
    let title = '';
    let bodyText = '';
    let headBranch = '';
    let ciStatus = '';
    let failedChecks: string[] = [];
    let reviewComments: string[] = [];

    if (matchIssue) {
        contextType = 'issue';
        owner = matchIssue[1];
        repo = matchIssue[2];
        number = matchIssue[3];

        const titleEl = document.querySelector('.js-issue-title');
        if (titleEl) title = titleEl.textContent?.trim() || '';

        const bodyEl = document.querySelector('.comment-body');
        if (bodyEl) bodyText = bodyEl.textContent?.trim() || '';
    } else if (matchPR) {
        contextType = 'pr';
        owner = matchPR[1];
        repo = matchPR[2];
        number = matchPR[3];

        const headRefEl = document.querySelector('.commit-ref.head-ref .css-truncate-target');
        if (headRefEl) headBranch = headRefEl.textContent?.trim() || '';

        const ciFailures = document.querySelectorAll('.merge-status-item .octicon-x, .merge-status-item .octicon-stop');
        ciFailures.forEach(icon => {
             const checkItem = icon.closest('.merge-status-item');
             if (checkItem) {
                 const nameEl = checkItem.querySelector('strong');
                 if (nameEl) failedChecks.push(nameEl.textContent?.trim() || '');
             }
        });

        if (failedChecks.length > 0) {
            ciStatus = 'failed';
        } else {
            ciStatus = 'success';
            // Extract review comments (simple approach, might need refinement due to React changes)
            const comments = document.querySelectorAll('.review-comment .comment-body');
            comments.forEach(c => {
                const text = c.textContent?.trim();
                if (text) reviewComments.push(text);
            });
        }
    }

    return {
        contextType, owner, repo, number, title, bodyText, headBranch, ciStatus, failedChecks, reviewComments,
        url: location.href
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getContext') {
        sendResponse(getContext());
    }
});
