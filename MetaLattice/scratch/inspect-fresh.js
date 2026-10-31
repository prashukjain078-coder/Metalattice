import { spawn } from 'child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9445',
  '--remote-debugging-address=127.0.0.1',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9445/json');
    const targets = await res.json();
    const pageTarget = targets[0];
    console.log('Attaching to target:', pageTarget.webSocketDebuggerUrl);

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
      
      // Navigate to localhost:5173
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 4,
          method: 'Page.navigate',
          params: { url: 'http://localhost:5173' }
        }));
      }, 500);

      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 5,
          method: 'Runtime.evaluate',
          params: { expression: "document.getElementById('root')?.innerHTML || 'NOT FOUND'" }
        }));
      }, 3500);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails?.text, msg.params.exceptionDetails?.exception?.description);
      } else if (msg.method === 'Log.entryAdded') {
        console.log('[LOG ENTRY]', msg.params.entry?.level, msg.params.entry?.text);
      } else if (msg.id === 5) {
        console.log('[ROOT INNER HTML LENGTH]:', msg.result?.result?.value?.length);
        console.log('[ROOT INNER HTML PREVIEW]:', (msg.result?.result?.value || '').slice(0, 300));
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error('Error in inspector:', err);
    chrome.kill();
  }
}, 1500);

