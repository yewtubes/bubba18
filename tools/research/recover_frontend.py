#!/usr/bin/env python3
"""Recover immutable dated documents and their original page resources."""
import concurrent.futures,gzip,hashlib,json,re,urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2];PUBLIC=ROOT/'2016-roblox-main/public/preserved/2018';RAW=ROOT/'docs/research/raw';GENERATED=ROOT/'2016-roblox-main/components/preserved2018'
for p in [PUBLIC,RAW,GENERATED]:p.mkdir(parents=True,exist_ok=True)
TARGETS={
 'games':('20181215050530','https://www.roblox.com/games'),
 'catalog':('20181215050553','https://www.roblox.com/catalog/'),
 'profile':('20181211024059','https://www.roblox.com/users/1/profile/'),
 'create':('20181215050606','https://www.roblox.com/create'),
 'game':('20181216234642','https://www.roblox.com/games/606849621/Jailbreak'),
 'item':('20181020230720','https://www.roblox.com/catalog/1029025/The-Classic-ROBLOX-Fedora'),
 'robux':('20181120030543','https://www.roblox.com/upgrades/robux'),
 'login':('20181215050556','https://www.roblox.com/NewLogin?ReturnUrl=%2fmy%2favatar'),
}
manifest={'target':'October–December 2018','sources':[]};pages={}
existing=ROOT/'docs/research/source-manifest.json'
if existing.exists():manifest=json.loads(existing.read_text())
def fetch(url):
 with urllib.request.urlopen(url,timeout=30) as r:
  data=r.read();data=gzip.decompress(data) if data[:2]==b'\x1f\x8b' else data
  return data,r.url,r.headers.get('Memento-Datetime')
def preserve(url,data,final,date,kind):
 digest=hashlib.sha256(data).hexdigest();ext='.css' if kind=='css' else '.html' if kind=='document' else '.bin';relative='docs/research/raw/'+digest+ext;(ROOT/relative).write_bytes(data)
 record={'url':url,'retrieved_url':final,'filename':Path(relative).name,'description':kind,'claimed_date':None,'independently_verified_date':date,'source_type':kind,'retrieval_status':'retrieved','content_hash':digest,'local_path':relative,'helps_restore':[]}
 if not any(e['url']==url for e in manifest['sources']):manifest['sources'].append(record)
 return record
def clean(node):
 for element in node.select('script,iframe,noscript'):element.decompose()
 for element in node.find_all(True):
  for attr in list(element.attrs):
   if attr.startswith('on'):del element[attr]
  for attr in ['src','href']:
   if attr not in element.attrs:continue
   v=element.get(attr,'');v=re.sub(r'^https?://(?:www|web)\.roblox\.com','',v)
   if v.startswith('javascript:'):element.attrs.pop(attr,None)
   else:element[attr]=v
 return str(node)
for name,(stamp,origin) in TARGETS.items():
 url='https://web.archive.org/web/'+stamp+'id_/'+origin
 try:
  data,final,date=fetch(url)
  actual=re.search(r'/web/(\d{14})',final)
  if not actual or actual[1]!=stamp:raise ValueError('Unexpected capture: '+final)
  record=preserve(url,data,final,date,'document');record['helps_restore']=[name]
  soup=BeautifulSoup(data,'html5lib');content=soup.select_one('.content')
  if content is None:raise ValueError('Capture has no page content')
  pages[name]={'html':clean(content),'captureDate':stamp,'url':final}
  if name=='games':
   pages['header']=clean(soup.select_one('#header'));footer=soup.select_one('.container-footer');pages['footer']=clean(footer) if footer else ''
  if name=='profile':pages['gameCard']=str(soup.select_one('.game-card'))
  if name=='item':pages['confirmation']=clean(soup.select_one('#modal-confirmation'))
  cssurl=next(x['href'] for x in soup.select('link[rel=stylesheet]') if '/css/page_' in x['href'])
  css,cssfinal,_=fetch(cssurl);preserve(cssurl,css,cssfinal,date,'css');(PUBLIC/(name+'.original.css')).write_bytes(css)
  if not (PUBLIC/'leanbase.original.css').exists():
   baseurl=next(x['href'] for x in soup.select('link[rel=stylesheet]') if '/css/leanbase_' in x['href']);css,cssfinal,_=fetch(baseurl);preserve(baseurl,css,cssfinal,date,'css');(PUBLIC/'leanbase.original.css').write_bytes(css)
  print('Recovered',name,stamp,flush=True)
 except Exception as error:
  manifest['sources'].append({'url':url,'source_type':'document','retrieval_status':'failed','error':str(error),'claimed_date':None,'independently_verified_date':None,'content_hash':None});print('Blocked',name,str(error),flush=True)
(GENERATED/'pages.generated.json').write_text(json.dumps(pages,indent=2)+'\n');manifest['source_count']=len(manifest['sources']);existing.parent.mkdir(parents=True,exist_ok=True);existing.write_text(json.dumps(manifest,indent=2)+'\n')
# Preserve genuine CSS-referenced images and fonts separately from page markup.
urls=set()
for p in PUBLIC.glob('*.original.css'):
 for url in re.findall(r'url\([\"\']?([^\)\"\']+)',p.read_text()):
  if url.startswith(('/images/','/fonts/')):urls.add(url.split('?')[0])
def asset(url):
 target=PUBLIC/url.lstrip('/');target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists():return
 try:
  data,_,_=fetch('https://web.archive.org/web/20181215050530id_/https://www.roblox.com'+url)
  if url.endswith('.svg') and b'<svg' not in data[:1000]:return
  if data.lstrip().lower().startswith((b'<!doctype html',b'<html')):return
  target.write_bytes(data)
 except Exception:pass
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(asset,urls))
print('Recovered pages:',list(TARGETS.keys() & pages.keys()),flush=True)
