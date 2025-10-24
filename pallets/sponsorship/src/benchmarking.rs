//! Benchmarking setup for pallet-sponsorship

use super::*;

#[allow(unused)]
use crate::Pallet as Sponsorship;
use frame_benchmarking::{benchmarks, whitelisted_caller};
use frame_system::RawOrigin;
use frame_support::BoundedVec;

benchmarks! {
	create_pool {
		let caller: T::AccountId = whitelisted_caller();
		let config = PoolConfig {
			max_transaction_value: 1000u32.into(),
			daily_spending_limit: 5000u32.into(),
			allowed_chains: BoundedVec::try_from(vec![1000u32]).unwrap(),
			authorization_required: false,
		};
		let deposit = T::MinPoolDeposit::get();
	}: _(RawOrigin::Signed(caller), deposit, config)
	verify {
		assert_eq!(Sponsorship::<T>::next_pool_id(), 1);
	}

	fund_pool {
		let caller: T::AccountId = whitelisted_caller();
		let config = PoolConfig {
			max_transaction_value: 1000u32.into(),
			daily_spending_limit: 5000u32.into(),
			allowed_chains: BoundedVec::try_from(vec![1000u32]).unwrap(),
			authorization_required: false,
		};
		let deposit = T::MinPoolDeposit::get();
		let _ = Sponsorship::<T>::create_pool(RawOrigin::Signed(caller.clone()).into(), deposit, config);
		let additional_amount = 1000u32.into();
	}: _(RawOrigin::Signed(caller), 0, additional_amount)
	verify {
		let pool = Sponsorship::<T>::pools(0).unwrap();
		assert_eq!(pool.balance, deposit + additional_amount);
	}

	update_pool_config {
		let caller: T::AccountId = whitelisted_caller();
		let config = PoolConfig {
			max_transaction_value: 1000u32.into(),
			daily_spending_limit: 5000u32.into(),
			allowed_chains: BoundedVec::try_from(vec![1000u32]).unwrap(),
			authorization_required: false,
		};
		let deposit = T::MinPoolDeposit::get();
		let _ = Sponsorship::<T>::create_pool(RawOrigin::Signed(caller.clone()).into(), deposit, config.clone());
		let new_config = PoolConfig {
			max_transaction_value: 2000u32.into(),
			daily_spending_limit: 10000u32.into(),
			allowed_chains: BoundedVec::try_from(vec![1000u32, 2000u32]).unwrap(),
			authorization_required: true,
		};
	}: _(RawOrigin::Signed(caller), 0, new_config.clone())
	verify {
		let pool = Sponsorship::<T>::pools(0).unwrap();
		assert_eq!(pool.config, new_config);
	}

	add_authorization_rule {
		let caller: T::AccountId = whitelisted_caller();
		let config = PoolConfig {
			max_transaction_value: 1000u32.into(),
			daily_spending_limit: 5000u32.into(),
			allowed_chains: BoundedVec::try_from(vec![1000u32]).unwrap(),
			authorization_required: false,
		};
		let deposit = T::MinPoolDeposit::get();
		let _ = Sponsorship::<T>::create_pool(RawOrigin::Signed(caller.clone()).into(), deposit, config);
		let rule = AuthorizationRule {
			rule_type: AuthorizationType::UserWhitelist,
			data: BoundedVec::try_from(vec![1u8, 2u8, 3u8]).unwrap(),
			created_at: 1u32.into(),
		};
	}: _(RawOrigin::Signed(caller), 0, rule.clone())
	verify {
		assert!(Sponsorship::<T>::pool_authorizations(0, &rule.rule_type).is_some());
	}

	remove_authorization_rule {
		let caller: T::AccountId = whitelisted_caller();
		let config = PoolConfig {
			max_transaction_value: 1000u32.into(),
			daily_spending_limit: 5000u32.into(),
			allowed_chains: BoundedVec::try_from(vec![1000u32]).unwrap(),
			authorization_required: false,
		};
		let deposit = T::MinPoolDeposit::get();
		let _ = Sponsorship::<T>::create_pool(RawOrigin::Signed(caller.clone()).into(), deposit, config);
		let rule = AuthorizationRule {
			rule_type: AuthorizationType::UserWhitelist,
			data: BoundedVec::try_from(vec![1u8, 2u8, 3u8]).unwrap(),
			created_at: 1u32.into(),
		};
		let _ = Sponsorship::<T>::add_authorization_rule(RawOrigin::Signed(caller.clone()).into(), 0, rule.clone());
	}: _(RawOrigin::Signed(caller), 0, rule.rule_type.clone())
	verify {
		assert!(Sponsorship::<T>::pool_authorizations(0, &rule.rule_type).is_none());
	}

	sponsor_transaction {
		let caller: T::AccountId = whitelisted_caller();
		let config = PoolConfig {
			max_transaction_value: 1000u32.into(),
			daily_spending_limit: 5000u32.into(),
			allowed_chains: BoundedVec::try_from(vec![1000u32]).unwrap(),
			authorization_required: false,
		};
		let deposit = T::MinPoolDeposit::get();
		let _ = Sponsorship::<T>::create_pool(RawOrigin::Signed(caller.clone()).into(), deposit, config);
		let call_data = vec![1u8, 2u8, 3u8, 4u8];
	}: _(RawOrigin::Signed(caller), 0, 1000u32, call_data)
	verify {
		assert_eq!(Sponsorship::<T>::next_transaction_id(), 1);
	}

	impl_benchmark_test_suite!(Sponsorship, crate::mock::new_test_ext(), crate::mock::Test);
}