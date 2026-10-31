import { spawn } from 'child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9448',
  '--remote-debugging-address=127.0.0.1',
  'http://localhost:5173'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9448/json');
    const targets = await res.json();
    const pageTarget = targets.find(t => t.url.includes('5173'));
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                await import('/src/main.tsx');
                await new Promise(r => setTimeout(r, 1000));
                return {
                  html: document.getElementById('root')?.innerHTML?.slice(0, 500),
                  bodyBg: window.getComputedStyle(document.body).backgroundColor,
                  location: window.location.href
                };
              })()
            `,
            awaitPromise: true,
            returnByValue: true
          }
        }));
      }, 1000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 2) {
        console.log('DOM STATE:', JSON.stringify(msg.result?.result?.value, null, 2));
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}, 2000);

