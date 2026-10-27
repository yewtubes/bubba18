#!/usr/bin/env python3
"""Recover the December search client. Raw account documents remain private."""
import ast,gzip,hashlib,json,re,urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2];PUB=ROOT/'2016-roblox-main/public/preserved/2018';GEN=ROOT/'2016-roblox-main/components/preserved2018'
CAPTURE='https://web.archive.org/web/20181203064802id_/https://www.roblox.com/search/users'
def fetch(url):
 with urllib.request.urlopen(url,timeout=30) as r:data,final=r.read(),r.url
 return (gzip.decompress(data) if data[:2]==b'\x1f\x8b' else data),final
raw,final=fetch(CAPTURE)
if '/web/20181203064802' not in final:raise ValueError('Different capture: '+final)
private=ROOT/'.local/research';private.mkdir(parents=True,exist_ok=True);(private/'search-20181203.html').write_bytes(raw)
doc=BeautifulSoup(raw,'html5lib');content=doc.select_one('.content')
for e in content.select('script,iframe,noscript'):e.decompose()
for e in content.find_all(True):
 for a in list(e.attrs):
  if a.startswith(('on','data-')) or a in ('src','href'):del e[a]
urls={
 'search.original.css':'https://static.rbxcdn.com/css/page___5760a763b80b19e192bc1cbdd4038dcd_m.css/fetch',
 'search-bundle.original.js':'https://js.rbxcdn.com/f482dc6b768a9aeedeb33278107cfcd8.js.gzip',
 'search-templates.original.js':'https://js.rbxcdn.com/3c994e99d57381cb2dc35d2fb6aa5646.js.gzip'}
sha=lambda data:hashlib.sha256(data).hexdigest()
records=[{'url':CAPTURE,'retrieved_url':final,'filename':'search-20181203.html','description':'Public player search; raw original withheld, structural template published','claimed_date':None,'independently_verified_date':'2018-12-03T06:48:02Z','source_type':'document','retrieval_status':'retrieved-private-original','content_hash':sha(raw),'helps_restore':['search/users']}]
for filename,url in urls.items():
 if not any(e.get('src')==url or e.get('href')==url for e in doc.select('script,link')):raise ValueError('Unreferenced resource: '+url)
 data,resolved=fetch(url);(PUB/filename).write_bytes(data)
 records.append({'url':url,'retrieved_url':resolved,'filename':filename,'description':'Original resource referenced by December 3 capture','claimed_date':None,'independently_verified_date':None,'referenced_by_capture':'2018-12-03T06:48:02Z','source_type':'css' if filename.endswith('.css') else 'script','retrieval_status':'retrieved','content_hash':sha(data),'local_path':str((PUB/filename).relative_to(ROOT)),'helps_restore':['search/users']})
parts=re.split(r'(?=;// )',(PUB/'search-bundle.original.js').read_text())
names=['common/directives/paginationDirective.js','playerSearch/constants/cardLabels.js','playerSearch/constants/playerSearchConstants.js','playerSearch/controllers/playerSearchController.js']
selected=[p for p in parts if p.startswith(';// ~/viewapp/') and any(n in p.split('\n',1)[0] for n in names)]
if len(selected)!=4:raise ValueError('Controller extraction failed')
(PUB/'search-runtime.original.js').write_text('// Original registrations with a local module registration wrapper.\nwindow.registerPreservedPlayerSearch=function(playerSearch,robloxApp){\n'+'\n'.join(selected)+'\n};\n')
templates={json.loads(m[1]):json.loads(m[2]) for m in re.finditer(r'\$templateCache\.put\(("(?:\\.|[^"\\])*"),\s*("(?:\\.|[^"\\])*")\)',(PUB/'search-templates.original.js').read_text())}
section=next(p for p in parts if p.startswith(';// ~/Generated/js/Roblox_TranslationResources_Feature_PlayerSearchResultsResources_en_us_standard.js'))
locale={m[1]:ast.literal_eval(m[2]) for m in re.finditer(r'"([^"]+)":("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')',section)}
(GEN/'search.generated.json').write_text(json.dumps({'html':str(content),'templates':templates,'locale':locale,'url':CAPTURE,'captureDate':'20181203064802','originalHash':sha(raw)},indent=2)+'\n')
base_url=next(e['src'] for e in doc.select('script[src]') if e.get('data-bundlename')=='leanbase');base,_=fetch(base_url)
utilities=[p for p in re.split(r'(?=;// )',base.decode()) if p.startswith((';// extensions/string.js',';// intl/intl.js'))]
if len(utilities)!=2:raise ValueError('Utilities extraction failed')
(PUB/'intl-string.original.js').write_text('\n'.join(utilities))
records.append({'url':base_url,'filename':'intl-string.original.js','description':'Original Intl and String sections from December referenced leanbase','claimed_date':None,'independently_verified_date':None,'referenced_by_capture':'2018-12-03T06:48:02Z','source_type':'script','retrieval_status':'retrieved-selected-sections','content_hash':sha(base),'derived_content_hash':sha((PUB/'intl-string.original.js').read_bytes()),'helps_restore':['search/users','catalog']})
manifest_path=ROOT/'docs/research/source-manifest.json';manifest=json.loads(manifest_path.read_text());known={r['url'] for r in records};manifest['sources']=[r for r in manifest['sources'] if r['url'] not in known]+records;manifest['source_count']=len(manifest['sources']);manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print('Recovered December search document, templates, controller, CSS and Intl/String dependencies.')
