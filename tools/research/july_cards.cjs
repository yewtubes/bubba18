const fs=require('fs'),path=require('path');
const site=path.resolve(__dirname,'../../2016-roblox-main'),dir=path.join(site,'public/preserved/2018');
const postcss=require(path.join(site,'node_modules/postcss'));
const output=postcss.root();
// Retain original selector/declaration text and media conditions; only card,
// rating and icon rules are imported, never the July navigation or page shell.
const relevant=s=>/game-card|vote-(?:bar|thumbs|container|background|percentage|mask|counts|up-count|down-count)|icon-(?:like-gray|dislike-gray)/.test(s);
for(const filename of ['games-july-base.original.css','games-july.original.css']){
 const css=postcss.parse(fs.readFileSync(path.join(dir,filename),'utf8'));
 function select(node){
  if(node.type==='rule'){
   const selectors=node.selectors.filter(relevant);if(!selectors.length)return null;
   const copy=node.clone();copy.selectors=selectors.map(s=>'#preserved-2018-page .july-game-cards '+s);
   copy.walkDecls(d=>d.value=d.value.replace(/url\((['"]?)(\/(?:images|fonts)\/[^)'"\s]+)\1\)/g,(_,q,url)=>`url(${q}/preserved/2018${url}${q})`));return copy;
  }
  if(node.type==='atrule'&&node.nodes){const copy=node.clone({nodes:[]});for(const child of node.nodes){const result=select(child);if(result)copy.append(result);}return copy.nodes.length?copy:null;}
  return null;
 }
 for(const node of css.nodes){const selected=select(node);if(selected)output.append(selected);}
}
fs.writeFileSync(path.join(dir,'games-july-cards.page.css'),output.toString());
