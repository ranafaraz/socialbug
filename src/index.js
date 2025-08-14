import express from 'express';
import schedule from 'node-schedule';

const app = express();
app.use(express.json());

const accounts = new Map();

app.post('/accounts', (req, res) => {
  const { name, siteUrl, username, password, basePrompt } = req.body;
  if (!name || !siteUrl || !username || !password || !basePrompt) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  accounts.set(name, { siteUrl, username, password, basePrompt });
  res.json({ status: 'ok' });
});

app.post('/accounts/:name/schedule', (req, res) => {
  const account = accounts.get(req.params.name);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  const { topic, publishAt } = req.body;
  if (!topic || !publishAt) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  schedule.scheduleJob(new Date(publishAt), async () => {
    const content = await generateContent(account.basePrompt, topic);
    await postToWordPress(account, content);
  });
  res.json({ status: 'scheduled' });
});

async function generateContent(basePrompt, topic) {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `${basePrompt} ${topic}`;
  if (!apiKey) {
    return prompt;
  }
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
}

async function postToWordPress(account, content) {
  const auth = Buffer.from(`${account.username}:${account.password}`).toString('base64');
  await fetch(`${account.siteUrl}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      title: content.slice(0, 50),
      content,
      status: 'publish'
    })
  });
}

const port = process.env.APP_PORT || 3000;
app.listen(port, () => console.log(`Interface running on port ${port}`));
