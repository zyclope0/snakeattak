import pathlib,os,subprocess,time,json,hashlib
root=pathlib.Path('/workspace/conquete-serpents-0322');out=root/'reports/suivi-0.36.0/final-polish';records=json.loads((out/'commands.json').read_text());env=os.environ.copy()
def run(name,command,extra=None):
 started=time.monotonic();print('START '+name,flush=True)
 with (out/(name+'.log')).open('w') as log: result=subprocess.run(command,cwd=root,env=extra or env,stdout=log,stderr=subprocess.STDOUT)
 records.append(dict(command=' '.join(command),exitCode=result.returncode,seconds=round(time.monotonic()-started,2),log=str((out/(name+'.log')).relative_to(root))))
 (out/'commands.json').write_text(json.dumps(records,indent=2)+'\n');print('END '+name+' '+str(result.returncode),flush=True)
 if result.returncode: raise SystemExit(result.returncode)
strong=env.copy();strong['CAPRICES_SKIP_NATIVE']='1';strong['CAPRICES_REPORT_DIR']=str(out/'caprices-visibility')
run('caprices-visibility',['npm','run','test:caprices'],strong)
run('final-format',['npx','prettier','--check','scripts/caprices-036-browser.mjs','src/ui/capriceAlbums.ts','src/ui/capriceView.ts','src/ui/caprices.css','src/ui/squadControls.ts'])
def manifest():
 return {str(p.relative_to(root/'dist')):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((root/'dist').rglob('*')) if p.is_file()}
normal=manifest();(out/'normal-dist-before-portable.json').write_text(json.dumps(normal,indent=2)+'\n')
run('portable-build',['npm','run','build:portable'])
run('portable-browser',['node','reports/suivi-0.36.0/final-polish/portable-check.mjs'])
assert manifest()==normal,'portable must preserve normal dist'
(out/'normal-dist-after-portable.json').write_text(json.dumps(manifest(),indent=2)+'\n')
print('NORMAL DIST PRESERVED',flush=True)
