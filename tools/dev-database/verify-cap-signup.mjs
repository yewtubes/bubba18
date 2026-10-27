import {startDatabase,root} from './server.mjs';
import {readFile,writeFile,mkdir,mkdtemp,open} from 'node:fs/promises';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import {startCapServer} from '../../captcha/server.mjs';
const output=path.join(root,'docs/evidence/cap-signup');await mkdir(output,{recursive:true});
const children=[],handles=[],delay=ms=>new Promise(r=>setTimeout(r,ms));let database,browser,page,dataDir,capServer;const capSecret=randomBytes(48).toString('hex');
const report={capRequests:[],passed:false,kind:'Running original C# website, Redis, persistent PostgreSQL engine via PGlite wire server, and Next.js; synthetic local database accounts; no browser API mocks',sourceBaseCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),worktreeChanged:true,viewport:{width:1366,height:768},checks:[],screenshots:[],errors:[],apiFailures:[]};
async function spawn(name,command,args,cwd,env={}){const log=await open(path.join(root,'.local/social-live-'+name+'.log'),'w');handles.push(log);const child=cp.spawn(command,args,{cwd,detached:true,env:{...process.env,...env},stdio:['ignore',log.fd,log.fd]});child.on('error',e=>{child.startupError=e;});children.push(child);return child;}
try{
 dataDir=await mkdtemp(path.join(root,'.local/landing-db-'));database=await startDatabase({dataDir,port:5432});report.database=database.identity;
 const fixture=JSON.parse(await readFile(path.join(root,'.local/visual-test-account.json'),'utf8'));
 const {rows:existing}=await database.db.query('SELECT id FROM public."user"');assert.equal(existing.length,0,'Use a fresh dedicated test database');
 const redis=await spawn('redis',process.env.BUBBABLOX_REDIS_SERVER||'redis-server',['--bind','127.0.0.1','--port','6398','--save','','--appendonly','no'],root);
 await delay(500);capServer=await startCapServer({secret:capSecret,redisUrl:'redis://127.0.0.1:6398',port:3187});
 const next=await spawn('next',process.execPath,['node_modules/next/dist/bin/next','dev','-H','127.0.0.1'],path.join(root,'2016-roblox-main'),{NEXT_TELEMETRY_DISABLED:'1'});
 const website=await spawn('website',process.env.BUBBABLOX_DOTNET||'dotnet',['bin/Debug/net6.0/Roblox.Website.dll'],path.join(root,'Roblox/Roblox.Website'),{Cap__Endpoint:'http://127.0.0.1:3187/',Cap__Secret:capSecret,Postgres:'Host=127.0.0.1;Port=5432;Database=postgres;Username=postgres;SSL Mode=Disable;Maximum Pool Size=10;Timeout=10',Redis:'127.0.0.1:6398',Urls:'http://127.0.0.1:5080',DOTNET_EnableDiagnostics:'0',HTTP_PROXY:'http://127.0.0.1:9',HTTPS_PROXY:'http://127.0.0.1:9',ALL_PROXY:'http://127.0.0.1:9',NO_PROXY:'127.0.0.1,localhost,::1'});
 let ready=false;for(let i=0;i<90;i++){if(website.startupError)throw website.startupError;try{if((await fetch('http://127.0.0.1:5080/apisite/users/v1/users/authenticated')).status===401){ready=true;break;}}catch{}await delay(500);}assert(ready,'C# website did not start; inspect .local/social-live-website.log');
 const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--disable-gpu','--unsafely-treat-insecure-origin-as-secure=http://127.0.0.1:5080']});
 const context=await browser.newContext({viewport:report.viewport});
 await context.route('**/*',route=>['127.0.0.1','localhost','[::1]'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(20000);page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.url().includes('/apisite/')&&r.status()>=500)report.apiFailures.push({url:r.url(),status:r.status()});});


 const origin='http://127.0.0.1:5080';
 page.on('response',async r=>{if(r.url().includes('/captcha/')){let info={path:new URL(r.url()).pathname,status:r.status()};if(!r.url().includes('/assets/')){const data=await r.json().catch(()=>({}));info={...info,success:data.success,error:data.error,instrumentation:!!data.instrumentation};}report.capRequests.push(info);}});
 const resources=[];page.on('response',r=>{if(r.status()>=400&&r.url().includes('/preserved/'))resources.push({url:r.url(),status:r.status()});});
 const shot=async(name,fullPage=false)=>{await page.screenshot({path:path.join(output,name),fullPage,...(name.endsWith('.jpg')?{type:'jpeg',quality:85}:{})});report.screenshots.push({filename:name,url:page.url(),capturedAt:new Date().toISOString(),kind:report.kind,fullPage});};

 await page.goto(origin+'/',{waitUntil:'networkidle'});await page.locator('#signup-button').waitFor();
 const missing=await page.evaluate(async()=>{const r=await fetch('/login/signup',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username:'CapMissing',password:'local-valid-password',birthday:'01 Jan 2000',gender:'2'})});return {status:r.status,data:await r.json()};});
 assert.equal(missing.status,403);assert.deepEqual(missing.data.reasons,['Captcha']);report.checks.push('Native signup rejects missing CAPTCHA before any account mutation');
 assert.equal((await fetch(capServer.url+'/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
 assert.equal((await page.request.post(origin+'/captcha/siteverify',{data:{}})).status(),404);report.checks.push('Private siteverify requires authentication and has no public proxy route');
 const forged=await page.request.post(origin+'/captcha/redeem',{data:{token:'forged',solutions:[0]}});assert.equal(forged.status(),400);report.checks.push('Real CAP verifier rejects a forged challenge');
 let redeemedToken,redemptionBody;page.on('request',r=>{if(r.url().endsWith('/captcha/redeem'))redemptionBody=r.postDataJSON();});page.on('response',async r=>{if(r.url().endsWith('/captcha/redeem')&&r.status()===200)redeemedToken=(await r.json()).token;});
 await page.locator('#MonthDropdown').selectOption('Jan');await page.locator('#DayDropdown').selectOption({label:'01'});await page.locator('#YearDropdown').selectOption('2000');await page.locator('#signup-username').fill('CapNewUser');await page.locator('#signup-password').fill(fixture.password);await page.locator('#MaleButton').click();
 await page.waitForFunction(()=>angular.element(document.querySelector('[sign-up]')).isolateScope().signupForm.signupUsername.$valid);
 await shot('cap-signup-form-live.jpg');await page.locator('#signup-button').click();
 await page.waitForURL(url=>url.pathname==='/home',{timeout:50000});
 assert.equal(await page.evaluate(async()=>(await fetch('/apisite/users/v1/users/authenticated')).status),200);
 const {rows:[created]}=await database.db.query('SELECT id,password FROM public."user" WHERE username=$1',['CapNewUser']);assert(created);assert.notEqual(created.password,fixture.password);report.createdUserId=created.id;
 report.checks.push('Original landing form solves real CAP proof-of-work and browser instrumentation, creates an independent account and establishes its session without Discord');await page.waitForTimeout(1000);await shot('cap-account-home-live.jpg');assert.equal((await context.cookies()).some(cookie=>['discord_id','discord_profile','signupkey'].includes(cookie.name)),false);
 const replay=await page.request.post(origin+'/captcha/redeem',{data:redemptionBody});assert.equal(replay.status(),400);assert.equal((await replay.json()).error,'already_redeemed');
 const reused=await fetch(capServer.url+'/siteverify',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+capSecret},body:JSON.stringify({secret:capSecret,response:redeemedToken})});assert.equal((await reused.json()).success,false);report.checks.push('Atomic Redis nonce and token consumption reject both challenge replay and reuse of the signup token');
 const {rows:[counts]}=await database.db.query('SELECT (SELECT count(*) FROM user_settings WHERE user_id=$1)::int AS settings,(SELECT count(*) FROM user_economy WHERE user_id=$1)::int AS economy,(SELECT count(*) FROM user_avatar WHERE user_id=$1)::int AS avatars',[created.id]);assert.deepEqual(counts,{settings:1,economy:1,avatars:1});report.checks.push('Existing account service creates exactly one persistent settings, economy and avatar record');
 await context.clearCookies();await page.goto(origin+'/',{waitUntil:'networkidle'});await capServer.close();capServer=null;
 assert.equal((await page.request.post(origin+'/captcha/challenge',{data:{}})).status(),503);assert.equal((await database.db.query('SELECT count(*)::int AS n FROM public."user"')).rows[0].n,1);report.checks.push('CAP outage fails closed and does not create a second account');
 assert.equal(resources.length,0,JSON.stringify(resources));assert.equal(report.errors.length,0,report.errors.join('\n'));report.passed=true;
}finally{
 if(page&&!report.passed){report.failureText=await page.locator('#GeneralErrorText').textContent().catch(()=>null);console.log(JSON.stringify({capRequests:report.capRequests,error:report.failureText}));}if(page&&!report.passed)await page.screenshot({path:path.join(root,'.local/cap-signup-failure.png'),fullPage:true}).catch(()=>{});
 if(browser)await browser.close();for(const child of children.reverse()){try{process.kill(-child.pid,'SIGTERM');}catch{}}await delay(300);for(const log of handles)await log.close();if(capServer)await capServer.close();if(database)await database.close();
 if(report.passed){const reopened=await startDatabase({dataDir,port:5432});try{const {rows:[stored]}=await reopened.db.query('SELECT count(*)::int AS n FROM public."user" WHERE username=$1',['CapNewUser']);assert.equal(stored.n,1);report.checks.push('New CAPTCHA-created account survives database close and restart');}catch(error){report.passed=false;throw error;}finally{await reopened.close();}}
 await writeFile(path.join(output,'backend-integration.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,screenshots:report.screenshots.length,errors:report.errors}));
}
