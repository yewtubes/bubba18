import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash,timingSafeEqual} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import Redis from 'ioredis';
import {generateChallenge,validateChallenge} from 'capjs-core';
const here=path.dirname(fileURLToPath(import.meta.url));
const prefix='bubba18:cap:';
const assets={
 'widget.js':['cap-widget/cap.min.js','text/javascript'],
 'cap_wasm_bg.wasm':['@cap.js/wasm/browser/cap_wasm_bg.wasm','application/wasm'],
 'hashwx.wasm':['@cap.js/wasm/browser/hashwx.wasm','application/wasm'],
 'pako_inflate.min.js':['pako/dist/pako_inflate.min.js','text/javascript']
};
function equals(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y);}
async function body(req){let size=0,data='';for await(const chunk of req){size+=chunk.length;if(size>65536)throw Object.assign(new Error('body_too_large'),{status:413});data+=chunk;}try{return data?JSON.parse(data):{};}catch{throw Object.assign(new Error('invalid_json'),{status:400});}}
export async function startCapServer({secret=process.env.CAP_SECRET,redisUrl=process.env.CAP_REDIS_URL||'redis://127.0.0.1:6379',host=process.env.CAP_HOST||'127.0.0.1',port=Number(process.env.CAP_PORT||3187)}={}){
 if(typeof secret!=='string'||Buffer.byteLength(secret)<32)throw new Error('CAP_SECRET must contain at least 32 random bytes; no development bypass is available.');
 const redis=new Redis(redisUrl,{maxRetriesPerRequest:1,enableOfflineQueue:false,lazyConnect:true});
 redis.on('error',()=>{});await redis.connect();await redis.ping();let active=0;
 const server=http.createServer(async(req,res)=>{
  const send=(status,data)=>{if(res.headersSent||res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  try{
   const pathname=new URL(req.url,'http://localhost').pathname;
   if(pathname==='/health'&&req.method==='GET'){await redis.ping();return send(200,{ready:true});}
   if(!equals(req.headers.authorization,'Bearer '+secret))return send(401,{success:false});
   if(req.method==='GET'&&pathname.startsWith('/assets/')){
    const item=assets[pathname.slice(8)];if(!item)return send(404,{error:'not_found'});
    const data=await readFile(path.join(here,'node_modules',item[0]));res.writeHead(200,{'Content-Type':item[1],'Cache-Control':'public,max-age=3600','X-Content-Type-Options':'nosniff'});return res.end(data);
   }
   if(req.method!=='POST'||!['/challenge','/redeem','/siteverify'].includes(pathname))return send(404,{error:'not_found'});
   const data=await body(req);
   if(pathname==='/siteverify'){
    if(!equals(data.secret,secret)||typeof data.response!=='string'||!/^[a-f0-9]{16}:[a-f0-9]{30}$/.test(data.response))return send(200,{success:false});
    const [id,token]=data.response.split(':'),key=prefix+'token:'+id+':'+createHash('sha256').update(token).digest('hex');
    const scope=await redis.getdel(key);return send(200,{success:scope==='signup'});
   }
   const client=String(req.headers['x-cap-client']||req.socket.remoteAddress).slice(0,128),rateKey=prefix+'rate:'+pathname+':'+createHash('sha256').update(client).digest('hex');
   const count=await redis.eval('local n=redis.call("INCR",KEYS[1]);if n==1 then redis.call("EXPIRE",KEYS[1],60) end;return n',1,rateKey);
   if(count>30)return send(429,{error:'rate_limited'});
   if(pathname==='/challenge'){
    if(active>=4)return send(503,{error:'busy'});active++;
    try{return send(200,await generateChallenge(secret,{scope:'signup',expiresMs:300000,instrumentation:{blockAutomatedBrowsers:process.env.CAP_BLOCK_AUTOMATED_BROWSERS==='true'}}));}finally{active--;}
   }
   const result=await validateChallenge(secret,data,{scope:'signup',tokenTtlMs:120000,consumeNonce:async(sig,ttl)=>await redis.set(prefix+'nonce:'+sig,'1','PX',ttl,'NX')==='OK'});
   if(!result.success)return send(400,{success:false,error:result.reason});
   await redis.set(prefix+'token:'+result.tokenKey,'signup','PX',Math.max(1,result.expires-Date.now()));
   return send(200,{success:true,token:result.token,expires:result.expires});
  }catch(error){return send(error.status||503,{success:false,error:error.status?error.message:'verification_unavailable'});}
 });
 server.headersTimeout=10000;server.requestTimeout=15000;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
 return {server,redis,url:'http://'+host+':'+server.address().port,async close(){await new Promise(resolve=>server.close(resolve));redis.disconnect();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 let local={};try{local=JSON.parse(await readFile(path.join(here,'../.local/cap.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 const service=await startCapServer({secret:process.env.CAP_SECRET||local.secret,redisUrl:process.env.CAP_REDIS_URL||local.redisUrl});console.log('CAP signup verifier listening on '+service.url);
 for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await service.close();process.exit(0);});
}
