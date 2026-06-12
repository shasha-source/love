import { TimelinePost, DiaryEntry, CalendarEvent, ProfileSettings } from "./types";

export const initialProfile: ProfileSettings = {
  partner1Name: "Sasa",
  partner2Name: "Hao Hao",
  partner1Avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnY6Z8ijdJmdQxE5vP8tlF3bhC9sLVyviY_V9MwsbkR9cdKnJwuT2e_8yJ1vTesDH5LdMCqFzpc-62JADn41fE6NGxi9i77K_3MqUFhfgysPYyk4Iox8jUcMw343Yy5A3NM_H6AT8utM6GjaOx800dj6MNWOUEuUZouWvIK8ssxlEpZk6ircxPYz8DefjBP1aecayVP2iD6ZTxtww2_rr5hxO-z6Kn7mCWTgmVjPmNuL2Pzpe4O4S7VwyrF6afOMcjiQBzdyNJMho",
  partner2Avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_P6mBGvruCvn7GQVMoZ8eLFlQKMOXcvoHTSm2KL6ARK7Q4PvWm27Nd98y96irn6rYpGgvnad4SgHDBe3rJyNp3-SP84rszV0aTk5SkdI5Gib6yJ5hCdTmjd2IPVfkc_EJcTZGMkuNZJQ8lPb-ENbpjcXdzutTqYTXhmIpAHsgT5c1wxFh8Z1xgngOT01deeCaZAFZ2K6-PFzc2qIf2ICUv0brLrBACTacrmR4eEFiMUll1cKtzhy46R0JXrEGiCjYteXxODQ0Nb4",
  sinceDate: "2018-10-24", // October 24, 2018
  theme: "red",
  language: "zh",
  passcode: "love"
};

export const initialTimelinePosts: TimelinePost[] = [
  {
    id: "post-1",
    author: "Sasa",
    authorKey: "partner1",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBD1G1lVsVM729f9QnMgzQqIliUbIqes6BDw30ddkMc832Y1gYYlvatFOg0pZxuGRTnS4cYb0Cn1DfrzH3mPImbUxFVetKWjBcSBvmJH1K6sE_GAn2-LBX8qKyPrvw8pLd0XGq6N3kbQssb1WLN4mqDQk1GHOrv9td-h2NzY7hT_LZ1DkV34e2lSjLS13V8lmVqx-m4bCyGiSVL2uvCuqygQml81OKAiz7N8WF5jn4fnaYV8V5Mq8FLErFmL7qKbZcLaOJL-LohmcA",
    content: "Lalala, another beautiful day with you. The coffee this morning felt special because we shared that quiet moment on the balcony.",
    likes: 12,
    likedByUser: false,
    timestamp: "2026-06-12T07:11:00Z",
    comments: [
      {
        id: "c-1",
        author: "Hao Hao",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyEHooAW9GHr31J-Bn7amRboVoNe05swCbb38MwzXP-M1nvkg8g74cwBMlgIxfTe6aJvirDqR2pMLGBEs4chN0Qq1Hw4-RhvkF-IsZFEcxAvoCDIkTv2pDBQgzoFi5T_PHuMAIu9jtVJBp0TsNixIcyWoIMG4SqSmLdTHwACewIFujrC8Tt4ilQvYpPpZoOgRIX6YPLhJ04FZg1uq8BlbH6AhFPQSBforqRsX8lE8n2k85OX2Vjo0mL1KPhts_8rbldcbIGBeagqA",
        content: "Me too! Best coffee ever ☕",
        timestamp: "2026-06-12T07:12:00Z"
      }
    ]
  },
  {
    id: "post-2",
    author: "Hao Hao",
    authorKey: "partner2",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyEHooAW9GHr31J-Bn7amRboVoNe05swCbb38MwzXP-M1nvkg8g74cwBMlgIxfTe6aJvirDqR2pMLGBEs4chN0Qq1Hw4-RhvkF-IsZFEcxAvoCDIkTv2pDBQgzoFi5T_PHuMAIu9jtVJBp0TsNixIcyWoIMG4SqSmLdTHwACewIFujrC8Tt4ilQvYpPpZoOgRIX6YPLhJ04FZg1uq8BlbH6AhFPQSBforqRsX8lE8n2k85OX2Vjo0mL1KPhts_8rbldcbIGBeagqA",
    content: "Missing my sister today. She's so amazing, she actually opened a dedicated app just for us to keep our memories. Here's to 1945 days of small wonders!",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwViYL90tkLG5Atstxx986hraf15kHQ-zKiIXWwmvmucmP0XtnMrEB0eKc0SCo44hNtcK5pHmj5WKDw0dA-99MHL9zL7_L2oNKpOgRAkbKPpNAjKCaYVnri-vYPfIFQzv3AQTRMS826qnVJBaX9EUIWync9osNySjPAj7PW-dCOljjNbhtAcCrWTFC-ZFkAMBZ6Jz--e22IKoghN0BGGXN1g8LdAnIhMZnKDB3NHYfVGVKy-ffdCuYzdlqWnXhjCttUUARTJdlk4k",
    mood: "Happy",
    likes: 24,
    likedByUser: false,
    timestamp: "2026-06-12T01:14:00Z",
    comments: [
      {
        id: "c-2",
        author: "Sasa",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBD1G1lVsVM729f9QnMgzQqIliUbIqes6BDw30ddkMc832Y1gYYlvatFOg0pZxuGRTnS4cYb0Cn1DfrzH3mPImbUxFVetKWjBcSBvmJH1K6sE_GAn2-LBX8qKyPrvw8pLd0XGq6N3kbQssb1WLN4mqDQk1GHOrv9td-h2NzY7hT_LZ1DkV34e2lSjLS13V8lmVqx-m4bCyGiSVL2uvCuqygQml81OKAiz7N8WF5jn4fnaYV8V5Mq8FLErFmL7qKbZcLaOJL-LohmcA",
        content: "Aww Hao Hao! We're in this together forever ❤️",
        timestamp: "2026-06-12T01:30:00Z"
      }
    ]
  },
  {
    id: "milestone-1",
    author: "Sasa",
    authorKey: "partner1",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBD1G1lVsVM729f9QnMgzQqIliUbIqes6BDw30ddkMc832Y1gYYlvatFOg0pZxuGRTnS4cYb0Cn1DfrzH3mPImbUxFVetKWjBcSBvmJH1K6sE_GAn2-LBX8qKyPrvw8pLd0XGq6N3kbQssb1WLN4mqDQk1GHOrv9td-h2NzY7hT_LZ1DkV34e2lSjLS13V8lmVqx-m4bCyGiSVL2uvCuqygQml81OKAiz7N8WF5jn4fnaYV8V5Mq8FLErFmL7qKbZcLaOJL-LohmcA",
    content: "Five years of laughter, growth, and endless love. Looking forward to many more adventures together.",
    likes: 36,
    likedByUser: false,
    timestamp: "2024-10-24T18:00:00Z",
    mood: "In Love",
    comments: [],
    isMilestone: true,
    milestoneType: "anniversary",
    milestoneTitle: "Our 5th Anniversary",
    milestoneLocation: "The Grand Bistro"
  },
  {
    id: "milestone-2",
    author: "Hao Hao",
    authorKey: "partner2",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyEHooAW9GHr31J-Bn7amRboVoNe05swCbb38MwzXP-M1nvkg8g74cwBMlgIxfTe6aJvirDqR2pMLGBEs4chN0Qq1Hw4-RhvkF-IsZFEcxAvoCDIkTv2pDBQgzoFi5T_PHuMAIu9jtVJBp0TsNixIcyWoIMG4SqSmLdTHwACewIFujrC8Tt4ilQvYpPpZoOgRIX6YPLhJ04FZg1uq8BlbH6AhFPQSBforqRsX8lE8n2k85OX2Vjo0mL1KPhts_8rbldcbIGBeagqA",
    content: "Sasa's Birthday: Planning a surprise dinner at the pier. Don't forget the white lilies and the vintage camera she wanted!",
    likes: 18,
    likedByUser: false,
    timestamp: "2026-06-24T12:00:00Z",
    mood: "Happy",
    comments: [],
    isMilestone: true,
    milestoneType: "birthday",
    milestoneTitle: "Sasa's Birthday",
    milestoneLocation: "The Pier District"
  },
  {
    id: "milestone-3",
    author: "Sasa",
    authorKey: "partner1",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqmxl-enzn26tfET4bnNOpWvCpe7CkmXQxo7a7FRp_JrMDA0ImDDzx8-7Yoy7XcbJIfClKbb-6U6vx10RPwTEqvHU3X1Jm1bwFDcD3ks7Zz4ZArnNtErmTMS_tmPdHxPYOiPTeFgXuqZUYBScE67e0nVJKnbxKH7Bwg_IzKB9-6nxddusTS3-DOUkHpCkAZazFy0o35BgvUoeHfTwTM_rtJN1Wujjai5Upb7Lt8Dq2JDRj6SSUxXTD8Pvx_HMQb9WT_s_2oLamIOU",
    content: "Our Summer Getaway: A cozy weekend road trip to the mountain cabin we bookmarked.",
    likes: 15,
    likedByUser: false,
    timestamp: "2026-07-04T09:00:00Z",
    mood: "Peaceful",
    comments: [],
    isMilestone: true,
    milestoneType: "custom",
    milestoneTitle: "Our Summer Getaway",
    milestoneLocation: "Whispering Pines Cabin"
  },
  {
    id: "post-3",
    author: "Sasa",
    authorKey: "partner1",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqmxl-enzn26tfET4bnNOpWvCpe7CkmXQxo7a7FRp_JrMDA0ImDDzx8-7Yoy7XcbJIfClKbb-6U6vx10RPwTEqvHU3X1Jm1bwFDcD3ks7Zz4ZArnNtErmTMS_tmPdHxPYOiPTeFgXuqZUYBScE67e0nVJKnbxKH7Bwg_IzKB9-6nxddusTS3-DOUkHpCkAZazFy0o35BgvUoeHfTwTM_rtJN1Wujjai5Upb7Lt8Dq2JDRj6SSUxXTD8Pvx_HMQb9WT_s_2oLamIOU",
    content: "Distance only makes the heart grow fonder. Can't wait for our next trip.",
    likes: 18,
    likedByUser: false,
    timestamp: "2026-06-11T10:14:00Z",
    comments: []
  }
];

export const initialDiaryEntries: DiaryEntry[] = [
  {
    id: "diary-1",
    dateStr: "Oct 24th",
    title: "lakehouse",
    subtitle: "The quietest morning at the lakehouse",
    author: "Sasa",
    content: "We woke up before the alarms today. The world felt like it was only ours for those thirty minutes before the sun cleared the pines. You were still wrapped in that oversized wool blanket, clutching your coffee mug like it was a lifeline, but your eyes were fixed on the mist rising off the water.\n\nWe didn't say much. Some moments don't need narration. I remember thinking about how different this felt from our first trip here—less frantic, more settled. Like the lake itself, we've found our depth.",
    imageUrl: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80",
    likes: 12,
    likedByUser: false,
    commentsCount: 4,
    timestamp: "2025-10-24T08:00:00Z",
    essenceText: "A chapter defined by silence and presence. Today's entry reflects a deepening of your connection, shifting from excitement to comfortable belonging."
  },
  {
    id: "diary-2",
    dateStr: "Oct 21st",
    title: "Pasta Night",
    subtitle: "Rainy day recipes and messy flour hands",
    author: "Hao Hao",
    content: "The pasta making was a disaster, but the laughing made it better. I still can't believe you tried to use a wine bottle as a rolling pin. We're getting better at this 'adulting' thing, one ruined meal at a time.",
    imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80",
    imageUrl2: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
    likes: 28,
    likedByUser: false,
    commentsCount: 9,
    timestamp: "2025-10-21T15:42:00Z",
    essenceText: "A testimony of beautiful chaos where playfulness resolves any kitchen calamity. Your humor is the secret spice that blends your separate worlds."
  }
];

export const initialCalendarEvents: CalendarEvent[] = [
  {
    id: "cal-1",
    title: "Our 5th Anniversary",
    date: "2024-10-24", // Wait, 1945 days is roughly 5.3 years. Let's calculate from sinceDate Oct 24, 2018. Anniversary happens every Oct 24!
    description: "Five years of laughter, growth, and endless love. Looking forward to many more adventures together.",
    location: "The Grand Bistro",
    eventType: "anniversary"
  },
  {
    id: "cal-2",
    title: "Sasa's Birthday",
    date: "2026-06-24", // Close birthday event
    description: "Planning a surprise dinner at the pier. Don't forget the white lilies and the vintage camera she wanted!",
    location: "The Pier District",
    eventType: "birthday"
  },
  {
    id: "cal-3",
    title: "Our Summer Getaway",
    date: "2026-07-04",
    description: "A cozy weekend road trip to the mountain cabin we bookmarked.",
    location: "Whispering Pines Cabin",
    eventType: "custom"
  }
];
