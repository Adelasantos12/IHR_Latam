"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");

export default function ObligationPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    axios.get(`${API_URL}/obligations/${params.id}`).then((r) => setData(r.data));
  }, [params.id]);

  if (!data) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Obligación: {data.obligation.id}</h1>
      <p className="text-sm text-slate-600">{data.obligation.normative_content}</p>

      <div className="space-y-3">
        {(data.results || []).map((r: any) => (
          <div key={r.id} className="bg-white border rounded-xl p-4">
            <p><b>{r.country_id}</b> · status={r.status} · score={r.score} · confidence={r.confidence?.toFixed?.(2)}</p>
            <ul className="list-disc pl-5 mt-2 text-sm">
              {(r.evidence || []).map((e: any, idx: number) => <li key={idx}>{e.quote || "(sin cita)"}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
