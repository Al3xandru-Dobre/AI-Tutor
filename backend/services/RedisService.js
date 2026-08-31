const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 seconds
  }

  async initialize() {
    try {
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB) || 0
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis Client Connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('reconnecting', () => {
        console.log('⚠️  Redis Client Reconnecting...');
      });

      this.client.on('disconnect', () => {
        console.log('⚠️  Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      console.log('✅ Redis Service Initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Redis Service Initialization Failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        console.log('✅ Redis Client Disconnected');
      }
    } catch (error) {
      console.error('❌ Redis Disconnect Error:', error);
    }
  }

  // Set key with optional TTL (in seconds)
  async set(key, value, ttl = null) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        await this.client.setEx(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Redis SET Error (${key}):`, error);
      throw error;
    }
  }

  // Get key value
  async get(key) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }

      // Try to parse as JSON, if fails return as string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`❌ Redis GET Error (${key}):`, error);
      throw error;
    }
  }

  // Delete key
  async del(key) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`❌ Redis DEL Error (${key}):`, error);
      throw error;
    }
  }

  // Delete multiple keys
  async delMultiple(...keys) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      await this.client.del(keys);
      return true;
    } catch (error) {
      console.error('❌ Redis DEL Multiple Error:', error);
      throw error;
    }
  }

  // Check if key exists
  async exists(key) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Redis EXISTS Error (${key}):`, error);
      throw error;
    }
  }

  // Set TTL for existing key
  async expire(key, ttl) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error(`❌ Redis EXPIRE Error (${key}):`, error);
      throw error;
    }
  }

  // Get TTL for key
  async ttl(key) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`❌ Redis TTL Error (${key}):`, error);
      throw error;
    }
  }

  // Increment value
  async incr(key) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error(`❌ Redis INCR Error (${key}):`, error);
      throw error;
    }
  }

  // Set hash field
  async hset(key, field, value) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.hSet(key, field, stringValue);
      return true;
    } catch (error) {
      console.error(`❌ Redis HSET Error (${key}):`, error);
      throw error;
    }
  }

  // Get hash field
  async hget(key, field) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      const value = await this.client.hGet(key, field);
      if (value === null) {
        return null;
      }

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`❌ Redis HGET Error (${key}):`, error);
      throw error;
    }
  }

  // Get all hash fields
  async hgetall(key) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      const value = await this.client.hGetAll(key);
      if (value === null) {
        return null;
      }

      // Parse all JSON values
      const parsed = {};
      for (const [field, val] of Object.entries(value)) {
        try {
          parsed[field] = JSON.parse(val);
        } catch {
          parsed[field] = val;
        }
      }

      return parsed;
    } catch (error) {
      console.error(`❌ Redis HGETALL Error (${key}):`, error);
      throw error;
    }
  }

  // Delete hash field
  async hdel(key, field) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      await this.client.hDel(key, field);
      return true;
    } catch (error) {
      console.error(`❌ Redis HDEL Error (${key}):`, error);
      throw error;
    }
  }

  // Delete hash (all fields)
  async hdelall(key) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`❌ Redis HDELALL Error (${key}):`, error);
      throw error;
    }
  }

  // Check hash field exists
  async hexists(key, field) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      const result = await this.client.hExists(key, field);
      return result === 1;
    } catch (error) {
      console.error(`❌ Redis HEXISTS Error (${key}):`, error);
      throw error;
    }
  }

  // Get all keys matching pattern
  async keys(pattern) {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`❌ Redis KEYS Error (${pattern}):`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected || !this.client) {
        return {
          status: 'disconnected',
          message: 'Redis is not connected'
        };
      }

      const ping = await this.client.ping();
      if (ping === 'PONG') {
        return {
          status: 'healthy',
          message: 'Redis is responsive'
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Redis is not responding correctly'
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Singleton instance
const redisService = new RedisService();

module.exports = redisService;
