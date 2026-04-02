const redis = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,               // 🔥 MUST for Upstash
    rejectUnauthorized: false,
  },
});

client.on("connect", () => {
  console.log("✅ Redis connected");
});

client.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

client.connect();

module.exports = client;