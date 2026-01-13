// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/config/ZamaFHEVMConfig.sol";
import "fhevm/gateway/GatewayCaller.sol";

contract IncoReputation is ZamaFHEVMConfig, GatewayCaller {
    // Mapping from worker address to encrypted reputation handle
    mapping(address => euint32) private workerReputations;
    
    // Minimal reputation required for high-value jobs (encrypted)
    euint32 private defaultMinReputation;

    event ReputationUpdated(address indexed worker);

    constructor() {
        // Initialize default reputation (e.g., 50)
        defaultMinReputation = TFHE.asEuint32(50);
    }

    /**
     * @dev Update reputation via encrypted delta
     * @param worker The address of the worker node
     * @param encryptedDelta Encrypted change value (handle)
     */
    function updateReputation(address worker, bytes calldata encryptedDelta) external {
        euint32 delta = TFHE.asEuint32(encryptedDelta);
        
        if (TFHE.isInitialized(workerReputations[worker])) {
            workerReputations[worker] = TFHE.add(workerReputations[worker], delta);
        } else {
            // Start at 50 base reputation
            workerReputations[worker] = TFHE.add(TFHE.asEuint32(50), delta);
        }
        
        emit ReputationUpdated(worker);
    }

    /**
     * @dev Check if worker meets a confidential reputation threshold
     * @param worker The address of the worker
     * @param threshold Encrypted threshold handle
     * @return Encrypted boolean handle (ebool)
     */
    function isQualified(address worker, bytes calldata threshold) external view returns (ebool) {
        euint32 thresh = TFHE.asEuint32(threshold);
        euint32 currentRep = TFHE.isInitialized(workerReputations[worker]) 
            ? workerReputations[worker] 
            : TFHE.asEuint32(50);
            
        return TFHE.ge(currentRep, thresh);
    }

    /**
     * @dev Internal developer helper to check balance (encrypted)
     */
    function getEncryptedReputation(address worker) external view returns (euint32) {
        return workerReputations[worker];
    }
}
