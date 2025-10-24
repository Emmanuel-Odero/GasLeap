use frame_support::pallet_prelude::*;
use sp_runtime::traits::{Hash, Saturating};
use sp_std::{collections::btree_map::BTreeMap, vec::Vec};
use crate::{Config, PoolId, Balance, TransactionStatus};

/// Simplified XCM message structure for hackathon demo
#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
#[scale_info(skip_type_params(T))]
pub struct DemoXcmMessage<T: Config> {
    /// Target parachain ID
    pub target: u32,
    /// Raw call data to execute
    pub call: BoundedVec<u8, ConstU32<1024>>,
    /// Maximum fee willing to pay
    pub max_fee: Balance<T>,
    /// Reference to sponsoring pool
    pub sponsor: PoolId,
    /// Transaction ID for tracking
    pub transaction_id: u64,
}

/// XCM message validation result
#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo)]
pub enum ValidationResult {
    Valid,
    InvalidTarget,
    InvalidCallData,
    ExcessiveFee,
    UnsupportedVersion,
}

/// Pending transaction tracking
#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
#[scale_info(skip_type_params(T))]
pub struct PendingTransaction<T: Config> {
    pub transaction_id: u64,
    pub pool_id: PoolId,
    pub user: T::AccountId,
    pub target_chain: u32,
    pub call_hash: T::Hash,
    pub reserved_fee: Balance<T>,
    pub retry_count: u8,
    pub created_at: frame_system::pallet_prelude::BlockNumberFor<T>,
    pub last_retry_at: frame_system::pallet_prelude::BlockNumberFor<T>,
}

/// XCM Gateway error types
#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo)]
pub enum XcmGatewayError {
    MessageFormatError,
    UnsupportedDestination,
    FeeEstimationFailed,
    DeliveryTimeout,
    ExecutionFailed,
    ReceiptProcessingError,
}

/// XCM message builder for creating properly formatted messages
pub struct XcmMessageBuilder<T: Config> {
    _phantom: sp_std::marker::PhantomData<T>,
}

impl<T: Config> XcmMessageBuilder<T> {
    /// Create a new XCM message for the demo
    pub fn build_demo_message(
        target_parachain: u32,
        call_data: Vec<u8>,
        max_fee: Balance<T>,
        pool_id: PoolId,
        transaction_id: u64,
    ) -> Result<DemoXcmMessage<T>, XcmGatewayError> {
        // Validate call data size
        let bounded_call = BoundedVec::try_from(call_data)
            .map_err(|_| XcmGatewayError::MessageFormatError)?;

        // Create the demo XCM message
        let message = DemoXcmMessage {
            target: target_parachain,
            call: bounded_call,
            max_fee,
            sponsor: pool_id,
            transaction_id,
        };

        Ok(message)
    }

    /// Format message for Astar parachain (demo-specific)
    pub fn format_for_astar(
        call_data: Vec<u8>,
        max_fee: Balance<T>,
        pool_id: PoolId,
        transaction_id: u64,
    ) -> Result<DemoXcmMessage<T>, XcmGatewayError> {
        const ASTAR_PARA_ID: u32 = 2006; // Astar parachain ID on Polkadot
        Self::build_demo_message(ASTAR_PARA_ID, call_data, max_fee, pool_id, transaction_id)
    }

    /// Format message for Acala parachain (demo-specific)
    pub fn format_for_acala(
        call_data: Vec<u8>,
        max_fee: Balance<T>,
        pool_id: PoolId,
        transaction_id: u64,
    ) -> Result<DemoXcmMessage<T>, XcmGatewayError> {
        const ACALA_PARA_ID: u32 = 2000; // Acala parachain ID on Polkadot
        Self::build_demo_message(ACALA_PARA_ID, call_data, max_fee, pool_id, transaction_id)
    }

    /// Generic message formatter for any supported parachain
    pub fn format_for_parachain(
        target_parachain: u32,
        call_data: Vec<u8>,
        max_fee: Balance<T>,
        pool_id: PoolId,
        transaction_id: u64,
    ) -> Result<DemoXcmMessage<T>, XcmGatewayError> {
        // Validate target parachain is supported
        if !Self::is_supported_parachain(target_parachain) {
            return Err(XcmGatewayError::UnsupportedDestination);
        }

        Self::build_demo_message(target_parachain, call_data, max_fee, pool_id, transaction_id)
    }

    /// Check if parachain is supported for demo
    fn is_supported_parachain(para_id: u32) -> bool {
        matches!(para_id, 2000 | 2006 | 2012 | 2030) // Acala, Astar, Parallel, Bifrost
    }
}

/// XCM message validator for ensuring message integrity
pub struct XcmMessageValidator<T: Config> {
    _phantom: sp_std::marker::PhantomData<T>,
}

impl<T: Config> XcmMessageValidator<T> {
    /// Validate XCM message before dispatch
    pub fn validate_message(message: &DemoXcmMessage<T>) -> ValidationResult {
        // Check target parachain
        if !Self::is_valid_target(message.target) {
            return ValidationResult::InvalidTarget;
        }

        // Check call data
        if message.call.is_empty() || message.call.len() > 1024 {
            return ValidationResult::InvalidCallData;
        }

        // Check fee is reasonable
        if Self::is_excessive_fee(message.max_fee) {
            return ValidationResult::ExcessiveFee;
        }

        ValidationResult::Valid
    }

    /// Validate call data format for specific parachains
    pub fn validate_call_data_for_chain(
        target_chain: u32,
        call_data: &[u8],
    ) -> ValidationResult {
        match target_chain {
            2000 => Self::validate_acala_call(call_data), // Acala
            2006 => Self::validate_astar_call(call_data), // Astar
            _ => ValidationResult::InvalidTarget,
        }
    }

    /// Check if target parachain is valid
    fn is_valid_target(para_id: u32) -> bool {
        // For demo, support major parachains
        matches!(para_id, 2000..=2100)
    }

    /// Check if fee is excessive (basic validation)
    fn is_excessive_fee(fee: Balance<T>) -> bool {
        // For demo, set a reasonable upper limit
        // This would be more sophisticated in production
        false // Simplified for demo
    }

    /// Validate Acala-specific call data
    fn validate_acala_call(_call_data: &[u8]) -> ValidationResult {
        // For demo, accept all call data
        // In production, this would validate specific call formats
        ValidationResult::Valid
    }

    /// Validate Astar-specific call data
    fn validate_astar_call(_call_data: &[u8]) -> ValidationResult {
        // For demo, accept all call data
        // In production, this would validate specific call formats
        ValidationResult::Valid
    }
}

/// Fee estimator for cross-chain transactions
pub struct FeeEstimator<T: Config> {
    _phantom: sp_std::marker::PhantomData<T>,
}

impl<T: Config> FeeEstimator<T> {
    /// Estimate fee for cross-chain transaction
    pub fn estimate_fee(
        target_chain: u32,
        call_data: &[u8],
    ) -> Result<Balance<T>, XcmGatewayError> {
        let base_fee = Self::get_base_fee(target_chain)?;
        let call_fee = Self::calculate_call_fee(call_data);
        
        Ok(base_fee.saturating_add(call_fee))
    }

    /// Get base fee for target parachain
    fn get_base_fee(target_chain: u32) -> Result<Balance<T>, XcmGatewayError> {
        let base_fee = match target_chain {
            2000 => Balance::<T>::from(1000u32), // Acala base fee
            2006 => Balance::<T>::from(800u32),  // Astar base fee
            2012 => Balance::<T>::from(1200u32), // Parallel base fee
            2030 => Balance::<T>::from(900u32),  // Bifrost base fee
            _ => return Err(XcmGatewayError::UnsupportedDestination),
        };
        
        Ok(base_fee)
    }

    /// Calculate fee based on call data complexity
    fn calculate_call_fee(call_data: &[u8]) -> Balance<T> {
        // Simple fee calculation based on call data size
        let size_fee = Balance::<T>::from(call_data.len() as u32);
        size_fee.saturating_mul(Balance::<T>::from(2u32)) // 2 units per byte
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mock::*;
    use frame_support::assert_ok;

    #[test]
    fn test_build_demo_message() {
        new_test_ext().execute_with(|| {
            let call_data = vec![1, 2, 3, 4];
            let max_fee = 1000u128;
            let pool_id = 1;
            let transaction_id = 1;

            let result = XcmMessageBuilder::<Test>::build_demo_message(
                2006, // Astar
                call_data.clone(),
                max_fee,
                pool_id,
                transaction_id,
            );

            assert_ok!(&result);
            let message = result.unwrap();
            assert_eq!(message.target, 2006);
            assert_eq!(message.call.to_vec(), call_data);
            assert_eq!(message.max_fee, max_fee);
            assert_eq!(message.sponsor, pool_id);
            assert_eq!(message.transaction_id, transaction_id);
        });
    }

    #[test]
    fn test_format_for_astar() {
        new_test_ext().execute_with(|| {
            let call_data = vec![1, 2, 3, 4];
            let max_fee = 1000u128;
            let pool_id = 1;
            let transaction_id = 1;

            let result = XcmMessageBuilder::<Test>::format_for_astar(
                call_data,
                max_fee,
                pool_id,
                transaction_id,
            );

            assert_ok!(&result);
            let message = result.unwrap();
            assert_eq!(message.target, 2006); // Astar para ID
        });
    }

    #[test]
    fn test_format_for_acala() {
        new_test_ext().execute_with(|| {
            let call_data = vec![1, 2, 3, 4];
            let max_fee = 1000u128;
            let pool_id = 1;
            let transaction_id = 1;

            let result = XcmMessageBuilder::<Test>::format_for_acala(
                call_data,
                max_fee,
                pool_id,
                transaction_id,
            );

            assert_ok!(&result);
            let message = result.unwrap();
            assert_eq!(message.target, 2000); // Acala para ID
        });
    }

    #[test]
    fn test_validate_message_valid() {
        new_test_ext().execute_with(|| {
            let message = DemoXcmMessage::<Test> {
                target: 2006,
                call: BoundedVec::try_from(vec![1, 2, 3, 4]).unwrap(),
                max_fee: 1000u128,
                sponsor: 1,
                transaction_id: 1,
            };

            let result = XcmMessageValidator::<Test>::validate_message(&message);
            assert_eq!(result, ValidationResult::Valid);
        });
    }

    #[test]
    fn test_validate_message_invalid_target() {
        new_test_ext().execute_with(|| {
            let message = DemoXcmMessage::<Test> {
                target: 9999, // Invalid para ID
                call: BoundedVec::try_from(vec![1, 2, 3, 4]).unwrap(),
                max_fee: 1000u128,
                sponsor: 1,
                transaction_id: 1,
            };

            let result = XcmMessageValidator::<Test>::validate_message(&message);
            assert_eq!(result, ValidationResult::InvalidTarget);
        });
    }

    #[test]
    fn test_validate_message_empty_call() {
        new_test_ext().execute_with(|| {
            let message = DemoXcmMessage::<Test> {
                target: 2006,
                call: BoundedVec::try_from(vec![]).unwrap(),
                max_fee: 1000u128,
                sponsor: 1,
                transaction_id: 1,
            };

            let result = XcmMessageValidator::<Test>::validate_message(&message);
            assert_eq!(result, ValidationResult::InvalidCallData);
        });
    }

    #[test]
    fn test_fee_estimation() {
        new_test_ext().execute_with(|| {
            let call_data = vec![1, 2, 3, 4]; // 4 bytes
            
            // Test Astar fee estimation
            let astar_fee = FeeEstimator::<Test>::estimate_fee(2006, &call_data);
            assert_ok!(&astar_fee);
            assert_eq!(astar_fee.unwrap(), 808u128); // 800 base + 8 call fee (4 * 2)
            
            // Test Acala fee estimation
            let acala_fee = FeeEstimator::<Test>::estimate_fee(2000, &call_data);
            assert_ok!(&acala_fee);
            assert_eq!(acala_fee.unwrap(), 1008u128); // 1000 base + 8 call fee
        });
    }

    #[test]
    fn test_unsupported_parachain() {
        new_test_ext().execute_with(|| {
            let call_data = vec![1, 2, 3, 4];
            
            let result = FeeEstimator::<Test>::estimate_fee(9999, &call_data);
            assert_eq!(result, Err(XcmGatewayError::UnsupportedDestination));
        });
    }
}

/// Cross-chain transaction dispatcher
pub struct XcmDispatcher<T: Config> {
    _phantom: sp_std::marker::PhantomData<T>,
}

impl<T: Config> XcmDispatcher<T> {
    /// Dispatch XCM message to relay chain for cross-chain execution
    pub fn dispatch_message(
        message: DemoXcmMessage<T>,
    ) -> Result<(), XcmGatewayError> {
        // Validate message before dispatch
        let validation_result = XcmMessageValidator::<T>::validate_message(&message);
        if validation_result != ValidationResult::Valid {
            return Err(XcmGatewayError::MessageFormatError);
        }

        // For demo purposes, we'll simulate XCM dispatch
        // In production, this would use actual XCM sending mechanisms
        Self::simulate_xcm_dispatch(&message)?;

        Ok(())
    }

    /// Send XCM message to relay chain (demo simulation)
    fn simulate_xcm_dispatch(message: &DemoXcmMessage<T>) -> Result<(), XcmGatewayError> {
        // In a real implementation, this would:
        // 1. Format the message for the relay chain
        // 2. Send via XCM transport layer
        // 3. Handle immediate dispatch errors
        
        // For demo, we'll just log the dispatch
        log::info!(
            "Dispatching XCM message to parachain {} for transaction {}",
            message.target,
            message.transaction_id
        );

        // Simulate potential dispatch failures for testing
        if message.target == 9999 {
            return Err(XcmGatewayError::UnsupportedDestination);
        }

        Ok(())
    }

    /// Estimate delivery time for target parachain
    pub fn estimate_delivery_time(target_chain: u32) -> Result<u32, XcmGatewayError> {
        let blocks = match target_chain {
            2000 => 2, // Acala - 2 blocks
            2006 => 3, // Astar - 3 blocks  
            2012 => 2, // Parallel - 2 blocks
            2030 => 3, // Bifrost - 3 blocks
            _ => return Err(XcmGatewayError::UnsupportedDestination),
        };
        
        Ok(blocks)
    }
}

/// Transaction ID tracker for managing pending cross-chain transactions
pub struct TransactionTracker<T: Config> {
    _phantom: sp_std::marker::PhantomData<T>,
}

impl<T: Config> TransactionTracker<T> {
    /// Add a new pending transaction
    pub fn add_pending_transaction(
        transaction_id: u64,
        pool_id: PoolId,
        user: T::AccountId,
        target_chain: u32,
        call_data: &[u8],
        reserved_fee: Balance<T>,
    ) -> Result<(), XcmGatewayError> {
        let call_hash = T::Hashing::hash(call_data);
        let current_block = <frame_system::Pallet<T>>::block_number();

        let pending_tx = PendingTransaction {
            transaction_id,
            pool_id,
            user,
            target_chain,
            call_hash,
            reserved_fee,
            retry_count: 0,
            created_at: current_block,
            last_retry_at: current_block,
        };

        // Store pending transaction (in production, this would use storage)
        // For demo, we'll use the existing transaction log
        Self::store_pending_transaction(pending_tx)?;

        Ok(())
    }

    /// Update transaction status
    pub fn update_transaction_status(
        transaction_id: u64,
        new_status: TransactionStatus,
    ) -> Result<(), XcmGatewayError> {
        // In production, this would update the storage
        log::info!(
            "Updating transaction {} status to {:?}",
            transaction_id,
            new_status
        );
        
        Ok(())
    }

    /// Get pending transactions that need retry
    pub fn get_retry_candidates(
        max_age_blocks: frame_system::pallet_prelude::BlockNumberFor<T>,
    ) -> Vec<u64> {
        // In production, this would query storage for old pending transactions
        // For demo, return empty vec
        Vec::new()
    }

    /// Mark transaction as dispatched
    pub fn mark_dispatched(transaction_id: u64) -> Result<(), XcmGatewayError> {
        Self::update_transaction_status(transaction_id, TransactionStatus::Dispatched)
    }

    /// Mark transaction as executed
    pub fn mark_executed(transaction_id: u64) -> Result<(), XcmGatewayError> {
        Self::update_transaction_status(transaction_id, TransactionStatus::Executed)
    }

    /// Mark transaction as failed
    pub fn mark_failed(transaction_id: u64) -> Result<(), XcmGatewayError> {
        Self::update_transaction_status(transaction_id, TransactionStatus::Failed)
    }

    /// Store pending transaction (helper method)
    fn store_pending_transaction(
        _pending_tx: PendingTransaction<T>,
    ) -> Result<(), XcmGatewayError> {
        // In production, this would store in dedicated storage
        // For demo, we'll just log
        Ok(())
    }
}

/// Retry logic handler with exponential backoff
pub struct RetryHandler<T: Config> {
    _phantom: sp_std::marker::PhantomData<T>,
}

impl<T: Config> RetryHandler<T> {
    /// Maximum number of retry attempts
    const MAX_RETRIES: u8 = 3;
    
    /// Base delay in blocks for exponential backoff
    const BASE_DELAY_BLOCKS: u32 = 5;

    /// Attempt to retry a failed transaction
    pub fn retry_transaction(
        transaction_id: u64,
        current_retry_count: u8,
    ) -> Result<bool, XcmGatewayError> {
        // Check if we've exceeded max retries
        if current_retry_count >= Self::MAX_RETRIES {
            log::warn!(
                "Transaction {} exceeded max retries ({})",
                transaction_id,
                Self::MAX_RETRIES
            );
            return Ok(false);
        }

        // Calculate delay for exponential backoff
        let delay_blocks = Self::calculate_backoff_delay(current_retry_count);
        
        log::info!(
            "Scheduling retry {} for transaction {} in {} blocks",
            current_retry_count + 1,
            transaction_id,
            delay_blocks
        );

        // In production, this would schedule the retry
        // For demo, we'll just return success
        Ok(true)
    }

    /// Calculate exponential backoff delay
    fn calculate_backoff_delay(retry_count: u8) -> u32 {
        let multiplier = 2u32.pow(retry_count as u32);
        Self::BASE_DELAY_BLOCKS.saturating_mul(multiplier)
    }

    /// Check if transaction is ready for retry
    pub fn is_ready_for_retry(
        last_retry_block: frame_system::pallet_prelude::BlockNumberFor<T>,
        retry_count: u8,
        current_block: frame_system::pallet_prelude::BlockNumberFor<T>,
    ) -> bool {
        let required_delay = Self::calculate_backoff_delay(retry_count);
        let blocks_since_retry = current_block.saturating_sub(last_retry_block);
        
        blocks_since_retry >= required_delay.into()
    }

    /// Process retry queue (called periodically)
    pub fn process_retry_queue() -> Result<u32, XcmGatewayError> {
        let current_block = <frame_system::Pallet<T>>::block_number();
        let max_age = 100u32.into(); // 100 blocks max age
        
        let retry_candidates = TransactionTracker::<T>::get_retry_candidates(max_age);
        let mut processed_count = 0u32;

        for transaction_id in retry_candidates {
            // In production, this would load the pending transaction details
            // and attempt retry if ready
            log::info!("Processing retry for transaction {}", transaction_id);
            processed_count = processed_count.saturating_add(1);
        }

        Ok(processed_count)
    }
}

/// Main XCM Gateway coordinator
pub struct XcmGateway<T: Config> {
    _phantom: sp_std::marker::PhantomData<T>,
}

impl<T: Config> XcmGateway<T> {
    /// Send a cross-chain transaction with full tracking and retry logic
    pub fn send_cross_chain_transaction(
        pool_id: PoolId,
        user: T::AccountId,
        target_chain: u32,
        call_data: Vec<u8>,
        transaction_id: u64,
    ) -> Result<(), XcmGatewayError> {
        // Estimate fee for the transaction
        let estimated_fee = FeeEstimator::<T>::estimate_fee(target_chain, &call_data)?;

        // Build XCM message
        let message = XcmMessageBuilder::<T>::format_for_parachain(
            target_chain,
            call_data.clone(),
            estimated_fee,
            pool_id,
            transaction_id,
        )?;

        // Add to pending transactions tracker
        TransactionTracker::<T>::add_pending_transaction(
            transaction_id,
            pool_id,
            user,
            target_chain,
            &call_data,
            estimated_fee,
        )?;

        // Dispatch the message
        XcmDispatcher::<T>::dispatch_message(message)?;

        // Mark as dispatched
        TransactionTracker::<T>::mark_dispatched(transaction_id)?;

        log::info!(
            "Successfully dispatched cross-chain transaction {} to parachain {}",
            transaction_id,
            target_chain
        );

        Ok(())
    }

    /// Handle failed transaction dispatch
    pub fn handle_dispatch_failure(
        transaction_id: u64,
        error: XcmGatewayError,
    ) -> Result<(), XcmGatewayError> {
        log::warn!(
            "Transaction {} dispatch failed: {:?}",
            transaction_id,
            error
        );

        // Attempt retry if appropriate
        let should_retry = match error {
            XcmGatewayError::DeliveryTimeout => true,
            XcmGatewayError::ExecutionFailed => true,
            XcmGatewayError::UnsupportedDestination => false, // Don't retry
            XcmGatewayError::MessageFormatError => false,     // Don't retry
            _ => true,
        };

        if should_retry {
            RetryHandler::<T>::retry_transaction(transaction_id, 0)?;
        } else {
            TransactionTracker::<T>::mark_failed(transaction_id)?;
        }

        Ok(())
    }

    /// Process periodic maintenance (retry queue, cleanup, etc.)
    pub fn process_maintenance() -> Result<(), XcmGatewayError> {
        // Process retry queue
        let processed = RetryHandler::<T>::process_retry_queue()?;
        
        if processed > 0 {
            log::info!("Processed {} retry candidates", processed);
        }

        Ok(())
    }
}

#[cfg(test)]
mod dispatch_tests {
    use super::*;
    use crate::mock::*;
    use frame_support::assert_ok;

    #[test]
    fn test_dispatch_message_success() {
        new_test_ext().execute_with(|| {
            let message = DemoXcmMessage::<Test> {
                target: 2006,
                call: BoundedVec::try_from(vec![1, 2, 3, 4]).unwrap(),
                max_fee: 1000u128,
                sponsor: 1,
                transaction_id: 1,
            };

            let result = XcmDispatcher::<Test>::dispatch_message(message);
            assert_ok!(result);
        });
    }

    #[test]
    fn test_dispatch_message_invalid_target() {
        new_test_ext().execute_with(|| {
            let message = DemoXcmMessage::<Test> {
                target: 9999, // Invalid target
                call: BoundedVec::try_from(vec![1, 2, 3, 4]).unwrap(),
                max_fee: 1000u128,
                sponsor: 1,
                transaction_id: 1,
            };

            let result = XcmDispatcher::<Test>::dispatch_message(message);
            assert_eq!(result, Err(XcmGatewayError::MessageFormatError)); // Validation fails first
        });
    }

    #[test]
    fn test_estimate_delivery_time() {
        new_test_ext().execute_with(|| {
            // Test Acala delivery time
            let acala_time = XcmDispatcher::<Test>::estimate_delivery_time(2000);
            assert_ok!(&acala_time);
            assert_eq!(acala_time.unwrap(), 2);

            // Test Astar delivery time
            let astar_time = XcmDispatcher::<Test>::estimate_delivery_time(2006);
            assert_ok!(&astar_time);
            assert_eq!(astar_time.unwrap(), 3);

            // Test unsupported chain
            let invalid_time = XcmDispatcher::<Test>::estimate_delivery_time(9999);
            assert_eq!(invalid_time, Err(XcmGatewayError::UnsupportedDestination));
        });
    }

    #[test]
    fn test_transaction_tracking() {
        new_test_ext().execute_with(|| {
            let result = TransactionTracker::<Test>::add_pending_transaction(
                1,
                1,
                1,
                2006,
                &[1, 2, 3, 4],
                1000u128,
            );
            assert_ok!(result);

            let mark_result = TransactionTracker::<Test>::mark_dispatched(1);
            assert_ok!(mark_result);
        });
    }

    #[test]
    fn test_retry_logic() {
        new_test_ext().execute_with(|| {
            // Test successful retry
            let retry_result = RetryHandler::<Test>::retry_transaction(1, 0);
            assert_ok!(&retry_result);
            assert_eq!(retry_result.unwrap(), true);

            // Test max retries exceeded
            let max_retry_result = RetryHandler::<Test>::retry_transaction(1, 5);
            assert_ok!(&max_retry_result);
            assert_eq!(max_retry_result.unwrap(), false);
        });
    }

    #[test]
    fn test_backoff_calculation() {
        new_test_ext().execute_with(|| {
            assert_eq!(RetryHandler::<Test>::calculate_backoff_delay(0), 5);  // 5 * 2^0 = 5
            assert_eq!(RetryHandler::<Test>::calculate_backoff_delay(1), 10); // 5 * 2^1 = 10
            assert_eq!(RetryHandler::<Test>::calculate_backoff_delay(2), 20); // 5 * 2^2 = 20
            assert_eq!(RetryHandler::<Test>::calculate_backoff_delay(3), 40); // 5 * 2^3 = 40
        });
    }

    #[test]
    fn test_full_cross_chain_flow() {
        new_test_ext().execute_with(|| {
            let result = XcmGateway::<Test>::send_cross_chain_transaction(
                1,      // pool_id
                1,      // user
                2006,   // Astar
                vec![1, 2, 3, 4], // call_data
                1,      // transaction_id
            );
            assert_ok!(result);
        });
    }

    #[test]
    fn test_dispatch_failure_handling() {
        new_test_ext().execute_with(|| {
            let result = XcmGateway::<Test>::handle_dispatch_failure(
                1,
                XcmGatewayError::DeliveryTimeout,
            );
            assert_ok!(result);
        });
    }

    #[test]
    fn test_maintenance_processing() {
        new_test_ext().execute_with(|| {
            let result = XcmGateway::<Test>::process_maintenance();
            assert_ok!(result);
        });
    }
}

/// Transaction receipt from target parachain
#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
#[scale_info(skip_type_params(T))]
pub struct TransactionReceipt<T: Config> {
    pub transaction_id: u64,
    pub target_chain: u32,
    pub execution_result: ExecutionResult,
    pub actual_gas_used: Balance<T>,
    pub block_hash: T::Hash,
    pub block_number: frame_system::pallet_prelude::BlockNumberFor<T>,
    pub events: BoundedVec<u8, ConstU32<512>>, // Encoded events from target chain
}

/// Execution result from target parachain
#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
pub enum ExecutionResult {
    Success,
    Failed(BoundedVec<u8, ConstU32<256>>), // Error message
    Timeout,
    InsufficientFunds,
}

/// Receipt processing result
#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo)]
pub enum ReceiptProcessingResult {
    Processed,
    AlreadyProcessed,
    InvalidReceipt,
    PoolUpdateFailed,
}

/// Receipt processor for handling transaction confirmations
pub struct ReceiptProcessor<T: Config> {
    _phantom: sp_std::marker::PhantomData<T>,
}

impl<T: Config> ReceiptProcessor<T> {
    /// Process incoming transaction receipt
    pub fn process_receipt(
        receipt: TransactionReceipt<T>,
    ) -> Result<ReceiptProcessingResult, XcmGatewayError> {
        // Validate receipt
        if !Self::validate_receipt(&receipt) {
            return Ok(ReceiptProcessingResult::InvalidReceipt);
        }

        // Check if already processed
        if Self::is_already_processed(receipt.transaction_id) {
            return Ok(ReceiptProcessingResult::AlreadyProcessed);
        }

        // Process based on execution result
        match receipt.execution_result {
            ExecutionResult::Success => {
                Self::handle_successful_execution(&receipt)?;
            },
            ExecutionResult::Failed(_) => {
                Self::handle_failed_execution(&receipt)?;
            },
            ExecutionResult::Timeout => {
                Self::handle_timeout(&receipt)?;
            },
            ExecutionResult::InsufficientFunds => {
                Self::handle_insufficient_funds(&receipt)?;
            },
        }

        // Mark receipt as processed
        Self::mark_receipt_processed(receipt.transaction_id)?;

        // Update transaction status
        let final_status = match receipt.execution_result {
            ExecutionResult::Success => TransactionStatus::Executed,
            _ => TransactionStatus::Failed,
        };
        
        TransactionTracker::<T>::update_transaction_status(
            receipt.transaction_id,
            final_status,
        )?;

        Ok(ReceiptProcessingResult::Processed)
    }

    /// Handle successful transaction execution
    fn handle_successful_execution(
        receipt: &TransactionReceipt<T>,
    ) -> Result<(), XcmGatewayError> {
        log::info!(
            "Transaction {} executed successfully on parachain {}, gas used: {:?}",
            receipt.transaction_id,
            receipt.target_chain,
            receipt.actual_gas_used
        );

        // Update pool balance based on actual gas consumption
        Self::update_pool_balance_for_success(receipt)?;

        // Emit success notification
        Self::emit_transaction_success_notification(receipt)?;

        Ok(())
    }

    /// Handle failed transaction execution
    fn handle_failed_execution(
        receipt: &TransactionReceipt<T>,
    ) -> Result<(), XcmGatewayError> {
        log::warn!(
            "Transaction {} failed on parachain {}: {:?}",
            receipt.transaction_id,
            receipt.target_chain,
            receipt.execution_result
        );

        // Refund unused gas to pool
        Self::refund_unused_gas(receipt)?;

        // Emit failure notification
        Self::emit_transaction_failure_notification(receipt)?;

        Ok(())
    }

    /// Handle transaction timeout
    fn handle_timeout(
        receipt: &TransactionReceipt<T>,
    ) -> Result<(), XcmGatewayError> {
        log::warn!(
            "Transaction {} timed out on parachain {}",
            receipt.transaction_id,
            receipt.target_chain
        );

        // Refund gas and potentially retry
        Self::refund_unused_gas(receipt)?;

        // Check if retry is appropriate
        if Self::should_retry_timeout(receipt.transaction_id) {
            RetryHandler::<T>::retry_transaction(receipt.transaction_id, 1)?;
        }

        Ok(())
    }

    /// Handle insufficient funds error
    fn handle_insufficient_funds(
        receipt: &TransactionReceipt<T>,
    ) -> Result<(), XcmGatewayError> {
        log::error!(
            "Transaction {} failed due to insufficient funds on parachain {}",
            receipt.transaction_id,
            receipt.target_chain
        );

        // This shouldn't happen if fee estimation is correct
        // Refund the reserved gas
        Self::refund_unused_gas(receipt)?;

        Ok(())
    }

    /// Update pool balance based on actual gas consumption
    fn update_pool_balance_for_success(
        receipt: &TransactionReceipt<T>,
    ) -> Result<(), XcmGatewayError> {
        // In production, this would:
        // 1. Load the transaction record to get reserved fee
        // 2. Calculate difference between reserved and actual
        // 3. Update pool balance accordingly
        // 4. Update spending tracking

        log::info!(
            "Updating pool balance for successful transaction {}, actual gas: {:?}",
            receipt.transaction_id,
            receipt.actual_gas_used
        );

        // For demo, we'll simulate the balance update
        Ok(())
    }

    /// Refund unused gas back to pool
    fn refund_unused_gas(
        receipt: &TransactionReceipt<T>,
    ) -> Result<(), XcmGatewayError> {
        log::info!(
            "Refunding unused gas for transaction {}",
            receipt.transaction_id
        );

        // In production, this would:
        // 1. Load the transaction record to get reserved fee
        // 2. Refund the full amount back to pool
        // 3. Update spending tracking

        Ok(())
    }

    /// Validate receipt integrity
    fn validate_receipt(receipt: &TransactionReceipt<T>) -> bool {
        // Basic validation checks
        if receipt.transaction_id == 0 {
            return false;
        }

        if receipt.target_chain == 0 {
            return false;
        }

        // Validate block hash is not zero
        if receipt.block_hash == T::Hash::default() {
            return false;
        }

        true
    }

    /// Check if receipt was already processed
    fn is_already_processed(transaction_id: u64) -> bool {
        // In production, this would check storage
        // For demo, assume not processed
        false
    }

    /// Mark receipt as processed
    fn mark_receipt_processed(transaction_id: u64) -> Result<(), XcmGatewayError> {
        // In production, this would update storage
        log::info!("Marking receipt {} as processed", transaction_id);
        Ok(())
    }

    /// Check if timeout should trigger retry
    fn should_retry_timeout(transaction_id: u64) -> bool {
        // In production, this would check retry count and other factors
        // For demo, allow one retry
        true
    }

    /// Emit success notification
    fn emit_transaction_success_notification(
        receipt: &TransactionReceipt<T>,
    ) -> Result<(), XcmGatewayError> {
        // In production, this would emit events or send notifications
        log::info!(
            "Emitting success notification for transaction {}",
            receipt.transaction_id
        );
        Ok(())
    }

    /// Emit failure notification
    fn emit_transaction_failure_notification(
        receipt: &TransactionReceipt<T>,
    ) -> Result<(), XcmGatewayError> {
        // In production, this would emit events or send notifications
        log::warn!(
            "Emitting failure notification for transaction {}",
            receipt.transaction_id
        );
        Ok(())
    }
}

/// Pool balance updater for handling gas consumption adjustments
pub struct PoolBalanceUpdater<T: Config> {
    _phantom: sp_std::marker::PhantomData<T>,
}

impl<T: Config> PoolBalanceUpdater<T> {
    /// Update pool balance based on actual gas consumption
    pub fn update_for_actual_consumption(
        pool_id: PoolId,
        reserved_amount: Balance<T>,
        actual_amount: Balance<T>,
    ) -> Result<Balance<T>, XcmGatewayError> {
        // Calculate difference
        let difference = if actual_amount <= reserved_amount {
            reserved_amount.saturating_sub(actual_amount)
        } else {
            // Actual was more than reserved (shouldn't happen with good estimation)
            log::warn!(
                "Actual gas consumption exceeded reserved amount for pool {}",
                pool_id
            );
            Balance::<T>::from(0u32)
        };

        // In production, this would:
        // 1. Load pool info from storage
        // 2. Add difference back to pool balance
        // 3. Update total spent to reflect actual consumption
        // 4. Store updated pool info

        log::info!(
            "Pool {} balance adjustment: reserved {:?}, actual {:?}, refund {:?}",
            pool_id,
            reserved_amount,
            actual_amount,
            difference
        );

        Ok(difference)
    }

    /// Handle complete refund for failed transactions
    pub fn refund_full_amount(
        pool_id: PoolId,
        refund_amount: Balance<T>,
    ) -> Result<(), XcmGatewayError> {
        // In production, this would:
        // 1. Load pool info from storage
        // 2. Add full refund back to pool balance
        // 3. Subtract from total spent
        // 4. Store updated pool info

        log::info!(
            "Full refund of {:?} to pool {}",
            refund_amount,
            pool_id
        );

        Ok(())
    }

    /// Update spending tracking for user
    pub fn update_user_spending(
        pool_id: PoolId,
        user: &T::AccountId,
        actual_spent: Balance<T>,
        was_refunded: bool,
    ) -> Result<(), XcmGatewayError> {
        // In production, this would:
        // 1. Load user spending info
        // 2. Update total spent based on actual consumption
        // 3. Handle refunds appropriately
        // 4. Store updated spending info

        log::info!(
            "Updating spending for user in pool {}: spent {:?}, refunded: {}",
            pool_id,
            actual_spent,
            was_refunded
        );

        Ok(())
    }
}

/// User notification system for transaction status updates
pub struct UserNotificationSystem<T: Config> {
    _phantom: sp_std::marker::PhantomData<T>,
}

impl<T: Config> UserNotificationSystem<T> {
    /// Send transaction completion notification
    pub fn notify_transaction_complete(
        user: &T::AccountId,
        transaction_id: u64,
        result: &ExecutionResult,
        gas_saved: Balance<T>,
    ) -> Result<(), XcmGatewayError> {
        match result {
            ExecutionResult::Success => {
                Self::send_success_notification(user, transaction_id, gas_saved)?;
            },
            ExecutionResult::Failed(error) => {
                Self::send_failure_notification(user, transaction_id, error)?;
            },
            ExecutionResult::Timeout => {
                Self::send_timeout_notification(user, transaction_id)?;
            },
            ExecutionResult::InsufficientFunds => {
                Self::send_insufficient_funds_notification(user, transaction_id)?;
            },
        }

        Ok(())
    }

    /// Send success notification
    fn send_success_notification(
        user: &T::AccountId,
        transaction_id: u64,
        gas_saved: Balance<T>,
    ) -> Result<(), XcmGatewayError> {
        log::info!(
            "Success notification for user {:?}: transaction {} completed, gas saved: {:?}",
            user,
            transaction_id,
            gas_saved
        );

        // In production, this would:
        // 1. Emit events that frontend can listen to
        // 2. Update user's gas savings counter
        // 3. Send push notifications if configured

        Ok(())
    }

    /// Send failure notification
    fn send_failure_notification(
        user: &T::AccountId,
        transaction_id: u64,
        error: &BoundedVec<u8, ConstU32<256>>,
    ) -> Result<(), XcmGatewayError> {
        log::warn!(
            "Failure notification for user {:?}: transaction {} failed with error: {:?}",
            user,
            transaction_id,
            error
        );

        Ok(())
    }

    /// Send timeout notification
    fn send_timeout_notification(
        user: &T::AccountId,
        transaction_id: u64,
    ) -> Result<(), XcmGatewayError> {
        log::warn!(
            "Timeout notification for user {:?}: transaction {} timed out",
            user,
            transaction_id
        );

        Ok(())
    }

    /// Send insufficient funds notification
    fn send_insufficient_funds_notification(
        user: &T::AccountId,
        transaction_id: u64,
    ) -> Result<(), XcmGatewayError> {
        log::error!(
            "Insufficient funds notification for user {:?}: transaction {} failed due to insufficient funds",
            user,
            transaction_id
        );

        Ok(())
    }

    /// Calculate and update gas savings
    pub fn update_gas_savings(
        user: &T::AccountId,
        saved_amount: Balance<T>,
    ) -> Result<Balance<T>, XcmGatewayError> {
        // In production, this would:
        // 1. Load user's current gas savings total
        // 2. Add the new saved amount
        // 3. Store updated total
        // 4. Emit event for frontend updates

        log::info!(
            "Updating gas savings for user {:?}: +{:?}",
            user,
            saved_amount
        );

        Ok(saved_amount)
    }
}

#[cfg(test)]
mod receipt_tests {
    use super::*;
    use crate::mock::*;
    use frame_support::assert_ok;

    fn create_test_receipt(
        transaction_id: u64,
        result: ExecutionResult,
        gas_used: u128,
    ) -> TransactionReceipt<Test> {
        TransactionReceipt {
            transaction_id,
            target_chain: 2006,
            execution_result: result,
            actual_gas_used: gas_used,
            block_hash: sp_core::H256::from([1; 32]),
            block_number: 1,
            events: BoundedVec::try_from(vec![]).unwrap(),
        }
    }

    #[test]
    fn test_process_successful_receipt() {
        new_test_ext().execute_with(|| {
            let receipt = create_test_receipt(
                1,
                ExecutionResult::Success,
                800, // Less than estimated 1000
            );

            let result = ReceiptProcessor::<Test>::process_receipt(receipt);
            assert_ok!(&result);
            assert_eq!(result.unwrap(), ReceiptProcessingResult::Processed);
        });
    }

    #[test]
    fn test_process_failed_receipt() {
        new_test_ext().execute_with(|| {
            let error_msg = BoundedVec::try_from(b"execution failed".to_vec()).unwrap();
            let receipt = create_test_receipt(
                1,
                ExecutionResult::Failed(error_msg),
                0,
            );

            let result = ReceiptProcessor::<Test>::process_receipt(receipt);
            assert_ok!(&result);
            assert_eq!(result.unwrap(), ReceiptProcessingResult::Processed);
        });
    }

    #[test]
    fn test_process_timeout_receipt() {
        new_test_ext().execute_with(|| {
            let receipt = create_test_receipt(
                1,
                ExecutionResult::Timeout,
                0,
            );

            let result = ReceiptProcessor::<Test>::process_receipt(receipt);
            assert_ok!(&result);
            assert_eq!(result.unwrap(), ReceiptProcessingResult::Processed);
        });
    }

    #[test]
    fn test_invalid_receipt() {
        new_test_ext().execute_with(|| {
            let mut receipt = create_test_receipt(
                0, // Invalid transaction ID
                ExecutionResult::Success,
                800,
            );
            receipt.block_hash = sp_core::H256::default(); // Invalid block hash

            let result = ReceiptProcessor::<Test>::process_receipt(receipt);
            assert_ok!(&result);
            assert_eq!(result.unwrap(), ReceiptProcessingResult::InvalidReceipt);
        });
    }

    #[test]
    fn test_pool_balance_update() {
        new_test_ext().execute_with(|| {
            let reserved = 1000u128;
            let actual = 800u128;

            let result = PoolBalanceUpdater::<Test>::update_for_actual_consumption(
                1,
                reserved,
                actual,
            );
            assert_ok!(&result);
            assert_eq!(result.unwrap(), 200u128); // Refund amount
        });
    }

    #[test]
    fn test_pool_balance_update_overspend() {
        new_test_ext().execute_with(|| {
            let reserved = 800u128;
            let actual = 1000u128; // More than reserved

            let result = PoolBalanceUpdater::<Test>::update_for_actual_consumption(
                1,
                reserved,
                actual,
            );
            assert_ok!(&result);
            assert_eq!(result.unwrap(), 0u128); // No refund
        });
    }

    #[test]
    fn test_full_refund() {
        new_test_ext().execute_with(|| {
            let result = PoolBalanceUpdater::<Test>::refund_full_amount(1, 1000u128);
            assert_ok!(result);
        });
    }

    #[test]
    fn test_user_notifications() {
        new_test_ext().execute_with(|| {
            let user = 1u64;
            let transaction_id = 1u64;
            let gas_saved = 200u128;

            let result = UserNotificationSystem::<Test>::notify_transaction_complete(
                &user,
                transaction_id,
                &ExecutionResult::Success,
                gas_saved,
            );
            assert_ok!(result);
        });
    }

    #[test]
    fn test_gas_savings_update() {
        new_test_ext().execute_with(|| {
            let user = 1u64;
            let saved_amount = 200u128;

            let result = UserNotificationSystem::<Test>::update_gas_savings(&user, saved_amount);
            assert_ok!(&result);
            assert_eq!(result.unwrap(), saved_amount);
        });
    }

    #[test]
    fn test_receipt_validation() {
        new_test_ext().execute_with(|| {
            // Valid receipt
            let valid_receipt = create_test_receipt(1, ExecutionResult::Success, 800);
            assert!(ReceiptProcessor::<Test>::validate_receipt(&valid_receipt));

            // Invalid receipt - zero transaction ID
            let invalid_receipt = create_test_receipt(0, ExecutionResult::Success, 800);
            assert!(!ReceiptProcessor::<Test>::validate_receipt(&invalid_receipt));
        });
    }
}