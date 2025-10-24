//! Runtime API definition for the sponsorship pallet.

#![cfg_attr(not(feature = "std"), no_std)]

use codec::Codec;
use sp_std::vec::Vec;

// Re-export types from the pallet
pub use pallet_sponsorship::{PoolId, PoolInfo, TransactionRecord};

sp_api::decl_runtime_apis! {
	/// The API to interact with sponsorship pallet.
	pub trait SponsorshipApi<AccountId, Balance, BlockNumber>
	where
		AccountId: Codec,
		Balance: Codec,
		BlockNumber: Codec,
	{
		/// Get pool information by ID
		fn get_pool(pool_id: PoolId) -> Option<PoolInfo<AccountId, Balance, BlockNumber>>;

		/// Get pools owned by an account
		fn get_pools_by_owner(owner: AccountId) -> Vec<(PoolId, PoolInfo<AccountId, Balance, BlockNumber>)>;

		/// Get transaction history for a pool
		fn get_transaction_history(pool_id: PoolId, limit: u32) -> Vec<TransactionRecord<AccountId, Balance, BlockNumber>>;

		/// Get user gas savings
		fn get_user_gas_savings(user: AccountId) -> Balance;

		/// Estimate gas cost for a transaction
		fn estimate_gas_cost(target_chain: u32, call_data: Vec<u8>) -> Balance;
	}
}