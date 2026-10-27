#!/usr/bin/env python3
"""Preserve the July card evidence selected by the user, independently of shell CSS."""
import gzip,hashlib,json,urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2];PUB=ROOT/'2016-roblox-main/public/preserved/2018';GEN=ROOT/'2016-roblox-main/components/preserved2018'
manifest=json.loads((ROOT/'docs/research/source-manifest.json').read_text())
def preserve(url,cache,kind,description):
    if cache.exists():data=cache.read_bytes();final=url
    else:
        with urllib.request.urlopen(url,timeout=30) as response:data=response.read();final=response.url
    if data[:2]==b'\x1f\x8b':data=gzip.decompress(data)
    digest=hashlib.sha256(data).hexdigest();relative='docs/research/raw/'+digest+('.html' if kind=='document' else '.css' if kind=='css' else '.js');(ROOT/relative).write_bytes(data)
    manifest['sources']=[s for s in manifest['sources'] if s['url']!=url]+[{'url':url,'retrieved_url':final,'filename':Path(relative).name,'description':description,'claimed_date':None,'independently_verified_date':'20180727053943' if kind=='document' else None,'source_type':kind,'retrieval_status':'retrieved','content_hash':digest,'local_path':relative,'helps_restore':['games']}]
    return data
url='https://web.archive.org/web/20180727053943id_/https://www.roblox.com/games/606849621/Jailbreak'
data=preserve(url,ROOT.parent/'recovery/july-game.html','document','Dated shared game-card markup; July design explicitly selected by user')
soup=BeautifulSoup(data,'html5lib');card=soup.select_one('.game-card');assert card is not None
for e in card.select('script,iframe'):e.decompose()
(GEN/'game-card-july.generated.json').write_text(json.dumps({'html':str(card),'captureDate':'20180727053943','sourceUrl':url,'selection':'User explicitly requested July cards inside the December shell. July Games replay contains empty card lists loaded by /games/moreresultscached; its JS references the same vote-bar and shared card classes.'},indent=2)+'\n')
baseurl='https://static.rbxcdn.com/css/leanbase___c3fcb007b9e0b9eddeee897330899119_m.css/fetch'
(PUB/'games-july-base.original.css').write_bytes(preserve(baseurl,ROOT.parent/'recovery/july-leanbase.raw','css','Exact leanbase URL referenced by the July Games document'))
for filename in ['598ff5d6c7b68930dab273378f55ed93.js','c595daa1054b8bc26de4dc26428a3eae.js']:
    preserve('https://js.rbxcdn.com/'+filename+'.gzip',PUB/'research-client'/filename,'script','Original July Games client resource; retained for provenance, not executed wholesale')
manifest['source_count']=len(manifest['sources']);(ROOT/'docs/research/source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
