#!/usr/bin/env python3
"""Publish frontend structure without captured credentials or account hydration.

Immutable originals are kept in ignored .local/publication-originals, never Git.
The source manifest retains original hashes and adds published-content hashes.
"""
import hashlib,json,re,subprocess
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2];PRIVATE=ROOT/'.local/publication-originals'
TOKEN=re.compile(r'(?i)csrf|xsrf|requestverification|authenticity|access.?token|authentication.?ticket|password|session.?token|browser.?tracker|rbx.?token|signature|secret|api.?key')
SIGNED=re.compile(r'((?:[?&]|&amp;)(?:hm|ex|is|signature|access_token|auth_token|token)=)[^&#"\s<>]+',re.I)
report=[]
def urls(text):return SIGNED.sub(lambda m:m[1]+'REDACTED',text)
def html(text):
    soup=BeautifulSoup(text,'html.parser')
    for e in soup.select('script,iframe,noscript'):e.decompose()
    for e in list(soup.select('input[type=hidden]')):e.decompose()
    for e in soup.find_all(True):
        for k in list(e.attrs):
            if k.startswith('on') or TOKEN.search(k):del e[k]
        if e.name=='meta' and TOKEN.search(str(e.get('name',''))):e.decompose()
        elif e.name=='input' and TOKEN.search(str(e.get('name',''))):
            if e.get('type','').lower()=='password':e.attrs.pop('value',None)
            else:e.decompose()
    return urls(str(soup))
def scrub(value):
    if isinstance(value,dict):return {k:scrub(v) for k,v in value.items()}
    if isinstance(value,list):return [scrub(v) for v in value]
    if isinstance(value,str):
        return html(value) if re.search(r'<(?:!doctype|html|div|li|span|form|section)\b',value,re.I) else urls(value)
    return value
def save(path,original,updated):
    if original==updated:return
    private=PRIVATE/path.relative_to(ROOT);private.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    if not private.exists():private.write_bytes(original);private.chmod(0o600)
    path.write_bytes(updated);report.append({'path':str(path.relative_to(ROOT)),'original_sha256':hashlib.sha256(original).hexdigest(),'published_sha256':hashlib.sha256(updated).hexdigest()})
paths=subprocess.check_output(['git','diff','--name-only','e7e4ee7deff540b5b0d7f77b05dc34540b38ab0a','HEAD'],cwd=ROOT).decode().splitlines()
for relative in paths:
    path=ROOT/relative
    if not path.is_file():continue
    original=path.read_bytes()
    try:text=original.decode('utf8')
    except UnicodeDecodeError:continue
    if relative.startswith('docs/research/raw/') and re.match(r'\s*(?:<!doctype|<html)',text,re.I):updated=html(text)
    elif path.suffix=='.json' and (relative.startswith('docs/research/') or '/preserved2018/' in relative):
        try:updated=json.dumps(scrub(json.loads(text)),indent=2)+'\n'
        except json.JSONDecodeError:continue
    elif relative.startswith('docs/research/'):updated=urls(text)
    else:continue
    save(path,original,updated.encode())
# Captured authenticated account hydration is not needed to preserve structure.
GEN=ROOT/'2016-roblox-main/components/preserved2018'
for name in ['home','friends','account-navigation']:
    path=GEN/(name+'.generated.json');original=path.read_bytes();data=json.loads(original)
    for key in ['html','header','sidebar']:
        if key not in data:continue
        soup=BeautifulSoup(data[key],'html.parser')
        soup.select_one('#state-properties') and soup.select_one('#state-properties').decompose()
        for e in soup.select('img,.rbx-nav-sponsor'):e.decompose()
        for selector in ['.feeds','.blog-news','#friend-activity .game-cards']:
            for e in soup.select(selector):e.clear()
        friends=soup.select('.friend-list .friend')
        for e in friends[1:]:e.decompose()
        if friends:
            card=friends[0];card.attrs.pop('id',None)
            for e in card.select('a'):e['href']='/users/0/profile';e.attrs.pop('title',None)
            for e in card.select('.friend-name'):e.string=''
        for e in soup.select('#txtStatusMessage'):e['value']=''
        for e in soup.select('a[href]'):e['href']=re.sub(r'/users/\d+/','/users/0/',e['href'])
        for selector in ['.age-bracket-label','#navigation .text-lead a','.home-header h1 a']:
            for e in soup.select(selector):e.clear()
        data[key]=str(soup).replace('KILLERAFIK','')
    data['capturedAccountDataRemoved']=True;save(path,original,(json.dumps(data,indent=2)+'\n').encode())
# Authenticated source documents contain feed/friend/account data. Only a
# structural publication copy is public; exact raw bytes remain private.
for record in json.loads((ROOT/'docs/research/source-manifest.json').read_text())['sources']:
    if record.get('source_type')!='document' or not any(n in record.get('helps_restore',[]) for n in ['home','friends']):continue
    if not record.get('local_path'):continue
    path=ROOT/record['local_path'];original=path.read_bytes();soup=BeautifulSoup(original,'html.parser')
    for e in soup.select('.friend-list,.feeds,.blog-news,#friend-activity .game-cards'):e.clear()
    for e in soup.select('img,#state-properties'):e.decompose()
    for e in soup.select('#txtStatusMessage'):e['value']=''
    for e in soup.select('.age-bracket-label,#navigation .text-lead a,.home-header h1 a'):e.clear()
    for e in soup.select('a[href]'):e['href']=re.sub(r'/users/\d+/','/users/0/',e['href'])
    save(path,original,str(soup).replace('KILLERAFIK','').encode())
manifestPath=ROOT/'docs/research/source-manifest.json';manifest=json.loads(manifestPath.read_text())
for record in manifest['sources']:
    file=ROOT/(record.get('local_path') or '__missing__')
    if file.is_file():record['published_content_hash']=hashlib.sha256(file.read_bytes()).hexdigest();record['publication_copy_may_be_redacted']=True
withheld=[]
for path in (ROOT/'docs/research/raw').glob('*.html'):
    private=PRIVATE/path.relative_to(ROOT);private.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    if not private.exists():private.write_bytes(path.read_bytes());private.chmod(0o600)
    path.unlink();withheld.append(str(path.relative_to(ROOT)))
for record in manifest['sources']:
    relative=record.get('local_path')
    if relative in withheld:
        record['local_path']=None;record['private_original_preserved']=True;record['publication_status']='Raw HTML withheld; use adapted structural templates and source URL for public provenance'
    if record.get('source_type') in ['discord-export','research-export']:
        if relative and (ROOT/relative).is_file():
            target=PRIVATE/relative;target.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
            if not target.exists():target.write_bytes((ROOT/relative).read_bytes());target.chmod(0o600)
            (ROOT/relative).unlink();withheld.append(relative)
        record['local_path']=None;record['private_original_preserved']=True;record['publication_status']='Full conversation export withheld'
    if record.get('provenance_message_index'):
        record['description']='Research lead from supplied message '+str(record['provenance_message_index'])+'; historical claims require verification.'
        if record.get('claimed_date'):record['claimed_date']='2018 community attribution (unverified)'
for relative in ['docs/research/discord-messages.json','docs/research/mirror-messages.json']:
    path=ROOT/relative
    if path.is_file():
        target=PRIVATE/relative;target.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
        if not target.exists():target.write_bytes(path.read_bytes());target.chmod(0o600)
        path.unlink();withheld.append(relative)
index=['# Discord source index','','All 28 supplied messages were parsed. Complete messages and exports remain private; public provenance omits conversations and signed attachment credentials. Historical claims remain unverified unless separately dated.','','Public attachment mirror: https://archive.miikart.co/2018/2018.html','']
index += ['- Message '+str(r['provenance_message_index'])+': '+r['url'].split('?')[0] for r in manifest['sources'] if r.get('provenance_message_index')]
(ROOT/'docs/research/discord-source-index.md').write_text('\n'.join(index)+'\n')
manifest['publication_policy']='Public runtime templates omit captured verification fields and account hydration. Raw HTML and full conversations remain private. Original source hashes identify private immutable originals; published-content hashes identify adapted public copies where present.'
manifestPath.write_text(json.dumps(manifest,indent=2)+'\n')
(ROOT/'docs/research/publication-redactions.json').write_text(json.dumps({'policy':manifest['publication_policy'],'files':report,'raw_html_withheld':withheld},indent=2)+'\n')
print(json.dumps({'redacted_files':len(report),'originals_private':True}))
