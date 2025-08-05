// test.js
document.getElementById('checkBtn').addEventListener('click', async () => {
  const pw = document.getElementById('pwInput').value.trim();
  const outputEl = document.getElementById('output');
  outputEl.textContent = '…checking…';

  try {
    const res = await fetch('http://localhost:3000/api/validate-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || res.statusText);
    outputEl.textContent = json.message;
    outputEl.style.color = json.valid ? 'green' : 'red';
  } catch (err) {
    outputEl.textContent = 'Error: ' + err.message;
    outputEl.style.color = 'orange';
  }
});
