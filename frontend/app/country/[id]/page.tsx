"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CountryDetailPage() {
    const params = useParams();
    const id = params.id as string;
    // ... same content as above ...
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

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!country) return <div className="p-8 text-center text-red-500">Country not found</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">{country.name} ({country.id})</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Laws Analyzed</h2>
                    {laws.length === 0 ? (
                        <p className="text-gray-500">No laws uploaded yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {laws.map(l => (
                                <li key={l.id} className="border-b pb-2">
                                    <div className="font-medium">{l.title}</div>
                                    <div className="text-sm text-gray-500">{l.publication_date ? new Date(l.publication_date).toLocaleDateString() : 'No Date'}</div>
                                    {l.url && <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">View Source</a>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-white p-6 rounded shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Compliance Summary</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-100 p-4 rounded text-center">
                            <div className="text-2xl font-bold text-green-700">{results.filter(r => r.status === 'Yes').length}</div>
                            <div className="text-sm text-green-800">Compliant</div>
                        </div>
                        <div className="bg-yellow-100 p-4 rounded text-center">
                            <div className="text-2xl font-bold text-yellow-700">{results.filter(r => r.status === 'Partial').length}</div>
                            <div className="text-sm text-yellow-800">Partial</div>
                        </div>
                        <div className="bg-red-100 p-4 rounded text-center">
                            <div className="text-2xl font-bold text-red-700">{results.filter(r => r.status === 'No').length}</div>
                            <div className="text-sm text-red-800">Non-Compliant</div>
                        </div>
                        <div className="bg-gray-100 p-4 rounded text-center">
                            <div className="text-2xl font-bold text-gray-700">{results.filter(r => r.status === 'Unknown').length}</div>
                            <div className="text-sm text-gray-800">Pending/Unknown</div>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Detailed Obligations</h2>
            <div className="space-y-4">
                {results.map((r, i) => (
                    <div key={i} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                        <div className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100" onClick={() => toggleExpand(r.obligation_id)}>
                            <div>
                                <h3 className="font-medium text-lg">{r.obligation_id}</h3>
                                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold mt-1 ${
                                    r.status === 'Yes' ? 'bg-green-200 text-green-800' :
                                    r.status === 'Partial' ? 'bg-yellow-200 text-yellow-800' :
                                    r.status === 'No' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
                                }`}>
                                    {r.status} (Confidence: {r.confidence})
                                </div>
                            </div>
                            <span className="text-gray-500 text-sm">{expanded[r.obligation_id] ? 'Collapse ▲' : 'Expand ▼'}</span>
                        </div>

                        {expanded[r.obligation_id] && (
                            <div className="p-4 border-t animate-in fade-in slide-in-from-top-1">
                                <div className="mb-4">
                                    <h4 className="font-semibold text-sm text-gray-600 uppercase mb-2">Evidence Found</h4>
                                    {r.evidence && r.evidence.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-2">
                                            {r.evidence.map((ev: any, idx: number) => (
                                                <li key={idx} className="text-sm">
                                                    <span className="font-medium text-gray-900">{ev.article}</span>
                                                    <p className="text-gray-700 italic border-l-2 border-gray-300 pl-2 my-1">"{ev.quote}"</p>
                                                    <p className="text-gray-500 text-xs">- {ev.reason}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No specific evidence cited.</p>
                                    )}
                                </div>

                                {r.missing_info && r.missing_info.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-sm text-red-600 uppercase mb-2">Missing Elements</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                                            {r.missing_info.map((m: string, idx: number) => (
                                                <li key={idx}>{m}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {r.notes && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-600 uppercase mb-2">Analyst Notes</h4>
                                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{r.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
