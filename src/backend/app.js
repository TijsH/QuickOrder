const http = require('http');
const url = require('url');
const log = require('./log');


setCORS = (res) => {
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Origin, X-Requested-With, Authorization, Name');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
};

http.createServer((req, res) => {
  const parts = url.parse(req.url, true);
  const pathname = parts.pathname;
  // const query = parts.query;
  if (req.method === 'OPTIONS') {
    setCORS(res);
  } else if (req.method === 'POST' && pathname === '/log') {
    log(req);
    setCORS(res);
    res.write('{"result": "OK"}');
  } else {
    res.write(`{"ERROR": "${pathname}"}`);
  }
  res.end();
}).listen(81);
