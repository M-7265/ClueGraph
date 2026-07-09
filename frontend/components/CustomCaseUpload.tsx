"use client";
// components/CustomCaseUpload.tsx
// Modal for uploading a custom mystery.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomMystery, CustomDocument } from "@/lib/types";

interface CustomCaseUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mystery: CustomMystery) => Promise<void>;
  isSimulationMode: boolean;
}

export default function CustomCaseUpload({ isOpen, onClose, onSubmit, isSimulationMode }: CustomCaseUploadProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<CustomDocument[]>([
    { title: "Document 1", category: "Evidence", content: "" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddDoc = () => {
    setDocuments([...documents, { title: `Document ${documents.length + 1}`, category: "Evidence", content: "" }]);
  };

  const updateDoc = (index: number, field: keyof CustomDocument, value: string) => {
    const newDocs = [...documents];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setDocuments(newDocs);
  };

  const handleRemoveDoc = (index: number) => {
    if (documents.length > 1) {
      setDocuments(documents.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSimulationMode) {
      setError("Custom mysteries require the backend to run with SIMULATION_MODE=false and Ollama running.");
      return;
    }
    if (!title || !query || documents.some(d => !d.title || !d.content)) {
      setError("Please fill out all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ title, description, query, documents });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-lg font-bold font-mono text-white">Upload Custom Case File</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 font-mono text-sm">
            {isSimulationMode && (
              <div className="mb-6 p-4 bg-red-950/40 border border-red-800 rounded-lg text-red-400">
                ⚠️ <strong>Warning:</strong> The backend is currently running in SIMULATION_MODE. 
                Custom case files cannot be processed because Ollama is bypassed. 
                Please restart the backend with <code>SIMULATION_MODE=false</code> to use this feature.
              </div>
            )}

            <form id="custom-case-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 mb-1">Mystery Title</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. The Missing Cookies"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-red-500 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Description</label>
                  <input value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of the scenario"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-red-500 outline-none" />
                </div>
                <div>
                  <label className="block text-amber-400 mb-1 font-bold">The Ultimate Question</label>
                  <input required value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="e.g. Who stole the cookies from the jar?"
                    className="w-full bg-slate-950 border border-amber-700 rounded p-2 text-white focus:border-amber-500 outline-none" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-300 font-bold">Case Documents ({documents.length})</h3>
                  <button type="button" onClick={handleAddDoc} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-slate-300 transition-colors">
                    + Add Document
                  </button>
                </div>

                <div className="space-y-4">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-3 relative">
                      {documents.length > 1 && (
                        <button type="button" onClick={() => handleRemoveDoc(idx)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400">✕</button>
                      )}
                      
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-slate-500 text-xs mb-1">Document Title</label>
                          <input required value={doc.title} onChange={e => updateDoc(idx, "title", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-1.5 text-slate-200 text-xs outline-none" />
                        </div>
                        <div className="w-1/3">
                          <label className="block text-slate-500 text-xs mb-1">Category</label>
                          <select value={doc.category} onChange={e => updateDoc(idx, "category", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-1.5 text-slate-200 text-xs outline-none">
                            <option value="Evidence">Evidence</option>
                            <option value="Testimony">Testimony</option>
                            <option value="Records">Records</option>
                            <option value="Physical Evidence">Physical Evidence</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-slate-500 text-xs mb-1">Content (The Clues)</label>
                        <textarea required value={doc.content} onChange={e => updateDoc(idx, "content", e.target.value)}
                          rows={3}
                          className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-200 text-xs outline-none resize-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <div className="text-red-400 text-xs font-mono">{error}</div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded text-slate-400 hover:text-white font-mono text-sm">Cancel</button>
              <button 
                form="custom-case-form" 
                type="submit" 
                disabled={isSubmitting || isSimulationMode}
                className="bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2 rounded font-bold font-mono text-sm uppercase tracking-widest transition-colors"
              >
                {isSubmitting ? "Uploading..." : "Upload Case File"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
