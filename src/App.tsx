import React, { useState, useEffect } from "react";
import { TimelinePost, DiaryEntry, CalendarEvent, ProfileSettings } from "./types";
import {
  initialProfile,
  initialTimelinePosts,
  initialDiaryEntries,
  initialCalendarEvents
} from "./data";
import TimelineTab from "./components/TimelineTab";
import DiaryTab from "./components/DiaryTab";
import ProfileTab from "./components/ProfileTab";
import { audio } from "./utils/audio";
import { 
  Heart, 
  Calendar as CalendarIcon, 
  BookOpen, 
  Settings, 
  Sparkles, 
  Lock, 
  Eye, 
  ArrowRight,
  ShieldCheck,
  Coffee,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // 10. Startup Loading Screen state
  const [appIsLoading, setAppIsLoading] = useState(true);

  // Synchronized Scrapbook Storage
  const [profile, setProfile] = useState<ProfileSettings>(() => {
    const saved = localStorage.getItem("couple_profile");
    return saved ? JSON.parse(saved) : initialProfile;
  });

  const [posts, setPosts] = useState<TimelinePost[]>(() => {
    const saved = localStorage.getItem("couple_posts");
    return saved ? JSON.parse(saved) : initialTimelinePosts;
  });

  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    const saved = localStorage.getItem("couple_diary_entries");
    return saved ? JSON.parse(saved) : initialDiaryEntries;
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("couple_events");
    return saved ? JSON.parse(saved) : initialCalendarEvents;
  });

  const [activeTab, setActiveTab] = useState<"timeline" | "diary" | "profile">("timeline");

  // Global Add FAB triggers representing clicks on the + button
  const [timelineAddTrigger, setTimelineAddTrigger] = useState(0);
  const [diaryAddTrigger, setDiaryAddTrigger] = useState(0);

  const handleGlobalAdd = () => {
    if (activeTab === "timeline") {
      setTimelineAddTrigger((t) => t + 1);
    } else if (activeTab === "diary") {
      setDiaryAddTrigger((t) => t + 1);
    } else {
      setActiveTab("timeline");
      setTimelineAddTrigger((t) => t + 1);
    }
  };

  // 6. 7. 8. Infinite Heart accumulator states & Flying Particles
  interface HeartParticle {
    id: number;
    x: number;
    y: number;
    emoji: string;
    rotation: number;
    scale: number;
  }
  const [heartParticles, setHeartParticles] = useState<HeartParticle[]>([]);
  const [loveCount, setLoveCount] = useState<number>(() => {
    const saved = localStorage.getItem("couple_love_count");
    return saved ? parseInt(saved, 10) : 520;
  });

  useEffect(() => {
    localStorage.setItem("couple_love_count", loveCount.toString());
  }, [loveCount]);

  const spawnHearts = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
    setLoveCount(prev => prev + 1);
    audio.playHeart();
    const emojis = ["💖", "💝", "❤️", "💞", "💕", "💘", "🌹", "✨"];
    const newParticles: HeartParticle[] = [];
    const containerRect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX || (containerRect.left + containerRect.width / 2);
    const startY = e.clientY || (containerRect.top + containerRect.height / 2);

    for (let i = 0; i < 4; i++) {
      newParticles.push({
        id: Date.now() + Math.random(),
        x: startX + (Math.random() * 50 - 25),
        y: startY + (Math.random() * 40 - 20),
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        rotation: Math.random() * 80 - 40,
        scale: 0.9 + Math.random() * 0.7
      });
    }
    setHeartParticles(prev => [...prev, ...newParticles]);
  };

  // 9. Locker screen lock status (persists in localStorage so user can relock/unlock nicely)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem("couple_locked");
    return saved ? JSON.parse(saved) : true; // Lock on first load to trigger gorgeous unlock gate
  });

  const [lockPin, setLockPin] = useState("");
  const [lockError, setLockError] = useState("");

  // Dismiss Loading screen after 1.8s for smooth romance loading experience (#10)
  useEffect(() => {
    const loaderTimer = setTimeout(() => {
      setAppIsLoading(false);
    }, 1800);
    return () => clearTimeout(loaderTimer);
  }, []);

  // Keep LocalStorage in sync
  useEffect(() => {
    localStorage.setItem("couple_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("couple_posts", JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem("couple_diary_entries", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("couple_events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("couple_locked", JSON.stringify(isLocked));
  }, [isLocked]);

  const lang = profile.language;

  // On-the-fly Countdown arithmetic for Total Days Together
  const calculateDaysTogether = () => {
    try {
      const start = new Date(profile.sinceDate).getTime();
      const now = new Date().getTime();
      const diff = now - start;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return isNaN(days) ? 1945 : Math.max(1, days);
    } catch {
      return 1945;
    }
  };

  const daysCount = calculateDaysTogether();

  // Dynamic Couple Theme Styling Mapper
  const themes = {
    red: {
      accentText: "text-[#ad292f]",
      accentBg: "bg-[#ad292f]",
      accentBorder: "border-[#ad292f]",
      softBg: "bg-[#fffafa]",
      containerBg: "bg-[#fceae9]",
      hoverBg: "hover:bg-[#fceae9]",
      gradient: "from-[#ad292f] to-[#e05258]",
      glow: "shadow-[#fceae9]"
    },
    blue: {
      accentText: "text-[#1e4b52]",
      accentBg: "bg-[#1e4b52]",
      accentBorder: "border-[#1e4b52]",
      softBg: "bg-[#f5f9fa]",
      containerBg: "bg-[#e2ecee]",
      hoverBg: "hover:bg-[#e2ecee]",
      gradient: "from-[#1e4b52] to-[#407e88]",
      glow: "shadow-[#e2ecee]"
    },
    green: {
      accentText: "text-[#2a4c33]",
      accentBg: "bg-[#2a4c33]",
      accentBorder: "border-[#2a4c33]",
      softBg: "bg-[#f6faf6]",
      containerBg: "bg-[#e3ece5]",
      hoverBg: "hover:bg-[#e3ece5]",
      gradient: "from-[#2a4c33] to-[#518b5f]",
      glow: "shadow-[#e3ece5]"
    },
    orange: {
      accentText: "text-[#9c442f]",
      accentBg: "bg-[#9c442f]",
      accentBorder: "border-[#9c442f]",
      softBg: "bg-[#fffaf7]",
      containerBg: "bg-[#fcebe5]",
      hoverBg: "hover:bg-[#fcebe5]",
      gradient: "from-[#9c442f] to-[#d66b53]",
      glow: "shadow-[#fcebe5]"
    }
  };

  const curTheme = themes[profile.theme] || themes.red;

  const t = {
    zh: {
      daysTogether: "天相守",
      daysSince: "爱意起点",
      timelineTab: "时光",
      diaryTab: "AI查找",
      profileTab: "设置",
      loveGreeting: "相伴岁月长路 ✨",
      lockTitle: "秘密相册",
      lockDesc: "锁住了属于我们的甜蜜时刻，输入恋爱暗号开启 🗝️",
      lockHint: "初始默认暗号为 'love'",
      unlockBtn: "开启甜蜜档案 💖",
      appTitle: "暮色手账",
      loaderGreeting: "开启恋爱编年史...",
      romanticNote: "两颗有趣的灵魂终会相遇。"
    },
    en: {
      daysTogether: "Days Together",
      daysSince: "Pledge Date",
      timelineTab: "Moments",
      diaryTab: "AI Search",
      profileTab: "Settings",
      loveGreeting: "Writing our eternal chronicle together ✨",
      lockTitle: "Our Private Lockbox",
      lockDesc: "Chronicles of 1945 days are asleep behind our secret veil. Enter our love passcode to view 🗝️",
      lockHint: "Default unlock code is 'love'",
      unlockBtn: "Decrypt Love Archive 💖",
      appTitle: "L'Amour Scrapbook",
      loaderGreeting: "Gently dusting off our handwritten love letters...",
      romanticNote: "Two synchronization souls, sharing balcony coffee and kitchen pasta fail counters."
    }
  }[lang];

  // Try Unlock (#9)
  const handleUnlockGate = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPass = (profile.passcode || "love").trim();
    if (lockPin.trim().toLowerCase() === correctPass.toLowerCase()) {
      audio.playSuccess();
      setIsLocked(false);
      setLockPin("");
      setLockError("");
    } else {
      audio.playTap();
      setTimeout(() => audio.playTap(), 100);
      setLockError(lang === "zh" ? "🔒 解锁密钥和爱不匹配，Ta 会伤心哦..." : "🔒 Love passcode incorrect! Please try again.");
    }
  };

  /* 10. INTRODUCING LOVELY EMBED ANIMATED START LOADING SCREEN */
  if (appIsLoading) {
    return (
      <div className="fixed inset-0 bg-[#fbf5f2] z-[1000] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="text-center space-y-6 max-w-sm"
        >
          {/* Animated pulsing heart with rings */}
          <div className="relative flex items-center justify-center">
            <span className="absolute animate-ping inline-flex h-16 w-16 rounded-full bg-red-400 opacity-25"></span>
            <div className="w-20 h-20 bg-gradient-to-tr from-[#ad292f] to-[#e05258] rounded-full flex items-center justify-center shadow-lg relative z-10 shadow-rose-200">
              <Heart size={36} fill="#ffffff" className="text-white animate-pulse" />
            </div>
            <Sparkles size={20} className="absolute top-0 right-0 text-amber-500 animate-[bounce_1.5s_infinite]" />
            <Coffee size={18} className="absolute bottom-0 left-0 text-[#ad292f] animate-[swing_2s_infinite]" />
          </div>

          <div className="space-y-2">
            <h1 className="title-font text-2xl font-black text-gray-800 tracking-tight">
              {t.appTitle}
            </h1>
            <p className="text-xs text-rose-800 font-bold italic animate-pulse">
              {t.loaderGreeting}
            </p>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed font-semibold italic border-t border-rose-100 pt-3">
            {t.romanticNote}
          </p>
        </motion.div>
      </div>
    );
  }

  /* 9. REDESIGNED PASSCODE LOCK GATESCREEN FOR PRIVATE SCRAPBOOK SAFETY */
  if (isLocked) {
    return (
      <div 
        className="fixed inset-0 bg-gradient-to-br from-[#fff6f4] via-[#faf0eb] to-[#fbf7f6] z-[500] flex items-center justify-center p-4 overflow-y-auto select-none"
        style={{
          backgroundImage: "radial-gradient(#ad292f/0.05 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="bg-white border-4 border-stone-200/20 rounded-[32px] p-6 sm:p-10 max-w-md w-full shadow-2xl relative text-center space-y-8 overflow-hidden"
        >
          {/* Top Stamp indicator */}
          <div className="absolute top-4 right-4 text-[8px] uppercase font-black text-[#ad292f]/40 font-mono tracking-widest bg-rose-50 px-2.5 py-1 rounded-full">
            💌 Secure Archive Gate
          </div>

          {/* Romantic Banner Graphic */}
          <div className="space-y-4 relative">
            <button 
              type="button"
              onClick={(e) => spawnHearts(e)}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ad292f] to-rose-400 text-white flex items-center justify-center mx-auto shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer relative group"
            >
              <Heart size={24} fill="#ffffff" className="group-hover:animate-ping" />
              <span className="absolute -top-1 -right-1 bg-amber-400 text-stone-900 text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                +1💖
              </span>
            </button>

            <div className="space-y-1">
              <h1 className="font-serif text-3xl font-black text-stone-850 tracking-tight">
                {daysCount} {lang === "zh" ? "天相守" : "Days Together"}
              </h1>
              <p className="text-[10px] tracking-widest text-stone-400 font-sans uppercase font-black">
                {lang === "zh" ? "写 意 生 活 • 情 侣 编 年 史" : "L'Amour Chronicle Scrapbook"}
              </p>
            </div>

            <p className="text-[11px] text-[#735858]/80 font-serif leading-relaxed italic max-w-xs mx-auto px-2">
              "{lang === "zh" ? "锁住了属于我们的甜蜜时刻，输入恋爱暗号开启" : "Our sacred diary lies behind the veil of our private gate. Enter custom passcode to unlock."}"
            </p>
          </div>

          {/* Quick passcode pad / typing system */}
          <form onSubmit={handleUnlockGate} className="space-y-5">
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-widest text-center">
                {lang === "zh" ? "请输入解锁密语" : "Type passcode word"}
              </label>
              
              <div className="relative">
                <input
                  type="password"
                  placeholder={lang === "zh" ? "如默认密码 'love'" : "e.g. default 'love'..."}
                  value={lockPin}
                  onChange={(e) => {
                    setLockPin(e.target.value);
                    setLockError("");
                  }}
                  className="w-full text-center text-sm p-4 border border-rose-100 focus:ring-1 focus:ring-rose-200 focus:border-[#ad292f] bg-stone-50/50 rounded-2xl outline-none transition-all font-black tracking-widest text-[#ad292f]"
                  autoFocus
                />
              </div>
              
              {lockError ? (
                <p className="text-rose-600 text-[10px] text-center font-bold mt-2 animate-bounce">
                  {lockError}
                </p>
              ) : (
                <p className="text-[9.5px] text-stone-400 text-center font-semibold mt-1 bg-amber-50/40 py-1 rounded-xl">
                  💡 {t.lockHint}
                </p>
              )}
            </div>

            {/* Quick Helper presets for speedier testing and playfulness on login */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {["l", "o", "v", "e"].map((char) => (
                <button
                  key={`preset-${char}`}
                  type="button"
                  onClick={() => {
                    audio.playTap();
                    setLockPin(p => p + char);
                  }}
                  className="bg-stone-50 hover:bg-rose-50 border border-stone-200/30 text-stone-700 text-xs font-black py-2.5 rounded-xl cursor-pointer hover:border-[#ad292f]/30 transition-all active:scale-95"
                >
                  {char}
                </button>
              ))}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  audio.playTap();
                  setLockPin("");
                }}
                className="w-1/3 bg-stone-55 hover:bg-stone-100 text-stone-500 py-4 rounded-2.5xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                {lang === "zh" ? "重置" : "Clear"}
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#ad292f] hover:bg-[#ad292f]/95 text-white py-4 rounded-2.5xl text-xs font-black shadow-lg shadow-rose-250 transition-all hover:scale-[1.01] active:scale-99 cursor-pointer"
              >
                {t.unlockBtn}
              </button>
            </div>
          </form>

          {/* Miniature footer branding */}
          <div className="border-t border-stone-100 pt-5 flex items-center justify-center gap-1.5 text-[9.5px] text-stone-400 font-semibold select-all">
            <ShieldCheck size={12} className="text-[#ad292f]" />
            <span>AI Studio Secure Passcode Protocol Layer Verified</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${curTheme.softBg} transition-colors duration-500 pb-24 flex flex-col`}>
      
      {/* 1. ROOMY AIRY FLOATING GLASS HEADER - STITCH & SILK MINIMALIST DESIGN */}
      <header id="scrapbook-main-header" className="bg-[#fcfbfa]/95 backdrop-blur-xl border-b border-stone-200/25 py-5 px-4 md:px-8 sticky top-0 z-50 shadow-[0_2px_12px_rgba(0,0,0,0.02)] select-none">
        <div className="max-w-4xl mx-auto flex flex-row justify-between items-center">
          
          {/* Left Block: Modern Elegant Heart Beat Icon next to Serif Title */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div 
              className="w-[52px] h-[52px] rounded-2xl bg-rose-50 flex items-center justify-center text-[#ad292f] shrink-0 border border-rose-100 shadow-[0_4px_12px_rgba(173,41,47,0.05)] animate-heartbeat"
            >
              <Heart size={22} fill="#ad292f" className="text-[#ad292f]" />
            </div>

            {/* Serif Typography matching the style target precisely */}
            <div className="flex flex-col min-w-0">
              <h1 className="font-serif text-xl sm:text-2.5xl font-black text-[#ad292f] tracking-[0.03em] leading-none">
                {daysCount} {profile.language === 'zh' ? '天' : 'DAYS'}
              </h1>
              <span className="text-[10px] tracking-widest text-stone-400 font-sans uppercase font-semibold mt-1.5 whitespace-nowrap leading-none">
                {profile.language === 'zh' ? '岁 月 见 证 • 精 心 自 传' : 'OUR JOURNEY TIMELINE'}
              </span>
            </div>
          </div>

          {/* Right Block: Pure Overlapping Avatars in circle frames */}
          <div className="flex items-center -space-x-3 shrink-0">
            <div className="w-[48px] h-[48px] rounded-full border border-stone-200/50 overflow-hidden shadow-sm hover:scale-110 active:scale-95 hover:z-30 transition-all duration-300 bg-[#FAF8F5] p-0.5 shrink-0 z-20">
              <img
                src={profile.partner1Avatar}
                className="w-full h-full rounded-full object-cover"
                alt={profile.partner1Name}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="w-[48px] h-[48px] rounded-full border border-stone-200/50 overflow-hidden shadow-sm hover:scale-110 active:scale-95 hover:z-30 transition-all duration-300 bg-[#FAF8F5] p-0.5 shrink-0 z-10">
              <img
                src={profile.partner2Avatar}
                className="w-full h-full object-cover rounded-full"
                alt={profile.partner2Name}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

        </div>
      </header>

      {/* Primary content card stage with spacious margins */}
      <main id="scrapbook-main-stage" className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activeTab === "timeline" && (
              <TimelineTab
                posts={posts}
                profile={profile}
                onUpdatePosts={setPosts}
                language={lang}
                openAddTrigger={timelineAddTrigger}
                events={events}
                onUpdateEvents={setEvents}
              />
            )}
            {activeTab === "diary" && (
              <DiaryTab
                entries={entries}
                profile={profile}
                posts={posts} // Passes database history so Gemini Memory Oracle can read custom entries (#5)
                onUpdateEntries={setEntries}
                language={lang}
                openAddTrigger={diaryAddTrigger}
              />
            )}
            {activeTab === "profile" && (
              <ProfileTab
                profile={profile}
                onUpdateProfile={setProfile}
                language={lang}
                onLogout={() => setIsLocked(true)} // Links cleanly to secure gate locker (#9)
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 6. 7. Beautiful Particle Heart Overlay container */}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        <AnimatePresence>
          {heartParticles.map((pt) => (
            <motion.div
              key={pt.id}
              initial={{ 
                opacity: 1, 
                scale: 0.2, 
                x: pt.x, 
                y: pt.y, 
                rotate: pt.rotation 
              }}
              animate={{ 
                opacity: [1, 1, 0],
                scale: [0.3, pt.scale, pt.scale * 0.8],
                x: pt.x + (Math.random() * 120 - 60),
                y: pt.y - 200 - (Math.random() * 140),
                rotate: pt.rotation + (Math.random() * 100 - 50)
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1.6, 
                ease: "easeOut" 
              }}
              onAnimationComplete={() => {
                setHeartParticles(prev => prev.filter(p => p.id !== pt.id));
              }}
              className="absolute text-2.5xl filter drop-shadow-md select-none pointer-events-none"
            >
              {pt.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Bottom Navigation Menu with responsive spacing */}
      <nav id="scrapbook-bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-rose-100/40 shadow-[0_-4px_16px_rgba(115,88,88,0.03)] py-3 select-none z-[60]">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1 px-4">
          
          {/* Tab 1: Home/Timeline */}
          <button
            id="tab-btn-timeline"
            onClick={() => {
              audio.playTap();
              setActiveTab("timeline");
            }}
            className={`flex flex-col items-center py-2 transition-all text-xs font-bold leading-none gap-1.5 rounded-2xl ${
              activeTab === "timeline"
                ? `${curTheme.accentText} bg-rose-50/40`
                : "text-gray-400 hover:text-gray-600 hover:bg-rose-50/10"
            }`}
          >
            <Heart size={18} fill={activeTab === "timeline" ? "currentColor" : "none"} />
            <span>{t.timelineTab}</span>
          </button>

          {/* Tab 2: Lined Notebook Diary */}
          <button
            id="tab-btn-diary"
            onClick={() => {
              audio.playTap();
              setActiveTab("diary");
            }}
            className={`flex flex-col items-center py-2 transition-all text-xs font-bold leading-none gap-1.5 rounded-2xl ${
              activeTab === "diary"
                ? `${curTheme.accentText} bg-rose-50/40`
                : "text-gray-400 hover:text-gray-600 hover:bg-rose-50/10"
            }`}
          >
            <Sparkles size={18} fill={activeTab === "diary" ? "currentColor" : "none"} />
            <span>{t.diaryTab}</span>
          </button>

          {/* Tab 3: Sync Preferences & Profile */}
          <button
            id="tab-btn-profile"
            onClick={() => {
              audio.playTap();
              setActiveTab("profile");
            }}
            className={`flex flex-col items-center py-2 transition-all text-xs font-bold leading-none gap-1.5 rounded-2xl ${
              activeTab === "profile"
                ? `${curTheme.accentText} bg-rose-50/40`
                : "text-gray-400 hover:text-gray-600 hover:bg-rose-50/10"
            }`}
          >
            <Settings size={18} fill={activeTab === "profile" ? "currentColor" : "none"} />
            <span>{t.profileTab}</span>
          </button>

        </div>
      </nav>

      {/* Persistent global floating action button (+ FAB) - Resident on every page */}
      {activeTab === "timeline" && (
        <motion.button
          id="global-floating-add-btn"
          onClick={handleGlobalAdd}
          whileHover={{ scale: 1.12, rotate: 90 }}
          whileTap={{ scale: 0.92 }}
          className={`fixed bottom-24 right-5 sm:right-8 z-[70] w-14 h-14 rounded-full bg-gradient-to-tr ${curTheme.gradient} text-white shadow-lg ${curTheme.glow} flex items-center justify-center cursor-pointer border border-white/20 hover:shadow-xl transition-shadow`}
          aria-label="Add Content"
        >
          <Plus size={26} className="stroke-[3]" />
        </motion.button>
      )}
    </div>
  );
}
