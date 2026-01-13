import React from 'react';
import {
    Database,
    Brain,
    Activity,
    CheckCircle2,
    Clock,
    AlertCircle,
    ExternalLink,
    ScrollText,
    Download,
    Play
} from 'lucide-react';

interface Job {
    id: string | number;
    job_type: 'training' | 'inference';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    reward?: string;
    created_at: string;
    data_hash?: string;
    model_hash?: string;
    requester_address?: string;
    on_chain_id?: number | null;
    result_url?: string;
    inference_result?: string;
    model_id?: string;
    output_data?: any;
    proof_hash?: string;
    transaction_hash?: string;
    latency_ms?: number;
}

interface JobCardProps {
    job: Job;
    account?: string | null;
    onCancel?: (id: string, onChainId: number) => void;
    onTest?: (job: Job) => void;
    onDownload?: (job: Job) => void;
    isWorkerMode?: boolean;
    onWork?: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
    job,
    account,
    onCancel,
    onTest,
    onDownload,
    isWorkerMode,
    onWork
}) => {
    const [mounted, setMounted] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate progress
    React.useEffect(() => {
        if (job.status === 'processing') {
            const calculateProgress = () => {
                const elapsed = Date.now() - new Date(job.created_at).getTime();
                const progressValue = Math.min(95, Math.floor(elapsed / 1000 / 60 * 10));
                setProgress(progressValue);
            };
            calculateProgress();
            const interval = setInterval(calculateProgress, 1000);
            return () => clearInterval(interval);
        } else if (job.status === 'completed') {
            setProgress(100);
        }
    }, [job.status, job.created_at]);

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    bg: 'bg-emerald-500/10',
                    text: 'text-emerald-400',
                    border: 'border-emerald-500/20',
                    icon: CheckCircle2
                };
            case 'processing':
                return {
                    bg: 'bg-blue-500/10',
                    text: 'text-blue-400',
                    border: 'border-blue-500/20',
                    icon: Activity
                };
            case 'failed':
                return {
                    bg: 'bg-rose-500/10',
                    text: 'text-rose-400',
                    border: 'border-rose-500/20',
                    icon: AlertCircle
                };
            default:
                return {
                    bg: 'bg-zinc-500/10',
                    text: 'text-zinc-500',
                    border: 'border-zinc-500/20',
                    icon: Clock
                };
        }
    };

    const theme = getStatusTheme(job.status);
    const StatusIcon = theme.icon;

    return (
        <div className="relative group p-[1px] bg-gradient-to-br from-white/10 to-transparent rounded-[2.5rem] hover:from-emerald-500/30 transition-all duration-700">
            {job.status === 'processing' && (
                <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
                </div>
            )}

            <div className="p-10 bg-[var(--background)] rounded-[2.4rem] flex flex-col gap-8 h-full relative">
                {/* Background ambient glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} blur-[60px] opacity-20 transition-all duration-700 group-hover:opacity-40`} />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[1.5rem] border flex items-center justify-center transition-all duration-500 ${theme.bg} ${theme.border} shadow-inner`}>
                            <StatusIcon className={`w-8 h-8 ${theme.text} ${job.status === 'processing' ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest border border-white/5">
                                    {typeof job.id === 'string' ? job.id.slice(0, 8) : `#${job.id}`}
                                </span>
                                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">
                                    {mounted ? new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tighter group-hover:text-emerald-400 transition-colors uppercase italic">
                                {job.job_type === 'inference' ? 'ZK Inference' : 'Decentralized Training'}
                            </h3>
                        </div>
                    </div>

                    {job.reward && (
                        <div className="text-right flex flex-col items-end">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white font-mono tracking-tighter">
                                    {job.reward}
                                </span>
                                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest italic">
                                    SHM
                                </span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mt-2">
                                Protocol Reward
                            </p>
                        </div>
                    )}

                    {job.latency_ms && (
                        <div className="text-right flex flex-col items-end">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-cyan-400 font-mono tracking-tighter">
                                    {job.latency_ms}
                                </span>
                                <span className="text-xs font-black text-cyan-500 uppercase tracking-widest italic">
                                    ms
                                </span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mt-2">
                                Latency
                            </p>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {job.status === 'processing' && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] animate-pulse">
                                {job.job_type === 'training' ? 'Training Neural Network...' : 'Generating ZK Proof...'}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500">
                                {progress}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Inference Result */}
                {job.job_type === 'inference' && job.inference_result && (
                    <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-[1.8rem] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/40" />
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-3 opacity-60">
                            Inference Output
                        </p>
                        <p className="font-mono text-cyan-50 text-base leading-relaxed break-all">
                            {job.inference_result}
                        </p>
                    </div>
                )}

                {/* Output Data Display */}
                {job.job_type === 'inference' && job.output_data && (
                    <div className="p-6 bg-violet-500/5 border border-violet-500/20 rounded-[1.8rem] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-500/40" />
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-400 mb-3 opacity-60">
                            Model Output
                        </p>
                        <pre className="font-mono text-violet-50 text-sm leading-relaxed overflow-x-auto">
                            {JSON.stringify(job.output_data, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="p-2 bg-zinc-900 rounded-xl">
                            <Database className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                                Model Hash
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">
                                {job.model_hash || job.model_id || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="p-2 bg-zinc-900 rounded-xl">
                            <Activity className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                                {job.proof_hash ? 'Proof Hash' : 'Data Hash'}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">
                                {job.proof_hash || job.data_hash || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-4 items-center">
                        {job.status === 'completed' ? (
                            <div className="flex items-center gap-4">
                                {job.job_type === 'training' && job.result_url && onDownload && (
                                    <button
                                        onClick={() => onDownload(job)}
                                        className="flex items-center gap-2.5 px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[11px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all"
                                    >
                                        <Download className="w-4 h-4" /> Download Model
                                    </button>
                                )}
                                {job.job_type === 'training' && onTest && (
                                    <button
                                        onClick={() => onTest(job)}
                                        className="flex items-center gap-2.5 px-5 py-2.5 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-[11px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all"
                                    >
                                        <Brain className="w-4 h-4" /> Test Model
                                    </button>
                                )}
                                {job.proof_hash && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                                        <CheckCircle2 className="w-4 h-4 text-violet-400" />
                                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
                                            ZK Verified
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border ${theme.bg} ${theme.border} text-[11px] font-black uppercase tracking-widest ${theme.text}`}>
                                <Clock className={`w-4 h-4 ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                                {job.status}
                            </div>
                        )}

                        {job.status === 'pending' && job.requester_address?.toLowerCase() === account?.toLowerCase() && onCancel && (
                            <button
                                onClick={() => {
                                    if (job.on_chain_id !== undefined && job.on_chain_id !== null) {
                                        onCancel(String(job.id), job.on_chain_id);
                                    } else {
                                        alert('On-chain ID missing. Please refresh.');
                                    }
                                }}
                                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors"
                            >
                                <AlertCircle className="w-4 h-4" /> Cancel
                            </button>
                        )}

                        {job.status === 'pending' && isWorkerMode && onWork && (
                            <button
                                onClick={() => onWork(job)}
                                className="flex items-center gap-2.5 px-6 py-2.5 bg-amber-500 text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-amber-500/20"
                            >
                                <Play className="w-4 h-4" /> Process Job
                            </button>
                        )}
                    </div>

                    {/* Explorer Links */}
                    <div className="flex items-center gap-4">
                        {job.transaction_hash && (
                            <a
                                href={`https://explorer-mezame.shardeum.org/tx/${job.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-400 transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> View TX
                            </a>
                        )}
                        {job.on_chain_id !== null && job.on_chain_id !== undefined && (
                            <a
                                href={`https://explorer-mezame.shardeum.org/tx/${job.on_chain_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-600 hover:text-cyan-400 transition-colors"
                            >
                                <ScrollText className="w-3.5 h-3.5" /> Explorer
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
