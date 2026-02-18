"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";

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

  useEffect(() => {
    axios.get(`${API_URL}/dashboard/summary`).then((r) => {
      setSummary(r.data);
      setResults(r.data.recent_results || []);
    });
  }, []);

  const heatmap = useMemo(() => {
    const map = new Map<string, number>();
    results.forEach((r) => map.set(`${r.country_id}-${r.obligation_id}`, r.score ?? 0));
    return map;
  }, [results]);

  const countries = useMemo(() => Array.from(new Set(results.map((r) => r.country_id))).sort(), [results]);
  const obligations = useMemo(() => Array.from(new Set(results.map((r) => r.obligation_id))).sort(), [results]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard público</h1>
        <a href={`${API_URL}/dashboard/export.csv`} className="rounded bg-emerald-600 text-white px-4 py-2">Export CSV</a>
      </div>

      {summary && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-4 bg-white">Países: <b>{summary.total_countries}</b></div>
          <div className="border rounded-xl p-4 bg-white">Leyes: <b>{summary.total_laws}</b></div>
          <div className="border rounded-xl p-4 bg-white">Cobertura sectores: {Object.entries(summary.coverage_by_sector || {}).map(([k, v]: any) => <span key={k} className="text-xs mr-2">S{k}:{String(v)}</span>)}</div>
        </div>
      )}

      <section className="bg-white border rounded-xl p-4 overflow-auto">
        <h2 className="font-semibold mb-3">Heatmap país × obligación (últimos resultados)</h2>
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2 border">País</th>
              {obligations.map((o) => <th key={o} className="p-2 border"><Link href={`/obligation/${o}`}>{o}</Link></th>)}
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => (
              <tr key={c}>
                <td className="p-2 border"><Link href={`/country/${c}`}>{c}</Link></td>
                {obligations.map((o) => {
                  const score = heatmap.get(`${c}-${o}`) ?? 0;
                  const bg = score === 1 ? "bg-green-100" : score === 0.5 ? "bg-amber-100" : "bg-red-100";
                  return <td key={o} className={`p-2 border text-center ${bg}`}>{score}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
