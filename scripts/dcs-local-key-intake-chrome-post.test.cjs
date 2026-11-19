'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const createIntake=require('./lib/dcs-local-key-intake.cjs');
test('Chrome submits the same-origin form with its cookie and accepted Origin',async()=>{
 let handler,received;
 const server=http.createServer(async(req,res)=>{
  if(req.method==='POST')received={origin:req.headers.origin,hasCookie:!!req.headers.cookie,status:null};
  if(req.method==='GET'&&req.url.includes('automatic-test')){
   // Test-only page driver: preserve the real form, cookie and Referrer-Policy.
   // Permit inline script only in this disposable test server to press Submit.
   const writeHead=res.writeHead.bind(res),end=res.end.bind(res);
   res.writeHead=(status,headers)=>writeHead(status,{...headers,'content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; form-action 'self'"});
   res.end=body=>end(String(body).replace('</main>','<script>document.querySelector("input[name=key]").value="invalid-test-value";document.querySelector("form").submit();</script></main>'));
  }
  if(req.method==='POST'){const writeHead=res.writeHead.bind(res);res.writeHead=(status,headers)=>{received.status=status;return writeHead(status,headers);};}
  if(!await handler(req,res)){res.writeHead(404);res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 handler=createIntake({projectRef:'kcahcrfdubpoajsfxziv',origin,deadline:Date.now()+60000,getBound:()=>false,setBinding:()=>{throw Error('No real key used in this test');}});
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'dcs-intake-post-chrome-'));
 try{
  const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--incognito','--disable-background-networking','--disable-extensions','--disable-sync','--disable-component-update','--no-first-run','--no-default-browser-check','--user-data-dir='+profile,'--virtual-time-budget=3000','--dump-dom',origin+'/intake?automatic-test=1'],{windowsHide:true,stdio:['ignore','ignore','ignore']});
  const exit=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{child.kill();reject(Error('Chrome test timed out'));},20000);child.on('error',reject);child.on('exit',code=>{clearTimeout(timeout);resolve(code);});});assert.equal(exit,0);
  assert(received,'Chrome must submit the form');assert.equal(received.hasCookie,true);assert.equal(received.origin,origin,'Chrome must send the actual local Origin');assert.equal(received.status,400,'Same-origin form should reach key validation and reject the fake value');
 }finally{await new Promise(r=>server.close(r));}
});
