const $ = id => document.getElementById(id);

// Theme toggle
const themeToggle = $('themeToggle');
function applyTheme(t){ document.documentElement.setAttribute('data-theme', t); localStorage.setItem('theme', t); themeToggle.checked = t === 'dark'; }
const saved = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(saved);
themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked ? 'dark' : 'light'));

async function generate() {
  const apiKey = $('apiKey').value.trim();
  const text = $('text').value.trim();
  const count = parseInt($('count').value, 10) || 8;
  if (!apiKey) return alert('Enter your OpenAI API key');
  if (!text) return alert('Paste some text to convert to flashcards');

  $('generate').disabled = true;
  $('generate').textContent = 'Generating...';

  try {
    const res = await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, text, count })
    });
    const data = await res.json();
    const cards = data.cards || [];
    render(cards);
    $('export').disabled = cards.length === 0;
    $('export').onclick = () => downloadJSON(cards);
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    $('generate').disabled = false;
    $('generate').textContent = 'Generate';
  }
}

function render(cards) {
  const out = $('results');
  out.innerHTML = '';
  if (!cards || cards.length === 0) {
    out.textContent = 'No cards generated.';
    return;
  }
  cards.forEach((c, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    front.innerHTML = `<h3>Q${i+1}: ${escapeHtml(c.question || c.q || '')}</h3><p class="muted">Tap to reveal</p>`;

    const back = document.createElement('div');
    back.className = 'card-face card-back';
    back.innerHTML = `<h3>Answer</h3><p>${escapeHtml(c.answer || c.a || '')}</p><div class="card-actions"><button class="btn" data-copy>Copy</button></div>`;

    inner.appendChild(front);
    inner.appendChild(back);
    wrapper.appendChild(inner);

    wrapper.addEventListener('click', (e) => {
      // avoid flipping when clicking copy button
      if (e.target && e.target.matches('[data-copy]')) return;
      wrapper.classList.toggle('flipped');
    });

    back.querySelector('[data-copy]').addEventListener('click', (ev) => {
      ev.stopPropagation();
      navigator.clipboard.writeText(c.answer || c.a || '').then(()=>{
        ev.target.textContent = 'Copied';
        setTimeout(()=> ev.target.textContent = 'Copy', 1200);
      });
    });

    out.appendChild(wrapper);
  });
}

function downloadJSON(obj) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
  a.download = 'flashcards.json';
  a.click();
}

function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

document.getElementById('generate').addEventListener('click', generate);

