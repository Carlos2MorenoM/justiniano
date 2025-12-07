import React, { useState } from 'react';
import {
    Activity,
    Cpu,
    Database,
    Settings,
    ChevronRight,
    ChevronLeft,
    Zap,
    Shield
} from 'lucide-react';
import { clsx } from 'clsx';
import type { UserTier } from '../hooks/useChat';

interface ObservabilityPanelProps {
    currentTier: UserTier;
    onTierChange: (tier: UserTier) => void;
    metrics: { latencyMs?: number };
    lastMessageMeta?: Record<string, any>;
    /** The actual text content of the last assistant message, used to extract sources */
    lastMessageContent?: string;
}

/**
 * ObservabilityPanel Component.
 * Displays real-time operational metrics (Latency, Model) and extracted sources.
 * Optimized for "Zero Cost" inference (No Ragas/Eval).
 */
export const ObservabilityPanel: React.FC<ObservabilityPanelProps> = ({
    currentTier,
    onTierChange,
    metrics,
    lastMessageMeta,
    lastMessageContent = ""
}) => {
    const [isOpen, setIsOpen] = useState(true);

    // --- Source Extraction Logic ---
    // Scans the message text for patterns like "BOE-A-2023-12345"
    // Using a Set to remove duplicates found in the same response.
    const sourceRegex = /BOE\s*-\s*[A-Z]\s*-\s*\d{4}\s*-\s*\d+/gi;

    const foundSources = [...new Set(lastMessageContent.match(sourceRegex) || [])]
        .map(s => s.replace(/\s+/g, '').toUpperCase());

    return (
        <div
            className={clsx(
                "fixed right-0 top-0 h-full bg-white border-l border-corpus-muted shadow-2xl transition-all duration-300 z-20 flex flex-col",
                isOpen ? "w-80" : "w-12"
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -left-3 top-6 bg-white border border-corpus-muted rounded-full p-1 shadow-md hover:bg-gray-50 text-corpus-structure"
                title="Toggle Panel"
            >
                {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* --- CONTENT AREA --- */}
            {isOpen && (
                <div className="flex flex-col h-full overflow-y-auto p-5 space-y-8">

                    {/* Header */}
                    <div className="flex items-center gap-2 text-corpus-structure border-b border-corpus-muted pb-4">
                        <Activity size={20} />
                        <h2 className="font-serif font-bold text-lg">System Metrics</h2>
                    </div>

                    {/* 1. AGENT CONFIGURATION */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                            <Settings size={12} /> Agent Config
                        </h3>

                        <div className="bg-corpus-base p-1 rounded-lg flex relative">
                            <button
                                onClick={() => onTierChange('free')}
                                className={clsx(
                                    "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                                    currentTier === 'free'
                                        ? "bg-white text-corpus-structure shadow-sm ring-1 ring-black/5"
                                        : "text-gray-500 hover:text-corpus-structure"
                                )}
                            >
                                <Zap size={14} className={currentTier === 'free' ? "text-orange-400" : ""} />
                                Lite
                            </button>
                            <button
                                onClick={() => onTierChange('pro')}
                                className={clsx(
                                    "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                                    currentTier === 'pro'
                                        ? "bg-corpus-structure text-white shadow-sm"
                                        : "text-gray-500 hover:text-corpus-structure"
                                )}
                            >
                                <Shield size={14} className={currentTier === 'pro' ? "text-corpus-accent" : ""} />
                                Pro
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 leading-snug px-1">
                            {currentTier === 'free'
                                ? "Modelo rápido (Llama 3.1 8B). Ideal para consultas simples."
                                : "Modelo de razonamiento (Gemma 2 / Mistral). Mayor precisión."
                            }
                        </p>
                    </div>

                    {/* 2. INFERENCE METRICS */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                            <Cpu size={12} /> Inference Stats
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-xs text-gray-500 block mb-1">Latencia</span>
                                <span className={clsx(
                                    "text-lg font-mono font-semibold",
                                    (metrics.latencyMs || 0) > 1500 ? "text-orange-500" : "text-green-600"
                                )}>
                                    {metrics.latencyMs ? `${metrics.latencyMs}ms` : "--"}
                                </span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-xs text-gray-500 block mb-1">Modelo</span>
                                <span className="text-sm font-mono font-semibold text-corpus-structure truncate" title={lastMessageMeta?.model}>
                                    {lastMessageMeta?.model || "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. RETRIEVED DOCS (Dynamic Extraction) */}
                    <div className="space-y-3 flex-1">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                            <Database size={12} /> Retrieved Docs
                        </h3>

                        {foundSources.length > 0 ? (
                            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-xs text-yellow-800 transition-all animate-fade-in">
                                <p className="font-semibold mb-2 flex justify-between items-center">
                                    Fuentes Citadas:
                                    <span className="bg-yellow-200 text-yellow-900 px-1.5 py-0.5 rounded text-[10px]">
                                        {foundSources.length}
                                    </span>
                                </p>
                                <ul className="space-y-1.5">
                                    {foundSources.map((source) => (
                                        <li key={source} className="flex items-start gap-2 opacity-90 hover:opacity-100">
                                            <span className="mt-1 w-1 h-1 bg-yellow-600 rounded-full flex-shrink-0" />
                                            <a
                                                href={`https://www.boe.es/buscar/doc.php?id=${source}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline hover:text-yellow-900 truncate"
                                                title="Ver documento oficial en boe.es"
                                            >
                                                {source}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="text-xs text-gray-400 italic p-3 text-center border border-dashed border-gray-200 rounded-lg">
                                Esperando referencias al BOE en la respuesta...
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-corpus-muted text-[10px] text-gray-400 text-center">
                        Justiniano v0.2.0 • Fast Mode
                    </div>

                </div>
            )}

            {/* Collapsed State */}
            {!isOpen && (
                <div className="mt-6 flex flex-col items-center gap-6 text-gray-400">
                    <Activity size={20} />
                    <div className="h-px w-6 bg-gray-200"></div>
                    <span className="text-[10px] font-bold rotate-90 whitespace-nowrap tracking-widest text-corpus-structure">
                        METRICS
                    </span>
                </div>
            )}
        </div>
    );
};