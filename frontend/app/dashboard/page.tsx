"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart2, Globe, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { COUNTRIES } from "../countries";

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");

type Result = {
  id: number;
  country_id: string;
  obligation_id: string;
  status: string;
  score: number;
  confidence: number;
  evidence: Array<{ quote?: string }>;
  is_published: boolean;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/dashboard/summary`)
      .then((r) => {
        setSummary(r.data);
        setResults(r.data.recent_results || []);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard summary", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Calculate overall status per country based on results
  const countryStatus = useMemo(() => {
    const map = new Map<string, { total: number, compliant: number, partial: number, noncompliant: number }>();

    // Initialize for all countries
    COUNTRIES.forEach(c => {
      map.set(c.id, { total: 0, compliant: 0, partial: 0, noncompliant: 0 });
    });

    results.forEach((r) => {
      const current = map.get(r.country_id);
      if (current) {
        current.total++;
        if (r.status === "Yes") current.compliant++;
        else if (r.status === "Partial") current.partial++;
        else if (r.status === "No") current.noncompliant++;
      }
    });
    return map;
  }, [results]);

  const getStatusBadge = (stats: { total: number, compliant: number, partial: number, noncompliant: number }) => {
    if (stats.total === 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium"><Clock className="w-3 h-3" /> Pending Analysis</span>;

    const complianceRate = stats.compliant / stats.total;
    if (complianceRate >= 0.8) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium"><CheckCircle className="w-3 h-3" /> High Compliance</span>;
    if (complianceRate >= 0.5) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium"><AlertCircle className="w-3 h-3" /> Partial Compliance</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium"><AlertCircle className="w-3 h-3" /> Needs Attention</span>;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Regional Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time IHR compliance monitoring across the Americas</p>
        </div>
        <a
          href={`${API_URL}/dashboard/export.csv`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white px-5 py-2.5 hover:bg-emerald-700 transition-colors shadow-sm font-medium"
        >
          <BarChart2 className="w-4 h-4" />
          Export Data (CSV)
        </a>
      </div>

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-500 mb-1">Monitored Countries</div>
            <div className="text-4xl font-bold text-gray-900">{summary.total_countries}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-500 mb-1">Analyzed Laws</div>
            <div className="text-4xl font-bold text-blue-600">{summary.total_laws}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-500 mb-1">Sector Coverage</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(summary.coverage_by_sector || {}).map(([k, v]: any) => (
                v > 0 && (
                  <span key={k} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                    S{k}
                  </span>
                )
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Country Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COUNTRIES.map((country, idx) => {
            const stats = countryStatus.get(country.id) || { total: 0, compliant: 0, partial: 0, noncompliant: 0 };

            return (
              <motion.div
                key={country.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={`/country/${country.id}`} className="group block h-full bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50/50 transition-all duration-300 relative overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {country.name}
                      </h3>
                      <div className="text-xs text-gray-400 font-mono mt-1">{country.id}</div>
                    </div>
                    {getStatusBadge(stats)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Evaluated Obligations</span>
                      <span className="font-medium text-gray-900">{stats.total}</span>
                    </div>

                    {stats.total > 0 && (
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${(stats.compliant / stats.total) * 100}%` }} className="bg-emerald-500 h-full" />
                        <div style={{ width: `${(stats.partial / stats.total) * 100}%` }} className="bg-amber-400 h-full" />
                        <div style={{ width: `${(stats.noncompliant / stats.total) * 100}%` }} className="bg-red-400 h-full" />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                    View Analysis <ArrowRight className="ml-1 w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
