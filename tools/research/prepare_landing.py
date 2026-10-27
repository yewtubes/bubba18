#!/usr/bin/env python3
"""Adapt the actual Dec 22 AuthSite landing client, retaining raw captures privately."""
import concurrent.futures,gzip,hashlib,json,re,urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2];PRIVATE=ROOT/'.local/research';PUB=ROOT/'api/public/Data/preserved/2018/landing';PUB.mkdir(parents=True,exist_ok=True)
CAPTURE='https://web.archive.org/web/20181222022938id_/https://www.roblox.com/'
SOURCES={
'html':('templates.original.js','https://web.archive.org/web/20181222212216id_/https://js.rbxcdn.com/ae4f6b9c4a503fbd2b3c6390d54bd678.js.gzip'),
'js':('auth.original.js','https://web.archive.org/web/20181222212217id_/https://js.rbxcdn.com/54076066a9da102068d6f476f810612a.js.gzip'),
'lang':('language.original.js','https://web.archive.org/web/20181222212217id_/https://js.rbxcdn.com/c208fa9aa4f1077a8a1db7b022d7506d.js.gzip'),
'css':('auth.original.css','https://web.archive.org/web/20181222212214id_/https://static.rbxcdn.com/css/authAppCss___fee3ee9cbd451b4e0a9887686bb59b16_a9153727-1076-4e5a-a7df-d45894d70a19_m.css/fetch'),
'base-css':('base.original.css','https://static.rbxcdn.com/css/leanbase___0a74352b50a8582305046755be00a87e_m.css/fetch'),
'page-css':('page.original.css','https://static.rbxcdn.com/css/page___ebadf6c083396ada1e0d5d4aaa956666_m.css/fetch'),
'page':(None,'https://js.rbxcdn.com/7d03d65a460ad98e2b2bf61267f6dc3b.js.gzip')}
sha=lambda b:hashlib.sha256(b).hexdigest()
def fetch(url):
 with urllib.request.urlopen(url,timeout=40) as r:b,final=r.read(),r.url
 return (gzip.decompress(b) if b[:2]==b'\x1f\x8b' else b),final
records=[]
for name,(filename,url) in SOURCES.items():
 raw=PRIVATE/('landing-'+name+'.raw')
 if not raw.exists():raw.write_bytes(fetch(url)[0])
 b=raw.read_bytes()
 if filename:(PUB/filename).write_bytes(b)
 date=re.search(r'/web/(\d{14})',url)
 records.append({'url':url,'filename':filename or raw.name,'description':'Original December AuthSite landing resource','claimed_date':None,'independently_verified_date':date[1] if date else None,'referenced_by_capture':'2018-12-22T02:29:38Z','source_type':'css' if 'css' in name else 'script','retrieval_status':'retrieved' if filename else 'retrieved-private-selected-sections-published','content_hash':sha(b),'helps_restore':['landing']})
# Original CSS values are unchanged. Only local resource addresses are adapted.
paths=set()
for name,(filename,url) in SOURCES.items():
 if 'css' not in name:continue
 s=(PUB/filename).read_text()
 paths.update(re.findall(r'url\([\"\']?(/[^)\"\']+)',s))
 s=re.sub(r'url\(([\"\']?)(/[^)\"\']+)\1\)',lambda m:'url('+m[1]+'/preserved/2018/landing/assets'+m[2]+m[1]+')',s)
 (PUB/filename.replace('.original.','.local.')).write_text(s)

def asset(p):
 clean=p.split('#')[0];dest=PUB/'assets'/clean.lstrip('/');meta=PRIVATE/('landing-asset-'+sha(clean.encode())+'.json')
 if dest.exists() and meta.exists():return json.loads(meta.read_text())
 url='https://web.archive.org/web/20181222id_/https://static.rbxcdn.com'+clean if clean.startswith('/images/') else 'https://static.rbxcdn.com'+clean
 try:
  b,final=fetch(url)
  if b[:30].lower().startswith((b'<!doctype',b'<html')):raise ValueError('Not an asset')
  dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
  date=re.search(r'/web/(\d{14})',final)
  record={'url':url,'retrieved_url':final,'filename':dest.name,'local_path':str(dest.relative_to(ROOT)),'description':'Original landing CSS dependency','claimed_date':None,'independently_verified_date':date[1] if date else None,'referenced_by_capture':'2018-12-22T02:29:38Z','source_type':'font' if '/fonts/' in p else 'image','retrieval_status':'retrieved','content_hash':sha(b),'helps_restore':['landing']}
 except Exception as e:record={'url':url,'filename':dest.name,'source_type':'asset','retrieval_status':'unavailable','error':str(e),'helps_restore':['landing']}
 meta.write_text(json.dumps(record));print(record['retrieval_status'],clean,flush=True);return record
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:records+=list(pool.map(asset,sorted(paths)))
# Guard the standalone login bootstrap; landing bootstraps its own nested login.
s=(PUB/'auth.original.js').read_text();needle='angular.bootstrap("#login-container",["robloxApp","authAppHtmlTemplateApp","login"])';assert needle in s
(PUB/'auth.local.js').write_text(s.replace(needle,'document.querySelector("#login-container")&&!document.querySelector("#landing-container")&&'+needle))
page=(PRIVATE/'landing-page.raw').read_text();parts=re.split(r'(?=;// )',page)
names=['common/constants/phoneConstants.js','common/services/phoneService.js','FormValidator.js','SignupFormValidatorGeneric.js','Landing/RollerCoaster/RollerCoaster.js','Signup/Signup.js']
selected=[p for p in parts if any(p.split('\n',1)[0].strip().endswith(n) for n in names)]
assert len(selected)==len(names),[p[:100] for p in selected]
(PUB/'widgets.original.js').write_text('\n'.join(selected))
raw=PRIVATE/'landing-web.raw'
if not raw.exists():raw.write_bytes(fetch(CAPTURE)[0])
doc=BeautifulSoup(raw.read_bytes(),'html5lib');landing=doc.select_one('#landing-container');footer=doc.select_one('footer')
for e in footer.select('a[href]'):
 e['href']=re.sub(r'^https?://(?:www|web)\.roblox\.com','',e['href'])
# Independent backend has no Roblox production captcha; its own verification is enforced.
base=landing.select_one('[landing-base]');base['is-always-captcha-login-enabled']='false';base['is-login-fun-captcha-enabled']='false'
html='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>BubbaBlox</title><meta name="description" content="Independent BubbaBlox preservation project. December 2018 landing client.">'''
for css in ['base.local.css','page.local.css','auth.local.css']:html+='<link rel="stylesheet" href="/preserved/2018/landing/'+css+'">'
html+='</head><body class="rbx-body" id="rbx-body" data-internal-page-name="Landing">'+str(landing)+str(footer)
for js in ['vendor/jquery.js','vendor/bootstrap.js','vendor/angular.js','vendor/angular-sanitize.js']:html+='<script src="/preserved/2018/'+js+'"></script>'
for js in ['adapter.js','language.original.js','widgets.original.js','templates.original.js','auth.local.js']:html+='<script src="/preserved/2018/landing/'+js+'"></script>'
html+='</body></html>\n';(ROOT/'api/public/Data/index.html').write_text('\n'.join(line.rstrip() for line in html.splitlines())+'\n')
records.append({'url':CAPTURE,'filename':'landing-web.raw','description':'Actual December landing document; immutable original private, structural adaptation at api/public/Data/index.html','claimed_date':None,'independently_verified_date':'2018-12-22T02:29:38Z','source_type':'document','retrieval_status':'retrieved-private-original','content_hash':sha(raw.read_bytes()),'helps_restore':['landing']})
manifest_path=ROOT/'docs/research/source-manifest.json';manifest=json.loads(manifest_path.read_text());known={r['url'] for r in records};manifest['sources']=[r for r in manifest['sources'] if r['url'] not in known]+records;manifest['source_count']=len(manifest['sources']);manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print('Landing prepared; unavailable dependencies:',sum(r['retrieval_status']=='unavailable' for r in records))
