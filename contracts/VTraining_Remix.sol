// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// V-TRAINING SMART CONTRACTS - UNIFIED MESH
// ============================================================================

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

abstract contract Ownable is Context {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    constructor() { _owner = msg.sender; }
    function owner() public view virtual returns (address) { return _owner; }
    modifier onlyOwner() { require(owner() == _msgSender(), "Caller is not the owner"); _; }
}

abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;
    constructor() { _status = NOT_ENTERED; }
    modifier nonReentrant() {
        require(_status != ENTERED, "Reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }
}

interface IVerifier {
    function verify(uint256[] calldata pubInputs, bytes calldata proof) external view returns (bool);
}

/**
 * @title VTrainingManager
 * @dev Unified ML Training Marketplace
 */
contract VTrainingManager is Ownable, ReentrancyGuard {
    IVerifier public verifier;
    
    uint256 public constant MIN_STAKE = 0.001 ether;
    uint256 public constant TRAINING_TIMEOUT = 24 hours;

    enum JobStatus { Pending, Processing, Completed, Cancelled, Slashed, Expired }

    struct Job {
        uint256 id;
        address requester;
        uint256 reward;
        JobStatus status;
        string scriptHash;
        string dataHash;
        string modelHash;
        address worker;
        uint256 stake;
        uint256 createdAt;
        uint256 claimedAt;
        bytes encryptedThreshold; // FHE Encrypted reputation threshold
    }

    struct Worker {
        address addr;
        uint256 stake;
        uint256 reputation;
        uint256 completedJobs;
        bool isActive;
        string nodeId;
    }

    Job[] public jobs;
    mapping(address => Worker) public workers;
    
    event JobCreated(uint256 indexed jobId, address indexed requester, uint256 reward, string scriptHash, string dataHash, bytes encryptedThreshold);
    event JobClaimed(uint256 indexed jobId, address indexed worker);
    event JobCompleted(uint256 indexed jobId, address indexed worker, string modelHash);
    event WorkerRegistered(address indexed worker, string nodeId, uint256 stake);

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }

    function registerWorker(string memory _nodeId) external payable nonReentrant {
        require(msg.value >= MIN_STAKE, "Min stake required");
        require(!workers[msg.sender].isActive, "Already registered");
        
        workers[msg.sender] = Worker({
            addr: msg.sender,
            stake: msg.value,
            reputation: 100,
            completedJobs: 0,
            isActive: true,
            nodeId: _nodeId
        });
        
        emit WorkerRegistered(msg.sender, _nodeId, msg.value);
    }

    function createJob(string memory _scriptHash, string memory _dataHash, bytes memory _encryptedThreshold) external payable nonReentrant {
        require(msg.value > 0, "Reward required");
        
        uint256 jobId = jobs.length;
        jobs.push(Job({
            id: jobId,
            requester: msg.sender,
            reward: msg.value,
            status: JobStatus.Pending,
            scriptHash: _scriptHash,
            dataHash: _dataHash,
            modelHash: "",
            worker: address(0),
            stake: 0,
            createdAt: block.timestamp,
            claimedAt: 0,
            encryptedThreshold: _encryptedThreshold
        }));
        
        emit JobCreated(jobId, msg.sender, msg.value, _scriptHash, _dataHash, _encryptedThreshold);
    }

    function claimJob(uint256 _jobId) external nonReentrant {
        require(_jobId < jobs.length, "Invalid ID");
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Pending, "Not available");
        require(workers[msg.sender].isActive, "Not a worker");
        
        uint256 requiredStake = job.reward / 2;
        require(workers[msg.sender].stake >= requiredStake, "Insuf stake");

        workers[msg.sender].stake -= requiredStake;
        job.worker = msg.sender;
        job.status = JobStatus.Processing;
        job.stake = requiredStake;
        job.claimedAt = block.timestamp;

        emit JobClaimed(_jobId, msg.sender);
    }

    function submitResult(uint256 _jobId, string memory _modelHash) external nonReentrant {
        require(_jobId < jobs.length, "Invalid ID");
        Job storage job = jobs[_jobId];
        require(job.worker == msg.sender, "Not assigned");
        require(job.status == JobStatus.Processing, "Not processing");

        job.status = JobStatus.Completed;
        job.modelHash = _modelHash;
        
        workers[msg.sender].completedJobs++;
        uint256 payout = job.reward + job.stake;
        
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Payout failed");
        
        emit JobCompleted(_jobId, msg.sender, _modelHash);
    }
}
