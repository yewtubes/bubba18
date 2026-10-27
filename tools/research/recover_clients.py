#!/usr/bin/env python3
import ast,concurrent.futures,gzip,hashlib,io,json,re,tarfile,urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2];PUBLIC=ROOT/'2016-roblox-main/public/preserved/2018';GEN=ROOT/'2016-roblox-main/components/preserved2018';RAW=ROOT/'docs/research/raw'
for p in [PUBLIC,GEN,RAW]:p.mkdir(parents=True,exist_ok=True)
records=[]
def fetch(url):
 with urllib.request.urlopen(url,timeout=30) as r:
  data=r.read();data=gzip.decompress(data) if data[:2]==b'\x1f\x8b' else data
  return data,r.url,r.headers.get('Memento-Datetime')
def save(url,data,kind,date=None):
 digest=hashlib.sha256(data).hexdigest();path='docs/research/raw/'+digest+'.bin';(ROOT/path).write_bytes(data);records.append({'url':url,'filename':Path(path).name,'description':kind,'claimed_date':None,'independently_verified_date':date,'source_type':kind,'retrieval_status':'retrieved','content_hash':digest,'local_path':path,'helps_restore':[]})
 return data.decode('utf-8',errors='replace')
def recover(name,url):
 data,final,date=fetch(url);text=save(url,data,name,date);(PUBLIC/name).write_text(text);return text
base='https://web.archive.org/web/20181215id_/https://authsite.roblox.com/login/a9153727-1076-4e5a-a7df-d45894d70a19/'
for name,url in [('login-templates.original.js',base+'get-html-bundle'),('login-language.original.js',base+'en_us/get-language-resources-bundle'),('login.original.css',base+'get-css-bundle'),('catalog-templates.original.js','https://js.rbxcdn.com/c6bc42333fd6d21c11fe866fbd333310.js.gzip'),('catalog-bundle.original.js','https://js.rbxcdn.com/6e928f38695a579dfa9b608ba9c57893.js.gzip')]:
 try:recover(name,url);print('Recovered',name,flush=True)
 except Exception as e:print('Blocked',name,e,flush=True)
# Pinned MIT-licensed vendor generations used by the actual original controller.
(PUBLIC/'vendor').mkdir(exist_ok=True)
for package,version,source,target in [('angular','1.5.11','package/angular.min.js','angular.js'),('angular-sanitize','1.5.11','package/angular-sanitize.min.js','angular-sanitize.js'),('jquery','1.11.1','package/dist/jquery.min.js','jquery.js'),('bootstrap','3.3.7','package/dist/js/bootstrap.min.js','bootstrap.js')]:
 try:
  url=f'https://registry.npmjs.org/{package}/-/{package}-{version}.tgz';data,_,_=fetch(url)
  with tarfile.open(fileobj=io.BytesIO(data)) as tar:
   for filename,out in [(source,target),('package/LICENSE',target+'.LICENSE')]:
    try:(PUBLIC/'vendor'/out).write_bytes(tar.extractfile(filename).read())
    except KeyError:pass
 except Exception as e:print('Blocked vendor',package,e,flush=True)
# Recover the entire supplied Discord export, preserving every message and link.
archive=Path(__file__).resolve().parents[3]/'recovery/research/chatlogs-1432890790882967666-1432890791985942605.html'
if archive.exists():
 data=archive.read_bytes();save('user-supplied:chatlogs-1432890790882967666-1432890791985942605.html',data,'discord-export');soup=BeautifulSoup(data,'html.parser');urls=sorted({a['href'] for a in soup.select('a[href]') if a['href'].startswith(('http://','https://'))});messages=[]
 for e in soup.select('.chatlog__message-group'):messages.append({'text':e.get_text(' ',strip=True),'html':str(e),'urls':sorted({a['href'] for a in e.select('a[href]')})})
 if not messages:messages=[{'text':soup.get_text(' ',strip=True),'html':str(soup),'urls':urls}]
 (ROOT/'docs/research/discord-messages.json').write_text(json.dumps(messages,indent=2)+'\n');index=['# Discord source index','',f'Entire export preserved: {len(messages)} message groups, {len(urls)} distinct URLs. Community dates remain claims unless separately verified.','']
 for i,message in enumerate(messages):index+=['## Message '+str(i+1),'',message['text'],'']+['- '+url for url in message['urls']]+['']
 (ROOT/'docs/research/discord-source-index.md').write_text('\n'.join(index))
 for name in ['AprHomepage.html','AprMyFriends.html']:
  url=next((url for url in urls if name in url),None)
  if not url:continue
  try:
   data,final,date=fetch(url);save(url,data,'discord-attachment');document=BeautifulSoup(data,'html5lib');content=document.select_one('.content')
   for node in content.select('script,iframe,noscript'):node.decompose()
   key='home' if name=='AprHomepage.html' else 'friends';card=content.select_one('.friend' if key=='home' else '.avatar-card');header=document.select_one('#header');sidebar=document.select_one('#navigation')
   (GEN/(key+'.generated.json')).write_text(json.dumps({'html':str(content),'card':str(card) if card else '', 'claimedDate':'April 2018','independentlyVerifiedLate2018':False},indent=2)+'\n')
   if key=='home':(GEN/'account-navigation.generated.json').write_text(json.dumps({'header':str(header),'sidebar':str(sidebar),'claimedDate':'April 2018','independentlyVerifiedLate2018':False},indent=2)+'\n')
   cssurl=next(l['href'] for l in document.select('link[rel=stylesheet]') if '/css/page_' in l.get('href',''));css,_,_=fetch(cssurl);save(cssurl,css,key+'-css');(PUBLIC/(key+'.original.css')).write_bytes(css)
   print('Recovered',name,flush=True)
  except Exception as e:records.append({'url':url,'source_type':'discord-attachment','retrieval_status':'failed','error':str(e)});print('Blocked attachment',name,e,flush=True)
(ROOT/'docs/research/client-sources.json').write_text(json.dumps(records,indent=2)+'\n')
