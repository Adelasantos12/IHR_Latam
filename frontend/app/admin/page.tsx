"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, Download, ShieldCheck } from "lucide-react";
import { COUNTRIES } from "../countries";

// Hardcoded backend URL as fallback if env var is missing
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://petanquetraining-api.onrender.com";

type ReviewItem = {
  id: number;
  country_id: string;
  obligation_id: string;
  status: string;
  confidence: number;
  is_published: boolean;
  needs_review: boolean;
};

export default function AdminPage() {
  const [countries, setCountries] = useState(COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [title, setTitle] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [lastAmendmentDate, setLastAmendmentDate] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("es");
  const [sectorId, setSectorId] = useState("1");
  const [normType, setNormType] = useState("Law");
  const [sourceType, setSourceType] = useState("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);

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
        // Merge local names with API data if needed, or just use API
        // For now, prioritize API but if it fails we have initial state
        setCountries(res.data);
      }
    } catch (error) {
      console.warn("API returned empty/error for countries, using local fallback.", error);
      // Fallback is already set in initial state
    }
  };

  const fetchReviewQueue = async () => {
    try {
      const res = await axios.get(`${API_URL}/audit/review-queue`);
      setReviewItems(res.data.items || []);
    } catch (error) {
      console.error("Error fetching review queue", error);
    }
  };

  const submitLaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedCountry || !title) {
      setMessage("⚠️ Completa país, título y archivo.");
      return;
    }
    setLoading(true);
    setMessage("");

    const form = new FormData();
    form.append("country_id", selectedCountry);
    form.append("title", title);
    if (publicationDate) form.append("publication_date", publicationDate);
    if (lastAmendmentDate) form.append("last_amendment_date", lastAmendmentDate);
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
      setMessage("✅ Ley cargada correctamente.");
      // Reset form slightly
      setTitle("");
      setFile(null);
    } catch (error) {
      console.error("Error uploading law", error);
      setMessage("❌ No se pudo subir la ley. Revisa conexión backend.");
    } finally {
      setLoading(false);
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
      const rows = lines.slice(1).filter(line => line.trim() !== "");

      let successCount = 0;
      let failCount = 0;

      for (const row of rows) {
        const cols = row.split(",");
        if (cols.length < 3) continue;

        const [c_id, t_title, t_url, t_sector] = cols.map(s => s.trim());
        if (!c_id || !t_title || !t_url) continue;

        const form = new FormData();
        form.append("country_id", c_id);
        form.append("title", t_title);
        form.append("url", t_url);
        form.append("sector_id", t_sector || "1");
        form.append("source_type", "html");

        // Dummy file as backend requires it
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
      setBulkProgress(`🎉 Finalizado: ${successCount} subidos, ${failCount} fallidos.`);
      setIsUploading(false);
    };
    reader.readAsText(csvFile);
  };

  const triggerAnalysis = async () => {
    if (!selectedCountry) return;
    try {
      await axios.post(`${API_URL}/analyze/${selectedCountry}`);
      setMessage("🚀 Análisis disparado para " + selectedCountry);
    } catch (error) {
      console.error("Error triggering analysis", error);
      setMessage("❌ No se pudo disparar análisis.");
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
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,country_id,title,url,sector_id\nARG,Ley de Salud,https://example.com/ley.pdf,1";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_carga_masiva.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-10"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Admin Panel</h1>
            <p className="mt-2 text-lg text-gray-500">Manage legal documents and oversee compliance analysis.</p>
          </div>
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Single Upload Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-100/50 border border-gray-100 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <UploadCloud className="w-32 h-32 text-blue-600" />
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-500" />
                Upload Document
              </h2>

              <form onSubmit={submitLaw} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select Country</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="e.g. Health Act 2024"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Publication Date</label>
                      <input className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" type="date" value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amendment Date</label>
                      <input className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" type="date" value={lastAmendmentDate} onChange={(e) => setLastAmendmentDate(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source URL (Optional)</label>
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="https://..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
                        <option value="es">Español</option>
                        <option value="pt">Portugués</option>
                        <option value="en">English</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sector ID</label>
                      <input className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" type="number" min={1} max={10} value={sectorId} onChange={(e) => setSectorId(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document File (PDF)</label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3.5 font-semibold shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upload Law"}
                  </button>
                  <button
                    type="button"
                    onClick={triggerAnalysis}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-3.5 font-semibold shadow-lg shadow-gray-200 transition-all transform active:scale-95"
                  >
                    Run Analysis
                  </button>
                </div>

                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${message.includes("❌") || message.includes("⚠️") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
                  >
                    {message.includes("❌") || message.includes("⚠️") ? <AlertCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
                    {message}
                  </motion.div>
                )}
              </form>
            </div>
          </motion.div>

          {/* Bulk Upload & Review Queue Column */}
          <div className="space-y-8">
            {/* Bulk Upload */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-100/50 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Bulk Upload (CSV)</h2>
                <button onClick={downloadTemplate} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                  <Download className="w-4 h-4" /> Template
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors group cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-gray-900 font-medium">Click to upload CSV</p>
                <p className="text-sm text-gray-500 mt-1">Columns: country_id, title, url, sector_id</p>
              </div>

              {csvFile && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{csvFile.name}</span>
                    <button onClick={() => setCsvFile(null)} className="text-red-500 text-xs font-semibold hover:underline">Remove</button>
                  </div>
                  <button
                    onClick={handleBulkUpload}
                    disabled={isUploading}
                    className={`w-full rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all transform active:scale-95 ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
                  >
                    {isUploading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Processing...</span> : "Start Bulk Upload"}
                  </button>
                </div>
              )}

              {bulkProgress && (
                <div className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-xl text-xs font-mono whitespace-pre-wrap shadow-inner">
                  {bulkProgress}
                </div>
              )}
            </motion.div>

            {/* Review Queue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-100/50 border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                Review Queue
              </h2>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {reviewItems.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">No items pending review</p>
                  </div>
                ) : (
                  reviewItems.map((item) => (
                    <div key={item.id} className="group p-4 bg-white border border-gray-100 hover:border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{item.country_id}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">{item.obligation_id}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.status === 'Yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {item.status}
                            </span>
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-500 font-medium">Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePublish(item)}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${item.is_published ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        {item.is_published ? "Unpublish Result" : "Approve & Publish"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
