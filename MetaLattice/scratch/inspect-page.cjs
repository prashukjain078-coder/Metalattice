const { spawn } = require('child_process');
const http = require('http');

// Use WebSocket built-in in Node 24!
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9444',
  '--remote-debugging-address=127.0.0.1',
  'http://localhost:5173'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9444/json');
    const targets = await res.json();
    const pageTarget = targets.find(t => t.url.includes('5173'));
    if (!pageTarget) {
      console.log('No 5173 target found');
      chrome.kill();
      return;
    }
    console.log('Found page target:', pageTarget.webSocketDebuggerUrl);

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    ws.onopen = () => {
      // Enable Log and Runtime to catch console errors
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
      // Evaluate document.getElementById('root').innerHTML
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 3,
          method: 'Runtime.evaluate',
          params: { expression: "document.getElementById('root').innerHTML" }
        }));
      }, 1500);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
      } else if (msg.id === 3) {
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
