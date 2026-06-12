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
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Coffee,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";


// Strip base64 data: URLs before saving — prevents localStorage quota crash and DB bloat
function stripBase64<T extends Record<string, any>>(items: T[]): T[] {
  return items.map(item => ({
    ...item,
    imageUrl: typeof item.imageUrl === "string" && item.imageUrl.startsWith("data:") ? undefined : item.imageUrl,
    videoUrl: typeof item.videoUrl === "string" && item.videoUrl.startsWith("data:") ? undefined : item.videoUrl,
    comments: Array.isArray(item.comments)
      ? item.comments.map((c: any) => ({
          ...c,
          mediaUrl: typeof c.mediaUrl === "string" && c.mediaUrl.startsWith("data:") ? undefined : c.mediaUrl,
        }))
      : item.comments,
  }));
}

export default function App() {
  // 10. Startup Loading Screen state
  const [appIsLoading, setAppIsLoading] = useState(true);

  // Synchronized Scrapbook Storage (localStorage for fast first paint)
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

  // DB ready flag — true after initial API load completes
  const [dbReady, setDbReady] = useState(false);
  // Debounce timers for DB sync
  const saveTimers = React.useRef<{ posts: any; events: any; diary: any; profile: any }>({
    posts: null, events: null, diary: null, profile: null,
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
      // Just switch to timeline — don't open the add form; FAB only visible on timeline anyway
      setActiveTab("timeline");
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
  const [showPin, setShowPin] = useState(false);
  const [showLoginHeart, setShowLoginHeart] = useState(false);

  // Dismiss Loading screen after 1.8s for smooth romance loading experience (#10)
  useEffect(() => {
    const loaderTimer = setTimeout(() => {
      setAppIsLoading(false);
    }, 1800);
    return () => clearTimeout(loaderTimer);
  }, []);

  // ── On mount: load fresh data from DB (overrides localStorage if DB has content) ──
  useEffect(() => {
    async function loadFromDB() {
      try {
        const [postsRes, eventsRes, diaryRes, profileRes] = await Promise.all([
          fetch("/api/posts"),
          fetch("/api/events"),
          fetch("/api/diary"),
          fetch("/api/profile"),
        ]);
        const [dbPosts, dbEvents, dbDiary, dbProfile] = await Promise.all([
          postsRes.json(),
          eventsRes.json(),
          diaryRes.json(),
          profileRes.json(),
        ]);

        // Only replace local data if DB has content
        if (Array.isArray(dbPosts) && dbPosts.length > 0) {
          setPosts(dbPosts);
          localStorage.setItem("couple_posts", JSON.stringify(dbPosts));
        }
        if (Array.isArray(dbEvents) && dbEvents.length > 0) {
          setEvents(dbEvents);
          localStorage.setItem("couple_events", JSON.stringify(dbEvents));
        }
        if (Array.isArray(dbDiary) && dbDiary.length > 0) {
          setEntries(dbDiary);
          localStorage.setItem("couple_diary_entries", JSON.stringify(dbDiary));
        }
        if (dbProfile && typeof dbProfile === "object" && (dbProfile as any).partner1Name) {
          setProfile(dbProfile as ProfileSettings);
          localStorage.setItem("couple_profile", JSON.stringify(dbProfile));
        }
        console.log("✅ Data loaded from Neon DB");
      } catch {
        console.log("ℹ️ DB not available — using localStorage");
      } finally {
        setDbReady(true);
      }
    }
    loadFromDB();
  }, []);

  // ── Keep localStorage in sync AND debounce-save to DB when dbReady ──
  useEffect(() => {
    try { localStorage.setItem("couple_profile", JSON.stringify(profile)); } catch { /* quota exceeded */ }
    if (!dbReady) return;
    clearTimeout(saveTimers.current.profile);
    saveTimers.current.profile = setTimeout(() => {
      fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      }).catch(() => {});
    }, 800);
  }, [profile, dbReady]);

  useEffect(() => {
    const safePosts = stripBase64(posts);
    try { localStorage.setItem("couple_posts", JSON.stringify(safePosts)); } catch { /* quota exceeded */ }
    if (!dbReady) return;
    clearTimeout(saveTimers.current.posts);
    saveTimers.current.posts = setTimeout(() => {
      fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: safePosts }),
      }).catch(() => {});
    }, 800);
  }, [posts, dbReady]);

  useEffect(() => {
    const safeEntries = stripBase64(entries);
    try { localStorage.setItem("couple_diary_entries", JSON.stringify(safeEntries)); } catch { /* quota exceeded */ }
    if (!dbReady) return;
    clearTimeout(saveTimers.current.diary);
    saveTimers.current.diary = setTimeout(() => {
      fetch("/api/diary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: safeEntries }),
      }).catch(() => {});
    }, 800);
  }, [entries, dbReady]);

  useEffect(() => {
    const safeEvents = stripBase64(events);
    try { localStorage.setItem("couple_events", JSON.stringify(safeEvents)); } catch { /* quota exceeded */ }
    if (!dbReady) return;
    clearTimeout(saveTimers.current.events);
    saveTimers.current.events = setTimeout(() => {
      fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: safeEvents }),
      }).catch(() => {});
    }, 800);
  }, [events, dbReady]);

  useEffect(() => {
    localStorage.setItem("couple_locked", JSON.stringify(isLocked));
  }, [isLocked]);

  // Scroll to top whenever the active tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [activeTab]);

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
      diaryTab: "AI分析",
      profileTab: "设置",
      loveGreeting: "相伴岁月长路 ✨",
      lockTitle: "秘密相册",
      lockDesc: "锁住了属于我们的甜蜜时刻，输入恋爱暗号开启 🗝️",
      lockHint: "初始默认暗号为 'love'",
      unlockBtn: "开启甜蜜档案 💖",
      appTitle: "爱情手帐",
      loaderGreeting: "开启恋爱编年史...",
      romanticNote: "两颗有趣的灵魂终会相遇。"
    },
    en: {
      daysTogether: "Days Together",
      daysSince: "Pledge Date",
      timelineTab: "Moments",
      diaryTab: "AI Analysis",
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
      setShowLoginHeart(true);
      setTimeout(() => {
        setIsLocked(false);
        setLockPin("");
        setLockError("");
        setShowPin(false);
        setShowLoginHeart(false);
      }, 1600);
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

  /* 9. FULL-PAGE LOCK / LOGIN SCREEN */
  if (isLocked || showLoginHeart) {
    return (
      <div
        className="min-h-screen w-full flex flex-col select-none relative"
        style={{
          background: "linear-gradient(160deg,#fff6f4 0%,#fdf0ee 45%,#f9ebe8 100%)",
          backgroundImage: "radial-gradient(circle at 20% 20%, rgba(173,41,47,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(173,41,47,0.04) 0%, transparent 50%)"
        }}
      >
        {/* Top strip */}
        <div className="w-full px-6 pt-8 pb-4 flex items-center justify-between">
          <span className="text-[10px] font-black text-[#ad292f]/50 tracking-widest uppercase font-mono">爱情手帐</span>
          <span className="text-[9px] font-bold bg-rose-100/60 text-[#ad292f]/70 px-2.5 py-1 rounded-full">💌 私密相册</span>
        </div>

        {/* Main content — vertically centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="w-full max-w-sm space-y-10 text-center"
          >
            {/* Hero heart + days count */}
            <div className="space-y-5">
              <button
                type="button"
                onClick={(e) => spawnHearts(e)}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#ad292f] to-rose-400 text-white flex items-center justify-center mx-auto shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer relative group animate-heartbeat"
              >
                <Heart size={30} fill="#ffffff" className="text-white" />
                <span className="absolute -top-1 -right-1 bg-amber-400 text-stone-900 text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                  +1💖
                </span>
              </button>

              <div className="space-y-1">
                <h1 className="font-serif text-5xl font-black text-[#ad292f] tracking-tight leading-none">
                  {daysCount}
                </h1>
                <p className="text-sm font-bold text-stone-500 tracking-widest uppercase">
                  {lang === "zh" ? "天相守" : "Days Together"}
                </p>
                <p className="text-[11px] text-stone-400 font-medium italic pt-1">
                  {lang === "zh" ? "锁住了属于我们的甜蜜时刻" : "Our private moments await you"}
                </p>
              </div>
            </div>

            {/* Password form */}
            <form onSubmit={handleUnlockGate} className="space-y-4 w-full">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                  {lang === "zh" ? "请输入解锁密语" : "Enter passcode"}
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    placeholder={lang === "zh" ? "输入解锁暗号..." : "Enter passcode..."}
                    value={lockPin}
                    onChange={(e) => { setLockPin(e.target.value); setLockError(""); }}
                    className="w-full text-center text-base p-4 pr-12 border-2 border-rose-100 focus:border-[#ad292f] bg-white/80 rounded-2xl outline-none transition-all font-black tracking-widest text-[#ad292f] shadow-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#ad292f] transition-colors p-1 cursor-pointer"
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {lockError && (
                  <p className="text-rose-600 text-[10px] text-center font-bold animate-bounce">{lockError}</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { audio.playTap(); setLockPin(""); }}
                  className="w-1/3 bg-white border border-stone-200 text-stone-500 py-4 rounded-2xl text-xs font-bold transition-all cursor-pointer hover:bg-stone-50 active:scale-95 shadow-sm"
                >
                  {lang === "zh" ? "重置" : "Clear"}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#ad292f] hover:bg-[#ad292f]/90 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-rose-200 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                >
                  {t.unlockBtn}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Bottom branding */}
        <div className="pb-8 flex items-center justify-center gap-1.5 text-[9px] text-stone-300 font-medium">
          <ShieldCheck size={11} className="text-[#ad292f]/40" />
          <span>爱情手帐 · 安全私密归档</span>
        </div>

        {/* Login heart burst overlay */}
        <AnimatePresence>
          {showLoginHeart && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-[500] pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(173,41,47,0.15) 0%, rgba(255,255,255,0.95) 70%)" }}
            >
              {/* Central large heart */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: [0, 1.3, 1.1], rotate: [0, 8, 0] }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-[#ad292f]"
              >
                <Heart size={80} fill="#ad292f" />
              </motion.div>
              {/* Floating mini hearts */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-[#ad292f]"
                  style={{ left: `${15 + i * 10}%`, top: `${30 + (i % 3) * 15}%` }}
                  initial={{ opacity: 0, y: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], y: -60 - i * 10, scale: [0, 1, 0.5] }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 1.0 }}
                >
                  <Heart size={12 + (i % 3) * 8} fill="#ad292f" />
                </motion.div>
              ))}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-[#ad292f] font-serif font-black text-lg"
              >
                {lang === "zh" ? "欢迎回来 💖" : "Welcome Back 💖"}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
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
              <h1 className="font-serif text-xl sm:text-2xl font-black text-[#ad292f] tracking-[0.03em] leading-none">
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
                onLogout={() => setIsLocked(true)}
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
              className="absolute text-2xl filter drop-shadow-md select-none pointer-events-none"
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
