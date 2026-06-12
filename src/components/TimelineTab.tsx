        // Fallback: base64 data URL (persistent, unlike blob URLs)
        const reader = new FileReader();
        reader.onload = (ev) => addMediaItem(String(ev.target?.result || ''), "video");
        reader.readAsDataURL(file);t";
import { TimelinePost, ProfileSettings, Comment, CalendarEvent } from "../types";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Sparkles, 
  Plus, 
  Image, 
  Smile, 
  Trash2, 
  BookOpen, 
  LayoutList, 
  FileText, 
  X, 
  Stamp, 
  Feather,
  Sparkle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Cake,
  Gift,
  MapPin,
  Mic,
  MicOff,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { audio } from "../utils/audio";

interface TimelineTabProps {
  posts: TimelinePost[];
  profile: ProfileSettings;
  onUpdatePosts: (posts: TimelinePost[]) => void;
  language: "zh" | "en";
  openAddTrigger?: number;
  events?: CalendarEvent[];
  onUpdateEvents?: (events: CalendarEvent[]) => void;
}

export default function TimelineTab({ 
  posts, 
  profile, 
  onUpdatePosts, 
  language, 
  openAddTrigger,
  events = [],
  onUpdateEvents = () => {}
}: TimelineTabProps) {
  const [viewStyle, setViewStyle] = useState<"stream" | "calendar" | "diary">(() => {
    return (localStorage.getItem("couple_view_style") as "stream" | "calendar" | "diary") || "stream";
  }); // Toggle view style (#4) — persisted to localStorage
  const [diaryBookIndex, setDiaryBookIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [showToc, setShowToc] = useState(false);

  // 3. Calendar view integrated states
  const todayStr = new Date().toISOString().slice(0, 10);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(""); // MM-DD for anniversary, YYYY-MM-DD for others
  const [newEventMonth, setNewEventMonth] = useState("01");
  const [newEventDay, setNewEventDay] = useState("01");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventLoc, setNewEventLoc] = useState("");
  const [newEventType, setNewEventType] = useState<"anniversary" | "birthday" | "custom">("anniversary");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAnniversariesOnly, setShowAnniversariesOnly] = useState(false);
  const [commentEventInputs, setCommentEventInputs] = useState<Record<string, string>>({});
  const [commentPostInputs, setCommentPostInputs] = useState<Record<string, string>>({});
  const [commentPendingMedia, setCommentPendingMedia] = useState<Record<string, {url: string; type: "image"|"video"}>>({});
  const [commentListeningId, setCommentListeningId] = useState<string | null>(null);
  const commentRecognitionRef = React.useRef<any>(null);
  const [likeAnimEventId, setLikeAnimEventId] = useState<string | null>(null);
  const [streamSearchQuery, setStreamSearchQuery] = useState("");
  const [streamSearchResult, setStreamSearchResult] = useState<string | null>(null);
  const [streamMatchedPosts, setStreamMatchedPosts] = useState<typeof posts>([]);
  const [isStreamSearching, setIsStreamSearching] = useState(false);
  const [calendarListTab, setCalendarListTab] = useState<"records" | "anniversaries">("records");
  const [scrollToPostId, setScrollToPostId] = useState<string | null>(null);
  const [newPostMediaItems, setNewPostMediaItems] = useState<{url: string; type: "image"|"video"; preview?: string}[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const calendarT = {
    zh: {
      daysOfLove: "岁月的誓言 (纪念日)",
      anniversary: "白首誓盟",
      birthday: "Ta的生辰",
      custom: "甜蜜约期",
      addEvent: "立下一约",
      titleLabel: "约定里程碑事件",
      dateLabel: "誓誓之日",
      descLabel: "浪漫絮语/约定备注",
      locLabel: "同游地点",
      publish: "镌刻入历",
      daysLeft: "天后到来",
      yesterdayEvent: "已甜蜜同度",
      todayEvent: "就在今天！幸福满格 💖",
      upcomingLabel: "即将到来的誓约时刻",
      aiInsight: "AI 纪念日温存回顾",
      runAiInsight: "由 Gemini 回应温存记忆 ✨",
      loadingAi: "Gemini 正在抚弄记忆的竖琴...",
      placeholderInsight: "每一个誓之日，都载着你们的欢笑。点击下方按钮，让 Gemini 自动提取检索你们之前发布过的心动点滴，做一次浪漫温馨的小结合集...",
      dayMemoryTitle: "那一天的浪漫羁绊",
      noMemoryForDay: "那天没有写下日记或发布照片呢，要不要现在记下一笔？✨",
      backToAll: "返回全部纪念日列表"
    },
    en: {
      daysOfLove: "Love Milestones Calendar",
      anniversary: "Eternal Anniversary",
      birthday: "Beloved Birthday",
      custom: "Special Handshake Date",
      addEvent: "Pledge a Date",
      titleLabel: "Milestone Name",
      dateLabel: "Pledge Date",
      descLabel: "Love note / Reminder",
      locLabel: "Romantic Location",
      publish: "Engrave on Calendar",
      daysLeft: "days countdown",
      yesterdayEvent: "passed cozy day",
      todayEvent: "TODAY! COZY DAY 💖",
      upcomingLabel: "Upcoming Memorial Days",
      aiInsight: "Gemini Anniversary Retrospective",
      runAiInsight: "Let Gemini recall our milestones ✨",
      loadingAi: "Gemini is humming memory chords...",
      placeholderInsight: "Click the trigger to run Gemini on server-side to summarize past events details regarding this season.",
      dayMemoryTitle: "Sweet Whispers of That Day",
      noMemoryForDay: "No local posts found on this exact date.",
      backToAll: "Show All General Memorials"
    }
  }[language];

  const monthNames = {
    zh: [
      "一月 春熙", "二月 融雪", "三月 微阳", "四月 碧野", "五月 蔷薇", "六月 蝉鸣",
      "七月 浅夏", "八月 麦芒", "九月 醉秋", "十月 红枫", "十一月 凝霜", "十二月 瑞雪"
    ],
    en: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
  }[language];

  const daysOfWeek = {
    zh: ["日", "一", "二", "三", "四", "五", "六"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  }[language];

  const calculateDaysLeft = (eventDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Support both MM-DD (recurring yearly) and YYYY-MM-DD (fixed date)
    const isRecurring = /^\d{2}-\d{2}$/.test(eventDateStr);
    if (isRecurring) {
      const [mm, dd] = eventDateStr.split("-").map(Number);
      let thisYear = new Date(today.getFullYear(), mm - 1, dd);
      thisYear.setHours(0, 0, 0, 0);
      if (thisYear.getTime() < today.getTime()) {
        thisYear = new Date(today.getFullYear() + 1, mm - 1, dd);
        thisYear.setHours(0, 0, 0, 0);
      }
      const diffDays = Math.round((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return calendarT.todayEvent;
      return `${diffDays} ${calendarT.daysLeft}`;
    }
    const evDate = new Date(eventDateStr + "T12:00:00");
    const diffDays = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return calendarT.todayEvent;
    if (diffDays < 0) return `${Math.abs(diffDays)} ${calendarT.yesterdayEvent}`;
    return `${diffDays} ${calendarT.daysLeft}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayIndex = date.getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, fullDate: "" });
    }

    for (let i = 1; i <= numDays; i++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      days.push({ day: i, fullDate: `${year}-${monthStr}-${dayStr}` });
    }

    return days;
  };

  // Stream AI search
  const handleStreamSearch = async () => {
    const q = streamSearchQuery.trim();
    if (!q) return;
    setIsStreamSearching(true);
    setStreamSearchResult(null);
    try {
      // Client-side pre-filter: find posts whose content contains the query
      const qLower = q.toLowerCase();
      const directMatches = posts.filter(p =>
        p.content?.toLowerCase().includes(qLower) ||
        p.author?.toLowerCase().includes(qLower) ||
        p.mood?.toLowerCase().includes(qLower) ||
        p.timestamp?.slice(0, 10).includes(qLower)
      );
      // Build summary: direct matches first, then all posts as context
      const formatPost = (p: typeof posts[0]) =>
        `[${p.timestamp.slice(0, 10)}] ${p.author}: ${p.content.slice(0, 200)}${p.imageUrl ? " [有图]" : ""}${p.videoUrl ? " [有视频]" : ""}${p.mood ? ` 心情:${p.mood}` : ""}`;
      const matchSummary = directMatches.map(formatPost).join("\n");
      const allSummary = posts.map(formatPost).join("\n");
      const hasDirectMatches = directMatches.length > 0;
      const locatePrompt = language === "zh"
        ? hasDirectMatches
          ? `在我们的时光记录里，找到了以下与"${q}"相关的${directMatches.length}条记录：\n${matchSummary}\n\n请用温暖的语气总结这些记录，并给一句感人的结语。`
          : `请在以下所有时光记录中搜索与"${q}"相关的内容，如有匹配请列出（最多5条），若无匹配请温柔告知。记录如下：\n${allSummary}`
        : hasDirectMatches
          ? `Found ${directMatches.length} entries matching "${q}" in our timeline:\n${matchSummary}\n\nPlease summarize warmly and add a loving closing line.`
          : `Search our timeline for "${q}" and list up to 5 matching entries (date, author, summary). Records:\n${allSummary}`;
      const resp = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: locatePrompt }],
          language, partner1: profile.partner1Name, partner2: profile.partner2Name,
          posts: [], entries: []
        })
      });
      const data = await resp.json();
      // Prepend direct match count for clarity
      const prefix = hasDirectMatches
        ? (language === "zh" ? `🔍 找到 ${directMatches.length} 条相关记录\n\n` : `🔍 Found ${directMatches.length} matching records\n\n`)
        : "";
      setStreamMatchedPosts(directMatches);
      setStreamSearchResult(prefix + data.reply);
    } catch {
      setStreamSearchResult(language === "zh" ? "搜索失败，请重试 🐾" : "Search failed, please retry 🐾");
    } finally {
      setIsStreamSearching(false);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentThemeYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const setCurrentThemeYear = (y: number) => {
    setCurrentYear(y);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const computedDate = newEventType === "anniversary"
      ? `${newEventMonth}-${newEventDay}`
      : newEventDate;
    if (!newEventTitle.trim() || !computedDate) return;

    const ev = {
      id: `event-${Date.now()}`,
      title: newEventTitle.trim(),
      date: computedDate,
      description: newEventDesc.trim() || "White lilies, coffee aroma and heartbeats aligned.",
      location: newEventLoc.trim() || undefined,
      eventType: newEventType,
      likes: 0,
      likedByUser: false
    };

    onUpdateEvents([...events, ev]);
    setNewEventTitle("");
    setNewEventDesc("");
    setNewEventLoc("");
    setShowAddEventForm(false);
  };

  const handleDeleteEvent = (id: string) => {
    onUpdateEvents(events.filter(ev => ev.id !== id));
  };

  const handleToggleEventLike = (eventId: string) => {
    const updated = events.map(ev => {
      if (ev.id === eventId) {
        const liked = !ev.likedByUser;
        if (liked) {
          audio.playHeart();
          setLikeAnimEventId(eventId);
          setTimeout(() => setLikeAnimEventId(null), 600);
        } else {
          audio.playTap();
        }
        return { ...ev, likedByUser: liked, likes: Math.max(0, (ev.likes || 0) + (liked ? 1 : -1)) };
      }
      return ev;
    });
    onUpdateEvents(updated);
  };

  const handleAddPostComment = (postId: string) => {
    const text = commentPostInputs[postId]?.trim();
    const pendingMedia = commentPendingMedia[postId];
    if (!text && !pendingMedia) return;
    const newComment: Comment = {
      id: `pc-${Date.now()}`,
      author: profile.partner1Name,
      avatar: profile.partner1Avatar || "",
      content: text || "",
      timestamp: new Date().toISOString(),
      ...(pendingMedia ? { mediaUrl: pendingMedia.url, mediaType: pendingMedia.type } : {})
    };
    const updated = posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p);
    onUpdatePosts(updated);
    setCommentPostInputs(prev => ({ ...prev, [postId]: "" }));
    setCommentPendingMedia(prev => { const n = { ...prev }; delete n[postId]; return n; });
    audio.playTap();
  };

  const handleAddEventComment = (eventId: string) => {
    const text = commentEventInputs[eventId]?.trim();
    const pendingMedia = commentPendingMedia[eventId];
    if (!text && !pendingMedia) return;
    const newComment = {
      id: `ec-${Date.now()}`,
      author: profile.partner1Name,
      content: text || "",
      timestamp: new Date().toISOString(),
      ...(pendingMedia ? { mediaUrl: pendingMedia.url, mediaType: pendingMedia.type } : {})
    };
    const updated = events.map(ev => {
      if (ev.id === eventId) {
        return { ...ev, comments: [...(ev.comments || []), newComment] };
      }
      return ev;
    });
    onUpdateEvents(updated);
    setCommentEventInputs(prev => ({ ...prev, [eventId]: "" }));
    setCommentPendingMedia(prev => { const n = { ...prev }; delete n[eventId]; return n; });
    audio.playTap();
  };



  const getMemoriesByDate = (dateStr: string) => {
    const postsMatching = posts.filter(p => p.timestamp?.startsWith(dateStr));
    return { postsMatching };
  };

  const playPageTurnSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.27);
    } catch (e) {
      // elegant pass-through
    }
  };

  const handlePrevPage = () => {
    if (diaryBookIndex > 0) {
      setFlipDirection("prev");
      setDiaryBookIndex((prev) => prev - 1);
      playPageTurnSound();
    }
  };

  const handleNextPage = () => {
    if (posts && diaryBookIndex < posts.length - 1) {
      setFlipDirection("next");
      setDiaryBookIndex((prev) => prev + 1);
      playPageTurnSound();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewStyle !== "diary") return;
      if (e.key === "ArrowLeft") {
        handlePrevPage();
      } else if (e.key === "ArrowRight") {
        handleNextPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewStyle, diaryBookIndex, posts?.length]);

  // Persist viewStyle to localStorage
  useEffect(() => {
    localStorage.setItem("couple_view_style", viewStyle);
  }, [viewStyle]);

  // Scroll-to-top visibility — only active in stream view
  useEffect(() => {
    if (viewStyle !== "stream") { setShowScrollTop(false); return; }
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewStyle]);

  const [newPostContent, setNewPostContent] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  const startListening = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechError(language === "zh" ? "您的浏览器暂不支持语音识别，请使用 Chrome 等现代浏览器。" : "Voice recognition is not supported in this browser. Please try Chrome.");
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === "zh" ? "zh-CN" : "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setNewPostContent((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError(language === "zh" ? "麦克风权限未允许，请在浏览器中开启" : "Microphone permission denied.");
        } else {
          setSpeechError(language === "zh" ? `识别失败: ${event.error}` : `Error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error(e);
      setSpeechError(e.message || "Failed to start recognition");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  const [newPostImage, setNewPostImage] = useState("");
  const [newPostVideo, setNewPostVideo] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [newPostAuthor, setNewPostAuthor] = useState<"partner1" | "partner2">("partner1");
  const [newPostMood, setNewPostMood] = useState("In Love");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  
  const [showAddForm, setShowAddForm] = useState(false); // Envelope publisher modal (#3)
  const [isUploading, setIsUploading] = useState(false);

  // 1. Unified state variables for milestone configurations inside the single form
  const [newPostDate, setNewPostDate] = useState(todayStr);
  const [newPostIsMilestone, setNewPostIsMilestone] = useState(false);
  const [newPostMilestoneType, setNewPostMilestoneType] = useState<"anniversary" | "birthday" | "custom">("custom");
  const [newPostMilestoneTitle, setNewPostMilestoneTitle] = useState("");
  const [newPostMilestoneLocation, setNewPostMilestoneLocation] = useState("");
  const [retrospectiveDate, setRetrospectiveDate] = useState(todayStr);

  // Keep retroactive post date and selected grid cell in sync
  useEffect(() => {
    if (selectedDate) {
      setNewPostDate(selectedDate);
    }
  }, [selectedDate]);

  // Handle turning off microphone safely if envelope is closed or completed
  useEffect(() => {
    if (!showAddForm) {
      if (isListening) {
        stopListening();
      }
      setSpeechError(null);
    }
  }, [showAddForm]);

  // Derived calendar events from posts array dynamically
  const calendarEvents = (posts || [])
    .filter(p => p.isMilestone)
    .map(p => ({
      id: p.id,
      title: p.milestoneTitle || p.content.slice(0, 24),
      date: p.timestamp?.slice(0, 10),
      description: p.content,
      location: p.milestoneLocation,
      eventType: p.milestoneType || "custom"
    }));

  const prevTriggerRef = useRef(openAddTrigger ?? 0);
  useEffect(() => {
    const cur = openAddTrigger ?? 0;
    // Only open when trigger strictly increases (prevents false-open on mount/tab-switch)
    if (cur > prevTriggerRef.current) {
      setShowAddForm(true);
    }
    prevTriggerRef.current = cur;
  }, [openAddTrigger]);

  // Scroll to a specific post in stream view after AI search result click
  useEffect(() => {
    if (!scrollToPostId) return;
    // Delay to let AnimatePresence exit animation finish (~300ms) before scrolling
    const timer = setTimeout(() => {
      const el = document.getElementById(`post-${scrollToPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.transition = "box-shadow 0.3s ease";
        el.style.boxShadow = "0 0 0 3px #ad292f, 0 8px 30px rgba(173,41,47,0.25)";
        setTimeout(() => {
          el.style.boxShadow = "";
          setScrollToPostId(null);
        }, 2200);
      } else {
        setScrollToPostId(null);
      }
    }, 380);
    return () => clearTimeout(timer);
  }, [scrollToPostId]);

  const [aiSummary, setAiSummary] = useState<string>(() => {
    return language === "zh"
      ? "✨ 暮色爱意：在你们点滴写下的温暖记忆里，流淌着脉脉温情。今天也是充满偏爱与温柔的一天。"
      : "✨ Love Index: In every written memory, there lies a sweet whisper of affection. Today is soft, sweet, and forever yours.";
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const t = {
    zh: {
      timelineHeader: "故事长廊",
      timelineSub: `已封存了 ${posts.length} 段心动时刻 ✨`,
      addMoment: "写新瞬间",
      viewModeStream: "时光线",
      viewModeDiary: "翻页本",
      postPlaceholder: "写下你和 Ta 的温暖瞬间…… ☕",
      imageUrlLabel: "定格画面链接 (图片 URL)",
      authorLabel: "记叙人",
      moodLabel: "此刻心情",
      justNow: "刚刚",
      shareBtn: "落笔留香 💖",
      likes: "喜欢",
      comments: "回应",
      writeComment: "写下你的回应...",
      aiMemorySummary: "AI 甜度提纯",
      aiSummaryPrompt: "让 Generative AI 润笔 ✨",
      aiLoading: "正在字斟句酌中...",
      toastSuccess: "已写好，锁进时光盒 ✨",
      noTimeline: "还没有故事，写下你们的第一行诗句吧…… 🧸",
      letterStamp: "心动邮票",
      letterTitle: "致我的挚爱 💌",
      cancel: "取消"
    },
    en: {
      timelineHeader: "Our Shared Chronicles",
      timelineSub: `You have safely locked ${posts.length} chapters of shared heartbeat in your vault ✨`,
      addMoment: "Ink a Memory",
      viewModeStream: "Chronology Stream",
      viewModeDiary: "Decade Diary Book",
      postPlaceholder: "Write down a cozy moment shared with your love... like balcony coffee discussions or baking experiments ☕",
      imageUrlLabel: "Snapshot URL (Optional local/web image link)",
      authorLabel: "Written By",
      moodLabel: "Current Mood",
      justNow: "JUST NOW",
      shareBtn: "Publish to Eternity 💖",
      likes: "adored",
      comments: "chats",
      writeComment: "Leave a cozy reply...",
      aiMemorySummary: "Gemini Relationship Insight",
      aiSummaryPrompt: "Let Gemini extract our relationship energy today ✨",
      aiLoading: "Gemini is analyzing your sweet ink...",
      toastSuccess: "Saved to eternity catalog successfully!",
      noTimeline: "No chapters locked yet. Be the first to start your romance chronicle! 🧸",
      letterStamp: "VALENTINE STAMP",
      letterTitle: "To: My Absolute Companion 💌",
      cancel: "Fold Envelope"
    }
  }[language];

  const handleGenerateRetrospective = async () => {
    setIsAiLoading(true);
    setAiSummary("");

    // Filter posts for this month and day in history
    const d = new Date(retrospectiveDate);
    const m = d.getMonth();
    const dayVal = d.getDate();
    const retrospectiveMonth = m + 1; // 1-based
    const mmdd = String(retrospectiveMonth).padStart(2, "0") + "-" + String(dayVal).padStart(2, "0");

    const historicalPosts = posts.filter(p => {
      const pDate = new Date(p.timestamp);
      return pDate.getMonth() === m && pDate.getDate() === dayVal;
    });

    // Also find anniversaries/events that occur on this month+day
    const relevantEvents = events.filter(ev => {
      if (/^\d{2}-\d{2}$/.test(ev.date)) {
        return ev.date === mmdd;
      }
      const evDate = new Date(ev.date + "T12:00:00");
      return evDate.getMonth() + 1 === retrospectiveMonth && evDate.getDate() === dayVal;
    });

    try {
      const response = await fetch("/api/ai-summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "calendar",
          items: historicalPosts.map(p => ({
            author: p.author,
            content: p.content,
            date: p.timestamp?.slice(0, 10)
          })),
          events: relevantEvents.map(ev => ({
            title: ev.title,
            date: ev.date,
            description: ev.description,
            eventType: ev.eventType,
            location: ev.location || ""
          })),
          language,
          partner1: profile.partner1Name,
          partner2: profile.partner2Name
        }),
      });
      const data = await response.json();
      setAiSummary(data.summary);
    } catch (error) {
      console.error("AI retrospective failed", error);
      setAiSummary(language === "zh" ? "✨ 抚弄记忆琴弦失败，但我们的爱意依旧脉脉长青。" : "✨ AI Retrospective calibration failed, but our love remains timeless.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const [likeParticles, setLikeParticles] = useState<Array<{id: string; postId: string; x: number; y: number}>>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<"image" | "video">("image");

  const handleToggleLike = (postId: string, e?: React.MouseEvent) => {
    audio.playHeart();
    // Likes are cumulative — always add, never subtract
    const updated = posts.map(p => {
      if (p.id === postId) {
        return { ...p, likedByUser: true, likes: p.likes + 1 };
      }
      return p;
    });
    onUpdatePosts(updated);
    // Spawn floating heart particle
    if (e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const particle = { id: `lp-${Date.now()}-${Math.random()}`, postId, x: rect.left + rect.width / 2, y: rect.top };
      setLikeParticles(prev => [...prev, particle]);
      setTimeout(() => setLikeParticles(prev => prev.filter(p => p.id !== particle.id)), 1200);
    }
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    const pendingMedia = commentPendingMedia[postId];
    if (!text && !pendingMedia) return;

    // Use current settings profile to assign commentator profile info
    const commentatorName = profile.partner1Name;
    const commentatorAvatar = profile.partner1Avatar;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: commentatorName,
      avatar: commentatorAvatar,
      content: text || "",
      timestamp: new Date().toISOString(),
      ...(pendingMedia ? { mediaUrl: pendingMedia.url, mediaType: pendingMedia.type } : {})
    };

    const updated = posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    });

    onUpdatePosts(updated);
    setCommentInputs({ ...commentInputs, [postId]: "" });
    setCommentPendingMedia(prev => { const n = { ...prev }; delete n[postId]; return n; });
  };

  const handleDeletePost = (postId: string) => {
    onUpdatePosts(posts.filter(p => p.id !== postId));
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;
    
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) {
      alert(language === 'zh' ? "只支持常见照片或视频格式哦！" : "Only standard photo or video formats are supported!");
      return;
    }
    
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewDataUrl = event.target?.result as string;
        const img = new window.Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 900;
          const MAX_HEIGHT = 900;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { addMediaItem(previewDataUrl, "image", previewDataUrl); return; }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          // Always upload to Cloudinary (avoids storing large base64 in DB)
          canvas.toBlob(async (blob) => {
              if (!blob) { addMediaItem(dataUrl, "image", dataUrl); return; }
              setIsUploading(true);
              const fd = new FormData();
              fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
              try {
                const res = await fetch("/api/upload-media", { method: "POST", body: fd });
                const d = await res.json();
                addMediaItem(d.url, "image", dataUrl);
              } catch {
                addMediaItem(dataUrl, "image", dataUrl);
              } finally {
                setIsUploading(false);
              }
            }, "image/jpeg", 0.85);
          } else {
            addMediaItem(dataUrl, "image", dataUrl);
          }