import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const defaultDataDir=path.join(root,'.local/pglite');
export async function startDatabase({dataDir=process.env.BUBBABLOX_DEV_DB_DIR||defaultDataDir,port=Number(process.env.BUBBABLOX_DEV_DB_PORT||5432)}={}){
 await mkdir(dataDir,{recursive:true});
 const db=await PGlite.create(dataDir);
 let server;
 try{
  const schema=await readFile(path.join(root,'api/sql/schema.sql'),'utf8');
  const hash=createHash('sha256').update(schema).digest('hex');
  const {rows:[{exists}]}=await db.query("SELECT to_regclass('public._revival_dev_schema') IS NOT NULL AS exists");
  if(!exists){
   const {rows:[{count}]}=await db.query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public'");
   if(count)throw new Error('Refusing to import the original schema into a nonempty database.');
   await db.exec(schema);
   await db.exec('CREATE TABLE public._revival_dev_schema(hash text PRIMARY KEY, imported_at timestamptz NOT NULL DEFAULT now())');
   await db.query('INSERT INTO public._revival_dev_schema(hash) VALUES($1)',[hash]);
  }else{
   const {rows:[stored]}=await db.query('SELECT hash FROM public._revival_dev_schema');
   if(stored.hash!==hash)throw new Error('Schema changed; apply a reviewed migration instead of silently reimporting it.');
  }
  // pg_dump clears search_path; restore normal application name resolution.
  await db.exec('SET search_path TO public');
  server=new PGLiteSocketServer({db,host:'127.0.0.1',port,maxConnections:10});
  await server.start();
  const {rows:[identity]}=await db.query('SELECT version() AS version,current_database() AS database');
  return {db,server,identity,port,async close(){await server.stop();await db.close();}};
 }catch(error){if(server)await server.stop();await db.close();throw error;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const database=await startDatabase();
 console.log(JSON.stringify({listening:'127.0.0.1:'+database.port,dataDir:process.env.BUBBABLOX_DEV_DB_DIR||defaultDataDir,...database.identity,developmentOnly:true}));
 let closing=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;await database.close();process.exit(0);});
}
