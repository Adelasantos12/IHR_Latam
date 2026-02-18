"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';

// Use environment variable or fallback to localhost
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
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await axios.get(`${API_URL}/countries`);
      setCountries(res.data);
    } catch (err) {
      console.error("Error fetching countries:", err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry || !file || !lawTitle) {
      setMessage("Please fill all fields");
      return;
    }

    const formData = new FormData();
    formData.append("country_id", selectedCountry);
    formData.append("title", lawTitle);
    formData.append("publication_date", lawDate);
    formData.append("file", file);

    setLoading(true);
    try {
      await axios.post(`${API_URL}/laws`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessage("Law uploaded successfully!");
      setLawTitle('');
      setFile(null);
    } catch (err) {
      setMessage("Error uploading law.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedCountry) {
        setMessage("Select a country first");
        return;
    }
    setLoading(true);
    try {
        await axios.post(`${API_URL}/analyze/${selectedCountry}`);
        setMessage("Analysis triggered!");
    } catch (err) {
        setMessage("Error triggering analysis");
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <div className="bg-white p-6 rounded shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New Law</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Select Country...</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Law Title</label>
            <input
              type="text"
              value={lawTitle}
              onChange={(e) => setLawTitle(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="e.g. Health Code 2020"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Publication Date</label>
            <input
              type="date"
              value={lawDate}
              onChange={(e) => setLawDate(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">PDF File</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border rounded p-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Uploading..." : "Upload Law"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="flex gap-4 items-center">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="border rounded p-2"
            >
              <option value="">Select Country to Analyze...</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
                onClick={handleAnalyze}
                disabled={loading || !selectedCountry}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
                {loading ? "Processing..." : "Trigger Compliance Analysis"}
            </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 p-4 bg-gray-100 border rounded text-center">
            {message}
        </div>
      )}
    </div>
  );
}
