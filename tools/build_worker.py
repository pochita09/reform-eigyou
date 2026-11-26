import base64, json, os, sys
root=sys.argv[1]; out=sys.argv[2]
html=open(os.path.join(root,'index.html'),encoding='utf-8').read()
imgs={}
for f in sorted(os.listdir(os.path.join(root,'img'))):
    imgs['/img/'+f]=base64.b64encode(open(os.path.join(root,'img',f),'rb').read()).decode()
js='const HTML='+json.dumps(html)+';\nconst IMG='+json.dumps(imgs)+';\n'+r'''
const bin={};
function bytes(p){if(!bin[p]){const s=atob(IMG[p]);const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);bin[p]=u;}return bin[p];}
export default {async fetch(req){
  const p=new URL(req.url).pathname;
  if(p==='/'||p==='/index.html')return new Response(HTML,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=300'}});
  if(IMG[p])return new Response(bytes(p),{headers:{'content-type':'image/jpeg','cache-control':'public, max-age=86400'}});
  return new Response('Not Found',{status:404});
}};
'''
open(out,'w',encoding='utf-8').write(js)
print(os.path.getsize(out))
