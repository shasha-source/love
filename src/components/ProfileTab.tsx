import React, { useState } from "react";
import { ProfileSettings, ThemeName, Language } from "../types";
import {
  Heart,
  Palette,
  Shield,
  Eye,
  EyeOff,
  Check,
  Camera,
  X,
  Languages,
  Volume2,
  VolumeX,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { audio } from "../utils/audio";

interface ProfileTabProps {
  profile: ProfileSettings;
  onUpdateProfile: (p: ProfileSettings) => void;
  language: Language;
  onLogout?: () => void; // Connect to the Lock Screen / Log Out trigger (#9)
}

export default function ProfileTab({ profile, onUpdateProfile, language, onLogout }: ProfileTabProps) {
  // Modal toggle states (#8)
  const [activeModal, setActiveModal] = useState<"profile" | "theme" | "security" | "language" | null>(null);

  // States inside profile editor
  const [partner1Name, setPartner1Name] = useState(profile.partner1Name);
  const [partner2Name, setPartner2Name] = useState(profile.partner2Name);
  const [anniversaryDate, setAnniversaryDate] = useState(profile.sinceDate);
  
  // Local upload file handle states (#7)
  const [p1Avatar, setP1Avatar] = useState(profile.partner1Avatar);
  const [p2Avatar, setP2Avatar] = useState(profile.partner2Avatar);
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({});

  // States inside security/passcode
  const [p1Passcode, setP1Passcode] = useState(profile.passcode || "love");
  const [showPass, setShowPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(audio.isSoundEnabled());

  const t = {
    zh: {
      profileSettingsTitle: "我们的秘密基地",
      profileSettingsSub: "在这里自定义属于你们二人的宇宙规则 🪐",
      connectedSince: "携手续写故事自",
      editAvatars: "修改情侣头像",
      saveChanges: "封存修改",
      p1AvatarLabel: "我的头像",
      p2AvatarLabel: "Ta 的头像",
      p1NameLabel: "我的称呼",
      p2NameLabel: "Ta 的称呼",
      anniversaryLabel: "携手誓言之日起点 (YYYY-MM-DD)",
      cancel: "取消并合拢",
      successAlert: "同步成功！规则已写入时光刻印 ✨",
      
      tileProfileTitle: "修改基础情侣档案",
      tileProfileSub: "更替专属甜蜜称呼与恋爱纪念日起点",
      tileThemeTitle: "挑选全局浪漫皮肤",
      tileThemeSub: "随时变换心情，支持红、蓝、绿、橘色等",
      tileSecurityTitle: "修改独立锁屏密码",
      tileSecuritySub: "更新 1945 天手写秘密木盒的解锁暗号",
      tileLangTitle: "国际化双语首选项",
      tileLangSub: "随时转换中英文界面翻译 (Toggle English)",
      tileSoundTitle: "甜蜜环境音效开关",
      tileSoundSubEnabled: "声音效果已开启 (轻点/成功/爱心音效)",
      tileSoundSubDisabled: "环境音效已静音",
      
      avatarUploadPrompt: "点击上传或拖入本地图片文件 📸",
      orUrlText: "或者或粘贴外部图片链接：",
      passcodeLabel: "安全锁屏密码 (当前密码为解锁暗号)",
      passSuccessText: "密码更新成功！安全木盒保护盾已重置 🔒",
      signOut: "登出 / 上锁秘密日记本"
    },
    en: {
      profileSettingsTitle: "Our Love Base",
      profileSettingsSub: "Customize the cosmic constants of your shared world 🪐",
      connectedSince: "Connected in romance since",
      editAvatars: "Change Couple Avatars",
      saveChanges: "Apply Modifications",
      p1AvatarLabel: "My Avatar (Base64/URL)",
      p2AvatarLabel: "Beloved Avatar (Base64/URL)",
      p1NameLabel: "My Nickname",
      p2NameLabel: "Beloved Nickname",
      anniversaryLabel: "Love Anniversary Start Date (YYYY-MM-DD)",
      cancel: "Close",
      successAlert: "Rule Synchronized successfully!",
      
      tileProfileTitle: "Essential Profile settings",
      tileProfileSub: "Adjust nicknames and love memorial dates",
      tileThemeTitle: "Personalize Theme Skins",
      tileThemeSub: "Swap skin styles including Warm Red & Soft Ocean Blue",
      tileSecurityTitle: "Lock Screen Passcode",
      tileSecuritySub: "Update passcode to lock/unlock your private vaults",
      tileLangTitle: "International Language Settings",
      tileLangSub: "Toggle UI language between Chinese and English",
      tileSoundTitle: "Sound Effects Configuration",
      tileSoundSubEnabled: "Love sounds are active (taps, heart-beats, success chimes)",
      tileSoundSubDisabled: "All sound effects are muted",
      
      avatarUploadPrompt: "Click to upload or drag local JPEG/PNG file 📸",
      orUrlText: "Or paste remote snapshot image URL:",
      passcodeLabel: "Secure Lockscreen Passcode",
      passSuccessText: "Passcode updated successfully! Security shield fortified 🔒",
      signOut: "Sign Out / Secure Lock Diary"
    }
  }[language];

  // Avatar upload handler — uploads to Cloudinary to avoid base64 bloating localStorage
  const handleLocalImageUpload = async (partner: "partner1" | "partner2", file: File) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload-media", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.url) throw new Error("No URL");
      if (partner === "partner1") {
        setP1Avatar(data.url);
        onUpdateProfile({ ...profile, partner1Avatar: data.url });
      } else {
        setP2Avatar(data.url);
        onUpdateProfile({ ...profile, partner2Avatar: data.url });
      }
    } catch {
      alert(language === "zh" ? "头像上传失败，请检查网络后重试 🧸" : "Avatar upload failed, please retry");
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent, id: string, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [id]: active }));
  };

  const handleDrop = (e: React.DragEvent, partner: "partner1" | "partner2", id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [id]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLocalImageUpload(partner, e.dataTransfer.files[0]);
    }
  };

  const handleSaveProfileData = () => {
    onUpdateProfile({
      ...profile,
      partner1Name: partner1Name.trim() || profile.partner1Name,
      partner2Name: partner2Name.trim() || profile.partner2Name,
      sinceDate: anniversaryDate || profile.sinceDate,
      partner1Avatar: p1Avatar || profile.partner1Avatar,
      partner2Avatar: p2Avatar || profile.partner2Avatar
    });
    setActiveModal(null);
    triggerGlobalToast();
  };

  const handleSaveTheme = (theme: ThemeName) => {
    onUpdateProfile({ ...profile, theme });
    setActiveModal(null);
    triggerGlobalToast();
  };

  const handleSaveLanguage = (lang: Language) => {
    onUpdateProfile({ ...profile, language: lang });
    setActiveModal(null);
    triggerGlobalToast();
  };

  const handleSavePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ ...profile, passcode: p1Passcode.trim() || "love" });
    setPassSuccess(t.passSuccessText);
    setTimeout(() => {
      setPassSuccess("");
      setActiveModal(null);
    }, 2000);
  };

  const triggerGlobalToast = () => {
    // Small confirmation trigger
    setPassSuccess(t.successAlert);
    setTimeout(() => setPassSuccess(""), 3000);
  };

  return (
    <div className="space-y-6 pt-1 select-none">
      {/* Dynamic Tiny banner wrapper (#1) */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100/40 relative overflow-hidden text-center">
        <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-rose-50/40 rounded-full" />
        
        <div className="flex flex-col items-center space-y-4">
          {/* Main Visual Display of Avatars */}
          <div className="flex items-center -space-x-4 relative">
            <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-md relative group">
              <img src={profile.partner1Avatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer select-none">
                <Camera size={16} />
              </div>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-md relative group">
              <img src={profile.partner2Avatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer select-none">
                <Camera size={16} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-800 flex items-center justify-center gap-1.5">
              {profile.partner1Name} & {profile.partner2Name}
              <Heart size={14} fill="#ad292f" className="text-[#ad292f] animate-pulse" />
            </h2>
            <p className="text-xs text-gray-500 font-semibold mt-1 flex items-center justify-center gap-1">
              {t.connectedSince} {new Date(profile.sinceDate).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Profile settings header menu */}
      <div className="px-1 text-center sm:text-left">
        <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase">
          {t.profileSettingsTitle}
        </h3>
        <p className="text-xs text-gray-400 mt-1">{t.profileSettingsSub}</p>
      </div>

      {/* Setting Tiles List representing options. Clicking each opens popups (#8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Tile 1: Basic profiles names/anniversary */}
        <button
          onClick={() => {
            audio.playTap();
            setActiveModal("profile");
          }}
          className="bg-white border border-rose-100/40 rounded-3xl p-5 text-left transition-all hover:bg-rose-50/30 hover:shadow-xs group flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#ad292f] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Heart size={18} fill="#ad292f" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800 group-hover:text-[#ad292f] transition-colors">
              {t.tileProfileTitle}
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed font-semibold">
              {t.tileProfileSub}
            </p>
          </div>
        </button>

        {/* Tile 2: Color skins */}
        <button
          onClick={() => {
            audio.playTap();
            setActiveModal("theme");
          }}
          className="bg-white border border-rose-100/40 rounded-3xl p-5 text-left transition-all hover:bg-rose-50/30 hover:shadow-xs group flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#ad292f] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Palette size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800 group-hover:text-[#ad292f] transition-colors">
              {t.tileThemeTitle}
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed font-semibold">
              {t.tileThemeSub}
            </p>
          </div>
        </button>

        {/* Tile 3: Secure passcode lockout */}
        <button
          onClick={() => {
            audio.playTap();
            setActiveModal("security");
          }}
          className="bg-white border border-rose-100/40 rounded-3xl p-5 text-left transition-all hover:bg-rose-50/30 hover:shadow-xs group flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#ad292f] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Shield size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800 group-hover:text-[#ad292f] transition-colors">
              {t.tileSecurityTitle}
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed font-semibold">
              {t.tileSecuritySub}
            </p>
          </div>
        </button>

        {/* Tile 4: Change languages */}
        <button
          onClick={() => {
            audio.playTap();
            setActiveModal("language");
          }}
          className="bg-white border border-rose-100/40 rounded-3xl p-5 text-left transition-all hover:bg-rose-50/30 hover:shadow-xs group flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#ad292f] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Languages size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800 group-hover:text-[#ad292f] transition-colors">
              {t.tileLangTitle}
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed font-semibold">
              {t.tileLangSub}
            </p>
          </div>
        </button>

        {/* Tile 5: Click to toggle Sound easily with sound feedback */}
        <button
          onClick={() => {
            const nextVal = !soundEnabled;
            setSoundEnabled(nextVal);
            audio.setSoundEnabled(nextVal);
            if (nextVal) {
              // Use timeout to allow state storage to write first
              setTimeout(() => {
                audio.playSuccess();
              }, 50);
            }
          }}
          className="bg-white border border-rose-100/40 rounded-3xl p-5 text-left transition-all hover:bg-rose-50/30 hover:shadow-xs group flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#ad292f] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-800 group-hover:text-[#ad292f] flex items-center justify-between transition-colors">
              <span>{t.tileSoundTitle}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-sans font-black ${soundEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                {soundEnabled ? 'ON' : 'MUTED'}
              </span>
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed font-semibold">
              {soundEnabled ? t.tileSoundSubEnabled : t.tileSoundSubDisabled}
            </p>
          </div>
        </button>

      </div>

      {/* POPUP MODAL WRAPPING DESIGNS (#8) — bottom-sheet style */}
      <AnimatePresence>

        {/* MODAL 1: EDIT ESSENTIAL PROFILE & LOCAL AVATARS */}
        {activeModal === "profile" && (
          <div
            className="fixed inset-0 bg-[#382e2e]/40 backdrop-blur-md z-[100] flex items-end"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl p-6 w-full max-w-2xl mx-auto space-y-4 shadow-xl border border-rose-100/20 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto -mt-1 mb-2" />
              <div className="flex justify-between items-center pb-2 border-b border-rose-50">
                <h3 className="text-md font-bold text-gray-800">
                  {t.tileProfileTitle} 💌
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-rose-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                
                {/* AVATAR PICKERS — simple system file picker */}
                <div className="space-y-3">
                  <span className="text-[10px] bg-rose-50 text-[#ad292f] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    {t.editAvatars}
                  </span>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {/* Partner 1 */}
                    <div className="space-y-2 text-center">
                      <p className="text-[11px] font-bold text-gray-500">{profile.partner1Name}</p>
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-rose-100 mx-auto">
                        <img src={p1Avatar} className="w-full h-full object-cover" alt="" />
                      </div>
                      <label className="block cursor-pointer">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#ad292f] bg-rose-50 hover:bg-rose-100 border border-rose-100 px-3 py-1.5 rounded-full transition-all">
                          <Camera size={12} />
                          {language === "zh" ? "选择图片" : "Choose Photo"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { if (e.target.files) handleLocalImageUpload("partner1", e.target.files[0]); }}
                        />
                      </label>
                      {p1Avatar.startsWith("data:") && (
                        <span className="text-[9px] font-bold text-emerald-600 flex items-center justify-center gap-0.5">
                          <Check size={9} />{language === "zh" ? "已更新" : "Updated"}
                        </span>
                      )}
                    </div>

                    {/* Partner 2 */}
                    <div className="space-y-2 text-center">
                      <p className="text-[11px] font-bold text-gray-500">{profile.partner2Name}</p>
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-rose-100 mx-auto">
                        <img src={p2Avatar} className="w-full h-full object-cover" alt="" />
                      </div>
                      <label className="block cursor-pointer">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#ad292f] bg-rose-50 hover:bg-rose-100 border border-rose-100 px-3 py-1.5 rounded-full transition-all">
                          <Camera size={12} />
                          {language === "zh" ? "选择图片" : "Choose Photo"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { if (e.target.files) handleLocalImageUpload("partner2", e.target.files[0]); }}
                        />
                      </label>
                      {p2Avatar.startsWith("data:") && (
                        <span className="text-[9px] font-bold text-emerald-600 flex items-center justify-center gap-0.5">
                          <Check size={9} />{language === "zh" ? "已更新" : "Updated"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nicknames parameters input */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="block text-gray-500">{t.p1NameLabel}</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-gray-150 rounded-xl bg-gray-50 focus:bg-white"
                      value={partner1Name}
                      onChange={(e) => setPartner1Name(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-gray-500">{t.p2NameLabel}</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-gray-150 rounded-xl bg-gray-50 focus:bg-white"
                      value={partner2Name}
                      onChange={(e) => setPartner2Name(e.target.value)}
                    />
                  </div>
                </div>

                {/* Anniversary Start date parameter */}
                <div className="space-y-1 pt-1.5 text-xs font-semibold">
                  <label className="block text-gray-500">{t.anniversaryLabel}</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-gray-150 rounded-xl bg-gray-50 text-gray-700 focus:bg-white"
                    value={anniversaryDate}
                    onChange={(e) => setAnniversaryDate(e.target.value)}
                  />
                </div>

              </div>

              {/* Apply/Cancel footer */}
              <div className="flex justify-end gap-2 text-xs font-bold pt-2 border-t border-rose-50">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveProfileData}
                  className="bg-[#ad292f] text-white px-5 py-2 rounded-full shadow-md shadow-rose-100"
                >
                  {t.saveChanges}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL 2: PICK THEME presets popup */}
        {activeModal === "theme" && (
          <div
            className="fixed inset-0 bg-[#382e2e]/40 backdrop-blur-md z-[100] flex items-end"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl p-6 w-full max-w-2xl mx-auto space-y-4 shadow-xl select-none max-h-[85vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto -mt-1 mb-2" />
              <div className="flex justify-between items-center pb-2 border-b border-rose-50">
                <h3 className="text-md font-bold text-gray-800">
                  {t.tileThemeTitle} 🎨
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-rose-50 rounded-full text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2 text-xs font-bold">
                <button
                  onClick={() => handleSaveTheme("red")}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                    profile.theme === "red" ? "border-[#ad292f] bg-[#fceae9]/30 text-[#ad292f]" : "border-gray-100 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#ad292f]" />
                    <span>胭脂暖红 (Warm Red)</span>
                  </div>
                  {profile.theme === "red" && <Check size={14} />}
                </button>

                <button
                  onClick={() => handleSaveTheme("blue")}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                    profile.theme === "blue" ? "border-[#1e4b52] bg-emerald-50 text-[#1e4b52]" : "border-gray-100 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#1e4b52]" />
                    <span>静谧黛蓝 (Ocean Blue)</span>
                  </div>
                  {profile.theme === "blue" && <Check size={14} />}
                </button>

                <button
                  onClick={() => handleSaveTheme("green")}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                    profile.theme === "green" ? "border-[#2a4c33] bg-emerald-50 text-[#2a4c33]" : "border-gray-100 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#2a4c33]" />
                    <span>森系和风 (Forest Green)</span>
                  </div>
                  {profile.theme === "green" && <Check size={14} />}
                </button>

                <button
                  onClick={() => handleSaveTheme("orange")}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                    profile.theme === "orange" ? "border-[#9c442f] bg-orange-50 text-[#9c442f]" : "border-gray-100 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#9c442f]" />
                    <span>晚霞落日 (Sunset Orange)</span>
                  </div>
                  {profile.theme === "orange" && <Check size={14} />}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL 3: SECURITY PASSCODE DIALOG */}
        {activeModal === "security" && (
          <div
            className="fixed inset-0 bg-[#382e2e]/40 backdrop-blur-md z-[100] flex items-end"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl p-6 w-full max-w-2xl mx-auto space-y-4 shadow-xl select-none max-h-[85vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto -mt-1 mb-2" />
              <div className="flex justify-between items-center pb-2 border-b border-rose-50">
                <h3 className="text-md font-bold text-gray-800">
                  {t.tileSecurityTitle} 🔒
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-rose-50 rounded-full text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSavePasscode} className="space-y-4 pt-1 font-semibold text-xs text-gray-600">
                {passSuccess && <p className="text-emerald-600 text-[10px] font-bold">{passSuccess}</p>}
                
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold">{t.passcodeLabel}</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      className="w-full p-2.5 pr-10 border border-gray-150 rounded-xl"
                      value={p1Passcode}
                      onChange={(e) => setP1Passcode(e.target.value)}
                      placeholder="love"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ad292f]"
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium">默认锁定解锁密钥为 "love"</p>
                </div>

                <div className="flex justify-end gap-2 text-[11px] font-bold pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="bg-[#ad292f] text-white px-5 py-2 rounded-full"
                  >
                    {t.saveChanges}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL 4: LANGUAGE SETTINGS DIALOG */}
        {activeModal === "language" && (
          <div
            className="fixed inset-0 bg-[#382e2e]/40 backdrop-blur-md z-[100] flex items-end"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl p-6 w-full max-w-2xl mx-auto space-y-4 shadow-xl select-none max-h-[85vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto -mt-1 mb-2" />
              <div className="flex justify-between items-center pb-2 border-b border-rose-50">
                <h3 className="text-md font-bold text-gray-800">
                  {t.tileLangTitle} 🌐
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-rose-50 rounded-full text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2 text-xs font-bold">
                <button
                  onClick={() => handleSaveLanguage("zh")}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                    profile.language === "zh" ? "border-[#ad292f] bg-[#fceae9]/30 text-[#ad292f]" : "border-gray-100 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <span>简体中文 (Simplified Chinese)</span>
                  {profile.language === "zh" && <Check size={14} />}
                </button>

                <button
                  onClick={() => handleSaveLanguage("en")}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                    profile.language === "en" ? "border-[#ad292f] bg-[#fceae9]/30 text-[#ad292f]" : "border-gray-100 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <span>English (International translate)</span>
                  {profile.language === "en" && <Check size={14} />}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {/* Logout/Lock application button trigger (#9) */}
      <button
        onClick={() => {
          if (onLogout) {
            onLogout();
          } else {
            alert("Lock completed. Secure gateway initialized!");
          }
        }}
        className="w-full flex items-center justify-center gap-2 p-4 text-xs font-bold border border-rose-200/60 text-[#ad292f] bg-white rounded-3xl hover:bg-rose-50/40 transition-colors duration-150 shadow-xs"
      >
        <Lock size={14} className="animate-pulse" />
        {t.signOut}
      </button>

    </div>
  );
}
