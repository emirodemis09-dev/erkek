const { spawn } = require('child_process');
const fs = require('fs');

async function capture() {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9222',
        '--disable-gpu',
        '--window-size=430,932'
    ]);

    await new Promise(r => setTimeout(r, 1200));

    try {
        const versionRes = await fetch('http://127.0.0.1:9222/json/version');
        const versionData = await versionRes.json();
        const wsUrl = versionData.webSocketDebuggerUrl;

        const ws = new WebSocket(wsUrl);
        await new Promise(r => ws.onopen = r);

        let id = 1;
        function send(method, params = {}) {
            return new Promise((resolve) => {
                const curId = id++;
                const handler = (event) => {
                    const msg = JSON.parse(event.data);
                    if (msg.id === curId) {
                        ws.removeEventListener('message', handler);
                        resolve(msg.result);
                    }
                };
                ws.addEventListener('message', handler);
                ws.send(JSON.stringify({ id: curId, method, params }));
            });
        }

        // Create new target
        const { targetId } = await send('Target.createTarget', { url: 'http://127.0.0.1:8000/app?dekont=1' });
        
        // Connect to target
        const targetWs = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${targetId}`);
        await new Promise(r => targetWs.onopen = r);

        let tid = 1;
        function sendTarget(method, params = {}) {
            return new Promise((resolve) => {
                const curId = tid++;
                const handler = (event) => {
                    const msg = JSON.parse(event.data);
                    if (msg.id === curId) {
                        targetWs.removeEventListener('message', handler);
                        resolve(msg.result);
                    }
                };
                targetWs.addEventListener('message', handler);
                targetWs.send(JSON.stringify({ id: curId, method, params }));
            });
        }

        await sendTarget('Page.enable');
        await sendTarget('Runtime.enable');

        targetWs.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);
            if (msg.method === 'Runtime.consoleAPICalled') {
                console.log('[BROWSER LOG]', msg.params.args.map(a => a.value || a.description).join(' '));
            }
            if (msg.method === 'Runtime.exceptionThrown') {
                console.error('[BROWSER ERR]', msg.params.exceptionDetails);
            }
        });

        // Wait 2.5 seconds for API call & render
        await new Promise(r => setTimeout(r, 2000));

        // Evaluate location and show dekont
        const res = await sendTarget('Runtime.evaluate', {
            expression: `(function() {
                const tx = (currentAccountTransactions && currentAccountTransactions[0]) || {
                    id: 1,
                    title: "BERKAY AĞAÇ",
                    sender_receiver_name: "BERKAY AĞAÇ",
                    amount: -2500,
                    is_income: false,
                    transaction_type: "FAST",
                    category: "FAST",
                    date_str: "07.10.2024",
                    time_str: "23:43:28",
                    description: "FAST-CEP/KİRA ÖDEMESİ",
                    fast_ref_no: "517643450519",
                    commission: 7.97,
                    bsmv: 0.40,
                    iban: "TR930015700200300157939759"
                };
                currentMovementTransaction = tx;
                showOriginalDekont();
                return document.getElementById('demoReceiptPage').style.display;
            })()`
        });
        console.log('Evaluate result:', res);
        await new Promise(r => setTimeout(r, 1000));

        // 1. Capture main screen with 2 buttons
        const screenshot1 = await sendTarget('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('dekont_screen_2buttons.png', Buffer.from(screenshot1.data, 'base64'));
        console.log('Screenshot 1 saved to dekont_screen_2buttons.png');

        // 2. Click "Dekont Paylaş" to open the bottom sheet
        await sendTarget('Runtime.evaluate', {
            expression: `openDekontShareSheet()`
        });
        await new Promise(r => setTimeout(r, 600));

        const screenshot2 = await sendTarget('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync('dekont_share_sheet.png', Buffer.from(screenshot2.data, 'base64'));
        console.log('Screenshot 2 saved to dekont_share_sheet.png');

        targetWs.close();
        ws.close();
    } catch (err) {
        console.error('Capture error:', err);
    } finally {
        chrome.kill();
    }
}

capture();
