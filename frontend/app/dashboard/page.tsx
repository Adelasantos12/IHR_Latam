"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Info, ExternalLink, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AnalysisResult {
    country_id: string;
    obligation_id: string;
    status: string;
    confidence: number;
}

interface Country {
    id: string;
    name: string;
}

const OBLIGATIONS = [
  { id: "IHR_Art04_NFP_Designation", label: "Art. 4", desc: "NFP Designation" },
  { id: "IHR_Art05_Core_Surveillance", label: "Art. 5", desc: "Core Surveillance" },
  { id: "IHR_Art13_Response_Capacity", label: "Art. 13", desc: "Response Capacity" },
  { id: "IHR_Art19_PoE_Designation", label: "Art. 19", desc: "PoE Designation" },
  { id: "IHR_Art21_Competent_Authorities", label: "Art. 21", desc: "Competent Authorities" },
  { id: "IHR_Art23_Health_Measures_Travellers", label: "Art. 23", desc: "Health Measures" },
  { id: "IHR_Art30_Observation", label: "Art. 30", desc: "Observation" },
  { id: "IHR_Art31_Entry_Conditions", label: "Art. 31", desc: "Entry Conditions" },
  { id: "IHR_Art32_Treatment_of_Travellers", label: "Art. 32", desc: "Traveller Rights" },
  { id: "IHR_Art33_Goods_Control", label: "Art. 33", desc: "Goods Control" },
  { id: "IHR_Art36_Vaccination_Certificates", label: "Art. 36", desc: "Vaccination Certs" },
  { id: "IHR_Art40_Charges_Travellers", label: "Art. 40", desc: "Traveller Charges" },
  { id: "IHR_Art41_Charges_Goods", label: "Art. 41", desc: "Goods Charges" },
  { id: "IHR_Art43_Additional_Measures", label: "Art. 43", desc: "Additional Measures" },
  { id: "IHR_Art44_Collaboration", label: "Art. 44", desc: "Collaboration" },
  { id: "IHR_Art45_Data_Protection", label: "Art. 45", desc: "Data Protection" },
  { id: "IHR_Art27_Affected_Conveyances", label: "Art. 27", desc: "Conveyances" },
  { id: "IHR_Art28_Ships_at_Ports", label: "Art. 28", desc: "Ships at Ports" },
  { id: "IHR_Art29_Ground_Crossings", label: "Art. 29", desc: "Ground Crossings" },
];

export default function DashboardPage() {
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedObligation, setSelectedObligation] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const resCountries = await axios.get(`${API_URL}/countries`);
            setCountries(resCountries.data);

            // Parallel fetching for detailed results (MVP approach)
            const requests = resCountries.data.map((c: Country) => axios.get(`${API_URL}/countries/${c.id}`));
            const responses = await Promise.all(requests);

            const allResults: AnalysisResult[] = [];
            responses.forEach(r => {
                allResults.push(...r.data.analysis_results);
            });
            setResults(allResults);

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Yes": return "bg-green-500 hover:bg-green-600";
            case "Partial": return "bg-yellow-400 hover:bg-yellow-500";
            case "No": return "bg-red-500 hover:bg-red-600";
            default: return "bg-gray-100 hover:bg-gray-200";
        }
    };

    const getStatusLabel = (status: string) => {
         switch (status) {
            case "Yes": return "Compliant";
            case "Partial": return "Partial";
            case "No": return "Non-Compliant";
            default: return "Unknown";
        }
    };

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Compliance Dashboard</h1>
                    <p className="text-gray-500 mt-1">Real-time status of IHR implementation across the Americas.</p>
                </div>

                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div> Compliant
                        <div className="w-2 h-2 rounded-full bg-yellow-400 ml-2"></div> Partial
                        <div className="w-2 h-2 rounded-full bg-red-500 ml-2"></div> Non-Compliant
                     </div>
                     <button
                        onClick={fetchData}
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        title="Refresh Data"
                     >
                        <RefreshCw className={clsx("w-4 h-4 text-gray-500", loading && "animate-spin")} />
                     </button>
                </div>
            </motion.div>

            {loading && countries.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white"
                >
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 pb-2">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className="p-4 bg-gray-50 border-b border-gray-100 text-left font-semibold text-gray-600 sticky left-0 z-20 min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                        Country
                                    </th>
                                    {OBLIGATIONS.map(ob => (
                                        <th
                                            key={ob.id}
                                            className="p-3 bg-gray-50 border-b border-gray-100 font-medium text-gray-500 min-w-[100px] text-center group cursor-help relative"
                                            onClick={() => setSelectedObligation(selectedObligation === ob.id ? null : ob.id)}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">{ob.label}</span>
                                                <span className="text-xs line-clamp-2 w-20 leading-tight group-hover:text-blue-600 transition-colors">{ob.desc}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {countries.map((country, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={country.id}
                                        className="group hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="p-3 border-b border-gray-50 sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] font-medium text-gray-900">
                                            <Link href={`/country/${country.id}`} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                                                {country.name}
                                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                                            </Link>
                                        </td>
                                        {OBLIGATIONS.map(ob => { // Wait, I defined OBLIGATIONS as objects, but iterating.
                                            // Need to map OBLIGATIONS array.
                                            const result = results.find(r => r.country_id === country.id && r.obligation_id === ob.id);
                                            const status = result?.status || "Unknown";
                                            return (
                                                <td key={ob.id} className="p-1 border-b border-gray-50 text-center align-middle">
                                                    <div className="flex justify-center">
                                                        <motion.div
                                                            whileHover={{ scale: 1.1 }}
                                                            className={clsx(
                                                                "w-12 h-8 rounded-md flex items-center justify-center transition-all cursor-default shadow-sm text-white text-[10px] font-bold opacity-90 hover:opacity-100",
                                                                getStatusColor(status),
                                                                status === "Unknown" && "!text-gray-400 bg-gray-100"
                                                            )}
                                                            title={`${getStatusLabel(status)} (Confidence: ${result?.confidence || 0})`}
                                                        >
                                                            {status === "Unknown" ? "-" : status.charAt(0)}
                                                        </motion.div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-2">Coverage Stats</h3>
                    <div className="text-3xl font-bold text-gray-900">{countries.length}</div>
                    <p className="text-sm text-gray-500">Countries Monitored</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-2">Analysis Depth</h3>
                    <div className="text-3xl font-bold text-gray-900">{OBLIGATIONS.length}</div>
                    <p className="text-sm text-gray-500">Obligations per Country</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-2">Total Assessments</h3>
                    <div className="text-3xl font-bold text-blue-600">{results.length}</div>
                    <p className="text-sm text-gray-500">Data Points Generated</p>
                </div>
            </div>
        </div>
    );
}

// Helper to match the map loop above
const OBLIGATION_IDS = OBLIGATIONS; // Alias for cleaner code if needed
