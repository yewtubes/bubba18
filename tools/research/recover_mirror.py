#!/usr/bin/env python3
"""Recover public mirrors of expired attachments; preserve claims as claims."""
import gzip, hashlib, json, re, urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2]
GEN=ROOT/'2016-roblox-main/components/preserved2018'
PUB=ROOT/'2016-roblox-main/public/preserved/2018'
RAW=ROOT/'docs/research/raw'
BASE='https://archive.miikart.co/2018/'
manifest=json.loads((ROOT/'docs/research/source-manifest.json').read_text())
def fetch(url,kind,helps,claimed=None):
    with urllib.request.urlopen(url,timeout=30) as response:
        data=response.read();final=response.url
    if data[:2]==b'\x1f\x8b':data=gzip.decompress(data)
    digest=hashlib.sha256(data).hexdigest();filename=digest+('.css' if kind=='css' else '.html' if kind=='document' else '.js' if kind=='script' else '.bin')
    (RAW/filename).write_bytes(data)
    entry={'url':url,'retrieved_url':final,'filename':filename,'description':'Public mirror or resource referenced by mirrored research attachment','claimed_date':claimed,'independently_verified_date':None,'source_type':kind,'retrieval_status':'retrieved','content_hash':digest,'local_path':'docs/research/raw/'+filename,'helps_restore':helps}
    manifest['sources']=[s for s in manifest['sources'] if s['url']!=url]+[entry]
    return data
def clean(element):
    for e in element.select('script,iframe,noscript'):e.decompose()
    for e in element.find_all(True):
        for attr in list(e.attrs):
            if attr.startswith('on'):del e[attr]
        for attr in ['href','src','data-searchurl']:
            if attr in e.attrs:e[attr]=re.sub(r'^https?://(?:www|web)\.roblox\.com','',e[attr])
    return str(element)
export=fetch(BASE+'2018.html','research-export',['home','friends','groups'])
index=BeautifulSoup(export,'html.parser')
messages=[]
for e in index.select('.chatlog__message-container'):
    messages.append({'id':e.get('id'),'text':e.get_text(' ',strip=True),'html':str(e),'urls':[a['href'] for a in e.select('a[href]')]})
(ROOT/'docs/research/mirror-messages.json').write_text(json.dumps(messages,indent=2)+'\n')
for name,prefix in [('home','AprHomepage-'),('friends','AprMyFriends-')]:
    href=next(a['href'] for a in index.select('a[href]') if a['href'].startswith('2018.html_Files/'+prefix))
    url=BASE+href;data=fetch(url,'document',[name],'April 2018 (community attribution; not an independently verified capture timestamp)')
    doc=BeautifulSoup(data,'html5lib');content=doc.select_one('.content')
    if name=='home':
        navigation={'header':clean(doc.select_one('#header')),'sidebar':clean(doc.select_one('#navigation')),'status':'Recovered original signed-in markup from April-attributed community capture; December continuity unverified','claimedDate':'April 2018','sourceUrl':url,'independentlyVerifiedLate2018':False}
        (GEN/'account-navigation.generated.json').write_text(json.dumps(navigation,indent=2)+'\n')
    html=clean(content)
    (GEN/(name+'.generated.json')).write_text(json.dumps({'html':html,'claimedDate':'April 2018','sourceUrl':url,'independentlyVerifiedLate2018':False},indent=2)+'\n')
    cssurl=next(e['href'] for e in doc.select('link[rel=stylesheet]') if '/css/page_' in e['href'])
    (PUB/(name+'.original.css')).write_bytes(fetch(cssurl,'css',[name]))
    for i,e in enumerate(doc.select('script[src]')):
        if not e['src'].startswith('https://js.rbxcdn.com/'):continue
        # Store all referenced client resources for reproducible investigation.
        filename=e['src'].rsplit('/',1)[1].replace('.gzip','')
        target=PUB/'research-client'/filename;target.parent.mkdir(exist_ok=True)
        try:target.write_bytes(fetch(e['src'],'script',[name]))
        except Exception as error:print('Resource unavailable',e['src'],error,flush=True)
    print('Recovered original',name,'from',url,flush=True)
manifest['source_count']=len(manifest['sources']);(ROOT/'docs/research/source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
