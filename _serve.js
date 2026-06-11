const http=require('http'),fs=require('fs'),path=require('path');
const types={'.html':'text/html','.png':'image/png','.js':'text/javascript','.css':'text/css'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/')p='/index.html';
  const f=path.join(__dirname,p);
  fs.readFile(f,(e,d)=>{
    if(e){res.writeHead(404);res.end('404');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});
    res.end(d);
  });
}).listen(8080,()=>console.log('http://localhost:8080'));
