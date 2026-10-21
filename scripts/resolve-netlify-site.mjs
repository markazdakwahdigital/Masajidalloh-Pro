// Resolve the real Netlify site UUID without printing any secret or API response.
// The slug in dashboard URLs is NOT guaranteed to be accepted by --site.
import { appendFileSync } from 'node:fs';
const token = process.env.NETLIFY_AUTH_TOKEN;
const target = 'masajidallohpro';
if (!token || !process.env.GITHUB_ENV) {
  console.error('Netlify token or GitHub Actions environment is missing.');
  process.exit(1);
}
let found;
for (let page=1;page<=5 && !found;page++) {
  let response;
  try {
    response = await fetch('https://api.netlify.com/api/v1/sites?per_page=100&page='+page, {
      headers: {Authorization: 'Bearer '+token,Accept:'application/json'},
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    console.error('Cannot reach Netlify API. Check network and retry.');
    process.exit(1);
  }
  if (response.status===401||response.status===403) {
    console.error('Netlify API rejected the token or lacks site-list permission ('+response.status+').');
    process.exit(1);
  }
  if (!response.ok) {
    console.error('Netlify API could not list sites (HTTP '+response.status+').');
    process.exit(1);
  }
  const sites=await response.json();
  if (!Array.isArray(sites)) {
    console.error('Unexpected Netlify API sites response.');
    process.exit(1);
  }
  found=sites.find(site => site.name===target || site.url==='https://'+target+'.netlify.app' || site.ssl_url==='https://'+target+'.netlify.app');
  if (sites.length<100) break;
}
if (!found?.id || !/^[0-9a-f-]{36}$/i.test(found.id)) {
  console.error('Project masajidallohpro was not accessible to this Netlify token. Check that the token belongs to the account/team owning the project.');
  process.exit(1);
}
appendFileSync(process.env.GITHUB_ENV,'NETLIFY_SITE_ID='+found.id+'\n',{encoding:'utf8'});
console.log('Netlify site was resolved successfully; site identifier stored for this job only.');
