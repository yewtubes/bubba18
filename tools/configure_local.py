#!/usr/bin/env python3
"""Generate private machine-local configuration without overwriting existing files."""
import argparse,json,os,secrets
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
def configurations(root,base_url,postgres,token=secrets.token_urlsafe):
 parsed=urlsplit(base_url)
 if parsed.scheme not in ('http','https') or not parsed.hostname or parsed.path not in ('','/') or parsed.query or parsed.fragment or parsed.username:raise ValueError('base-url must be an HTTP(S) origin')
 base_url=base_url.rstrip('/');website=json.loads((root/'Roblox/Roblox.Website/appsettings.example.json').read_text());renderer=json.loads((root/'renderer/config.example.json').read_text());render_key,bot_key,cap_key=token(48),token(48),token(48)
 dirs={'Storage':'api/storage','Asset':'api/storage/asset','Public':'api/public','Thumbnails':'api/public/images/thumbnails','GroupIcons':'api/public/images/groups','XmlTemplates':'Roblox/Roblox.Libraries/Templates','JsonData':'Roblox/Roblox.Libraries/Json','AdminBundle':'admin/public','EconomyChatBundle':'economy-chat/build','RccServicePath':'RCCService','RccService2015Path':'RCCService2015','RccService2017Path':'RCCService2017','RccService2018Path':'RCCService2018','RccService2020Path':'RCCService2020','LuaScripts':'Roblox/Roblox.Services/Games/internalscripts'}
 website.update(Urls=base_url,BaseUrl=base_url,AssetUrl=base_url,CorsMiddlewareUrl=parsed.netloc,Postgres=postgres,Redis='127.0.0.1:6379',GSIPAddress='127.0.0.1',Webhook='',SignupWebhook='',DiscordClientID='',DiscordClientSecret='',DiscordKey=token(48),IPSalt=token(48),IPHubApiKey='',Authorization=token(48),BotAuthorization=bot_key,RccAuthorization=token(48))
 for key,path in [('DiscordRedirect','discordcb'),('DiscordForgotPasswordRedirect','forgotcb'),('DiscordLoginRedirect','logincb')]:website[key]=base_url+'/'+path
 website['Cap']={'Endpoint':'http://127.0.0.1:3187/','Secret':cap_key}
 website['Jwt']['Sessions']=token(64);website['Directories']={k:str((root/v).resolve())+os.sep for k,v in dirs.items()};website['Render'].update(BaseUrl='ws://127.0.0.1:3189',Authorization=render_key);website['GameServerAuthorization']=render_key
 renderer.update(rcc=str((root/'RCCService').resolve()),baseUrl=base_url,authorization=render_key,websiteBotAuth=bot_key,webhook='')
 frontend={'serverRuntimeConfig':{'backend':{'csrfKey':token(48),'authorization':website['Authorization'],'authorizationHeader':'rblx-authorization'}},'publicRuntimeConfig':{'backend':{'proxyEnabled':False,'baseUrl':base_url,'apiFormat':base_url+'/apisite/{0}{1}','flags':{'myAccountPage2016Enabled':True,'late2018NavigationEnabled':True}}}}
 return {'.local/cap.json':{'secret':cap_key,'redisUrl':'redis://127.0.0.1:6379'},'Roblox/Roblox.Website/appsettings.json':website,'Roblox/Roblox.Website/game-servers.json':{'GameServers':[]},'2016-roblox-main/config.json':frontend,'renderer/config.json':renderer},dirs
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--base-url',default='http://127.0.0.1:5080');a=p.parse_args();postgres=os.environ.get('BUBBABLOX_POSTGRES')
 if not postgres:p.error('Set BUBBABLOX_POSTGRES to your PostgreSQL connection string')
 configs,dirs=configurations(ROOT,a.base_url,postgres);existing=[name for name in configs if (ROOT/name).exists()]
 if existing:p.error('Existing configuration preserved: '+', '.join(existing))
 for name,data in configs.items():
  file=ROOT/name;file.parent.mkdir(parents=True,exist_ok=True)
  with os.fdopen(os.open(file,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600),'w') as f:json.dump(data,f,indent=2);f.write('\n')
 for value in dirs.values():(ROOT/value).mkdir(parents=True,exist_ok=True)
 for value in ['api/public/Data','api/public/UnsecuredContent','api/public/img']:(ROOT/value).mkdir(parents=True,exist_ok=True)
 print('Generated private local configuration. No runtime binaries launched.')
