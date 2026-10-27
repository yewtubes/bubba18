import {startDatabase,root} from './server.mjs';
import {readFile,writeFile,mkdir,mkdtemp,open} from 'node:fs/promises';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const output=path.join(root,'docs/evidence/social-2018-live');await mkdir(output,{recursive:true});
const children=[],handles=[],delay=ms=>new Promise(r=>setTimeout(r,ms));let database,browser,dataDir;
const report={passed:false,kind:'Running original C# website, Redis, persistent PostgreSQL engine via PGlite wire server, and Next.js; synthetic local database accounts; no browser API mocks',sourceBaseCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),worktreeChanged:true,viewport:{width:1366,height:768},checks:[],screenshots:[],errors:[],apiFailures:[]};
async function spawn(name,command,args,cwd,env={}){const log=await open(path.join(root,'.local/social-live-'+name+'.log'),'w');handles.push(log);const child=cp.spawn(command,args,{cwd,detached:true,env:{...process.env,...env},stdio:['ignore',log.fd,log.fd]});child.on('error',e=>{child.startupError=e;});children.push(child);return child;}
try{
 dataDir=await mkdtemp(path.join(root,'.local/social-live-db-'));database=await startDatabase({dataDir,port:5432});report.database=database.identity;
 const fixture=JSON.parse(await readFile(path.join(root,'.local/visual-test-account.json'),'utf8'));
 const {rows:existing}=await database.db.query('SELECT id FROM public."user"');assert.equal(existing.length,0,'Use a fresh dedicated test database');
 await database.db.query('INSERT INTO public."user"(id,username,password,description) VALUES(1,$1,$2,$3)',[fixture.username,fixture.hash,'Local account for verifying the preserved 2018 interface.']);
 await database.db.exec('INSERT INTO user_settings(user_id) VALUES(1);INSERT INTO user_economy(user_id,balance_robux,balance_tickets) VALUES(1,100,0);INSERT INTO user_avatar(user_id,head_color_id,torso_color_id,right_arm_color_id,left_arm_color_id,right_leg_color_id,left_leg_color_id) VALUES(1,194,23,194,194,102,102);INSERT INTO user_avatar_type(user_id) VALUES(1);');
 for(let i=0;i<105;i++){
  const id=1001+i;await database.db.query('INSERT INTO public."user"(id,username,password) VALUES($1,$2,$3)',[id,'LocalRequest'+String(i+1).padStart(3,'0'),fixture.hash]);
  await database.db.query('INSERT INTO user_friend_request(user_id_one,user_id_two) VALUES($1,1)',[id]);
 }
 await database.db.exec('INSERT INTO user_following(user_id_who_is_following,user_id_being_followed) VALUES(1,1001)');
 await database.db.exec(`INSERT INTO "group"(id,user_id,name,description) VALUES(900001,1,'Local Preservation Group','Original November 2018 group page connected to the live local backend.');INSERT INTO group_settings(group_id) VALUES(900001);INSERT INTO group_role(id,group_id,name,description,rank,member_count) VALUES(900010,900001,'Guest','',0,0),(900011,900001,'Members','',1,1),(900012,900001,'Owner','',255,1);INSERT INTO group_role_permission(group_role_id,view_wall,post_to_wall) VALUES(900010,false,false),(900011,true,true),(900012,true,true);INSERT INTO group_user(group_role_id,user_id) VALUES(900012,1),(900011,1001);INSERT INTO group_wall(group_id,user_id,content) VALUES(900001,1,'Local wall content stored in PostgreSQL.');`);
 const redis=await spawn('redis',process.env.BUBBABLOX_REDIS_SERVER||'redis-server',['--bind','127.0.0.1','--port','6398','--save','','--appendonly','no'],root);
 const next=await spawn('next',process.execPath,['node_modules/next/dist/bin/next','dev','-H','127.0.0.1'],path.join(root,'2016-roblox-main'),{NEXT_TELEMETRY_DISABLED:'1'});
 const website=await spawn('website',process.env.BUBBABLOX_DOTNET||'dotnet',['bin/Debug/net6.0/Roblox.Website.dll'],path.join(root,'Roblox/Roblox.Website'),{Postgres:'Host=127.0.0.1;Port=5432;Database=postgres;Username=postgres;SSL Mode=Disable;Maximum Pool Size=10;Timeout=10',Redis:'127.0.0.1:6398',Urls:'http://127.0.0.1:5080',DOTNET_EnableDiagnostics:'0',HTTP_PROXY:'http://127.0.0.1:9',HTTPS_PROXY:'http://127.0.0.1:9',ALL_PROXY:'http://127.0.0.1:9',NO_PROXY:'127.0.0.1,localhost,::1'});
 let ready=false;for(let i=0;i<90;i++){if(website.startupError)throw website.startupError;try{if((await fetch('http://127.0.0.1:5080/apisite/users/v1/users/authenticated')).status===401){ready=true;break;}}catch{}await delay(500);}assert(ready,'C# website did not start; inspect .local/social-live-website.log');
 const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--disable-gpu','--unsafely-treat-insecure-origin-as-secure=http://127.0.0.1:5080']});
 const context=await browser.newContext({viewport:report.viewport,serviceWorkers:'block'});
 await context.route('**/*',route=>['127.0.0.1','localhost','[::1]'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.url().includes('/apisite/')&&r.status()>=500)report.apiFailures.push({url:r.url(),status:r.status()});});
 const shot=async name=>{await page.screenshot({path:path.join(output,name),fullPage:true});report.screenshots.push({filename:name,url:page.url(),capturedAt:new Date().toISOString(),kind:report.kind});};
 await page.goto('http://127.0.0.1:5080/login?ReturnUrl=%2Fsearch%2Fusers%3Fkeyword%3DLocalRequest',{waitUntil:'domcontentloaded'});
 await page.locator('[name="username"]').fill(fixture.username);await page.locator('[name="password"]').fill(fixture.password);
 await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.locator('#login-button').click()]);
 await page.locator('.player-item').first().waitFor();assert.equal(await page.locator('.player-item').count(),12);await shot('search-players-live.png');
 await page.locator('.pager-next a').click();await page.waitForFunction(()=>document.querySelector('#rbx-current-page')?.textContent==='2');assert.equal(await page.locator('.player-item').count(),12);report.checks.push('Real login and database user-search pagination through original December controller');
 await page.goto('http://127.0.0.1:5080/users/1/friends#!/friend-requests',{waitUntil:'networkidle'});await page.getByText('Friend Requests (105)',{exact:true}).waitFor();await shot('friends-requests-live.png');
 await page.getByRole('button',{name:'Ignore All',exact:true}).click();await page.getByText('Friend Requests (0)',{exact:true}).waitFor({timeout:60000});
 const {rows:[count]}=await database.db.query('SELECT count(*)::int AS count FROM user_friend_request WHERE user_id_two=1');assert.equal(count.count,0);report.checks.push('All 105 incoming requests deleted through C# APIs and verified in persistent SQL storage');
 await page.locator('#following').click();await page.getByText('LocalRequest001',{exact:true}).waitFor();await page.locator('.avatar-card-menu .rbx-menu-item').click();await page.locator('.popover .friend-unfollow').waitFor();await page.waitForTimeout(250);await shot('friends-following-menu-live.png');await page.locator('.popover .friend-unfollow').click();await page.getByText('Following (0)',{exact:true}).waitFor();
 const {rows:[following]}=await database.db.query('SELECT count(*)::int AS count FROM user_following WHERE user_id_who_is_following=1');assert.equal(following.count,0);report.checks.push('Recovered Following menu removes actual database relationship through existing C# API');
 await page.goto('http://127.0.0.1:5080/Groups/Group.aspx?gid=900001',{waitUntil:'networkidle'});
 await page.locator('.right-col h2').filter({hasText:'Local Preservation Group'}).waitFor();
 await page.getByText('Local wall content stored in PostgreSQL.',{exact:true}).waitFor();assert.equal(await page.locator('#ctl00_cphRoblox_JoinGroup').isVisible(),false);await shot('group-games-live.png');
 await page.locator('#GroupsPeople_Members').click();await page.locator('.GroupMember .NameText').filter({hasText:'LocalRequest001'}).waitFor();await shot('group-members-live.png');report.checks.push('Original November group details, protected wall and flat v1 role-member response load through C# APIs; existing membership hides Join');
 await context.clearCookies();await page.goto('http://127.0.0.1:5080/Groups/Group.aspx?gid=900001',{waitUntil:'networkidle'});
 assert.equal(await page.evaluate(async()=>(await fetch('/apisite/users/v1/users/authenticated')).status),401);await page.locator('.right-col h2').filter({hasText:'Local Preservation Group'}).waitFor();await page.getByRole('status').filter({hasText:'Log in'}).waitFor();assert.equal(await page.locator('.GroupWall_PostContainer').count(),0);report.checks.push('Anonymous wall rejection retains public group details and never discloses protected posts');
 assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(report.apiFailures.length,0,JSON.stringify(report.apiFailures));report.passed=true;
}finally{
 if(browser)await browser.close();for(const child of children.reverse()){try{process.kill(-child.pid,'SIGTERM');}catch{}}await delay(300);for(const log of handles)await log.close();if(database)await database.close();
 if(report.passed){const reopened=await startDatabase({dataDir,port:5432});try{const {rows:[stored]}=await reopened.db.query('SELECT (SELECT count(*) FROM user_friend_request WHERE user_id_two=1)::int AS requests,(SELECT count(*) FROM user_following WHERE user_id_who_is_following=1)::int AS following');assert.equal(stored.requests,0);assert.equal(stored.following,0);report.checks.push('Request and following mutations survive database close and restart');report.restartPersistence=true;}catch(e){report.passed=false;throw e;}finally{await reopened.close();}}
 await writeFile(path.join(output,'backend-integration.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,screenshots:report.screenshots.length}));
}
