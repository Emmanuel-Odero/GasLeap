use crate::{mock::*, Error, Event, PoolConfig, PoolStatus, AuthorizationType, AuthorizationRule};
use frame_support::{assert_noop, assert_ok, BoundedVec};

#[test]
fn create_pool_works() {
	new_test_ext().execute_with(|| {
		// Go past genesis block so events get deposited
		System::set_block_number(1);

		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![2000, 2006]).unwrap(), // Acala and Astar
			authorization_required: false,
		};

		// Create pool should work
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config.clone()));

		// Check that pool was created
		let pool = Sponsorship::pools(0).unwrap();
		assert_eq!(pool.owner, 1);
		assert_eq!(pool.balance, 2000);
		assert_eq!(pool.status, PoolStatus::Active);
		assert_eq!(pool.config.max_transaction_value, config.max_transaction_value);
		assert_eq!(pool.config.daily_spending_limit, config.daily_spending_limit);
		assert_eq!(pool.config.authorization_required, config.authorization_required);

		// Check that event was emitted
		System::assert_last_event(Event::PoolCreated {
			pool_id: 0,
			owner: 1,
			initial_deposit: 2000,
		}.into());

		// Check that next pool ID was incremented
		assert_eq!(Sponsorship::next_pool_id(), 1);
	});
}

#[test]
fn create_pool_fails_with_insufficient_deposit() {
	new_test_ext().execute_with(|| {
		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: false,
		};

		// Should fail with deposit too small
		assert_noop!(
			Sponsorship::create_pool(RuntimeOrigin::signed(1), 500, config),
			Error::<Test>::DepositTooSmall
		);
	});
}

#[test]
fn fund_pool_works() {
	new_test_ext().execute_with(|| {
		System::set_block_number(1);

		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: false,
		};

		// Create pool first
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config));

		// Fund the pool
		assert_ok!(Sponsorship::fund_pool(RuntimeOrigin::signed(1), 0, 1000));

		// Check that pool balance was updated
		let pool = Sponsorship::pools(0).unwrap();
		assert_eq!(pool.balance, 3000);

		// Check that event was emitted
		System::assert_last_event(Event::PoolFunded {
			pool_id: 0,
			amount: 1000,
			new_balance: 3000,
		}.into());
	});
}

#[test]
fn fund_pool_fails_for_non_owner() {
	new_test_ext().execute_with(|| {
		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: false,
		};

		// Create pool with account 1
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config));

		// Try to fund with account 2 (should fail)
		assert_noop!(
			Sponsorship::fund_pool(RuntimeOrigin::signed(2), 0, 1000),
			Error::<Test>::NotPoolOwner
		);
	});
}

#[test]
fn sponsor_transaction_works() {
	new_test_ext().execute_with(|| {
		System::set_block_number(1);

		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![2006]).unwrap(), // Astar
			authorization_required: false,
		};

		// Create pool
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config));

		// Sponsor a transaction
		assert_ok!(Sponsorship::sponsor_transaction(
			RuntimeOrigin::signed(2),
			0,
			2006, // Astar parachain ID
			vec![1, 2, 3, 4]
		));

		// Check that transaction was logged
		let tx = Sponsorship::transaction_log(0).unwrap();
		assert_eq!(tx.pool_id, 0);
		assert_eq!(tx.user, 2);
		assert_eq!(tx.target_chain, 2006);

		// Check that pool balance was reduced
		let pool = Sponsorship::pools(0).unwrap();
		assert_eq!(pool.balance, 1192); // 2000 - 808 (Astar gas cost for 4-byte call)
		assert_eq!(pool.total_spent, 808);

		// Check that event was emitted
		System::assert_last_event(Event::TransactionSponsored {
			transaction_id: 0,
			pool_id: 0,
			user: 2,
			target_chain: 2006,
			gas_cost: 808, // Astar fee for 4-byte call
		}.into());
	});
}

#[test]
fn sponsor_transaction_fails_for_unsupported_chain() {
	new_test_ext().execute_with(|| {
		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: false,
		};

		// Create pool
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config));

		// Try to sponsor transaction on unsupported chain
		assert_noop!(
			Sponsorship::sponsor_transaction(
				RuntimeOrigin::signed(2),
				0,
				2000, // Chain not in allowed_chains
				vec![1, 2, 3, 4]
			),
			Error::<Test>::ChainNotSupported
		);
	});
}

// Additional comprehensive tests for pool configuration updates
#[test]
fn update_pool_config_works() {
	new_test_ext().execute_with(|| {
		System::set_block_number(1);

		let initial_config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: false,
		};

		// Create pool
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, initial_config));

		// Update configuration
		let new_config = PoolConfig {
			max_transaction_value: 2000,
			daily_spending_limit: 10000,
			allowed_chains: BoundedVec::try_from(vec![1000, 2000, 3000]).unwrap(),
			authorization_required: true,
		};

		assert_ok!(Sponsorship::update_pool_config(RuntimeOrigin::signed(1), 0, new_config.clone()));

		// Check that configuration was updated
		let pool = Sponsorship::pools(0).unwrap();
		assert_eq!(pool.config.max_transaction_value, new_config.max_transaction_value);
		assert_eq!(pool.config.daily_spending_limit, new_config.daily_spending_limit);
		assert_eq!(pool.config.allowed_chains, new_config.allowed_chains);
		assert_eq!(pool.config.authorization_required, new_config.authorization_required);

		// Check that event was emitted
		System::assert_last_event(Event::PoolConfigUpdated {
			pool_id: 0,
			owner: 1,
		}.into());
	});
}

#[test]
fn update_pool_config_fails_for_non_owner() {
	new_test_ext().execute_with(|| {
		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: false,
		};

		// Create pool with account 1
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config.clone()));

		// Try to update config with account 2 (should fail)
		assert_noop!(
			Sponsorship::update_pool_config(RuntimeOrigin::signed(2), 0, config),
			Error::<Test>::NotPoolOwner
		);
	});
}

#[test]
fn update_pool_config_fails_for_nonexistent_pool() {
	new_test_ext().execute_with(|| {
		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: false,
		};

		// Try to update config for non-existent pool
		assert_noop!(
			Sponsorship::update_pool_config(RuntimeOrigin::signed(1), 999, config),
			Error::<Test>::PoolNotFound
		);
	});
}

// Authorization rule tests
#[test]
fn add_authorization_rule_works() {
	new_test_ext().execute_with(|| {
		System::set_block_number(1);

		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: true,
		};

		// Create pool
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config));

		// Create authorization rule
		let rule = AuthorizationRule {
			rule_type: AuthorizationType::UserWhitelist,
			data: BoundedVec::try_from(vec![2u8, 3u8, 4u8]).unwrap(), // Whitelisted user IDs
			created_at: 1,
		};

		// Add authorization rule
		assert_ok!(Sponsorship::add_authorization_rule(RuntimeOrigin::signed(1), 0, rule.clone()));

		// Check that rule was stored
		let stored_rule = Sponsorship::pool_authorizations(0, AuthorizationType::UserWhitelist).unwrap();
		assert_eq!(stored_rule.rule_type, rule.rule_type);
		assert_eq!(stored_rule.data, rule.data);

		// Check that event was emitted
		System::assert_last_event(Event::AuthorizationRuleAdded {
			pool_id: 0,
			rule_type: AuthorizationType::UserWhitelist,
		}.into());
	});
}

#[test]
fn add_authorization_rule_fails_for_non_owner() {
	new_test_ext().execute_with(|| {
		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: true,
		};

		// Create pool with account 1
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config));

		let rule = AuthorizationRule {
			rule_type: AuthorizationType::UserWhitelist,
			data: BoundedVec::try_from(vec![2u8]).unwrap(),
			created_at: 1,
		};

		// Try to add rule with account 2 (should fail)
		assert_noop!(
			Sponsorship::add_authorization_rule(RuntimeOrigin::signed(2), 0, rule),
			Error::<Test>::NotPoolOwner
		);
	});
}

#[test]
fn remove_authorization_rule_works() {
	new_test_ext().execute_with(|| {
		System::set_block_number(1);

		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: true,
		};

		// Create pool
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config));

		// Add authorization rule first
		let rule = AuthorizationRule {
			rule_type: AuthorizationType::SpendingLimit,
			data: BoundedVec::try_from(vec![100u8]).unwrap(),
			created_at: 1,
		};
		assert_ok!(Sponsorship::add_authorization_rule(RuntimeOrigin::signed(1), 0, rule));

		// Remove authorization rule
		assert_ok!(Sponsorship::remove_authorization_rule(
			RuntimeOrigin::signed(1), 
			0, 
			AuthorizationType::SpendingLimit
		));

		// Check that rule was removed
		assert!(Sponsorship::pool_authorizations(0, AuthorizationType::SpendingLimit).is_none());

		// Check that event was emitted
		System::assert_last_event(Event::AuthorizationRuleRemoved {
			pool_id: 0,
			rule_type: AuthorizationType::SpendingLimit,
		}.into());
	});
}

#[test]
fn remove_authorization_rule_fails_for_non_owner() {
	new_test_ext().execute_with(|| {
		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: true,
		};

		// Create pool with account 1
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config));

		// Try to remove rule with account 2 (should fail)
		assert_noop!(
			Sponsorship::remove_authorization_rule(RuntimeOrigin::signed(2), 0, AuthorizationType::UserWhitelist),
			Error::<Test>::NotPoolOwner
		);
	});
}

// Error condition tests
#[test]
fn sponsor_transaction_fails_for_nonexistent_pool() {
	new_test_ext().execute_with(|| {
		// Try to sponsor transaction for non-existent pool
		assert_noop!(
			Sponsorship::sponsor_transaction(
				RuntimeOrigin::signed(1),
				999, // Non-existent pool
				1000,
				vec![1, 2, 3, 4]
			),
			Error::<Test>::PoolNotFound
		);
	});
}

#[test]
fn sponsor_transaction_fails_for_insufficient_funds() {
	new_test_ext().execute_with(|| {
		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![2006]).unwrap(), // Astar
			authorization_required: false,
		};

		// Create pool with minimal balance (need at least 1000 for minimum deposit)
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 1000, config));

		// First transaction should work (uses 808 gas for Astar)
		assert_ok!(Sponsorship::sponsor_transaction(
			RuntimeOrigin::signed(2),
			0,
			2006, // Astar
			vec![1, 2, 3, 4]
		));

		// Second transaction should fail due to insufficient funds
		assert_noop!(
			Sponsorship::sponsor_transaction(
				RuntimeOrigin::signed(2),
				0,
				2006, // Astar
				vec![5, 6, 7, 8]
			),
			Error::<Test>::InsufficientFunds
		);
	});
}

#[test]
fn fund_pool_fails_for_nonexistent_pool() {
	new_test_ext().execute_with(|| {
		// Try to fund non-existent pool
		assert_noop!(
			Sponsorship::fund_pool(RuntimeOrigin::signed(1), 999, 1000),
			Error::<Test>::PoolNotFound
		);
	});
}

#[test]
fn create_pool_with_multiple_chains() {
	new_test_ext().execute_with(|| {
		System::set_block_number(1);

		let config = PoolConfig {
			max_transaction_value: 2000,
			daily_spending_limit: 10000,
			allowed_chains: BoundedVec::try_from(vec![1000, 2000, 3000, 4000]).unwrap(),
			authorization_required: false,
		};

		// Create pool with multiple supported chains
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 5000, config.clone()));

		let pool = Sponsorship::pools(0).unwrap();
		assert_eq!(pool.config.allowed_chains.len(), 4);
		assert!(pool.config.allowed_chains.contains(&1000));
		assert!(pool.config.allowed_chains.contains(&2000));
		assert!(pool.config.allowed_chains.contains(&3000));
		assert!(pool.config.allowed_chains.contains(&4000));
	});
}

#[test]
fn sponsor_transaction_creates_correct_transaction_record() {
	new_test_ext().execute_with(|| {
		System::set_block_number(5);

		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![2006]).unwrap(), // Astar
			authorization_required: false,
		};

		// Create pool
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 3000, config));

		let call_data = vec![1, 2, 3, 4, 5];
		
		// Sponsor transaction
		assert_ok!(Sponsorship::sponsor_transaction(
			RuntimeOrigin::signed(2),
			0,
			2006, // Astar
			call_data.clone()
		));

		// Check transaction record
		let tx_record = Sponsorship::transaction_log(0).unwrap();
		assert_eq!(tx_record.id, 0);
		assert_eq!(tx_record.pool_id, 0);
		assert_eq!(tx_record.user, 2);
		assert_eq!(tx_record.target_chain, 2006);
		assert_eq!(tx_record.gas_cost, 810); // Astar fee estimation: 800 base + 10 call fee (5 * 2)
		assert_eq!(tx_record.timestamp, 5);

		// Check that next transaction ID was incremented
		assert_eq!(Sponsorship::next_transaction_id(), 1);
	});
}

#[test]
fn multiple_pools_can_be_created() {
	new_test_ext().execute_with(|| {
		System::set_block_number(1);

		let config1 = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: false,
		};

		let config2 = PoolConfig {
			max_transaction_value: 2000,
			daily_spending_limit: 10000,
			allowed_chains: BoundedVec::try_from(vec![2000]).unwrap(),
			authorization_required: true,
		};

		// Create first pool
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config1));
		
		// Create second pool
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(2), 3000, config2));

		// Check both pools exist
		let pool1 = Sponsorship::pools(0).unwrap();
		let pool2 = Sponsorship::pools(1).unwrap();

		assert_eq!(pool1.owner, 1);
		assert_eq!(pool1.balance, 2000);
		assert_eq!(pool2.owner, 2);
		assert_eq!(pool2.balance, 3000);

		// Check next pool ID
		assert_eq!(Sponsorship::next_pool_id(), 2);
	});
}

#[test]
fn pool_balance_updates_correctly_after_funding() {
	new_test_ext().execute_with(|| {
		System::set_block_number(1);

		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: false,
		};

		// Create pool
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config));

		// Fund pool multiple times
		assert_ok!(Sponsorship::fund_pool(RuntimeOrigin::signed(1), 0, 1000));
		assert_ok!(Sponsorship::fund_pool(RuntimeOrigin::signed(1), 0, 500));

		// Check final balance
		let pool = Sponsorship::pools(0).unwrap();
		assert_eq!(pool.balance, 3500); // 2000 + 1000 + 500
	});
}

#[test]
fn authorization_rules_can_be_overwritten() {
	new_test_ext().execute_with(|| {
		System::set_block_number(1);

		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: true,
		};

		// Create pool
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config));

		// Add first rule
		let rule1 = AuthorizationRule {
			rule_type: AuthorizationType::UserWhitelist,
			data: BoundedVec::try_from(vec![2u8]).unwrap(),
			created_at: 1,
		};
		assert_ok!(Sponsorship::add_authorization_rule(RuntimeOrigin::signed(1), 0, rule1));

		// Add second rule with same type (should overwrite)
		let rule2 = AuthorizationRule {
			rule_type: AuthorizationType::UserWhitelist,
			data: BoundedVec::try_from(vec![3u8, 4u8]).unwrap(),
			created_at: 2,
		};
		assert_ok!(Sponsorship::add_authorization_rule(RuntimeOrigin::signed(1), 0, rule2.clone()));

		// Check that second rule overwrote the first
		let stored_rule = Sponsorship::pool_authorizations(0, AuthorizationType::UserWhitelist).unwrap();
		assert_eq!(stored_rule.data, rule2.data);
		assert_eq!(stored_rule.created_at, 2);
	});
}