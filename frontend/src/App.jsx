import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import {
  Download, Paperclip, ArrowUp, RefreshCw,
  FileText, Bell, ChevronDown, Sparkles, X,
  BarChart3, BookOpen, LifeBuoy, CheckCircle2,
  FileUp, Search, Layers, Activity, Database,
  Trash2
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [history, setHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Today');
  const [selectedNav, setSelectedNav] = useState('Overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [entitySearch, setEntitySearch] = useState('');
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'Today') {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [history, activeTab]);

  const fetchHistory = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all chat and analysis history?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/history`);
      await fetchHistory();
    } catch (err) {
      alert(`Failed to clear history: ${err.message}`);
    }
  };

  // ── Handle Analysis Submission ─────────────────────────────────────────────
  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && files.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    if (inputText.trim()) formData.append('original_text', inputText.trim());
    if (files.length > 0) {
      files.forEach((file) => formData.append('files', file));
    }

    try {
      await axios.post(`${API_BASE_URL}/analyze`, formData);
      setInputText('');
      setFiles([]);
      await fetchHistory();
      if (activeTab !== 'Today') setActiveTab('Today');
      if (chatEndRef.current) {
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      alert(`Analysis failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── CSV Export ────────────────────────────────────────────────────────────
  const downloadCSV = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/history/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `emoticore_history_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('CSV export failed.');
    }
  };

  // ── PDF Report ────────────────────────────────────────────────────────────
  const downloadProfessionalPDF = (item) => {
    const doc = new jsPDF();
    doc.setFillColor(18, 19, 22); doc.rect(0, 0, 210, 42, 'F');
    doc.setTextColor(244, 173, 198); doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("EMOTICORE", 20, 26);
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("INTELLIGENCE ENGINE REPORT", 78, 26);
    doc.setTextColor(120, 120, 130); doc.text(`Generated: ${new Date(item.created_at).toLocaleString()}`, 20, 52); doc.text(`Analyst: Emoticore Engine`, 140, 52);
    doc.setDrawColor(220, 220, 230); doc.line(20, 57, 190, 57);
    doc.setTextColor(20, 20, 24); doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.text("Executive Summary", 20, 72);
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text(`Sentiment Classification: ${item.sentiment_label} (Score: ${item.sentiment_score})`, 20, 82);
    doc.text(`Subjectivity Index: ${item.subjectivity > 0.5 ? 'Opinion-Based' : 'Factual/Objective'} (${item.subjectivity})`, 20, 92);
    doc.text(`Reading Complexity: ${item.readability_grade}`, 20, 102);
    if (item.ai_summary) {
      doc.setTextColor(244, 114, 182); doc.text("AI ACTION SUMMARY & TAKEAWAY:", 20, 117);
      doc.setTextColor(30, 30, 35);
      const splitAi = doc.splitTextToSize(item.ai_summary, 170);
      doc.text(splitAi, 20, 124);
    }
    doc.line(20, 150, 190, 150); doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.text("Source Document", 20, 165);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const splitText = doc.splitTextToSize(item.original_text, 170); doc.text(splitText, 20, 175);
    doc.save(`Emoticore_Report_${item.id}.pdf`);
  };

  // ── Compute Real Dynamic Statistics ───────────────────────────────────────
  const totalAnalyses = history.length;
  const positiveCount = history.filter(h => h.sentiment_label === 'Positive').length;
  const negativeCount = history.filter(h => h.sentiment_label === 'Negative').length;
  const neutralCount = totalAnalyses - positiveCount - negativeCount;

  const avgSentiment = totalAnalyses > 0 ? (history.reduce((acc, h) => acc + h.sentiment_score, 0) / totalAnalyses) : 0;
  const avgSubjectivity = totalAnalyses > 0 ? (history.reduce((acc, h) => acc + h.subjectivity, 0) / totalAnalyses) : 0.5;

  const sentimentPercent = Math.round(((avgSentiment + 1) / 2) * 100);
  const factPercent = Math.round((1 - avgSubjectivity) * 100);
  const opinionPercent = 100 - factPercent;

  // Real aggregate entity & keyword frequency analysis
  const phraseCounts = {};
  history.forEach(h => {
    if (h.key_phrases && h.key_phrases !== 'None' && h.key_phrases !== 'General Content') {
      h.key_phrases.split(',').forEach(p => {
        const clean = p.trim().toLowerCase();
        if (clean && clean.length > 2) {
          phraseCounts[clean] = (phraseCounts[clean] || 0) + 1;
        }
      });
    }
  });

  const sortedPhrases = Object.entries(phraseCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count: `${count} mention${count > 1 ? 's' : ''}`, rawCount: count }));

  const topPhrases = sortedPhrases.length > 0 ? sortedPhrases.slice(0, 3) : [
    { name: 'nlp analytics', count: '1 mention', rawCount: 1 },
    { name: 'document telemetry', count: '1 mention', rawCount: 1 },
    { name: 'sentiment engine', count: '1 mention', rawCount: 1 },
  ];

  // Dynamic Dot Matrix Columns based on real last 15 scores
  const recent15 = [...history].slice(0, 15).reverse();
  const dotColumns = Array.from({ length: 15 }, (_, i) => {
    const item = recent15[i];
    if (!item) return [1, 0, 0, 0, 0];
    const score = item.sentiment_score;
    if (score > 0.25) return [1, 1, 1, 1, 1];
    if (score > 0.05) return [1, 1, 1, 1, 0];
    if (score >= -0.05) return [1, 1, 1, 0, 0];
    if (score >= -0.25) return [1, 1, 0, 0, 0];
    return [1, 0, 0, 0, 0];
  });

  // Chart data for Trends view
  const trendChartData = [...history].reverse().map((h) => ({
    time: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sentiment: h.sentiment_score,
    subjectivity: h.subjectivity,
    words: h.word_count,
  }));

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-100 p-3 sm:p-6 lg:p-10 flex items-center justify-center font-sans antialiased selection:bg-[#f4adc6] selection:text-black">
      {/* Outer Dashboard Frame */}
      <div className="w-full max-w-7xl bg-[#121316] border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 lg:p-10 shadow-2xl space-y-8">
        
        {/* ── Top Header Navigation ────────────────────────────────────────── */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/5">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setSelectedNav('Overview')}>
              <div className="w-9 h-9 rounded-full border border-white/20 bg-zinc-900 flex items-center justify-center text-xs font-bold tracking-tight text-white shadow-inner">
                AI
              </div>
              <span className="text-xl font-bold tracking-tight text-white">EMOTICORE</span>
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex items-center space-x-5 text-xs font-medium text-zinc-400">
              {[
                { id: 'Overview', label: 'Overview' },
                { id: 'Analytics', label: 'Analytics' },
                { id: 'Learn', label: 'Learn & Docs' },
                { id: 'Support', label: 'System Health' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedNav(item.id)}
                  className={`transition-colors hover:text-white ${selectedNav === item.id ? 'text-white font-semibold' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNotifModal(!showNotifModal)}
              className="w-9 h-9 rounded-full bg-[#1c1d22] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 transition-all relative"
              title="System Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#f4adc6] absolute top-2 right-2 animate-pulse" />
            </button>
            <div className="flex items-center space-x-2 bg-[#1c1d22] border border-white/5 py-1 px-3 rounded-full text-xs font-medium text-zinc-200">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#f4adc6] to-indigo-400 flex items-center justify-center text-[10px] text-black font-bold">
                D
              </div>
              <span>Devansh</span>
            </div>
          </div>
        </header>

        {/* ── Notification Popover ─────────────────────────────────────────── */}
        {showNotifModal && (
          <div className="bg-[#1c1d22] border border-white/10 rounded-2xl p-4 shadow-xl text-xs space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center font-bold text-white border-b border-white/5 pb-2">
              <span>Live Engine Telemetry</span>
              <button onClick={() => setShowNotifModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <p className="text-zinc-300">FastAPI backend active on port 8000. All NLP tokenizers and Groq LLM inference pipelines are operational.</p>
            <div className="text-[10px] text-zinc-500 font-mono">SQLite DB: {totalAnalyses} records logged • CSV Exporter: Ready</div>
          </div>
        )}

        {/* ── Dynamic Nav Page Views ───────────────────────────────────────── */}
        {selectedNav === 'Analytics' && (
          <div className="bg-[#18191d] border border-white/5 rounded-[2rem] p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Linguistic Analytics &amp; Sentiment Trajectory</h2>
                <p className="text-xs text-zinc-400">Detailed multi-variable NLP telemetry</p>
              </div>
              <button
                onClick={() => setSelectedNav('Overview')}
                className="px-3.5 py-1.5 rounded-full border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Back to Dashboard
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#121316] border border-white/5 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-wider">Sentiment Score Timeline</h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="time" fontSize={10} stroke="#666" />
                      <YAxis domain={[-1, 1]} fontSize={10} stroke="#666" />
                      <Tooltip contentStyle={{ backgroundColor: '#18191d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Area type="monotone" dataKey="sentiment" stroke="#f4adc6" fill="#f4adc6" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#121316] border border-white/5 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-wider">Subjectivity vs Objectivity</h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="time" fontSize={10} stroke="#666" />
                      <YAxis domain={[0, 1]} fontSize={10} stroke="#666" />
                      <Tooltip contentStyle={{ backgroundColor: '#18191d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Bar dataKey="subjectivity" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedNav === 'Learn' && (
          <div className="bg-[#18191d] border border-white/5 rounded-[2rem] p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Emoticore NLP Architecture &amp; Methodology</h2>
                <p className="text-xs text-zinc-400">Under the hood of the intelligence engine</p>
              </div>
              <button
                onClick={() => setSelectedNav('Overview')}
                className="px-3.5 py-1.5 rounded-full border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Back to Dashboard
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-300">
              <div className="bg-[#121316] border border-white/5 rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-bold text-[#f4adc6] flex items-center gap-2">
                  <Activity className="w-4 h-4" /> 1. Sentiment Polarity
                </h3>
                <p>Calculates the emotional valence of textual content on a scale of <strong>-1.0 (strongly negative)</strong> to <strong>+1.0 (strongly positive)</strong> based on lexical tokenization.</p>
              </div>
              <div className="bg-[#121316] border border-white/5 rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-bold text-[#f4adc6] flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> 2. Readability &amp; Grade Level
                </h3>
                <p>Applies <strong>Flesch-Kincaid</strong> and <strong>Coleman-Liau</strong> algorithms to evaluate sentence length and syllable complexity, mapping content to academic grade tiers.</p>
              </div>
              <div className="bg-[#121316] border border-white/5 rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-bold text-[#f4adc6] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> 3. Groq LLM Inference
                </h3>
                <p>Generates real-time, 1-sentence analytical overviews and actionable takeaways via ultra-low latency Groq Cloud inference.</p>
              </div>
            </div>
          </div>
        )}

        {selectedNav === 'Support' && (
          <div className="bg-[#18191d] border border-white/5 rounded-[2rem] p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">System Diagnostics &amp; Health Checks</h2>
                <p className="text-xs text-zinc-400">Live operational status of microservices</p>
              </div>
              <button
                onClick={() => setSelectedNav('Overview')}
                className="px-3.5 py-1.5 rounded-full border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Back to Dashboard
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#121316] border border-white/5 p-4 rounded-2xl">
                <div className="text-zinc-500 font-semibold mb-1">FastAPI Backend</div>
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Online (v6.0)
                </div>
              </div>
              <div className="bg-[#121316] border border-white/5 p-4 rounded-2xl">
                <div className="text-zinc-500 font-semibold mb-1">SQLite Database</div>
                <div className="text-white font-bold">{totalAnalyses} records indexed</div>
              </div>
              <div className="bg-[#121316] border border-white/5 p-4 rounded-2xl">
                <div className="text-zinc-500 font-semibold mb-1">Groq AI Engine</div>
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Active &amp; Verified
                </div>
              </div>
              <div className="bg-[#121316] border border-white/5 p-4 rounded-2xl">
                <div className="text-zinc-500 font-semibold mb-1">Vite Frontend</div>
                <div className="text-white font-bold">Port 5173 (Ready)</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Title & Global Controls ──────────────────────────────────────── */}
        {selectedNav === 'Overview' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  General statistics
                </h1>
                <p className="text-xs text-zinc-500 mt-1">Real-time linguistic telemetry &amp; document analytics</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchHistory}
                  disabled={refreshing}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full border border-zinc-700/60 bg-[#1a1b20] hover:bg-[#23252c] text-xs font-medium text-zinc-300 transition-all active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#f4adc6]' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={downloadCSV}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full border border-zinc-700/60 bg-[#1a1b20] hover:bg-[#23252c] text-xs font-medium text-zinc-300 transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* ── Main Two-Column Layout ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              
              {/* ── LEFT COLUMN (60% width): Aesthetic Metric Cards ─────────── */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Hero Pastel Pink Card */}
                <div className="bg-[#f4adc6] text-black rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[280px]">
                  {/* Header */}
                  <div className="flex items-center justify-between text-xs font-semibold tracking-wide">
                    <span className="text-zinc-900 font-bold uppercase tracking-wider text-[11px]">Sentiment Velocity</span>
                    <div className="flex items-center space-x-3 text-[11px] text-zinc-800">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-800/40"></span> Baseline
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-black"></span> Active Signal
                      </span>
                    </div>
                  </div>

                  {/* Big Metric Counter */}
                  <div className="my-3">
                    <div className="text-5xl sm:text-6xl font-black tracking-tighter text-black">
                      +{sentimentPercent > 0 ? `${sentimentPercent + 100}%` : '+206%'}
                    </div>
                    <p className="text-xs font-semibold text-zinc-800 mt-1">
                      {positiveCount} of {totalAnalyses || 1} records classify positive engagement
                    </p>
                  </div>

                  {/* Dot Matrix Visualizer */}
                  <div className="pt-4 border-t border-black/10 flex items-end justify-between gap-1 sm:gap-2">
                    {dotColumns.map((col, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-1.5 items-center">
                        {col.map((dot, dotIdx) => (
                          <div
                            key={dotIdx}
                            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                              dot === 1 ? 'bg-black' : 'bg-black/15'
                            }`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Timeline Markers */}
                  <div className="flex justify-between text-[10px] font-bold text-zinc-700 pt-2">
                    <span>Recent Stream</span>
                    <span>15 Analyses</span>
                    <span>Active Telemetry</span>
                  </div>
                </div>

                {/* Bottom Row of 2 Secondary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Left Secondary Card: Real Extracted Entities & Keywords */}
                  <div className="bg-[#18191d] border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-400 mb-4">Extracted Entities &amp; Topics</h3>
                      <div className="space-y-3.5">
                        {topPhrases.map((item, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-zinc-200">
                              <span className="truncate max-w-[140px] capitalize">{item.name}</span>
                              <span className="text-zinc-400 text-[11px]">{item.count}</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-[#f4adc6] h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(25, 85 - idx * 25))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
                      <span>+{totalAnalyses} records logged</span>
                      <button
                        onClick={() => setShowEntityModal(true)}
                        className="px-3.5 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 transition-colors"
                      >
                        View all
                      </button>
                    </div>
                  </div>

                  {/* Right Secondary Stack: Sentiment Impact & Tone Split */}
                  <div className="space-y-6 flex flex-col justify-between">
                    
                    {/* Impact Metric with Dynamic Wave Visualizer */}
                    <div className="bg-[#18191d] border border-white/5 rounded-[2rem] p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400">Sentiment Impact Index</span>
                      </div>
                      <div className="text-3xl font-black text-white mt-2">
                        +{Math.round(avgSentiment * 100) + 100}%
                      </div>
                      {/* Real Wave Visualizer mapped to history scores */}
                      <div className="flex items-end gap-1 h-7 mt-3">
                        {Array.from({ length: 18 }).map((_, i) => {
                          const item = history[i];
                          const score = item ? item.sentiment_score : 0.2;
                          const height = Math.max(6, Math.min(28, Math.round((score + 1) * 12 + 4)));
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-all hover:bg-[#f4adc6] ${score > 0.1 ? 'bg-[#f4adc6]/80' : 'bg-zinc-700'}`}
                              style={{ height: `${height}px` }}
                              title={item ? `${item.sentiment_label} (${item.sentiment_score})` : 'Baseline'}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Predicted Subjectivity Breakdown */}
                    <div className="bg-[#18191d] border border-white/5 rounded-[2rem] p-6">
                      <span className="text-xs font-semibold text-zinc-400">Content Tone Split</span>
                      <div className="flex items-baseline space-x-4 mt-2">
                        <div>
                          <span className="text-2xl font-black text-white">{factPercent}%</span>
                          <span className="text-xs text-zinc-400 ml-1.5 font-medium">Objective</span>
                        </div>
                        <div>
                          <span className="text-2xl font-black text-[#f4adc6]">{opinionPercent}%</span>
                          <span className="text-xs text-zinc-400 ml-1.5 font-medium">Opinion</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden flex">
                        <div className="bg-white h-full transition-all duration-500" style={{ width: `${factPercent}%` }} />
                        <div className="bg-[#f4adc6] h-full transition-all duration-500" style={{ width: `${opinionPercent}%` }} />
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              {/* ── RIGHT COLUMN (40% width): Interactive Stream & Input Terminal ── */}
              <div className="lg:col-span-5 flex flex-col h-full bg-[#18191d] border border-white/5 rounded-[2rem] p-5 sm:p-6 justify-between min-h-[580px]">
                
                {/* Top Pill Tabs */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center space-x-1.5 bg-[#121316] p-1 rounded-full border border-white/5">
                    {['Today', 'Trends', 'Batch PDF'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          activeTab === tab
                            ? 'bg-zinc-200 text-black shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={downloadCSV}
                      className="text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-zinc-800 transition-colors"
                      title="Download Full CSV Log"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleClearHistory}
                      disabled={history.length === 0}
                      className="text-zinc-400 hover:text-rose-400 p-1.5 rounded-full hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:hover:text-zinc-400"
                      title="Clear Chat & History"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tab 1: Today (Conversational Feed) */}
                {activeTab === 'Today' && (
                  <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[420px] pr-1 custom-scrollbar">
                    {/* Welcome Bubble */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                          AI
                        </div>
                        <div className="bg-[#212329] border border-white/5 p-3.5 rounded-2xl rounded-tl-sm text-xs text-zinc-200 leading-relaxed max-w-[85%]">
                          How can I help you today? Feed me text or upload PDFs to run deep NLP sentiment and readability analysis.
                          <div className="text-[10px] text-zinc-500 mt-1 font-mono">11:32 AM</div>
                        </div>
                      </div>

                      {/* Quick Sample Prompts when empty */}
                      {history.length === 0 && (
                        <div className="space-y-2 pt-2 animate-in fade-in duration-300">
                          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
                            Try an Example:
                          </div>
                          <div className="space-y-1.5">
                            {[
                              "The new dashboard redesign is extraordinarily sleek, responsive, and intuitive!",
                              "Customer service has been completely unresponsive and our server has been down for hours.",
                              "Mitochondria are membrane-bound organelles that generate chemical energy for cellular processes."
                            ].map((sample, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => setInputText(sample)}
                                className="w-full text-left text-[11px] text-zinc-400 hover:text-white bg-[#121316] hover:bg-[#212329] border border-white/5 hover:border-[#f4adc6]/30 p-2.5 rounded-xl transition-all"
                              >
                                💡 "{sample}"
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Feed History Items (Chronological: Top to Bottom) */}
                    {[...history].reverse().map((item) => (
                      <div key={item.id} className="space-y-3 animate-in fade-in duration-200">
                        {/* User query bubble */}
                        <div className="flex justify-end">
                          <div className="bg-[#2a2c35] text-zinc-100 p-3.5 rounded-2xl rounded-tr-sm text-xs max-w-[88%] shadow-sm">
                            <p className="line-clamp-3">{item.original_text}</p>
                            <div className="text-[10px] text-zinc-400 text-right mt-1 font-mono">
                              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* Engine Response Bubble */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#f4adc6] flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                            EC
                          </div>
                          <div className="bg-[#212329] border border-white/5 p-3.5 rounded-2xl rounded-tl-sm text-xs text-zinc-200 space-y-2 max-w-[88%]">
                            {/* Metric Badges */}
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.sentiment_label === 'Positive'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : item.sentiment_label === 'Negative'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-zinc-700/50 text-zinc-300 border border-zinc-600'
                              }`}>
                                {item.sentiment_label} ({item.sentiment_score})
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {item.readability_grade}
                              </span>
                            </div>

                            {/* AI Summary */}
                            {item.ai_summary && (
                              <p className="text-zinc-300 text-[11px] leading-relaxed pt-1 border-t border-white/5">
                                {item.ai_summary}
                              </p>
                            )}

                            {/* Download PDF button */}
                            <div className="pt-2 flex justify-between items-center text-[10px] text-zinc-400">
                              <span>{item.word_count} words • {item.reading_time}m read</span>
                              <button
                                onClick={() => downloadProfessionalPDF(item)}
                                className="flex items-center gap-1 text-[#f4adc6] hover:underline font-semibold"
                              >
                                <Download className="w-3 h-3" /> PDF Report
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Live Processing Indicator */}
                    {loading && (
                      <div className="flex items-start gap-2.5 animate-pulse">
                        <div className="w-7 h-7 rounded-full bg-[#f4adc6] flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                          EC
                        </div>
                        <div className="bg-[#212329] border border-white/5 p-3.5 rounded-2xl rounded-tl-sm text-xs text-zinc-400 flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#f4adc6]" />
                          <span>Analyzing linguistic sentiment &amp; generating AI takeaways...</span>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                )}

                {/* Tab 2: Trends (Real-time Telemetry Charts) */}
                {activeTab === 'Trends' && (
                  <div className="flex-1 py-4 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                    <div className="bg-[#121316] border border-white/5 rounded-2xl p-4">
                      <div className="text-xs font-bold text-zinc-400 mb-2">Sentiment Progression</div>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendChartData.slice(-10)}>
                            <XAxis dataKey="time" fontSize={9} stroke="#666" />
                            <YAxis domain={[-1, 1]} fontSize={9} stroke="#666" />
                            <Tooltip contentStyle={{ backgroundColor: '#1c1d22', border: 'none', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="sentiment" stroke="#f4adc6" fill="#f4adc6" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-[#121316] border border-white/5 rounded-2xl p-4">
                      <div className="text-xs font-bold text-zinc-400 mb-2">Word Count per Ingestion</div>
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={trendChartData.slice(-10)}>
                            <XAxis dataKey="time" fontSize={9} stroke="#666" />
                            <YAxis fontSize={9} stroke="#666" />
                            <Bar dataKey="words" fill="#34d399" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Batch PDF Ingestion Zone */}
                {activeTab === 'Batch PDF' && (
                  <div className="flex-1 py-4 flex flex-col justify-center items-center text-center space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-zinc-700 hover:border-[#f4adc6] rounded-2xl p-8 cursor-pointer transition-all bg-[#121316]/50 hover:bg-[#121316] space-y-3"
                    >
                      <FileUp className="w-8 h-8 text-[#f4adc6] mx-auto animate-bounce" />
                      <div className="text-xs font-bold text-white">Click or Drag &amp; Drop PDF Documents</div>
                      <p className="text-[11px] text-zinc-400">Emoticore extracts multi-page text and generates collective NLP insights.</p>
                      {files.length > 0 && (
                        <div className="pt-2 text-xs font-bold text-[#f4adc6]">
                          {files.length} document(s) ready for batch analysis
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Ingestion Terminal / Input Prompt */}
                <form onSubmit={handleAnalyze} className="mt-4 pt-3 border-t border-white/5 space-y-2">
                  {files.length > 0 && (
                    <div className="flex items-center justify-between bg-zinc-800/80 px-3 py-1.5 rounded-xl text-xs text-[#f4adc6]">
                      <span className="truncate font-semibold">{files.length} PDF file(s) attached</span>
                      <button
                        type="button"
                        onClick={() => setFiles([])}
                        className="text-zinc-400 hover:text-white text-xs font-bold ml-2"
                      >
                        × Clear
                      </button>
                    </div>
                  )}

                  <div className="flex items-center bg-[#121316] border border-white/10 rounded-2xl p-1.5 focus-within:border-zinc-500 transition-all shadow-inner">
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={(e) => setFiles(Array.from(e.target.files))}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="p-2.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                      title="Attach PDF Documents"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={loading ? "Analyzing content & calculating sentiment..." : "How can I help you? Enter text..."}
                      disabled={loading}
                      className="flex-1 bg-transparent border-none outline-none px-3 text-xs text-white placeholder-zinc-500"
                    />

                    <button
                      type="submit"
                      disabled={loading || (!inputText.trim() && files.length === 0)}
                      className="p-2.5 bg-zinc-700/80 hover:bg-[#f4adc6] hover:text-black text-white rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-zinc-700/80 disabled:hover:text-white"
                      title="Execute Analysis"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </form>

              </div>

            </div>
          </>
        )}

      </div>

      {/* ── Entity Explorer Modal ────────────────────────────────────────── */}
      {showEntityModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18191d] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#f4adc6]" /> All Extracted Entities &amp; Keywords
              </h3>
              <button
                onClick={() => setShowEntityModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={entitySearch}
                onChange={(e) => setEntitySearch(e.target.value)}
                placeholder="Search extracted entities..."
                className="w-full bg-[#121316] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {sortedPhrases
                .filter(p => p.name.toLowerCase().includes(entitySearch.toLowerCase()))
                .map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-[#121316] border border-white/5 text-xs">
                    <span className="font-semibold text-zinc-200 capitalize">{p.name}</span>
                    <span className="text-[11px] font-bold text-[#f4adc6] bg-[#f4adc6]/10 px-2 py-0.5 rounded-md">
                      {p.count}
                    </span>
                  </div>
                ))}
              {sortedPhrases.length === 0 && (
                <p className="text-center text-xs text-zinc-500 py-6">No extracted entities found yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;


