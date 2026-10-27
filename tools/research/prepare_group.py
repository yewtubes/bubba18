"""Adapt the dated public group document; never publish raw account hydration."""
import json,gzip,hashlib,urllib.request,re
from pathlib import Path
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[2];private=root/'.local/research';private.mkdir(parents=True,exist_ok=True)
url='https://web.archive.org/web/20181117045512id_/https://www.roblox.com/Groups/Group.aspx?gid=3059674'
source=root.parent/'research-private/group.html'
if not source.exists():
 with urllib.request.urlopen(url,timeout=30) as r:data=r.read();assert '/20181117045512' in r.url
else:data=source.read_bytes()
if data[:2]==b'\x1f\x8b':data=gzip.decompress(data)
(private/'group-20181117.html').write_bytes(data)
s=BeautifulSoup(data,'html5lib');body=s.select_one('#Body');assert body
pub=root/'2016-roblox-main/public/preserved/2018';gen=root/'2016-roblox-main/components/preserved2018'
for key,href in [('group-base',s.select('link[rel=stylesheet]')[0]['href']),('group',s.select('link[rel=stylesheet]')[1]['href'])]:
 with urllib.request.urlopen(href,timeout=30) as r:css=r.read()
 if css[:2]==b'\x1f\x8b':css=gzip.decompress(css)
 (pub/(key+'.original.css')).write_bytes(css)
for e in body.select('script,iframe,noscript,input[type=hidden],.bcOverlay,.OnlineStatus img'):e.decompose()
for e in body.find_all(True):
 for key in list(e.attrs):
  if key.startswith('on') or key.startswith('data-') or key in ['name','title']:del e[key]
 if e.get('href'):e.attrs.pop('href')
 if e.name=='img':
  e.attrs.pop('src',None);e['alt']=''
  # The shared all:revert reset overrides HTML presentational hints. Preserve
  # the capture's explicit dimensions as equivalent inline declarations.
  for dimension in ['width','height']:
   if str(e.get(dimension,'')).isdigit():e['style']=e.get('style','')+';'+dimension+':'+e[dimension]+'px'
 if e.name=='input' and e.get('type')!='submit':e['value']=''
member=body.select_one('.GroupMember');wall=body.select_one('.AlternatingItemTemplateOdd');game=body.select_one('.GroupPlace')
for card in [member,wall,game]:
 for e in card.select('.NameText,.UserLink,.GroupWall_PostContainer,.GroupWall_PostDate span,.PlayersOnline'):e.clear()
 for e in card.select('.ReportAbuse,.GroupWall_PostBtns'):e.decompose()
for e in body.select('.GroupMember,.GroupPlace,.AlternatingItemTemplateOdd,.AlternatingItemTemplateEven'):e.extract()
# Templates retain original geometry, never the captured names or post contents.
for selector in ['.right-col h2','#GroupDescP pre','#ctl00_cphRoblox_OwnershipPanel','#MemberCount','.MembersDropDownList','.RolesetCountHidden']:
 for e in body.select(selector):e.clear();e.attrs.pop('value',None)
for e in body.select('.ReportAbuse,.FooterPager,#ExileModal'):e.decompose()
for e in body.select('#GroupsPeoplePane_Allies,#GroupsPeoplePane_Enemies,#GroupsPeoplePane_Items'):e.clear()
for e in body.select('#GroupWall_PostDate'):e.clear()
result={'html':str(body),'member':str(member),'wall':str(wall),'game':str(game),'captureDate':'20181117045512','sourceUrl':url,'originalHash':hashlib.sha256(data).hexdigest(),'publication':'Structure only; captured identities, images, posts, scripts and verification fields removed.'}
(gen/'group.generated.json').write_text(json.dumps(result,indent=2)+'\n')
print('Prepared original November group structure and two original CSS bundles.')
