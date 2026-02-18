"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

// Use environment variable or fallback to localhost
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

export default function DashboardPage() {
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);

    // Hardcoded list of obligation IDs for columns (could fetch from API)
    const OBLIGATION_IDS = [
        "IHR_Art04_NFP_Designation",
        "IHR_Art05_Core_Surveillance",
        "IHR_Art13_Response_Capacity",
        "IHR_Art19_PoE_Designation",
        "IHR_Art21_Competent_Authorities",
        "IHR_Art23_Health_Measures_Travellers",
        "IHR_Art30_Observation",
        "IHR_Art31_Entry_Conditions",
        "IHR_Art32_Treatment_of_Travellers",
        "IHR_Art33_Goods_Control",
        "IHR_Art36_Vaccination_Certificates",
        "IHR_Art40_Charges_Travellers",
        "IHR_Art41_Charges_Goods",
        "IHR_Art43_Additional_Measures",
        "IHR_Art44_Collaboration",
        "IHR_Art45_Data_Protection",
        "IHR_Art27_Affected_Conveyances",
        "IHR_Art28_Ships_at_Ports",
        "IHR_Art29_Ground_Crossings"
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resCountries, resSummary] = await Promise.all([
                    axios.get(`${API_URL}/countries`),
                    axios.get(`${API_URL}/dashboard/summary`)
                ]);
                setCountries(resCountries.data);
                // Summary endpoint returns recent results, but we might need all results for heatmap
                // Ideally, we'd have a specific endpoint for the heatmap matrix.
                // For now, let's fetch individual country details or assume summary has enough info
                // Wait, summary endpoint implementation only returns stats and recent results.
                // I should add an endpoint for the full matrix or fetch per country.
                // Fetching per country is slow.
                // Let's modify the frontend to fetch all countries' details in parallel or assume a new endpoint.

                // For this MVP, let's fetch detailed data for all countries (20 requests)
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

        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Yes": return "bg-green-500";
            case "Partial": return "bg-yellow-400";
            case "No": return "bg-red-500";
            default: return "bg-gray-200";
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Compliance Data...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Regional IHR Compliance Heatmap</h1>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2 bg-gray-100 sticky left-0 z-10">Country</th>
                            {OBLIGATION_IDS.map(obId => (
                                <th key={obId} className="border border-gray-300 p-2 bg-gray-100 text-xs rotate-45 h-32 w-8">
                                    <div className="transform rotate-45 translate-y-8 w-32 text-left">{obId.replace('IHR_', '')}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {countries.map(country => (
                            <tr key={country.id}>
                                <td className="border border-gray-300 p-2 font-medium sticky left-0 bg-white hover:bg-gray-50">
                                    <Link href={`/country/${country.id}`} className="text-blue-600 hover:underline">
                                        {country.name}
                                    </Link>
                                </td>
                                {OBLIGATION_IDS.map(obId => {
                                    const result = results.find(r => r.country_id === country.id && r.obligation_id === obId);
                                    const status = result?.status || "Unknown";
                                    return (
                                        <td key={obId} className={`border border-gray-300 p-2 text-center ${getStatusColor(status)}`} title={`${status} (Confidence: ${result?.confidence || 0})`}>
                                            <span className="sr-only">{status}</span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 flex gap-4 text-sm">
                <div className="flex items-center"><div className="w-4 h-4 bg-green-500 mr-2"></div> Yes (Fully Compliant)</div>
                <div className="flex items-center"><div className="w-4 h-4 bg-yellow-400 mr-2"></div> Partial</div>
                <div className="flex items-center"><div className="w-4 h-4 bg-red-500 mr-2"></div> No (Non-Compliant)</div>
                <div className="flex items-center"><div className="w-4 h-4 bg-gray-200 mr-2"></div> No Data / Unknown</div>
            </div>
        </div>
    );
}
