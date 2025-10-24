//! RPC interface for the sponsorship pallet.

use std::sync::Arc;
use codec::Codec;
use jsonrpsee::{
	core::{Error as JsonRpseeError, RpcResult},
	proc_macros::rpc,
	types::error::{CallError, ErrorCode, ErrorObject},
};
use sp_api::ProvideRuntimeApi;
use sp_blockchain::HeaderBackend;
use sp_runtime::{generic::BlockId, traits::Block as BlockT};
use sp_std::vec::Vec;

use crate::{PoolId, PoolInfo, TransactionRecord};

pub use gasleap_sponsorship_rpc_runtime_api::SponsorshipApi as SponsorshipRuntimeApi;

#[rpc(client, server)]
pub trait SponsorshipApi<BlockHash, AccountId, Balance, BlockNumber> {
	/// Get pool information by ID
	#[method(name = "sponsorship_getPool")]
	fn get_pool(
		&self,
		pool_id: PoolId,
		at: Option<BlockHash>,
	) -> RpcResult<Option<PoolInfo<AccountId, Balance, BlockNumber>>>;

	/// Get pools owned by an account
	#[method(name = "sponsorship_getPoolsByOwner")]
	fn get_pools_by_owner(
		&self,
		owner: AccountId,
		at: Option<BlockHash>,
	) -> RpcResult<Vec<(PoolId, PoolInfo<AccountId, Balance, BlockNumber>)>>;

	/// Get transaction history for a pool
	#[method(name = "sponsorship_getTransactionHistory")]
	fn get_transaction_history(
		&self,
		pool_id: PoolId,
		limit: Option<u32>,
		at: Option<BlockHash>,
	) -> RpcResult<Vec<TransactionRecord<AccountId, Balance, BlockNumber>>>;

	/// Get user gas savings
	#[method(name = "sponsorship_getUserGasSavings")]
	fn get_user_gas_savings(
		&self,
		user: AccountId,
		at: Option<BlockHash>,
	) -> RpcResult<Balance>;

	/// Estimate gas cost for a transaction
	#[method(name = "sponsorship_estimateGasCost")]
	fn estimate_gas_cost(
		&self,
		target_chain: u32,
		call_data: Vec<u8>,
		at: Option<BlockHash>,
	) -> RpcResult<Balance>;
}

/// A struct that implements the `SponsorshipApi`.
pub struct SponsorshipRpc<C, Block> {
	/// Shared reference to the client.
	client: Arc<C>,
	_marker: std::marker::PhantomData<Block>,
}

impl<C, Block> SponsorshipRpc<C, Block> {
	/// Create new `SponsorshipRpc` instance with the given reference to the client.
	pub fn new(client: Arc<C>) -> Self {
		Self {
			client,
			_marker: Default::default(),
		}
	}
}

impl<C, Block, AccountId, Balance, BlockNumber>
	SponsorshipApiServer<Block::Hash, AccountId, Balance, BlockNumber>
	for SponsorshipRpc<C, Block>
where
	Block: BlockT,
	AccountId: Clone + std::fmt::Display + Codec,
	Balance: Clone + std::fmt::Display + Codec,
	BlockNumber: Clone + std::fmt::Display + Codec,
	C: Send + Sync + 'static,
	C: ProvideRuntimeApi<Block>,
	C: HeaderBackend<Block>,
	C::Api: SponsorshipRuntimeApi<Block, AccountId, Balance, BlockNumber>,
{
	fn get_pool(
		&self,
		pool_id: PoolId,
		at: Option<Block::Hash>,
	) -> RpcResult<Option<PoolInfo<AccountId, Balance, BlockNumber>>> {
		let api = self.client.runtime_api();
		let at = BlockId::hash(at.unwrap_or_else(|| self.client.info().best_hash));

		let runtime_api_result = api.get_pool(&at, pool_id);
		runtime_api_result.map_err(|e| {
			JsonRpseeError::Call(CallError::Custom(ErrorObject::owned(
				ErrorCode::InternalError.code(),
				"Something wrong",
				Some(format!("{:?}", e)),
			)))
		})
	}

	fn get_pools_by_owner(
		&self,
		owner: AccountId,
		at: Option<Block::Hash>,
	) -> RpcResult<Vec<(PoolId, PoolInfo<AccountId, Balance, BlockNumber>)>> {
		let api = self.client.runtime_api();
		let at = BlockId::hash(at.unwrap_or_else(|| self.client.info().best_hash));

		let runtime_api_result = api.get_pools_by_owner(&at, owner);
		runtime_api_result.map_err(|e| {
			JsonRpseeError::Call(CallError::Custom(ErrorObject::owned(
				ErrorCode::InternalError.code(),
				"Something wrong",
				Some(format!("{:?}", e)),
			)))
		})
	}

	fn get_transaction_history(
		&self,
		pool_id: PoolId,
		limit: Option<u32>,
		at: Option<Block::Hash>,
	) -> RpcResult<Vec<TransactionRecord<AccountId, Balance, BlockNumber>>> {
		let api = self.client.runtime_api();
		let at = BlockId::hash(at.unwrap_or_else(|| self.client.info().best_hash));

		let runtime_api_result = api.get_transaction_history(&at, pool_id, limit.unwrap_or(50));
		runtime_api_result.map_err(|e| {
			JsonRpseeError::Call(CallError::Custom(ErrorObject::owned(
				ErrorCode::InternalError.code(),
				"Something wrong",
				Some(format!("{:?}", e)),
			)))
		})
	}

	fn get_user_gas_savings(
		&self,
		user: AccountId,
		at: Option<Block::Hash>,
	) -> RpcResult<Balance> {
		let api = self.client.runtime_api();
		let at = BlockId::hash(at.unwrap_or_else(|| self.client.info().best_hash));

		let runtime_api_result = api.get_user_gas_savings(&at, user);
		runtime_api_result.map_err(|e| {
			JsonRpseeError::Call(CallError::Custom(ErrorObject::owned(
				ErrorCode::InternalError.code(),
				"Something wrong",
				Some(format!("{:?}", e)),
			)))
		})
	}

	fn estimate_gas_cost(
		&self,
		target_chain: u32,
		call_data: Vec<u8>,
		at: Option<Block::Hash>,
	) -> RpcResult<Balance> {
		let api = self.client.runtime_api();
		let at = BlockId::hash(at.unwrap_or_else(|| self.client.info().best_hash));

		let runtime_api_result = api.estimate_gas_cost(&at, target_chain, call_data);
		runtime_api_result.map_err(|e| {
			JsonRpseeError::Call(CallError::Custom(ErrorObject::owned(
				ErrorCode::InternalError.code(),
				"Something wrong",
				Some(format!("{:?}", e)),
			)))
		})
	}
}