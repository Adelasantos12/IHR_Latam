"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");

interface Country {
  id: string;
  name: string;
}

interface ReviewItem {
  id: number;
  country_id: string;
  obligation_id: string;
  status: string;
  confidence: number;
  needs_review: boolean;
  is_published: boolean;
  notes?: string;
}

export default function AdminPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [title, setTitle] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [lastAmendmentDate, setLastAmendmentDate] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("es");
  const [normType, setNormType] = useState("");
  const [sectorId, setSectorId] = useState("1");
  const [sourceType, setSourceType] = useState("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCountries();
    fetchReviewQueue();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await axios.get(`${API_URL}/countries`);
      setCountries(res.data || []);
    } catch (error) {
      console.error("Error fetching countries", error);
      setCountries([]);
      setMessage("No se pudo cargar países. Configura NEXT_PUBLIC_API_URL al backend o usa mismo dominio con proxy.");
    }
  };

  const fetchReviewQueue = async () => {
    try {
      const res = await axios.get(`${API_URL}/audit/review-queue`);
      setReviewItems(res.data.items || []);
    } catch (error) {
      console.error("Error fetching review queue", error);
      setReviewItems([]);
    }
  };

  const submitLaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedCountry || !title) {
      setMessage("Completa país, título y archivo.");
      return;
    }

    const form = new FormData();
    form.append("country_id", selectedCountry);
    form.append("title", title);
    form.append("publication_date", publicationDate);
    form.append("last_amendment_date", lastAmendmentDate);
    form.append("url", url);
    form.append("language", language);
    form.append("norm_type", normType);
    form.append("sector_id", sectorId);
    form.append("source_type", sourceType);
    form.append("file", file);

    try {
      await axios.post(`${API_URL}/laws`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Ley cargada correctamente.");
    } catch (error) {
      console.error("Error uploading law", error);
      setMessage("No se pudo subir la ley. Revisa conexión backend/CORS.");
    }
  };

  const triggerAnalysis = async () => {
    if (!selectedCountry) return;
    try {
      await axios.post(`${API_URL}/analyze/${selectedCountry}`);
      setMessage("Análisis disparado.");
    } catch (error) {
      console.error("Error triggering analysis", error);
      setMessage("No se pudo disparar análisis.");
    }
  };

  const togglePublish = async (item: ReviewItem) => {
    const form = new FormData();
    form.append("is_published", String(!item.is_published));
    form.append("needs_review", String(false));
    try {
      await axios.post(`${API_URL}/audit/results/${item.id}`, form);
      fetchReviewQueue();
    } catch (error) {
      console.error("Error updating audit result", error);
      setMessage("No se pudo actualizar resultado de auditoría.");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin privado</h1>

      <form onSubmit={submitLaw} className="bg-white p-6 rounded-xl border space-y-4">
        <h2 className="text-xl font-semibold">Subir ley + metadatos</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="border rounded p-2">
            <option value="">País</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>
          <input className="border rounded p-2" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="border rounded p-2" type="date" value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)} />
          <input className="border rounded p-2" type="date" value={lastAmendmentDate} onChange={(e) => setLastAmendmentDate(e.target.value)} />
          <input className="border rounded p-2" placeholder="URL oficial" value={url} onChange={(e) => setUrl(e.target.value)} />
          <select className="border rounded p-2" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="es">ES</option>
            <option value="pt">PT</option>
            <option value="mixed">MIXED</option>
          </select>
          <input className="border rounded p-2" placeholder="Tipo de norma" value={normType} onChange={(e) => setNormType(e.target.value)} />
          <input className="border rounded p-2" type="number" min={1} max={10} value={sectorId} onChange={(e) => setSectorId(e.target.value)} />
          <select className="border rounded p-2" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            <option value="pdf">PDF</option>
            <option value="html">HTML</option>
            <option value="text">TEXT</option>
          </select>
          <input className="border rounded p-2" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">Subir ley</button>
          <button type="button" onClick={triggerAnalysis} className="bg-slate-800 text-white rounded px-4 py-2">Analizar país</button>
        </div>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>

      <section className="bg-white p-6 rounded-xl border space-y-3">
        <h2 className="text-xl font-semibold">Revisión low-confidence</h2>
        {reviewItems.length === 0 && <p className="text-sm text-slate-500">Sin pendientes.</p>}
        {reviewItems.map((item) => (
          <div key={item.id} className="border rounded p-3 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{item.country_id} · {item.obligation_id}</p>
              <p className="text-sm text-slate-600">status={item.status} · confidence={item.confidence.toFixed(2)}</p>
            </div>
            <button onClick={() => togglePublish(item)} className="rounded border px-3 py-1 text-sm">
              {item.is_published ? "Despublicar" : "Publicar"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
