import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { redis, postQueue } from './queue.js';

const app = express();
app.use(express.json());

// Register a new workspace/user
app.post('/users', async (_req, res) => {
  const id = uuidv4();
  await redis.sadd('users', id);
  res.json({ id });
});

// Add a WordPress account under a user workspace
app.post('/users/:userId/accounts', async (req, res) => {
  const { name, siteUrl, username, password, basePrompt } = req.body;
  if (!name || !siteUrl || !username || !password || !basePrompt) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const key = `user:${req.params.userId}:accounts`;
  await redis.hset(key, name, JSON.stringify({ siteUrl, username, password, basePrompt }));
  res.json({ status: 'ok' });
});

// Schedule a post for a specific account
app.post('/users/:userId/accounts/:name/schedule', async (req, res) => {
  const { topic, publishAt } = req.body;
  if (!topic || !publishAt) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const publishDate = new Date(publishAt);
  const delay = publishDate.getTime() - Date.now();
  if (isNaN(delay) || delay < 0) {
    return res.status(400).json({ error: 'publishAt must be a future date' });
  }
  await postQueue.add({ userId: req.params.userId, accountName: req.params.name, topic }, { delay });
  res.json({ status: 'scheduled' });
});

// Background worker to process scheduled posts
postQueue.process(async job => {
  const { userId, accountName, topic } = job.data;
  const accountStr = await redis.hget(`user:${userId}:accounts`, accountName);
  if (!accountStr) return;
  const account = JSON.parse(accountStr);
  const content = await generateContent(account.basePrompt, topic);
  await postToWordPress(account, content);
});

async function generateContent(basePrompt, topic) {
  const cacheKey = `content:${Buffer.from(basePrompt).toString('base64')}:${Buffer.from(topic).toString('base64')}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `${basePrompt} ${topic}`;
  if (!apiKey) {
    await redis.set(cacheKey, prompt, 'EX', 3600);
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
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
  await redis.set(cacheKey, text, 'EX', 3600);
  return text;
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
