import Queue from 'bull';
import Redis from 'ioredis';

let redis;
let postQueue;

if (process.env.NODE_ENV === 'test') {
  const store = new Map();
  redis = {
    sadd: async (key, value) => {
      const set = store.get(key) || new Set();
      set.add(value);
      store.set(key, set);
    },
    smembers: async key => {
      const set = store.get(key) || new Set();
      return [...set];
    },
    hset: async (key, field, val) => {
      const hash = store.get(key) || {};
      hash[field] = val;
      store.set(key, hash);
    },
    hget: async (key, field) => {
      const hash = store.get(key) || {};
      return hash[field];
    },
    get: async key => store.get(key),
    set: async (key, val) => {
      store.set(key, val);
    },
    flushall: async () => {
      store.clear();
    }
  };
  postQueue = {
    jobs: [],
    add: async function (data, opts) {
      this.jobs.push({ data, opts });
    },
    process: () => {}
  };
} else {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redis = new Redis(redisUrl);
  postQueue = new Queue('posts', redisUrl);
}

export { redis, postQueue };
