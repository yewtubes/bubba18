import {writeFile,mkdir,open} from 'node:fs/promises';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),output=path.join(root,'docs/evidence/social-2018');await mkdir(output,{recursive:true});
const log=await open(path.join(root,'.local/social-next.log'),'w');
const server=cp.spawn(process.execPath,['node_modules/next/dist/bin/next','dev','-H','127.0.0.1'],{cwd:path.join(root,'2016-roblox-main'),detached:true,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore',log.fd,log.fd]});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let browser,page;
const report={passed:false,kind:'Actual Next.js frontend with synthetic API-contract fixtures; not live C# integration or full 1:1 certification',viewport:{width:1366,height:768},sourceBaseCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),worktreeChanged:true,checks:[],errors:[],consoleErrors:[],unsupported:[],screenshots:[]};
try{
 let ready=false;for(let i=0;i<90;i++){try{if((await fetch('http://127.0.0.1:3000/search/users?keyword=Local')).ok){ready=true;break;}}catch{}await delay(500);}assert(ready,'Next.js did not start');
 const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);browser=await chromium.launch({executablePath:path.join(root,'.local/chromium'),args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--disable-gpu']});
 const context=await browser.newContext({viewport:report.viewport,serviceWorkers:'block'});
 const users=Array.from({length:25},(_,i)=>({UserId:i+101,Name:'LocalPlayer'+(i+1),UserProfilePageUrl:'/users/'+(i+101)+'/profile',PreviousUserNamesCsv:'',PrimaryGroup:''}));
 let pending=Array.from({length:105},(_,i)=>({id:1001+i,name:'LocalRequest'+(i+1)})),followed=true,requestSent=false,accepted=0,declined=[],failDecline=false;
 const searchOffsets=[],requestCursors=[];
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url()),p=url.pathname;
  if(!['127.0.0.1','localhost'].includes(url.hostname))return route.abort();
  if(!p.startsWith('/apisite/')&&p!=='/search/users/results')return route.continue();
  let data,status=200;
  if(p==='/apisite/users/v1/users/authenticated')data={id:31,name:'LocalTester'};
  else if(p==='/apisite/users/v1/users/31')data={id:31,name:'LocalTester'};
  else if(p==='/apisite/users/v1/users/32')data={id:32,name:'OtherLocalTester'};
  else if(p==='/apisite/economy/v1/users/31/currency')data={robux:100,tickets:0};
  else if(p.endsWith('/count'))data={count:p.includes('friend-requests')?pending.length:p.includes('followings')?Number(followed):0};
  else if(p==='/search/users/results'){
   const offset=Number(url.searchParams.get('offset'));searchOffsets.push(offset);assert.equal(url.searchParams.get('limit'),'12');
   const keyword=url.searchParams.get('keyword'),matches=keyword==='Local'?users:[];data={Keyword:keyword,StartIndex:offset,MaxRows:12,TotalResults:matches.length,UserSearchResults:matches.slice(offset,offset+12)};
  }else if(p.endsWith('/friends/statuses'))data={data:users.map(u=>({id:u.UserId,status:u.UserId===101?(requestSent?'RequestSent':'NotFriends'):u.UserId===102?(accepted?'Friends':'RequestReceived'):'NotFriends'}))};
  else if(p.endsWith('/following-exists'))data={followings:[]};
  else if(p==='/apisite/presence/v1/presence/users')data={userPresences:[]};
  else if(p.startsWith('/apisite/thumbnails/'))data={data:[]};
  else if(p.endsWith('/my/friends/requests')){const cursor=Number(url.searchParams.get('cursor')||0),limit=Number(url.searchParams.get('limit'));requestCursors.push({cursor,limit});data={data:pending.slice(cursor,cursor+limit),nextPageCursor:cursor+limit<pending.length?String(cursor+limit):null};}
  else if(/users\/\d+\/decline-friend-request$/.test(p)){
   if(failDecline){status=500;data={errors:[{code:0,message:'Local failure fixture'}]};}else{const id=Number(p.match(/users\/(\d+)/)[1]);declined.push(id);pending=pending.filter(user=>user.id!==id);data={};}
  }else if(p.endsWith('/101/request-friendship')){requestSent=true;data={success:true};}
  else if(p.endsWith('/102/accept-friend-request')){accepted++;data={};}
  else if(p.endsWith('/unfollow')){followed=false;data={};}
  else if(p.endsWith('/followings'))data={data:followed?[{id:201,name:'LocalFollowing'}]:[],nextPageCursor:null};
  else if(p.endsWith('/friends')||p.endsWith('/followers'))data={data:[]};
  else if(p==='/apisite/catalog/v1/search/items'||p==='/apisite/catalog/v1/catalog/items/details')data={data:[]};
  else{report.unsupported.push(p);status=404;data={};}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());});
 const shot=async name=>{await page.screenshot({path:path.join(output,name),fullPage:true});report.screenshots.push({filename:name,url:page.url(),capturedAt:new Date().toISOString(),kind:report.kind});};
 await page.goto('http://127.0.0.1:3000/search/users?keyword=Local',{waitUntil:'networkidle'});
 await page.locator('.player-item').first().waitFor();assert.equal(await page.locator('.player-item').count(),12);
 await page.locator('.top-row .header').filter({hasText:'Player Results for Local'}).waitFor();
 assert.equal(await page.locator('#navigation').count(),1);assert.equal(await page.locator('#header').count(),1);
 await page.locator('.player-item').first().getByRole('button',{name:'Add Friend',exact:true}).click();await page.getByRole('button',{name:'Request Sent',exact:true}).waitFor();
 await page.getByRole('button',{name:'Accept Request',exact:true}).click();await page.getByText('You are friends',{exact:true}).waitFor();assert.equal(accepted,1);
 await shot('search-players-contract-fixture.png');
 await page.locator('.pager-next a').click();await page.getByText('LocalPlayer13',{exact:true}).waitFor();assert(searchOffsets.includes(12));
 await page.locator('.pager-next a').click();await page.getByText('LocalPlayer25',{exact:true}).waitFor();assert.equal(await page.locator('.player-item').count(),1);
 report.checks.push('December controller: 12-card pages, pagination, add/accept friend states, one universal shell');
 const input=page.locator('.search-container input');await input.fill('NoSuch<&User');await input.press('Enter');await page.locator('.no-results').filter({hasText:'There are no matches'}).waitFor();assert.equal(await page.locator('.top-row img').count(),0);report.checks.push('Encoded keyword and original no-results state');
 await page.goto('http://127.0.0.1:3000/users/31/friends#!/friend-requests',{waitUntil:'networkidle'});
 await page.getByText('Friend Requests (105)',{exact:true}).waitFor();assert.equal(await page.locator('.friends-container').count(),18);await shot('friends-requests-contract-fixture.png');
 await page.getByRole('button',{name:'Ignore All',exact:true}).click();await page.getByText('Friend Requests (0)',{exact:true}).waitFor();
 assert.equal(declined.length,105);assert.equal(new Set(declined).size,105);assert(requestCursors.some(p=>p.limit===100&&p.cursor===100));report.checks.push('Ignore All snapshots both pages and declines all 105 without skipped or duplicate mutations');
 await page.locator('#following').click();await page.getByText('LocalFollowing',{exact:true}).waitFor();await page.locator('.avatar-card-menu .rbx-menu-item').click();await page.locator('.popover .friend-unfollow').waitFor();await page.waitForTimeout(250);await shot('friends-following-menu-contract-fixture.png');await page.locator('.popover .friend-unfollow').click();await page.getByText('Following (0)',{exact:true}).waitFor();assert.equal(followed,false);report.checks.push('Original Following menu calls existing unfollow API and refreshes count');
 pending=[{id:2001,name:'LocalFailureRequest'}];failDecline=true;await page.locator('#requests').click();await page.getByText('Friend Requests (1)',{exact:true}).waitFor();await page.getByRole('button',{name:'Ignore All',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(pending.length,1);await page.waitForFunction(()=>!document.querySelector('.ignore-button').disabled);assert.equal(await page.getByRole('button',{name:'Ignore All',exact:true}).isEnabled(),true);report.checks.push('Failed mutation retains request, restores controls and shows error');
 await page.goto('http://127.0.0.1:3000/users/32/friends#!/friend-requests',{waitUntil:'networkidle'});await page.getByText("OtherLocalTester's Friends",{exact:true}).waitFor();assert.equal(await page.locator('#requests').count(),0);assert.equal(await page.locator('.ignore-button:visible').count(),0);report.checks.push('Another profile cannot access request controls');
 await page.goto('http://127.0.0.1:3000/catalog',{waitUntil:'networkidle'});await page.getByText('View All Items',{exact:true}).waitFor();await page.getByText('View All Items',{exact:true}).click();await delay(500);assert(!report.consoleErrors.some(e=>e.includes('langSensitiveCompare')));report.checks.push('Catalog original Intl dependency initialized without comparison error');
 assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(report.unsupported.length,0,report.unsupported.join('\n'));report.passed=true;console.log(JSON.stringify({passed:true,checks:report.checks.length,screenshots:report.screenshots.length}));
}finally{
 if(page&&!report.passed){await page.screenshot({path:path.join(root,'.local/social-failure.png'),fullPage:true}).catch(()=>{});report.failureState=await page.evaluate(()=>{const e=document.querySelector('.page-content[ng-controller],#player-search-page');if(!e)return null;const s=window.angular.element(e).scope();return {pageData:s.pageData,layout:s.layout,currentData:s.currentData,location:location.href};}).catch(()=>null);}
 await writeFile(path.join(output,'browser-contract.json'),JSON.stringify(report,null,2)+'\n');if(browser)await browser.close();try{process.kill(-server.pid,'SIGTERM');}catch{}await log.close();
}
