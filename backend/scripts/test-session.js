// Simple Node script to create a session and send a message without PowerShell quoting issues.
// Run with: node scripts/test-session.js <JWT_TOKEN>

const fetch = global.fetch || ((...args) => import('node-fetch').then(m => m.default(...args)));

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error('Usage: node scripts/test-session.js <JWT_TOKEN>');
    process.exit(1);
  }
  const base = 'http://localhost:' + (process.env.PORT || 5000);

  async function post(path, body) {
    const res = await fetch(base + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(body || {})
    });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) {
      throw new Error('POST ' + path + ' failed: ' + res.status + ' ' + text);
    }
    return json;
  }

  try {
    console.log('Creating session...');
    const sessionResp = await post('/api/ai/chat/sessions', { title: 'Script Session', systemPrompt: 'You are concise.' });
    const sessionId = sessionResp.data?.session?._id;
    if (!sessionId) throw new Error('No sessionId in response: ' + JSON.stringify(sessionResp));
    console.log('Session ID:', sessionId);

    console.log('Sending message...');
    const msgResp = await post(`/api/ai/chat/sessions/${sessionId}/messages`, { content: 'Explain cloud storage in one sentence.' });
    console.log('Assistant reply:', msgResp.data?.message?.content);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
