import {startDatabase,root} from './server.mjs';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {compareHistorical} from './compare-historical.mjs';
const output=path.join(root,'docs/evidence/recovery');await mkdir(output,{recursive:true});
const children=[],handles=[],delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));let database,browser;
async function spawn(name,command,args,cwd,env={}){const file=await open(path.join(output,name+'.log'),'w');handles.push(file);const child=cp.spawn(command,args,{cwd,detached:process.platform!=='win32',env:{...process.env,...env},stdio:['ignore',file.fd,file.fd]});child.on('error',error=>{child.startupError=error;});children.push(child);return child;}
function alive(child){if(child.startupError)throw child.startupError;if(child.exitCode!==null)throw new Error('A service exited '+child.exitCode+'; inspect captured logs.');}
const evidence={passed:false,http:[],screenshots:[],browserErrors:[],consoleErrors:[],apiFailures:[],blockedExternalHosts:[],buildSource:'reconstructed recovery worktree',sourceCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceWorktreeChanged:!!cp.execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim()};
try{
 database=await startDatabase({dataDir:path.join(root,'.local/recovery-preview'),port:5432});
 const fixture=JSON.parse(await readFile(path.join(root,'.local/visual-test-account.json'),'utf8'));
 const {rows:users}=await database.db.query('SELECT username FROM public."user" WHERE id=1');assert(!users.length||users[0].username===fixture.username,'Refusing to replace an unrelated account');
 await database.db.query('INSERT INTO public."user"(id,username,password,description) VALUES(1,$1,$2,$3) ON CONFLICT(id) DO UPDATE SET password=excluded.password',[fixture.username,fixture.hash,'Local account used to verify the restored 2018 interface.']);
 await database.db.exec('INSERT INTO user_settings(user_id) VALUES(1) ON CONFLICT DO NOTHING; INSERT INTO user_economy(user_id,balance_robux,balance_tickets) VALUES(1,100,0) ON CONFLICT DO NOTHING; INSERT INTO user_avatar(user_id,head_color_id,torso_color_id,right_arm_color_id,left_arm_color_id,right_leg_color_id,left_leg_color_id) VALUES(1,194,23,194,194,102,102) ON CONFLICT DO NOTHING; INSERT INTO user_avatar_type(user_id) VALUES(1) ON CONFLICT DO NOTHING;');
 for(const [id,name,type,description] of [[980001,'2018 Interface Test Place',9,'Local interface test place. Game hosting is unavailable in this environment.'],[980002,'Interface Test Hat',8,'Local catalog record. No rendered thumbnail is available.']]){
  const {rows}=await database.db.query('SELECT name FROM asset WHERE id=$1',[id]);assert(!rows.length||rows[0].name===name);
  await database.db.query('INSERT INTO asset(id,name,description,asset_type,asset_genre,creator_type,creator_id,moderation_status,is_for_sale) VALUES($1,$2,$3,$4,0,1,1,1,false) ON CONFLICT DO NOTHING',[id,name,description,type]);
 }
 await database.db.exec('INSERT INTO asset_place(asset_id,year,playable) SELECT 980001,2018,false WHERE NOT EXISTS(SELECT 1 FROM asset_place WHERE asset_id=980001); INSERT INTO universe(id,root_asset_id,is_public,creator_id,creator_type) VALUES(980001,980001,true,1,1) ON CONFLICT DO NOTHING; INSERT INTO universe_asset(universe_id,asset_id) SELECT 980001,980001 WHERE NOT EXISTS(SELECT 1 FROM universe_asset WHERE universe_id=980001 AND asset_id=980001);');
 const redis=await spawn('redis',process.env.BUBBABLOX_REDIS_SERVER||'redis-server',['--bind','127.0.0.1','--port','6398','--save','','--appendonly','no'],root);
 const next=await spawn('next',process.execPath,['node_modules/next/dist/bin/next','dev','-p','3000','-H','127.0.0.1'],path.join(root,'2016-roblox-main'),{NEXT_TELEMETRY_DISABLED:'1'});
 await delay(1000);alive(redis);alive(next);
 const website=await spawn('website',process.env.BUBBABLOX_DOTNET||'dotnet',['bin/Debug/net6.0/Roblox.Website.dll'],path.join(root,'Roblox/Roblox.Website'),{Postgres:'Host=127.0.0.1;Port=5432;Database=postgres;Username=postgres;SSL Mode=Disable;Maximum Pool Size=10;Timeout=10',Redis:'127.0.0.1:6398',Urls:'http://127.0.0.1:5080',DOTNET_EnableDiagnostics:'0',HTTP_PROXY:'http://127.0.0.1:9',HTTPS_PROXY:'http://127.0.0.1:9',ALL_PROXY:'http://127.0.0.1:9',NO_PROXY:'127.0.0.1,localhost,::1'});
 let ready=false;for(let i=0;i<60;i++){alive(website);try{const response=await fetch('http://127.0.0.1:5080/apisite/users/v1/users/authenticated',{signal:AbortSignal.timeout(1500)});if(response.status===401){ready=true;break;}}catch{}await delay(500);}assert(ready,'C# website did not start');
 for(const [route,status] of [['/apisite/avatar/v1/avatar-rules',200],['/apisite/catalog/v1/search/items?category=All&limit=28&sortType=0',200],['/games',200],['/catalog',200],['/login',200]]){const response=await fetch('http://127.0.0.1:5080'+route,{signal:AbortSignal.timeout(45000)});evidence.http.push({route,status:response.status});assert.equal(response.status,status,route);}
 if(process.env.PLAYWRIGHT_MODULE){
  const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--disable-gpu','--unsafely-treat-insecure-origin-as-secure=http://127.0.0.1:5080']});const context=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'});
  await context.route('**/*',route=>{const url=new URL(route.request().url());if(['127.0.0.1','localhost','[::1]'].includes(url.hostname)||['data:','blob:'].includes(url.protocol))return route.continue();evidence.blockedExternalHosts.push(url.hostname);return route.abort('blockedbyclient');});
  const page=await context.newPage();
  page.on('pageerror',error=>evidence.browserErrors.push(String(error)));page.on('console',message=>{if(message.type()==='error')evidence.consoleErrors.push(message.text());});page.on('response',response=>{if(new URL(response.url()).pathname.startsWith('/apisite/')&&response.status()>=500)evidence.apiFailures.push({url:response.url(),status:response.status()});});
  for(const route of ['games','catalog','login','create','robux.aspx','users/1/profile','games/980001/2018-Interface-Test-Place','catalog/980002/Interface-Test-Hat']){
   const url='http://127.0.0.1:5080/'+route;const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await delay(3500);
   if(route==='catalog'){await page.locator('#catalog-content .heading').waitFor({state:'visible',timeout:15000});assert.equal((await page.locator('#catalog-content .heading').textContent()).trim(),'Catalog');assert(await page.locator('#category-panel-group > li').count()>=6,'Original catalog categories missing');await page.getByText('View All Items',{exact:true}).click();await page.waitForTimeout(1500);}
   if(route.startsWith('users/1/'))assert.equal((await page.locator('.header-title h2').textContent()).trim(),fixture.username);
   if(route.startsWith('games/980001'))assert.equal(await page.locator('#MultiplayerVisitButton a').getAttribute('aria-disabled'),'true');
   if(route.startsWith('catalog/980002'))assert(await page.locator('.PurchaseButton').isDisabled());
   assert.equal(await page.locator('nextjs-portal').count(),0,'Next runtime error overlay');
   const filename=route.replaceAll('/','-')+'.png';await page.screenshot({path:path.join(output,filename)});evidence.screenshots.push({filename,url,status:response.status(),viewport:{width:1366,height:768},capturedAt:new Date().toISOString()});
  }
  evidence.historicalComparison=await compareHistorical({context,root,output,origin:'http://127.0.0.1:5080'});
  await page.goto('http://127.0.0.1:5080/login?ReturnUrl=%2Fcatalog',{waitUntil:'domcontentloaded'});await page.locator('[name="username"]').fill(fixture.username);await page.locator('[name="password"]').fill(fixture.password);await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.locator('#login-button').click()]);await delay(1500);
  evidence.loginStatus=await page.evaluate(async()=>(await fetch('/apisite/users/v1/users/authenticated')).status);assert.equal(evidence.loginStatus,200);assert.equal(new URL(page.url()).pathname,'/catalog','Login must preserve a safe local return URL');
  for(const route of ['home','My/Avatar','My/Account','users/1/friends','develop']){
   await page.goto('http://127.0.0.1:5080/'+route,{waitUntil:'domcontentloaded'});await delay(2500);assert.equal(await page.locator('nextjs-portal').count(),0,route+' runtime overlay');
   if(route==='home'){
    await page.locator('#txtStatusMessage').fill('Testing the recovered 2018 Home status form.');
    await Promise.all([page.waitForResponse(r=>r.url().endsWith('/users/v1/users/1/status')&&r.request().method()==='PATCH'&&r.status()===200),page.locator('#shareButton').click()]);
    const status=await page.evaluate(async()=>(await (await fetch('/apisite/users/v1/users/1/status')).json()).status);assert.equal(status,'Testing the recovered 2018 Home status form.');evidence.homeStatusPersisted=true;
    assert.equal(await page.locator('#recently-visited-places:not(.hidden)').count(),0,'Original empty recent-games behavior');
   }
   if(route==='users/1/friends'){
    for(const tab of ['following','followers','requests']){await page.locator('#horizontal-tabs #'+tab).click();await page.waitForTimeout(300);assert.equal(await page.locator('#horizontal-tabs #'+tab+'.active').count(),1);}
    await page.locator('#horizontal-tabs #friends').click();evidence.friendsTabs=true;
   }
   const filename='signed-in-'+route.replaceAll('/','-')+'.png';await page.screenshot({path:path.join(output,filename)});evidence.screenshots.push({filename,url:page.url(),viewport:{width:1366,height:768},capturedAt:new Date().toISOString()});
  }
  assert.equal(evidence.browserErrors.length,0,'Unexpected browser runtime errors');assert.equal(evidence.apiFailures.length,0,'Unexpected API failure');
 }
 evidence.passed=true;evidence.database=database.identity;evidence.csharpStartup=true;console.log(JSON.stringify({passed:true,httpCases:evidence.http.length,screenshots:evidence.screenshots.length,loginStatus:evidence.loginStatus,browserErrors:evidence.browserErrors.length}));
}finally{
 await writeFile(path.join(output,'backend-integration.json'),JSON.stringify(evidence,null,2)+'\n');if(browser)await browser.close();for(const child of children.reverse()){try{if(process.platform==='win32')child.kill('SIGTERM');else process.kill(-child.pid,'SIGTERM');}catch{}}await delay(300);for(const file of handles)await file.close();if(database)await database.close();
}
