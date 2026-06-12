import React, { useState, useRef, useEffect } from "react";
import { DiaryEntry, ProfileSettings, TimelinePost } from "../types";
import { Sparkles, Send, BookMarked, Trash2, ChevronDown, ChevronUp, Mic, MicOff, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AiAnalysis {
  id: string;
  title: string;
  query: string;
  reply: string;
  savedAt: string;
}

interface DiaryTabProps {
  entries: DiaryEntry[];
  profile: ProfileSettings;
  posts?: TimelinePost[];
  onUpdateEntries: (entries: DiaryEntry[]) => void;
  language: "zh" | "en";
  openAddTrigger?: number;
}

export default function DiaryTab({ entries, profile, posts = [], language }: DiaryTabProps) {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "model"; content: string; savedId?: string }>>([
    {
      role: "model",
      content: language === "zh"
        ? `你好！我是你们的专属【AI分析师】✨ 已读取你们的时光档案。你可以问我"帮我写一首关于我们的诗"，或者用AI搜索直接定位到某段具体记忆💖`
        : `Hello! I'm your AI Analyst ✨ I've read all your shared moments. Ask me anything — or use AI Search to locate a specific memory! 💖`
    }
  ]);
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [aiAnalyses, setAiAnalyses] = useState<AiAnalysis[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("couple_ai_analyses") || "[]");
    } catch { return []; }
  });
  const [showAnalyses, setShowAnalyses] = useState(true);
  const [pendingSave, setPendingSave] = useState<{ query: string; reply: string } | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingChatImage, setPendingChatImage] = useState<string>("");
  const [isAiListening, setIsAiListening] = useState(false);
  const aiRecognitionRef = useRef<any>(null);
  const [isAiUploading, setIsAiUploading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);

  const toggleAiVoice = () => {
    if (isAiListening) {
      aiRecognitionRef.current?.stop?.();
      setIsAiListening(false);
    } else {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) return;
      const rec = new SR();
      rec.lang = language === "zh" ? "zh-CN" : "en-US";
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (ev: any) => {
        const transcript = ev.results[0][0].transcript;
        setChatInput(prev => (prev.trim() ? prev + " " : "") + transcript);
      };
      rec.onend = () => setIsAiListening(false);
      rec.onerror = () => setIsAiListening(false);
      aiRecognitionRef.current = rec;
      rec.start();
      setIsAiListening(true);
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Scroll page to bring chat section into view after AI responds
  useEffect(() => {
    if (!isOracleLoading && chatHistory.length > 1) {
      setTimeout(() => {
        chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [isOracleLoading]);

  const persistAnalyses = (updated: AiAnalysis[]) => {
    setAiAnalyses(updated);
    localStorage.setItem("couple_ai_analyses", JSON.stringify(updated));
  };

  const quickPrompts = language === "zh"
    ? [
        { label: "📝 写一首关于我们的情诗", prompt: "请用我们上传的所有说说，为我们写首专属浪漫情诗。" },
        { label: "📊 分析我们的默契值", prompt: "分析我们近期说说的总体心情，评分我们最近的浪漫默契指数1-10分并点评。" },
        { label: "💡 总结我们的故事", prompt: "请根据我们上传的日记和说说，温馨地总结一下我们的爱情故事。" },
        { label: "📅 找最难忘的一天", prompt: "从所有记录里，帮我找出你认为我们最难忘、最浪漫的一天，并说明理由。" },
      ]
    : [
        { label: "📝 Write us a love poem", prompt: "Please write a beautiful romantic poem based on all our shared moments." },
        { label: "📊 Rate our connection", prompt: "Analyze our recent posts and rate our romantic connection index from 1-10." },
        { label: "💡 Summarize our story", prompt: "Please warmly summarize our love story based on our diary entries and moments." },
        { label: "📅 Find our best day", prompt: "From all our records, find what you think was our most unforgettable, romantic day and explain why." },
      ];

  const handleOracleSubmit = async (customPrompt?: string) => {
    const textToSend = customPrompt || chatInput.trim();
    const hasImage = !!pendingChatImage;
    if (!textToSend && !hasImage) return;
    if (!customPrompt) setChatInput("");

    // Include image URL in user message if attached
    const fullText = hasImage
      ? `${textToSend || (language === "zh" ? "请分析这张图片" : "Please analyze this image")} [附图: ${pendingChatImage}]`
      : textToSend;

    if (hasImage) setPendingChatImage("");

    const updatedHistory = [...chatHistory, { role: "user" as const, content: fullText }];
    setChatHistory(updatedHistory);
    setIsOracleLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          language,
          partner1: profile.partner1Name,
          partner2: profile.partner2Name,
          posts,
          entries
        })
      });
      const data = await response.json();
      const reply = data.reply as string;
      setChatHistory([...updatedHistory, { role: "model" as const, content: reply }]);
      // Offer to save
      setPendingSave({ query: textToSend, reply });
    } catch (e) {
      setChatHistory([...updatedHistory, {
        role: "model" as const,
        content: language === "zh" ? "哎呀，网络拥堵，请重试一遍哦！🐾" : "Love waves spiked! Please retry."
      }]);
    } finally {
      setIsOracleLoading(false);
    }
  };

  const handleSaveAnalysis = () => {
    if (!pendingSave) return;
    const title = saveTitle.trim() || (language === "zh" ? `分析记录 ${new Date().toLocaleDateString("zh-CN")}` : `Analysis ${new Date().toLocaleDateString()}`);
    const newAnalysis: AiAnalysis = {
      id: Date.now().toString(),
      title,
      query: pendingSave.query,
      reply: pendingSave.reply,
      savedAt: new Date().toISOString()
    };
    persistAnalyses([newAnalysis, ...aiAnalyses]);
    setPendingSave(null);
    setSaveTitle("");
    setShowSaveModal(false);
    setShowAnalyses(true);
  };

  const handleDeleteAnalysis = (id: string) => {
    persistAnalyses(aiAnalyses.filter(a => a.id !== id));
  };


  return (
    <div className="space-y-5 pt-1">

      {/* ── AI ANALYSIS CHAT ── */}
      <section ref={chatSectionRef} className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-rose-50 select-none">
          <div className="w-9 h-9 rounded-full bg-[#fae9eb] flex items-center justify-center text-[#ad292f]">
            <Sparkles size={18} className="animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              {language === "zh" ? "AI 分析" : "AI Analysis"}
              <span className="text-[9px] font-bold bg-[#ad292f] text-white px-1.5 py-0.5 rounded-full">GEMINI</span>
            </h3>
            <p className="text-[10px] text-gray-400 font-medium">
              {language === "zh" ? "分析你们的爱情档案，每次分析都可以保存 💾" : "Analyse your love story — every insight can be saved 💾"}
            </p>
          </div>
        </div>

        {/* Chat history */}
        <div className="h-72 overflow-y-auto space-y-3 p-3 bg-rose-50/20 rounded-2xl border border-rose-50/50">
          {chatHistory.map((ch, idx) => (
            <div key={idx} className={`flex ${ch.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] text-xs p-3 rounded-2xl leading-relaxed shadow-xs font-serif ${
                ch.role === "user"
                  ? "bg-[#ad292f] text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-rose-100/30 rounded-bl-sm"
              }`}>
                {ch.role === "model" && (
                  <div className="flex items-center gap-1 mb-1 text-[9px] text-[#ad292f] font-bold select-none">
                    <Sparkles size={10} />
                    <span>AI 分析师</span>
                  </div>
                )}
                <p className="font-semibold whitespace-pre-wrap">{ch.content}</p>
              </div>
            </div>
          ))}

          {isOracleLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-400 text-xs p-3 rounded-2xl border border-rose-50 flex items-center gap-1.5 shadow-xs italic font-medium">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-[#ad292f] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-[#ad292f] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-[#ad292f] rounded-full animate-bounce" />
                </div>
                <span>{language === "zh" ? "AI 分析中..." : "Analysing..."}</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Save prompt — appears after an AI reply */}
        <AnimatePresence>
          {pendingSave && !isOracleLoading && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-3.5 py-2.5"
            >
              <p className="text-[10px] font-bold text-[#ad292f] flex items-center gap-1">
                <BookMarked size={11} />
                {language === "zh" ? "要保存这次分析吗？" : "Save this analysis?"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setPendingSave(null); }}
                  className="text-[10px] font-bold text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {language === "zh" ? "不了" : "Skip"}
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="text-[10px] font-bold bg-[#ad292f] text-white px-3 py-1 rounded-full hover:bg-[#ad292f]/90 cursor-pointer"
                >
                  {language === "zh" ? "保存" : "Save"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick prompts */}
        <div className="space-y-1.5 select-none">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            {language === "zh" ? "快捷分析：" : "Quick Analysis:"}
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                onClick={() => handleOracleSubmit(q.prompt)}
                disabled={isOracleLoading}
                className="bg-white border border-rose-100 hover:border-[#ad292f] hover:bg-rose-50 text-gray-600 hover:text-[#ad292f] px-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat input with image + voice support */}
        <div className="space-y-2">
          {/* Pending image preview */}
          {pendingChatImage && (
            <div className="relative inline-block">
              <img src={pendingChatImage} className="w-20 h-14 object-cover rounded-xl border border-rose-100 shadow-sm" alt="" />
              <button onClick={() => setPendingChatImage("")} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center cursor-pointer">
                <X size={8} />
              </button>
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); handleOracleSubmit(); }} className="flex items-center gap-1.5">
            {/* Camera button */}
            <label className={`shrink-0 cursor-pointer p-2.5 rounded-xl transition-colors ${pendingChatImage ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-[#ad292f]/60 hover:text-[#ad292f] hover:bg-rose-100"}`}>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={async (ev) => {
                const file = ev.target.files?.[0]; if (!file) return;
                setIsAiUploading(true);
                const fd = new FormData(); fd.append("file", file);
                try {
                  const res = await fetch("/api/upload-media", { method: "POST", body: fd });
                  const d = await res.json();
                  setPendingChatImage(d.url);
                } catch {
                  if (file.type.startsWith("image/")) {
                    const r = new FileReader(); r.onload = e => setPendingChatImage(e.target?.result as string); r.readAsDataURL(file);
                  }
                } finally { setIsAiUploading(false); ev.target.value = ""; }
              }} />
              {isAiUploading ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              )}
            </label>
            {/* Mic button */}
            <button type="button" onClick={toggleAiVoice} className={`shrink-0 p-2.5 rounded-xl transition-colors cursor-pointer ${isAiListening ? "bg-[#ad292f] text-white animate-pulse" : "bg-rose-50 text-[#ad292f]/60 hover:text-[#ad292f] hover:bg-rose-100"}`}>
              {isAiListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={language === "zh" ? "问我任何关于你们的问题..." : "Ask me anything about your story..."}
                className="w-full text-xs p-3.5 pr-12 border border-rose-100 rounded-2xl bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-200 focus:border-[#ad292f] font-semibold"
                disabled={isOracleLoading}
              />
              <button
                type="submit"
                disabled={isOracleLoading || (!chatInput.trim() && !pendingChatImage)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-[#ad292f] disabled:bg-gray-200 hover:bg-[#ad292f]/90 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              >
                {isOracleLoading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </form>
        </div>
      </section>


      {/* ── SAVED ANALYSES ── */}
      {aiAnalyses.length > 0 && (
        <section className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm space-y-3">
          <button
            onClick={() => setShowAnalyses(v => !v)}
            className="w-full flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <BookMarked size={14} className="text-[#ad292f]" />
              <span className="text-[11px] font-black text-stone-700 tracking-wide">
                {language === "zh" ? "已保存的分析" : "Saved Analyses"}
              </span>
              <span className="text-[9px] bg-rose-50 text-[#ad292f] font-bold px-1.5 py-0.5 rounded-full border border-rose-100">
                {aiAnalyses.length}
              </span>
            </div>
            {showAnalyses ? <ChevronUp size={13} className="text-stone-400" /> : <ChevronDown size={13} className="text-stone-400" />}
          </button>

          <AnimatePresence>
            {showAnalyses && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-3"
              >
                {aiAnalyses.map(a => (
                  <div key={a.id} className="bg-rose-50/40 border border-rose-100/60 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-black text-stone-700 flex-1 truncate">{a.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-stone-400 font-mono">
                          {new Date(a.savedAt).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" })}
                        </span>
                        <button
                          onClick={() => handleDeleteAnalysis(a.id)}
                          className="text-stone-300 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[9.5px] text-stone-500 font-medium italic">
                      Q: {a.query.length > 60 ? a.query.slice(0, 60) + "…" : a.query}
                    </p>
                    <p className="text-[10.5px] text-stone-700 font-medium leading-relaxed whitespace-pre-wrap line-clamp-5">
                      {a.reply}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* ── SAVE TITLE MODAL ── */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-[400] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              className="bg-white w-full max-w-sm rounded-t-3xl p-6 space-y-4"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-stone-700 flex items-center gap-2">
                  <BookMarked size={14} className="text-[#ad292f]" />
                  {language === "zh" ? "保存分析记录" : "Save Analysis"}
                </h3>
                <button onClick={() => setShowSaveModal(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer text-xs">✕</button>
              </div>
              <input
                type="text"
                value={saveTitle}
                onChange={e => setSaveTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSaveAnalysis(); }}
                placeholder={language === "zh" ? "给这条分析起个名字..." : "Give this analysis a title..."}
                autoFocus
                className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:outline-none focus:border-[#ad292f] font-semibold"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-stone-500 border border-stone-200 rounded-2xl cursor-pointer"
                >
                  {language === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  onClick={handleSaveAnalysis}
                  className="flex-1 py-2.5 text-xs font-bold bg-[#ad292f] text-white rounded-2xl cursor-pointer hover:bg-[#ad292f]/90"
                >
                  {language === "zh" ? "保存" : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
