"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, FileText, CheckCircle2, AlertCircle, HelpCircle, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CountryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [country, setCountry] = useState<any>(null);
    const [laws, setLaws] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_URL}/countries/${id}`);
                setCountry(res.data.country);
                setLaws(res.data.laws);
                setResults(res.data.analysis_results);
            } catch (err) {
                console.error("Error fetching country details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({...prev, [id]: !prev[id]}));
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!country) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
             <AlertCircle className="w-12 h-12 text-red-500" />
             <p className="text-lg text-gray-700">Country not found or error loading data.</p>
             <button onClick={() => router.back()} className="text-blue-600 hover:underline">Go Back</button>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
            >
                <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{country.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{country.id}</span>
                        <span>•</span>
                        <span>IHR Compliance Profile</span>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Summary & Laws */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900">Compliance Summary</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                                <div className="text-2xl font-bold text-green-700">{results.filter(r => r.status === 'Yes').length}</div>
                                <div className="text-xs font-medium text-green-800 uppercase tracking-wide mt-1">Compliant</div>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-xl text-center border border-yellow-100">
                                <div className="text-2xl font-bold text-yellow-700">{results.filter(r => r.status === 'Partial').length}</div>
                                <div className="text-xs font-medium text-yellow-800 uppercase tracking-wide mt-1">Partial</div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                                <div className="text-2xl font-bold text-red-700">{results.filter(r => r.status === 'No').length}</div>
                                <div className="text-xs font-medium text-red-800 uppercase tracking-wide mt-1">Missing</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                <div className="text-2xl font-bold text-gray-600">{results.filter(r => r.status === 'Unknown').length}</div>
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Pending</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">Source Laws</h2>
                        </div>
                        {laws.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                No legal documents uploaded yet.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {laws.map(l => (
                                    <li key={l.id} className="group p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                                        <div className="font-medium text-gray-900 text-sm leading-tight">{l.title}</div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="text-xs text-gray-400">{l.publication_date ? new Date(l.publication_date).toLocaleDateString() : 'Unknown Date'}</div>
                                            {l.url && (
                                                <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Source <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </motion.div>

                {/* Right Column: Detailed Breakdown */}
                <div className="lg:col-span-2 space-y-4">
                     <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xl font-bold text-gray-900 mb-4"
                     >
                        Obligation Analysis
                     </motion.h2>

                     {results.length === 0 && (
                         <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-200">
                             <p className="text-gray-500">No analysis results available. Trigger an analysis from the Admin Panel.</p>
                             <Link href="/admin" className="text-blue-600 font-medium hover:underline mt-2 inline-block">Go to Admin Panel</Link>
                         </div>
                     )}

                     {results.map((r, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <button
                                onClick={() => toggleExpand(r.obligation_id)}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                        r.status === 'Yes' ? 'bg-green-100 text-green-600' :
                                        r.status === 'Partial' ? 'bg-yellow-100 text-yellow-600' :
                                        r.status === 'No' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
                                    )}>
                                        {r.status === 'Yes' ? <CheckCircle2 className="w-5 h-5" /> :
                                         r.status === 'Partial' ? <AlertCircle className="w-5 h-5" /> :
                                         r.status === 'No' ? <AlertCircle className="w-5 h-5" /> :
                                         <HelpCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">{r.obligation_id.replace('IHR_', '').replace(/_/g, ' ')}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={clsx(
                                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                                 r.status === 'Yes' ? 'bg-green-50 text-green-700' :
                                                 r.status === 'Partial' ? 'bg-yellow-50 text-yellow-700' :
                                                 r.status === 'No' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                                            )}>
                                                {r.status}
                                            </span>
                                            <span className="text-xs text-gray-400">Confidence: {(r.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronDown className={clsx("w-5 h-5 text-gray-400 transition-transform", expanded[r.obligation_id] && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {expanded[r.obligation_id] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-50 bg-gray-50/30"
                                    >
                                        <div className="p-5 space-y-6">
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Evidence Found</h4>
                                                {r.evidence && r.evidence.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {r.evidence.map((ev: any, idx: number) => (
                                                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 text-sm">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-xs">{ev.article}</span>
                                                                    {ev.law_id && <span className="text-xs text-gray-400">Law ID: {ev.law_id}</span>}
                                                                </div>
                                                                <blockquote className="italic text-gray-600 border-l-2 border-blue-200 pl-3 my-2">
                                                                    "{ev.quote}"
                                                                </blockquote>
                                                                <p className="text-gray-500 text-xs mt-2 bg-gray-50 p-2 rounded block">
                                                                    <span className="font-medium text-gray-600">Analysis:</span> {ev.reason}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic pl-2">No specific evidence cited.</p>
                                                )}
                                            </div>

                                            {r.missing_info && r.missing_info.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Missing Elements</h4>
                                                    <ul className="list-disc pl-5 space-y-1 text-sm text-red-600/80">
                                                        {r.missing_info.map((m: string, idx: number) => (
                                                            <li key={idx}>{m}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {r.notes && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Analyst Notes</h4>
                                                    <p className="text-sm text-gray-700 leading-relaxed">{r.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                     ))}
                </div>
            </div>
        </div>
    );
}
