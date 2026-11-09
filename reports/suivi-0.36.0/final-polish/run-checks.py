import os,pathlib,subprocess,json,time,shutil
root=pathlib.Path('/workspace/conquete-serpents-0322'); out=root/'reports/suivi-0.36.0/final-polish'; records=[]
env=os.environ.copy(); env.pop('CAPRICES_SKIP_NATIVE',None);env['CAPRICES_REPORT_DIR']=str(out/'caprices');env['LOCALE_INVENTORY_FOLDER']=str(out/'locale-inventory')
for name,command in [('verify',['npm','run','verify']),('browser',['npm','run','test:browser']),('caprices',['npm','run','test:caprices']),('locale',['npm','run','test:locale']),('child-mobile',['npm','run','test:child-mobile']),('reinforcements-scroll',['npm','run','test:reinforcements-scroll'])]:
 print('START '+name,flush=True); started=time.monotonic()
 with (out/(name+'.log')).open('w') as log: result=subprocess.run(command,cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
 records.append(dict(command=' '.join(command),exitCode=result.returncode,seconds=round(time.monotonic()-started,2),log=str((out/(name+'.log')).relative_to(root))))
 (out/'commands.json').write_text(json.dumps(records,indent=2)+'\n'); print('END '+name+' '+str(result.returncode),flush=True)
 if result.returncode: raise SystemExit(result.returncode)
 for path in {'locale':'artifacts/locale-035/report.json','child-mobile':'reports/child-mobile-0.36.0.json','reinforcements-scroll':'reports/reinforcements-scroll-0.36.0.json'}.get(name,'').split():
  shutil.copy2(root/path,out/(name+'.json'))
