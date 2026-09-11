const net = require('net');

const server = net.createServer(src => {
  const dst = net.connect(8081, '::1');
  src.pipe(dst);
  dst.pipe(src);
  src.on('error', () => {});
  dst.on('error', () => {});
  src.on('close', () => dst.destroy());
  dst.on('close', () => src.destroy());
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(8081, '127.0.0.1', () => {
  console.log('IPv4 proxy listening on 127.0.0.1:8081 -> [::1]:8081');
});
