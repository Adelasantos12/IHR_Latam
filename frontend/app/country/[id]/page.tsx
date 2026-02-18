"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");

export default function CountryPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    axios.get(`${API_URL}/countries/${params.id}`).then((r) => setData(r.data));
  }, [params.id]);

  const sectorCoverage = useMemo(() => {
    const sectors = new Set<number>();
    (data?.laws || []).forEach((l: any) => {
      if (l.sector_id) sectors.add(l.sector_id);
    });
    return sectors;
  }, [data]);

  if (!data) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{data.country.name} ({data.country.id})</h1>

      <section className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold">Autoridad sanitaria</h2>
        {data.authority ? (
          <p>{data.authority.authority_name} · <a className="text-blue-600" href={data.authority.source_url} target="_blank">link oficial</a></p>
        ) : <p className="text-sm text-slate-500">Sin autoridad cargada.</p>}
      </section>

      <section className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-2">Leyes analizadas por sector</h2>
        <p className="text-sm">Cobertura sectores (1-10): {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => <span key={s} className={`mr-2 ${sectorCoverage.has(s) ? 'text-emerald-700' : 'text-slate-400'}`}>{s}</span>)}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {(data.laws || []).map((law: any) => (
            <li key={law.id} className="border rounded p-2">
              <b>{law.title}</b> · sector {law.sector_id || "N/A"} · {law.norm_type || "N/A"}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-2">Resultados por obligación</h2>
        <div className="space-y-3">
          {(data.analysis_results || []).map((r: any) => (
            <div key={r.id} className="border rounded p-3">
              <p><b>{r.obligation_id}</b> · status={r.status} · score={r.score} · confidence={r.confidence?.toFixed?.(2)}</p>
              <details className="mt-2">
                <summary className="cursor-pointer">Ver evidencia</summary>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {(r.evidence || []).map((e: any, idx: number) => <li key={idx}>{e.quote || "(sin cita)"}</li>)}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
