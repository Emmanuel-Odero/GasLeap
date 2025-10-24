#![cfg_attr(not(feature = "std"), no_std)]

/// Edit this file to define custom logic or remove it if it is not needed.
/// Learn more about FRAME and the core library of Substrate FRAME pallets:
/// <https://docs.substrate.io/reference/frame-pallets/>
pub use pallet::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

pub mod weights;
pub use weights::*;

pub mod xcm_gateway;
pub use xcm_gateway::*;

pub mod rpc;

#[frame_support::pallet]
pub mod pallet {
	use super::*;
	use frame_support::pallet_prelude::*;
	use frame_system::pallet_prelude::*;
	use sp_runtime::traits::{AccountIdConversion, Saturating, Zero, Hash};
	use frame_support::traits::ReservableCurrency;
	use sp_std::vec::Vec;

	pub type PoolId = u32;
	pub type Balance<T> = <<T as Config>::Currency as frame_support::traits::Currency<
		<T as frame_system::Config>::AccountId,
	>>::Balance;
	pub type BlockNumberFor<T> = frame_system::pallet_prelude::BlockNumberFor<T>;

	#[pallet::pallet]
	pub struct Pallet<T>(_);

	/// Configure the pallet by specifying the parameters and types on which it depends.
	#[pallet::config]
	pub trait Config: frame_system::Config + core::fmt::Debug {
		/// Because this pallet emits events, it depends on the runtime's definition of an event.
		type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

		/// The currency trait.
		type Currency: frame_support::traits::Currency<Self::AccountId>
			+ frame_support::traits::ReservableCurrency<Self::AccountId>;

		/// The pallet's id, used for deriving its sovereign account ID.
		#[pallet::constant]
		type PalletId: Get<frame_support::PalletId>;

		/// Maximum number of pools per account
		#[pallet::constant]
		type MaxPoolsPerAccount: Get<u32>;

		/// Maximum number of authorizations per pool
		#[pallet::constant]
		type MaxAuthorizationsPerPool: Get<u32>;

		/// Minimum deposit required to create a pool
		#[pallet::constant]
		type MinPoolDeposit: Get<Balance<Self>>;

		/// Weight information for extrinsics in this pallet.
		type WeightInfo: WeightInfo;
	}

	/// Pool information storage
	#[pallet::storage]
	#[pallet::getter(fn pools)]
	pub type Pools<T: Config> = StorageMap<_, Blake2_128Concat, PoolId, PoolInfo<T>>;

	/// Next available pool ID
	#[pallet::storage]
	#[pallet::getter(fn next_pool_id)]
	pub type NextPoolId<T: Config> = StorageValue<_, PoolId, ValueQuery>;

	/// Pool ownership mapping
	#[pallet::storage]
	#[pallet::getter(fn pool_owners)]
	pub type PoolOwners<T: Config> = StorageDoubleMap<
		_,
		Blake2_128Concat,
		T::AccountId,
		Blake2_128Concat,
		PoolId,
		(),
		OptionQuery,
	>;

	/// Pool authorization rules
	#[pallet::storage]
	#[pallet::getter(fn pool_authorizations)]
	pub type PoolAuthorizations<T: Config> = StorageDoubleMap<
		_,
		Blake2_128Concat,
		PoolId,
		Blake2_128Concat,
		AuthorizationType,
		AuthorizationRule<T>,
		OptionQuery,
	>;

	/// User spending tracking
	#[pallet::storage]
	#[pallet::getter(fn user_spending)]
	pub type UserSpending<T: Config> = StorageDoubleMap<
		_,
		Blake2_128Concat,
		PoolId,
		Blake2_128Concat,
		T::AccountId,
		SpendingInfo<T>,
		ValueQuery,
	>;

	/// Transaction log for audit purposes
	#[pallet::storage]
	#[pallet::getter(fn transaction_log)]
	pub type TransactionLog<T: Config> = StorageMap<_, Blake2_128Concat, u64, TransactionRecord<T>>;

	/// Next transaction ID
	#[pallet::storage]
	#[pallet::getter(fn next_transaction_id)]
	pub type NextTransactionId<T: Config> = StorageValue<_, u64, ValueQuery>;

	/// Pool configuration and metadata
	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	#[scale_info(skip_type_params(T))]
	pub struct PoolInfo<T: Config> {
		pub owner: T::AccountId,
		pub balance: Balance<T>,
		pub total_spent: Balance<T>,
		pub created_at: BlockNumberFor<T>,
		pub config: PoolConfig<T>,
		pub status: PoolStatus,
	}

	/// Pool configuration parameters
	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	#[scale_info(skip_type_params(T))]
	pub struct PoolConfig<T: Config> {
		pub max_transaction_value: Balance<T>,
		pub daily_spending_limit: Balance<T>,
		pub allowed_chains: BoundedVec<u32, ConstU32<100>>, // ParaId list - simplified for demo
		pub authorization_required: bool,
	}

	/// Pool status enumeration
	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	pub enum PoolStatus {
		Active,
		Paused,
		Closed,
	}

	/// Authorization rule types
	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	pub enum AuthorizationType {
		UserWhitelist,
		TransactionType,
		SpendingLimit,
	}

	/// Authorization rule definition
	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	#[scale_info(skip_type_params(T))]
	pub struct AuthorizationRule<T: Config> {
		pub rule_type: AuthorizationType,
		pub data: BoundedVec<u8, ConstU32<256>>, // Flexible data storage
		pub created_at: BlockNumberFor<T>,
	}

	/// User spending information
	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	#[scale_info(skip_type_params(T))]
	pub struct SpendingInfo<T: Config> {
		pub total_spent: Balance<T>,
		pub daily_spent: Balance<T>,
		pub last_reset: BlockNumberFor<T>,
	}

	impl<T: Config> Default for SpendingInfo<T> {
		fn default() -> Self {
			Self {
				total_spent: Zero::zero(),
				daily_spent: Zero::zero(),
				last_reset: Zero::zero(),
			}
		}
	}

	/// Transaction record for audit
	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	#[scale_info(skip_type_params(T))]
	pub struct TransactionRecord<T: Config> {
		pub id: u64,
		pub pool_id: PoolId,
		pub user: T::AccountId,
		pub target_chain: u32, // ParaId
		pub call_hash: T::Hash,
		pub gas_cost: Balance<T>,
		pub status: TransactionStatus,
		pub timestamp: BlockNumberFor<T>,
	}

	/// Transaction status enumeration
	#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
	pub enum TransactionStatus {
		Pending,
		Dispatched,
		Executed,
		Failed,
		Refunded,
	}

	// Pallets use events to inform users when important changes are made.
	// https://docs.substrate.io/main-docs/build/events-errors/
	#[pallet::event]
	#[pallet::generate_deposit(pub(super) fn deposit_event)]
	pub enum Event<T: Config> {
		/// Pool created successfully
		PoolCreated {
			pool_id: PoolId,
			owner: T::AccountId,
			initial_deposit: Balance<T>,
		},
		/// Pool funded with additional balance
		PoolFunded {
			pool_id: PoolId,
			amount: Balance<T>,
			new_balance: Balance<T>,
		},
		/// Pool configuration updated
		PoolConfigUpdated {
			pool_id: PoolId,
			owner: T::AccountId,
		},
		/// Transaction sponsored successfully
		TransactionSponsored {
			transaction_id: u64,
			pool_id: PoolId,
			user: T::AccountId,
			target_chain: u32,
			gas_cost: Balance<T>,
		},
		/// Authorization rule added
		AuthorizationRuleAdded {
			pool_id: PoolId,
			rule_type: AuthorizationType,
		},
		/// Authorization rule removed
		AuthorizationRuleRemoved {
			pool_id: PoolId,
			rule_type: AuthorizationType,
		},
	}

	// Errors inform users that something went wrong.
	#[pallet::error]
	pub enum Error<T> {
		/// Pool not found
		PoolNotFound,
		/// Insufficient funds in pool
		InsufficientFunds,
		/// Unauthorized user
		UnauthorizedUser,
		/// Invalid configuration
		InvalidConfiguration,
		/// Exceeds spending limit
		ExceedsSpendingLimit,
		/// Chain not supported
		ChainNotSupported,
		/// Transaction too large
		TransactionTooLarge,
		/// Pool is paused
		PoolPaused,
		/// Pool is closed
		PoolClosed,
		/// Not pool owner
		NotPoolOwner,
		/// Too many pools
		TooManyPools,
		/// Deposit too small
		DepositTooSmall,
	}

	// Dispatchable functions allow users to interact with the pallet and invoke state changes.
	// These functions materialize as "extrinsics", which are often compared to transactions.
	// Dispatchable functions must be annotated with a weight and must return a DispatchResult.
	#[pallet::call]
	impl<T: Config> Pallet<T> {
		/// Create a new sponsorship pool
		#[pallet::call_index(0)]
		#[pallet::weight(T::WeightInfo::create_pool())]
		pub fn create_pool(
			origin: OriginFor<T>,
			initial_deposit: Balance<T>,
			config: PoolConfig<T>,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;

			// Validate minimum deposit
			ensure!(
				initial_deposit >= T::MinPoolDeposit::get(),
				Error::<T>::DepositTooSmall
			);

			// Get next pool ID
			let pool_id = Self::next_pool_id();
			let next_id = pool_id.saturating_add(1);

			// Reserve funds from user
			T::Currency::reserve(&who, initial_deposit)?;

			// Create pool info
			let pool_info = PoolInfo {
				owner: who.clone(),
				balance: initial_deposit,
				total_spent: Zero::zero(),
				created_at: <frame_system::Pallet<T>>::block_number(),
				config,
				status: PoolStatus::Active,
			};

			// Store pool information
			<Pools<T>>::insert(&pool_id, &pool_info);
			<PoolOwners<T>>::insert(&who, &pool_id, ());
			<NextPoolId<T>>::put(next_id);

			// Emit event
			Self::deposit_event(Event::PoolCreated {
				pool_id,
				owner: who,
				initial_deposit,
			});

			Ok(())
		}

		/// Fund an existing pool
		#[pallet::call_index(1)]
		#[pallet::weight(T::WeightInfo::fund_pool())]
		pub fn fund_pool(
			origin: OriginFor<T>,
			pool_id: PoolId,
			amount: Balance<T>,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;

			// Get pool info
			let mut pool_info = Self::pools(&pool_id).ok_or(Error::<T>::PoolNotFound)?;

			// Check if user is owner
			ensure!(pool_info.owner == who, Error::<T>::NotPoolOwner);

			// Check pool status
			ensure!(pool_info.status == PoolStatus::Active, Error::<T>::PoolPaused);

			// Reserve additional funds
			T::Currency::reserve(&who, amount)?;

			// Update pool balance
			pool_info.balance = pool_info.balance.saturating_add(amount);
			let new_balance = pool_info.balance;

			// Store updated pool info
			<Pools<T>>::insert(&pool_id, &pool_info);

			// Emit event
			Self::deposit_event(Event::PoolFunded {
				pool_id,
				amount,
				new_balance,
			});

			Ok(())
		}

		/// Update pool configuration
		#[pallet::call_index(2)]
		#[pallet::weight(T::WeightInfo::update_pool_config())]
		pub fn update_pool_config(
			origin: OriginFor<T>,
			pool_id: PoolId,
			new_config: PoolConfig<T>,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;

			// Get pool info
			let mut pool_info = Self::pools(&pool_id).ok_or(Error::<T>::PoolNotFound)?;

			// Check if user is owner
			ensure!(pool_info.owner == who, Error::<T>::NotPoolOwner);

			// Update configuration
			pool_info.config = new_config;

			// Store updated pool info
			<Pools<T>>::insert(&pool_id, &pool_info);

			// Emit event
			Self::deposit_event(Event::PoolConfigUpdated {
				pool_id,
				owner: who,
			});

			Ok(())
		}

		/// Add authorization rule to pool
		#[pallet::call_index(3)]
		#[pallet::weight(T::WeightInfo::add_authorization_rule())]
		pub fn add_authorization_rule(
			origin: OriginFor<T>,
			pool_id: PoolId,
			rule: AuthorizationRule<T>,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;

			// Get pool info
			let pool_info = Self::pools(&pool_id).ok_or(Error::<T>::PoolNotFound)?;

			// Check if user is owner
			ensure!(pool_info.owner == who, Error::<T>::NotPoolOwner);

			// Store authorization rule
			<PoolAuthorizations<T>>::insert(&pool_id, &rule.rule_type, &rule);

			// Emit event
			Self::deposit_event(Event::AuthorizationRuleAdded {
				pool_id,
				rule_type: rule.rule_type,
			});

			Ok(())
		}

		/// Remove authorization rule from pool
		#[pallet::call_index(4)]
		#[pallet::weight(T::WeightInfo::remove_authorization_rule())]
		pub fn remove_authorization_rule(
			origin: OriginFor<T>,
			pool_id: PoolId,
			rule_type: AuthorizationType,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;

			// Get pool info
			let pool_info = Self::pools(&pool_id).ok_or(Error::<T>::PoolNotFound)?;

			// Check if user is owner
			ensure!(pool_info.owner == who, Error::<T>::NotPoolOwner);

			// Remove authorization rule
			<PoolAuthorizations<T>>::remove(&pool_id, &rule_type);

			// Emit event
			Self::deposit_event(Event::AuthorizationRuleRemoved {
				pool_id,
				rule_type,
			});

			Ok(())
		}

		/// Sponsor a cross-chain transaction using XCM Gateway
		#[pallet::call_index(5)]
		#[pallet::weight(T::WeightInfo::sponsor_transaction())]
		pub fn sponsor_transaction(
			origin: OriginFor<T>,
			pool_id: PoolId,
			target_chain: u32,
			call_data: Vec<u8>,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;

			// Get pool info
			let mut pool_info = Self::pools(&pool_id).ok_or(Error::<T>::PoolNotFound)?;

			// Check pool status
			ensure!(pool_info.status == PoolStatus::Active, Error::<T>::PoolPaused);

			// Check if chain is supported
			ensure!(
				pool_info.config.allowed_chains.contains(&target_chain),
				Error::<T>::ChainNotSupported
			);

			// TODO: Implement authorization checks
			// TODO: Implement spending limit checks

			// Get next transaction ID
			let transaction_id = Self::next_transaction_id();
			let next_tx_id = transaction_id.saturating_add(1);

			// Estimate gas cost using XCM Gateway
			let estimated_gas_cost = FeeEstimator::<T>::estimate_fee(target_chain, &call_data)
				.map_err(|_| Error::<T>::ChainNotSupported)?;

			// Check if pool has sufficient funds
			ensure!(
				pool_info.balance >= estimated_gas_cost,
				Error::<T>::InsufficientFunds
			);

			// Create transaction record
			let call_hash = T::Hashing::hash(&call_data);
			let transaction_record = TransactionRecord {
				id: transaction_id,
				pool_id,
				user: who.clone(),
				target_chain,
				call_hash,
				gas_cost: estimated_gas_cost,
				status: TransactionStatus::Pending,
				timestamp: <frame_system::Pallet<T>>::block_number(),
			};

			// Store transaction record
			<TransactionLog<T>>::insert(&transaction_id, &transaction_record);
			<NextTransactionId<T>>::put(next_tx_id);

			// Reserve gas cost from pool
			pool_info.balance = pool_info.balance.saturating_sub(estimated_gas_cost);
			pool_info.total_spent = pool_info.total_spent.saturating_add(estimated_gas_cost);
			<Pools<T>>::insert(&pool_id, &pool_info);

			// Send cross-chain transaction via XCM Gateway
			XcmGateway::<T>::send_cross_chain_transaction(
				pool_id,
				who.clone(),
				target_chain,
				call_data,
				transaction_id,
			).map_err(|_| Error::<T>::ChainNotSupported)?;

			// Emit event
			Self::deposit_event(Event::TransactionSponsored {
				transaction_id,
				pool_id,
				user: who,
				target_chain,
				gas_cost: estimated_gas_cost,
			});

			Ok(())
		}

		/// Process transaction receipt from target parachain
		#[pallet::call_index(6)]
		#[pallet::weight(T::WeightInfo::process_receipt())]
		pub fn process_receipt(
			origin: OriginFor<T>,
			receipt: TransactionReceipt<T>,
		) -> DispatchResult {
			// In production, this would be called by XCM message handler
			// For demo, allow signed calls for testing
			let _who = ensure_signed(origin)?;

			// Process the receipt through XCM Gateway
			let result = ReceiptProcessor::<T>::process_receipt(receipt)
				.map_err(|_| Error::<T>::InvalidConfiguration)?;

			// Log the processing result
			match result {
				ReceiptProcessingResult::Processed => {
					log::info!("Receipt processed successfully");
				},
				ReceiptProcessingResult::AlreadyProcessed => {
					log::warn!("Receipt was already processed");
				},
				ReceiptProcessingResult::InvalidReceipt => {
					return Err(Error::<T>::InvalidConfiguration.into());
				},
				ReceiptProcessingResult::PoolUpdateFailed => {
					return Err(Error::<T>::InsufficientFunds.into());
				},
			}

			Ok(())
		}
	}

	impl<T: Config> Pallet<T> {
		/// Get the account ID of the pallet
		pub fn account_id() -> T::AccountId {
			T::PalletId::get().into_account_truncating()
		}

		/// Get pool information by ID (for RPC)
		pub fn get_pool_info(pool_id: PoolId) -> Option<PoolInfo<T>> {
			Self::pools(pool_id)
		}

		/// Get pools owned by an account (for RPC)
		pub fn get_pools_by_owner_account(owner: &T::AccountId) -> Vec<(PoolId, PoolInfo<T>)> {
			let mut pools = Vec::new();
			for (pool_id, _) in <PoolOwners<T>>::iter_prefix(owner) {
				if let Some(pool_info) = Self::pools(pool_id) {
					pools.push((pool_id, pool_info));
				}
			}
			pools
		}

		/// Get transaction history for a pool (for RPC)
		pub fn get_pool_transaction_history(pool_id: PoolId, limit: u32) -> Vec<TransactionRecord<T>> {
			let mut transactions = Vec::new();
			let mut count = 0u32;
			
			// In a real implementation, we'd have better indexing
			// For demo, we iterate through all transactions
			for (tx_id, tx_record) in <TransactionLog<T>>::iter() {
				if tx_record.pool_id == pool_id {
					transactions.push(tx_record);
					count += 1;
					if count >= limit {
						break;
					}
				}
			}
			
			transactions
		}

		/// Get user gas savings (for RPC)
		pub fn get_user_total_gas_savings(user: &T::AccountId) -> Balance<T> {
			let mut total_savings = Zero::zero();
			
			// Sum up gas costs from all transactions by this user
			for (_, tx_record) in <TransactionLog<T>>::iter() {
				if tx_record.user == *user && tx_record.status == TransactionStatus::Executed {
					total_savings = total_savings.saturating_add(tx_record.gas_cost);
				}
			}
			
			total_savings
		}

		/// Estimate gas cost for a transaction (for RPC)
		pub fn estimate_transaction_gas_cost(target_chain: u32, call_data: &[u8]) -> Balance<T> {
			// Use the XCM Gateway fee estimator
			FeeEstimator::<T>::estimate_fee(target_chain, call_data)
				.unwrap_or_else(|_| {
					// Fallback estimation based on call data size
					let base_fee = 1000u32.into(); // Base fee in smallest unit
					let per_byte_fee = 10u32.into(); // Per byte fee
					let call_size: u32 = call_data.len().try_into().unwrap_or(0);
					
					base_fee.saturating_add(per_byte_fee.saturating_mul(call_size.into()))
				})
		}
	}
}