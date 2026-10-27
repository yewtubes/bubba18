#!/usr/bin/env python3
"""Restore missing image bindings and the actual captured Friends card menu."""
import gzip,json,re,urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2];GEN=ROOT/'2016-roblox-main/components/preserved2018';PUB=ROOT/'2016-roblox-main/public/preserved/2018'
url='https://archive.miikart.co/2018/2018.html_Files/AprMyFriends-573955f407c4a8aa.html'
with urllib.request.urlopen(url,timeout=30) as r:data=r.read()
if data[:2]==b'\x1f\x8b':data=gzip.decompress(data)
private=ROOT/'.local/research';private.mkdir(parents=True,exist_ok=True);(private/'friends-original.html').write_bytes(data)
raw=BeautifulSoup(data,'html.parser');capture=json.loads((GEN/'friends.generated.json').read_text());doc=BeautifulSoup(capture['html'],'html.parser');target=doc.select_one('.avatar-card-fullbody')
for image in list(target.select('img')):image.decompose()
for image in raw.select_one('.avatar-card-fullbody').select('img'):
 if image.parent.name=='a':target.select_one('a').append(image)
 else:target.insert(1,image)
capture['html']=str(doc);(GEN/'friends.generated.json').write_text(json.dumps(capture,indent=2)+'\n')
bundle=(PUB/'research-client/4eed11b2f28c267a8aa70917e03bd189.js').read_text();match=re.search(r'\$templateCache\.put\("friend-card-menu",\s*("(?:\\.|[^"\\])*")\)',bundle)
(GEN/'friends-controls.generated.json').write_text(json.dumps({'menu':json.loads(match[1]),'source':'https://js.rbxcdn.com/4eed11b2f28c267a8aa70917e03bd189.js.gzip','dateEvidence':'Referenced by April-attributed mirror; December continuity unverified'},indent=2)+'\n')
