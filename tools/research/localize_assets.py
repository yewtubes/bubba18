#!/usr/bin/env python3
import concurrent.futures,gzip,hashlib,json,urllib.request
from pathlib import Path
from urllib.parse import urlsplit
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2];PUB=ROOT/'2016-roblox-main/public/preserved/2018';GEN=ROOT/'2016-roblox-main/components/preserved2018';pages=json.loads((GEN/'pages.generated.json').read_text());targets={};records=[]
for kind in ['create','robux']:
 soup=BeautifulSoup(pages[kind]['html'],'html.parser')
 for img in soup.select('img[src]'):
  url=img['src']
  if not url.startswith(('http://','https://')):continue
  name=urlsplit(url).path.rsplit('/',1)[-1].removesuffix('.gzip');local='/preserved/2018/assets/'+name;targets[url]=(PUB/'assets'/name,local);img['src']=local
 pages[kind]['html']=str(soup)
def recover(item):
 url,(file,local)=item;file.parent.mkdir(exist_ok=True)
 for source in [url,'https://web.archive.org/web/20181215050530id_/'+url]:
  try:
   with urllib.request.urlopen(source,timeout=20) as r:data=r.read();data=gzip.decompress(data) if data[:2]==b'\x1f\x8b' else data
   if data.lstrip().lower().startswith((b'<!doctype html',b'<html')):continue
   file.write_bytes(data);return {'url':url,'retrieved_url':source,'retrieval_status':'retrieved','content_hash':hashlib.sha256(data).hexdigest(),'local_path':str(file.relative_to(ROOT)),'independently_verified_date':None,'source_type':'page-image','helps_restore':['create','robux']}
  except Exception:continue
 return {'url':url,'retrieval_status':'failed','content_hash':None,'source_type':'page-image'}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:records=list(pool.map(recover,targets.items()))
(GEN/'pages.generated.json').write_text(json.dumps(pages,indent=2)+'\n');(ROOT/'docs/research/page-image-sources.json').write_text(json.dumps(records,indent=2)+'\n');print('Localized',sum(r['retrieval_status']=='retrieved' for r in records),'of',len(records),'original page images')
