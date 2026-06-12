export type ThemeName = "red" | "blue" | "green" | "orange";
export type Language = "zh" | "en";

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

export interface MediaItem {
  url: string;
  type: "image" | "video";
}

export interface TimelinePost {
  id: string;
  author: string;
  authorKey: "partner1" | "partner2";
  avatar: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaItems?: MediaItem[];
  mood?: string;
  likes: number;
  likedByUser: boolean;
  comments: Comment[];
  timestamp: string;
  isSystemInsight?: boolean;
  isMilestone?: boolean;
  milestoneType?: "anniversary" | "birthday" | "custom";
  milestoneTitle?: string;
  milestoneLocation?: string;
}

export interface DiaryEntry {
  id: string;
  dateStr: string; // e.g. "Oct 24th"
  title: string;
  subtitle: string;
  content: string;
  imageUrl?: string;
  imageUrl2?: string;
  likes: number;
  likedByUser: boolean;
  commentsCount: number;
  timestamp: string;
  essenceText?: string;
  author: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // e.g. "2026-09-13" or format "YYYY-MM-DD"
  description: string;
  location?: string;
  eventType: "anniversary" | "birthday" | "custom";
  likes?: number;
  likedByUser?: boolean;
  comments?: Array<{ id: string; author: string; content: string; timestamp: string; mediaUrl?: string; mediaType?: "image" | "video" }>;
}

export interface ProfileSettings {
  partner1Name: string;
  partner2Name: string;
  partner1Avatar: string;
  partner2Avatar: string;
  sinceDate: string; // Since when they are together, e.g. "2018-10-24"
  theme: ThemeName;
  language: Language;
  passcode: string; // Password locking
}
