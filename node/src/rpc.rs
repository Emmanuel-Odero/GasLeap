//! RPC interface for the GasLeap parachain node.

use std::sync::Arc;

use gasleap_runtime::{opaque::Block, AccountId, Balance, Index, BlockNumber};
use sc_client_api::AuxStore;
use sc_rpc_api::DenyUnsafe;
use sc_transaction_pool_api::TransactionPool;
use sp_api::ProvideRuntimeApi;
use sp_block_builder::BlockBuilder;
use sp_blockchain::{Error as BlockChainError, HeaderBackend, HeaderMetadata};
use sp_runtime::traits::BlakeTwo256;

/// Full client dependencies.
pub struct FullDeps<C, P> {
	/// The client instance to use.
	pub client: Arc<C>,
	/// Transaction pool instance.
	pub pool: Arc<P>,
	/// Whether to deny unsafe calls
	pub deny_unsafe: DenyUnsafe,
}

/// Instantiate all full RPC extensions.
pub fn create_full<C, P>(
	deps: FullDeps<C, P>,
) -> Result<jsonrpsee::RpcModule<()>, Box<dyn std::error::Error + Send + Sync>>
where
	C: ProvideRuntimeApi<Block>
		+ HeaderBackend<Block>
		+ AuxStore
		+ HeaderMetadata<Block, Error = BlockChainError>
		+ Sync
		+ Send
		+ 'static,
	C::Api: substrate_frame_rpc_system::AccountNonceApi<Block, AccountId, Index>,
	C::Api: pallet_transaction_payment_rpc::TransactionPaymentRuntimeApi<Block, Balance>,
	C::Api: gasleap_sponsorship_rpc_runtime_api::SponsorshipApi<Block, AccountId, Balance, BlockNumber>,
	C::Api: BlockBuilder<Block>,
	P: TransactionPool + 'static,
{
	use pallet_transaction_payment_rpc::{TransactionPayment, TransactionPaymentApiServer};
	use substrate_frame_rpc_system::{System, SystemApiServer};
	use pallet_sponsorship::rpc::{SponsorshipRpc, SponsorshipApiServer};

	let mut module = jsonrpsee::RpcModule::new(());
	let FullDeps { client, pool, deny_unsafe } = deps;

	// System RPC calls
	module.merge(System::new(client.clone(), pool, deny_unsafe).into_rpc())?;
	
	// Transaction payment RPC calls
	module.merge(TransactionPayment::new(client.clone()).into_rpc())?;

	// GasLeap Sponsorship RPC calls
	module.merge(SponsorshipRpc::new(client.clone()).into_rpc())?;

	Ok(module)
}