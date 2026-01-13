# 🧠 V-OBLIVION: Verifiable AI & Sharded Training Mesh

<div align="center">

**A Cross-Chain Ecosystem for Private, Verifiable, and Distributed Machine Learning**

[![Shardeum](https://img.shields.io/badge/Chain-Shardeum-00d4aa?style=for-the-badge&logo=shardeum)](https://shardeum.org/)
[![Inco](https://img.shields.io/badge/Privacy-Inco_FHEVM-black?style=for-the-badge&logo=inco)](https://www.inco.org/)
[![ZKML](https://img.shields.io/badge/Security-EZKL_ZKML-6366f1?style=for-the-badge)]()
[![Privacy](https://img.shields.io/badge/Compute-Differential_Privacy-ff4081?style=for-the-badge)]()

</div>

---

## 🌟 Overview

**V-OBLIVION** is a next-generation decentralized AI infrastructure. It solves the "Trust Gap" in AI by ensuring that every inference is cryptographically proven (ZKML) and every training shard is processed with mathematical privacy (Differential Privacy), all orchestrated via a high-performance dual-chain architecture.

- **🤖 Verifiable Inference (ZKML)**: Prove that the model you requested actually ran the data you provided.
- **🏋️ Sharded Training Mesh**: Distribute huge ML jobs across thousands of nodes with automatic reward distribution.
- **🛡️ Confidential Worker Stats (FHE)**: Use Inco's FHEVM to verify worker quality without exposing sensitive IP or personal performance data.
- **⛓️ Scalable Settlement (Shardeum)**: Settle thousands of concurrent proofs and transactions with Shardeum's linear scaling.

---

## 🏗️ Technical Architecture

V-OBLIVION utilizes a hybrid architecture where **Shardeum** handles the high-throughput execution/settlement and **Inco** handles the confidential governance/reputation.

```mermaid
graph TD
    User([User / Judge])
    
    subgraph Frontend [Next.js High-Impact Dashboard]
        UI[User Interface]
        WC[Wagmi Web3 Wallet]
        VI[Visualizer - Real-time Node Activity]
    end
    
    subgraph Mesh [Distributed Compute Fleet]
        W1[Worker Node A]
        W2[Worker Node B]
        W3[Worker Node C]
    end
    
    subgraph Shardeum_Testnet [Shardeum: The Settlement Layer]
        SC[VInferenceAudit.sol - Proof Anchoring]
        OM[OblivionManager.sol - Staking & Jobs]
    end

    subgraph Inco_FHEVM [Inco: The Confidential Layer]
        REP[ConfidentialReputation.sol - FHE Scores]
    end
    
    subgraph Storage [IPFS / Pinata]
        M[(Encrypted Models & Shards)]
    end

    User <--> UI
    UI <--> SC
    UI <-- "Query Encrypted Rep" --> REP
    
    %% Worker Flows
    W1 -- "Submit Proof" --> SC
    W1 -- "Stake SHM" --> OM
    W1 -- "Update Metrics (FHE)" --> REP
    
    %% Data Flows
    W1 <--> M
    UI <--> M
```

---

## 🔄 Dual-Chain Deep Dive

### 🔹 Shardeum: Linear Scalability & Proof Anchoring
Shardeum is the bedrock of our job orchestration. Its dynamic state sharding allows V-OBLIVION to scale horizontally as more compute nodes join.
- **Proof Anchoring**: Every ZKML result generates a SNARK proof hash. This is anchored to Shardeum via `anchorAudit()`, creating an immutable verifier log.
- **Staking & Slashing**: Workers stake $SHM to claim shards. If a ZK-verification fails or a node goes offline, the collateral is slashed via smart contract logic.
- **Low-Latency Settlement**: Fast block finality ensures that workers are rewarded instantly after proof verification.

### 🔹 Inco: Confidential reputation (FHEVM)
Traditional blockchains expose all worker data. V-OBLIVION uses **Inco FHEVM** to keep the mesh competitive but private.
- **Fully Homomorphic Encryption (FHE)**: Worker quality scores (Uptime, Accuracy, Latency) are encrypted. The backend can select the "best" worker using encrypted comparisons without ever knowing the raw scores.
- **Privacy-Preserving Selection**: Users can filter for "Top 10% Workers" on the marketplace, verified by Inco's confidential computations.
- **Confidential Staking**: Future support for private asset staking to hide node operator wealth.

---

## 🚀 Sharded Inference Workflow

1.  **Request**: User selects a model and submits inputs via the Next.js dashboard.
2.  **Sharding**: The orchestrator breaks the task into compute shards for the mesh.
3.  **Encrypted Check**: The system queries **Inco** to find the most reputable available nodes.
4.  **Claim**: Workers on the mesh claim shards and stake $SHM on **Shardeum**.
5.  **Compute & Prove**: Nodes run the model and generate a **ZK-SNARK proof** using EZKL.
6.  **Anchoring**: The proof hash is sent to Shardeum's `VInferenceAudit` contract.
7.  **Verification**: The frontend validates the proof against the on-chain anchor, ensuring 100% integrity.

---

## 📁 Project Structure

```bash
V-OBLIVION/
├── backend/                    # FastAPI Microservice
│   ├── app/api/               # Shardeum & Inco Integrations
│   ├── app/services/          # ZKML Simulator & FHE Proxy
│   └── storage/               # Telemetry & Local DB
├── frontend/                   # Next.js 15 Web Application
│   ├── src/app/visualizer/    # REAL-TIME MESH TRACKER (Hackathon Wow Factor)
│   ├── src/app/dashboard/     # ZKML Inference & Marketplace
│   └── src/components/        # Web3 Wallet & Proof Verifiers
├── worker/                     # Python Decentralized Node
│   ├── decentralized_worker.py # Core Processing Logic
│   ├── blockchain_client.py    # Shardeum/Inco Web3 Client
│   └── zk_proofs.py           # EZKL Proof Generation Engine
└── contracts/                  # Solidity (Shardeum EVM & Inco FHEVM)
```

---

## 🛠️ Key Technical Features

- **EZKL Integration**: Real-world ZK-SNARK generation for Scikit-Learn and ONNX models.
- **Differential Privacy**: Built-in ε-differential privacy mechanisms for decentralized training shards.
- **Live Mesh Visualizer**: A dedicated dashboard to witness the "Worker Boxes" turn green as they complete verifiable tasks.
- **SSH Tunneling**: Workers can operate behind NATs/Firewalls while remaining globally accessible for remote management.

---

<div align="center">
**V-OBLIVION** - Empowering the future of Verifiable, Private, and Distributed AI.
</div>