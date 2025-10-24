const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const redis = require('redis');
const nodemailer = require('nodemailer');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3003;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'gasleap-api.log' })
  ]
});

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Redis connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.connect();

// Email transporter (using MailHog in development)
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'mailhog',
  port: process.env.SMTP_PORT || 1025,
  secure: false,
  auth: process.env.NODE_ENV === 'production' ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip, 
    userAgent: req.get('User-Agent') 
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check Redis connection
    await redisClient.ping();
    
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        email: 'configured'
      }
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// Get transaction history
app.get('/api/transactions', async (req, res) => {
  try {
    const { user_account, pool_id, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM transaction_history WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (user_account) {
      query += ` AND user_account = $${paramIndex++}`;
      params.push(user_account);
    }
    
    if (pool_id) {
      query += ` AND pool_id = $${paramIndex++}`;
      params.push(pool_id);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    res.json({
      transactions: result.rows,
      total: result.rowCount,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error fetching transactions', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get user gas savings
app.get('/api/gas-savings/:userAccount', async (req, res) => {
  try {
    const { userAccount } = req.params;
    
    // Check cache first
    const cacheKey = `gas_savings:${userAccount}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const result = await db.query(
      'SELECT * FROM user_gas_savings WHERE user_account = $1',
      [userAccount]
    );
    
    const savings = result.rows[0] || {
      user_account: userAccount,
      total_saved: 0,
      transaction_count: 0,
      last_transaction_at: null
    };
    
    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(savings));
    
    res.json(savings);
  } catch (error) {
    logger.error('Error fetching gas savings', error);
    res.status(500).json({ error: 'Failed to fetch gas savings' });
  }
});

// Record new transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const {
      transaction_id,
      pool_id,
      user_account,
      target_chain,
      call_hash,
      gas_cost,
      status = 'pending',
      block_number,
      tx_hash
    } = req.body;
    
    const result = await db.query(`
      INSERT INTO transaction_history 
      (transaction_id, pool_id, user_account, target_chain, call_hash, gas_cost, status, block_number, tx_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [transaction_id, pool_id, user_account, target_chain, call_hash, gas_cost, status, block_number, tx_hash]);
    
    // Invalidate cache
    await redisClient.del(`gas_savings:${user_account}`);
    
    // Send notification if transaction is executed
    if (status === 'executed') {
      await sendTransactionNotification(user_account, transaction_id, gas_cost);
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error recording transaction', error);
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

// Get pool analytics
app.get('/api/analytics/pools/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { days = 30 } = req.query;
    
    const result = await db.query(`
      SELECT 
        date,
        total_transactions,
        total_gas_sponsored,
        unique_users
      FROM pool_analytics 
      WHERE pool_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      ORDER BY date DESC
    `, [poolId]);
    
    res.json({
      pool_id: poolId,
      analytics: result.rows,
      period_days: parseInt(days)
    });
  } catch (error) {
    logger.error('Error fetching pool analytics', error);
    res.status(500).json({ error: 'Failed to fetch pool analytics' });
  }
});

// Send notification email
async function sendTransactionNotification(userAccount, transactionId, gasCost) {
  try {
    // In a real app, you'd have user email mapping
    const userEmail = `${userAccount.slice(0, 8)}@example.com`;
    
    const mailOptions = {
      from: 'noreply@gasleap.dev',
      to: userEmail,
      subject: 'GasLeap Transaction Completed',
      html: `
        <h2>Transaction Sponsored Successfully!</h2>
        <p>Your transaction has been completed with sponsored gas fees.</p>
        <ul>
          <li><strong>Transaction ID:</strong> ${transactionId}</li>
          <li><strong>Gas Saved:</strong> ${gasCost} units</li>
          <li><strong>Account:</strong> ${userAccount}</li>
        </ul>
        <p>Thank you for using GasLeap!</p>
      `
    };
    
    await emailTransporter.sendMail(mailOptions);
    logger.info(`Notification sent for transaction ${transactionId}`);
  } catch (error) {
    logger.error('Failed to send notification', error);
  }
}

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`GasLeap API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});