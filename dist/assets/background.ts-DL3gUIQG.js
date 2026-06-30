async function A(t,a){var g;const e=(await chrome.storage.local.get(["julesApiKey"])).julesApiKey;if(!e)throw new Error("Jules API Key is not set. Please set it in options.");const{owner:u,repo:h,number:o,title:w,bodyText:y,headBranch:j,ciStatus:T,failedChecks:x,reviewComments:p,contextType:d}=t,f=`sources/github/${u}/${h}`,r=await fetch("https://jules.googleapis.com/v1alpha/sources",{headers:{"X-Goog-Api-Key":e}});if(!r.ok)throw new Error(`Failed to check sources: ${r.statusText}`);if(!((g=(await r.json()).sources)==null?void 0:g.some(l=>l.name===f)))throw new Error(`Repository ${u}/${h} is not connected to Jules.`);let s="",c="";d==="issue"?s=`issue #${o}『${w}』に対応せよ。
本文:
${y}`:d==="pr"&&(c=j,T==="failed"?s=`PR #${o} の失敗チェック（${x.join(", ")}）を調査し修正せよ。`:p.length>0?s=`PR #${o} の未対応レビューコメントに対応せよ:
${p.join(`
`)}`:s=`PR #${o} を確認して。`),a&&(s+=`

追加指示:
${a}`);const m={sourceContext:f,automationMode:"AUTO_CREATE_PR",prompt:s};c&&(m.startingBranch=c);const n=await fetch("https://jules.googleapis.com/v1alpha/sessions",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":e},body:JSON.stringify(m)});if(!n.ok){const l=await n.text();throw new Error(`Failed to start session: ${n.status} ${l}`)}const $=await n.json();return{success:!0,url:`https://jules.google.com/session/${$.name.split("/").pop()}`,sessionData:$}}chrome.runtime.onMessage.addListener((t,a,i)=>{if(t.action==="startJulesSession")return A(t.context,t.additionalPrompt).then(e=>i(e)).catch(e=>i({success:!1,error:e.message})),!0});
