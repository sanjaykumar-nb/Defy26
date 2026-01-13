# 🧠 V-OBLIVION: Decentralized AI Inference & ML Training Platform

<div align="center">

**Verifiable AI Inference + Sharded ML Training Marketplace on Shardeum & Inco**

[![Shardeum](https://img.shields.io/badge/Shardeum-Mezame-00d4aa?style=for-the-badge)](https://shardeum.org/)
[![Inco](https://img.shields.io/badge/Inco-FHEVM-black?style=for-the-badge)](https://www.inco.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge)](https://fastapi.tiangolo.com/)
[![ZKML](https://img.shields.io/badge/ZKML-EZKL-6366f1?style=for-the-badge)]()

</div>

---

## 🌟 Overview

**V-OBLIVION** is a decentralized ecosystem for verifiable AI, built on a cross-chain architecture leveraging **Shardeum** for high-speed job orchestration and **Inco (FHEVM)** for privacy-preserving reputation management.

- **🤖 Verifiable Inference**: Run AI models (Scikit-Learn, ONNX, Transformers) with cryptographic proof of correct execution.
- **🏋️ Sharded ML Training**: High-performance training jobs broken into shards and processed by a global compute fleet.
- **�️ Confidential Reputation (Inco)**: Worker performance and reputation are managed via Fully Homomorphic Encryption (FHE) on Inco, ensuring worker privacy while maintaining network quality.
- **⛓️ Proof Anchoring (Shardeum)**: All ZKML proofs are anchored to Shardeum for immutable, low-cost auditing.

---

## 🏗️ Architecture

```mermaid
graph TD
    User([User / Judge])
    
    subgraph Frontend [Next.js Dashboard]
        UI[User Interface]
        WC[Wallet Connection - Wagmi]
        VI[Visualizer - Real-time Mesh]
    end
    
    subgraph Backend [FastAPI Server]
        API[Rest API]
        DB[(Local Storage)]
        EZ[EZKL ZKML Service]
    end
    
    subgraph Mesh [Decentralized Mesh]
        W1[Worker Node A]
        W2[Worker Node B]
    end
    
    subgraph Blockchain_Shardeum [Shardeum EVM]
        SC[VInferenceAudit Contract]
        OM[OblivionManager - Staking]
    end

    subgraph Blockchain_Inco [Inco FHEVM]
        REP[Confidential Reputation Contract]
    end
    
    subgraph Storage [IPFS / Pinata]
        M[(Models & Proofs)]
    end

    User <--> UI
    UI <--> API
    API <--> DB
    
    %% Shardeum Roles
    API <--> SC
    W1 <--> SC
    W1 <--> OM
    
    %% Inco Roles
    W1 <--> REP
    API <--> REP
    
    %% Logic
    API <--> EZ
    EZ <--> M
    W1 <--> M
```

---

## 🔄 Dual-Chain Strategy

### 1. Shardeum: The Execution Engine
- **Scalability**: Handles the high-frequency job submissions and worker heartbeat events.
- **Anchoring**: Stores the `bytes32` hashes of ZKML proofs in the `VInferenceAudit` contract.
- **Economy**: Manages $SHM rewards, staking, and escrowed marketplace payments.

### 2. Inco: The Privacy Layer
- **FHEVM Integration**: Uses Inco's Fully Homomorphic Encryption to store worker quality scores.
- **Confidential Selection**: Backend queries Inco to select workers based on encrypted reputation without revealing individual performance data to the entire mesh.
- **Privacy-First Quality**: `IncoReputation.sol` ensures that only authorized validators can update or view sensitive worker metrics.

---

## 📁 Detailed Project Structure

### 🗄️ Root Directory
- `backend/`: FastAPI Backend & Orchestration Layer
- `frontend/`: Next.js 15 Frontend (App Router)
- `worker/`: Decentralized Worker Node implementation
- `contracts/`: Solidity Smart Contracts for **Shardeum** and **Inco**.

### ⚙️ Worker Node (`/worker`)
- `blockchain_client.py`: Multi-chain client interacting with both Shardeum (EVM) and Inco (FHEVM).
- `zk_proofs.py`: EZKL integration for generating SNARK proofs of ML computation.
- `privacy.py`: Differential Privacy (Laplace mechanism) for training data.
- `quality_verification.py`: Computes encrypted metrics to be sent to Inco.

---

## 🔗 Smart Contract Registry

| Chain | Contract | Purpose | Address |
|-------|----------|---------|---------|
| **Shardeum** | `VInferenceAudit` | Proof Anchoring | `0xb3BD0a70eB7eAe91E6F23564d897C8098574e892` |
| **Shardeum** | `OblivionManager` | Staking & Job Lifecycle | `0x7991295433Ea07821F51f106B64754168b99a3f1` |
| **Inco** | `IncoReputation` | Confidential Worker Scores | `0x... (Deployed on FHEVM)` |

---

<div align="center">
Built for Shardeum & Inco | Verifiable & Private AI
</div>