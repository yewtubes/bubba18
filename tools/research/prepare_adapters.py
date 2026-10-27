#!/usr/bin/env python3
import ast,hashlib,json,re,urllib.request,gzip
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2];PUB=ROOT/'2016-roblox-main/public/preserved/2018';GEN=ROOT/'2016-roblox-main/components/preserved2018'
pages=json.loads((GEN/'pages.generated.json').read_text())
# Remove archive/capture attributes with empty URLs and localize navigation.
for key,value in list(pages.items()):
 html=value.get('html') if isinstance(value,dict) else value
 if not isinstance(html,str):continue
 soup=BeautifulSoup(html,'html.parser')
 for e in soup.select('[src=""],[href=""]'):
  for attr in ['href','src']:
   if e.get(attr)== '':e.attrs.pop(attr,None)
 for e in soup.select('a[href]'):
  href=e['href'];href=re.sub(r'^https?://(?:www|web)\.roblox\.com','',href);e['href']=href
 for e in soup.select('[data-searchurl]'):e['data-searchurl']=re.sub(r'^https?://(?:www|web)\.roblox\.com','',e['data-searchurl'])
 if key=='header':
  soup.select_one('.login-action a')['href']='/login'
  soup.select_one('.signup-button-container a')['href']='/'
 if isinstance(value,dict):pages[key]['html']=str(soup)
 else:pages[key]=str(soup)
# Reconstructed account controls use the dated stylesheet's actual classes.
# The expired April attachment is not represented as a recovered document.
header=BeautifulSoup(pages['header'],'html.parser');nav=header.select_one('.rbx-navbar-right-nav');nav.clear()
for label,href,icon in [('USERNAME','/users/1/profile',''),('0','/robux.aspx','icon-nav-robux'),('','/My/Account','icon-nav-settings')]:
 li=header.new_tag('li');a=header.new_tag('a',href=href);a['class']=['rbx-menu-item','nav-menu-title'];
 if icon:
  span=header.new_tag('span');span['class']=[icon];a.append(span)
 a.append(label);li.append(a);nav.append(li)
nav.select_one('a')['class'].append('age-bracket-label');nav.select('a')[1]['id']='nav-robux-amount'
sidebar=BeautifulSoup('<div id="navigation" class="rbx-left-col nav-show"><div class="rbx-scrollbar"><ul class="left-col-list"><li class="text-lead"><a href="/users/1/profile">USERNAME</a></li></ul></div></div>','html.parser');ul=sidebar.select_one('ul')
for label,key,href in [('Home','home','/home'),('Profile','profile','/users/1/profile'),('Messages','message','/My/Messages'),('Friends','friends','/users/1/friends'),('Avatar','avatar','/My/Avatar'),('Inventory','inventory','/users/1/inventory'),('Trade','trade','/My/Trades.aspx'),('Groups','groups','/My/Groups.aspx'),('My Feed','feed','/home')]:
 li=sidebar.new_tag('li');a=sidebar.new_tag('a',href=href,id='nav-'+key);a['class']=['dynamic-overflow-container'];icon=sidebar.new_tag('span');icon['class']=['icon-nav-'+key];a.append(icon);text=sidebar.new_tag('span');text['class']=['font-header-2'];text.string=label;a.append(text);li.append(a);ul.append(li)
(GEN/'account-navigation.generated.json').write_text(json.dumps({'header':str(header),'sidebar':str(sidebar),'status':'reconstructed from recorded navigation and recovered December CSS; original signed-in document not recovered','independentlyVerifiedLate2018':False},indent=2)+'\n')
# Recover the real login templates and apply only local endpoint adapters.
templates={}
for m in re.finditer(r'\bn\.put\(("(?:\\.|[^"\\])*"),(\'(?:\\.|[^\'\\])*\')\)',(PUB/'login-templates.original.js').read_text()):templates[ast.literal_eval(m[1])]=ast.literal_eval(m[2])
locale={}
for m in re.finditer(r'(?:"([^"]+)"|(\w+)):"((?:\\.|[^"\\])*)"',(PUB/'login-language.original.js').read_text()):locale[m[1] or m[2]]=json.loads('"'+m[3]+'"')
soup=BeautifulSoup(templates['login-base'],'html5lib');form=BeautifulSoup(templates['login-form'],'html5lib')
for e in list(form.body.contents):soup.select_one('[login-form]').append(e.extract())
for e in list(soup.select('[ng-if]')):
 if e.attrs is not None and any(x in e.get('ng-if','') for x in ['Facebook','Captcha','samlRequest']):e.decompose()
for e in soup.find_all(True):
 for key in ['ng-bind','placeholder']:
  m=re.search(r"'([^']+)'\s*\|\s*translate",e.get(key,''))
  if m:
   if key=='ng-bind':e.string=locale.get(m[1],m[1])
   else:e[key]=locale.get(m[1],m[1])
 for key in list(e.attrs):
  if key.startswith('ng-') or key in ['context','key-press-enter','rbx-form-interaction','rbx-form-context','toggle-loading','is-loading']:del e[key]
soup.select_one('#login-username')['placeholder']=locale.get('Label.UsernameEmailPhone','Username/Email/Phone');soup.select_one('#login-username')['required']='';soup.select_one('#login-password')['required']='';soup.select_one('#login-button')['class']=['btn-full-width','login-button','btn-secondary-md'];soup.select_one('#login-button')['type']='submit';form=soup.select_one('form');form['action']='/login';form['method']='post';soup.select_one('#sign-up-link')['href']='/';soup.select_one('#forgot-credentials-link')['href']='/forgot-password'
for e in soup.select('[system-feedback],[captcha],[fun-captcha]'):e.decompose()
(GEN/'login.generated.json').write_text(json.dumps({'html':''.join(str(e) for e in soup.body.contents),'referencedByCapture':pages['login']['url']},indent=2)+'\n')
# Extract the exact catalog controller/directives and cache entries.
bundle=(PUB/'catalog-templates.original.js').read_text();templates={}
for m in re.finditer(r'\$templateCache\.put\(("(?:\\.|[^"\\])*"),\s*("(?:\\.|[^"\\])*")\)',bundle):templates[json.loads(m[1])]=json.loads(m[2])
runtime=(PUB/'catalog-bundle.original.js').read_text();section=runtime.split(';// ~/Generated/js/Roblox_TranslationResources_Feature_CatalogResources_en_us_standard.js')[1].split(';//')[0];locale={}
for m in re.finditer(r'(?:"([^"]+)"|(\w+)):"((?:\\.|[^"\\])*)"',section):locale[m[1] or m[2]]=json.loads('"'+m[3]+'"')
keep=['catalog/catalog.js','catalog/services/constantsService.js','catalog/constants/catalogConstants.js','catalog/directives/itemCardDirective.js','catalog/directives/accordionMenuDirective.js','catalog/directives/catalogStatePropertiesDirective.js','catalog/controllers/catalogController.js','catalog/controllers/breadcrumbsController.js']
parts=re.split(r'(?=;// )',runtime);selected=[p for p in parts if any(('pages/'+name) in p.split('\n',1)[0] for name in keep) or 'common/directives/paginationDirective.js' in p.split('\n',1)[0]];(PUB/'catalog-runtime.original.js').write_text('\n'.join(selected))
data={'templates':templates,'locale':locale}
for key,name,url in [('metadata','catalog-metadata','https://web.archive.org/web/20181208id_/https://www.roblox.com/catalog/meta-data'),('options','catalog-search-options','https://web.archive.org/web/20181208id_/https://www.roblox.com/catalog/search-options')]:
 file=ROOT.parent/'recovery'/(name+'.raw')
 try:
  if not file.exists():
   with urllib.request.urlopen(url,timeout=30) as r:raw=r.read();file.write_bytes(raw)
  raw=file.read_bytes();raw=gzip.decompress(raw) if raw[:2]==b'\x1f\x8b' else raw;data[key]=json.loads(raw)
 except Exception as error:raise ValueError('Missing original '+key+': '+str(error))
data['metadata']['BuyRobuxUrl']='/robux.aspx';(GEN/'catalog.generated.json').write_text(json.dumps(data,indent=2)+'\n')
(GEN/'pages.generated.json').write_text(json.dumps(pages,indent=2)+'\n')
print('Prepared native login form, original catalog runtime/templates, dated page documents, and explicitly reconstructed account navigation.')
