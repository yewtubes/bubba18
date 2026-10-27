import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

// Reference screenshots render the preserved document with its unscoped original
// CSS. No contemporary scripts or remote requests are allowed in this harness.
export async function compareHistorical({context,root,output,origin}) {
  const manifest=JSON.parse(await readFile(path.join(root,'docs/research/source-manifest.json'),'utf8'));
  const captures=JSON.parse(await readFile(path.join(root,'2016-roblox-main/components/preserved2018/pages.generated.json'),'utf8'));
  const images=JSON.parse(await readFile(path.join(root,'docs/research/page-image-sources.json'),'utf8'));
  const results={viewport:{width:1366,height:768},method:'Original archived document and original unscoped CSS versus adapted running page; stable geometry and typography only. This is not full pixel or interaction parity.',pages:[]};
  const reference=context.newPage(),implementation=context.newPage();
  const selectors=['#header','.rbx-navbar','#navbar-search-input','#navbar-search-btn','.container-main','.content','.content h1','.content h2','.content h3','.container-footer','.container-footer a'];
  const measure=page=>page.evaluate(selectors=>Object.fromEntries(selectors.map(selector=>{
    const e=document.querySelector(selector);if(!e)return [selector,null];
    const r=e.getBoundingClientRect(),s=getComputedStyle(e);
    return [selector,{x:r.x,y:r.y,width:r.width,height:r.height,fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,backgroundColor:s.backgroundColor}];
  })),selectors);
  const refPage=await reference,localPage=await implementation;
  await context.route('**/preserved/2018/*.original.css',async route=>{
    const filename=path.basename(new URL(route.request().url()).pathname);
    const css=await readFile(path.join(root,'2016-roblox-main/public/preserved/2018',filename),'utf8');
    await route.fulfill({contentType:'text/css',body:css.replace(/url\((['"]?)(\/(?:images|fonts)\/[^)'"\s]+)\1\)/g,(_,q,url)=>`url(${q}/preserved/2018${url}${q})`)});
  });
  try {
    for(const [name,route] of [['games','/games'],['create','/create'],['robux','/robux.aspx']]) {
      const capture=captures[name],record=manifest.sources.find(s=>s.source_type==='document'&&s.retrieval_status==='retrieved'&&s.retrieved_url===capture.url);
      if(!record)throw new Error('Missing immutable reference: '+name);
      let html;
      const relative=record.local_path||'docs/research/raw/'+record.filename;
      try{html=await readFile(path.join(root,relative),'utf8');}
      catch{
        try{html=await readFile(path.join(process.env.BUBBABLOX_HISTORICAL_CAPTURE_DIR||path.join(root,'.local/publication-originals'),relative),'utf8');}
        catch{results.pages.push({name,status:'blocked',referenceUrl:capture.url,reason:'Raw historical captures are private. Recover authorized originals locally before reference comparison.'});continue;}
      }
      html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi,'');
      html=html.replace(/<head\b[^>]*>[\s\S]*?(?:<\/head\s*>|(?=<body\b))/i,`<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/preserved/2018/leanbase.original.css"><link rel="stylesheet" href="/preserved/2018/${name}.original.css"></head>`);
      for(const image of images.filter(s=>s.retrieval_status==='retrieved'))html=html.split(image.url).join('/'+image.local_path.split('/public/')[1]);
      const refUrl=origin+'/__historical-reference/'+name;
      await context.route(refUrl,handler=>handler.fulfill({contentType:'text/html',body:html}));
      await refPage.goto(refUrl,{waitUntil:'domcontentloaded'});
      await localPage.goto(origin+route,{waitUntil:'domcontentloaded'});
      await Promise.all([refPage.evaluate(()=>document.fonts.ready),localPage.evaluate(()=>document.fonts.ready)]);
      if(!await refPage.evaluate(()=>getComputedStyle(document.body).fontFamily.includes('Source Sans Pro')))throw new Error('Historical reference CSS did not load: '+name);
      await localPage.waitForTimeout(1000);
      const [original,adapted]=await Promise.all([measure(refPage),measure(localPage)]);
      const checks=[];
      // Dynamic game cards and missing archive media alter content height. Keep
      // those differences visible in evidence, but don't mistake them for a
      // navigation or page-width match.
      for(const selector of selectors.filter(s=>original[s]||adapted[s]))for(const property of ['x','width','fontFamily','fontSize','fontWeight','backgroundColor',...(['#header','#navbar-search-input','#navbar-search-btn'].includes(selector)?['y','height']:[])]) {
        const a=original[selector]?.[property],b=adapted[selector]?.[property];
        checks.push({selector,property,reference:a,implementation:b,matches:typeof a==='number'&&typeof b==='number'?Math.abs(a-b)<=1:a===b});
      }
      const filename='historical-reference-'+name+'.png';await refPage.screenshot({path:path.join(output,filename)});
      results.pages.push({name,referenceUrl:capture.url,referenceHash:record.content_hash,captureDate:capture.captureDate,renderedAt:new Date().toISOString(),referenceScreenshot:filename,implementationScreenshot:name==='robux'?'robux.aspx.png':name+'.png',original,adapted,checks,matched:checks.filter(c=>c.matches).length,total:checks.length});
    }
  } finally {await refPage.close();await localPage.close();}
  await writeFile(path.join(output,'historical-comparison.json'),JSON.stringify(results,null,2)+'\n');
  return results;
}
