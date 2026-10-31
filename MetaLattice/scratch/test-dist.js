import { spawn } from 'child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9450',
  '--remote-debugging-address=127.0.0.1',
  'file:///C:/Users/ratho/OneDrive/Documents/MetaLattice2/dist/index.html'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9450/json');
    const targets = await res.json();
    const pageTarget = targets[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 3,
          method: 'Runtime.evaluate',
          params: { expression: "document.getElementById('root')?.innerHTML" }
        }));
      }, 1500);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', msg.params.exceptionDetails?.text, msg.params.exceptionDetails?.exception?.description);
      }
      if (msg.method === 'Log.entryAdded') {
        console.log('LOG:', msg.params.entry?.text);
      }
      if (msg.id === 3) {
        console.log('DIST RESULT:', msg.result?.result?.value ? 'MOUNTED!' : 'EMPTY ROOT');
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}, 1500);

