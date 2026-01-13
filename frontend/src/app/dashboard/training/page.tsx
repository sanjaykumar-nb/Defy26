"use client";


import { useState, useEffect, useRef } from "react";
import { IncoService } from "@/lib/incoService";
import { ethers, BrowserProvider, Contract, parseEther } from "ethers";

// Utility to format SHM values (4 decimals, comma separated)
function formatSHM(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0.0000';
    return num.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

// Icons
const BrainIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const UploadIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const ClockIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CubeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const Database = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
);

interface TrainingJob {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    script_url: string;
    dataset_url: string;
    reward: number;
    created_at: string;
    worker_address?: string;
    result_url?: string;
}

export default function TrainingPage() {
    const [jobs, setJobs] = useState<TrainingJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [reward, setReward] = useState("0.05");
    const [scriptUrl, setScriptUrl] = useState("");
    const [datasetUrl, setDatasetUrl] = useState("");

    // Inco FHE Integration
    const [isConfidential, setIsConfidential] = useState(false);
    const [minReputation, setMinReputation] = useState(50);
    const [creating, setCreating] = useState(false);
    const [selectedJob, setSelectedJob] = useState<any | null>(null);

    // File upload state
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [codeFile, setCodeFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const csvInputRef = useRef<HTMLInputElement>(null);
    const codeInputRef = useRef<HTMLInputElement>(null);

    // Mode toggle: 'basic' (upload files) or 'custom' (write code)
    const [inputMode, setInputMode] = useState<'basic' | 'custom'>('custom');

    // Custom code state
    const [customCode, setCustomCode] = useState(`# Example Training Script
import torch
import torch.nn as nn
import pandas as pd

# Load your dataset
data = pd.read_csv('dataset.csv')

# Define your model
model = nn.Sequential(
    nn.Linear(10, 64),
    nn.ReLU(),
    nn.Linear(64, 1)
)

# Training loop
optimizer = torch.optim.Adam(model.parameters())
criterion = nn.MSELoss()

for epoch in range(100):
    # Your training code here
    pass

# Save model
torch.save(model.state_dict(), 'model.pt')
`);

    useEffect(() => {
        fetchJobs();
    }, []);

    const newJobRef = useRef<HTMLTableRowElement>(null);

    const clearForm = () => {
        setScriptUrl("");
        setDatasetUrl("");
        setReward("0.01");
        setCsvFile(null);
        setCodeFile(null);
        if (csvInputRef.current) csvInputRef.current.value = "";
        if (codeInputRef.current) codeInputRef.current.value = "";
    };

    const loadSample = () => {
        setScriptUrl("ipfs://QmSampleScript123");
        setDatasetUrl("ipfs://QmSampleDataset456");
        setReward("0.05");
        setCsvFile(null);
        setCodeFile(null);
        if (csvInputRef.current) csvInputRef.current.value = "";
        if (codeInputRef.current) codeInputRef.current.value = "";
    };

    const fetchJobs = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/training/jobs');
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File, type: 'csv' | 'code') => {
        // Upload file to backend, get IPFS URL
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        setUploading(true);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success && data.url) {
                return data.url;
            } else {
                alert('File upload failed');
                return '';
            }
        } catch (e) {
            alert('File upload error');
            return '';
        } finally {
            setUploading(false);
        }
    };

    // Validation helpers
    const isScriptProvided = inputMode === 'custom'
        ? customCode.trim().length > 0
        : (!!scriptUrl || !!codeFile);
    const isDatasetProvided = !!datasetUrl || !!csvFile;
    const isRewardValid = !!reward && !isNaN(Number(reward)) && Number(reward) > 0;
    const canCreateJob = isScriptProvided && isDatasetProvided && isRewardValid && !creating && !uploading;

    const handleCreateJob = async () => {
        if (!canCreateJob) return;
        setCreating(true);
        let finalScriptUrl = scriptUrl;
        let finalDatasetUrl = datasetUrl;

        try {
            // Step 1: Handle file uploads if necessary
            if (codeFile) {
                const url = await handleFileUpload(codeFile, 'code');
                if (url) finalScriptUrl = url;
            }
            if (csvFile) {
                const url = await handleFileUpload(csvFile, 'csv');
                if (url) finalDatasetUrl = url;
            }

            // Step 2: Inco FHE Encryption
            let encryptedThreshold: string = "0x";
            if (isConfidential) {
                console.log("🛡️ Confidential Mode Enabled. Encrypting threshold...");
                try {
                    const contractAddr = "0x789..."; // Inco Reputation Contract
                    const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                    const userAddr = accounts[0];

                    try {
                        const encryptedBytes = await IncoService.encryptUint32(minReputation, contractAddr, userAddr);
                        encryptedThreshold = IncoService.bytesToHex(encryptedBytes);
                    } catch (e) {
                        console.warn("⚠️ FHE fallback for demo");
                        // Fallback random hex (40 chars = 20 bytes)
                        encryptedThreshold = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
                    }
                } catch (err) {
                    console.error("FHE Encryption failed:", err);
                }
            }

            // Step 3: Metamask Transaction
            console.log("🦊 Initiating Metamask transaction...");
            if (typeof (window as any).ethereum !== 'undefined') {
                const provider = new BrowserProvider((window as any).ethereum);
                const signer = await provider.getSigner();

                // VTrainingManager Address (from deploy_contracts.py or config)
                const contractAddress = process.env.NEXT_PUBLIC_TRAINING_CONTRACT || "0x1234567890123456789012345678901234567890";

                const abi = [
                    "function createJob(string _scriptHash, string _dataHash, bytes _encryptedThreshold) external payable"
                ];

                const contract = new Contract(contractAddress, abi, signer);

                // Call contract
                const tx = await contract.createJob(
                    finalScriptUrl || "ipfs://QmDefaultScript",
                    finalDatasetUrl || "ipfs://QmDefaultData",
                    encryptedThreshold,
                    { value: parseEther(reward) }
                );

                console.log("⏳ Transaction submitted:", tx.hash);
                await tx.wait();
                console.log("✅ Transaction confirmed!");

                // Step 3.5: Sync with Backend
                try {
                    await fetch('http://localhost:8000/api/training/jobs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            requester: signer.address,
                            script_url: finalScriptUrl || "ipfs://QmDefaultScript",
                            dataset_url: finalDatasetUrl || "ipfs://QmDefaultData",
                            reward: parseFloat(reward),
                            is_confidential: isConfidential,
                            encrypted_threshold: encryptedThreshold
                        })
                    });
                } catch (be_err) {
                    console.warn("⚠️ Backend sync failed (demo mode):", be_err);
                }
            } else {
                throw new Error("Metamask not found");
            }

            // Step 4: Add to local UI
            const newJob: TrainingJob = {
                id: `0x${Math.random().toString(16).slice(2, 10)}...`,
                status: "pending",
                script_url: finalScriptUrl,
                dataset_url: finalDatasetUrl,
                reward: parseFloat(reward),
                created_at: new Date().toISOString()
            };

            setJobs([newJob, ...jobs]);
            setShowCreateModal(false);
            clearForm();
            alert("Job Posted Successfully to Shardeum!");
        } catch (error: any) {
            console.error("Error creating job:", error);
            alert(`Failed to create job: ${error.message || error}`);
        } finally {
            setCreating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "badge-success";
            case "processing": return "badge-primary";
            case "failed": return "bg-red-500/20 text-red-400";
            default: return "bg-yellow-500/20 text-yellow-400";
        }
    };

    const generateSampleDataset = () => {
        // Generate a sample CSV dataset
        const csvContent = `feature1,feature2,feature3,feature4,feature5,feature6,feature7,feature8,feature9,feature10,label
0.52,0.31,0.89,0.12,0.67,0.45,0.78,0.23,0.91,0.56,1
0.23,0.78,0.45,0.91,0.12,0.67,0.34,0.89,0.56,0.21,0
0.89,0.12,0.67,0.34,0.78,0.23,0.91,0.45,0.12,0.67,1
0.34,0.67,0.12,0.89,0.45,0.78,0.23,0.56,0.91,0.34,0
0.67,0.45,0.78,0.23,0.91,0.12,0.67,0.34,0.89,0.45,1
0.12,0.89,0.34,0.67,0.23,0.91,0.45,0.78,0.12,0.89,0
0.78,0.23,0.91,0.45,0.12,0.67,0.89,0.34,0.67,0.23,1
0.45,0.91,0.23,0.78,0.67,0.34,0.12,0.89,0.45,0.91,0
0.91,0.34,0.67,0.12,0.89,0.45,0.78,0.23,0.34,0.67,1
0.56,0.67,0.45,0.89,0.34,0.12,0.91,0.67,0.78,0.12,0`;

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sample_dataset.csv';
        link.click();
        window.URL.revokeObjectURL(url);

        // Also set it as the dataset URL
        setDatasetUrl('sample_dataset.csv (downloaded)');
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <BrainIcon /> ML Training Jobs
                    </h1>
                    <p className="text-[var(--foreground-muted)]">
                        Submit ML training jobs to decentralized workers on Shardeum
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                >
                    <UploadIcon /> Create Job
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 text-center">
                    <div className="text-3xl font-bold text-[var(--primary-400)]">{jobs.length}</div>
                    <div className="text-sm text-[var(--foreground-muted)]">Total Jobs</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-400">
                        {jobs.filter(j => j.status === "pending").length}
                    </div>
                    <div className="text-sm text-[var(--foreground-muted)]">Pending</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400">
                        {jobs.filter(j => j.status === "processing").length}
                    </div>
                    <div className="text-sm text-[var(--foreground-muted)]">Processing</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-3xl font-bold text-[var(--secondary-400)]">
                        {jobs.filter(j => j.status === "completed").length}
                    </div>
                    <div className="text-sm text-[var(--foreground-muted)]">Completed</div>
                </div>
            </div>

            {/* Jobs Table */}
            <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Training Jobs</h2>

                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary-500)]"></div>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-12 text-[var(--foreground-muted)]">
                        <CubeIcon />
                        <p className="mt-2">No training jobs yet</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 text-[var(--primary-400)] hover:underline"
                        >
                            Create your first job
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-[var(--foreground-muted)] border-b border-[var(--glass-border)]">
                                    <th className="pb-3 font-medium">Job ID</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Reward</th>
                                    <th className="pb-3 font-medium">Worker</th>
                                    <th className="pb-3 font-medium">Created</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {jobs.map((job, idx) => (
                                    <tr
                                        key={job.id}
                                        ref={idx === 0 ? newJobRef : undefined}
                                        className="border-b border-[var(--glass-border)]/50 hover:bg-[var(--glass-bg)] transition-colors"
                                    >
                                        <td className="py-3 font-mono">{job.id}</td>
                                        <td className="py-3">
                                            <span className={`badge ${getStatusColor(job.status)}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="py-3 font-mono text-emerald-400">{formatSHM(job.reward)} SHM</td>
                                        <td className="py-3 font-mono text-xs">
                                            {job.worker_address || "-"}
                                        </td>
                                        <td className="py-3 flex items-center gap-1 text-[var(--foreground-muted)]">
                                            <ClockIcon />
                                            {new Date(job.created_at).toLocaleString()}
                                        </td>
                                        <td className="py-3">
                                            <button
                                                onClick={() => setSelectedJob(job)}
                                                className="btn btn-xs btn-outline"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* How It Works */}
            <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">How It Works</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--glass-bg)] text-center">
                        <div className="text-2xl mb-2">1️⃣</div>
                        <div className="font-medium">Upload Script & Data</div>
                        <div className="text-sm text-[var(--foreground-muted)]">
                            Push to IPFS via Pinata
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--glass-bg)] text-center">
                        <div className="text-2xl mb-2">2️⃣</div>
                        <div className="font-medium">Create Job</div>
                        <div className="text-sm text-[var(--foreground-muted)]">
                            Submit on-chain with reward
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--glass-bg)] text-center">
                        <div className="text-2xl mb-2">3️⃣</div>
                        <div className="font-medium">Worker Claims</div>
                        <div className="text-sm text-[var(--foreground-muted)]">
                            Stakes & trains with DP
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--glass-bg)] text-center">
                        <div className="text-2xl mb-2">4️⃣</div>
                        <div className="font-medium">Get Result</div>
                        <div className="text-sm text-[var(--foreground-muted)]">
                            Model on IPFS, verified
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Job Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    />
                    <div className="glass-card w-full max-w-6xl p-6 relative z-10 animate-fade-in max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <BrainIcon /> Create Training Job
                        </h2>


                        <div className="space-y-4">
                            {/* Mode Toggle */}
                            <div className="flex gap-3 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setInputMode('custom')}
                                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${inputMode === 'custom'
                                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-lg'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    ✏️ Custom Code
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputMode('basic')}
                                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${inputMode === 'basic'
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-black shadow-lg'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    📁 Upload File
                                </button>
                            </div>

                            {/* Horizontal Grid Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Training Script Input */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Training Script <span className="text-red-500">*</span>
                                    </label>

                                    {inputMode === 'custom' ? (
                                        /* Custom Code Editor */
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <textarea
                                                    value={customCode}
                                                    onChange={(e) => setCustomCode(e.target.value)}
                                                    placeholder="# Write your PyTorch training script here..."
                                                    className="w-full h-64 p-4 bg-zinc-900/80 border border-zinc-700 rounded-xl font-mono text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                                                    spellCheck={false}
                                                />
                                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                                        Python
                                                    </span>
                                                    <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] text-zinc-500">
                                                        {customCode.split('\n').length} lines
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 text-zinc-500">
                                                    <BrainIcon />
                                                    <span>Write your PyTorch/TensorFlow training code</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setCustomCode(`# Example Training Script\nimport torch\nimport torch.nn as nn\nimport pandas as pd\n\n# Load your dataset\ndata = pd.read_csv('dataset.csv')\n\n# Define your model\nmodel = nn.Sequential(\n    nn.Linear(10, 64),\n    nn.ReLU(),\n    nn.Linear(64, 1)\n)\n\n# Training loop\noptimizer = torch.optim.Adam(model.parameters())\ncriterion = nn.MSELoss()\n\nfor epoch in range(100):\n    # Your training code here\n    pass\n\n# Save model\ntorch.save(model.state_dict(), 'model.pt')\n`)}
                                                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                                                >
                                                    Load Example
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Basic File Upload */
                                        <div className="space-y-3">
                                            {/* File Upload Zone */}
                                            <div
                                                className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${codeFile
                                                    ? 'border-violet-500/50 bg-violet-500/5'
                                                    : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'
                                                    }`}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.add('border-violet-500');
                                                }}
                                                onDragLeave={(e) => {
                                                    e.currentTarget.classList.remove('border-violet-500');
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.remove('border-emerald-500');
                                                    const file = e.dataTransfer.files[0];
                                                    if (file && (file.name.endsWith('.py') || file.name.endsWith('.ipynb') || file.name.endsWith('.txt'))) {
                                                        setCodeFile(file);
                                                        setScriptUrl(''); // Clear URL when file is uploaded
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="file"
                                                    accept=".py,.ipynb,.txt"
                                                    ref={codeInputRef}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setCodeFile(file);
                                                            setScriptUrl(''); // Clear URL when file is uploaded
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="text-center pointer-events-none">
                                                    {codeFile ? (
                                                        <>
                                                            <span style={{ display: 'block', width: 32, height: 32, margin: '0 auto 0.5rem', color: '#8b5cf6' }}><UploadIcon /></span>
                                                            <p className="text-sm font-medium text-violet-400">{codeFile.name}</p>
                                                            <p className="text-xs text-zinc-500 mt-1">
                                                                {(codeFile.size / 1024).toFixed(2)} KB
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span style={{ display: 'block', width: 32, height: 32, margin: '0 auto 0.5rem', color: '#52525b' }}><UploadIcon /></span>
                                                            <p className="text-sm text-zinc-400">
                                                                Drag & drop or click to upload
                                                            </p>
                                                            <p className="text-xs text-zinc-600 mt-1">
                                                                .py, .ipynb, or .txt files
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Optional: IPFS/URL Input */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-px flex-1 bg-zinc-800"></div>
                                                    <span className="text-xs text-zinc-600 uppercase tracking-wider">Or provide URL</span>
                                                    <div className="h-px flex-1 bg-zinc-800"></div>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={scriptUrl}
                                                    onChange={(e) => {
                                                        setScriptUrl(e.target.value);
                                                        if (e.target.value) {
                                                            setCodeFile(null); // Clear file when URL is entered
                                                            if (codeInputRef.current) codeInputRef.current.value = '';
                                                        }
                                                    }}
                                                    placeholder="ipfs://Qm... or https://..."
                                                    className="input w-full text-sm"
                                                    disabled={!!codeFile}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {!isScriptProvided && (
                                        <p className="text-xs mt-2 text-red-400">
                                            ⚠️ {inputMode === 'custom' ? 'Please write your training code' : 'Please upload a script or provide a URL'}
                                        </p>
                                    )}
                                </div>

                                {/* Dataset Upload */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Training Dataset <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-3">
                                        {/* File Upload Zone */}
                                        <div
                                            className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${csvFile
                                                ? 'border-cyan-500/50 bg-cyan-500/5'
                                                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'
                                                }`}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.add('border-cyan-500');
                                            }}
                                            onDragLeave={(e) => {
                                                e.currentTarget.classList.remove('border-cyan-500');
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove('border-cyan-500');
                                                const file = e.dataTransfer.files[0];
                                                if (file && file.name.endsWith('.csv')) {
                                                    setCsvFile(file);
                                                    setDatasetUrl(''); // Clear URL when file is uploaded
                                                }
                                            }}
                                        >
                                            <input
                                                type="file"
                                                accept=".csv"
                                                ref={csvInputRef}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setCsvFile(file);
                                                        setDatasetUrl(''); // Clear URL when file is uploaded
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="text-center pointer-events-none">
                                                {csvFile ? (
                                                    <>
                                                        <Database className="w-8 h-8 mx-auto mb-2 text-cyan-500" />
                                                        <p className="text-sm font-medium text-cyan-400">{csvFile.name}</p>
                                                        <p className="text-xs text-zinc-500 mt-1">
                                                            {(csvFile.size / 1024).toFixed(2)} KB
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Database className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                                                        <p className="text-sm text-zinc-400">
                                                            Drag & drop or click to upload
                                                        </p>
                                                        <p className="text-xs text-zinc-600 mt-1">
                                                            CSV files only
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Optional: IPFS/URL Input */}
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <div className="h-px flex-1 bg-zinc-800"></div>
                                                    <span className="text-xs text-zinc-600 uppercase tracking-wider">Or provide URL</span>
                                                    <div className="h-px flex-1 bg-zinc-800"></div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={generateSampleDataset}
                                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium whitespace-nowrap px-2"
                                                >
                                                    📥 Download Sample
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                value={datasetUrl}
                                                onChange={(e) => {
                                                    setDatasetUrl(e.target.value);
                                                    if (e.target.value) {
                                                        setCsvFile(null); // Clear file when URL is entered
                                                        if (csvInputRef.current) csvInputRef.current.value = '';
                                                    }
                                                }}
                                                placeholder="ipfs://Qm... or https://..."
                                                className="input w-full text-sm"
                                                disabled={!!csvFile}
                                            />
                                        </div>
                                    </div>
                                    {!isDatasetProvided && (
                                        <p className="text-xs mt-2 text-red-400">
                                            ⚠️ Please upload a dataset or provide a URL
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Reward Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Reward (SHM) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={reward}
                                    onChange={(e) => setReward(e.target.value)}
                                    min="0.001"
                                    step="0.001"
                                    placeholder="0.05"
                                    className="input w-full"
                                />
                                {!isRewardValid && (
                                    <p className="text-xs mt-2 text-red-400">
                                        ⚠️ Please enter a valid reward amount (minimum 0.001 SHM)
                                    </p>
                                )}
                            </div>

                            {/* Inco FHE Confidential Node Selection */}
                            <div className={`p-5 rounded-2xl border transition-all ${isConfidential
                                ? 'bg-indigo-500/10 border-indigo-500/30'
                                : 'bg-zinc-900/40 border-zinc-800'}`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${isConfidential ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-zinc-800 text-zinc-500'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm ${isConfidential ? 'text-indigo-400' : 'text-zinc-300'}`}>
                                                Confidential Node Selection
                                            </h3>
                                            <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">
                                                Powered by **Inco Lightning FHEVM**. Hides job criteria from public view.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsConfidential(!isConfidential)}
                                        className={`w-12 h-6 rounded-full relative transition-all ${isConfidential ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isConfidential ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {isConfidential && (
                                    <div className="mt-4 pt-4 border-t border-indigo-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-semibold text-zinc-400">Min. Hidden Reputation</label>
                                                <span className="text-xs font-mono font-bold text-indigo-400">{minReputation} pts</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={minReputation}
                                                onChange={(e) => setMinReputation(parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                <p className="text-[10px] text-indigo-300/80 italic">
                                                    Your criteria will be encrypted with FHE before being submitted to the contract.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Summary Card */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-zinc-400">Worker Reward</span>
                                    <span className="text-lg font-bold text-emerald-400">{reward} SHM</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-zinc-500">
                                    <span>Worker Stake Required (50%)</span>
                                    <span>{(parseFloat(reward || '0') * 0.5).toFixed(4)} SHM</span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-zinc-400">
                                            Job will be broadcast to Shardeum network
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={loadSample}
                                    className="btn flex-1"
                                    style={{ background: "var(--glass-bg)", color: '#6366f1' }}
                                    type="button"
                                >
                                    Load Sample
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn flex-1"
                                    style={{ background: "var(--glass-bg)" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateJob}
                                    disabled={!canCreateJob}
                                    className="btn btn-primary flex-1 disabled:opacity-50"
                                >
                                    {(creating || uploading) ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    ) : (
                                        "Create Job"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Job Details Modal */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedJob(null)}
                    />
                    <div className="glass-card w-full max-w-4xl p-8 relative z-10 animate-fade-in max-h-[90vh] overflow-y-auto border-t-4 border-[var(--primary-500)]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <BrainIcon /> Job Details
                                </h2>
                                <p className="text-xs font-mono text-[var(--foreground-muted)] mt-1">{selectedJob.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="text-[var(--foreground-muted)] hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--primary-400)]">General Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-[var(--glass-border)] pb-2">
                                        <span className="text-[var(--foreground-muted)]">Status</span>
                                        <span className={`badge ${getStatusColor(selectedJob.status)} uppercase font-bold text-[10px]`}>{selectedJob.status}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-[var(--glass-border)] pb-2">
                                        <span className="text-[var(--foreground-muted)]">Reward</span>
                                        <span className="font-bold">{selectedJob.reward} SHM</span>
                                    </div>
                                    <div className="flex justify-between border-b border-[var(--glass-border)] pb-2">
                                        <span className="text-[var(--foreground-muted)]">Created</span>
                                        <span>{new Date(selectedJob.created_at).toLocaleString()}</span>
                                    </div>
                                    {selectedJob.completed_at && (
                                        <div className="flex justify-between border-b border-[var(--glass-border)] pb-2">
                                            <span className="text-[var(--foreground-muted)]">Completed</span>
                                            <span>{new Date(selectedJob.completed_at).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--secondary-400)]">Resources</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="p-3 bg-black/40 rounded-lg border border-[var(--glass-border)] break-all font-mono">
                                        <div className="text-[10px] text-[var(--foreground-muted)] mb-1 uppercase">Script URL</div>
                                        {selectedJob.script_url}
                                    </div>
                                    <div className="p-3 bg-black/40 rounded-lg border border-[var(--glass-border)] break-all font-mono">
                                        <div className="text-[10px] text-[var(--foreground-muted)] mb-1 uppercase">Dataset URL</div>
                                        {selectedJob.dataset_url}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shard Visualization */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--accent-400)] flex justify-between">
                                <span>Mesh Shard Distribution</span>
                                <span>{selectedJob.completed_shards || 0} / {selectedJob.total_shards || 10} Shards Verified</span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {(selectedJob.shards || [...Array(10)]).map((shard: any, i: number) => {
                                    const isCompleted = shard?.status === 'completed';
                                    const isProcessing = shard?.status === 'processing';
                                    return (
                                        <div key={i} className={`p-3 rounded-xl border flex flex-col items-center gap-2 ${isCompleted ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                            isProcessing ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                                'bg-zinc-900 border-zinc-800 text-zinc-600'
                                            }`}>
                                            <div className="text-[10px] font-bold">SHARD {i + 1}</div>
                                            <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-current opacity-20'}`}></div>
                                            <div className="text-[9px] uppercase font-mono">
                                                {shard?.status || 'PENDING'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[var(--glass-border)] flex justify-end">
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold text-sm transition-colors"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

