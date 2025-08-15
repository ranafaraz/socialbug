import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/index.js';
import { redis, postQueue } from '../src/queue.js';

test.afterEach(async () => {
  await redis.flushall();
  postQueue.jobs.length = 0;
});

test('creates user workspace', async () => {
  const res = await request(app).post('/users').expect(200);
  assert.match(res.body.id, /^[0-9a-f-]{36}$/i);
  const users = await redis.smembers('users');
  assert.ok(users.includes(res.body.id));
});

test('adds account and schedules post', async () => {
  const userRes = await request(app).post('/users').expect(200);
  const userId = userRes.body.id;
  await request(app)
    .post(`/users/${userId}/accounts`)
    .send({
      name: 'blog',
      siteUrl: 'https://example.com',
      username: 'user',
      password: 'pass',
      basePrompt: 'Write about'
    })
    .expect(200);
  const account = await redis.hget(`user:${userId}:accounts`, 'blog');
  assert.ok(account);

  const publishAt = new Date(Date.now() + 60000).toISOString();
  await request(app)
    .post(`/users/${userId}/accounts/blog/schedule`)
    .send({ topic: 'AI', publishAt })
    .expect(200);
  assert.equal(postQueue.jobs.length, 1);
  assert.deepEqual(postQueue.jobs[0].data, {
    userId,
    accountName: 'blog',
    topic: 'AI'
  });
});

test('rejects scheduling in the past', async () => {
  const userRes = await request(app).post('/users').expect(200);
  const userId = userRes.body.id;
  await request(app)
    .post(`/users/${userId}/accounts`)
    .send({
      name: 'blog',
      siteUrl: 'https://example.com',
      username: 'user',
      password: 'pass',
      basePrompt: 'Write about'
    })
    .expect(200);
  const publishAt = new Date(Date.now() - 60000).toISOString();
  await request(app)
    .post(`/users/${userId}/accounts/blog/schedule`)
    .send({ topic: 'AI', publishAt })
    .expect(400);
});
