"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import Select from '../ui/Select';
import clsx from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Country {
  id: string;
  name: string;
}

export default function AdminPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [lawTitle, setLawTitle] = useState('');
  const [lawDate, setLawDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await axios.get(`${API_URL}/countries`);
      setCountries(res.data);
    } catch (err) {
      console.error("Error fetching countries:", err);
      setMessage({ type: 'error', text: "Failed to load countries. Is the backend running?" });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry || !file || !lawTitle) {
      setMessage({ type: 'error', text: "Please fill all fields" });
      return;
    }

    const formData = new FormData();
    formData.append("country_id", selectedCountry);
    formData.append("title", lawTitle);
    formData.append("publication_date", lawDate);
    formData.append("file", file);

    setLoading(true);
    setMessage(null);
    try {
      await axios.post(`${API_URL}/laws`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessage({ type: 'success', text: "Law uploaded successfully!" });
      setLawTitle('');
      setFile(null);
      // Reset file input value manually if needed
      (document.getElementById('file-upload') as HTMLInputElement).value = '';
    } catch (err) {
      setMessage({ type: 'error', text: "Error uploading law. Check console for details." });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedCountry) {
        setMessage({ type: 'error', text: "Select a country first" });
        return;
    }
    setLoading(true);
    setMessage(null);
    try {
        await axios.post(`${API_URL}/analyze/${selectedCountry}`);
        setMessage({ type: 'success', text: "Compliance analysis triggered! Results will appear shortly." });
    } catch (err) {
        setMessage({ type: 'error', text: "Error triggering analysis" });
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Panel</h1>
          <p className="text-gray-500 mt-2">Manage legal documents and trigger compliance checks.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Upload New Law</h2>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Country</label>
                <Select
                    options={countries.map(c => ({ value: c.id, label: c.name }))}
                    value={selectedCountry}
                    onChange={setSelectedCountry}
                    placeholder="Select Country..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Publication Date</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={lawDate}
                      onChange={(e) => setLawDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Law Title</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={lawTitle}
                  onChange={(e) => setLawTitle(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Health Code 2020"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">PDF File</label>
              <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer group">
                 <input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <div className="pointer-events-none flex flex-col items-center gap-2">
                    <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <p className="text-sm text-gray-500 font-medium">
                        {file ? file.name : "Click to select or drag PDF here"}
                    </p>
                    <p className="text-xs text-gray-400">PDF up to 10MB</p>
                 </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    {loading ? "Processing..." : "Upload Law"}
                </button>
            </div>
          </form>
        </motion.div>

        {/* Actions Section */}
        <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Run Analysis</h2>
                </div>

                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Trigger the AI analysis pipeline for a specific country. This will process all uploaded laws against the 19 IHR obligations.
                </p>

                <div className="space-y-4">
                    <Select
                        options={countries.map(c => ({ value: c.id, label: c.name }))}
                        value={selectedCountry}
                        onChange={setSelectedCountry}
                        placeholder="Select Country to Analyze..."
                    />

                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !selectedCountry}
                        className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg font-medium hover:bg-black disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Start Analysis"
                        )}
                    </button>
                </div>
            </motion.div>

            {/* Status Message */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                        "rounded-xl p-4 border flex items-start gap-3",
                        message.type === 'success' ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
                    )}
                >
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                    <div>
                        <p className="font-medium text-sm">{message.type === 'success' ? "Success" : "Error"}</p>
                        <p className="text-sm opacity-90">{message.text}</p>
                    </div>
                </motion.div>
            )}
        </div>
      </div>
    </div>
  );
}
