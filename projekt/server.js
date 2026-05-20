const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/flashcards', async (req, res) => {
  try {
    const { apiKey, text, count = 10 } = req.body;
    if (!apiKey || !text) return res.status(400).json({ error: 'apiKey and text are required' });

    const prompt = `Create ${count} concise study flashcards (question + answer) from the following text. Respond with a JSON array of objects with keys \"question\" and \"answer\" only. Keep answers short and focused.\n\nText:\n${text}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that outputs ONLY a JSON array of flashcards.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.2
      })
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';

    let cards = [];
    try {
      cards = JSON.parse(content);
    } catch (e) {
      // try to extract json substring
      const m = content.match(/\[\s*\{[\s\S]*\}\s*\]/m);
      if (m) {
        try { cards = JSON.parse(m[0]); } catch (e2) { }
      }
    }

    return res.json({ cards, raw: content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
