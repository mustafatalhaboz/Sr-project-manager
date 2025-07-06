import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitOptions {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private tokens: Map<string, { count: number; resetTime: number }> = new Map();
  private interval: number;
  private maxRequests: number;

  constructor(options: RateLimitOptions) {
    this.interval = options.interval;
    this.maxRequests = options.uniqueTokenPerInterval;
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const tokenData = this.tokens.get(identifier);

    if (!tokenData || now > tokenData.resetTime) {
      // Reset or initialize
      this.tokens.set(identifier, {
        count: 1,
        resetTime: now + this.interval
      });

      return {
        allowed: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.interval
      };
    }

    if (tokenData.count >= this.maxRequests) {
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: tokenData.resetTime
      };
    }

    tokenData.count++;
    this.tokens.set(identifier, tokenData);

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - tokenData.count,
      reset: tokenData.resetTime
    };
  }

  // Clean up expired tokens periodically
  cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.tokens.forEach((value, key) => {
      if (now > value.resetTime) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.tokens.delete(key);
    });
  }
}

// Different rate limits for different endpoints
const rateLimiters = {
  // AI endpoints - more restrictive
  ai: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10 // 10 requests per minute
  }),
  // ClickUp endpoints - moderate
  clickup: new RateLimiter({
    interval: 60 * 1000, // 1 minute  
    uniqueTokenPerInterval: 30 // 30 requests per minute
  }),
  // General endpoints - less restrictive
  general: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100 // 100 requests per minute
  })
};

// Cleanup interval
setInterval(() => {
  Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
}, 5 * 60 * 1000); // Every 5 minutes

export function rateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  type: 'ai' | 'clickup' | 'general' = 'general'
): RateLimitResult {
  // Get client identifier (IP address with fallbacks)
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0] : 
             req.headers['x-real-ip'] as string ||
             req.connection?.remoteAddress ||
             'unknown';

  const identifier = `${type}:${ip}`;
  const result = rateLimiters[type].check(identifier);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', result.limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.reset);

  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil((result.reset - Date.now()) / 1000));
  }

  return result;
}

export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  type: 'ai' | 'clickup' | 'general' = 'general'
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const rateCheck = rateLimit(req, res, type);
    
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
        retryAfter: Math.ceil((rateCheck.reset - Date.now()) / 1000)
      });
    }

    return handler(req, res);
  };
}