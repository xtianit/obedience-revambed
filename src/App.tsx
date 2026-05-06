import logo from "./assets/logo.png";
import Header from "./components/Header";
import { AdminPanel } from "./components/AdminPanel";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    BookOpen, Award, CheckCircle, Edit2, Save, X,
    Clock, Plus, Loader2, ShieldCheck, LogOut,
    CreditCard, Chrome, RefreshCw, Mail, Eye, EyeOff,
    KeyRound, UserPlus, ArrowLeft, AtSign, Lock,
    FileText, ChevronDown, Trash2, Database,
} from "lucide-react";
import {
    supabase, signInWithGoogle, signOut,
    getProfile, getActiveSubscription, createSubscription,
    type Profile, type Subscription,
} from "./lib/supabase";
import type { User } from "@supabase/supabase-js";

// ─── PAYSTACK ─────────────────────────────────────────────────────────────────
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;
const MONTHLY_AMOUNT_KOBO = 100_000;
const PAYSTACK_PLAN_CODE  = "";

declare global {
    interface Window {
        PaystackPop: {
            setup: (cfg: {
                key: string; email: string; amount: number; currency: string;
                reference: string; plan?: string; metadata?: Record<string, unknown>;
                onClose: () => void;
                callback: (r: { reference: string; status: string }) => void;
            }) => { openIframe: () => void };
        };
    }
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type BibleVersions = { KJV:string; NKJV:string; NIV:string; ESV:string; AMP:string; NLT:string; MSG:string };
type ScriptureDB   = Record<string, BibleVersions>;
type AuthMode      = "login" | "signup" | "forgot";

type SubPoint    = { title:string; content:string; scriptures?: string[] };
type LessonPoint = { title:string; content:string; scriptures:string[]; subPoints:SubPoint[] };

type LessonContent = {
    lessonDate:            string;
    lessonTitle:           string;
    memoryVerse:           string;
    memoryVerseRef:        string;
    introduction:          string;
    lessonIntroScriptures: string[];
    aims:                  string;
    objectives:            string;
    lessonIntro:           string;
    lessonPoints:          LessonPoint[];
    conclusion:            string;
    conclusionScriptures:  string[];
    prayerPoints:          string[];
};

type LessonRow = {
    id:         string;
    title:      string;
    is_active:  boolean;
    content:    LessonContent;
    created_at: string;
    updated_at: string;
};

// ─── DEFAULT LESSON FACTORY ───────────────────────────────────────────────────
const makeDefaultContent = (title = "OBEDIENCE", date = "July 3, 2016"): LessonContent => ({
    lessonDate:  date,
    lessonTitle: title,
    memoryVerse: "And being found in fashion as a man, he humbled himself, and became obedient unto death, even the death of the cross - Phil. 2:8.",
    memoryVerseRef: "Phil. 2:8",
    lessonIntroScriptures: ["Colossians 1:17","2 Cor. 10:5"],
    introduction: "Obedience is a matter of relationship between two persons, one higher and the other lesser. It therefore has to do with being submissive to another's will, instructions, terms, commandments, conditions or the keeping of another's will/wish. The Bible has proven God beyond any doubt to be the creator and possessor of Heaven and Earth. In them he has made other persons lesser to himself for his pleasure to co-inhabit. This is where obedience steps into the scene of the kingdom of God or else things would fall apart. The creator of wisdom has more wisdom than wisdom and by Christ Jesus he holds all things together in obedience to himself - Colossians 1:17, 2 Corinthians 10:5.",
    aims:        "This subject is aimed at bringing every man to the obedience of Christ.",
    objectives:  "That there may be a peaceful co-existence between God and man, and between man and man.",
    lessonIntro: "Abraham the son of Terah, a descendant of a Godly seed Shem was asked by God to leave Haran, his family and to move to a land unknown at the time of instruction. Gen. 12:1-5. Many promises were attached to this commandment that was obeyed by Abram, a man like you and I. The lesson drawn from the text is enumerated below:",
    lessonPoints: [
        {
            title:"THE FOUNDATION OF OBEDIENCE",
            content:"Obedience is a matter of two parties involving a higher authority and a lesser subject. It requires a mandatory response to divine instructions as seen in the call of Abram. Gen. 12:1.",
            scriptures:["Gen. 12:1-5"],
            subPoints:[
                { title:"TWO PARTIES INVOLVED", content:"Obedience is a matter of two parties, 'THE LORD SAID TO ABRAM'. Lord and Abram. This means that the Lord requires the obedience of any of us. Gen. 12:1.", scriptures:["Gen. 12:1"] },
                { title:"SURRENDER OF WILL",    content:"Abram's will was buried in God's will and that is what He requires of your will also. As Christ Jesus holds all things together, we must align our will with His. Col. 1:17.", scriptures:["Colossians 1:17"] },
                { title:"DIVINE COMMAND",       content:"Abram was not given a choice to choose between going and staying back. It shows that God commands and not suggest. The lesser person which is you has to obey mandatorily. If you disobey the instruction, it becomes sin. The Bible is the book where God's instructions are found.", scriptures:[] },
            ],
        },
        {
            title:"THE COST, FAITH, AND REWARD OF OBEDIENCE",
            content:"True obedience disregards personal convenience and feelings, requiring a blind trust in God's leading, exemplified by Christ's obedience unto death. Phil. 2:8.",
            scriptures:["Phil. 2:8","2 Cor. 10:5"],
            subPoints:[
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
});

// ─── QUIZ QUESTIONS ───────────────────────────────────────────────────────────
const quizQuestions = [
    { q:"What is the title of today's lesson?",             a:["Faithfulness","OBEDIENCE","Divine Favour","Spiritual Growth"],                             correct:1 },
    { q:"Which scripture is the memory verse?",             a:["Genesis 12:1-5","Philippians 2:8","Romans 12:1","Psalm 23:1"],                             correct:1 },
    { q:"Obedience is primarily a relationship between:",   a:["Friends","Teacher and student","A higher authority and a lesser person","Parents only"],   correct:2 },
    { q:"Who is the Creator and Possessor of heaven/earth?",a:["Abraham","Angels","God","Man"],                                                            correct:2 },
    { q:"Who was commanded to leave Haran?",                a:["Moses","David","Abram","Isaac"],                                                           correct:2 },
    { q:"What was Abram asked to do?",                      a:["Build a temple","Fight a battle","Leave for an unknown land","Return to Egypt"],           correct:2 },
    { q:"Personal will must be:",                           a:["Celebrated","Ignored","Buried in God's will","Shared"],                                   correct:2 },
    { q:"God's instructions are found in:",                 a:["Traditions only","Dreams alone","The Bible","Human opinions"],                             correct:2 },
    { q:"Disobedience becomes:",                            a:["Wisdom","Sin","Progress","Neutral"],                                                       correct:1 },
    { q:"True obedience may require laying aside:",         a:["Convenience","Feelings","Human reasoning","All of the above"],                            correct:3 },
    { q:"'Unto the land I will show thee' teaches:",        a:["Immediate clarity","Blind trust in God","Fear of failure","Material success"],            correct:1 },
    { q:"Blessings are rewards of:",                        a:["Popularity","Obedience","Wealth","Knowledge"],                                            correct:1 },
    { q:"Which verse says Christ became obedient unto death?",a:["Philippians 2:8","Genesis 12:1","John 3:16","Psalm 91:1"],                              correct:0 },
    { q:"Jesus is our perfect example of:",                 a:["Leadership","Obedience","Prosperity","Wisdom only"],                                      correct:1 },
    { q:"Colossians 1:17 says Christ:",                     a:["Judges nations","Holds all things together","Builds cities","Creates gold"],              correct:1 },
    { q:"The aim is to bring every man to:",                a:["Fame","Religious activity","The obedience of Christ","Earthly power"],                   correct:2 },
    { q:"One objective is peaceful coexistence between:",   a:["Nations only","God and man, and man with man","Churches only","Families only"],          correct:1 },
    { q:"When convenience conflicts with God's pleasure:",  a:["God compromises","God waits","God will not compromise","God changes standards"],         correct:2 },
    { q:"Many excuses for disobedience are removed because:",a:["Others obeyed first","Jesus obeyed even unto death","Life is easy","Rules changed"],    correct:1 },
    { q:"What best summarizes this lesson?",                a:["Obedience preserves relationship with God","Success by effort alone","Feelings guide","Delay is harmless"], correct:0 },
];

// ─── CACHE HELPERS ────────────────────────────────────────────────────────────
const CACHE_KEY = "ssa_sub_cache";
const writeSubCache = (uid:string, end:string) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify({uid,end})); } catch {
    return null;
} };
const readSubCache  = (uid:string): boolean => {
    try { const r = localStorage.getItem(CACHE_KEY); if (!r) return false; const d=JSON.parse(r); return d.uid===uid && new Date(d.end)>new Date(); } catch { return false; }
};
const clearSubCache = () => { try { localStorage.removeItem(CACHE_KEY); } catch {
    return null;
} };

// ─── RETRY HELPER ─────────────────────────────────────────────────────────────
async function withRetry<T>(fn:()=>Promise<T|null>, tries=3, ms=600): Promise<T|null> {
    for (let i=0; i<tries; i++) {
        try { const r=await fn(); if(r!==null) return r; } catch(e) { console.warn("retry",i+1,e); }
        if (i<tries-1) await new Promise(r=>setTimeout(r,ms*(i+1)));
    }
    return null;
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const SundaySchoolApp = () => {

    // ── Auth ──────────────────────────────────────────────────────────────────
    const [authUser,     setAuthUser]     = useState<User|null>(null);
    const [profile,      setProfile]      = useState<Profile|null>(null);
    const [subscription, setSubscription] = useState<Subscription|null>(null);
    const [isAdmin,      setIsAdmin]      = useState(false);
    const [screen,       setScreen]       = useState<"boot"|"auth"|"payment"|"app">("boot");
    const [loadingPct,   setLoadingPct]   = useState(0);
    const [authLoading,  setAuthLoading]  = useState(false);
    const [payLoading,   setPayLoading]   = useState(false);
    const [subChecking,  setSubChecking]  = useState(false);

    // ── Email auth ────────────────────────────────────────────────────────────
    const [authMode,     setAuthMode]     = useState<AuthMode>("login");
    const [authEmail,    setAuthEmail]    = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authFullName, setAuthFullName] = useState("");
    const [authConfirm,  setAuthConfirm]  = useState("");
    const [authError,    setAuthError]    = useState("");
    const [authSuccess,  setAuthSuccess]  = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);

    // ── Lessons ───────────────────────────────────────────────────────────────
    const [lessons,          setLessons]          = useState<LessonRow[]>([]);
    const [activeLessonId,   setActiveLessonId]   = useState<string|null>(null);
    const [contentData,      setContentData]      = useState<LessonContent>(makeDefaultContent());
    const [lessonsLoading,   setLessonsLoading]   = useState(false);
    const [lessonSaving,     setLessonSaving]     = useState(false);
    const [showLessonPicker, setShowLessonPicker] = useState(false);
    const [showNewLesson,    setShowNewLesson]    = useState(false);
    const [newLessonTitle,   setNewLessonTitle]   = useState("");
    const [newLessonDate,    setNewLessonDate]    = useState("");
    const [creatingLesson,   setCreatingLesson]   = useState(false);

    // ── Scripture ─────────────────────────────────────────────────────────────
    const [scriptureDB,      setScriptureDB]      = useState<ScriptureDB>({});
    const [scriptureLoading, setScriptureLoading] = useState(false);
    const [scriptureSyncing, setScriptureSyncing] = useState(false);
    const [selectedVerse,    setSelectedVerse]    = useState<string|null>(null);
    const [bibleVersion,     setBibleVersion]     = useState<keyof BibleVersions>("KJV");
    const [showVerseModal,   setShowVerseModal]   = useState(false);
    const [verseLoading,     setVerseLoading]     = useState(false);
    const [editMode,         setEditMode]         = useState(false);
    const [newVerse,         setNewVerse]         = useState<{reference:string;versions:BibleVersions}>({
        reference:"", versions:{KJV:"",NKJV:"",NIV:"",ESV:"",AMP:"",NLT:"",MSG:""},
    });
    const [scriptureSearch,  setScriptureSearch]  = useState("");
    const [editingRef,       setEditingRef]       = useState<string|null>(null);
    const [editingRefNew,    setEditingRefNew]    = useState("");
    const [editingVersions,  setEditingVersions]  = useState<BibleVersions>({KJV:"",NKJV:"",NIV:"",ESV:"",AMP:"",NLT:"",MSG:""});
    const [deleteConfirmRef, setDeleteConfirmRef] = useState<string|null>(null);
    const [scriptureSaved,   setScriptureSaved]   = useState<string|null>(null);

    // ── App UI ────────────────────────────────────────────────────────────────
    const [activeTab,      setActiveTab]      = useState("intro");
    const [darkMode,       setDarkMode]       = useState(true);
    const [fontSize,       setFontSize]       = useState(16);
    const [tabLoading,     setTabLoading]     = useState(false);
    const [editingContent, setEditingContent] = useState<string|null>(null);
    const [quizActive,     setQuizActive]     = useState(false);
    const [currentQ,       setCurrentQ]       = useState(0);
    const [score,          setScore]          = useState(0);
    const [timeLeft,       setTimeLeft]       = useState(50);
    const [showResults,    setShowResults]    = useState(false);
    const [commitments,    setCommitments]    = useState<Array<{text:string;date:string}>>([]);
    const [commitInput,    setCommitInput]    = useState("");
    const [loveRating,     setLoveRating]     = useState(5);

    // ── Refs ──────────────────────────────────────────────────────────────────
    const resolvingRef    = useRef(false);
    const loadingPctRef   = useRef(0);
    const scriptureSeeded = useRef(false); // FIX #2 — prevents infinite seed loop
    const lessonSaveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
    // Cleanup debounce timer on unmount
    useEffect(() => { return () => { if (lessonSaveTimer.current) clearTimeout(lessonSaveTimer.current); }; }, []);

    useEffect(() => { loadingPctRef.current = loadingPct; }, [loadingPct]);

    // ── Boot animation ────────────────────────────────────────────────────────
    useEffect(() => {
        const iv = setInterval(() => {
            setLoadingPct(p => { if(p>=100){clearInterval(iv);return 100;} return p+12; });
        }, 180);
        return () => clearInterval(iv);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    //  LESSON HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    // Load all lessons from DB. FIX #1/#4 — lessons stored in DB with title,
    // all same page, only data changes when switching.
    const loadLessons = useCallback(async () => {
        setLessonsLoading(true);
        const { data, error } = await supabase
            .from("lessons")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) { console.error("loadLessons:", error); setLessonsLoading(false); return; }
        if (data && data.length > 0) {
            const rows = data as LessonRow[];
            setLessons(rows);
            const active = rows.find(l=>l.is_active) || rows[0];
            setActiveLessonId(active.id);
            setContentData(active.content as LessonContent);
        } else {
            // Seed first lesson
            const def = makeDefaultContent();
            const { data:ins, error:insErr } = await supabase
                .from("lessons")
                .insert({ title:"OBEDIENCE", is_active:true, content:def })
                .select().single();
            if (!insErr && ins) {
                setLessons([ins as LessonRow]);
                setActiveLessonId(ins.id);
                setContentData(def);
            }
        }
        setLessonsLoading(false);
    }, []);

    // Debounced save — waits 1.2s after last edit before writing to DB
    const debouncedSaveLesson = useCallback((content:LessonContent, lessonId:string) => {
        if (lessonSaveTimer.current) clearTimeout(lessonSaveTimer.current);
        lessonSaveTimer.current = setTimeout(async () => {
            setLessonSaving(true);
            const { error } = await supabase
                .from("lessons")
                .update({ content, title:content.lessonTitle, updated_at:new Date().toISOString() })
                .eq("id", lessonId);
            if (error) console.error("saveLesson:", error);
            else setLessons(prev => prev.map(l => l.id===lessonId ? {...l, content, title:content.lessonTitle} : l));
            setLessonSaving(false);
        }, 1200);
    }, []);

    // Switch to a different lesson — FIX #4: same page, only contentData changes
    const switchLesson = useCallback(async (lesson:LessonRow) => {
        if (activeLessonId && activeLessonId !== lesson.id) {
            await supabase.from("lessons").update({is_active:false}).eq("id", activeLessonId);
        }
        await supabase.from("lessons").update({is_active:true}).eq("id", lesson.id);
        setActiveLessonId(lesson.id);
        setContentData(lesson.content as LessonContent);
        setLessons(prev => prev.map(l => ({...l, is_active: l.id===lesson.id})));
        setShowLessonPicker(false);
        setEditingContent(null);
        setActiveTab("intro");
    }, [activeLessonId]);

    // FIX #1 — Admin creates a new lesson with a given title, saved to DB
    const createNewLesson = async () => {
        if (!newLessonTitle.trim()) { alert("Please enter a lesson title."); return; }
        setCreatingLesson(true);
        const newContent = makeDefaultContent(newLessonTitle.trim(), newLessonDate.trim() || new Date().toLocaleDateString());
        const { data, error } = await supabase
            .from("lessons")
            .insert({ title:newLessonTitle.trim(), is_active:false, content:newContent })
            .select().single();
        if (error) { alert("Failed to create lesson: "+error.message); setCreatingLesson(false); return; }
        const row = data as LessonRow;
        setLessons(prev => [row, ...prev]);
        setCreatingLesson(false);
        setShowNewLesson(false);
        setNewLessonTitle(""); setNewLessonDate("");
        await switchLesson(row);
    };

    const deleteLesson = async (lessonId:string) => {
        if (!confirm("Delete this lesson permanently?")) return;
        const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
        if (error) { alert("Failed to delete: "+error.message); return; }
        const remaining = lessons.filter(l=>l.id!==lessonId);
        setLessons(remaining);
        if (activeLessonId===lessonId && remaining.length>0) await switchLesson(remaining[0]);
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  SCRIPTURE HELPERS  (FIX #2 — scriptureSeeded ref stops infinite loop)
    // ─────────────────────────────────────────────────────────────────────────
    const rowToEntry = useCallback((row:Record<string,string>): [string,BibleVersions] => [
        row.reference,
        { KJV:row.kjv||"", NKJV:row.nkjv||"", NIV:row.niv||"",
          ESV:row.esv||"", AMP:row.amp||"", NLT:row.nlt||"", MSG:row.msg||"" },
    ], []);

    const loadScripturesFromDB = useCallback(async () => {
        setScriptureLoading(true);
        const { data, error } = await supabase
            .from("scriptures").select("*").order("reference",{ascending:true});
        if (error) { console.error("loadScriptures:", error); setScriptureLoading(false); return; }
        if (data && data.length > 0) {
            const db:ScriptureDB = {};
            data.forEach((row:Record<string,string>) => { const [r,v]=rowToEntry(row); db[r]=v; });
            setScriptureDB(db);
        } else if (!scriptureSeeded.current) {
            // FIX #2: mark seeded immediately so we never loop
            scriptureSeeded.current = true;
            // DB is empty — admin must add scriptures via the Manage tab
        }
        setScriptureLoading(false);
    }, [rowToEntry]);

    const addNewScripture = async () => {
        if (!newVerse.reference.trim() || !Object.values(newVerse.versions).some(v=>v)) return;
        setScriptureSyncing(true);
        const { error } = await supabase.from("scriptures").upsert({
            reference:newVerse.reference.trim(),
            kjv:newVerse.versions.KJV, nkjv:newVerse.versions.NKJV, niv:newVerse.versions.NIV,
            esv:newVerse.versions.ESV, amp:newVerse.versions.AMP,   nlt:newVerse.versions.NLT, msg:newVerse.versions.MSG,
        },{onConflict:"reference"});
        if (error) { alert("Failed to save: "+error.message); setScriptureSyncing(false); return; }
        setScriptureDB(p=>({...p,[newVerse.reference.trim()]:newVerse.versions}));
        setScriptureSaved(newVerse.reference.trim()); setTimeout(()=>setScriptureSaved(null),2500);
        setNewVerse({reference:"",versions:{KJV:"",NKJV:"",NIV:"",ESV:"",AMP:"",NLT:"",MSG:""}});
        setEditMode(false); setScriptureSyncing(false);
    };

    const startEditScripture = (ref:string) => { setEditingRef(ref); setEditingRefNew(ref); setEditingVersions({...scriptureDB[ref]}); setDeleteConfirmRef(null); };
    const cancelEditScripture = () => { setEditingRef(null); setEditingRefNew(""); setEditingVersions({KJV:"",NKJV:"",NIV:"",ESV:"",AMP:"",NLT:"",MSG:""}); };
    const updateEditVersion = (v:keyof BibleVersions, text:string) => setEditingVersions(p=>({...p,[v]:text}));

    const saveEditScripture = async () => {
        if (!editingRef) return;
        setScriptureSyncing(true);
        const target = editingRefNew.trim() || editingRef;
        if (target!==editingRef) await supabase.from("scriptures").delete().eq("reference",editingRef);
        const { error } = await supabase.from("scriptures").upsert({
            reference:target, kjv:editingVersions.KJV, nkjv:editingVersions.NKJV, niv:editingVersions.NIV,
            esv:editingVersions.ESV, amp:editingVersions.AMP, nlt:editingVersions.NLT, msg:editingVersions.MSG,
        },{onConflict:"reference"});
        if (error) { alert("Failed to update: "+error.message); setScriptureSyncing(false); return; }
        setScriptureDB(prev=>{ const u={...prev}; if(target!==editingRef) delete u[editingRef]; u[target]={...editingVersions}; return u; });
        setScriptureSaved(target); setTimeout(()=>setScriptureSaved(null),2500);
        setScriptureSyncing(false); cancelEditScripture();
    };

    const deleteScripture = async (ref:string) => {
        setScriptureSyncing(true);
        const { error } = await supabase.from("scriptures").delete().eq("reference",ref);
        if (error) { alert("Failed to delete: "+error.message); setScriptureSyncing(false); return; }
        setScriptureDB(p=>{ const u={...p}; delete u[ref]; return u; });
        setDeleteConfirmRef(null); if(editingRef===ref) cancelEditScripture(); setScriptureSyncing(false);
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  AUTH
    // ─────────────────────────────────────────────────────────────────────────
    const resolveUser = useCallback(async (user:User|null) => {
        if (resolvingRef.current) return;
        resolvingRef.current = true;
        try {
            if (!user) { setScreen("auth"); return; }
            setAuthUser(user);
            setSubChecking(true);
            if (readSubCache(user.id)) setScreen("app");
            const [prof,sub] = await Promise.all([
                withRetry(()=>getProfile(user.id)),
                withRetry(()=>getActiveSubscription(user.id)),
            ]);
            setProfile(prof); setSubscription(sub); setIsAdmin(prof?.role==="admin"); setSubChecking(false);
            if (sub) { writeSubCache(user.id,sub.end_date); setScreen("app"); }
            else     { clearSubCache(); setScreen("payment"); }
        } finally { resolvingRef.current = false; }
    }, []);

    useEffect(() => {
        const { data:{subscription:listener} } = supabase.auth.onAuthStateChange(async(_ev,session) => {
            if (loadingPctRef.current<100) await new Promise(r=>setTimeout(r,2000));
            await resolveUser(session?.user??null);
        });
        return () => listener.unsubscribe();
    }, [resolveUser]);

    useEffect(() => {
        if (screen==="app") { void loadLessons(); void loadScripturesFromDB(); }
    }, [screen, loadLessons, loadScripturesFromDB]);

    useEffect(() => {
        const h=(e:KeyboardEvent)=>{ if(e.ctrlKey&&e.shiftKey&&e.key==="E"&&isAdmin){e.preventDefault();setEditingContent(p=>p?null:activeTab);} };
        window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
    },[activeTab,isAdmin]);

    useEffect(() => {
        if (!quizActive || showResults) return;
        const t=setInterval(()=>setTimeLeft(p=>{ if(p<=1){endQuiz();return 0;} return p-1; }),1000);
        return ()=>clearInterval(t);
    },[quizActive,showResults]);

    // ─────────────────────────────────────────────────────────────────────────
    //  EMAIL AUTH  (FIX #3 — duplicate email rejected with clear message)
    // ─────────────────────────────────────────────────────────────────────────
    const clearAuthForm = () => { setAuthError("");setAuthSuccess("");setAuthEmail("");setAuthPassword("");setAuthFullName("");setAuthConfirm("");setShowPassword(false);setShowConfirm(false); };
    const switchAuthMode = (m:AuthMode) => { clearAuthForm(); setAuthMode(m); };

    const handleEmailSignUp = async () => {
        setAuthError(""); setAuthSuccess("");
        if (!authFullName.trim())        { setAuthError("Please enter your full name."); return; }
        if (!authEmail.includes("@"))    { setAuthError("Please enter a valid email address."); return; }
        if (authPassword.length<6)       { setAuthError("Password must be at least 6 characters."); return; }
        if (authPassword!==authConfirm)  { setAuthError("Passwords do not match."); return; }
        setAuthLoading(true);

        // FIX #3: check for existing email BEFORE calling signUp
        const { data:existing } = await supabase
            .from("profiles").select("id").eq("email",authEmail.trim().toLowerCase()).maybeSingle();
        if (existing) {
            setAuthError("This email is already registered. Please sign in instead.");
            setAuthLoading(false); return;
        }

        const { data, error } = await supabase.auth.signUp({
            email:authEmail.trim().toLowerCase(), password:authPassword,
            options:{ data:{ full_name:authFullName.trim(), avatar_url:null }, emailRedirectTo:window.location.origin },
        });
        setAuthLoading(false);
        if (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes("already")||msg.includes("registered")||msg.includes("taken"))
                setAuthError("This email is already registered. Please sign in instead.");
            else setAuthError(error.message);
            return;
        }
        if (data.user&&!data.session)
            setAuthSuccess("✅ Account created! Check your email to confirm before signing in.");
    };

    const handleEmailSignIn = async () => {
        setAuthError(""); setAuthSuccess("");
        if (!authEmail.includes("@")) { setAuthError("Please enter a valid email address."); return; }
        if (!authPassword)            { setAuthError("Please enter your password."); return; }
        setAuthLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email:authEmail.trim().toLowerCase(), password:authPassword,
        });
        setAuthLoading(false);
        if (error) {
            const m=error.message.toLowerCase();
            if (m.includes("invalid"))  setAuthError("Incorrect email or password. Please try again.");
            else if (m.includes("confirm")) setAuthError("Please confirm your email first. Check your inbox.");
            else setAuthError(error.message);
        }
    };

    const handleForgotPassword = async () => {
        setAuthError(""); setAuthSuccess("");
        if (!authEmail.includes("@")) { setAuthError("Please enter your email address first."); return; }
        setAuthLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim().toLowerCase(),{redirectTo:window.location.origin});
        setAuthLoading(false);
        if (error) { setAuthError(error.message); return; }
        setAuthSuccess("✅ Password reset link sent! Check your inbox.");
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  PAYSTACK
    // ─────────────────────────────────────────────────────────────────────────
    const handlePaystackPayment = () => {
        if (!authUser||!profile) return;
        if (!window.PaystackPop) { alert("Paystack not loaded. Add to index.html:\n<script src='https://js.paystack.co/v1/inline.js'></script>"); return; }
        setPayLoading(true);
        const reference = `SSA_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
        window.PaystackPop.setup({
            key:PAYSTACK_PUBLIC_KEY, email:authUser.email!, amount:MONTHLY_AMOUNT_KOBO, currency:"NGN", reference,
            ...(PAYSTACK_PLAN_CODE?{plan:PAYSTACK_PLAN_CODE}:{}),
            metadata:{user_id:authUser.id,full_name:profile.full_name||authUser.email,product:"Sunday School Monthly"},
            onClose:()=>setPayLoading(false),
            callback:function(response){
                void (function(){
                    const ref=(response&&response.reference)?response.reference:reference;
                    createSubscription({userId:authUser.id,reference:ref,amount:MONTHLY_AMOUNT_KOBO})
                    .then(function(sub){
                        if(sub){ writeSubCache(authUser.id,sub.end_date); setSubscription(sub); setScreen("app"); }
                        else { const e=new Date();e.setDate(e.getDate()+30);writeSubCache(authUser.id,e.toISOString());alert("✅ Payment received!\nRef: "+ref);setScreen("app"); }
                    }).catch(function(err){
                        const e=new Date();e.setDate(e.getDate()+30);writeSubCache(authUser.id,e.toISOString());
                        console.error(err);alert("✅ Payment received! Tap OK.\nRef: "+ref);setScreen("app");
                    }).finally(function(){ setPayLoading(false); });
                })();
            },
        }).openIframe();
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  CONTENT UPDATERS  — debounced auto-save to DB
    // ─────────────────────────────────────────────────────────────────────────
    const upd = (fn:(p:LessonContent)=>LessonContent) => {
        setContentData(prev => {
            const updated = fn(prev);
            if (activeLessonId) debouncedSaveLesson(updated, activeLessonId);
            return updated;
        });
    };
    const updateContent      = (f:string,v:string)                => upd(p=>({...p,[f]:v}));
    const updateLessonPoint  = (i:number,f:string,v:string)       => upd(p=>({...p,lessonPoints:p.lessonPoints.map((pt,idx)=>idx===i?{...pt,[f]:v}:pt)}));
    const updateSubPoint     = (pi:number,si:number,f:string,v:string) => upd(p=>({...p,lessonPoints:p.lessonPoints.map((pt,i)=>i===pi?{...pt,subPoints:pt.subPoints.map((sp,j)=>j===si?{...sp,[f]:v}:sp)}:pt)}));
    const addSubPoint        = (pi:number)                        => upd(p=>({...p,lessonPoints:p.lessonPoints.map((pt,i)=>i===pi?{...pt,subPoints:[...pt.subPoints,{title:"New Point",content:"",scriptures:[]}]}:pt)}));
    const deleteSubPoint     = (pi:number,si:number)              => upd(p=>({...p,lessonPoints:p.lessonPoints.map((pt,i)=>i===pi?{...pt,subPoints:pt.subPoints.filter((_,j)=>j!==si)}:pt)}));
    const updatePrayer       = (i:number,v:string)                => upd(p=>({...p,prayerPoints:p.prayerPoints.map((pr,idx)=>idx===i?v:pr)}));
    const addPrayerPoint     = ()                                  => upd(p=>({...p,prayerPoints:[...p.prayerPoints,"New prayer point…"]}));

    // ─────────────────────────────────────────────────────────────────────────
    //  QUIZ
    // ─────────────────────────────────────────────────────────────────────────
    const startQuiz  = ()            => { setQuizActive(true);setCurrentQ(0);setScore(0);setTimeLeft(50);setShowResults(false); };
    const checkAnswer= (c:number)    => {
        if(!quizActive||showResults)return;
        if(quizQuestions[currentQ].correct===c) setScore(p=>p+10+Math.floor(timeLeft/10));
        if(currentQ<quizQuestions.length-1) setTimeout(()=>setCurrentQ(p=>p+1),900);
        else setTimeout(endQuiz,900);
    };
    const endQuiz    = ()            => { setQuizActive(false); setShowResults(true); };

    // ─────────────────────────────────────────────────────────────────────────
    //  UI HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    const showBibleVerse     = (ref:string)              => { setSelectedVerse(ref);setShowVerseModal(true);setVerseLoading(true);setTimeout(()=>setVerseLoading(false),700); };
    const changeBibleVersion = (v:keyof BibleVersions)  => { setVerseLoading(true);setTimeout(()=>{setBibleVersion(v);setVerseLoading(false);},500); };
    const handleTabChange    = (tab:string)              => { setTabLoading(true);setTimeout(()=>{setActiveTab(tab);setTabLoading(false);},300); };
    const addCommitment      = ()                        => { if(!commitInput.trim())return; setCommitments(p=>[{text:commitInput,date:new Date().toLocaleDateString()},...p]);setCommitInput(""); };
    const formatVerse        = (text:string)             => text.split(/(\d+)/).map((p,i)=>/^\d+$/.test(p)?<strong key={i}>{p}</strong>:<span key={i}>{p}</span>);

    const th     = darkMode?"bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white":"bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 text-gray-900";
    const cardBg = darkMode?"bg-white/10 backdrop-blur-xl border-white/20":"bg-white/80 border-gray-200";
    const inp    = (extra="") => `${extra} px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-purple-400 ${darkMode?"bg-white/10 border-white/20 text-white placeholder-white/40":"bg-white border-gray-300 text-gray-800 placeholder-gray-400"}`;
    const subDaysLeft = subscription?Math.max(0,Math.ceil((new Date(subscription.end_date).getTime()-Date.now())/86_400_000)):0;

    const editBanner = (tab:string) => {
        if(!isAdmin) return null;
        if(editingContent===tab) return (
            <div className="bg-yellow-500/20 border border-yellow-400/40 rounded-xl p-3 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2 text-yellow-400 text-sm font-semibold"><Edit2 size={14}/> Editing — auto-saves to database {lessonSaving&&<Loader2 size={12} className="animate-spin"/>}</span>
                <button onClick={()=>setEditingContent(null)} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-1.5 rounded-lg text-xs font-bold transition">✓ Done Editing</button>
            </div>
        );
        return (
            <div className="flex justify-end mb-3">
                <button onClick={()=>setEditingContent(tab)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-semibold transition">
                    <Edit2 size={12}/> Edit Content
                </button>
            </div>
        );
    };

    // ═════════════════════════════════════════════════════════════════════════
    //  BOOT SCREEN
    // ═════════════════════════════════════════════════════════════════════════
    if (screen==="boot"||loadingPct<100) {
        const animText="Progress Through Thanksgiving".split("");
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 flex items-center justify-center z-50">
                <div className="text-center px-4">
                    <div className="relative mb-8 mx-auto w-32 h-32">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                            <img src={logo} alt="Logo" className="w-20 h-20 object-contain"/>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full border-4 border-white/30 animate-ping"/>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">Life Gate Ministries Worldwide</h1>
                    <p className="text-white/80 mb-6">Sunday School Lessons</p>
                    <div className="flex justify-center mb-6 flex-wrap">
                        {animText.map((c,i)=>(
                            <span key={i} className="inline-block text-2xl font-extrabold text-blue-300 drop-shadow-[0_0_8px_#60a5fa] animate-[wave_1.5s_ease-in-out_infinite]" style={{animationDelay:`${i*0.08}s`}}>
                                {c===" "?"\u00A0":c}
                            </span>
                        ))}
                    </div>
                    <div className="w-64 mx-auto bg-white/20 rounded-full h-3 overflow-hidden mb-2">
                        <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-300" style={{width:`${loadingPct}%`}}/>
                    </div>
                    <p className="text-white/60 text-sm">{loadingPct}%</p>
                </div>
                <style>{`@keyframes wave{0%,100%{transform:translateY(0)}25%{transform:translateY(-10px)}50%{transform:translateY(6px)}75%{transform:translateY(-4px)}}`}</style>
            </div>
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  AUTH SCREEN
    // ═════════════════════════════════════════════════════════════════════════
    if (screen==="auth") {
        return (
            <div className={`min-h-screen ${th} flex items-center justify-center p-4 relative overflow-hidden`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-96 h-96 bg-purple-500/25 rounded-full blur-3xl -top-48 -left-48 animate-pulse"/>
                    <div className="absolute w-96 h-96 bg-blue-500/25 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{animationDelay:"1s"}}/>
                </div>
                <div className="max-w-sm w-full relative z-10">
                    <div className="text-center mb-7">
                        <div className="w-20 h-20 mx-auto mb-4 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/20">
                            <img src={logo} alt="Logo" className="w-12 h-12 object-contain"/>
                        </div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Sunday School</h1>
                        <p className="text-xs opacity-50 mt-1">Life Gate Ministries Worldwide</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-7 shadow-2xl space-y-4">
                        {authMode==="forgot" && (<>
                            <div className="flex items-center gap-3"><button onClick={()=>switchAuthMode("login")} className="opacity-50 hover:opacity-80"><ArrowLeft size={18}/></button><h2 className="text-lg font-bold">Reset Password</h2></div>
                            <p className="text-sm opacity-60">Enter your email and we'll send a reset link.</p>
                            {authError  && <div className="flex items-start gap-2 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm"><X size={15} className="mt-0.5 flex-shrink-0"/>{authError}</div>}
                            {authSuccess && <div className="flex items-start gap-2 px-4 py-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-300 text-sm"><CheckCircle size={15} className="mt-0.5 flex-shrink-0"/>{authSuccess}</div>}
                            <div className="relative"><AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"/><input type="email" value={authEmail} onChange={e=>{setAuthEmail(e.target.value);setAuthError("");}} placeholder="your@email.com" className={inp("w-full pl-10")}/></div>
                            <button onClick={handleForgotPassword} disabled={authLoading} className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 flex items-center justify-center gap-2 disabled:opacity-50 transition">
                                {authLoading?<><Loader2 size={17} className="animate-spin"/>Sending…</>:<><Mail size={16}/>Send Reset Link</>}
                            </button>
                            <p className="text-center text-xs opacity-50">Remembered it? <button onClick={()=>switchAuthMode("login")} className="text-purple-400 hover:underline font-semibold">Sign In</button></p>
                        </>)}
                        {authMode!=="forgot" && (<>
                            <div className={`flex rounded-xl overflow-hidden border ${darkMode?"border-white/10":"border-gray-200"} p-1 gap-1`}>
                                {(["login","signup"] as AuthMode[]).map(m=>(
                                    <button key={m} onClick={()=>switchAuthMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${authMode===m?"bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg":"opacity-50 hover:opacity-80"}`}>
                                        {m==="login"?"Sign In":"Sign Up"}
                                    </button>
                                ))}
                            </div>
                            {authError  && <div className="flex items-start gap-2 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm"><X size={15} className="mt-0.5 flex-shrink-0"/>{authError}</div>}
                            {authSuccess && <div className="flex items-start gap-2 px-4 py-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-300 text-sm"><CheckCircle size={15} className="mt-0.5 flex-shrink-0"/>{authSuccess}</div>}
                            {authMode==="signup" && (<div className="relative"><UserPlus size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"/><input type="text" value={authFullName} onChange={e=>{setAuthFullName(e.target.value);setAuthError("");}} placeholder="Full Name" className={inp("w-full pl-10")}/></div>)}
                            <div className="relative"><AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"/><input type="email" value={authEmail} onChange={e=>{setAuthEmail(e.target.value);setAuthError("");}} placeholder="Email Address" className={inp("w-full pl-10")}/></div>
                            <div className="relative">
                                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"/>
                                <input type={showPassword?"text":"password"} value={authPassword} onChange={e=>{setAuthPassword(e.target.value);setAuthError("");}} placeholder={authMode==="signup"?"Create Password (min 6 chars)":"Password"} className={inp("w-full pl-10 pr-11")}/>
                                <button type="button" onClick={()=>setShowPassword(p=>!p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                            </div>
                            {authMode==="signup" && (
                                <div className="relative">
                                    <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"/>
                                    <input type={showConfirm?"text":"password"} value={authConfirm} onChange={e=>{setAuthConfirm(e.target.value);setAuthError("");}} placeholder="Confirm Password" className={inp(`w-full pl-10 pr-11 ${authConfirm&&authConfirm!==authPassword?"border-red-500/60":""}`)}/>
                                    <button type="button" onClick={()=>setShowConfirm(p=>!p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70">{showConfirm?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                                </div>
                            )}
                            {authMode==="login" && (<div className="text-right -mt-1"><button onClick={()=>switchAuthMode("forgot")} className="text-xs text-purple-400 hover:underline opacity-70 hover:opacity-100">Forgot password?</button></div>)}
                            <button onClick={authMode==="login"?handleEmailSignIn:handleEmailSignUp} disabled={authLoading}
                                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                {authLoading?<><Loader2 size={17} className="animate-spin"/>{authMode==="login"?"Signing in…":"Creating account…"}</>:authMode==="login"?<><Lock size={16}/>Sign In</>:<><UserPlus size={16}/>Create Account</>}
                            </button>
                            <div className="flex items-center gap-3"><div className="flex-1 h-px bg-white/10"/><span className="text-xs opacity-40 font-semibold">OR</span><div className="flex-1 h-px bg-white/10"/></div>
                            <button onClick={async()=>{setAuthError("");setAuthLoading(true);await signInWithGoogle();}} disabled={authLoading}
                                className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-bold shadow-lg transition hover:scale-[1.02] disabled:opacity-50 ${darkMode?"bg-white/90 text-gray-800 hover:bg-white":"bg-white text-gray-800 hover:bg-gray-50"}`}>
                                <Chrome size={18} className="text-blue-600"/>Continue with Google
                            </button>
                            <p className="text-center text-xs opacity-40">By continuing you agree to our terms of service.</p>
                        </>)}
                    </div>
                </div>
            </div>
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  PAYMENT SCREEN
    // ═════════════════════════════════════════════════════════════════════════
    if (screen==="payment") {
        const dLeft=subscription?Math.max(0,Math.ceil((new Date(subscription.end_date).getTime()-Date.now())/86_400_000)):0;
        return (
            <div className={`min-h-screen ${th} flex items-center justify-center p-4 relative overflow-hidden`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-96 h-96 bg-purple-500/25 rounded-full blur-3xl -top-48 -left-48 animate-pulse"/>
                    <div className="absolute w-96 h-96 bg-pink-500/25 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{animationDelay:"1.2s"}}/>
                </div>
                <div className="max-w-md w-full relative z-10">
                    <div className="flex items-center justify-between mb-8 px-1">
                        <div className="flex items-center gap-3">
                            {profile?.avatar_url?<img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full border-2 border-white/30"/>:<div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">{profile?.email?.[0]?.toUpperCase()}</div>}
                            <div><p className="font-semibold text-sm">{profile?.full_name||"Welcome"}</p><p className="text-xs opacity-50">{profile?.email}</p></div>
                        </div>
                        <button onClick={()=>{signOut();setScreen("auth");setAuthUser(null);}} className="flex items-center gap-1 text-xs opacity-50 hover:opacity-80"><LogOut size={14}/> Sign out</button>
                    </div>
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500"/>
                        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                            <div className="absolute -top-3 right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-4 py-1 rounded-full text-xs font-black shadow-lg">
                                {dLeft===0&&subscription?"RENEWAL REQUIRED":"MONTHLY ACCESS"}
                            </div>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center border border-white/20"><img src={logo} alt="" className="w-10 h-10 object-contain"/></div>
                                <h2 className="text-2xl font-black mb-1">{dLeft===0&&subscription?"Subscription Expired":"Premium Subscription"}</h2>
                                <p className="text-sm opacity-60">Full access to Sunday School content</p>
                            </div>
                            <div className="text-center mb-6">
                                <p className="text-6xl font-black mb-1">₦1,000</p>
                                <p className="text-sm opacity-50 flex items-center justify-center gap-1"><RefreshCw size={12}/> per month</p>
                            </div>
                            <ul className="space-y-2.5 mb-8">
                                {["All lesson content & Bible references","7 Bible translations per verse","Interactive speed quiz","Personal commitment tracker","Prayer points with reflection","Admin: manage all lessons & scriptures"].map(f=>(
                                    <li key={f} className="flex items-center gap-3 text-sm"><CheckCircle size={16} className="text-green-400 flex-shrink-0"/>{f}</li>
                                ))}
                            </ul>
                            {subChecking
                                ?<div className="w-full py-4 flex items-center justify-center gap-2 opacity-50"><Loader2 size={18} className="animate-spin"/>Checking subscription…</div>
                                :<button onClick={handlePaystackPayment} disabled={payLoading} className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-xl flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                                    {payLoading?<><Loader2 size={20} className="animate-spin"/>Processing…</>:<><CreditCard size={20}/>Pay ₦1,000 with Paystack</>}
                                </button>
                            }
                            <p className="text-center text-xs opacity-40 mt-4">🔒 Secured by Paystack · Instant activation</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  MAIN APP — single-page, contentData changes per active lesson (FIX #4)
    // ═════════════════════════════════════════════════════════════════════════
    const tabs = [
        {id:"intro",label:"Intro"},{id:"lesson",label:"Lesson"},
        {id:"conclusion",label:"Conclusion"},{id:"application",label:"Application"},
        {id:"quiz",label:"Quiz"},{id:"prayer",label:"Prayer"},
        {id:"manage",label:"Manage"},
        ...(isAdmin?[{id:"admin",label:"🛡 Admin"}]:[]),
    ];

    return (
        <div className={`min-h-screen ${th} transition-all duration-500 relative`} style={{fontSize:`${fontSize}px`}}>
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/15 rounded-full blur-3xl top-0 left-1/4 animate-pulse"/>
                <div className="absolute w-96 h-96 bg-blue-500/15 rounded-full blur-3xl bottom-0 right-1/4 animate-pulse" style={{animationDelay:"1s"}}/>
            </div>

            <Header logo={logo} contentData={contentData} fontSize={fontSize} adjustFontSize={(d:number)=>setFontSize(p=>Math.min(Math.max(p+d,12),24))} darkMode={darkMode} toggleTheme={()=>setDarkMode(p=>!p)}/>

            {subDaysLeft<=5&&subDaysLeft>0&&(
                <div className="bg-orange-500/20 border-b border-orange-500/30 text-orange-300 text-center text-sm py-2 px-4 font-semibold">
                    ⚠️ Subscription expires in {subDaysLeft} day{subDaysLeft===1?"":"s"} · <button onClick={()=>setScreen("payment")} className="underline">Renew now</button>
                </div>
            )}

            {/* User strip */}
            <div className={`border-b ${darkMode?"border-white/10":"border-black/10"} px-4 py-2 flex items-center justify-between text-xs opacity-60`}>
                <span className="flex items-center gap-2">
                    {profile?.avatar_url&&<img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full"/>}
                    {profile?.full_name||profile?.email}
                    {isAdmin&&<span className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded-full text-[10px] font-bold">ADMIN</span>}
                    {lessonSaving&&<span className="flex items-center gap-1 text-blue-400"><Loader2 size={10} className="animate-spin"/>saving…</span>}
                </span>
                <button onClick={async()=>{await signOut();setScreen("auth");setAuthUser(null);setProfile(null);setSubscription(null);}} className="flex items-center gap-1 hover:opacity-80 transition">
                    <LogOut size={12}/> Sign out
                </button>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-6xl relative z-10">

                {/* ── LESSON SELECTOR ── */}
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div className="relative">
                        <button onClick={()=>setShowLessonPicker(p=>!p)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition shadow-sm ${darkMode?"bg-white/10 hover:bg-white/20 border border-white/10":"bg-white/80 hover:bg-white border border-gray-200"}`}>
                            <FileText size={15} className="text-purple-400"/>
                            <span className="max-w-[200px] truncate">{contentData.lessonTitle}</span>
                            <ChevronDown size={14} className={`transition-transform ${showLessonPicker?"rotate-180":""}`}/>
                        </button>

                        {showLessonPicker&&(
                            <div className={`absolute top-full mt-2 left-0 z-50 min-w-[270px] rounded-2xl shadow-2xl border overflow-hidden ${darkMode?"bg-gray-800 border-white/10":"bg-white border-gray-200"}`}>
                                <div className="px-4 py-2.5 border-b border-white/10">
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">All Lessons</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {lessonsLoading
                                        ? <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin opacity-40"/></div>
                                        : lessons.length===0
                                            ? <p className="text-center py-8 opacity-40 text-sm">No lessons yet</p>
                                            : lessons.map(l=>(
                                                <div key={l.id} className={`flex items-center gap-2 px-3 py-2.5 group transition ${l.id===activeLessonId?darkMode?"bg-purple-500/20":"bg-purple-50":darkMode?"hover:bg-white/5":"hover:bg-gray-50"}`}>
                                                    <button onClick={()=>{ void switchLesson(l); }} className="flex-1 text-left min-w-0">
                                                        <p className={`text-sm font-semibold truncate ${l.id===activeLessonId?"text-purple-400":""}`}>{l.title}</p>
                                                        <p className="text-xs opacity-40">{l.content?.lessonDate||""}</p>
                                                    </button>
                                                    {l.id===activeLessonId&&<span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">ACTIVE</span>}
                                                    {isAdmin&&<button onClick={()=>deleteLesson(l.id)} className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-red-400 hover:text-red-500 transition p-1 rounded flex-shrink-0"><Trash2 size={12}/></button>}
                                                </div>
                                            ))
                                    }
                                </div>
                                {isAdmin&&(
                                    <div className="p-2 border-t border-white/10">
                                        <button onClick={()=>{setShowLessonPicker(false);setShowNewLesson(true);}}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-green-400 hover:bg-green-500/10 transition">
                                            <Plus size={14}/> Add New Lesson
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {contentData.lessonTitle}
                    </h2>
                </div>

                {/* ── NEW LESSON MODAL ── */}
                {showNewLesson&&isAdmin&&(
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={()=>setShowNewLesson(false)}>
                        <div className={`${darkMode?"bg-gray-800":"bg-white"} rounded-2xl shadow-2xl p-6 w-full max-w-sm`} onClick={e=>e.stopPropagation()}>
                            <h3 className="text-xl font-bold mb-1 flex items-center gap-2"><FileText size={18} className="text-purple-400"/>New Lesson</h3>
                            <p className="text-sm opacity-50 mb-5">All content can be edited after creation.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Lesson Title *</label>
                                    <input type="text" value={newLessonTitle} onChange={e=>setNewLessonTitle(e.target.value)}
                                        placeholder="e.g., FAITH, PRAYER, LOVE…"
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-purple-400 ${darkMode?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-300"}`}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Lesson Date</label>
                                    <input type="text" value={newLessonDate} onChange={e=>setNewLessonDate(e.target.value)}
                                        placeholder="e.g., January 5, 2025"
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-purple-400 ${darkMode?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-300"}`}/>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={()=>{ void createNewLesson(); }} disabled={creatingLesson}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 flex items-center justify-center gap-2 disabled:opacity-50 transition">
                                    {creatingLesson?<><Loader2 size={16} className="animate-spin"/>Creating…</>:<><Plus size={16}/>Create Lesson</>}
                                </button>
                                <button onClick={()=>setShowNewLesson(false)} className={`px-4 py-3 rounded-xl font-semibold text-sm transition ${darkMode?"bg-gray-700 hover:bg-gray-600":"bg-gray-100 hover:bg-gray-200"}`}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab bar */}
                <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide backdrop-blur-sm bg-white/5 p-2 rounded-2xl border border-white/10">
                    {tabs.map(({id,label})=>(
                        <button key={id} onClick={()=>handleTabChange(id)}
                            className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex-shrink-0 text-sm ${activeTab===id?"bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg scale-105":darkMode?"bg-white/10 hover:bg-white/20 border border-white/10":"bg-black/10 hover:bg-black/20 border border-black/10"}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {tabLoading&&<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"/></div>}

                {!tabLoading&&(
                <div className={`${cardBg} border rounded-2xl shadow-2xl p-6 md:p-8`}>

                    {/* ── INTRO ── */}
                    {activeTab==="intro"&&(
                        <div className="space-y-6">
                            {editBanner("intro")}
                            <div className={`${darkMode?"bg-blue-900/30":"bg-blue-50"} p-6 rounded-xl border-l-4 border-blue-500`}>
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><BookOpen className="text-blue-500"/>Memory Verse</h3>
                                {(editingContent==="intro"&&isAdmin)
                                    ?<textarea value={contentData.memoryVerse} onChange={e=>updateContent("memoryVerse",e.target.value)} className={`w-full px-4 py-2 rounded-lg border text-lg italic mb-4 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={2}/>
                                    :<blockquote className="text-xl italic mb-4">"{contentData.memoryVerse}"</blockquote>
                                }
                                <button onClick={()=>showBibleVerse(contentData.memoryVerseRef)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition">
                                    <BookOpen size={15}/> Read {contentData.memoryVerseRef}
                                </button>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">Introduction</h3>
                                {(editingContent==="intro"&&isAdmin)
                                    ?<textarea value={contentData.introduction} onChange={e=>updateContent("introduction",e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={6}/>
                                    :<p className="leading-relaxed">{contentData.introduction}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {contentData.lessonIntroScriptures.map(s=>(
                                                <button key={s} onClick={()=>showBibleVerse(s)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition"><BookOpen size={13}/>{s}</button>
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
                                        {(editingContent==="intro"&&isAdmin)
                                            ?<textarea value={contentData.aims} onChange={e=>updateContent("aims",e.target.value)} className={`w-full px-3 py-2 rounded-lg border mt-2 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={2}/>
                                            :<p className="mt-1">{contentData.aims}</p>
                                        }
                                    </div>
                                    <div>
                                        <strong className="text-green-500">OBJECTIVES:</strong>
                                        {(editingContent==="intro"&&isAdmin)
                                            ?<textarea value={contentData.objectives} onChange={e=>updateContent("objectives",e.target.value)} className={`w-full px-3 py-2 rounded-lg border mt-2 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={2}/>
                                            :<p className="mt-1">{contentData.objectives}</p>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── LESSON ── */}
                    {activeTab==="lesson"&&(
                        <div className="space-y-6">
                            {editBanner("lesson")}
                            <h3 className="text-2xl font-bold">Lesson Content</h3>
                            {(editingContent==="lesson"&&isAdmin)
                                ?<textarea value={contentData.lessonIntro} onChange={e=>updateContent("lessonIntro",e.target.value)} className={`w-full px-4 py-2 rounded-lg border mb-4 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={3}/>
                                :<p className="leading-relaxed mb-6">{contentData.lessonIntro}</p>
                            }
                            {contentData.lessonPoints.map((section,idx)=>(
                                <div key={idx} className={`${darkMode?"bg-gray-700/60":"bg-gray-50"} p-5 rounded-xl`}>
                                    {(editingContent==="lesson"&&isAdmin)?(
                                        <>
                                            <input type="text" value={section.title} onChange={e=>updateLessonPoint(idx,"title",e.target.value)} className={`w-full px-3 py-2 rounded-lg border mb-3 font-bold ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`}/>
                                            <textarea value={section.content} onChange={e=>updateLessonPoint(idx,"content",e.target.value)} className={`w-full px-3 py-2 rounded-lg border mb-3 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={3}/>
                                            <div className="ml-4 space-y-3">
                                                {section.subPoints.map((sp,si)=>(
                                                    <div key={si} className={`${darkMode?"bg-gray-800":"bg-white"} p-3 rounded-lg`}>
                                                        <div className="flex justify-between mb-2">
                                                            <span className="text-xs font-bold text-yellow-500">{String.fromCharCode(97+si)}.</span>
                                                            <button onClick={()=>deleteSubPoint(idx,si)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                                                        </div>
                                                        <input type="text" value={sp.title} onChange={e=>updateSubPoint(idx,si,"title",e.target.value)} placeholder="Sub-point title" className={`w-full px-3 py-1 rounded border mb-2 text-sm font-semibold ${darkMode?"bg-gray-700 border-gray-600":"bg-gray-50 border-gray-300"}`}/>
                                                        <textarea value={sp.content} onChange={e=>updateSubPoint(idx,si,"content",e.target.value)} placeholder="Content" className={`w-full px-3 py-1 rounded border text-sm ${darkMode?"bg-gray-700 border-gray-600":"bg-gray-50 border-gray-300"}`} rows={2}/>
                                                    </div>
                                                ))}
                                                <button onClick={()=>addSubPoint(idx)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"><Plus size={13}/> Add Sub-point</button>
                                            </div>
                                        </>
                                    ):(
                                        <>
                                            <h4 className="text-xl font-bold mb-2">{idx+1}. {section.title}</h4>
                                            {section.content&&<p className="leading-relaxed mb-3">{section.content}</p>}
                                            {section.scriptures?.length>0&&(
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {section.scriptures.map(s=>(
                                                        <button key={s} onClick={()=>showBibleVerse(s)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"><BookOpen size={13}/>{s}</button>
                                                    ))}
                                                </div>
                                            )}
                                            {section.subPoints?.length>0&&(
                                                <ol className="list-[lower-alpha] ml-6 space-y-3">
                                                    {section.subPoints.map((sp,si)=>(
                                                        <li key={si}>
                                                            <strong>{sp.title}:</strong> {sp.content}
                                                            {sp.scriptures&&sp.scriptures.length>0&&(
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {sp.scriptures.map((ref,i)=>(
                                                                        <button key={i} onClick={()=>showBibleVerse(ref)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition">📖 {ref}</button>
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

                    {/* ── CONCLUSION ── */}
                    {activeTab==="conclusion"&&(
                        <div className="space-y-4">
                            {editBanner("conclusion")}
                            <h3 className="text-2xl font-bold mb-4">Conclusion</h3>
                            {(editingContent==="conclusion"&&isAdmin)
                                ?<textarea value={contentData.conclusion} onChange={e=>updateContent("conclusion",e.target.value)} className={`w-full px-4 py-2 rounded-lg border text-lg ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={5}/>
                                :<p className="text-lg leading-relaxed">{contentData.conclusion}</p>
                            }
                            {contentData.conclusionScriptures?.length>0&&(
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {contentData.conclusionScriptures.map(s=>(
                                        <button key={s} onClick={()=>showBibleVerse(s)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"><BookOpen size={14}/>{s}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── APPLICATION ── */}
                    {activeTab==="application"&&(
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
                                <input type="range" min="1" max="10" value={loveRating} onChange={e=>setLoveRating(Number(e.target.value))} className="w-full accent-blue-500 mb-4"/>
                                <div className={`p-4 rounded-xl text-center text-sm font-medium ${darkMode?"bg-gray-800/60":"bg-white shadow-sm"}`}>
                                    {loveRating>=8?"✅ Strong obedience! Keep yielding to God daily.":loveRating>=5?"⚡ Growing! Deepen your trust through prayer and Scripture.":"⚠️ Time to renew your surrender and trust in God's leading."}
                                </div>
                            </div>
                            <div className={`${darkMode?"bg-gray-700/60":"bg-white border-2 border-dashed border-blue-200"} p-6 rounded-2xl`}>
                                <h4 className="text-xl font-bold mb-3">📝 Today's Obedience Action</h4>
                                <p className="text-sm opacity-60 mb-4">What one step will you take to obey God today?</p>
                                <input type="text" value={commitInput} onChange={e=>setCommitInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCommitment()} placeholder="E.g., Forgive someone, pray early…" className={`w-full px-4 py-3 rounded-xl border-2 outline-none focus:border-blue-400 mb-3 ${darkMode?"bg-gray-800 border-gray-600":"bg-gray-50 border-gray-200"}`}/>
                                <button onClick={addCommitment} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition"><Save size={16}/> Save Action</button>
                                {commitments.length>0&&(
                                    <div className="mt-5 space-y-3">
                                        {commitments.map((c,i)=>(
                                            <div key={i} className={`p-4 rounded-xl flex items-center gap-3 ${darkMode?"bg-gray-800":"bg-blue-50 border border-blue-100"}`}>
                                                <CheckCircle className="text-blue-500 flex-shrink-0" size={20}/>
                                                <div><p className="font-semibold">{c.text}</p><p className="text-xs opacity-40">Logged: {c.date}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── QUIZ ── */}
                    {activeTab==="quiz"&&(
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold">Speed Quiz</h3>
                                {quizActive&&<div className="flex gap-4"><span className="flex items-center gap-1 text-blue-400 font-bold"><Clock size={16}/>{timeLeft}s</span><span className="flex items-center gap-1 text-yellow-400 font-bold"><Award size={16}/>{score}</span></div>}
                            </div>
                            {!quizActive&&!showResults&&(
                                <div className="text-center py-12">
                                    <Award size={64} className="mx-auto mb-4 text-yellow-500"/>
                                    <h4 className="text-2xl font-bold mb-3">Ready to Test Your Knowledge?</h4>
                                    <p className="opacity-60 mb-8">Answer quickly for bonus points!</p>
                                    <button onClick={startQuiz} className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-xl text-lg font-bold transition hover:scale-105">Start Quiz</button>
                                </div>
                            )}
                            {quizActive&&!showResults&&(
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
                            {showResults&&(
                                <div className="text-center space-y-6 py-8">
                                    <Award size={80} className="mx-auto text-yellow-500"/>
                                    <h4 className="text-3xl font-bold">Quiz Complete!</h4>
                                    <div className={`${darkMode?"bg-gray-700/60":"bg-gradient-to-r from-blue-50 to-indigo-50"} p-8 rounded-2xl`}>
                                        <p className="text-6xl font-black text-blue-500 mb-2">{score}</p>
                                        <p className="text-lg opacity-60">Final Score</p>
                                        <p className="mt-4 font-semibold">{score>=150?"🏆 Outstanding!":score>=100?"🌟 Great work!":"📖 Good effort! Review the lesson."}</p>
                                    </div>
                                    <button onClick={startQuiz} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition">Try Again</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PRAYER ── */}
                    {activeTab==="prayer"&&(
                        <div className="space-y-4">
                            {editBanner("prayer")}
                            <h3 className="text-2xl font-bold mb-6">Prayer Points</h3>
                            <div className="space-y-4">
                                {contentData.prayerPoints.map((prayer,idx)=>(
                                    <div key={idx} className={`${darkMode?"bg-gray-700/60 border-purple-900":"bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"} p-6 rounded-2xl border-l-4`}>
                                        {(editingContent==="prayer"&&isAdmin)
                                            ?<textarea value={prayer} onChange={e=>updatePrayer(idx,e.target.value)} className={`w-full px-3 py-2 rounded-lg border font-medium ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={3}/>
                                            :<div className="flex gap-3">
                                                <span className="text-2xl">{["🤝","💎","🧠","⚡"][idx]||"🙏"}</span>
                                                <p className={`text-lg italic font-medium leading-relaxed ${darkMode?"text-purple-200":"text-purple-900"}`}>"{prayer}"</p>
                                             </div>
                                        }
                                    </div>
                                ))}
                            </div>
                            {(editingContent==="prayer"&&isAdmin)&&(
                                <button onClick={addPrayerPoint} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"><Plus size={15}/> Add Prayer Point</button>
                            )}
                        </div>
                    )}

                    {/* ── MANAGE (scriptures) ── */}
                    {activeTab==="manage"&&(
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center gap-2"><Database className="text-blue-400" size={22}/>Scripture Database</h3>
                                    <p className="text-xs opacity-50 mt-0.5">{Object.keys(scriptureDB).length} entries · {isAdmin?"Admin — full edit access":"Read-only"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={()=>void loadScripturesFromDB()} disabled={scriptureLoading}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 transition disabled:opacity-40">
                                        <RefreshCw size={13} className={scriptureLoading?"animate-spin":""}/> Sync DB
                                    </button>
                                    {isAdmin&&(
                                        <button onClick={()=>setEditMode(!editMode)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${editMode?"bg-red-600 hover:bg-red-700":"bg-green-600 hover:bg-green-700"} text-white`}>
                                            {editMode?<><X size={14}/> Cancel</>:<><Plus size={14}/> Add New Scripture</>}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {scriptureSaved&&(
                                <div className="flex items-center gap-2 px-4 py-3 bg-green-600/20 border border-green-500/40 rounded-xl text-green-400 text-sm font-semibold">
                                    <CheckCircle size={16}/> "{scriptureSaved}" saved to database!
                                </div>
                            )}

                            {isAdmin&&editMode&&(
                                <div className={`${darkMode?"bg-gray-700/70":"bg-blue-50"} p-6 rounded-2xl border ${darkMode?"border-white/10":"border-blue-200"} space-y-4`}>
                                    <h4 className="font-bold text-lg flex items-center gap-2"><Plus size={16} className="text-green-400"/>New Scripture Entry</h4>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Reference *</label>
                                        <input type="text" value={newVerse.reference} onChange={e=>setNewVerse({...newVerse,reference:e.target.value})}
                                            placeholder="e.g., John 3:16 or Romans 8:28"
                                            className={`w-full px-4 py-2.5 rounded-xl border font-semibold ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`}/>
                                    </div>
                                    {(["KJV","NKJV","NIV","ESV","AMP","NLT","MSG"] as const).map(v=>(
                                        <div key={v}>
                                            <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{v}</label>
                                            <textarea value={newVerse.versions[v]} onChange={e=>setNewVerse(p=>({...p,versions:{...p.versions,[v]:e.target.value}}))}
                                                placeholder={`${v} translation text…`} rows={2}
                                                className={`w-full px-4 py-2 rounded-xl border text-sm ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`}/>
                                        </div>
                                    ))}
                                    <div className="flex gap-3">
                                        <button onClick={()=>void addNewScripture()} disabled={scriptureSyncing}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition disabled:opacity-50">
                                            {scriptureSyncing?<><Loader2 size={15} className="animate-spin"/>Saving…</>:<><Save size={15}/>Save to Database</>}
                                        </button>
                                        <button onClick={()=>setEditMode(false)} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-xl flex items-center gap-2 text-sm transition"><X size={14}/> Cancel</button>
                                    </div>
                                </div>
                            )}

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-sm">🔍</span>
                                <input type="text" value={scriptureSearch} onChange={e=>setScriptureSearch(e.target.value)} placeholder="Search references…"
                                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${darkMode?"bg-gray-700/60 border-white/10":"bg-white border-gray-300"}`}/>
                                {scriptureSearch&&<button onClick={()=>setScriptureSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"><X size={14}/></button>}
                            </div>

                            <div className="space-y-3">
                                {scriptureLoading&&(
                                    <div className="flex flex-col items-center py-16 opacity-60">
                                        <Loader2 size={36} className="animate-spin text-blue-400 mb-3"/>
                                        <p className="text-sm">Loading scriptures from database…</p>
                                    </div>
                                )}
                                {!scriptureLoading&&Object.keys(scriptureDB).filter(r=>r.toLowerCase().includes(scriptureSearch.toLowerCase())).map(ref=>{
                                    const isEditing=editingRef===ref;
                                    const isConfirmDel=deleteConfirmRef===ref;
                                    return (
                                        <div key={ref} className={`${darkMode?"bg-gray-700/60 border-white/10":"bg-white border-gray-200"} border rounded-2xl overflow-hidden`}>
                                            <div className={`flex items-center justify-between px-4 py-3 ${isEditing?darkMode?"bg-yellow-500/10":"bg-yellow-50":""}`}>
                                                <div>
                                                    <p className="font-bold text-base">{ref}</p>
                                                    <p className="text-xs opacity-40 mt-0.5">{Object.values(scriptureDB[ref]).filter(v=>v).length}/7 translations</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={()=>showBibleVerse(ref)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 text-xs font-semibold flex items-center gap-1 transition"><BookOpen size={12}/> View</button>
                                                    {isAdmin&&!isEditing&&(<>
                                                        <button onClick={()=>startEditScripture(ref)} className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 text-xs font-semibold flex items-center gap-1 transition"><Edit2 size={12}/> Edit</button>
                                                        {isConfirmDel
                                                            ?<div className="flex items-center gap-1">
                                                                <span className="text-xs text-red-400 font-semibold">Delete?</span>
                                                                <button onClick={()=>void deleteScripture(ref)} disabled={scriptureSyncing} className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition">Yes</button>
                                                                <button onClick={()=>setDeleteConfirmRef(null)} className="px-2 py-1 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold transition">No</button>
                                                             </div>
                                                            :<button onClick={()=>setDeleteConfirmRef(ref)} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs font-semibold flex items-center gap-1 transition"><X size={12}/> Del</button>
                                                        }
                                                    </>)}
                                                    {isAdmin&&isEditing&&<button onClick={cancelEditScripture} className="px-3 py-1.5 rounded-lg bg-gray-500/30 hover:bg-gray-500/50 text-gray-300 text-xs font-semibold flex items-center gap-1 transition"><X size={12}/> Cancel</button>}
                                                </div>
                                            </div>
                                            {isAdmin&&isEditing&&(
                                                <div className={`px-4 pb-5 pt-2 space-y-4 border-t ${darkMode?"border-white/10 bg-gray-800/60":"border-gray-100 bg-yellow-50/50"}`}>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Reference (rename)</label>
                                                        <input type="text" value={editingRefNew} onChange={e=>setEditingRefNew(e.target.value)} className={`w-full px-4 py-2 rounded-xl border font-semibold text-sm ${darkMode?"bg-gray-700 border-gray-600":"bg-white border-gray-300"}`}/>
                                                    </div>
                                                    {(["KJV","NKJV","NIV","ESV","AMP","NLT","MSG"] as const).map(v=>(
                                                        <div key={v}>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="text-xs font-bold uppercase tracking-widest opacity-60">{v}</label>
                                                                {editingVersions[v]&&<span className="text-[10px] opacity-40">{editingVersions[v].length} chars</span>}
                                                            </div>
                                                            <textarea value={editingVersions[v]} onChange={e=>updateEditVersion(v,e.target.value)} placeholder={`Enter ${v} translation…`} rows={3}
                                                                className={`w-full px-4 py-2 rounded-xl border text-sm leading-relaxed ${darkMode?"bg-gray-700 border-gray-600":"bg-white border-gray-300"} ${!editingVersions[v]?"border-dashed opacity-60":""}`}/>
                                                        </div>
                                                    ))}
                                                    <div className="flex gap-3 pt-1">
                                                        <button onClick={()=>void saveEditScripture()} disabled={scriptureSyncing} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50">
                                                            {scriptureSyncing?<><Loader2 size={15} className="animate-spin"/>Saving…</>:<><Save size={15}/>Save to Database</>}
                                                        </button>
                                                        <button onClick={cancelEditScripture} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition"><X size={14}/> Cancel</button>
                                                    </div>
                                                </div>
                                            )}
                                            {!isEditing&&(
                                                <div className={`px-4 pb-3 border-t ${darkMode?"border-white/5":"border-gray-100"}`}>
                                                    <p className="text-xs opacity-50 mt-2 leading-relaxed line-clamp-2">
                                                        <span className="font-bold opacity-70">KJV: </span>
                                                        {scriptureDB[ref]["KJV"]||<em>Not set</em>}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {!scriptureLoading&&Object.keys(scriptureDB).filter(r=>r.toLowerCase().includes(scriptureSearch.toLowerCase())).length===0&&(
                                    <div className="text-center py-12 opacity-40">
                                        <BookOpen size={40} className="mx-auto mb-3"/>
                                        <p>{scriptureSearch?`No scriptures match "${scriptureSearch}"`:"No scriptures yet. Use 'Add New Scripture' above."}</p>
                                    </div>
                                )}
                            </div>
                            {!isAdmin&&<div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${darkMode?"bg-gray-700/40":"bg-gray-100"} text-sm opacity-60`}><Lock size={14}/> Only admins can add, edit or delete scriptures.</div>}
                        </div>
                    )}

                    {/* ── ADMIN PANEL ── */}
                    {activeTab==="admin"&&isAdmin&&<AdminPanel darkMode={darkMode} currentUserId={authUser?.id||""}/>}
                    {activeTab==="admin"&&!isAdmin&&(
                        <div className="text-center py-16">
                            <ShieldCheck size={64} className="mx-auto mb-4 text-purple-400 opacity-30"/>
                            <h3 className="text-xl font-bold opacity-50">Admin access only</h3>
                        </div>
                    )}

                </div>
                )}
            </div>

            {/* Bible verse modal */}
            {showVerseModal&&selectedVerse&&(
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={()=>setShowVerseModal(false)}>
                    <div className={`${darkMode?"bg-gray-800":"bg-white"} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden`} onClick={e=>e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-2xl font-bold">{selectedVerse}</h3>
                            <button onClick={()=>setShowVerseModal(false)} className="opacity-50 hover:opacity-80"><X size={24}/></button>
                        </div>
                        <div className="flex gap-2 p-4 border-b border-white/10 overflow-x-auto">
                            {(["KJV","NKJV","NIV","ESV","AMP","NLT","MSG"] as const).map(v=>(
                                <button key={v} onClick={()=>changeBibleVersion(v)} disabled={verseLoading}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition ${bibleVersion===v?"bg-blue-600 text-white":darkMode?"bg-gray-700 hover:bg-gray-600":"bg-gray-100 hover:bg-gray-200"} disabled:opacity-40`}>{v}
                                </button>
                            ))}
                        </div>
                        <div className="p-6 overflow-y-auto" style={{maxHeight:"calc(85vh - 180px)"}}>
                            {verseLoading
                                ?<div className="flex flex-col items-center py-12"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"/><p className="opacity-50 animate-pulse">Loading…</p></div>
                                :scriptureDB[selectedVerse]?.[bibleVersion]
                                    ?<p className="text-lg leading-relaxed">{formatVerse(scriptureDB[selectedVerse][bibleVersion])}</p>
                                    :<p className="opacity-40 italic">Translation not available. Ask admin to add it in the Manage tab.</p>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SundaySchoolApp;
