import os,subprocess,pathlib,shutil,json,zipfile,hashlib
root=pathlib.Path('/workspace/conquete-serpents-0322'); out=root/'reports/suivi-0.36.0'
env=os.environ.copy();env.update(JAVA_HOME='/workspace/android-toolchain/jdk-21.0.2',ANDROID_HOME='/workspace/android-toolchain/sdk',SERPENTS_PERF='0');env['PATH']=env['JAVA_HOME']+'/bin:'+env['PATH']
settings=root/'android/capacitor.settings.gradle';original=settings.read_bytes()
try:
 with (out/'android-sync.log').open('w') as log: subprocess.run(['npx','cap','sync','android'],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT,check=True)
finally: settings.write_bytes(original)
with (out/'android-build.log').open('w') as log: subprocess.run(['./gradlew','assembleDebug','--offline','--no-daemon','--max-workers=2'],cwd=root/'android',env=env,stdout=log,stderr=subprocess.STDOUT,check=True)
apk=pathlib.Path('/workspace/conquete-serpents-v0.36.0-debug.apk');shutil.copy2(root/'android/app/build/outputs/apk/debug/app-debug.apk',apk)
buildtools=pathlib.Path('/workspace/android-toolchain/sdk/build-tools/36.0.0')
for filename,args in [('apk-badging.txt',['aapt','dump','badging',str(apk)]),('apk-permissions.txt',['aapt','dump','permissions',str(apk)]),('apk-manifest.txt',['aapt','dump','xmltree',str(apk),'AndroidManifest.xml']),('apk-signature.txt',['apksigner','verify','--print-certs',str(apk)])]:
 args[0]=str(buildtools/args[0]);result=subprocess.run(args,env=env,text=True,capture_output=True,check=True);(out/filename).write_text(result.stdout+result.stderr)
badging=(out/'apk-badging.txt').read_text();manifest=(out/'apk-manifest.txt').read_text();permissions=(out/'apk-permissions.txt').read_text();sig=(out/'apk-signature.txt').read_text()
assert "name='com.conqueteserpents.famille'" in badging and "versionCode='46'" in badging and "versionName='0.36.0'" in badging
assert "Snake Attack TD" in badging and 'La Conquête des Serpents' in badging
assert not any(s in permissions for s in ['android.permission.INTERNET','BILLING','AD_ID'])
assert 'd018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599' in sig
files=[]
with zipfile.ZipFile(apk) as z:
 config=json.loads(z.read('assets/capacitor.config.json')); assert 'server' not in config; assert config['appId']=='com.conqueteserpents.famille'
 for path in sorted((root/'dist').rglob('*')):
  if path.is_file():
   rel=str(path.relative_to(root/'dist'));data=path.read_bytes();assert z.read('assets/public/'+rel)==data,rel;files.append(dict(path=rel,bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
 report=dict(version='0.36.0',versionCode=46,appId=config['appId'],apkPath=str(apk),apkBytes=apk.stat().st_size,apkSHA256=hashlib.sha256(apk.read_bytes()).hexdigest(),certificateSHA256='d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599',normalNoServer=True,allDistFilesIdentical=True,distFiles=len(files),files=files,capacitorConfig=config)
(out/'apk-inspection.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k not in ['files','capacitorConfig']},indent=2))
