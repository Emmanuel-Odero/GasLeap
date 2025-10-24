use crate::{mock::*, Error, Event, PoolConfig, PoolStatus};
use frame_support::{assert_noop, assert_ok, traits::Get, BoundedVec};

#[test]
fn create_pool_works() {
	new_test_ext().execute_with(|| {
		// Go past genesis block so events get deposited
		System::set_block_number(1);

		let config = PoolConfig {
			max_transaction_value: 1000,
			daily_spending_limit: 5000,
			allowed_chains: BoundedVec::try_from(vec![1000, 2000]).unwrap(),
			authorization_required: false,
		};

		// Create pool should work
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config.clone()));

		// Check that pool was created
		let pool = Sponsorship::pools(0).unwrap();
		assert_eq!(pool.owner, 1);
		assert_eq!(pool.balance, 2000);
		assert_eq!(pool.status, PoolStatus::Active);
		assert_eq!(pool.config, config);

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
			allowed_chains: BoundedVec::try_from(vec![1000]).unwrap(),
			authorization_required: false,
		};

		// Create pool
		assert_ok!(Sponsorship::create_pool(RuntimeOrigin::signed(1), 2000, config));

		// Sponsor a transaction
		assert_ok!(Sponsorship::sponsor_transaction(
			RuntimeOrigin::signed(2),
			0,
			1000,
			vec![1, 2, 3, 4]
		));

		// Check that transaction was logged
		let tx = Sponsorship::transaction_log(0).unwrap();
		assert_eq!(tx.pool_id, 0);
		assert_eq!(tx.user, 2);
		assert_eq!(tx.target_chain, 1000);

		// Check that pool balance was reduced
		let pool = Sponsorship::pools(0).unwrap();
		assert_eq!(pool.balance, 1000); // 2000 - 1000 (estimated gas cost)
		assert_eq!(pool.total_spent, 1000);

		// Check that event was emitted
		System::assert_last_event(Event::TransactionSponsored {
			transaction_id: 0,
			pool_id: 0,
			user: 2,
			target_chain: 1000,
			gas_cost: 1000,
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