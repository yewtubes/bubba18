#!/usr/bin/env python3
"""Create private credentials for the isolated browser test database only."""
import argparse,ctypes,ctypes.util,json,os,secrets
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--username',default='LocalTester');args=parser.parse_args()
root=Path(__file__).resolve().parents[2];target=root/'.local/visual-test-account.json';target.parent.mkdir(exist_ok=True)
if target.exists():raise SystemExit('Existing test credentials preserved: '+str(target))
name=os.environ.get('BUBBABLOX_SODIUM_LIBRARY') or ctypes.util.find_library('sodium')
if not name:raise SystemExit('Install libsodium, or set BUBBABLOX_SODIUM_LIBRARY to its authorized local path.')
lib=ctypes.CDLL(name);lib.sodium_init();password=secrets.token_urlsafe(24);buf=ctypes.create_string_buffer(128)
fn=lib.crypto_pwhash_str;fn.argtypes=[ctypes.c_void_p,ctypes.c_char_p,ctypes.c_ulonglong,ctypes.c_ulonglong,ctypes.c_size_t]
if fn(buf,password.encode(),len(password),2,67108864)!=0:raise SystemExit('Argon2 hashing failed')
with os.fdopen(os.open(target,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'w') as f:json.dump({'username':args.username,'password':password,'hash':buf.value.decode()},f)
print('Created private isolated-test credentials. No application account or authentication override was installed.')
