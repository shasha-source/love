import React, { useState, useEffect } from "react";
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
  MicOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [viewStyle, setViewStyle] = useState<"stream" | "calendar" | "diary">("stream"); // Toggle view style (#4)
  const [diaryBookIndex, setDiaryBookIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");

  // 3. Calendar view integrated states
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed so 5 is June)
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("2026-06-24");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventLoc, setNewEventLoc] = useState("");
  const [newEventType, setNewEventType] = useState<"anniversary" | "birthday" | "custom">("custom");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [aiHighlight, setAiHighlight] = useState("");
  const [aiHighlightLoading, setAiHighlightLoading] = useState(false);

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
    const today = new Date("2026-06-12T00:00:00");
    const evDate = new Date(eventDateStr);
    
    const diffTime = evDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
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
    if (!newEventTitle.trim() || !newEventDate) return;

    const ev = {
      id: `event-${Date.now()}`,
      title: newEventTitle.trim(),
      date: newEventDate,
      description: newEventDesc.trim() || "White lilies, coffee aroma and heartbeats aligned.",
      location: newEventLoc.trim() || undefined,
      eventType: newEventType
    };

    onUpdateEvents([...events, ev]);
    setNewEventTitle("");
    setNewEventDesc("");
    setNewEventLoc("");
    setShowAddEventForm(false);
  };

  const handleDeleteEvent = (id: string) => {
    onUpdatePosts(posts.filter(p => p.id !== id));
  };

  const handleGetHighlight = async () => {
    setAiHighlightLoading(true);
    try {
      const response = await fetch("/api/ai-summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "calendar",
          items: events.map(e => ({ title: e.title, d: e.date, desc: e.description })),
          language,
          partner1: profile.partner1Name,
          partner2: profile.partner2Name
        }),
      });
      const data = await response.json();
      setAiHighlight(data.summary);
    } catch (error) {
      console.error("AI memorial review failed", error);
    } finally {
      setAiHighlightLoading(false);
    }
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

  // 1. Unified state variables for milestone configurations inside the single form
  const [newPostDate, setNewPostDate] = useState("2026-06-12");
  const [newPostIsMilestone, setNewPostIsMilestone] = useState(false);
  const [newPostMilestoneType, setNewPostMilestoneType] = useState<"anniversary" | "birthday" | "custom">("custom");
  const [newPostMilestoneTitle, setNewPostMilestoneTitle] = useState("");
  const [newPostMilestoneLocation, setNewPostMilestoneLocation] = useState("");
  const [retrospectiveDate, setRetrospectiveDate] = useState("2026-06-12");

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

  useEffect(() => {
    if (openAddTrigger && openAddTrigger > 0) {
      // Both stream + calendar trigger the same envelope form!
      setShowAddForm(true);
    }
  }, [openAddTrigger]);

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
    
    const historicalPosts = posts.filter(p => {
      const pDate = new Date(p.timestamp);
      return pDate.getMonth() === m && pDate.getDate() === dayVal;
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

  const handleToggleLike = (postId: string) => {
    const updated = posts.map(p => {
      if (p.id === postId) {
        const liked = !p.likedByUser;
        return {
          ...p,
          likedByUser: liked,
          likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1)
        };
      }
      return p;
    });
    onUpdatePosts(updated);
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    // Use current settings profile to assign commentator profile info
    const commentatorName = profile.partner1Name;
    const commentatorAvatar = profile.partner1Avatar;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: commentatorName,
      avatar: commentatorAvatar,
      content: text,
      timestamp: new Date().toISOString()
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
  };

  const handleDeletePost = (postId: string) => {
    onUpdatePosts(posts.filter(p => p.id !== postId));
  };

  const handleFileChange = (file: File) => {
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
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 900;
          const MAX_HEIGHT = 900;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            setNewPostImage(dataUrl);
            setNewPostVideo("");
          } else {
            setNewPostImage(event.target?.result as string);
            setNewPostVideo("");
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else if (isVideo) {
      if (file.size > 15 * 1024 * 1024) {
        alert(language === 'zh' ? "视频文件较大，建议选择 15MB 以内的视频以获得流利的使用体验哦！" : "Videos larger than 15MB are recommended to be smaller for fluid browser speeds.");
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewPostVideo(event.target?.result as string);
        setNewPostImage("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const currentAuthorName = newPostAuthor === "partner1" ? profile.partner1Name : profile.partner2Name;
    const currentAuthorAvatar = newPostAuthor === "partner1" ? profile.partner1Avatar : profile.partner2Avatar;

    // Build compute timestamp with a safe midday hour if date exists to keep calendar alignment perfectly neat
    const computedTimestamp = newPostDate ? new Date(`${newPostDate}T12:00:00`).toISOString() : new Date().toISOString();

    const p: TimelinePost = {
      id: `post-${Date.now()}`,
      author: currentAuthorName,
      authorKey: newPostAuthor,
      avatar: currentAuthorAvatar,
      content: newPostContent.trim(),
      imageUrl: newPostImage.trim() || undefined,
      videoUrl: newPostVideo.trim() || undefined,
      mood: newPostMood,
      likes: 0,
      likedByUser: false,
      comments: [],
      timestamp: computedTimestamp,
      isMilestone: newPostIsMilestone,
      milestoneType: newPostIsMilestone ? newPostMilestoneType : undefined,
      milestoneTitle: newPostIsMilestone ? (newPostMilestoneTitle.trim() || newPostContent.slice(0, 20)) : undefined,
      milestoneLocation: newPostIsMilestone ? (newPostMilestoneLocation.trim() || undefined) : undefined
    };

    onUpdatePosts([p, ...posts]);
    setNewPostContent("");
    setNewPostImage("");
    setNewPostVideo("");
    setNewPostIsMilestone(false);
    setNewPostMilestoneTitle("");
    setNewPostMilestoneLocation("");
    setShowAddForm(false);
    
    // Smooth custom Toast alert banner trigger
    setSuccessToast(t.toastSuccess);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  if (showAddForm) {
    return (
      <div className="space-y-6 pt-1 select-none">
        {/* Header Block with custom return button */}
        <div className="flex items-center justify-between pb-3.5 border-b border-rose-100 select-none">
          <button
            type="button"
            onClick={() => {
              audio.playTap();
              setShowAddForm(false);
            }}
            className="flex items-center gap-1.5 text-xs font-black text-white bg-[#ad292f] hover:bg-[#ad292f]/95 px-4.5 py-2.5 rounded-full transition-all active:scale-95 cursor-pointer shadow-md shadow-rose-100"
          >
            ← {language === "zh" ? "返回时光纪念册" : "Back to Moments"}
          </button>
          
          <div className="text-right">
            <h2 className="font-serif text-lg font-black text-stone-855 tracking-tight leading-none">
              {language === "zh" ? "写下新的时光纪念" : "New Memory Entry"}
            </h2>
            <span className="text-[9px] text-stone-400 font-mono font-bold tracking-widest block mt-1.5 uppercase">
              {language === "zh" ? "第 1945 天的恋人口述" : "OUR CHRONICLE • RETROSPECTIVE"}
            </span>
          </div>
        </div>

        {/* The beautiful publisher Card */}
        <div 
          className="bg-[#fefcf8] border-4 border-rose-100/30 rounded-[32px] p-6 sm:p-8 shadow-xl relative"
          style={{
            backgroundImage: "radial-gradient(#dfd7d7 0.7px, transparent 0.7px)",
            backgroundSize: "20px 20px"
          }}
        >
          {/* Envelope Red Ribbon header lines */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-650 via-white to-red-650 rounded-t-3xl bg-[length:25px_100%]" />

          {/* Decorative Stamp on the Right Top */}
          <div className="absolute top-6 right-6 w-20 h-24 border border-dashed border-[#ad292f]/50 p-1 bg-[#fffaf5] rotate-[4deg] shadow-xs hidden sm:block">
            <div className="w-full h-full bg-[#fae8e8] rounded-xs flex flex-col items-center justify-center relative border border-rose-250">
              <Stamp size={18} className="text-[#ad292f]/60" />
              <Heart size={10} fill="#ad292f" className="text-[#ad292f] absolute top-1 right-1" />
              <span className="text-[7px] font-bold text-gray-500 tracking-tighter uppercase mt-2">{t.letterStamp}</span>
              <span className="text-[8px] font-mono font-bold text-[#ad292f] mt-1">$ 13.14</span>
            </div>
          </div>

          <form onSubmit={(e) => {
            audio.playSuccess();
            handleCreatePost(e);
          }} className="space-y-6 pt-4 select-none relative z-10">
            <div className="border-b border-[#ad292f]/15 pb-4">
              <span className="text-[9px] uppercase font-black tracking-widest text-[#ad292f] block mb-1">
                MEMORIES & PLEDGES ARCHIVE
              </span>
              <h3 className="text-xl font-serif font-black text-gray-800 flex items-center gap-1.5">
                {t.letterTitle}
              </h3>
            </div>

            {/* Form Fields: Author Option */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#735858] uppercase tracking-wider">
                {t.authorLabel} • {language === "zh" ? "是谁记录的？" : "Who is writing?"}
              </label>
              <div className="grid grid-cols-2 gap-3 font-semibold text-xs text-stone-750">
                <button
                  type="button"
                  onClick={() => {
                    audio.playTap();
                    setNewPostAuthor("partner1");
                  }}
                  className={`p-3 rounded-2xl font-bold flex items-center gap-3 justify-center border-2 transition-all cursor-pointer ${
                    newPostAuthor === "partner1"
                      ? "border-[#ad292f] bg-[#fceae9] text-[#ad292f] scale-[1.01] shadow-xs"
                      : "border-stone-150 hover:bg-stone-50 text-stone-500 bg-white/40"
                  }`}
                >
                  <img src={profile.partner1Avatar} className="w-6 h-6 rounded-full object-cover ring-2 ring-white" alt="" referrerPolicy="no-referrer" />
                  <span>{profile.partner1Name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.playTap();
                    setNewPostAuthor("partner2");
                  }}
                  className={`p-3 rounded-2xl font-bold flex items-center gap-3 justify-center border-2 transition-all cursor-pointer ${
                    newPostAuthor === "partner2"
                      ? "border-[#ad292f] bg-[#fceae9] text-[#ad292f] scale-[1.01] shadow-xs"
                      : "border-stone-150 hover:bg-stone-50 text-stone-500 bg-white/40"
                  }`}
                >
                  <img src={profile.partner2Avatar} className="w-6 h-6 rounded-full object-cover ring-2 ring-white" alt="" referrerPolicy="no-referrer" />
                  <span>{profile.partner2Name}</span>
                </button>
              </div>
            </div>

            {/* Sub row - Mood & Photograph Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-[#735858] uppercase tracking-wider">
                  {t.moodLabel}
                </label>
                <select
                  value={newPostMood}
                  onChange={(e) => {
                    audio.playTap();
                    setNewPostMood(e.target.value);
                  }}
                  className="w-full text-xs p-3.5 border border-stone-200 rounded-2xl bg-white focus:border-[#ad292f] outline-none font-bold text-gray-700"
                >
                  <option value="In Love">🥰 浓情蜜意 (In Love)</option>
                  <option value="Happy">😊 欢欣鼓舞 (Happy)</option>
                  <option value="Peaceful">🍃 恬静和美 (Peaceful)</option>
                  <option value="Playful">🦊 调皮搞怪 (Playful)</option>
                  <option value="Miss You">🐰 疯狂想念 (Miss You)</option>
                </select>
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="block text-[11px] font-bold text-[#735858] uppercase tracking-wider">
                  {language === "zh" ? "定格瞬间 (系统照片/视频)" : "Snapshot (System Photos/Videos)"}
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    audio.playTap();
                    document.getElementById("media-file-input")?.click();
                  }}
                  className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[110px] ${
                    isDragging
                      ? "border-[#ad292f] bg-[#fceae9]/50"
                      : (newPostImage || newPostVideo)
                      ? "border-emerald-300 bg-emerald-50/20"
                      : "border-stone-200 hover:border-[#ad292f]"
                  }`}
                >
                  <input
                    id="media-file-input"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {/* Preview selected media */}
                  {newPostImage ? (
                    <div className="relative group w-full flex items-center justify-between bg-white/90 p-2 rounded-xl border border-rose-100">
                      <div className="flex items-center gap-2">
                        <img src={newPostImage} className="w-14 h-10 object-cover rounded-lg border border-gray-100" />
                        <div className="text-left font-sans font-semibold">
                          <p className="text-[10px] font-bold text-gray-800">📸 {language === "zh" ? "照片已选择" : "Photo Selected"}</p>
                          <p className="text-[9px] text-gray-400 font-medium">{language === "zh" ? "已智能压缩" : "Compressed"}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playTap();
                          setNewPostImage("");
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : newPostVideo ? (
                    <div className="relative group w-full flex items-center justify-between bg-white/90 p-2 rounded-xl border border-rose-100">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-10 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                          <video src={newPostVideo} className="w-full h-full object-cover" muted />
                        </div>
                        <div className="text-left font-sans font-semibold font-bold">
                          <p className="text-[10px] font-bold text-gray-800">🎥 {language === "zh" ? "视频已选择" : "Video Selected"}</p>
                          <p className="text-[9px] text-gray-400 font-medium">{language === "zh" ? "已就绪" : "Ready"}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playTap();
                          setNewPostVideo("");
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pointer-events-none font-sans">
                      <div className="mx-auto w-7 h-7 rounded-full bg-rose-50 text-[#ad292f] flex items-center justify-center">
                        <ImageIcon size={14} />
                      </div>
                      <div className="space-y-0.5 font-sans">
                        <p className="text-[10px] font-bold text-gray-700">
                          {language === "zh" ? "点此选择或拖入本地照片/视频" : "Click to select or drag photo/video"}
                        </p>
                        <p className="text-[9px] text-gray-400 font-medium leading-normal max-w-[200px] mx-auto">
                          {language === "zh" ? "支持直接获取系统图库" : "Acquire directly from library"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Unified Date Selection option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-[#735858] uppercase tracking-wider">
                  {language === "zh" ? "纪念时间" : "Memory Date"}
                </label>
                <input
                  type="date"
                  value={newPostDate}
                  onChange={(e) => setNewPostDate(e.target.value)}
                  className="w-full text-xs p-3.5 border border-stone-200 rounded-2xl bg-[#FAF8F5]/80 focus:border-[#ad292f] outline-none font-bold text-stone-700 focus:bg-white transition-all text-stone-750"
                />
              </div>
              
              <div className="space-y-2 flex flex-col justify-end pb-3">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newPostIsMilestone}
                    onChange={(e) => {
                      audio.playTap();
                      setNewPostIsMilestone(e.target.checked);
                    }}
                    className="rounded text-[#ad292f] focus:ring-[#ad292f] border-stone-300 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[#ad292f] flex items-center gap-1 font-black">
                    💖 {language === "zh" ? "设为纪念里程碑/誓约" : "Love Milestone / Pledge"}
                  </span>
                </label>
              </div>
            </div>

            {/* MileStone details */}
            <AnimatePresence>
              {newPostIsMilestone && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 border-l-4 border-rose-300 pl-4 bg-rose-50/20 p-4 rounded-r-2xl"
                >
                  <p className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">
                    🎉 {language === "zh" ? "完善里程碑信息（写进浪漫大事记）" : "Complete Milestone Details"}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400">
                        {language === "zh" ? "里程碑主题/誓言 (e.g. 第一次看海)" : "Milestone Topic"}
                      </label>
                      <input
                        type="text"
                        placeholder={language === "zh" ? "如：第一次看星空" : "First sunset together..."}
                        value={newPostMilestoneTitle}
                        onChange={(e) => setNewPostMilestoneTitle(e.target.value)}
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-400">
                        {language === "zh" ? "定情地点/发生地" : "Location"}
                      </label>
                      <input
                        type="text"
                        placeholder={language === "zh" ? "如：三亚椰子湾" : "Beach city..."}
                        value={newPostMilestoneLocation}
                        onChange={(e) => setNewPostMilestoneLocation(e.target.value)}
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice dictate text input heart line ruled textarea */}
            <div className="space-y-2 font-sans">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-[#735858] uppercase tracking-wider">
                  {language === "zh" ? "写下今日纪念" : "Type your moment"}
                </label>
                
                {/* Voice Dictation Switch button */}
                <button
                  type="button"
                  onClick={() => {
                    audio.playTap();
                    toggleListening();
                  }}
                  className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full font-bold select-none transition-all cursor-pointer ${
                    isListening
                      ? "bg-rose-500 text-white animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                      : "bg-rose-50 text-[#ad292f] hover:bg-rose-100"
                  }`}
                >
                  {isListening ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                      <MicOff size={11} className="shrink-0" />
                      <span>{language === "zh" ? "说完了 (点击停止)" : "Done (Click to stop)"}</span>
                    </>
                  ) : (
                    <>
                      <Mic size={11} className="shrink-0 text-[#ad292f]" />
                      <span>{language === "zh" ? "麦克风快速录入" : "Speech to Text"}</span>
                    </>
                  )}
                </button>
              </div>

              {speechError && (
                <p className="text-[10px] text-rose-500 font-semibold bg-rose-50/50 px-2.5 py-1.5 rounded-xl">
                  ⚠️ {speechError}
                </p>
              )}

              {isListening && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50/30 border border-rose-100 rounded-xl text-[10px] text-stone-500 font-sans font-semibold">
                  <span className="flex gap-0.5">
                    <span className="w-1 h-3 bg-[#ad292f] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1 h-3 bg-[#ad292f] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </span>
                  <span>{language === "zh" ? "倾听中：请说出您的温柔碎碎念，系统将自动追加为文字..." : "Listening: Speak, we will capture your warm words in real time..."}</span>
                </div>
              )}

              <textarea
                placeholder={t.postPlaceholder}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={6}
                className="w-full text-sm p-4 border border-rose-100 rounded-2xl bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-rose-200 text-[#735858] font-medium leading-relaxed font-sans"
                required
              />
            </div>

            {/* Footer Form submission actions */}
            <div className="flex justify-between items-center pt-3 gap-4 font-sans font-semibold">
              <p className="text-[9.5px] text-stone-400 font-serif italic max-w-xs leading-tight hidden sm:block">
                Your letters are local-safe and compiled with cryptographic warmth 🔒
              </p>
              <div className="flex gap-2 w-full sm:w-auto text-xs font-bold font-sans">
                <button
                  type="button"
                  onClick={() => {
                    audio.playTap();
                    setShowAddForm(false);
                  }}
                  className="px-5 py-3 text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer font-sans"
                >
                  {language === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none bg-[#ad292f] hover:bg-[#ad292f]/95 text-white px-7 py-3 rounded-xl font-bold hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                >
                  <Feather size={14} />
                  {t.shareBtn}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-1">
      {/* Custom Dynamic Success Notification Box */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -40, x: "-50%" }}
            className="fixed top-24 left-1/2 z-[80] pointer-events-none"
          >
            <div className="bg-[#ad292f] text-white px-6 py-3.5 rounded-full shadow-lg flex items-center gap-2 border border-white/20">
              <Sparkles size={16} className="text-rose-200 animate-pulse" />
              <span className="font-semibold text-sm">{successToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Airy Header Row with custom timeline vs calendar vs flipbook toggle block - MINIMALIST PREMIUM CAPSULE */}
      <div className="flex items-center justify-between gap-4 mb-6 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ad292f] animate-pulse" />
          <h2 className="text-xs font-serif font-black text-stone-700 tracking-wider uppercase">
            {viewStyle === "stream" ? (language === 'zh' ? '岁时光影' : 'Memory Line') : viewStyle === "calendar" ? (language === 'zh' ? '誓约誓言' : 'Pledge Calendar') : (language === 'zh' ? '流年随笔' : 'Diary Log')}
          </h2>
        </div>
        <div className="relative flex bg-stone-100/60 p-1 rounded-xl border border-stone-200/20 text-[11px] font-semibold text-stone-600 gap-0.5">
          <button
            onClick={() => setViewStyle("stream")}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer z-10 ${
              viewStyle === "stream" 
                ? "text-[#ad292f] font-bold" 
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {viewStyle === "stream" && (
              <motion.div 
                layoutId="activeTabIndicator" 
                className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_8px_rgba(115,88,88,0.06)] border border-stone-200/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                style={{ zIndex: -1 }}
              />
            )}
            <LayoutList size={11} className={viewStyle === "stream" ? "text-[#ad292f]" : "text-stone-400"} />
            <span>{language === 'zh' ? '时间轴' : 'Timeline'}</span>
          </button>

          <button
            onClick={() => setViewStyle("calendar")}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer z-10 ${
              viewStyle === "calendar" 
                ? "text-[#ad292f] font-bold" 
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {viewStyle === "calendar" && (
              <motion.div 
                layoutId="activeTabIndicator" 
                className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_8px_rgba(115,88,88,0.06)] border border-stone-200/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                style={{ zIndex: -1 }}
              />
            )}
            <CalendarIcon size={11} className={viewStyle === "calendar" ? "text-[#ad292f]" : "text-stone-400"} />
            <span>{language === 'zh' ? '日历' : 'Calendar'}</span>
          </button>

          <button
            onClick={() => setViewStyle("diary")}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer z-10 ${
              viewStyle === "diary" 
                ? "text-[#ad292f] font-bold" 
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {viewStyle === "diary" && (
              <motion.div 
                layoutId="activeTabIndicator" 
                className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_8px_rgba(115,88,88,0.06)] border border-stone-200/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                style={{ zIndex: -1 }}
              />
            )}
            <BookOpen size={11} className={viewStyle === "diary" ? "text-[#ad292f]" : "text-stone-400"} />
            <span>{language === 'zh' ? '翻页本' : 'Flip Book'}</span>
          </button>
        </div>
      </div>

      {/* AI Anniversary Retrospective - Slim, modern high-contrast premium layout */}
      <div className="bg-white border-2 border-[#fff0f1] rounded-[24px] p-5 select-none relative overflow-hidden shadow-[0_8px_24px_rgba(244,63,94,0.01)] transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#fff0f1] pb-3 mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles size={15} fill="#ad292f" className="text-[#ad292f] shrink-0 animate-pulse" />
            <div>
              <span className="text-[10px] font-black text-[#ad292f] uppercase tracking-wider block font-sans">
                {language === "zh" ? "AI 纪念日回归" : "AI Anniversary Retrospective"}
              </span>
              <p className="text-[9px] text-[#735858]/60 mt-0.5 leading-none">
                {language === "zh" ? "让 AI 带领你们重温历史上这一天的温柔涟漪 ✨" : "Let Gemini take you back to past ripples on this date across history ✨"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={retrospectiveDate}
              onChange={(e) => setRetrospectiveDate(e.target.value)}
              className="text-xs p-1.5 border border-stone-200/80 rounded-xl outline-none bg-stone-50 font-semibold text-stone-700 focus:border-[#ad292f] transition-all"
            />
            <button
              onClick={handleGenerateRetrospective}
              disabled={isAiLoading}
              className="text-[10px] font-bold bg-[#fae9eb] text-[#ad292f] hover:bg-[#ad292f] hover:text-white rounded-full px-3.5 py-1.5 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>{isAiLoading ? "..." : "✨"}</span>
              <span>{isAiLoading ? (language === "zh" ? "追忆中" : "Seeking...") : (language === "zh" ? "开启回忆" : "Generate")}</span>
            </button>
          </div>
        </div>

        {isAiLoading ? (
          <div className="py-2 text-[10.5px] italic text-stone-400 flex items-center justify-center gap-1.5 font-sans">
            <span className="w-1.5 h-1.5 bg-[#ad292f] rounded-full animate-ping" />
            <span>{language === "zh" ? "Gemini 正在抚弄记忆的竖琴，稍候片刻..." : "Gemini is humming memory chords..."}</span>
          </div>
        ) : (
          <div className="text-[11.5px] text-stone-600 leading-relaxed font-serif italic bg-stone-50/50 p-3 rounded-xl border border-stone-100 select-text">
            <span>{aiSummary}</span>
          </div>
        )}
      </div>

      {/* Love Letter Postcard Editor resides as page-level stage, overlay deactivated */}
      <AnimatePresence>
        {false && (
          <div className="fixed inset-0 bg-[#382e2e]/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 25 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#fefcf8] border-8 border-[#f5edf0] rounded-3xl p-6 max-w-xl w-full relative shadow-2xl "
              style={{
                boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                backgroundImage: "radial-gradient(#dfd7d7 0.7px, transparent 0.7px)",
                backgroundSize: "20px 20px"
              }}
            >
              {/* Envelope Red Ribbon header lines */}
              <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-red-600 via-white to-red-600 rounded-t-lg bg-[length:20px_100%]" />
              
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-rose-50 rounded-full transition-colors z-20"
                title={t.cancel}
              >
                <X size={18} />
              </button>

              {/* Decorative Stamp on the Right Top */}
              <div className="absolute top-8 right-6 w-20 h-24 border border-dashed border-[#ad292f]/50 p-1 bg-[#fffaf5] rotate-[4deg] shadow-sm hidden sm:block">
                <div className="w-full h-full bg-[#fae8e8] rounded-xs flex flex-col items-center justify-center relative border border-rose-200">
                  <Stamp size={18} className="text-[#ad292f]/60" />
                  <Heart size={10} fill="#ad292f" className="text-[#ad292f] absolute top-1 right-1" />
                  <span className="text-[7px] font-bold text-gray-500 tracking-tighter uppercase mt-2">{t.letterStamp}</span>
                  <span className="text-[8px] font-mono font-bold text-[#ad292f] mt-1">$ 13.14</span>
                </div>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4 pt-4 select-none relative z-10">
                <div className="border-b border-[#ad292f]/10 pb-3">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-rose-500 block mb-1">
                    LOVE POSTCARD
                  </span>
                  <h3 className="text-xl font-black text-gray-800 flex items-center gap-1">
                    {t.letterTitle}
                  </h3>
                </div>

                {/* Sender/Author Choice with beautiful avatar stickers */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#735858] uppercase tracking-wider">
                    {t.authorLabel} • Who is writing?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewPostAuthor("partner1")}
                      className={`p-3 rounded-2xl font-bold flex items-center gap-2.5 justify-center border-2 transition-all ${
                        newPostAuthor === "partner1"
                          ? "border-[#ad292f] bg-[#fceae9] text-[#ad292f] scale-[1.01] shadow-xs"
                          : "border-gray-200 hover:bg-white text-gray-500 bg-white/40"
                      }`}
                    >
                      <img src={profile.partner1Avatar} className="w-6 h-6 rounded-full object-cover ring-2 ring-white" alt="" />
                      <span className="text-xs">{profile.partner1Name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPostAuthor("partner2")}
                      className={`p-3 rounded-2xl font-bold flex items-center gap-2.5 justify-center border-2 transition-all ${
                        newPostAuthor === "partner2"
                          ? "border-[#ad292f] bg-[#fceae9] text-[#ad292f] scale-[1.01] shadow-xs"
                          : "border-gray-200 hover:bg-white text-gray-500 bg-white/40"
                      }`}
                    >
                      <img src={profile.partner2Avatar} className="w-6 h-6 rounded-full object-cover ring-2 ring-white" alt="" />
                      <span className="text-xs">{profile.partner2Name}</span>
                    </button>
                  </div>
                </div>

                {/* Sub row - Mood & Photograph Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#735858] uppercase tracking-wider">
                      {t.moodLabel}
                    </label>
                    <select
                      value={newPostMood}
                      onChange={(e) => setNewPostMood(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-white focus:border-[#ad292f] outline-none font-semibold text-gray-700"
                    >
                      <option value="In Love">🥰 浓情蜜意 (In Love)</option>
                      <option value="Happy">😊 欢欣鼓舞 (Happy)</option>
                      <option value="Peaceful">🍃 恬静和美 (Peaceful)</option>
                      <option value="Playful">🦊 调皮搞怪 (Playful)</option>
                      <option value="Miss You">🐰 疯狂想念 (Miss You)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#735858] uppercase tracking-wider">
                      {language === "zh" ? "定格瞬间 (系统照片/视频)" : "Snapshot (System Photos/Videos)"}
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("media-file-input")?.click()}
                      className={`relative border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[100px] ${
                        isDragging
                          ? "border-[#ad292f] bg-[#fceae9]"
                          : (newPostImage || newPostVideo)
                          ? "border-emerald-300 bg-emerald-50/20"
                          : "border-gray-200 hover:border-[#ad292f] hover:bg-rose-50/10"
                      }`}
                    >
                      <input
                        id="media-file-input"
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />

                      {/* Preview selected media */}
                      {newPostImage ? (
                        <div className="relative group w-full flex items-center justify-between bg-white/80 p-2 rounded-xl border border-rose-100">
                          <div className="flex items-center gap-2">
                            <img src={newPostImage} className="w-14 h-10 object-cover rounded-lg border border-gray-100" />
                            <div className="text-left">
                              <p className="text-[10px] font-bold text-gray-800">📸 {language === "zh" ? "照片已选择" : "Photo Selected"}</p>
                              <p className="text-[9px] text-gray-400 font-medium">{language === "zh" ? "已智能压缩" : "Compressed"}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewPostImage("");
                            }}
                            className="p-1 text-gray-450 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : newPostVideo ? (
                        <div className="relative group w-full flex items-center justify-between bg-white/80 p-2 rounded-xl border border-rose-100">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-10 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                              <video src={newPostVideo} className="w-full h-full object-cover" muted />
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] font-bold text-gray-800">🎥 {language === "zh" ? "视频已选择" : "Video Selected"}</p>
                              <p className="text-[9px] text-gray-400 font-medium">{language === "zh" ? "已准备就绪" : "Ready to upload"}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewPostVideo("");
                            }}
                            className="p-1 text-gray-450 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5 pointer-events-none">
                          <div className="mx-auto w-7 h-7 rounded-full bg-rose-50 text-[#ad292f] flex items-center justify-center">
                            <Image size={14} />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-gray-700">
                              {language === "zh" ? "点此选择或拖入本地照片/视频" : "Click to select or drag photo/video"}
                            </p>
                            <p className="text-[9px] text-gray-400 font-medium leading-normal max-w-[180px] mx-auto">
                              {language === "zh" ? "支持直接获取系统图库 ✨" : "Acquire directly from library ✨"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unified Date Selection option for Retroactive or Future-dated moments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-1">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#735858] uppercase tracking-wider">
                      {language === "zh" ? "纪念时间" : "Memory Date"}
                    </label>
                    <input
                      type="date"
                      value={newPostDate}
                      onChange={(e) => setNewPostDate(e.target.value)}
                      className="w-full text-xs p-2.5 border border-stone-200 rounded-xl bg-[#FAF8F5]/80 focus:border-[#ad292f] outline-none font-semibold text-stone-700 focus:bg-white transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5 flex flex-col justify-end pb-1 pb-2.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newPostIsMilestone}
                        onChange={(e) => setNewPostIsMilestone(e.target.checked)}
                        className="rounded text-[#ad292f] focus:ring-[#ad292f] border-stone-350 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[#ad292f] flex items-center gap-1">
                        💖 {language === "zh" ? "设为纪念里程碑/誓约" : "Love Milestone / Pledge"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Sub form for Milestone parameters if checked */}
                <AnimatePresence>
                  {newPostIsMilestone && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3.5 bg-rose-50/40 rounded-2xl border border-rose-100/60 overflow-hidden space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold text-[#735858] uppercase tracking-widest">
                            {language === "zh" ? "里程碑/誓约主题" : "Milestone Theme"}
                          </label>
                          <input
                            type="text"
                            placeholder={language === "zh" ? "例：白首誓盟周年" : "e.g. Our 5th Anniversary"}
                            value={newPostMilestoneTitle}
                            onChange={(e) => setNewPostMilestoneTitle(e.target.value)}
                            className="w-full p-2 text-xs border border-gray-200 rounded-xl bg-white font-semibold text-stone-700"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold text-[#735858] uppercase tracking-widest">
                            {language === "zh" ? "同游地点/坐标" : "Location"}
                          </label>
                          <input
                            type="text"
                            placeholder={language === "zh" ? "例：香榭丽舍大街" : "e.g. Champs-Élysées"}
                            value={newPostMilestoneLocation}
                            onChange={(e) => setNewPostMilestoneLocation(e.target.value)}
                            className="w-full p-2 text-xs border border-gray-200 rounded-xl bg-white font-semibold text-stone-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#735858] uppercase tracking-widest">
                          {language === "zh" ? "分类标识" : "Category Tag"}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: "anniversary", label: language === "zh" ? "🎎 纪念日" : "Anniversary" },
                            { key: "birthday", label: language === "zh" ? "🎂 诞辰" : "Birthday" },
                            { key: "custom", label: language === "zh" ? "🎈 行画印记" : "Event" }
                          ].map((cat) => (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => setNewPostMilestoneType(cat.key as any)}
                              className={`p-2 rounded-xl text-[10px] font-bold border transition-all ${
                                newPostMilestoneType === cat.key
                                  ? "border-[#ad292f] bg-[#fceae9] text-[#ad292f]"
                                  : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Heart line-ruled handwrite textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-[#735858] uppercase tracking-wider">
                      {language === "zh" ? "写下今日纪念" : "Type your moment"}
                    </label>
                    
                    {/* Modern dictation trigger button */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-full font-bold select-none transition-all cursor-pointer ${
                        isListening
                          ? "bg-rose-500 text-white animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                          : "bg-rose-50 text-[#ad292f] hover:bg-rose-100"
                      }`}
                    >
                      {isListening ? (
                        <>
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          <MicOff size={11} className="shrink-0" />
                          <span>{language === "zh" ? "说完了（点击停止）" : "Done (Click to stop)"}</span>
                        </>
                      ) : (
                        <>
                          <Mic size={11} className="shrink-0 text-[#ad292f]" />
                          <span>{language === "zh" ? "麦克风快速录入" : "Speech to Text"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {speechError && (
                    <p className="text-[10px] text-rose-500 font-semibold bg-rose-50/50 px-2.5 py-1 rounded-xl">
                      ⚠️ {speechError}
                    </p>
                  )}

                  {isListening && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50/30 border border-rose-100 rounded-xl text-[10px] text-stone-500 font-sans">
                      <span className="flex gap-0.5">
                        <span className="w-1 h-3 bg-[#ad292f] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <span className="w-1 h-3 bg-[#ad292f] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                      </span>
                      <span>{language === "zh" ? "倾听中：请说出您的温柔碎碎念，系统将自动追加为文字..." : "Listening: Speak, we will capture your warm words in real time..."}</span>
                    </div>
                  )}

                  <textarea
                    placeholder={t.postPlaceholder}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                    className="w-full text-sm p-4 border border-rose-100 rounded-2xl bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-rose-200 text-[#735858] font-medium leading-relaxed"
                    required
                  />
                </div>

                {/* Post Stamp and send action buttons footer */}
                <div className="flex justify-between items-center pt-2 gap-4">
                  <p className="text-[10px] text-gray-400 font-mono italic max-w-xs leading-tight hidden sm:block">
                    Your letters are local-safe and compiled with cryptographic warmth 🔒
                  </p>
                  <div className="flex gap-2 w-full sm:w-auto text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-5 py-2.5 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                    >
                      {language === "zh" ? "取消" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none bg-[#ad292f] hover:bg-[#ad292f]/95 text-white px-6 py-2.5 rounded-xl font-bold hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Feather size={14} />
                      {t.shareBtn}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Calendar add event popup portal layout */}
      <AnimatePresence>
        {showAddEventForm && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
            <motion.form
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onSubmit={handleCreateEvent}
              className="bg-white border text-stone-700 border-rose-100 p-6 rounded-[28px] shadow-2xl space-y-4 select-none max-w-xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-rose-100/30">
                <h3 className="font-serif font-black text-[#ad292f] text-lg flex items-center gap-1.5">
                  <CalendarIcon size={18} />
                  <span>{calendarT.addEvent}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddEventForm(false)}
                  className="text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="block text-[#735858]/80 uppercase tracking-widest text-[10px]">
                    {calendarT.titleLabel}
                  </label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="We Met / 5th Anniversary"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-200 text-stone-700"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[#735858]/80 uppercase tracking-widest text-[10px]">
                    {calendarT.dateLabel}
                  </label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-[#735858] bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-rose-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="block text-[#735858]/80 uppercase tracking-widest text-[10px]">
                    事件誓约分类
                  </label>
                  <select
                    value={newEventType}
                    onChange={(e: any) => setNewEventType(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white text-gray-700 focus:ring-1 focus:ring-rose-200"
                  >
                    <option value="anniversary">💖 {calendarT.anniversary}</option>
                    <option value="birthday">🎂 {calendarT.birthday}</option>
                    <option value="custom">🗺️ {calendarT.custom}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[#735858]/80 uppercase tracking-widest text-[10px]">
                    {calendarT.locLabel}
                  </label>
                  <input
                    type="text"
                    value={newEventLoc}
                    onChange={(e) => setNewEventLoc(e.target.value)}
                    placeholder="The Coffee Bar Bistro"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-rose-200 text-stone-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-[#735858]/80 uppercase tracking-widest font-bold font-semibold text-[10px]">
                  {calendarT.descLabel}
                </label>
                <textarea
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-200 text-stone-700"
                  placeholder="Give a beautiful memory promise..."
                />
              </div>

              <div className="flex justify-end gap-2 text-xs font-bold pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddEventForm(false)}
                  className="text-gray-500 hover:bg-gray-100 px-4 py-2.5 rounded-full"
                >
                  {language === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="bg-[#ad292f] hover:bg-[#ad292f]/95 text-white px-5 py-2.5 rounded-full"
                >
                  {calendarT.publish}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Main Feed area rendering differently depending on active toggle mode: Stream vs Calendar vs Lined-Diary */}
      {viewStyle === "calendar" ? (
        <div className="space-y-6 pt-1">
          {/* Main Month Grid Card Section */}
          <section className="bg-white rounded-[28px] border-2 border-[#fff0f1] p-6 shadow-[0_8px_30px_rgba(244,63,94,0.015)] select-none">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-lg font-black text-[#ad292f]">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <div className="flex gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-rose-50 text-[#ad292f] transition-all rounded-full border border-rose-100/10 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-rose-50 text-[#ad292f] transition-all rounded-full border border-rose-100/10 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days of week titles */}
            <div className="grid grid-cols-7 text-center mb-3">
              {daysOfWeek.map((d, index) => (
                <div
                  key={index}
                  className={`font-black text-[10px] tracking-widest uppercase py-1 ${
                    index === 0 || index === 6 ? "text-[#ad292f]" : "text-gray-400"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Monthly day grids with timeline publishing indicator dots */}
            <div className="grid grid-cols-7 text-center gap-y-1.5 gap-x-1">
              {getDaysInMonth(currentYear, currentMonth).map((cell, index) => {
                if (!cell.day) {
                  return <div key={index} className="text-transparent p-2">_</div>;
                }

                // Cross reference events
                const hasMilestoneEvents = calendarEvents.filter((e) => {
                  const evDate = new Date(e.date);
                  return (
                    evDate.getDate() === cell.day &&
                    evDate.getMonth() === currentMonth &&
                    evDate.getFullYear() === currentYear
                  );
                });

                const { postsMatching } = getMemoriesByDate(cell.fullDate);
                const totalPublishedRecords = postsMatching.length;

                const isAnniversary = hasMilestoneEvents.some(e => e.eventType === "anniversary");
                const isBirthday = hasMilestoneEvents.some(e => e.eventType === "birthday");
                const isSelected = selectedDate === cell.fullDate;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(cell.fullDate)}
                    className={`p-2 py-3 font-mono text-xs rounded-2xl relative flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-[#ad292f] text-white shadow-md shadow-rose-100 font-bold scale-[1.05]" 
                        : totalPublishedRecords > 0 
                          ? "bg-rose-50/70 hover:bg-rose-100/70 text-[#ad292f]" 
                          : "text-gray-800 hover:bg-rose-50/50"
                    }`}
                  >
                    <span className="relative z-10">{cell.day}</span>
                    
                    {/* Visual badges for events */}
                    {hasMilestoneEvents.length > 0 && !isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {isAnniversary ? (
                          <Heart size={28} className="text-[#ad292f]/10" fill="#ad292f" />
                        ) : isBirthday ? (
                          <Cake size={28} className="text-amber-500/10" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1"></span>
                        )}
                      </div>
                    )}

                    {totalPublishedRecords > 0 && (
                      <div className="absolute top-1.5 right-1.5">
                        <Heart 
                          size={10} 
                          fill={isSelected ? "#ffffff" : "#ad292f"} 
                          className={`text-[#ad292f] ${isSelected ? "text-white" : "animate-pulse"}`} 
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* DYNAMIC RETRO DRAWER MODULE: Memories of Clicked Day */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#fffdfa] border border-amber-900/15 rounded-[24px] p-5 shadow-inner space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-amber-100">
                  <div className="flex items-center gap-2 select-none">
                    <BookOpen size={16} className="text-[#ad292f]" />
                    <h4 className="text-sm font-black text-[#ad292f] font-serif">
                      {selectedDate} • {calendarT.dayMemoryTitle}
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 font-bold bg-[#fbf5ee] px-3 py-1 rounded-full border border-amber-900/10 transition-colors cursor-pointer"
                  >
                    {calendarT.backToAll}
                  </button>
                </div>

                {(() => {
                  const { postsMatching } = getMemoriesByDate(selectedDate);
                  const totalItems = postsMatching.length;

                  if (totalItems === 0) {
                    return (
                      <p className="text-xs italic text-gray-400 select-none py-3">
                        {calendarT.noMemoryForDay}
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                      {postsMatching.map(post => (
                        <div key={`calmem-post-${post.id}`} className="bg-white border rounded-2xl p-4 shadow-xs space-y-2">
                          <div className="flex justify-between items-center text-[10px] select-none">
                            <div className="flex items-center gap-1.5 font-bold text-[#ad292f]">
                              <img src={post.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                              <span>{post.author} • 时光瞬间</span>
                            </div>
                            {post.mood && (
                              <span className="bg-[#fceae9] text-[#ad292f] px-1.5 py-0.5 rounded-full font-bold">{post.mood}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-700 font-serif leading-relaxed font-semibold pl-1">
                            {post.content}
                          </p>
                          {post.imageUrl && (
                            <div className="rounded-xl overflow-hidden max-h-40 bg-gray-50">
                              <img src={post.imageUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* General Upcoming lists */}
          <section className="space-y-4 select-none">
            <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase pl-1">
              {calendarT.upcomingLabel}
            </h3>

            <div className="space-y-4 relative pl-5 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-rose-100">
              {calendarEvents.map((ev) => {
                const countdownInfo = calculateDaysLeft(ev.date);

                return (
                  <div key={ev.id} className="relative select-text">
                    <div className="absolute left-[-22px] top-6 w-[8.5px] h-[8.5px] rounded-full bg-[#ad292f] ring-4 ring-white z-10" />

                    <div className="bg-white border-2 border-[#fff0f1] hover:border-rose-100 rounded-[24px] p-5 shadow-[0_8px_24px_rgba(244,63,94,0.015)] hover:shadow-[0_12px_36px_rgba(244,63,94,0.05)] flex gap-4 items-start border-l-4 border-l-[#ad292f] transition-all duration-300">
                      <div className="p-3.5 rounded-2xl bg-[#fceae9] text-[#ad292f] shrink-0">
                        {ev.eventType === "anniversary" ? (
                          <Heart size={20} fill="#ad292f" />
                        ) : ev.eventType === "birthday" ? (
                          <Cake size={20} />
                        ) : (
                          <Gift size={20} />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-bold text-[#ad292f] uppercase tracking-widest font-mono">
                            {new Date(ev.date).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#fceae9] text-[#ad292f] font-sans">
                            {countdownInfo}
                          </span>
                        </div>

                        <h4 className="text-md font-black text-gray-800 leading-tight">
                          {ev.title}
                        </h4>

                        <p className="text-xs text-gray-500 leading-relaxed font-semibold italic pr-4">
                          "{ev.description}"
                        </p>

                        {ev.location && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold pt-1">
                            <MapPin size={10} className="text-[#ad292f]" />
                            <span>{ev.location}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors self-start p-1.5 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>


        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-rose-100/40 p-8 shadow-sm">
          <div className="max-w-xs mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
              <Smile size={32} className="text-[#ad292f]/45" />
            </div>
            <p className="text-sm font-medium text-[#735858]">{t.noTimeline}</p>
          </div>
        </div>
      ) : viewStyle === "stream" ? (
        /* STYLE A: MODERN STREAM TIMELINE FLOW WITH ROOMY MARGINS AND FLOATING HIGHLIGHTS (#1) */
        <div className="space-y-6">
          {posts.map((post) => (
            <motion.article 
              layout
              key={post.id} 
              className="bg-white border-2 border-[#fef0f1] rounded-[28px] p-6 lg:p-7 shadow-[0_8px_30px_rgba(244,63,94,0.02)] hover:shadow-[0_12px_40px_rgba(244,63,94,0.06)] hover:border-rose-100/70 transition-all duration-400 relative overflow-hidden"
            >
              {/* Top corner gradient highlight */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ad292f]/10 to-transparent" />

              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={post.avatar}
                    className="w-10 h-10 rounded-full object-cover border-2 border-rose-50 shadow-sm"
                    alt={post.author}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{post.author}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                        {new Date(post.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {post.mood && (
                        <span className="text-[10px] bg-[#fceae9] text-[#ad292f] px-2 py-0.5 rounded-full font-bold">
                          {post.mood}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1.5 hover:bg-gray-50 rounded-full"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Moment Content */}
              <p className="mt-4 text-sm text-[#735858] leading-relaxed select-text font-serif max-w-2xl pl-1 font-medium whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Fluid Polaroid picture/video */}
              {(post.imageUrl || post.videoUrl) && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-rose-50 bg-[#fffdfa] p-3 shadow-xs max-w-lg">
                  <div className="relative group overflow-hidden rounded-xl bg-gray-50 aspect-video flex items-center justify-center">
                    {post.videoUrl ? (
                      <video
                        src={post.videoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain rounded-xl bg-black"
                      />
                    ) : (
                      <img
                        src={post.imageUrl}
                        alt="Moment media"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-101"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Heart and comment counters - MINIMALIST ICON METRICS */}
              <div className="flex items-center gap-4 mt-5 pt-3.5 border-t border-rose-50/50 select-none">
                <button
                  onClick={() => handleToggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-all transform hover:scale-105 cursor-pointer ${
                    post.likedByUser ? "text-[#ad292f]" : "text-gray-400 hover:text-[#ad292f]"
                  }`}
                >
                  <Heart size={14} fill={post.likedByUser ? "#ad292f" : "none"} />
                  <span>{post.likes}</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                  <MessageCircle size={14} />
                  <span>{post.comments.length}</span>
                </div>
              </div>

              {/* Dynamic responsive comment feed */}
              {post.comments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-rose-50/35 space-y-2.5">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5 text-xs bg-[#fffaf8] p-3 rounded-2xl border border-rose-100/10">
                      <img
                        src={comment.avatar}
                        className="w-6 h-6 rounded-full object-cover border border-rose-100"
                        alt=""
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#ad292f]">{comment.author}</span>
                          <span className="text-[8px] font-mono text-gray-400 font-bold">
                            {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[#735858] mt-0.5 font-medium leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment write-area */}
              <div className="mt-4 pt-3.5 border-t border-rose-50/30">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    placeholder={t.writeComment}
                    className="w-full text-xs p-3 pr-11 border border-rose-100/60 rounded-full focus:ring-1 focus:ring-rose-200 bg-gray-50/50 focus:bg-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment(post.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    className="absolute right-3 text-[#ad292f] hover:text-[#ad292f]/80 p-1.5 rounded-full transition-colors"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>

            </motion.article>
          ))}
        </div>
      ) : (
        /* STYLE B: LINED DIARY BOOK RETRO WRITING STYLE - IMMERSIVE TWO-PAGE OPEN BINDER LAYOUT */
        <div className="w-full max-w-4xl mx-auto px-1 sm:px-4 py-4 relative select-none">
          {posts.length === 0 ? (
            /* Beautiful empty book cover inviting the couple to write their first moment */
            <div className="bg-stone-100/50 rounded-3xl p-8 sm:p-14 text-center border border-stone-200/55 max-w-xl mx-auto shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#e5e1da_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
              <div className="relative z-10 space-y-6">
                <div className="w-15 h-15 rounded-full bg-white border border-stone-200 shadow-xs flex items-center justify-center mx-auto">
                  <BookOpen size={24} className="text-stone-400 stroke-[1.5]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif italic text-lg font-bold text-stone-700">《流年微澜 • 专属日记本》</h3>
                  <p className="text-xs text-stone-400 font-medium max-w-xs mx-auto leading-relaxed">
                    “落笔处皆是温柔，抬眼处皆是相守。点点滴滴，写在岁月的缝隙里。”
                  </p>
                </div>
                <div className="pt-2">
                  <p className="text-[11px] text-rose-800 font-bold bg-white inline-block px-4 py-1.5 rounded-full shadow-xs border border-rose-100/40">
                    点击屏幕右下角的 [+] 开启第一篇心动瞬间 ✨
                  </p>
                </div>
              </div>
            </div>
          ) : (
            (() => {
              const activePostIdx = Math.min(Math.max(0, diaryBookIndex), posts.length - 1);
              const activePost = posts[activePostIdx];
              const char = activePost.content ? activePost.content.charAt(0) : "";
              const remaining = activePost.content ? activePost.content.substring(1) : "";

              return (
                <div className="relative select-none">
                  
                  {/* Visual Paper Stack Depth Overlays underneath */}
                  <div className="absolute inset-x-3 -bottom-3 bg-stone-200/40 h-full rounded-3xl pointer-events-none transform translate-y-2 border border-stone-300/10 shadow-xs" />
                  <div className="absolute inset-x-1.5 -bottom-1.5 bg-stone-100/60 h-full rounded-3xl pointer-events-none transform translate-y-1 border border-stone-200/10 shadow-xs" />

                  {/* Main Book Binder Container */}
                  <div className="relative bg-white rounded-3xl border border-stone-200/60 shadow-[0_15px_45px_-12px_rgba(115,88,88,0.08)] overflow-visible min-h-[460px] md:min-h-[500px]">
                    
                    {/* Interactive colored index tabs on the right edge of book (like multi-page binder) */}
                    <div className="absolute right-[-24px] sm:right-[-32px] top-8 flex flex-col gap-2 z-20 pointer-events-auto hidden md:flex">
                      {posts.slice(0, 10).map((p, idx) => (
                        <button
                          key={`tab-${p.id}`}
                          onClick={() => {
                            setFlipDirection(idx > activePostIdx ? "next" : "prev");
                            setDiaryBookIndex(idx);
                            playPageTurnSound();
                          }}
                          className={`px-2 py-1.5 rounded-r-lg text-[9px] font-bold text-white border-l-0 shadow-[2px_2px_5px_rgba(0,0,0,0.05)] transition-all duration-300 transform cursor-pointer text-center truncate w-8 sm:w-10 hover:w-16 hover:translate-x-1 flex items-center justify-center ${
                            idx === activePostIdx
                              ? "bg-rose-850 scale-110 font-black shadow-[0_4px_12px_rgba(115,88,88,0.2)] z-30"
                              : "bg-stone-400/80 hover:bg-stone-500 z-10"
                          }`}
                          title={new Date(p.timestamp).toLocaleDateString()}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Left & Right Page Turning Buttons (Vintage Bookmarks floating in center side borders) */}
                    {activePostIdx > 0 && (
                      <button
                        onClick={handlePrevPage}
                        className="absolute left-[-20px] md:left-[-24px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-stone-600 hover:text-rose-800 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-stone-200/60 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all z-40"
                        aria-label="Previous Page"
                      >
                        <ChevronLeft size={20} className="stroke-[2.5]" />
                      </button>
                    )}

                    {activePostIdx < posts.length - 1 && (
                      <button
                        onClick={handleNextPage}
                        className="absolute right-[-20px] md:right-[-24px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-stone-600 hover:text-rose-800 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-stone-200/60 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all z-40"
                        aria-label="Next Page"
                      >
                        <ChevronRight size={20} className="stroke-[2.5]" />
                      </button>
                    )}

                    {/* Left & Right Interactive page with page flip motion transition */}
                    <AnimatePresence mode="wait" custom={flipDirection === "next" ? 1 : -1}>
                      <motion.div
                        key={activePost.id}
                        initial={{ opacity: 0, rotateY: flipDirection === "next" ? 8 : -8, scale: 0.98 }}
                        animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                        exit={{ opacity: 0, rotateY: flipDirection === "next" ? -8 : 8, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="grid grid-cols-1 md:grid-cols-2 relative min-w-0"
                      >
                        
                        {/* LEFT PAGE - LINED HANDWRITING CANVAS */}
                        <div 
                          className="p-6 sm:p-8 md:p-10 relative bg-stone-50/20 border-r border-stone-200/35 rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl transition-all duration-300 select-none"
                          style={{
                            backgroundImage: "linear-gradient(rgba(115,88,88,0.035) 1.8rem, transparent 1.8rem)",
                            backgroundSize: "100% 1.8rem",
                            lineHeight: "1.8rem"
                          }}
                        >
                          {/* Vintage margin line */}
                          <div className="absolute left-[24px] sm:left-[36px] top-0 bottom-0 w-[1px] bg-red-400/20 pointer-events-none" />
                          
                          <div className="pl-6 sm:pl-8 space-y-4">
                            {/* Top header with Date & Author */}
                            <div className="flex justify-between items-center h-8 relative z-20">
                              <span className="font-serif italic text-rose-850 font-bold text-sm tracking-tight select-none">
                                {new Date(activePost.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              
                              <div className="flex items-center gap-1.5 shrink-0 select-none">
                                <span className="text-[9px] bg-[#ad292f]/5 text-rose-900 border border-rose-200/10 font-bold px-2 py-0.5 rounded-full font-sans">
                                  {activePost.author}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePost(activePost.id);
                                  }}
                                  className="text-stone-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>

                            {/* Line spacer */}
                            <div className="h-2" />

                            {/* Interactive, elegantly typeset body text */}
                            <div className="text-stone-700 leading-[1.8rem] text-sm font-serif font-semibold pr-2 whitespace-pre-wrap select-text">
                              <span className="float-left text-4xl font-black pr-2 pt-0.5 text-rose-800 select-none leading-none font-sans">
                                {char}
                              </span>
                              {remaining}
                            </div>

                            {/* Mood marker */}
                            {activePost.mood && (
                              <div className="pt-2 select-none">
                                <span className="text-[9.5px] bg-[#ad292f]/5 text-rose-700 font-bold px-2.5 py-0.5 rounded-full border border-rose-100/30 inline-flex items-center gap-1">
                                  <Sparkle size={9} /> {activePost.mood}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* DESKTOP METAL SPIRAL HOOPS (Authentic binder rings in absolute center partition) */}
                        <div className="absolute left-1/2 top-4 bottom-4 w-5 -ml-2.5 flex flex-col justify-between items-center z-30 pointer-events-none hidden md:flex select-none">
                          {[...Array(6)].map((_, idx) => (
                            <div key={idx} className="w-5 h-2.5 bg-gradient-to-r from-stone-300 via-stone-100 to-stone-400 rounded-lg shadow-[0_1.5px_2px_rgba(0,0,0,0.12)] border border-stone-400/20 flex items-center justify-center">
                              <div className="w-1 h-1 bg-stone-500/40 rounded-full" />
                            </div>
                          ))}
                        </div>

                        {/* RIGHT PAGE - POLAROID DISPLAY, COMMENTS FEED, TEXT AREA */}
                        <div 
                          className="p-6 sm:p-8 md:p-10 bg-white relative flex flex-col justify-between min-w-0 rounded-b-3xl md:rounded-bl-none md:rounded-r-3xl transition-all duration-300 select-none"
                        >
                          <div className="space-y-4">
                            
                            {/* Photograph Mounted Area */}
                            {(activePost.imageUrl || activePost.videoUrl) ? (
                              <div className="flex justify-center select-none">
                                <div className="bg-[#fffdf9] border border-stone-200/55 p-2.5 pb-6 rounded-xs shadow-[0_5px_15px_rgba(115,88,88,0.04)] rotate-[1.5deg] hover:rotate-0 transition-all duration-300 max-w-[230px] w-full animate-fadeIn">
                                  <div className="aspect-[4/3] w-full overflow-hidden bg-rose-50/10 border border-stone-100/70 rounded-xs flex items-center justify-center">
                                    {activePost.videoUrl ? (
                                      <video
                                        src={activePost.videoUrl}
                                        controls
                                        playsInline
                                        className="w-full h-full object-contain bg-black"
                                      />
                                    ) : (
                                      <img
                                        src={activePost.imageUrl}
                                        className="w-full h-full object-cover"
                                        alt="Couple Memory Snapshot"
                                        referrerPolicy="no-referrer"
                                      />
                                    )}
                                  </div>
                                  <p className="text-center font-mono text-[7px] mt-2 italic font-bold text-stone-400 uppercase tracking-widest leading-none">
                                    Love Story • {activePost.videoUrl ? "🎥" : "📸"}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              /* Warm subtle stamp collage for simple text pages */
                              <div className="flex flex-col items-center justify-center py-6 select-none opacity-[0.55]">
                                <div className="relative w-11 h-11 rounded-full bg-rose-50/70 flex items-center justify-center mb-2 border border-rose-100/40">
                                  <Heart size={14} fill="#ad292f" className="text-[#ad292f]" />
                                  <Sparkle size={8} className="absolute -top-1 -right-0.5 text-amber-500 animate-pulse" />
                                </div>
                                <p className="text-[8px] font-mono tracking-widest text-[#ad292f] font-black uppercase text-center leading-normal">
                                  STORY LOG VOL. {activePostIdx + 1}
                                </p>
                              </div>
                            )}

                            {/* Comment thread in clean nested area */}
                            {activePost.comments.length > 0 && (
                              <div className="comments-feed space-y-1.5 max-h-[140px] overflow-y-auto mb-2 border-t border-stone-100/70 pt-3 select-none">
                                {activePost.comments.map((comment) => (
                                  <div key={comment.id} className="flex gap-2 text-[11px] bg-stone-50/40 p-2 rounded-xl border border-stone-200/10">
                                    <img
                                      src={comment.avatar}
                                      className="w-4.5 h-4.5 rounded-full object-cover border border-stone-200/50 shrink-0"
                                      alt=""
                                    />
                                    <div className="flex-1 min-w-0">
                                      <span className="font-bold text-rose-800 tracking-tight">{comment.author}: </span>
                                      <span className="text-stone-600 font-medium select-text break-words">{comment.content}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action footer containing metrics (Heart/Comment counters) & simple micro inputs */}
                          <div className="border-t border-stone-100/80 pt-3 shrink-0 select-none">
                            <div className="flex items-center justify-between gap-3">
                              
                              {/* Pure Icon and Counters */}
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleToggleLike(activePost.id)}
                                  className={`flex items-center gap-1 text-xs font-bold transition-all transform hover:scale-110 cursor-pointer ${
                                    activePost.likedByUser ? "text-[#ad292f]" : "text-stone-400 hover:text-rose-600"
                                  }`}
                                >
                                  <Heart size={13} fill={activePost.likedByUser ? "#ad292f" : "none"} />
                                  <span>{activePost.likes}</span>
                                </button>
                                
                                <div className="flex items-center gap-1 text-xs text-stone-400 font-bold">
                                  <MessageCircle size={13} />
                                  <span>{activePost.comments.length}</span>
                                </div>
                              </div>

                              {/* Elegant inline comments writing input */}
                              <div className="relative flex items-center flex-1 max-w-[170px]">
                                <input
                                  type="text"
                                  value={commentInputs[activePost.id] || ""}
                                  onChange={(e) => setCommentInputs({ ...commentInputs, [activePost.id]: e.target.value })}
                                  placeholder={t.writeComment}
                                  className="w-full text-[10px] p-2 pr-7 border border-stone-200 rounded-lg focus:ring-1 focus:ring-rose-200 bg-stone-50/50 focus:bg-white transition-all outline-none text-stone-700 font-medium"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddComment(activePost.id);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleAddComment(activePost.id)}
                                  className="absolute right-1 text-rose-800 hover:text-rose-950 p-1 rounded-full cursor-pointer transition-colors"
                                >
                                  <Send size={11} />
                                </button>
                              </div>

                            </div>
                          </div>

                        </div>

                      </motion.div>
                    </AnimatePresence>

                  </div>

                  {/* Elegant bottom compact footer presenting simple page tags & navigation help hint */}
                  <div className="mt-4 flex select-none justify-center items-center text-[10px] text-stone-400 font-medium px-2">
                    <span className="font-mono">
                      {language === 'zh' ? '第' : 'Page'} <strong className="text-rose-800 font-extrabold">{activePostIdx + 1}</strong> / {posts.length} {language === 'zh' ? '篇' : 'memos'}
                    </span>
                  </div>

                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}
