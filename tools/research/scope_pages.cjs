const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),site=path.join(root,'2016-roblox-main');
const postcss=require(path.join(site,'node_modules/postcss'));
const dir=path.join(site,'public/preserved/2018');
for(const filename of fs.readdirSync(dir).filter(n=>n.endsWith('.original.css'))){
 const css=postcss.parse(fs.readFileSync(path.join(dir,filename),'utf8'));
 css.walkAtRules('import',r=>r.remove());
 css.walkRules(r=>{
  if(r.parent.type==='atrule'&&/keyframes$/i.test(r.parent.name))return;
  r.selectors=r.selectors.map(s=>s.trim()==='html'?'html[data-preserved-2018]':s.trim()==='body'?'#preserved-2018-page':/^(?:body)?\.rbx-body(?=[\s.#[>:]|$)/.test(s)?s.replace(/^(?:body)?\.rbx-body/,'#preserved-2018-page.rbx-body'):'#preserved-2018-page '+s.replace(/^body\s+/,''));
 });
 css.walkDecls(d=>d.value=d.value.replace(/url\((['"]?)(\/(?:images|fonts)\/[^)'"\s]+)\1\)/g,(_,q,url)=>`url(${q}/preserved/2018${url}${q})`));
 const reset=filename==='leanbase.original.css'?'#preserved-2018-page,#preserved-2018-page *:where(:not(.preserved-backend-page,.preserved-backend-page *)){all:revert;font:inherit;color:inherit;box-sizing:inherit;}\n':'';
 fs.writeFileSync(path.join(dir,filename.replace('.original.css','.page.css')),reset+css.toString());
}
