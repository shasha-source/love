import React, { useState, useRef, useEffect } from "react";
import { DiaryEntry, ProfileSettings, TimelinePost } from "../types";
import { 
  Sparkles, 
  Heart, 
  Send, 
  BookOpen, 
  Trash2, 
  MessageSquare, 
  HelpCircle, 
  Flame, 
  Calendar,
  Gift,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DiaryTabProps {
  entries: DiaryEntry[];
  profile: ProfileSettings;
  posts?: TimelinePost[]; // Feed context data to Gemini oracle
  onUpdateEntries: (entries: DiaryEntry[]) => void;
  language: "zh" | "en";
  openAddTrigger?: number;
}

export default function DiaryTab({ entries, profile, posts = [], onUpdateEntries, language, openAddTrigger }: DiaryTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (openAddTrigger && openAddTrigger > 0) {
      setShowAddForm(true);
    }
  }, [openAddTrigger]);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImg1, setNewImg1] = useState("");
  const [newImg2, setNewImg2] = useState("");
  const [newAuthor, setNewAuthor] = useState(profile.partner1Name);
  const [newDateStr, setNewDateStr] = useState("June 12, 2026");

  // AI Memory Oracle State
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "model"; content: string }>>([
    {
      role: "model",
      content: language === "zh" 
        ? `哈喽！我是你们的专属【爱意回忆家】✨ 已载入你们相伴 1945 天的时光档案。点选下方快捷气泡，或是直接问我：“AI，写一首关于我们做意面手忙脚乱的诗” 或是 “总结一下 Sasa 最近最开心的一天” 吧！💖`
        : `Warm hug! I am your relationship Memory Oracle. I have read your logs. Click a romantic prompt below or ask me anything about your shared times! 💖`
    }
  ]);
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const t = {
    zh: {
      oracleTitle: "Gemini 爱意回忆家",
      oracleSub: "连接你们的 1945 日暮黄昏，听懂每一缕微风与咖啡香 ☕",
      notebookTitle: "AI 回忆珍宝馆",
      notebookSubtitle: "将平凡日常喂给 Gemini，提纯出饱含心动情愫的爱恋诗篇。",
      addEntry: "封存生活切片",
      dateLabel: "纪念时刻日期 (如: 六月十二日)",
      titleLabel: "回忆核心标志",
      subtitleLabel: "副标题/一句情话",
      contentLabel: "此刻发生的故事...",
      imgUrlLabel1: "回忆相片 URL 1 (可选)",
      imgUrlLabel2: "回忆相片 URL 2 (可选)",
      publish: "锁进秘密匣子",
      likes: "深爱此页",
      comments: "心意回复",
      memoryEssence: "AI 情感提纯 (Memory Essence)",
      runAiEssence: "让 AI 提纯今日回忆的温存",
      loadingAi: "AI 正在细细研磨墨汁...",
      deleteEntry: "撕去此页",
      queryLabel: "浪漫快捷求索：",
      query1: "📝 提炼专属心动情诗",
      query2: "📊 剖析我们最近的默契值",
      query3: "💡 寻找上一次 lakehouse 旅行",
      chatPlaceholder: "倾听关于我们的美好回忆...",
      cancel: "取消并卷起"
    },
    en: {
      oracleTitle: "Gemini Memory Companion",
      oracleSub: "Translating your 1945 days of whispers, mist, and baly coffee.",
      notebookTitle: "AI Memory Treasures",
      notebookSubtitle: "Convert your daily updates into poetic relationship retrospectives with Google Gemini.",
      addEntry: "Log Polaroid Diary",
      dateLabel: "Date String (e.g. Oct 24th)",
      titleLabel: "Memory Landmark Title",
      subtitleLabel: "Subtitle/Romantic Quote",
      contentLabel: "Describe what happened today...",
      imgUrlLabel1: "Polaroid Photo 1 URL (Optional)",
      imgUrlLabel2: "Polaroid Photo 2 URL (Optional)",
      publish: "Seal into Archives",
      likes: "adored",
      comments: "chats",
      memoryEssence: "GEMINI SWEET ESSENCE",
      runAiEssence: "Distill today's sweetness with AI",
      loadingAi: "AI is listening closely...",
      deleteEntry: "Tear page",
      queryLabel: "Magic Prompts:",
      query1: "📝 Formulate customized love poem",
      query2: "📊 Review our recent cozy rating",
      query3: "💡 Recall lakehouse getaway",
      chatPlaceholder: "Ask me about your shared story...",
      cancel: "Cancel"
    }
  }[language];

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handlers for AI Oracle queries
  const handleOracleSubmit = async (customPrompt?: string) => {
    const textToSend = customPrompt || chatInput.trim();
    if (!textToSend) return;

    if (!customPrompt) setChatInput("");

    // Append user question
    const updatedHistory = [...chatHistory, { role: "user" as const, content: textToSend }];
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
      setChatHistory([...updatedHistory, { role: "model" as const, content: data.reply }]);
    } catch (e) {
      console.error(e);
      setChatHistory([...updatedHistory, { 
        role: "model" as const, 
        content: language === "zh" ? "哎呀，爱意网络拥堵，Gemini 稍微眨了眨眼，请重试一遍哦！🐾" : "Love waves spiked! Please retry." 
      }]);
    } finally {
      setIsOracleLoading(false);
    }
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !newTitle.trim()) return;

    const newPage: DiaryEntry = {
      id: `diary-${Date.now()}`,
      dateStr: newDateStr || "Today",
      title: newTitle,
      subtitle: newSubtitle || "A quiet chapter in our book",
      author: newAuthor,
      content: newContent.trim(),
      imageUrl: newImg1.trim() || undefined,
      imageUrl2: newImg2.trim() || undefined,
      likes: 0,
      likedByUser: false,
      commentsCount: 0,
      timestamp: new Date().toISOString()
    };

    onUpdateEntries([newPage, ...entries]);
    setNewTitle("");
    setNewSubtitle("");
    setNewContent("");
    setNewImg1("");
    setNewImg2("");
    setShowAddForm(false);
  };

  const handleToggleLike = (id: string) => {
    onUpdateEntries(
      entries.map(e => {
        if (e.id === id) {
          const likedValue = !e.likedByUser;
          return {
            ...e,
            likedByUser: likedValue,
            likes: likedValue ? e.likes + 1 : Math.max(0, e.likes - 1)
          };
        }
        return e;
      })
    );
  };

  const handleDeleteEntry = (id: string) => {
    onUpdateEntries(entries.filter(e => e.id !== id));
  };

  const lowercaseQuery = searchQuery.trim().toLowerCase();
  const searchResults = lowercaseQuery
    ? [
        ...posts.map(p => ({ id: p.id, type: "moment" as const, title: p.mood || (language === "zh" ? "心动瞬影" : "Moment"), content: p.content, date: p.timestamp?.slice(0, 10), author: p.author, img: p.imageUrl })),
        ...entries.map(e => ({ id: e.id, type: "diary" as const, title: e.title, content: e.content, date: e.dateStr, author: e.author, img: e.imageUrl }))
      ].filter(item => 
        item.content.toLowerCase().includes(lowercaseQuery) ||
        item.title.toLowerCase().includes(lowercaseQuery) ||
        item.author.toLowerCase().includes(lowercaseQuery) ||
        (item.date && item.date.toLowerCase().includes(lowercaseQuery))
      )
    : [];

  return (
    <div className="space-y-6 pt-1">
      {/* SECTION 1: GEMINI ROMANTIC CHAT COMPANION (#5 - Redesigned to represent true AI memory hub) */}
      <section className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-rose-50 select-none">
          <div className="w-9 h-9 rounded-full bg-[#fae9eb] flex items-center justify-center text-[#ad292f]">
            <Sparkles size={18} className="animate-bounce" />
          </div>
          <div>
            <h3 className="text-md font-bold text-gray-800 flex items-center gap-1.5">
              {t.oracleTitle}
              <span className="text-[9px] font-bold bg-[#ad292f] text-white px-1.5 py-0.5 rounded-full select-none">LIVE</span>
            </h3>
            <p className="text-[10px] text-gray-400 font-medium">
              {t.oracleSub}
            </p>
          </div>
        </div>

        {/* Oracle History scrollbox */}
        <div className="h-64 overflow-y-auto space-y-3 p-3 bg-rose-50/20 rounded-2xl border border-rose-50/50 scrollbar-thin select-text">
          {chatHistory.map((ch, idx) => (
            <div 
              key={idx} 
              className={`flex ${ch.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[85%] text-xs p-3 rounded-2xl leading-relaxed shadow-xs font-serif ${
                  ch.role === "user" 
                    ? "bg-[#ad292f] text-white rounded-br-xs" 
                    : "bg-white text-gray-800 border border-rose-100/30 rounded-bl-xs select-text"
                }`}
              >
                {ch.role === "model" && (
                  <div className="flex items-center gap-1 mb-1 text-[9px] text-[#ad292f] font-bold select-none">
                    <Sparkles size={10} />
                    <span>Gemini Memories Oracle</span>
                  </div>
                )}
                <p className="font-semibold whitespace-pre-wrap">{ch.content}</p>
              </div>
            </div>
          ))}

          {isOracleLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-400 text-xs p-3 rounded-2xl rounded-bl-none border border-rose-50 flex items-center gap-1.5 shadow-xs italic font-medium">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-[#ad292f] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#ad292f] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#ad292f] rounded-full animate-bounce"></div>
                </div>
                <span>{language === "zh" ? "回忆家正在翻箱倒柜..." : "Recalling sweet secrets..."}</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Magic prompt clicks */}
        <div className="space-y-1.5 select-none">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            {t.queryLabel}
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <button
              onClick={() => handleOracleSubmit(language === "zh" ? "请用我们上传的所有说说、照片，为我们写首专属浪漫情诗。" : "Please formulate a beautiful acoustic poem based on our balcony sessions.")}
              disabled={isOracleLoading}
              className="bg-white border border-rose-100 hover:border-[#ad292f] hover:bg-rose-50 text-gray-600 hover:text-[#ad292f] px-3 py-1.5 rounded-full transition-all"
            >
              {t.query1}
            </button>
            <button
              onClick={() => handleOracleSubmit(language === "zh" ? "分析我们近期说说的总体心情和词云，看看我们最近的浪漫默契指数怎么样？评分1-10加点评。" : "How is our recent happy quotient rating? Give me a 1-10 index with description.")}
              disabled={isOracleLoading}
              className="bg-white border border-rose-100 hover:border-[#ad292f] hover:bg-rose-50 text-gray-600 hover:text-[#ad292f] px-3 py-1.5 rounded-full transition-all"
            >
              {t.query2}
            </button>
            <button
              onClick={() => handleOracleSubmit(language === "zh" ? "回顾下我们在 lakehouse 看林中迷雾的那次经历和日记感受。" : "Sum up our peaceful time last year around autumn anniversaries.")}
              disabled={isOracleLoading}
              className="bg-white border border-rose-100 hover:border-[#ad292f] hover:bg-rose-50 text-gray-600 hover:text-[#ad292f] px-3 py-1.5 rounded-full transition-all"
            >
              {t.query3}
            </button>
          </div>
        </div>

        {/* Chat input form and search filter row */}
        <div className="space-y-4">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleOracleSubmit(); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t.chatPlaceholder}
              className="w-full text-xs p-3.5 pr-12 border border-rose-100 rounded-2xl bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-200 focus:border-[#ad292f] font-semibold"
              disabled={isOracleLoading}
            />
            <button
              type="submit"
              disabled={isOracleLoading || !chatInput.trim()}
              className="absolute right-2 text-white bg-[#ad292f] disabled:bg-gray-200 hover:bg-[#ad292f]/90 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
            >
              <Send size={14} />
            </button>
          </form>

          {/* Integrated Real-time Semantic/Keyword memory filter */}
          <div className="bg-gradient-to-br from-[#fff7f7] to-[#fffcfc] border border-[#ad292f]/10 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#ad292f] tracking-wider uppercase flex items-center gap-1">
                🔎 {language === "zh" ? "微缩时光智能检索" : "Micro-Memory Fast Lookup"}
              </span>
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[9px] font-bold text-gray-400 hover:text-stone-600 cursor-pointer"
                >
                  {language === "zh" ? "清空条件" : "Clear Filter"}
                </button>
              )}
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === "zh" ? "输入关键词，如：'意面' '咖啡' '旅行' 'Sasa'..." : "Type keyword, e.g. 'coffee' 'pasta' 'trip'..."}
              className="w-full text-[11px] p-2.5 border border-stone-200 rounded-xl outline-none bg-white font-semibold text-stone-700 focus:border-[#ad292f] transition-all"
            />

            {/* Results popup area */}
            <AnimatePresence>
              {lowercaseQuery && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-2 pt-1"
                >
                  <p className="text-[9px] text-[#735858]/60 font-bold">
                    {language === "zh" ? `为您找到 ${searchResults.length} 个匹配时光节点：` : `Found ${searchResults.length} matching chapters:`}
                  </p>
                  
                  {searchResults.length === 0 ? (
                    <p className="text-[10px] italic text-stone-400 py-1">
                      {language === "zh" ? "漫漫岁月里，那天好像很安静，换个词搜搜看？🧸" : "Nothing found. Try searching another warm word! 🧸"}
                    </p>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                      {searchResults.map((item) => (
                        <div 
                          key={`search-${item.type}-${item.id}`} 
                          onClick={() => {
                            setChatInput(language === "zh" ? `跟我提纯分析我们在 ${item.date || ""} 记录的：“${item.content.slice(0, 30)}” 这件事。` : `Help me distill and reflect on: "${item.content.slice(0,30)}" recorded on ${item.date || ""}`);
                          }}
                          className="bg-white hover:bg-rose-50/50 p-2.5 rounded-xl border border-stone-100 hover:border-[#ad292f]/30 transition-all cursor-pointer flex gap-3 items-center"
                        >
                          {item.img ? (
                            <img src={item.img} className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-rose-50/50 flex items-center justify-center text-rose-350 font-bold text-xs shrink-0 font-serif">
                              {item.type === "moment" ? "📌" : "📖"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-center text-[8.5px] text-[#ad292f] font-bold">
                              <span>{item.type === "moment" ? (language === "zh" ? "时光瞬影" : "Moment") : (language === "zh" ? "随笔纸笺" : "Diary")} • {item.author}</span>
                              <span className="text-stone-400 font-mono font-medium">{item.date}</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-700 truncate">{item.title}</p>
                            <p className="text-[9.5px] text-gray-500 line-clamp-1 mt-0.5">{item.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Add Entry popup sheet inside the tab */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onSubmit={handleCreateEntry}
              className="bg-[#fffdfb] border-2 border-rose-100/60 p-6 rounded-3xl shadow-2xl space-y-4 select-none relative max-w-xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50/30 rounded-bl-full pointer-events-none" />

              <div className="border-b border-rose-100 pb-2">
                <h4 className="text-sm font-bold text-gray-800">
                  💌 撰写属于你们的私密情书
                </h4>
              </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div>
                <label className="block text-[#735858]/80 uppercase tracking-widest font-bold mb-1">
                  {t.dateLabel}
                </label>
                <input
                  type="text"
                  value={newDateStr}
                  onChange={(e) => setNewDateStr(e.target.value)}
                  placeholder="June 12, 2026"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-[#735858] bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[#735858]/80 uppercase tracking-widest font-bold mb-1">
                  写信作者
                </label>
                <select
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-[#735858] bg-white text-xs"
                >
                  <option value={profile.partner1Name}>{profile.partner1Name}</option>
                  <option value={profile.partner2Name}>{profile.partner2Name}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div>
                <label className="block text-[#735858]/80 uppercase tracking-widest font-bold mb-1">
                  {t.titleLabel}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                  placeholder="Pasta Night"
                  required
                />
              </div>
              <div>
                <label className="block text-[#735858]/80 uppercase tracking-widest font-bold mb-1">
                  {t.subtitleLabel}
                </label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                  placeholder="The quietest chapter..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div>
                <label className="block text-[#735858]/80 uppercase tracking-widest font-bold mb-1">
                  回忆照片 URL 1
                </label>
                <input
                  type="text"
                  value={newImg1}
                  onChange={(e) => setNewImg1(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-[#735858]/80 uppercase tracking-widest font-bold mb-1">
                  回忆照片 URL 2 (可选)
                </label>
                <input
                  type="text"
                  value={newImg2}
                  onChange={(e) => setNewImg2(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#735858]/80 uppercase tracking-widest font-bold mb-1 font-semibold">
                写信日记正文
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                className="w-full text-sm p-3.5 border border-gray-200 focus:ring-1 focus:ring-rose-200 rounded-xl bg-white focus:outline-none"
                placeholder={t.contentLabel}
                required
              />
            </div>

            <div className="flex justify-end gap-2 text-xs font-bold pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:bg-gray-100 px-4 py-2.5 rounded-full"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="bg-[#ad292f] hover:bg-[#ad292f]/90 text-white px-5 py-2.5 rounded-full"
              >
                {t.publish}
              </button>
            </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Diary archives listed with lined notebook drops and Polaroid frame rotation */}
      <div className="space-y-12">
        {entries.map((entry) => {
          let contentText = entry.content;
          let firstChar = contentText.charAt(0);
          let remainderText = contentText.substring(1);

          return (
            <section
              key={entry.id}
              className="bg-white border-2 border-[#fff0f1] rounded-[28px] relative shadow-[0_8px_30px_rgba(244,63,94,0.015)] hover:shadow-[0_12px_45px_rgba(244,63,94,0.055)] transition-all duration-400 p-6 md:p-8 overflow-hidden select-text"
              style={{
                backgroundImage: "linear-gradient(rgba(115,88,88,0.06) 1.8rem, transparent 1.8rem)",
                backgroundSize: "100% 1.8rem",
                lineHeight: "1.8rem"
              }}
            >
              {/* Notebook nostalgic margin line */}
              <div className="absolute left-[30px] top-0 bottom-0 w-[1.5px] bg-[#ad292f]/25 pointer-events-none" />

              <div className="pl-6 space-y-4">
                <div className="flex justify-between items-center h-8 relative z-20">
                  <span className="font-serif italic text-2xl font-black text-[#ad292f] select-none">
                    {entry.dateStr}
                  </span>
                  <div className="flex gap-2 select-none">
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-[#735858]/40 hover:text-red-500 transition-colors p-1"
                      title={t.deleteEntry}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs italic font-bold text-[#735858] font-mono leading-relaxed select-text uppercase tracking-wider">
                    “ {entry.subtitle} ”
                  </p>
                </div>

                {/* Polaroid Photos slots */}
                {(entry.imageUrl || entry.imageUrl2) && (
                  <div className="py-2 flex flex-col sm:flex-row gap-6 justify-center items-center select-none">
                    {entry.imageUrl && (
                      <div className="bg-white border border-gray-150 p-3 pb-8 rounded-xs shadow-md rotate-[-1.5deg] hover:rotate-0 transition-transform duration-300 max-w-xs scale-95 md:scale-100">
                        <div className="w-56 h-40 overflow-hidden bg-rose-50 border border-gray-100 rounded-xs">
                          <img
                            src={entry.imageUrl}
                            className="w-full h-full object-cover"
                            alt="Polaroid landscape"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-center font-mono text-[8px] mt-1.5 italic font-bold text-gray-400">
                          {entry.title || "memory"} • {entry.dateStr}
                        </p>
                      </div>
                    )}

                    {entry.imageUrl2 && (
                      <div className="bg-white border border-gray-150 p-3 pb-8 rounded-xs shadow-md rotate-[1.5deg] hover:rotate-0 transition-transform duration-300 max-w-xs scale-95 md:scale-100">
                        <div className="w-56 h-40 overflow-hidden bg-rose-50 border border-gray-100 rounded-xs">
                          <img
                            src={entry.imageUrl2}
                            className="w-full h-full object-cover"
                            alt="Polaroid landscape"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-center font-mono text-[8px] mt-1.5 italic font-bold text-gray-400">
                          {entry.title || "cozy recipe"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Dropcap paragraph journal body */}
                <div className="text-gray-800 leading-[1.8rem] text-sm select-text font-serif font-semibold">
                  <span className="float-left text-4xl font-extrabold pr-1.5 pt-0.5 text-[#ad292f] select-none font-sans">
                    {firstChar}
                  </span>
                  {remainderText}
                </div>

                {/* Memory Essence block */}
                {entry.essenceText && (
                  <div className="pt-3.5 border-t border-rose-50 select-text">
                    <div className="bg-rose-50/50 border border-[#ad292f]/10 p-3.5 rounded-2xl relative">
                      <div className="flex items-center gap-1.5 mb-1.5 select-none">
                        <Sparkles size={13} className="text-[#ad292f]/80" />
                        <span className="text-[9px] font-bold text-[#ad292f]/80 uppercase tracking-widest font-sans">
                          {t.memoryEssence}
                        </span>
                      </div>
                      <p className="text-xs italic text-[#735858] leading-relaxed font-semibold">
                        "{entry.essenceText}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer labels */}
                <div className="flex items-center gap-4 text-xs font-bold text-gray-400 pt-1.5 select-none font-sans">
                  <button
                    onClick={() => handleToggleLike(entry.id)}
                    className={`flex items-center gap-1 hover:text-[#ad292f] transition-all ${
                      entry.likedByUser ? "text-[#ad292f]" : ""
                    }`}
                  >
                    <Heart size={13} fill={entry.likedByUser ? "#ad292f" : "none"} />
                    <span>{entry.likes} {t.likes}</span>
                  </button>
                  <span className="ml-auto text-[10px] text-gray-400 italic">
                    {language === "zh" ? "墨宝落款：" : "Signed by"} • {entry.author}
                  </span>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
