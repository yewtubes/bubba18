const fs=require('fs'),path=require('path'),site=path.resolve(__dirname,'../../2016-roblox-main'),postcss=require(path.join(site,'node_modules/postcss')),dir=path.join(site,'public/preserved/2018'),out=postcss.root();
for(const name of ['group-base','group']){
 const css=postcss.parse(fs.readFileSync(path.join(dir,name+'.original.css'),'utf8'));
 css.walkAtRules('import',n=>n.remove());css.walkRules(rule=>{if(rule.parent.type==='atrule'&&/keyframes/.test(rule.parent.name))return;rule.selectors=rule.selectors.map(s=>'#preserved-2018-page .group-document'+(s==='body'||s==='html'?'':' '+s.replace(/^body\s+/,'')));});
 css.walkDecls(d=>d.value=d.value.replace(/url\((['"]?)(\/?(?:\.\.\/)?images\/[^)'"\s]+)\1\)/g,(_,q,url)=>`url(${q}/preserved/2018/${url.replace(/^\/?(?:\.\.\/)?/,'')}${q})`));out.append(css.nodes);
}
fs.writeFileSync(path.join(dir,'group.page.css'),out.toString());
