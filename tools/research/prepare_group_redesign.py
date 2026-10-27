#!/usr/bin/env python3
"""Recover component templates; explicitly distinguish later resources from 2018 evidence."""
import ast,hashlib,json,re,urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2];PRIVATE=ROOT/'.local/research';GEN=ROOT/'2016-roblox-main/components/preserved2018';PUB=ROOT/'2016-roblox-main/public/preserved/2018'
SOURCES={
 'redesign-bundle':'https://js.rbxcdn.com/1aeb2d6aeb60919539349ce9b2b4eee64e86e83219b2e5af45a28e99d10ccb78.js',
 'redesign-css':'https://static.rbxcdn.com/css/efe935ba9b5f7eec75775966e936952cf1b0295731d665a550a71db864fa84ed.css/fetch',
 'redesign-page':'https://js.rbxcdn.com/d5485aec6ae7827ee9ac58afa8307b8d.js.gzip',
 'thumbnail-components':'https://js.rbxcdn.com/7f873aa886b95df8dca20e68b86766e76fb0367664f5b479d91b7c1f49c8cf28.js',
 'redesign-angularcss':'https://static.rbxcdn.com/css/e3a341febe3b8871291bbd49425371fb533cab903374592a92d4ccc6cd0ed325.css/fetch'}
import gzip
PRIVATE.mkdir(parents=True,exist_ok=True)
for name,url in SOURCES.items():
 p=PRIVATE/(name+'.raw')
 if not p.exists():
  with urllib.request.urlopen(url,timeout=30) as r:b=r.read()
  if b[:2]==b'\x1f\x8b':b=gzip.decompress(b)
  p.write_bytes(b)
bundle=(PRIVATE/'redesign-bundle.raw').read_text();templates={}
keep={'group-base','group-about','groups-list','groups-list-item','group-members-list','group-wall','group-comments','group-games','group-games-item','group-store','group-store-item','group-affiliates','group-menu-popover','leave-group-modal','rbx-cursor-pagination'}
for m in re.finditer(r'\$templateCache\.put\(("(?:\\.|[^"\\])*"),\s*("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')\)',bundle):
 key=json.loads(m[1])
 if key in keep:templates[key]=ast.literal_eval(m[2])
assert len(templates)==len(keep)
# Restore the four-tab December beta arrangement shown in the user reference.
# The recovered May templates otherwise move Games into About (a Jan 2019 change).
soup=BeautifulSoup(templates['group-base'],'html5lib');tabs=soup.select_one('#horizontal-tabs');games=BeautifulSoup(str(tabs.select_one('#store')),'html5lib').select_one('li');games['id']='games';games['ui-sref']='games';games['ng-class']="{'active': Data.activeTab === 'games'}";games.select_one('span')['ng-bind']="'Heading.Games' | translate";tabs.select_one('#store').insert_after(games)
aff=tabs.select_one('#affiliates');aff['ng-class']="{'active': Data.activeTab === 'affiliates'}"
for e in soup.select('[ng-if]'):
 if e.get('ng-if')=='Data.activeTab === groupConstants.currentTab[3]':e['ng-if']="Data.activeTab === 'affiliates'"
anchor=soup.select_one('[group-about]');extra=soup.new_tag('div');extra['ng-if']="Data.activeTab === 'games'";extra['group-games']='';anchor.insert_after(extra);templates['group-base']=''.join(str(e) for e in soup.body.contents)
soup=BeautifulSoup(templates['group-about'],'html5lib')
for e in soup.select('[group-games],group-payouts,social-links-container,social-link-icon-list'):e.decompose()
templates['group-about']=''.join(str(e) for e in soup.body.contents)
soup=BeautifulSoup(templates['group-members-list'],'html5lib');soup.select_one('h3')['ng-bind']="('Heading.Members' | translate) + ' (' + $ctrl.numGroupMembers + ')'";templates['group-members-list']=''.join(str(e) for e in soup.body.contents)
page=(PRIVATE/'redesign-page.raw').read_text();section=next(p for p in re.split(r'(?=;// )',page) if p.startswith(';// ~/Generated/js/Roblox_TranslationResources_Feature_GroupsResources_en_us_standard.js'))
locale={m[1]:ast.literal_eval(m[2]) for m in re.finditer(r'"([^"]+)":("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')',section)}
thumb=(PRIVATE/'thumbnail-components.raw').read_text();m=re.search(r"e\.exports=('(?:\\.|[^'\\])*<span(?:\\.|[^'\\])*')",thumb)
# Find the exact original thumbnail template literal without the other modules.
m=re.search(r"e\.exports=('<span(?:\\.|[^'\\])*')",thumb);templates['2d-thumbnail']=ast.literal_eval(m[1])
locale['Label.CurrentPage']='Page {currentPage}' # Label visible in the supplied December reference.
result={'templates':templates,'locale':locale,'sourceCapture':'https://web.archive.org/web/20190524130808id_/https://www.roblox.com/groups/199219/Vortex-Security','resourceDate':'2019-05-24','targetEvidence':'https://devforum.roblox.com/t/new-group-details-page-is-live/210819','targetBetaDate':'2018-12-13','notes':'Later recovered component family, adapted to the user-supplied December beta layout. Exact December bundle not recovered; do not represent these resources as dated 2018 originals.'}
(GEN/'group-redesign.generated.json').write_text(json.dumps(result,indent=2)+'\n');(PUB/'group-redesign.original.css').write_bytes((PRIVATE/'redesign-angularcss.raw').read_bytes()+b'\n'+(PRIVATE/'redesign-css.raw').read_bytes())
manifest_path=ROOT/'docs/research/source-manifest.json';manifest=json.loads(manifest_path.read_text());records=[]
for name,url in SOURCES.items():
 b=(PRIVATE/(name+'.raw')).read_bytes();records.append({'url':url,'filename':name+'.raw','description':'Later original redesigned Groups component resource; exact December version unrecovered','claimed_date':None,'independently_verified_date':None,'referenced_by_capture':'2019-05-24T13:08:08Z','source_type':'css' if name.endswith('css') else 'script','retrieval_status':'retrieved-private-original-selected-templates-published' if not name.endswith('css') else 'retrieved','content_hash':hashlib.sha256(b).hexdigest(),'helps_restore':['groups-redesign'],'historical_limit':'2019 resource; target placement supported by Dec 13 beta announcement and supplied screenshot'})
manifest['sources']=[r for r in manifest['sources'] if r['url'] not in SOURCES.values()]+records;manifest['source_count']=len(manifest['sources']);manifest_path.write_text(json.dumps(manifest,indent=2)+'\n');print('Extracted original redesigned component templates; retained explicit 2019 resource provenance.')
