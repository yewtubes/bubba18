import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),output=path.join(root,'docs/evidence/groups-2018');await mkdir(output,{recursive:true});
const log=await open(path.join(root,'.local/group-next.log'),'w');
const server=cp.spawn(process.execPath,['node_modules/next/dist/bin/next','dev','-H','127.0.0.1'],{cwd:path.join(root,'2016-roblox-main'),detached:true,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore',log.fd,log.fd]});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let browser;const report={passed:false,kind:'Retired November reference page with explicit browser API-contract fixtures; not the active December target or a live C# integration',viewport:{width:1366,height:768},sourceBaseCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),worktreeChanged:true,requests:[],errors:[],unsupported:[],screenshots:[]};
try{
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3000/preservation/2018-november-group?gid=900001')).ok){ready=true;break;}}catch{}await delay(500);}assert(ready,'Next.js did not start');
 const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);browser=await chromium.launch({executablePath:path.join(root,'.local/chromium'),args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--disable-gpu']});
 const context=await browser.newContext({viewport:report.viewport,serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url()),p=url.pathname;
  if(!['127.0.0.1','localhost'].includes(url.hostname))return route.abort();
  if(!p.startsWith('/apisite/'))return route.continue();
  report.requests.push(p);let data,status=200;
  if(p==='/apisite/users/v1/users/authenticated'){data={errors:[{code:0,message:'Not authenticated'}]};status=401;}
  else if(p==='/apisite/groups/v1/groups/900001')data={id:900001,name:'Local Group — API contract test',description:'Running recovered November 2018 markup with local browser test data.',memberCount:1,owner:{userId:31,username:'LocalMember'}};
  else if(p.endsWith('/roles'))data={roles:[{id:7,name:'Members',rank:1,memberCount:1}]};
  else if(p.endsWith('/roles/7/users'))data={data:[{userId:31,username:'LocalMember',roleId:7}],nextPageCursor:null};
  else if(p==='/apisite/games/v2/groups/900001/games')data={data:[{id:42,name:'Local Test Place',rootPlace:{id:43},playing:0}]};
  else if(p.endsWith('/wall/posts'))data={data:[{id:1,body:'Local wall post. No historical account data is displayed.',created:'2026-10-27T12:00:00Z',poster:{user:{userId:31,username:'LocalMember'}}}],nextPageCursor:null};
  else if(p.startsWith('/apisite/thumbnails/'))data={data:[]};
  else{report.unsupported.push(p);data={};status=404;}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto('http://127.0.0.1:3000/preservation/2018-november-group?gid=900001',{waitUntil:'networkidle'});
 await page.locator('.right-col h2').filter({hasText:'Local Group'}).waitFor();
 assert.equal((await page.locator('.GroupPlace .PlaceName').textContent()).trim(),'Local Test Place');assert.equal(await page.locator('.GroupWall_PostContainer').textContent(),'Local wall post. No historical account data is displayed.');
 const logo=await page.locator('.GroupThumbnail img').boundingBox();assert.equal(logo.width,150);assert.equal(logo.height,150);report.originalLogoDimensionsPreserved=true;
 assert.equal(await page.locator('input[type=hidden]').count(),0);assert(!await page.locator('#Body').textContent().then(t=>t.includes('Badimo')||t.includes('asimo3089')));
 for(const [tab,name] of [['Games','games'],['Members','members']]){
  await page.locator('#GroupsPeople_'+tab).click();await page.waitForTimeout(300);
  if(tab==='Members')assert.equal((await page.locator('.GroupMember .NameText').textContent()).trim(),'LocalMember');
  const filename='group-'+name+'-contract-fixture.png';await page.screenshot({path:path.join(output,filename),fullPage:true});report.screenshots.push({filename,url:page.url(),capturedAt:new Date().toISOString(),kind:report.kind});
 }
 await page.locator('#GroupsPeople_Allies').click();await page.getByRole('status').filter({hasText:'not connected'}).waitFor();
 assert.equal(report.errors.length,0);assert.equal(report.unsupported.length,0);report.passed=true;
 console.log(JSON.stringify({passed:true,screenshots:report.screenshots.length,apiContracts:new Set(report.requests).size}));
}finally{await writeFile(path.join(output,'browser-contract.json'),JSON.stringify(report,null,2)+'\n');if(browser)await browser.close();try{process.kill(-server.pid,'SIGTERM');}catch{}await log.close();}
