import logo from "./assets/logo.png";
import Header from "./components/Header";
import { AdminPanel } from "./components/AdminPanel";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    BookOpen, Award, CheckCircle, Edit2, Save, X,
    Clock, Plus, Loader2, ShieldCheck, LogOut,
    CreditCard, Chrome, RefreshCw, Mail, Eye, EyeOff,
    KeyRound, UserPlus, ArrowLeft, AtSign, Lock,
} from "lucide-react";
import {
    supabase, signInWithGoogle, signOut,
    getProfile, getActiveSubscription, createSubscription,
    type Profile, type Subscription,
} from "./lib/supabase";
import type { User } from "@supabase/supabase-js";

// ════════════════════════════════════════════════════════════════════════════
//  PAYSTACK CONFIG  — replace with your live keys from dashboard.paystack.com
// ════════════════════════════════════════════════════════════════════════════
const PAYSTACK_PUBLIC_KEY   = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;
const MONTHLY_AMOUNT_KOBO   = 100_000;   // ₦1,000 in kobo
const PAYSTACK_PLAN_CODE    = "";        // Optional: set your Paystack monthly plan code here

declare global {
    interface Window {
        PaystackPop: {
            setup: (config: {
                key: string; email: string; amount: number; currency: string;
                reference: string; plan?: string;
                metadata?: Record<string, unknown>;
                onClose: () => void;
                callback: (r: { reference: string; status: string }) => void;
            }) => { openIframe: () => void };
        };
    }
}

// ════════════════════════════════════════════════════════════════════════════
//  BIBLE DATABASE
// ════════════════════════════════════════════════════════════════════════════
type BibleVersions = { KJV: string; NKJV: string; NIV: string; ESV: string; AMP: string; NLT: string; MSG: string };
type ScriptureDB   = Record<string, BibleVersions>;

const initialScriptureDB: ScriptureDB = {
    "Phil. 2:8": {
        KJV: "And being found in fashion as a man, he humbled himself, and became obedient unto death, even the death of the cross.",
        NKJV:"And being found in appearance as a man, He humbled Himself and became obedient to the point of death, even the death of the cross.",
        NIV: "And being found in appearance as a man, he humbled himself by becoming obedient to death— even death on a cross!",
        ESV: "And being found in human form, he humbled himself by becoming obedient to the point of death, even death on a cross.",
        AMP: "After He had appeared in human form, He humbled Himself by becoming obedient to the point of death, even death on a cross.",
        NLT: "When he appeared in human form, he humbled himself in obedience to God and died a criminal's death on a cross.",
        MSG: "Having become human, he stayed human. He didn't claim special privileges. Instead, he lived a selfless, obedient life and then died a selfless, obedient death—and the worst kind of death at that: a crucifixion.",
    },
};

// ════════════════════════════════════════════════════════════════════════════
//  QUIZ
// ════════════════════════════════════════════════════════════════════════════
const quizQuestions = [
    { q:"What is the title of today's lesson?", a:["Faithfulness","OBEDIENCE","Divine Favour","Spiritual Growth"], correct:1 },
    { q:"Which scripture is the memory verse?", a:["Genesis 12:1-5","Philippians 2:8","Romans 12:1","Psalm 23:1"], correct:1 },
    { q:"Obedience is primarily a relationship between:", a:["Friends","Teacher and student","A higher authority and a lesser person","Parents and children only"], correct:2 },
    { q:"Who is the Creator and Possessor of heaven and earth?", a:["Abraham","Angels","God","Man"], correct:2 },
    { q:"Who was commanded to leave Haran?", a:["Moses","David","Abram","Isaac"], correct:2 },
    { q:"What was Abram asked to do?", a:["Build a temple","Fight a battle","Leave for an unknown land","Return to Egypt"], correct:2 },
    { q:"Abram's obedience teaches that personal will must be:", a:["Celebrated","Ignored","Buried in God's will","Shared with others"], correct:2 },
    { q:"God's instructions are found in:", a:["Traditions only","Dreams alone","The Bible","Human opinions"], correct:2 },
    { q:"Disobedience becomes:", a:["Wisdom","Sin","Progress","Neutral"], correct:1 },
    { q:"True obedience may require laying aside:", a:["Convenience","Feelings","Human reasoning","All of the above"], correct:3 },
    { q:"'Unto the land that I will show thee' teaches:", a:["Immediate clarity","Blind trust in God","Fear of failure","Material success"], correct:1 },
    { q:"Blessings are often rewards of:", a:["Popularity","Obedience","Wealth","Knowledge"], correct:1 },
    { q:"Which verse says Christ became obedient unto death?", a:["Philippians 2:8","Genesis 12:1","John 3:16","Psalm 91:1"], correct:0 },
    { q:"Jesus is our perfect example of:", a:["Leadership","Obedience","Prosperity","Wisdom only"], correct:1 },
    { q:"According to Colossians 1:17, Christ:", a:["Judges nations","Holds all things together","Builds cities","Creates gold"], correct:1 },
    { q:"The aim of this subject is to bring every man to:", a:["Fame","Religious activity","The obedience of Christ","Earthly power"], correct:2 },
    { q:"One objective of obedience is peaceful coexistence between:", a:["Nations only","God and man, and man with man","Churches only","Families only"], correct:1 },
    { q:"When convenience conflicts with God's pleasure, God will:", a:["Compromise","Wait forever","Not compromise","Change His standards"], correct:2 },
    { q:"Many excuses for disobedience are removed because:", a:["Others obeyed first","Jesus obeyed even unto death","Life is easy","Rules changed"], correct:1 },
    { q:"What best summarizes this lesson?", a:["Obedience preserves relationship with God and opens blessings","Success comes by effort alone","Feelings should guide decisions","Delay is harmless"], correct:0 },
];

// ════════════════════════════════════════════════════════════════════════════
//  LESSON CONTENT
// ════════════════════════════════════════════════════════════════════════════
type SubPoint    = { title: string; content: string; scriptures?: string[] };
type LessonPoint = { title: string; content: string; scriptures: string[]; subPoints: SubPoint[] };
type ContentData = {
    lessonDate: string; lessonTitle: string;
    memoryVerse: string; memoryVerseRef: string;
    introduction: string; lessonIntroScriptures: string[];
    aims: string; objectives: string;
    lessonIntro: string; lessonPoints: LessonPoint[];
    conclusion: string; conclusionScriptures: string[];
    prayerPoints: string[];
};

const defaultContent: ContentData = {
    lessonDate:  "July 3, 2016",
    lessonTitle: "OBEDIENCE",
    memoryVerse: "And being found in fashion as a man, he humbled himself, and became obedient unto death, even the death of the cross - Phil. 2:8.",
    memoryVerseRef: "Phil. 2:8",
    lessonIntroScriptures: ["Colossians 1:17", "2 Cor. 10:5"],
    introduction: "Obedience is a matter of relationship between two persons, one higher and the other lesser. It therefore has to do with being submissive to another's will, instructions, terms, commandments, conditions or the keeping of another's will/wish. The Bible has proven God beyond any doubt to be the creator and possessor of Heaven and Earth. In them he has made other persons lesser to himself for his pleasure to co-inhabit. This is where obedience steps into the scene of the kingdom of God or else things would fall apart. The creator of wisdom has more wisdom than wisdom and by Christ Jesus he holds all things together in obedience to himself - Colossians 1:17, 2 Corinthians 10:5.",
    aims:        "This subject is aimed at bringing every man to the obedience of Christ.",
    objectives:  "That there may be a peaceful co-existence between God and man, and between man and man.",
    lessonIntro: "Abraham the son of Terah, a descendant of a Godly seed Shem was asked by God to leave Haran, his family and to move to a land unknown at the time of instruction. Gen. 12:1-5. Many promises were attached to this commandment that was obeyed by Abram, a man like you and I. The lesson drawn from the text is enumerated below:",
    lessonPoints: [
        {
            title: "THE FOUNDATION OF OBEDIENCE",
            content: "Obedience is a matter of two parties involving a higher authority and a lesser subject. It requires a mandatory response to divine instructions as seen in the call of Abram. Gen. 12:1.",
            scriptures: ["Gen. 12:1-5"],
            subPoints: [
                { title:"TWO PARTIES INVOLVED", content:"Obedience is a matter of two parties, 'THE LORD SAID TO ABRAM'. Lord and Abram. This means that the Lord requires the obedience of any of us. Gen. 12:1.", scriptures:["Gen. 12:1"] },
                { title:"SURRENDER OF WILL",    content:"Abram's will was buried in God's will and that is what He requires of your will also. As Christ Jesus holds all things together, we must align our will with His. Col. 1:17.", scriptures:["Colossians 1:17"] },
                { title:"DIVINE COMMAND",        content:"Abram was not given a choice to choose between going and staying back. It shows that God commands and not suggest. The lesser person which is you has to obey mandatorily. If you disobey the instruction, it becomes sin. The Bible is the book where God's instructions are found.", scriptures:[] },
            ],
        },
        {
            title: "THE COST, FAITH, AND REWARD OF OBEDIENCE",
            content: "True obedience disregards personal convenience and feelings, requiring a blind trust in God's leading, exemplified by Christ's obedience unto death. Phil. 2:8.",
            scriptures: ["Phil. 2:8", "2 Cor. 10:5"],
            subPoints: [
                { title:"CONVENIENCE AND PLEASURE", content:"Abram's convenience was not considered. For a man to be obedient to God, he must forget about his convenience. Remember that you are made for his pleasure and if your convenience double-crosses his pleasure, he will not compromise.", scriptures:[] },
                { title:"DISREGARDING FEELINGS",    content:"God does not care about how you or others feel about what he instructs you to do. Abram had to leave his home-land, family and quit business. We must drop our feelings and fulfill God's conditions and terms. 2 Cor. 10:5.", scriptures:["2 Cor. 10:5"] },
                { title:"BLIND TRUST",              content:"The word 'unto the land that I will show thee' speaks of uncertainty, a blind trust and suggests irrationality. Gen 12:1. YOU MAY NOT KNOW WHERE YOUR OBEDIENCE TO GOD WILL TAKE YOU but you are required to TRUST AND OBEY.", scriptures:["Genesis 12:1"] },
                { title:"REWARDS OF OBEDIENCE",     content:"The text shows that blessings and benefits are rewards of obedience.", scriptures:[] },
            ],
        },
    ],
    conclusion: "Obedience is the only thing that will keep our relationship with God and the key to God's storehouse of blessing. Jesus our perfect example was also human like us, whose obedience even led him to death. Phil. 2:8. Many things God demand of us are not as much as that and this is why we don't have excuses today if we aren't obedient.",
    conclusionScriptures: [],
    prayerPoints: [
        "Father, help me to bring my will into total subjection to Yours, just as Abram did. Gen. 12:4.",
        "Lord, give me the grace to choose Your pleasure over my personal convenience every day.",
        "Father, strengthen my heart to trust and obey You even when the destination is not clear. Gen. 12:1.",
        "Lord Jesus, empower me by Your Spirit to walk in the same level of obedience that You displayed on the cross. Phil. 2:8.",
    ],
};

// ── Auth mode type ───────────────────────────────────────────────────────────
type AuthMode = "login" | "signup" | "forgot";

// ════════════════════════════════════════════════════════════════════════════
//  MAIN APP COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const SundaySchoolApp = () => {
    // ── Auth & subscription state ─────────────────────────────────────────────
    const [authUser,      setAuthUser]      = useState<User | null>(null);
    const [profile,       setProfile]       = useState<Profile | null>(null);
    const [subscription,  setSubscription]  = useState<Subscription | null>(null);
    const [isAdmin,       setIsAdmin]       = useState(false);

    // ── Screen state ──────────────────────────────────────────────────────────
    // 'boot' | 'auth' | 'payment' | 'app'
    const [screen,       setScreen]       = useState<"boot" | "auth" | "payment" | "app">("boot");
    const [loadingPct,   setLoadingPct]   = useState(0);
    const [authLoading,  setAuthLoading]  = useState(false);
    const [payLoading,   setPayLoading]   = useState(false);

    // ── Email auth state ──────────────────────────────────────────────────────
    const [authMode,      setAuthMode]      = useState<AuthMode>("login");
    const [authEmail,     setAuthEmail]     = useState("");
    const [authPassword,  setAuthPassword]  = useState("");
    const [authFullName,  setAuthFullName]  = useState("");
    const [authConfirm,   setAuthConfirm]   = useState("");
    const [authError,     setAuthError]     = useState("");
    const [authSuccess,   setAuthSuccess]   = useState("");
    const [showPassword,  setShowPassword]  = useState(false);
    const [showConfirm,   setShowConfirm]   = useState(false);
    const [subChecking,  setSubChecking]  = useState(false);

    // ── App state ─────────────────────────────────────────────────────────────
    const [activeTab,      setActiveTab]      = useState("intro");
    const [darkMode,       setDarkMode]       = useState(true);
    const [fontSize,       setFontSize]       = useState(16);
    const [tabLoading,     setTabLoading]     = useState(false);
    const [scriptureDB,    setScriptureDB]    = useState<ScriptureDB>({});
    const [scriptureLoading, setScriptureLoading] = useState(false);
    const [scriptureSyncing, setScriptureSyncing] = useState(false); // DB write in progress
    const [selectedVerse,  setSelectedVerse]  = useState<string | null>(null);
    const [bibleVersion,   setBibleVersion]   = useState<keyof BibleVersions>("KJV");
    const [showVerseModal, setShowVerseModal] = useState(false);
    const [verseLoading,   setVerseLoading]   = useState(false);
    const [editMode,       setEditMode]       = useState(false);
    const [newVerse,       setNewVerse]       = useState<{ reference: string; versions: BibleVersions }>({
        reference: "", versions: { KJV:"", NKJV:"", NIV:"", ESV:"", AMP:"", NLT:"", MSG:"" },
    });
    const [quizActive,      setQuizActive]      = useState(false);
    const [currentQ,        setCurrentQ]        = useState(0);
    const [score,           setScore]           = useState(0);
    const [timeLeft,        setTimeLeft]        = useState(50);
    const [showResults,     setShowResults]     = useState(false);
    const [commitments,     setCommitments]     = useState<Array<{ text: string; date: string }>>([]);
    const [commitInput,     setCommitInput]     = useState("");
    const [loveRating,      setLoveRating]      = useState(5);
    const [editingContent,  setEditingContent]  = useState<string | null>(null);
    const [contentData,     setContentData]     = useState<ContentData>(defaultContent);

    // ── Scripture manager state (admin) ───────────────────────────────────────
    const [scriptureSearch,   setScriptureSearch]   = useState("");
    const [editingRef,        setEditingRef]        = useState<string | null>(null);       // key being edited
    const [editingRefNew,     setEditingRefNew]      = useState("");                        // renamed reference
    const [editingVersions,   setEditingVersions]   = useState<BibleVersions>({ KJV:"",NKJV:"",NIV:"",ESV:"",AMP:"",NLT:"",MSG:"" });
    const [deleteConfirmRef,  setDeleteConfirmRef]  = useState<string | null>(null);
    const [scriptureSaved,    setScriptureSaved]    = useState<string | null>(null);       // toast ref

    // ── Boot loader ───────────────────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingPct((p) => {
                if (p >= 100) { clearInterval(interval); return 100; }
                return p + 12;
            });
        }, 180);
        return () => clearInterval(interval);
    }, []);

    // ── localStorage cache helpers ─────────────────────────────────────────────
    // After payment succeeds we write the subscription end-date to localStorage.
    // On startup we read it back so a Supabase lock failure never drops the user
    // back to the payment screen.
    const CACHE_KEY = "ssa_sub_cache";
    const writeSubCache = (userId: string, endDate: string) => {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, endDate })); } catch {
            return null;
        }
    };
    const readSubCache = (userId: string): boolean => {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return false;
            const { userId: uid, endDate } = JSON.parse(raw);
            return uid === userId && new Date(endDate) > new Date();
        } catch { return false; }
    };
    const clearSubCache = () => { try { localStorage.removeItem(CACHE_KEY); } catch {
        return null;
    } };

    // ── Retry DB fetch with exponential back-off ───────────────────────────────
    const fetchWithRetry = async <T,>(
        fn: () => Promise<T | null>,
        retries = 3,
        delayMs = 600
    ): Promise<T | null> => {
        for (let i = 0; i < retries; i++) {
            try {
                const result = await fn();
                if (result !== null) return result;
            } catch (err) {
                console.warn(`Attempt ${i + 1} failed:`, err);
            }
            if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
        }
        return null;
    };

    // ── Debounce guard — prevents concurrent resolveUser calls ────────────────
    const resolvingRef = useRef(false);
    const loadingPctRef = useRef(0);
    useEffect(() => { loadingPctRef.current = loadingPct; }, [loadingPct]);

    const resolveUser = useCallback(async (user: User | null) => {
        if (resolvingRef.current) return;   // already in progress — skip
        resolvingRef.current = true;

        try {
            if (!user) { setScreen("auth"); return; }
            setAuthUser(user);
            setSubChecking(true);

            // 1️⃣  Check localStorage cache first — instant, no network needed
            if (readSubCache(user.id)) {
                // Cache says active — go straight to app while we verify in background
                setScreen("app");
            }

            // 2️⃣  Fetch profile & subscription with retry (handles lock contention)
            const [prof, sub] = await Promise.all([
                fetchWithRetry(() => getProfile(user.id)),
                fetchWithRetry(() => getActiveSubscription(user.id)),
            ]);

            setProfile(prof);
            setSubscription(sub);
            setIsAdmin(prof?.role === "admin");
            setSubChecking(false);

            if (sub) {
                writeSubCache(user.id, sub.end_date); // refresh cache
                setScreen("app");
            } else {
                // Only clear cache & show payment if DB confirmed no active sub
                clearSubCache();
                setScreen("payment");
            }
        } finally {
            resolvingRef.current = false;
        }
    }, []);

    // Load scriptures from DB whenever the user reaches the app screen.
    // loadScripturesFromDB is wrapped in useCallback so this won't loop.
    // useEffect(() => {
    //     if (screen === "app") {
    //         void loadScripturesFromDB();
    //     }
    // }, [screen, loadScripturesFromDB]);

    useEffect(() => {
        const { data: { subscription: listener } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                // Wait for boot animation before resolving
                if (loadingPctRef.current < 100) {
                    await new Promise((r) => setTimeout(r, 2000));
                }
                await resolveUser(session?.user ?? null);
            }
        );
        return () => listener.unsubscribe();
    }, [resolveUser]);

    // ── Quiz timer ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!quizActive || showResults) return;
        const t = setInterval(() => setTimeLeft((p) => { if (p <= 1) { endQuiz(); return 0; } return p - 1; }), 1000);
        return () => clearInterval(t);
    }, [quizActive, showResults]);

    // ── Keyboard shortcuts ─────────────────────────────────────────────────────
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            // Ctrl+Shift+E — only admins can enter edit mode
            if (e.ctrlKey && e.shiftKey && e.key === "E" && isAdmin) {
                e.preventDefault();
                setEditingContent((p) => p ? null : activeTab);
            }
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [activeTab, isAdmin]);

    // ─── EMAIL AUTH HANDLERS ──────────────────────────────────────────────────
    const clearAuthForm = () => {
        setAuthError(""); setAuthSuccess("");
        setAuthEmail(""); setAuthPassword("");
        setAuthFullName(""); setAuthConfirm("");
        setShowPassword(false); setShowConfirm(false);
    };
    const switchAuthMode = (mode: AuthMode) => { clearAuthForm(); setAuthMode(mode); };

    const handleEmailSignUp = async () => {
        setAuthError(""); setAuthSuccess("");
        if (!authFullName.trim()) { setAuthError("Please enter your full name."); return; }
        if (!authEmail.includes("@")) { setAuthError("Please enter a valid email address."); return; }
        if (authPassword.length < 6) { setAuthError("Password must be at least 6 characters."); return; }
        if (authPassword !== authConfirm) { setAuthError("Passwords do not match."); return; }
        setAuthLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email: authEmail.trim().toLowerCase(),
            password: authPassword,
            options: {
                data: { full_name: authFullName.trim(), avatar_url: null },
                emailRedirectTo: window.location.origin,
            },
        });
        setAuthLoading(false);
        if (error) { setAuthError(error.message); return; }
        if (data.user && !data.session) {
            // Email confirmation required
            setAuthSuccess("✅ Account created! Check your email to confirm your address before signing in.");
        }
        // If auto-confirmed (e.g. in dev), the auth listener will fire and handle navigation
    };

    const handleEmailSignIn = async () => {
        setAuthError(""); setAuthSuccess("");
        if (!authEmail.includes("@")) { setAuthError("Please enter a valid email address."); return; }
        if (!authPassword) { setAuthError("Please enter your password."); return; }
        setAuthLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: authEmail.trim().toLowerCase(),
            password: authPassword,
        });
        setAuthLoading(false);
        if (error) {
            if (error.message.toLowerCase().includes("invalid")) {
                setAuthError("Incorrect email or password. Please try again.");
            } else if (error.message.toLowerCase().includes("confirm")) {
                setAuthError("Please confirm your email address first. Check your inbox.");
            } else {
                setAuthError(error.message);
            }
        }
        // On success the onAuthStateChange listener handles navigation
    };

    const handleForgotPassword = async () => {
        setAuthError(""); setAuthSuccess("");
        if (!authEmail.includes("@")) { setAuthError("Please enter your email address first."); return; }
        setAuthLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(
            authEmail.trim().toLowerCase(),
            { redirectTo: window.location.origin }
        );
        setAuthLoading(false);
        if (error) { setAuthError(error.message); return; }
        setAuthSuccess("✅ Password reset email sent! Check your inbox and follow the link.");
    };

    // ─── PAYSTACK PAYMENT ─────────────────────────────────────────────────────
    const handlePaystackPayment = () => {
        if (!authUser || !profile) return;
        if (!window.PaystackPop) {
            alert(`Paystack not loaded. Add to index.html head:
<script src='https://js.paystack.co/v1/inline.js'></script>`);
            return;
        }
        setPayLoading(true);
        // Generate a unique reference for this transaction
        const reference = `SSA_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

        const handler = window.PaystackPop.setup({
            key:      PAYSTACK_PUBLIC_KEY,
            email:    authUser.email!,
            amount:   MONTHLY_AMOUNT_KOBO,
            currency: "NGN",
            reference,
            ...(PAYSTACK_PLAN_CODE ? { plan: PAYSTACK_PLAN_CODE } : {}),
            metadata: {
                user_id:   authUser.id,
                full_name: profile.full_name || authUser.email,
                product:   "Sunday School Lesson - Obedience (Monthly)",
            },
            onClose: () => {
                // Popup was closed without completing payment
                setPayLoading(false);
            },
            // ⚠️  Paystack v1 inline.js rejects async functions in callback validation.
            //     Wrap all async logic inside a plain sync function using a void IIFE.
            callback: function(response) {
                void (function() {
                    const ref = (response && response.reference) ? response.reference : reference;
                    createSubscription({
                        userId:    authUser.id,
                        reference: ref,
                        amount:    MONTHLY_AMOUNT_KOBO,
                    }).then(function(sub) {
                        if (sub) {
                            // Write to localStorage so lock failures never drop
                            // user back to the payment gate on reload
                            writeSubCache(authUser.id, sub.end_date);
                            setSubscription(sub);
                            setScreen("app");
                        } else {
                            setPayLoading(false);
                            // Payment went through — write a 30-day optimistic cache
                            // so user can access the app even if DB write failed
                            const optimisticEnd = new Date();
                            optimisticEnd.setDate(optimisticEnd.getDate() + 30);
                            writeSubCache(authUser.id, optimisticEnd.toISOString());
                            alert(
                                "✅ Payment received!\n\n" +
                                "Tap OK — your access has been activated.\n" +
                                "Reference: " + ref
                            );
                            setScreen("app");
                        }
                    }).catch(function(err) {
                        setPayLoading(false);
                        console.error("Subscription error:", err);
                        // Still write optimistic cache — payment definitely went through
                        const fallbackEnd = new Date();
                        fallbackEnd.setDate(fallbackEnd.getDate() + 30);
                        writeSubCache(authUser.id, fallbackEnd.toISOString());
                        alert(
                            "✅ Payment received! Tap OK to enter.\n" +
                            "Reference: " + ref
                        );
                        setScreen("app");
                    });
                })();
            },
        });
        handler.openIframe();
    };

    // ─── CONTENT UPDATERS ──────────────────────────────────────────────────────
    const updateContent = (field: string, value: string) =>
        setContentData((p) => ({ ...p, [field]: value }));

    const updateLessonPoint = (i: number, field: string, value: string) =>
        setContentData((p) => ({ ...p, lessonPoints: p.lessonPoints.map((pt, idx) => idx === i ? { ...pt, [field]: value } : pt) }));

    const updateSubPoint = (pi: number, si: number, field: string, value: string) =>
        setContentData((p) => ({
            ...p,
            lessonPoints: p.lessonPoints.map((pt, i) =>
                i === pi ? { ...pt, subPoints: pt.subPoints.map((sp, j) => j === si ? { ...sp, [field]: value } : sp) } : pt
            ),
        }));

    const addSubPoint = (pi: number) =>
        setContentData((p) => ({
            ...p,
            lessonPoints: p.lessonPoints.map((pt, i) =>
                i === pi ? { ...pt, subPoints: [...pt.subPoints, { title: "New Point", content: "", scriptures: [] }] } : pt
            ),
        }));

    const deleteSubPoint = (pi: number, si: number) =>
        setContentData((p) => ({
            ...p,
            lessonPoints: p.lessonPoints.map((pt, i) =>
                i === pi ? { ...pt, subPoints: pt.subPoints.filter((_, j) => j !== si) } : pt
            ),
        }));

    const updatePrayer = (i: number, value: string) =>
        setContentData((p) => ({ ...p, prayerPoints: p.prayerPoints.map((pr, idx) => idx === i ? value : pr) }));

    // ─── SCRIPTURE DB HELPERS ────────────────────────────────────────────────

    // Pure converter — no state, no deps — stable without useCallback but
    // defined outside render so it never changes reference.
    // (Moved to module scope via inline const to avoid re-creation each render)
    const rowToEntry = useCallback(
        (row: Record<string, string>): [string, BibleVersions] => [
            row.reference,
            { KJV: row.kjv||"", NKJV: row.nkjv||"", NIV: row.niv||"",
              ESV: row.esv||"", AMP: row.amp||"", NLT: row.nlt||"", MSG: row.msg||"" },
        ],
        [] // no dependencies — pure function
    );

    // Seed the initialScriptureDB into Supabase on first run
    const seedScripturesToDB = useCallback(async () => {
        const rows = Object.entries(initialScriptureDB).map(([ref, v]) => ({
            reference: ref,
            kjv: v.KJV,  nkjv: v.NKJV, niv: v.NIV,
            esv: v.ESV,  amp:  v.AMP,   nlt: v.NLT,  msg: v.MSG,
        }));
        const { error } = await supabase
            .from("scriptures")
            .upsert(rows, { onConflict: "reference" });
        if (error) { console.error("seedScriptures:", error); return; }
        // Reload after seeding
        const { data } = await supabase
            .from("scriptures")
            .select("*")
            .order("reference", { ascending: true });
        if (data) {
            const db: ScriptureDB = {};
            data.forEach((row: Record<string, string>) => {
                const [ref, versions] = rowToEntry(row);
                db[ref] = versions;
            });
            setScriptureDB(db);
        }
    }, [rowToEntry]); // rowToEntry is stable (empty deps), so this is stable too

    // Load ALL scriptures from Supabase and populate state
    const loadScripturesFromDB = useCallback(async () => {
        setScriptureLoading(true);
        const { data, error } = await supabase
            .from("scriptures")
            .select("*")
            .order("reference", { ascending: true });
        if (error) {
            console.error("loadScriptures:", error);
            setScriptureLoading(false);
            return;
        }
        if (data && data.length > 0) {
            const db: ScriptureDB = {};
            data.forEach((row: Record<string, string>) => {
                const [ref, versions] = rowToEntry(row);
                db[ref] = versions;
            });
            setScriptureDB(db);
        } else {
            // DB is empty on first run — seed with built-in data
            await seedScripturesToDB();
        }
        setScriptureLoading(false);
    }, [rowToEntry, seedScripturesToDB]); // both are stable → loadScripturesFromDB is stable

    useEffect(() => {
        if (screen === "app") {
            void loadScripturesFromDB();
        }
    }, [screen, loadScripturesFromDB]);

    // Add new scripture to DB + state
    const addNewScripture = async () => {
        if (!newVerse.reference.trim() || !Object.values(newVerse.versions).some((v) => v)) return;
        setScriptureSyncing(true);
        const { error } = await supabase.from("scriptures").upsert({
            reference: newVerse.reference.trim(),
            kjv: newVerse.versions.KJV,   nkjv: newVerse.versions.NKJV,
            niv: newVerse.versions.NIV,   esv:  newVerse.versions.ESV,
            amp: newVerse.versions.AMP,   nlt:  newVerse.versions.NLT,
            msg: newVerse.versions.MSG,
        }, { onConflict: "reference" });
        if (error) {
            console.error("addNewScripture:", error);
            setScriptureSyncing(false);
            alert("Failed to save scripture: " + error.message);
            return;
        }
        // Update local state
        setScriptureDB((p) => ({ ...p, [newVerse.reference.trim()]: newVerse.versions }));
        setNewVerse({ reference: "", versions: { KJV:"", NKJV:"", NIV:"", ESV:"", AMP:"", NLT:"", MSG:"" } });
        setEditMode(false);
        setScriptureSaved(newVerse.reference.trim());
        setTimeout(() => setScriptureSaved(null), 2500);
        setScriptureSyncing(false);
    };

    // ─── SCRIPTURE EDITOR HELPERS ────────────────────────────────────────────
    const startEditScripture = (ref: string) => {
        setEditingRef(ref);
        setEditingRefNew(ref);
        setEditingVersions({ ...scriptureDB[ref] });
        setDeleteConfirmRef(null);
    };
    const cancelEditScripture = () => {
        setEditingRef(null);
        setEditingRefNew("");
        setEditingVersions({ KJV:"",NKJV:"",NIV:"",ESV:"",AMP:"",NLT:"",MSG:"" });
    };

    // Save edited scripture to DB + update state
    const saveEditScripture = async () => {
        if (!editingRef) return;
        setScriptureSyncing(true);
        const targetRef = (editingRefNew && editingRefNew.trim()) ? editingRefNew.trim() : editingRef;

        // If reference was renamed: delete old row, insert new
        if (targetRef !== editingRef) {
            await supabase.from("scriptures").delete().eq("reference", editingRef);
        }
        const { error } = await supabase.from("scriptures").upsert({
            reference: targetRef,
            kjv: editingVersions.KJV,   nkjv: editingVersions.NKJV,
            niv: editingVersions.NIV,   esv:  editingVersions.ESV,
            amp: editingVersions.AMP,   nlt:  editingVersions.NLT,
            msg: editingVersions.MSG,
        }, { onConflict: "reference" });

        if (error) {
            console.error("saveEditScripture:", error);
            setScriptureSyncing(false);
            alert("Failed to update scripture: " + error.message);
            return;
        }
        // Update local state
        setScriptureDB((prev) => {
            const updated = { ...prev };
            if (targetRef !== editingRef) delete updated[editingRef];
            updated[targetRef] = { ...editingVersions };
            return updated;
        });
        setScriptureSaved(targetRef);
        setTimeout(() => setScriptureSaved(null), 2500);
        setScriptureSyncing(false);
        cancelEditScripture();
    };

    // Delete scripture from DB + state
    const deleteScripture = async (ref: string) => {
        setScriptureSyncing(true);
        const { error } = await supabase.from("scriptures").delete().eq("reference", ref);
        if (error) {
            console.error("deleteScripture:", error);
            setScriptureSyncing(false);
            alert("Failed to delete: " + error.message);
            return;
        }
        setScriptureDB((prev) => {
            const updated = { ...prev };
            delete updated[ref];
            return updated;
        });
        setDeleteConfirmRef(null);
        if (editingRef === ref) cancelEditScripture();
        setScriptureSyncing(false);
    };

    const updateEditVersion = (v: keyof BibleVersions, text: string) =>
        setEditingVersions((p) => ({ ...p, [v]: text }));

    // ─── QUIZ ─────────────────────────────────────────────────────────────────
    const startQuiz = () => { setQuizActive(true); setCurrentQ(0); setScore(0); setTimeLeft(50); setShowResults(false); };
    const checkAnswer = (choice: number) => {
        if (!quizActive || showResults) return;
        if (quizQuestions[currentQ].correct === choice) setScore((p) => p + 10 + Math.floor(timeLeft / 10));
        if (currentQ < quizQuestions.length - 1) setTimeout(() => setCurrentQ((p) => p + 1), 900);
        else setTimeout(endQuiz, 900);
    };
    const endQuiz = () => { setQuizActive(false); setShowResults(true); };

    // ─── HELPERS ──────────────────────────────────────────────────────────────
    const showBibleVerse = (ref: string) => { setSelectedVerse(ref); setShowVerseModal(true); setVerseLoading(true); setTimeout(() => setVerseLoading(false), 700); };
    const changeBibleVersion = (v: keyof BibleVersions) => { setVerseLoading(true); setTimeout(() => { setBibleVersion(v); setVerseLoading(false); }, 500); };
    const handleTabChange = (tab: string) => { setTabLoading(true); setTimeout(() => { setActiveTab(tab); setTabLoading(false); }, 400); };
    const toggleTheme    = () => setDarkMode((p) => !p);
    const adjustFont     = (d: number) => setFontSize((p) => Math.min(Math.max(p + d, 12), 24));
    const addCommitment  = () => { if (!commitInput.trim()) return; setCommitments((p) => [{ text: commitInput, date: new Date().toLocaleDateString() }, ...p]); setCommitInput(""); };

    const formatVerse = (text: string) =>
        text.split(/(\d+)/).map((part, i) =>
            /^\d+$/.test(part) ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        );

    const th = darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white" : "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 text-gray-900";
    const cardBg = darkMode ? "bg-white/10 backdrop-blur-xl border-white/20" : "bg-white/80 border-gray-200";

    // ═══════════════════════════════════════════════════════════════════════════
    //  BOOT SCREEN
    // ═══════════════════════════════════════════════════════════════════════════
    if (screen === "boot" || loadingPct < 100) {
        const animText = "Progress Through Thanksgiving".split("");
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 flex items-center justify-center z-50">
                <div className="text-center px-4">
                    <div className="relative mb-8 mx-auto w-32 h-32">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                            <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full border-4 border-white/30 animate-ping"></div>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">Life Gate Ministries Worldwide</h1>
                    <p className="text-white/80 mb-6">Sunday School Lessons</p>
                    <div className="flex justify-center mb-6 flex-wrap gap-0">
                        {animText.map((char, idx) => (
                            <span key={idx} className="inline-block text-2xl font-extrabold text-blue-300 drop-shadow-[0_0_8px_#60a5fa] animate-[wave_1.5s_ease-in-out_infinite]" style={{ animationDelay:`${idx * 0.08}s` }}>
                                {char === " " ? "\u00A0" : char}
                            </span>
                        ))}
                    </div>
                    <div className="w-64 mx-auto bg-white/20 rounded-full h-3 overflow-hidden mb-2">
                        <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-300" style={{ width:`${loadingPct}%` }} />
                    </div>
                    <p className="text-white/60 text-sm">{loadingPct}%</p>
                </div>
                <style>{`@keyframes wave{0%,100%{transform:translateY(0)}25%{transform:translateY(-10px)}50%{transform:translateY(6px)}75%{transform:translateY(-4px)}}`}</style>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  AUTH SCREEN  — Email/Password + Google
    // ═══════════════════════════════════════════════════════════════════════════
    if (screen === "auth") {
        const inputCls = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-purple-400 ${
            darkMode ? "bg-white/10 border-white/20 text-white placeholder-white/40" : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
        }`;
        return (
            <div className={`min-h-screen ${th} flex items-center justify-center p-4 relative overflow-hidden`}>
                {/* Blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-96 h-96 bg-purple-500/25 rounded-full blur-3xl -top-48 -left-48 animate-pulse"/>
                    <div className="absolute w-96 h-96 bg-blue-500/25 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{animationDelay:"1s"}}/>
                    <div className="absolute w-64 h-64 bg-pink-500/15 rounded-full blur-3xl top-1/2 right-0 animate-pulse" style={{animationDelay:"2s"}}/>
                </div>

                <div className="max-w-sm w-full relative z-10">
                    {/* Logo & Title */}
                    <div className="text-center mb-7">
                        <div className="w-20 h-20 mx-auto mb-4 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/20">
                            <img src={logo} alt="Logo" className="w-13 h-13 object-contain w-12 h-12"/>
                        </div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Sunday School
                        </h1>
                        <p className="text-xs opacity-50 mt-1">Life Gate Ministries Worldwide</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-7 shadow-2xl space-y-5">

                        {/* ── FORGOT PASSWORD MODE ── */}
                        {authMode === "forgot" && (
                            <>
                                <div className="flex items-center gap-3 mb-1">
                                    <button onClick={()=>switchAuthMode("login")} className="opacity-50 hover:opacity-80 transition">
                                        <ArrowLeft size={18}/>
                                    </button>
                                    <h2 className="text-lg font-bold">Reset Password</h2>
                                </div>
                                <p className="text-sm opacity-60 -mt-2">Enter your email and we'll send a reset link.</p>

                                {authError && <div className="flex items-start gap-2 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm"><X size={15} className="mt-0.5 flex-shrink-0"/>{authError}</div>}
                                {authSuccess && <div className="flex items-start gap-2 px-4 py-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-300 text-sm"><CheckCircle size={15} className="mt-0.5 flex-shrink-0"/>{authSuccess}</div>}

                                <div className="relative">
                                    <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"/>
                                    <input type="email" value={authEmail} onChange={e=>{setAuthEmail(e.target.value);setAuthError("");}}
                                        placeholder="your@email.com" className={`${inputCls} pl-10`}/>
                                </div>

                                <button onClick={handleForgotPassword} disabled={authLoading}
                                    className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                                    {authLoading ? <><Loader2 size={17} className="animate-spin"/> Sending…</> : <><Mail size={16}/> Send Reset Link</>}
                                </button>

                                <p className="text-center text-xs opacity-50">
                                    Remembered it? <button onClick={()=>switchAuthMode("login")} className="text-purple-400 hover:underline font-semibold">Sign In</button>
                                </p>
                            </>
                        )}

                        {/* ── LOGIN / SIGNUP MODE ── */}
                        {authMode !== "forgot" && (
                            <>
                                {/* Mode tabs */}
                                <div className={`flex rounded-xl overflow-hidden border ${darkMode?"border-white/10":"border-gray-200"} p-1 gap-1`}>
                                    {(["login","signup"] as AuthMode[]).map(m=>(
                                        <button key={m} onClick={()=>switchAuthMode(m)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${authMode===m?"bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg":"opacity-50 hover:opacity-80"}`}>
                                            {m==="login" ? "Sign In" : "Sign Up"}
                                        </button>
                                    ))}
                                </div>

                                {/* Error / Success banners */}
                                {authError && (
                                    <div className="flex items-start gap-2 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm">
                                        <X size={15} className="mt-0.5 flex-shrink-0"/>{authError}
                                    </div>
                                )}
                                {authSuccess && (
                                    <div className="flex items-start gap-2 px-4 py-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-300 text-sm">
                                        <CheckCircle size={15} className="mt-0.5 flex-shrink-0"/>{authSuccess}
                                    </div>
                                )}

                                {/* Full name — sign up only */}
                                {authMode === "signup" && (
                                    <div className="relative">
                                        <UserPlus size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"/>
                                        <input type="text" value={authFullName}
                                            onChange={e=>{setAuthFullName(e.target.value);setAuthError("");}}
                                            placeholder="Full Name"
                                            className={`${inputCls} pl-10`}/>
                                    </div>
                                )}

                                {/* Email */}
                                <div className="relative">
                                    <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"/>
                                    <input type="email" value={authEmail}
                                        onChange={e=>{setAuthEmail(e.target.value);setAuthError("");}}
                                        placeholder="Email Address"
                                        className={`${inputCls} pl-10`}/>
                                </div>

                                {/* Password */}
                                <div className="relative">
                                    <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"/>
                                    <input type={showPassword?"text":"password"} value={authPassword}
                                        onChange={e=>{setAuthPassword(e.target.value);setAuthError("");}}
                                        placeholder={authMode==="signup"?"Create Password (min 6 chars)":"Password"}
                                        className={`${inputCls} pl-10 pr-11`}/>
                                    <button type="button" onClick={()=>setShowPassword(p=>!p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition">
                                        {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                    </button>
                                </div>

                                {/* Confirm password — sign up only */}
                                {authMode === "signup" && (
                                    <div className="relative">
                                        <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"/>
                                        <input type={showConfirm?"text":"password"} value={authConfirm}
                                            onChange={e=>{setAuthConfirm(e.target.value);setAuthError("");}}
                                            placeholder="Confirm Password"
                                            className={`${inputCls} pl-10 pr-11 ${authConfirm && authConfirm!==authPassword?"border-red-500/60":""}`}/>
                                        <button type="button" onClick={()=>setShowConfirm(p=>!p)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition">
                                            {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                                        </button>
                                    </div>
                                )}

                                {/* Forgot password link */}
                                {authMode === "login" && (
                                    <div className="text-right -mt-2">
                                        <button onClick={()=>switchAuthMode("forgot")} className="text-xs text-purple-400 hover:underline opacity-70 hover:opacity-100 transition">
                                            Forgot password?
                                        </button>
                                    </div>
                                )}

                                {/* Submit button */}
                                <button
                                    onClick={authMode==="login" ? handleEmailSignIn : handleEmailSignUp}
                                    disabled={authLoading}
                                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]">
                                    {authLoading
                                        ? <><Loader2 size={17} className="animate-spin"/> {authMode==="login"?"Signing in…":"Creating account…"}</>
                                        : authMode==="login"
                                            ? <><Lock size={16}/> Sign In</>
                                            : <><UserPlus size={16}/> Create Account</>
                                    }
                                </button>

                                {/* Divider */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-white/10"/>
                                    <span className="text-xs opacity-40 font-semibold">OR</span>
                                    <div className="flex-1 h-px bg-white/10"/>
                                </div>

                                {/* Google button */}
                                <button
                                    onClick={async()=>{ setAuthError(""); setAuthLoading(true); await signInWithGoogle(); }}
                                    disabled={authLoading}
                                    className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-bold shadow-lg transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${darkMode?"bg-white/90 text-gray-800 hover:bg-white":"bg-white text-gray-800 hover:bg-gray-50"}`}>
                                    <Chrome size={18} className="text-blue-600"/>
                                    Continue with Google
                                </button>

                                <p className="text-center text-xs opacity-40">
                                    By continuing you agree to our terms of service.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  PAYMENT / SUBSCRIPTION GATE
    // ═══════════════════════════════════════════════════════════════════════════
    if (screen === "payment") {
        const daysLeft = subscription
            ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86_400_000))
            : 0;
        const isRenewal = !!subscription && daysLeft === 0;

        return (
            <div className={`min-h-screen ${th} flex items-center justify-center p-4 relative overflow-hidden`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-96 h-96 bg-purple-500/25 rounded-full blur-3xl -top-48 -left-48 animate-pulse"/>
                    <div className="absolute w-96 h-96 bg-pink-500/25 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{animationDelay:"1.2s"}}/>
                </div>

                <div className="max-w-md w-full relative z-10">
                    {/* User pill */}
                    <div className="flex items-center justify-between mb-8 px-1">
                        <div className="flex items-center gap-3">
                            {profile?.avatar_url
                                ? <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full border-2 border-white/30" />
                                : <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">{profile?.email?.[0]?.toUpperCase()}</div>
                            }
                            <div>
                                <p className="font-semibold text-sm">{profile?.full_name || "Welcome"}</p>
                                <p className="text-xs opacity-50">{profile?.email}</p>
                            </div>
                        </div>
                        <button onClick={() => { signOut(); setScreen("auth"); setAuthUser(null); }} className="flex items-center gap-1 text-xs opacity-50 hover:opacity-80 transition">
                            <LogOut size={14} /> Sign out
                        </button>
                    </div>

                    {/* Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500"/>
                        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">

                            <div className="absolute -top-3 right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-4 py-1 rounded-full text-xs font-black shadow-lg tracking-wide">
                                {isRenewal ? "RENEWAL REQUIRED" : "MONTHLY ACCESS"}
                            </div>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                                    <img src={logo} alt="" className="w-10 h-10 object-contain" />
                                </div>
                                {isRenewal
                                    ? <><h2 className="text-2xl font-black mb-1">Subscription Expired</h2><p className="text-sm opacity-60">Renew to continue accessing lessons</p></>
                                    : <><h2 className="text-2xl font-black mb-1">Premium Subscription</h2><p className="text-sm opacity-60">Full access to Sunday School content</p></>
                                }
                            </div>

                            {/* Price */}
                            <div className="text-center mb-6">
                                <p className="text-6xl font-black mb-1">₦1,000</p>
                                <p className="text-sm opacity-50 flex items-center justify-center gap-1"><RefreshCw size={12}/> per month · auto-renews</p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-2.5 mb-8">
                                {["All lesson content & Bible references","7 Bible translations per verse","Interactive speed quiz","Personal commitment tracker","Prayer points with reflection","Edit lesson content (admin)"].map((f) => (
                                    <li key={f} className="flex items-center gap-3 text-sm">
                                        <CheckCircle size={16} className="text-green-400 flex-shrink-0"/>
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {subChecking ? (
                                <div className="w-full py-4 flex items-center justify-center gap-2 opacity-50">
                                    <Loader2 size={18} className="animate-spin"/> Checking subscription…
                                </div>
                            ) : (
                                <button
                                    onClick={handlePaystackPayment}
                                    disabled={payLoading}
                                    className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-xl flex items-center justify-center gap-3 transition-all duration-200 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {payLoading
                                        ? <><Loader2 size={20} className="animate-spin"/> Processing…</>
                                        : <><CreditCard size={20}/> Pay ₦1,000 with Paystack</>
                                    }
                                </button>
                            )}

                            <p className="text-center text-xs opacity-40 mt-4">🔒 Secured by Paystack · Instant activation</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  MAIN APP
    // ═══════════════════════════════════════════════════════════════════════════
    const tabs = [
        { id:"intro",       label:"Intro" },
        { id:"lesson",      label:"Lesson" },
        { id:"conclusion",  label:"Conclusion" },
        { id:"application", label:"Application" },
        { id:"quiz",        label:"Quiz" },
        { id:"prayer",      label:"Prayer" },
        ...(isAdmin ? [{ id:"manage", label:"Manage" }, { id:"admin", label:"🛡 Admin" }] : [{ id:"manage", label:"Manage" }]),
    ];

    // Subscription days left banner
    const subsEnd  = subscription ? new Date(subscription.end_date) : null;
    const daysLeft = subsEnd ? Math.max(0, Math.ceil((subsEnd.getTime() - Date.now()) / 86_400_000)) : 0;

    // editBanner — shown only when admin has activated edit mode on a tab
    const editBanner = (tab: string) => {
        if (!isAdmin) return null;
        if (editingContent === tab) {
            // Active edit mode — show yellow bar with Done button
            return (
                <div className="bg-yellow-500/20 border border-yellow-400/40 rounded-xl p-3 mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-yellow-400 text-sm font-semibold">
                        <Edit2 size={14}/> Editing — Changes are live
                    </span>
                    <button
                        onClick={() => setEditingContent(null)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                        ✓ Done Editing
                    </button>
                </div>
            );
        }
        // Not editing — show a small Edit button for admin
        return (
            <div className="flex justify-end mb-3">
                <button
                    onClick={() => setEditingContent(tab)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-semibold transition"
                    title="Admin: Edit this content"
                >
                    <Edit2 size={12}/> Edit Content
                </button>
            </div>
        );
    };

    return (
        <div className={`min-h-screen ${th} transition-all duration-500 relative`} style={{ fontSize:`${fontSize}px` }}>
            {/* Ambient blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/15 rounded-full blur-3xl top-0 left-1/4 animate-pulse"/>
                <div className="absolute w-96 h-96 bg-blue-500/15 rounded-full blur-3xl bottom-0 right-1/4 animate-pulse" style={{animationDelay:"1s"}}/>
            </div>

            <Header logo={logo} contentData={contentData} fontSize={fontSize} adjustFontSize={adjustFont} darkMode={darkMode} toggleTheme={toggleTheme}/>

            {/* Subscription banner */}
            {daysLeft <= 5 && daysLeft > 0 && (
                <div className="bg-orange-500/20 border-b border-orange-500/30 text-orange-300 text-center text-sm py-2 px-4 font-semibold">
                    ⚠️ Your subscription expires in {daysLeft} day{daysLeft === 1 ? "" : "s"} ·{" "}
                    <button onClick={() => setScreen("payment")} className="underline hover:no-underline">Renew now</button>
                </div>
            )}

            {/* User info strip */}
            <div className={`${darkMode ? "border-white/10" : "border-black/10"} border-b px-4 py-2 flex items-center justify-between text-xs opacity-60`}>
                <span className="flex items-center gap-2">
                    {profile?.avatar_url && <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full"/>}
                    {profile?.full_name || profile?.email}
                    {isAdmin && <span className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded-full text-[10px] font-bold">ADMIN</span>}
                </span>
                <button onClick={async () => { await signOut(); setScreen("auth"); setAuthUser(null); setProfile(null); setSubscription(null); }} className="flex items-center gap-1 hover:opacity-80 transition">
                    <LogOut size={12}/> Sign out
                </button>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {contentData.lessonTitle}
                </h2>

                {/* Tab bar */}
                <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide backdrop-blur-sm bg-white/5 p-2 rounded-2xl border border-white/10">
                    {tabs.map(({ id, label }) => (
                        <button key={id} onClick={() => handleTabChange(id)}
                            className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex-shrink-0 text-sm ${
                                activeTab === id
                                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg scale-105"
                                    : darkMode
                                    ? "bg-white/10 hover:bg-white/20 border border-white/10"
                                    : "bg-black/10 hover:bg-black/20 border border-black/10"
                            }`}
                        >{label}</button>
                    ))}
                </div>

                {tabLoading && (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"/>
                    </div>
                )}

                {!tabLoading && (
                    <div className={`${cardBg} border rounded-2xl shadow-2xl p-6 md:p-8`}>

                        {/* ── INTRO ──────────────────────────────────────────── */}
                        {activeTab === "intro" && (
                            <div className="space-y-6">
                                {editBanner("intro")}
                                <div className={`${darkMode?"bg-blue-900/30":"bg-blue-50"} p-6 rounded-xl border-l-4 border-blue-500`}>
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><BookOpen className="text-blue-500"/> Memory Verse</h3>
                                    {(editingContent==="intro" && isAdmin)
                                        ? <textarea value={contentData.memoryVerse} onChange={(e)=>updateContent("memoryVerse",e.target.value)} className={`w-full px-4 py-2 rounded-lg border text-lg italic mb-4 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={2}/>
                                        : <blockquote className="text-xl italic mb-4">"{contentData.memoryVerse}"</blockquote>
                                    }
                                    <button onClick={()=>showBibleVerse(contentData.memoryVerseRef)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                                        <BookOpen size={15}/> Read {contentData.memoryVerseRef}
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-3">Text: Genesis 12:1-5</h3>
                                    <button onClick={()=>showBibleVerse("Genesis 12:1-5")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                                        <BookOpen size={15}/> Read Genesis 12:1-5
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-3">Introduction</h3>
                                    {(editingContent==="intro" && isAdmin)
                                        ? <textarea value={contentData.introduction} onChange={(e)=>updateContent("introduction",e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={6}/>
                                        : <p className="leading-relaxed">{contentData.introduction}
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {contentData.lessonIntroScriptures.map((s)=>(
                                                    <button key={s} onClick={()=>showBibleVerse(s)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm"><BookOpen size={13}/>{s}</button>
                                                ))}
                                            </div>
                                          </p>
                                    }
                                </div>
                                <div className={`${darkMode?"bg-green-900/30":"bg-green-50"} p-6 rounded-xl`}>
                                    <h3 className="text-xl font-bold mb-3">Aims & Objectives</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <strong className="text-green-500">AIMS:</strong>
                                            {(editingContent==="intro" && isAdmin)
                                                ? <textarea value={contentData.aims} onChange={(e)=>updateContent("aims",e.target.value)} className={`w-full px-3 py-2 rounded-lg border mt-2 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={2}/>
                                                : <p className="mt-1">{contentData.aims}</p>
                                            }
                                        </div>
                                        <div>
                                            <strong className="text-green-500">OBJECTIVES:</strong>
                                            {(editingContent==="intro" && isAdmin)
                                                ? <textarea value={contentData.objectives} onChange={(e)=>updateContent("objectives",e.target.value)} className={`w-full px-3 py-2 rounded-lg border mt-2 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={2}/>
                                                : <p className="mt-1">{contentData.objectives}</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── LESSON ─────────────────────────────────────────── */}
                        {activeTab === "lesson" && (
                            <div className="space-y-6">
                                {editBanner("lesson")}
                                <h3 className="text-2xl font-bold">Lesson Content</h3>
                                {(editingContent==="lesson" && isAdmin)
                                    ? <textarea value={contentData.lessonIntro} onChange={(e)=>updateContent("lessonIntro",e.target.value)} className={`w-full px-4 py-2 rounded-lg border mb-4 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={3}/>
                                    : <p className="leading-relaxed mb-6">{contentData.lessonIntro}</p>
                                }
                                {contentData.lessonPoints.map((section, idx)=>(
                                    <div key={idx} className={`${darkMode?"bg-gray-700/60":"bg-gray-50"} p-5 rounded-xl`}>
                                        {(editingContent==="lesson" && isAdmin) ? (
                                            <>
                                                <input type="text" value={section.title} onChange={(e)=>updateLessonPoint(idx,"title",e.target.value)} className={`w-full px-3 py-2 rounded-lg border mb-3 font-bold ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`}/>
                                                <textarea value={section.content} onChange={(e)=>updateLessonPoint(idx,"content",e.target.value)} className={`w-full px-3 py-2 rounded-lg border mb-3 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={3}/>
                                                <div className="ml-4 space-y-3">
                                                    {section.subPoints.map((sp,si)=>(
                                                        <div key={si} className={`${darkMode?"bg-gray-800":"bg-white"} p-3 rounded-lg`}>
                                                            <div className="flex justify-between mb-2">
                                                                <span className="text-xs font-bold text-yellow-500">{String.fromCharCode(97+si)}.</span>
                                                                <button onClick={()=>deleteSubPoint(idx,si)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                                                            </div>
                                                            <input type="text" value={sp.title} onChange={(e)=>updateSubPoint(idx,si,"title",e.target.value)} placeholder="Sub-point title" className={`w-full px-3 py-1 rounded border mb-2 text-sm font-semibold ${darkMode?"bg-gray-700 border-gray-600":"bg-gray-50 border-gray-300"}`}/>
                                                            <textarea value={sp.content} onChange={(e)=>updateSubPoint(idx,si,"content",e.target.value)} placeholder="Content" className={`w-full px-3 py-1 rounded border mb-2 text-sm ${darkMode?"bg-gray-700 border-gray-600":"bg-gray-50 border-gray-300"}`} rows={2}/>
                                                        </div>
                                                    ))}
                                                    <button onClick={()=>addSubPoint(idx)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"><Plus size={13}/> Add Sub-point</button>
                                                </div>
                                            </>
                                        ):(
                                            <>
                                                <h4 className="text-xl font-bold mb-2">{idx+1}. {section.title}</h4>
                                                {section.content && <p className="leading-relaxed mb-3">{section.content}</p>}
                                                {section.scriptures?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {section.scriptures.map((s)=>(
                                                            <button key={s} onClick={()=>showBibleVerse(s)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"><BookOpen size={13}/>{s}</button>
                                                        ))}
                                                    </div>
                                                )}
                                                {section.subPoints?.length > 0 && (
                                                    <ol className="list-[lower-alpha] ml-6 space-y-3">
                                                        {section.subPoints.map((sp,si)=>(
                                                            <li key={si}>
                                                                <strong>{sp.title}:</strong> {sp.content}
                                                                {sp.scriptures && sp.scriptures.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                        {sp.scriptures.map((ref,i)=>(
                                                                            <button key={i} onClick={()=>showBibleVerse(ref)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">📖 {ref}</button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ol>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── CONCLUSION ─────────────────────────────────────── */}
                        {activeTab==="conclusion" && (
                            <div className="space-y-4">
                                {editBanner("conclusion")}
                                <h3 className="text-2xl font-bold mb-4">Conclusion</h3>
                                {(editingContent==="conclusion" && isAdmin)
                                    ? <textarea value={contentData.conclusion} onChange={(e)=>updateContent("conclusion",e.target.value)} className={`w-full px-4 py-2 rounded-lg border text-lg ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={5}/>
                                    : <p className="text-lg leading-relaxed">{contentData.conclusion}</p>
                                }
                            </div>
                        )}

                        {/* ── APPLICATION ───────────────────────────────────── */}
                        {activeTab==="application" && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-center">🛡️ Living in Obedience</h3>
                                <div className={`${darkMode?"bg-blue-900/30":"bg-blue-50"} p-6 rounded-2xl border-2 border-blue-500/30`}>
                                    <h4 className="text-xl font-bold mb-2">📊 Obedience Check</h4>
                                    <p className="text-sm opacity-70 mb-6">How aligned are you with God's will today?</p>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs uppercase tracking-wider opacity-60">Alignment Level</span>
                                        <span className={`text-3xl font-black ${loveRating>7?"text-green-400":loveRating>4?"text-orange-400":"text-red-400"}`}>{loveRating*10}%</span>
                                    </div>
                                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden mb-3">
                                        <div className={`h-full transition-all duration-500 ${loveRating>7?"bg-green-500":loveRating>4?"bg-orange-400":"bg-red-500"}`} style={{width:`${loveRating*10}%`}}/>
                                    </div>
                                    <input type="range" min="1" max="10" value={loveRating} onChange={(e)=>setLoveRating(Number(e.target.value))} className="w-full accent-blue-500 mb-4"/>
                                    <div className={`p-4 rounded-xl text-center text-sm font-medium ${darkMode?"bg-gray-800/60":"bg-white shadow-sm"}`}>
                                        {loveRating>=8?"✅ Strong obedience! Keep yielding to God daily.":loveRating>=5?"⚡ Growing! Deepen your trust through prayer and Scripture.":"⚠️ Time to renew your surrender and trust in God's leading."}
                                    </div>
                                </div>
                                <div className={`${darkMode?"bg-gray-700/60":"bg-white border-2 border-dashed border-blue-200"} p-6 rounded-2xl`}>
                                    <h4 className="text-xl font-bold mb-3">📝 Today's Obedience Action</h4>
                                    <p className="text-sm opacity-60 mb-4">What one step will you take to obey God today?</p>
                                    <input type="text" value={commitInput} onChange={(e)=>setCommitInput(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&addCommitment()} placeholder="E.g., Forgive someone, pray early, read Scripture…" className={`w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-blue-400 mb-3 ${darkMode?"bg-gray-800 border-gray-600":"bg-gray-50 border-gray-200"}`}/>
                                    <button onClick={addCommitment} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition">
                                        <Save size={16}/> Save Action
                                    </button>
                                    {commitments.length > 0 && (
                                        <div className="mt-5 space-y-3">
                                            {commitments.map((c,i)=>(
                                                <div key={i} className={`p-4 rounded-xl flex items-center gap-3 ${darkMode?"bg-gray-800":"bg-blue-50 border border-blue-100"}`}>
                                                    <CheckCircle className="text-blue-500 flex-shrink-0" size={20}/>
                                                    <div>
                                                        <p className="font-semibold">{c.text}</p>
                                                        <p className="text-xs opacity-40">Logged: {c.date}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── QUIZ ───────────────────────────────────────────── */}
                        {activeTab==="quiz" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-bold">Speed Quiz</h3>
                                    {quizActive && (
                                        <div className="flex gap-4">
                                            <span className="flex items-center gap-1 text-blue-400 font-bold"><Clock size={16}/>{timeLeft}s</span>
                                            <span className="flex items-center gap-1 text-yellow-400 font-bold"><Award size={16}/>{score}</span>
                                        </div>
                                    )}
                                </div>
                                {!quizActive && !showResults && (
                                    <div className="text-center py-12">
                                        <Award size={64} className="mx-auto mb-4 text-yellow-500"/>
                                        <h4 className="text-2xl font-bold mb-3">Ready to Test Your Knowledge?</h4>
                                        <p className="opacity-60 mb-8">Answer quickly for bonus points!</p>
                                        <button onClick={startQuiz} className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-xl text-lg font-bold transition hover:scale-105">Start Quiz</button>
                                    </div>
                                )}
                                {quizActive && !showResults && (
                                    <div className={`${darkMode?"bg-gray-700/60":"bg-blue-50"} p-6 rounded-xl`}>
                                        <p className="text-sm opacity-60 mb-2">Question {currentQ+1} of {quizQuestions.length}</p>
                                        <div className="h-1.5 bg-gray-300 rounded-full mb-6 overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{width:`${((currentQ+1)/quizQuestions.length)*100}%`}}/>
                                        </div>
                                        <p className="text-lg font-semibold mb-6">{quizQuestions[currentQ].q}</p>
                                        <div className="grid md:grid-cols-2 gap-3">
                                            {quizQuestions[currentQ].a.map((ans,i)=>(
                                                <button key={i} onClick={()=>checkAnswer(i)} className={`${darkMode?"bg-gray-800 hover:bg-gray-900":"bg-white hover:bg-gray-50"} p-4 rounded-xl border-2 border-blue-500/40 hover:border-blue-500 transition text-left hover:scale-[1.02]`}>
                                                    <span className="font-bold text-blue-500 mr-2">{String.fromCharCode(65+i)}.</span>{ans}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {showResults && (
                                    <div className="text-center space-y-6 py-8">
                                        <Award size={80} className="mx-auto text-yellow-500"/>
                                        <h4 className="text-3xl font-bold">Quiz Complete!</h4>
                                        <div className={`${darkMode?"bg-gray-700/60":"bg-gradient-to-r from-blue-50 to-indigo-50"} p-8 rounded-2xl`}>
                                            <p className="text-6xl font-black text-blue-500 mb-2">{score}</p>
                                            <p className="text-lg opacity-60">Final Score</p>
                                            <p className="mt-4 font-semibold">{score>=150?"🏆 Outstanding! Master of the lesson!":score>=100?"🌟 Great work! Keep studying!":"📖 Good effort! Review the lesson and try again."}</p>
                                        </div>
                                        <button onClick={startQuiz} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition">Try Again</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── PRAYER ─────────────────────────────────────────── */}
                        {activeTab==="prayer" && (
                            <div className="space-y-4">
                                {editBanner("prayer")}
                                <h3 className="text-2xl font-bold mb-6">Prayer Points</h3>
                                <div className="space-y-4">
                                    {contentData.prayerPoints.map((prayer,idx)=>(
                                        <div key={idx} className={`${darkMode?"bg-gray-700/60 border-purple-900":"bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"} p-6 rounded-2xl border-l-4`}>
                                            {(editingContent==="prayer" && isAdmin)
                                                ? <textarea value={prayer} onChange={(e)=>updatePrayer(idx,e.target.value)} className={`w-full px-3 py-2 rounded-lg border font-medium ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={3}/>
                                                : <div className="flex gap-3">
                                                    <span className="text-2xl">{["🤝","💎","🧠","⚡"][idx]||"🙏"}</span>
                                                    <p className={`text-lg italic font-medium leading-relaxed ${darkMode?"text-purple-200":"text-purple-900"}`}>"{prayer}"</p>
                                                  </div>
                                            }
                                        </div>
                                    ))}
                                </div>
                                {(editingContent==="prayer" && isAdmin) && (
                                    <button onClick={()=>setContentData((p)=>({...p,prayerPoints:[...p.prayerPoints,"New prayer point…"]}))} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition">
                                        <Plus size={15}/> Add Prayer Point
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ── MANAGE (scriptures) — full admin editor ────────── */}
                        {activeTab==="manage" && (
                            <div className="space-y-5">

                                {/* Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-2xl font-bold flex items-center gap-2">
                                            <BookOpen className="text-blue-400" size={22}/>
                                            Scripture Database
                                        </h3>
                                        <p className="text-xs opacity-50 mt-0.5">
                                            {Object.keys(scriptureDB).length} entries · {isAdmin ? "Admin — full edit access" : "Read-only"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Reload from DB */}
                                        <button onClick={loadScripturesFromDB} disabled={scriptureLoading}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 transition disabled:opacity-40">
                                            <RefreshCw size={13} className={scriptureLoading?"animate-spin":""}/> Sync DB
                                        </button>
                                        {isAdmin && (
                                            <button onClick={()=>setEditMode(!editMode)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${editMode?"bg-red-600 hover:bg-red-700":"bg-green-600 hover:bg-green-700"} text-white`}>
                                                {editMode ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add New Scripture</>}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Save toast */}
                                {scriptureSaved && (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-green-600/20 border border-green-500/40 rounded-xl text-green-400 text-sm font-semibold animate-pulse">
                                        <CheckCircle size={16}/> "{scriptureSaved}" saved successfully!
                                    </div>
                                )}

                                {/* ── ADD NEW SCRIPTURE FORM (admin only) ── */}
                                {isAdmin && editMode && (
                                    <div className={`${darkMode?"bg-gray-700/70":"bg-blue-50"} p-6 rounded-2xl border ${darkMode?"border-white/10":"border-blue-200"} space-y-4`}>
                                        <h4 className="font-bold text-lg flex items-center gap-2"><Plus size={16} className="text-green-400"/> New Scripture Entry</h4>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Reference</label>
                                            <input type="text" value={newVerse.reference}
                                                onChange={(e)=>setNewVerse({...newVerse,reference:e.target.value})}
                                                placeholder="e.g., John 3:16  or  Romans 8:28"
                                                className={`w-full px-4 py-2.5 rounded-xl border font-semibold ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`}/>
                                        </div>
                                        {(["KJV","NKJV","NIV","ESV","AMP","NLT","MSG"] as const).map((v)=>(
                                            <div key={v}>
                                                <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{v}</label>
                                                <textarea value={newVerse.versions[v]}
                                                    onChange={(e)=>setNewVerse((p)=>({...p,versions:{...p.versions,[v]:e.target.value}}))}
                                                    placeholder={`${v} translation text…`}
                                                    rows={2}
                                                    className={`w-full px-4 py-2 rounded-xl border text-sm ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`}/>
                                            </div>
                                        ))}
                                        <div className="flex gap-3">
                                            <button onClick={()=>{ void addNewScripture(); }} disabled={scriptureSyncing}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition disabled:opacity-50">
                                                {scriptureSyncing ? <><Loader2 size={15} className="animate-spin"/> Saving…</> : <><Save size={15}/> Save to Database</>}
                                            </button>
                                            <button onClick={()=>setEditMode(false)}
                                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-xl flex items-center gap-2 text-sm transition">
                                                <X size={14}/> Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── SEARCH ── */}
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-sm">🔍</span>
                                    <input type="text" value={scriptureSearch}
                                        onChange={(e)=>setScriptureSearch(e.target.value)}
                                        placeholder="Search scripture references…"
                                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${darkMode?"bg-gray-700/60 border-white/10":"bg-white border-gray-300"}`}/>
                                    {scriptureSearch && (
                                        <button onClick={()=>setScriptureSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70">
                                            <X size={14}/>
                                        </button>
                                    )}
                                </div>

                                {/* ── SCRIPTURE LIST ── */}
                                <div className="space-y-3">
                                    {Object.keys(scriptureDB)
                                        .filter(ref => ref.toLowerCase().includes(scriptureSearch.toLowerCase()))
                                        .map((ref) => {
                                            const isBeingEdited = editingRef === ref;
                                            const isConfirmingDelete = deleteConfirmRef === ref;
                                            return (
                                                <div key={ref} className={`${darkMode?"bg-gray-700/60 border-white/10":"bg-white border-gray-200"} border rounded-2xl overflow-hidden transition-all`}>

                                                    {/* Row header */}
                                                    <div className={`flex items-center justify-between px-4 py-3 ${isBeingEdited?(darkMode?"bg-yellow-500/10":"bg-yellow-50"):""}`}>
                                                        <div>
                                                            <p className="font-bold text-base">{ref}</p>
                                                            <p className="text-xs opacity-40 mt-0.5">
                                                                {Object.values(scriptureDB[ref]).filter(v=>v).length}/7 translations available
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {/* View button — always visible */}
                                                            <button onClick={()=>showBibleVerse(ref)}
                                                                className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 text-xs font-semibold flex items-center gap-1 transition">
                                                                <BookOpen size={12}/> View
                                                            </button>
                                                            {/* Edit & Delete — admin only */}
                                                            {isAdmin && !isBeingEdited && (
                                                                <>
                                                                    <button onClick={()=>startEditScripture(ref)}
                                                                        className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 text-xs font-semibold flex items-center gap-1 transition">
                                                                        <Edit2 size={12}/> Edit
                                                                    </button>
                                                                    {isConfirmingDelete ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-xs text-red-400 font-semibold">Delete?</span>
                                                                            <button onClick={()=>{ void deleteScripture(ref); }} disabled={scriptureSyncing}
                                                                                className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition">Yes</button>
                                                                            <button onClick={()=>setDeleteConfirmRef(null)}
                                                                                className="px-2 py-1 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold transition">No</button>
                                                                        </div>
                                                                    ) : (
                                                                        <button onClick={()=>setDeleteConfirmRef(ref)}
                                                                            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-semibold flex items-center gap-1 transition">
                                                                            <X size={12}/> Del
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                            {isAdmin && isBeingEdited && (
                                                                <button onClick={cancelEditScripture}
                                                                    className="px-3 py-1.5 rounded-lg bg-gray-500/30 hover:bg-gray-500/50 text-gray-300 text-xs font-semibold flex items-center gap-1 transition">
                                                                    <X size={12}/> Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* ── INLINE EDIT FORM (admin, when this row is being edited) ── */}
                                                    {isAdmin && isBeingEdited && (
                                                        <div className={`px-4 pb-5 pt-2 space-y-4 border-t ${darkMode?"border-white/10 bg-gray-800/60":"border-gray-100 bg-yellow-50/50"}`}>

                                                            {/* Rename reference */}
                                                            <div>
                                                                <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Reference (rename)</label>
                                                                <input type="text" value={editingRefNew}
                                                                    onChange={(e)=>setEditingRefNew(e.target.value)}
                                                                    className={`w-full px-4 py-2 rounded-xl border font-semibold text-sm ${darkMode?"bg-gray-700 border-gray-600":"bg-white border-gray-300"}`}/>
                                                            </div>

                                                            {/* All 7 versions */}
                                                            {(["KJV","NKJV","NIV","ESV","AMP","NLT","MSG"] as const).map((v)=>(
                                                                <div key={v}>
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <label className="text-xs font-bold uppercase tracking-widest opacity-60">{v}</label>
                                                                        {editingVersions[v] && (
                                                                            <span className="text-[10px] opacity-40">{editingVersions[v].length} chars</span>
                                                                        )}
                                                                    </div>
                                                                    <textarea value={editingVersions[v]}
                                                                        onChange={(e)=>updateEditVersion(v, e.target.value)}
                                                                        placeholder={`Enter ${v} translation…`}
                                                                        rows={3}
                                                                        className={`w-full px-4 py-2 rounded-xl border text-sm leading-relaxed ${darkMode?"bg-gray-700 border-gray-600":"bg-white border-gray-300"} ${!editingVersions[v]?"border-dashed opacity-60":""}`}/>
                                                                </div>
                                                            ))}

                                                            {/* Save */}
                                                            <div className="flex gap-3 pt-1">
                                                                <button onClick={()=>{ void saveEditScripture(); }} disabled={scriptureSyncing}
                                                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50">
                                                                    {scriptureSyncing ? <><Loader2 size={15} className="animate-spin"/> Saving…</> : <><Save size={15}/> Save to Database</>}
                                                                </button>
                                                                <button onClick={cancelEditScripture}
                                                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition">
                                                                    <X size={14}/> Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ── READ-ONLY PREVIEW (collapsed, non-editing) ── */}
                                                    {!isBeingEdited && (
                                                        <div className={`px-4 pb-3 border-t ${darkMode?"border-white/5":"border-gray-100"}`}>
                                                            <p className="text-xs opacity-50 mt-2 leading-relaxed line-clamp-2">
                                                                <span className="font-bold opacity-70">KJV: </span>
                                                                {scriptureDB[ref]["KJV"] || <em>Not set</em>}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    }
                                    {scriptureLoading && (
                                        <div className="flex flex-col items-center py-16 opacity-60">
                                            <Loader2 size={36} className="animate-spin text-blue-400 mb-3"/>
                                            <p className="text-sm">Loading scriptures from database…</p>
                                        </div>
                                    )}
                                    {!scriptureLoading && Object.keys(scriptureDB).filter(r=>r.toLowerCase().includes(scriptureSearch.toLowerCase())).length === 0 && (
                                        <div className="text-center py-12 opacity-40">
                                            <BookOpen size={40} className="mx-auto mb-3"/>
                                            <p>{scriptureSearch ? `No scriptures match "${scriptureSearch}"` : "No scriptures in database yet. Add one above."}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Non-admin notice */}
                                {!isAdmin && (
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${darkMode?"bg-gray-700/40":"bg-gray-100"} text-sm opacity-60`}>
                                        <Lock size={14}/> Only admins can add, edit or delete scriptures.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── ADMIN PANEL ───────────────────────────────────── */}
                        {activeTab==="admin" && isAdmin && (
                            <AdminPanel darkMode={darkMode} currentUserId={authUser?.id || ""}/>
                        )}
                        {activeTab==="admin" && !isAdmin && (
                            <div className="text-center py-16">
                                <ShieldCheck size={64} className="mx-auto mb-4 text-purple-400 opacity-30"/>
                                <h3 className="text-xl font-bold opacity-50">Admin access only</h3>
                            </div>
                        )}

                    </div>
                )}
            </div>

            {/* ── BIBLE VERSE MODAL ─────────────────────────────────────────── */}
            {showVerseModal && selectedVerse && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={()=>setShowVerseModal(false)}>
                    <div className={`${darkMode?"bg-gray-800":"bg-white"} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden`} onClick={(e)=>e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-2xl font-bold">{selectedVerse}</h3>
                            <button onClick={()=>setShowVerseModal(false)} className="opacity-50 hover:opacity-80"><X size={24}/></button>
                        </div>
                        <div className="flex gap-2 p-4 border-b border-white/10 overflow-x-auto">
                            {(["KJV","NKJV","NIV","ESV","AMP","NLT","MSG"] as const).map((v)=>(
                                <button key={v} onClick={()=>changeBibleVersion(v)} disabled={verseLoading} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition ${bibleVersion===v?"bg-blue-600 text-white":darkMode?"bg-gray-700 hover:bg-gray-600":"bg-gray-100 hover:bg-gray-200"} disabled:opacity-40`}>{v}</button>
                            ))}
                        </div>
                        <div className="p-6 overflow-y-auto" style={{maxHeight:"calc(85vh - 180px)"}}>
                            {verseLoading
                                ? <div className="flex flex-col items-center py-12"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"/><p className="opacity-50 animate-pulse">Loading…</p></div>
                                : scriptureDB[selectedVerse]?.[bibleVersion]
                                    ? <p className="text-lg leading-relaxed">{formatVerse(scriptureDB[selectedVerse][bibleVersion])}</p>
                                    : <p className="opacity-40 italic">Translation not available</p>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SundaySchoolApp;
