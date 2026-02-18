"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { COUNTRIES } from "../countries";

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

  // Bulk Upload State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkProgress, setBulkProgress] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchCountries();
    fetchReviewQueue();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await axios.get(`${API_URL}/countries`);
      if (res.data && res.data.length > 0) {
        setCountries(res.data);
      } else {
        // Fallback to local data if API returns empty
        console.warn("API returned empty country list, using fallback.");
        setCountries(COUNTRIES);
      }
    } catch (error) {
      console.error("Error fetching countries", error);
      setCountries(COUNTRIES); // Fallback on error
      setMessage("Usando lista local de países (API error).");
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

  const handleBulkUpload = async () => {
    if (!csvFile) return;
    setIsUploading(true);
    setBulkProgress("Leyendo archivo...");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      // Expect header: country_id,title,url,sector_id
      // Skip header
      const rows = lines.slice(1).filter(line => line.trim() !== "");

      let successCount = 0;
      let failCount = 0;

      for (const row of rows) {
        const cols = row.split(",");
        if (cols.length < 3) continue;

        const [c_id, t_title, t_url, t_sector] = cols.map(s => s.trim());

        // Basic validation
        if (!c_id || !t_title || !t_url) continue;

        const form = new FormData();
        form.append("country_id", c_id);
        form.append("title", t_title);
        form.append("url", t_url);
        form.append("sector_id", t_sector || "1");
        form.append("source_type", "html"); // Assume URL source
        // Dummy file needed if backend requires it? Backend model says file_path optional but endpoint has File(...) required?
        // Check backend: file: UploadFile = File(...) is required.
        // We need to send a dummy file or update backend.
        // For now, create a dummy text file with the URL.
        const dummyFile = new File([t_url], "url_reference.txt", { type: "text/plain" });
        form.append("file", dummyFile);

        try {
          await axios.post(`${API_URL}/laws`, form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          successCount++;
          setBulkProgress(`Procesando: ${successCount} ok...`);
        } catch (err) {
          console.error(`Failed row: ${row}`, err);
          failCount++;
        }
      }
      setBulkProgress(`Finalizado: ${successCount} subidos, ${failCount} fallidos.`);
      setIsUploading(false);
    };
    reader.readAsText(csvFile);
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
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Single Upload Form */}
        <form onSubmit={submitLaw} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Carga Individual</h2>
          <div className="grid grid-cols-1 gap-3">
            <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="border rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
              <option value="">Seleccionar País</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input className="border rounded-lg p-2.5" placeholder="Título de la norma" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded-lg p-2.5" type="date" value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)} />
              <input className="border rounded-lg p-2.5" type="date" value={lastAmendmentDate} onChange={(e) => setLastAmendmentDate(e.target.value)} />
            </div>
            <input className="border rounded-lg p-2.5" placeholder="URL oficial (opcional)" value={url} onChange={(e) => setUrl(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <select className="border rounded-lg p-2.5" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="es">Español</option>
                <option value="pt">Portugués</option>
                <option value="mixed">Mixto</option>
              </select>
              <input className="border rounded-lg p-2.5" type="number" min={1} max={10} placeholder="Sector ID" value={sectorId} onChange={(e) => setSectorId(e.target.value)} />
            </div>
            <input className="border rounded-lg p-2.5 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium transition-colors">Subir Ley</button>
            <button type="button" onClick={triggerAnalysis} className="flex-1 bg-gray-800 hover:bg-gray-900 text-white rounded-lg px-4 py-2 font-medium transition-colors">Analizar País</button>
          </div>
          {message && <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">{message}</p>}
        </form>

        {/* Bulk Upload Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Carga Masiva (CSV)</h2>
          <p className="text-sm text-gray-500">Sube un archivo .csv con las columnas: <code>country_id, title, url, sector_id</code></p>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
          </div>

          {csvFile && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Archivo: {csvFile.name}</p>
              <button
                onClick={handleBulkUpload}
                disabled={isUploading}
                className={`w-full rounded-lg px-4 py-2 font-medium text-white transition-colors ${isUploading ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {isUploading ? "Procesando..." : "Iniciar Carga Masiva"}
              </button>
            </div>
          )}

          {bulkProgress && (
            <div className="p-3 bg-gray-100 rounded text-sm font-mono text-gray-700 whitespace-pre-wrap">
              {bulkProgress}
            </div>
          )}
        </div>
      </div>

      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Cola de Revisión (Low Confidence)</h2>
        {reviewItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <p>No hay items pendientes de revisión.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviewItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{item.country_id}</span>
                    <span className="text-gray-400">·</span>
                    <span className="font-medium text-gray-700">{item.obligation_id}</span>
                  </div>
                  <div className="text-sm space-x-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.status === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.status}
                    </span>
                    <span className="text-gray-500">Confianza: {(item.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <button
                  onClick={() => togglePublish(item)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${item.is_published ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                >
                  {item.is_published ? "Despublicar" : "Aprobar & Publicar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
