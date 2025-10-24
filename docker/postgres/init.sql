-- GasLeap Database Initialization Script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Transaction history table
CREATE TABLE IF NOT EXISTS transaction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    pool_id VARCHAR(255) NOT NULL,
    user_account VARCHAR(255) NOT NULL,
    target_chain INTEGER NOT NULL,
    call_hash VARCHAR(255) NOT NULL,
    gas_cost BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    block_number BIGINT,
    tx_hash VARCHAR(255),
    error_message TEXT
);

-- Pool analytics table
CREATE TABLE IF NOT EXISTS pool_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    total_transactions INTEGER DEFAULT 0,
    total_gas_sponsored BIGINT DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pool_id, date)
);

-- User gas savings table
CREATE TABLE IF NOT EXISTS user_gas_savings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_account VARCHAR(255) NOT NULL,
    total_saved BIGINT DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_account)
);

-- Notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_history_pool_id ON transaction_history(pool_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_user_account ON transaction_history(user_account);
CREATE INDEX IF NOT EXISTS idx_transaction_history_status ON transaction_history(status);
CREATE INDEX IF NOT EXISTS idx_transaction_history_created_at ON transaction_history(created_at);
CREATE INDEX IF NOT EXISTS idx_pool_analytics_pool_date ON pool_analytics(pool_id, date);
CREATE INDEX IF NOT EXISTS idx_user_gas_savings_account ON user_gas_savings(user_account);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);

-- Insert demo data for development
INSERT INTO user_gas_savings (user_account, total_saved, transaction_count, last_transaction_at) 
VALUES 
    ('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 1250, 8, NOW() - INTERVAL '2 hours'),
    ('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 890, 5, NOW() - INTERVAL '1 day'),
    ('5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y', 2100, 12, NOW() - INTERVAL '30 minutes')
ON CONFLICT (user_account) DO NOTHING;

-- Insert demo transaction history
INSERT INTO transaction_history (
    transaction_id, pool_id, user_account, target_chain, call_hash, 
    gas_cost, status, created_at, block_number, tx_hash
) VALUES 
    ('tx_demo_001', 'demo-pool-1', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 1000, '0xabc123', 150, 'executed', NOW() - INTERVAL '2 hours', 12345, '0xdef456'),
    ('tx_demo_002', 'demo-pool-1', '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 2000, '0xbcd234', 200, 'executed', NOW() - INTERVAL '1 day', 12340, '0xefg567'),
    ('tx_demo_003', 'demo-pool-2', '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y', 1000, '0xcde345', 175, 'executed', NOW() - INTERVAL '30 minutes', 12350, '0xfgh678')
ON CONFLICT (transaction_id) DO NOTHING;

-- Create a function to update user gas savings
CREATE OR REPLACE FUNCTION update_user_gas_savings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_gas_savings (user_account, total_saved, transaction_count, last_transaction_at)
    VALUES (NEW.user_account, NEW.gas_cost, 1, NEW.created_at)
    ON CONFLICT (user_account) 
    DO UPDATE SET 
        total_saved = user_gas_savings.total_saved + NEW.gas_cost,
        transaction_count = user_gas_savings.transaction_count + 1,
        last_transaction_at = NEW.created_at,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update gas savings
DROP TRIGGER IF EXISTS trigger_update_gas_savings ON transaction_history;
CREATE TRIGGER trigger_update_gas_savings
    AFTER INSERT ON transaction_history
    FOR EACH ROW
    WHEN (NEW.status = 'executed')
    EXECUTE FUNCTION update_user_gas_savings();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gasleap;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gasleap;