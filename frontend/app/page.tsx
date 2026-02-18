"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart2, UploadCloud, Globe, Lock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
          <Globe className="w-4 h-4" />
          <span>IHR Compliance Monitor</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
          Analyze Global Health <br/>
          <span className="text-blue-600">Regulations with AI</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-lg mx-auto leading-relaxed">
          Automated legal analysis for International Health Regulations compliance across the Americas using advanced RAG pipelines.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4"
      >
        <Link href="/dashboard" className="group relative overflow-hidden rounded-3xl bg-white border border-gray-100 p-8 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart2 className="w-32 h-32 text-blue-600" />
          </div>
          <div className="relative z-10 flex flex-col h-full items-start text-left space-y-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Public Dashboard</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Visualize compliance status across 20 countries with interactive heatmaps and detailed evidence tracking.
              </p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
              <span>View Data</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/admin" className="group relative overflow-hidden rounded-3xl bg-gray-900 border border-gray-800 p-8 shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:shadow-gray-800/50 transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Lock className="w-32 h-32 text-gray-400" />
          </div>
          <div className="relative z-10 flex flex-col h-full items-start text-left space-y-4">
            <div className="p-3 bg-gray-800 rounded-xl text-white group-hover:bg-white group-hover:text-gray-900 transition-colors">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Admin Panel</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Securely upload legal documents (PDFs) and trigger AI-powered compliance analysis workflows.
              </p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-white font-medium group-hover:translate-x-1 transition-transform">
              <span>Access Tools</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
