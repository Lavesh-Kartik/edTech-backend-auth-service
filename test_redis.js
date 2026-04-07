const Redis = require('ioredis');

async function main() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://default:ThN4LuzapMcVyWPTgtxqW1ekUXtN3B5h@redis-10369.c246.us-east-1-4.ec2.cloud.redislabs.com:10369');
  
  redis.on('error', (err) => {
    console.error('Redis connection failed:', err);
    process.exit(1);
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
    process.exit(0);
  });
}

main();
