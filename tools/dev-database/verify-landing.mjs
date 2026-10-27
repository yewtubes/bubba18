import {startDatabase,root} from './server.mjs';
import {readFile,writeFile,mkdir,mkdtemp,open} from 'node:fs/promises';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const output=path.join(root,'docs/evidence/landing-2018');await mkdir(output,{recursive:true});
const children=[],handles=[],delay=ms=>new Promise(r=>setTimeout(r,ms));let database,browser,page,dataDir;
const report={passed:false,kind:'Running original C# website, Redis, persistent PostgreSQL engine via PGlite wire server, and Next.js; synthetic local database accounts; no browser API mocks',sourceBaseCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),worktreeChanged:true,viewport:{width:1366,height:768},checks:[],screenshots:[],errors:[],apiFailures:[]};
async function spawn(name,command,args,cwd,env={}){const log=await open(path.join(root,'.local/social-live-'+name+'.log'),'w');handles.push(log);const child=cp.spawn(command,args,{cwd,detached:true,env:{...process.env,...env},stdio:['ignore',log.fd,log.fd]});child.on('error',e=>{child.startupError=e;});children.push(child);return child;}
try{
 dataDir=await mkdtemp(path.join(root,'.local/landing-db-'));database=await startDatabase({dataDir,port:5432});report.database=database.identity;
 const fixture=JSON.parse(await readFile(path.join(root,'.local/visual-test-account.json'),'utf8'));
 const {rows:existing}=await database.db.query('SELECT id FROM public."user"');assert.equal(existing.length,0,'Use a fresh dedicated test database');
 await database.db.query('INSERT INTO public."user"(id,username,password,description) VALUES(1,$1,$2,$3)',[fixture.username,fixture.hash,'Local account for verifying the preserved 2018 interface.']);
 await database.db.exec('INSERT INTO user_settings(user_id) VALUES(1);INSERT INTO user_economy(user_id,balance_robux,balance_tickets) VALUES(1,100,0);INSERT INTO user_avatar(user_id,head_color_id,torso_color_id,right_arm_color_id,left_arm_color_id,right_leg_color_id,left_leg_color_id) VALUES(1,194,23,194,194,102,102);INSERT INTO user_avatar_type(user_id) VALUES(1);');
 const redis=await spawn('redis',process.env.BUBBABLOX_REDIS_SERVER||'redis-server',['--bind','127.0.0.1','--port','6398','--save','','--appendonly','no'],root);
 const next=await spawn('next',process.execPath,['node_modules/next/dist/bin/next','dev','-H','127.0.0.1'],path.join(root,'2016-roblox-main'),{NEXT_TELEMETRY_DISABLED:'1'});
 const website=await spawn('website',process.env.BUBBABLOX_DOTNET||'dotnet',['bin/Debug/net6.0/Roblox.Website.dll'],path.join(root,'Roblox/Roblox.Website'),{Postgres:'Host=127.0.0.1;Port=5432;Database=postgres;Username=postgres;SSL Mode=Disable;Maximum Pool Size=10;Timeout=10',Redis:'127.0.0.1:6398',Urls:'http://127.0.0.1:5080',DOTNET_EnableDiagnostics:'0',HTTP_PROXY:'http://127.0.0.1:9',HTTPS_PROXY:'http://127.0.0.1:9',ALL_PROXY:'http://127.0.0.1:9',NO_PROXY:'127.0.0.1,localhost,::1'});
 let ready=false;for(let i=0;i<90;i++){if(website.startupError)throw website.startupError;try{if((await fetch('http://127.0.0.1:5080/apisite/users/v1/users/authenticated')).status===401){ready=true;break;}}catch{}await delay(500);}assert(ready,'C# website did not start; inspect .local/social-live-website.log');
 const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--disable-gpu','--unsafely-treat-insecure-origin-as-secure=http://127.0.0.1:5080']});
 const context=await browser.newContext({viewport:report.viewport,serviceWorkers:'block'});
 await context.route('**/*',route=>['127.0.0.1','localhost','[::1]'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(20000);page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.url().includes('/apisite/')&&r.status()>=500)report.apiFailures.push({url:r.url(),status:r.status()});});


 const origin='http://127.0.0.1:5080';
 const resources=[];page.on('response',r=>{if(r.status()>=400&&r.url().includes('/preserved/'))resources.push({url:r.url(),status:r.status()});});
 const shot=async(name,fullPage=false)=>{await page.screenshot({path:path.join(output,name),fullPage,...(name.endsWith('.jpg')?{type:'jpeg',quality:85}:{})});report.screenshots.push({filename:name,url:page.url(),capturedAt:new Date().toISOString(),kind:report.kind,fullPage});};
 const response=await page.goto(origin+'/?ReturnUrl=%2Fusers%2F1%2Fprofile',{waitUntil:'networkidle'});
 assert.equal(response.headers()['cache-control'],'no-cache');
 await page.locator('#signup-button').filter({hasText:'Sign Up'}).waitFor();
 assert.equal(await page.locator('#signup-password').getAttribute('type'),'password');
 const geometry=await page.evaluate(()=>{const rect=sel=>{const r=document.querySelector(sel).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};return {navbar:rect('.navbar-landing'),signup:rect('#SignUpFormContainer'),logo:rect('#MainLogoImage'),roller:rect('#RollerContainer'),fonts:document.fonts.status};});
 assert.equal(geometry.navbar.height,66);assert(geometry.signup.width>450);report.geometry=geometry;
 await shot('landing-desktop-live.jpg');await shot('landing-full-live.jpg',true);
 report.checks.push('Native root serves recovered December templates, CSS, real image/font assets and non-stale HTML; no missing preservation resources');
 await page.locator('#AboutLink a').click();await page.waitForFunction(()=>window.scrollY>700);await page.waitForTimeout(700);await shot('landing-about-live.jpg');
 await page.locator('#PlatformLink a').click();await page.waitForTimeout(750);assert(await page.evaluate(()=>window.scrollY>1200));await shot('landing-platforms-live.jpg');
 await page.locator('#PlayLink a').click();await page.waitForFunction(()=>window.scrollY<5);report.checks.push('Original Play/About/Platforms scrolling and navigation indicator execute');
 await page.locator('#signup-button').click();await page.getByText('Invalid birthday.',{exact:true}).waitFor();report.checks.push('Original signup validator rejects empty/invalid fields before any account creation');
 await page.locator('#MonthDropdown').selectOption('Jan');await page.locator('#DayDropdown').selectOption({label:'01'});await page.locator('#YearDropdown').selectOption('2000');
 await page.locator('#signup-username').fill(fixture.username);await page.locator('#signup-password').fill(fixture.password);await page.locator('#MaleButton').click();
 await page.getByText('This username is already in use.',{exact:true}).waitFor();
 await page.locator('#signup-username').fill('LandingTestUser');await page.waitForFunction(()=>angular.element(document.querySelector('[sign-up]')).isolateScope().signupForm.signupUsername.$valid);
 await page.locator('.password-visibility-toggle').click();assert.equal(await page.locator('#signup-password').getAttribute('type'),'text');await page.locator('.password-visibility-toggle').click();
 const rejected=page.waitForResponse(r=>r.url().endsWith('/login/signup')&&r.request().method()==='POST');await page.locator('#signup-button').click();assert.equal((await rejected).status(),403);
 await page.getByText('Verify your Discord account before signing up.',{exact:true}).waitFor();await page.getByRole('link',{name:'Verify with Discord',exact:true}).waitFor();
 assert.equal((await database.db.query('SELECT count(*)::int AS n FROM public."user"')).rows[0].n,1);
 // Clear test credentials before storing error screenshots.
 await page.locator('#signup-password').fill('');await page.waitForTimeout(500);await shot('landing-verification-live.jpg');
 report.checks.push('Native username uniqueness contract, password visibility and real signup 403 work; missing Discord verification cannot create an account');
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/',{waitUntil:'networkidle'});await page.locator('.navbar-toggle').click();await page.locator('#login-username').waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelector('#LandingNavbar').classList.contains('in')&&!document.querySelector('#LandingNavbar').classList.contains('collapsing'));assert((await page.locator('#LandingNavbar').boundingBox()).height>150);await shot('landing-mobile-login-live.jpg');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));report.checks.push('Original responsive mobile login expands without horizontal overflow');
 await page.setViewportSize(report.viewport);await page.goto(origin+'/',{waitUntil:'networkidle'});
 await page.locator('#horizontal-login-username').fill(fixture.username);await page.locator('#horizontal-login-password').fill('incorrect-local-password');
 await Promise.all([page.waitForURL(url=>url.pathname==='/login'&&url.searchParams.get('errorCode')==='1'),page.locator('#horizontal-login-button').click()]);await page.getByText('Incorrect username or password.',{exact:true}).waitFor();
 assert.equal((await page.request.get(origin+'/apisite/users/v1/users/authenticated')).status(),401);report.checks.push('Wrong password is rejected by the real C# endpoint; original login error route displays its recovered message');
 await delay(5200);await page.goto(origin+'/?ReturnUrl=%2Fusers%2F1%2Fprofile',{waitUntil:'networkidle'});await page.locator('#horizontal-login-username').fill(fixture.username);await page.locator('#horizontal-login-password').fill(fixture.password);
 await Promise.all([page.waitForURL(url=>url.pathname==='/users/1/profile'&&url.searchParams.get('nl')==='true'),page.locator('#horizontal-login-button').click()]);assert.equal(await page.evaluate(async()=>(await fetch('/apisite/users/v1/users/authenticated')).status),200);
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});assert.equal(new URL(page.url()).pathname,'/home');report.checks.push('Recovered header login establishes a real session, respects a local ReturnUrl and retains authenticated root redirect');
 assert.equal(resources.length,0,JSON.stringify(resources));assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(report.apiFailures.length,0,JSON.stringify(report.apiFailures));report.passed=true;
}finally{
 if(page&&!report.passed)await page.screenshot({path:path.join(root,'.local/landing-failure.png'),fullPage:true}).catch(()=>{});
 if(browser)await browser.close();for(const child of children.reverse()){try{process.kill(-child.pid,'SIGTERM');}catch{}}await delay(300);for(const log of handles)await log.close();if(database)await database.close();
 await writeFile(path.join(output,'backend-integration.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,screenshots:report.screenshots.length,errors:report.errors}));
}
