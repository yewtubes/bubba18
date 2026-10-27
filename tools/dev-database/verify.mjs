import {startDatabase,root} from './server.mjs';
import pg from 'pg';
import path from 'node:path';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const parent=path.join(root,'.local');await mkdir(parent,{recursive:true});const dataDir=await mkdtemp(path.join(parent,'verify-pg-'));let database,client;
try{
 database=await startDatabase({dataDir,port:15432});
 client=new pg.Client({host:'127.0.0.1',port:15432,database:'postgres',user:'postgres',ssl:false});await client.connect();
 const {rows:[{count}]}=await client.query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_name<>'_revival_dev_schema'");assert.equal(count,97);
 await client.query('CREATE TABLE recovery_test(value text PRIMARY KEY)');await client.query('INSERT INTO recovery_test(value) VALUES($1)',['persistent']);
 await client.query('BEGIN');await client.query('INSERT INTO recovery_test(value) VALUES($1)',['rollback']);await client.query('ROLLBACK');
 assert.equal((await client.query('SELECT count(*)::int AS count FROM recovery_test')).rows[0].count,1);
 await client.end();client=null;await database.close();database=null;
 database=await startDatabase({dataDir,port:15432});assert.deepEqual((await database.db.query('SELECT value FROM recovery_test')).rows,[{value:'persistent'}]);
 const result={passed:true,originalSchemaTables:count,postgresWireProtocol:true,parameterizedQueries:true,rollback:true,restartPersistence:true,identity:database.identity,capturedAt:new Date().toISOString(),limitation:'Development-only serialized engine; not production PostgreSQL concurrency.'};
 await mkdir(path.join(root,'docs/evidence/recovery'),{recursive:true});await writeFile(path.join(root,'docs/evidence/recovery/postgresql.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{if(client)await client.end();if(database)await database.close();await rm(dataDir,{recursive:true,force:true});}
