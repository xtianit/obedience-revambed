import logo from "./assets/logo.png";
    import Header from "./components/Header";
    import { AdminPanel } from "./components/AdminPanel";
    import { useState, useEffect, useCallback, useRef, useMemo } from "react";
    import {
        BookOpen, CheckCircle, Edit2, Save, X,
        Plus, Loader2, ShieldCheck, LogOut,
        CreditCard, Chrome, RefreshCw, Mail, Eye, EyeOff,
        KeyRound, UserPlus, ArrowLeft, AtSign, Lock,
        FileText, ChevronDown, 
        ChevronUp,
        Trash2, Database, Upload, 
        AlertTriangle,
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
        lessonContentScriptures: string[];
        lessonReadingScriptures: string[];
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
        lessonReadingScriptures: ["Matthew 13:24-30"],
        lessonIntroScriptures: ["Colossians 1:17","2 Cor. 10:5"],
        lessonContentScriptures: ["Gen. 12:1-5"],
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

    // ─── CACHE HELPERS ────────────────────────────────────────────────────────────
    const CACHE_KEY = "ssa_sub_cache";
    const writeSubCache = (uid:string, end:string) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify({uid,end})); } catch { return null; } };
    const readSubCache  = (uid:string): boolean => {
        try { const r = localStorage.getItem(CACHE_KEY); if (!r) return false; const d=JSON.parse(r); return d.uid===uid && new Date(d.end)>new Date(); } catch { return false; }
    };
    const clearSubCache = () => { try { localStorage.removeItem(CACHE_KEY); } catch { return null; } };

    // ─── RETRY HELPER ─────────────────────────────────────────────────────────────
    async function withRetry<T>(fn:()=>Promise<T|null>, tries=3, ms=600): Promise<T|null> {
        for (let i=0; i<tries; i++) {
            try { const r=await fn(); if(r!==null) return r; } catch(e) { console.warn("retry",i+1,e); }
            if (i<tries-1) await new Promise(r=>setTimeout(r,ms*(i+1)));
        }
        return null;
    }

    //==============================================================================
    // Scriptures arena
    //==============================================================================

    const IMPORT_VERSIONS = ["KJV","NKJV","NIV","ESV","AMP","NLT","MSG"] as const;
    const EMPTY_V = (): BibleVersions => ({KJV:"",NKJV:"",NIV:"",ESV:"",AMP:"",NLT:"",MSG:""});

    type ImportRow = {
        reference: string;
        versions:  BibleVersions;
        status:    "pending"|"saving"|"saved"|"error";
        error?:    string;
    };

    function parseScriptureInput(raw: string): ImportRow[] {
        if (!raw.trim()) return [];
        try {
            let cleaned = raw.trim();
            cleaned = cleaned.replace(/^export\s+default\s+/m, "");
            cleaned = cleaned.replace(/^const\s+\w+\s*=\s*/m, "");
            cleaned = cleaned.replace(/;$/, "");
            const obj = JSON.parse(cleaned) as Record<string, Partial<BibleVersions>>;
            return Object.entries(obj).map(([reference, versions]) => ({
                reference: reference.trim(),
                versions: {
                    KJV: versions.KJV ?? "",
                    NKJV: versions.NKJV ?? "",
                    NIV: versions.NIV ?? "",
                    ESV: versions.ESV ?? "",
                    AMP: versions.AMP ?? "",
                    NLT: versions.NLT ?? "",
                    MSG: versions.MSG ?? "",
                },
                status: "pending",
            }));
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : "Invalid JSON.");
        }
    }

    async function saveScriptureRow(s: ImportRow): Promise<string | null> {
        try {
            const cleanReference = s.reference.trim();
            if (!cleanReference) return "Reference is required.";
            const hasTranslation = Object.values(s.versions).some(v => v.trim() !== "");
            if (!hasTranslation) return "At least one translation is required.";
            const payload = {
                reference: cleanReference,
                kjv: s.versions.KJV?.trim() || "",
                nkjv: s.versions.NKJV?.trim() || "",
                niv: s.versions.NIV?.trim() || "",
                esv: s.versions.ESV?.trim() || "",
                amp: s.versions.AMP?.trim() || "",
                nlt: s.versions.NLT?.trim() || "",
                msg: s.versions.MSG?.trim() || "",
            };
            const request = supabase.from("scriptures").upsert(payload, { onConflict: "reference" });
            const result = await Promise.race([
                request,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Database request timeout.")), 15000)
                )
            ]);
            if (result.error) return result.error.message;
            return null;
        } catch (e) {
            console.error("saveScriptureRow crash:", e);
            return e instanceof Error ? e.message : "Unknown database error.";
        }
    }

    interface ScriptureImporterProps { darkMode:boolean; onDone?:()=>void; }

    const ScriptureImporter = ({darkMode,onDone}:ScriptureImporterProps) => {
        const [tab,        setTab]        = useState<"json"|"single"|"multi">("json");
        const [jsonInput,  setJsonInput]  = useState("");
        const [rows,       setRows]       = useState<ImportRow[]>([]);
        const [parseErr,   setParseErr]   = useState("");
        const [importing,  setImporting]  = useState(false);
        const [expandIdx,  setExpandIdx]  = useState<number|null>(null);
        const [showEx,     setShowEx]     = useState(false);
        const [singleRef,  setSingleRef]  = useState("");
        const [singleV,    setSingleV]    = useState<BibleVersions>(EMPTY_V());
        const [singleBusy, setSingleBusy] = useState(false);
        const [singleMsg,  setSingleMsg]  = useState<{t:string;ok:boolean}|null>(null);
        const [openV,      setOpenV]      = useState<Record<string,boolean>>({});
        const [multiRows,  setMultiRows]  = useState<ImportRow[]>([{reference:"",versions:EMPTY_V(),status:"pending"}]);
        const [multiBusy,  setMultiBusy]  = useState(false);
        const [multiMsg,   setMultiMsg]   = useState<{t:string;ok:boolean}|null>(null);
        const opRef   = useRef(false);
        const fileRef = useRef<HTMLInputElement>(null);

        const c   = darkMode ? "bg-gray-800/70 border-white/10 text-white" : "bg-white border-gray-200 text-gray-800";
        const ic  = darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-800 placeholder-gray-400";
        const ta  = `w-full px-3 py-2 rounded-xl border text-sm font-mono outline-none focus:ring-2 focus:ring-purple-500 resize-y ${ic}`;
        const inp = `w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-purple-400 ${ic}`;

        const flash = (set:React.Dispatch<React.SetStateAction<{t:string;ok:boolean}|null>>,t:string,ok:boolean) => {
            set({t,ok}); setTimeout(()=>set(null),3000);
        };

        const handleParse = () => {
            setParseErr(""); setRows([]);
            try {
                const r = parseScriptureInput(jsonInput);
                if (!r.length){ setParseErr("No scriptures found."); return; }
                setRows(r);
            } catch(e){ setParseErr((e as Error).message); }
        };

        const runImport = async (list: ImportRow[]) => {
            if (opRef.current) return;
            opRef.current = true;
            setImporting(true);
            for (const item of list) {
                if (item.status === "saved") continue;
                setRows(prev => prev.map(r => r.reference === item.reference ? { ...r, status: "saving" } : r));
                const err = await saveScriptureRow(item);
                setRows(prev => prev.map(r =>
                    r.reference === item.reference
                        ? { ...r, status: err ? "error" : "saved", error: err || undefined }
                        : r
                ));
            }
            setImporting(false);
            opRef.current = false;
            setRows(current => {
                if (current.every(r => r.status === "saved") && onDone) onDone();
                return current;
            });
        };

        const savedC   = rows.filter(r=>r.status==="saved").length;
        const errorC   = rows.filter(r=>r.status==="error").length;
        const pendingC = rows.filter(r=>r.status==="pending"||r.status==="saving").length;

        const handleSingleSave = async () => {
            if (opRef.current) return;
            if (!singleRef.trim()){ flash(setSingleMsg,"Enter a reference.",false); return; }
            if (!Object.values(singleV).some(v=>v.trim())){ flash(setSingleMsg,"Fill at least one translation.",false); return; }
            opRef.current=true; setSingleBusy(true);
            const err=await saveScriptureRow({reference:singleRef.trim(),versions:singleV,status:"pending"});
            setSingleBusy(false); opRef.current=false;
            if(err) flash(setSingleMsg,"❌ "+err,false);
            else { flash(setSingleMsg,`✅ Saved "${singleRef.trim()}"!`,true); setSingleRef(""); setSingleV(EMPTY_V()); if(onDone) onDone(); }
        };

        const handleMultiSave = async () => {
            if (opRef.current) return;
            const valid = multiRows.filter(r => r.reference.trim() && Object.values(r.versions).some(v => v.trim()));
            if (!valid.length) { flash(setMultiMsg, "No valid rows to save.", false); return; }
            opRef.current = true;
            setMultiBusy(true);
            let savedCount = 0;
            let failCount = 0;
            for (const row of multiRows) {
                if (!row.reference.trim() || row.status === "saved") continue;
                setMultiRows(prev => prev.map(r => r === row ? { ...r, status: "saving" } : r));
                const error = await saveScriptureRow(row);
                if (error) {
                    failCount++;
                    setMultiRows(prev => prev.map(r => r === row ? { ...r, status: "error", error } : r));
                } else {
                    savedCount++;
                    setMultiRows(prev => prev.map(r => r === row ? { ...r, status: "saved" } : r));
                }
            }
            setMultiBusy(false);
            opRef.current = false;
            if (failCount === 0) {
                flash(setMultiMsg, `✅ Successfully saved ${savedCount} scriptures!`, true);
                setTimeout(() => { setMultiRows([{ reference: "", versions: EMPTY_V(), status: "pending" }]); }, 1500);
                if (onDone) onDone();
            } else {
                flash(setMultiMsg, `⚠️ Saved ${savedCount}, but ${failCount} failed.`, false);
            }
        };

        const EXAMPLE = `{\n  "John 3:16": {\n    "KJV": "For God so loved...",\n    "NIV": "For God so loved..."\n  }\n}`;
        const rowColor = (s:string) => s==="saved"?"border-green-500/30 bg-green-500/5":s==="error"?"border-red-500/30 bg-red-500/5":s==="saving"?"border-blue-500/30 bg-blue-500/5":darkMode?"border-white/10 bg-gray-700/40":"border-gray-200 bg-white";

        const TabBtn = ({id,label,desc}:{id:"json"|"single"|"multi";label:string;desc:string}) => (
            <button onClick={()=>setTab(id)} className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition ${tab===id?"bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow":"opacity-50 hover:opacity-80"}`}>
                <span className="block">{label}</span><span className="font-normal opacity-60 hidden sm:block text-[10px]">{desc}</span>
            </button>
        );
        const Msg = ({m}:{m:{t:string;ok:boolean}|null}) => m?(
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm ${m.ok?"bg-green-500/20 border border-green-500/40 text-green-400":"bg-red-500/20 border border-red-500/40 text-red-400"}`}>
                {m.ok?<CheckCircle size={14}/>:<AlertTriangle size={14}/>}{m.t}
            </div>
        ):null;

        return (
            <div className="space-y-4">
                <div><h3 className="text-xl font-bold flex items-center gap-2"><Database size={19} className="text-blue-400"/>Scripture Importer</h3><p className="text-xs opacity-40 mt-0.5">Load scriptures directly into the database</p></div>

                {/* Tabs */}
                <div className={`flex rounded-2xl p-1 gap-1 border ${darkMode?"border-white/10 bg-gray-800/40":"border-gray-200 bg-gray-50"}`}>
                    <TabBtn id="json"   label="📋 JSON / TS" desc="Paste multiple at once"/>
                    <TabBtn id="single" label="✏️ Single"    desc="One scripture"/>
                    <TabBtn id="multi"  label="📝 Multi-Row" desc="Fill rows"/>
                </div>

                {/* JSON TAB */}
                {tab==="json"&&(<div className="space-y-4">
                    <div className={`rounded-xl border p-3 text-xs ${darkMode?"bg-blue-900/20 border-blue-500/30 text-blue-200":"bg-blue-50 border-blue-200 text-blue-800"}`}>
                        <p className="font-semibold mb-1">Paste JSON or TypeScript object → Parse → Import</p>
                        <button onClick={()=>setShowEx(p=>!p)} className="text-blue-400 hover:underline">{showEx?"Hide":"Show"} example</button>
                        {showEx&&(
                            <div className="relative mt-2">
                                <pre className={`text-xs p-2 rounded overflow-x-auto ${darkMode?"bg-gray-900":"bg-white border"}`}>{EXAMPLE}</pre>
                                <button onClick={()=>{setJsonInput(EXAMPLE);setRows([]);setParseErr("");}} className="absolute top-1 right-1 px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold">Use</button>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-xs opacity-40 font-bold uppercase tracking-widest">Paste here</span>
                            <div className="flex gap-2">
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".json,.ts,.txt,.js"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            const text = ev.target?.result;
                                            if (typeof text !== "string") { setParseErr("Failed to read file."); return; }
                                            setJsonInput(text); setRows([]); setParseErr("");
                                        };
                                        reader.onerror = () => setParseErr("Failed to load file.");
                                        reader.readAsText(file);
                                    }}
                                />
                                <button onClick={()=>fileRef.current?.click()} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 text-xs font-semibold"><Upload size={11}/> File</button>
                                {jsonInput&&<button onClick={()=>{setJsonInput("");setRows([]);setParseErr("");}} className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs"><X size={11}/></button>}
                            </div>
                        </div>
                        <textarea value={jsonInput} onChange={(e) => { setJsonInput(e.target.value); setRows([]); setParseErr(""); }}
                            placeholder={`{\n  "John 3:16": {\n    "KJV": "For God so loved..."\n  }\n}`}
                            rows={9} className={ta}/>
                        {parseErr&&<div className="flex items-start gap-2 mt-2 px-3 py-2 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs"><AlertTriangle size={13} className="flex-shrink-0 mt-0.5"/>{parseErr}</div>}
                    </div>
                    {!rows.length&&<button onClick={handleParse} disabled={!jsonInput.trim()} className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center gap-2 disabled:opacity-40 transition"><FileText size={15}/> Parse Scriptures</button>}
                    {rows.length>0&&(<div className="space-y-3">
                        <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl ${darkMode?"bg-gray-700/60":"bg-gray-50 border"}`}>
                            <div className="flex gap-3 text-sm flex-wrap font-semibold">
                                <span>{rows.length} parsed</span>
                                {savedC>0&&<span className="text-green-400">✓{savedC} saved</span>}
                                {errorC>0&&<span className="text-red-400">✗{errorC} failed</span>}
                                {pendingC>0&&<span className="opacity-40">{pendingC} pending</span>}
                            </div>
                            <div className="flex gap-2">
                                {errorC>0&&<button onClick={()=>runImport(rows.filter(r=>r.status==="error"))} disabled={importing} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 border border-orange-500/30 disabled:opacity-40 flex items-center gap-1"><RefreshCw size={12} className={importing?"animate-spin":""}/> Retry</button>}
                                {pendingC>0&&<button onClick={()=>runImport(rows)} disabled={importing} className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 flex items-center gap-1 disabled:opacity-40">{importing?<><Loader2 size={12} className="animate-spin"/>Importing…</>:<><Database size={12}/>Import All</>}</button>}
                                {savedC===rows.length&&<span className="px-3 py-1.5 rounded-xl text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/30 flex items-center gap-1"><CheckCircle size={12}/> All done!</span>}
                            </div>
                        </div>
                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                            {rows.map((s,i)=>(
                                <div key={i} className={`rounded-xl border overflow-hidden ${rowColor(s.status)}`}>
                                    <button onClick={()=>setExpandIdx(expandIdx===i?null:i)} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
                                        <div className="flex items-center gap-2">
                                            {s.status==="saved"&&<CheckCircle size={13} className="text-green-400"/>}
                                            {s.status==="error"&&<AlertTriangle size={13} className="text-red-400"/>}
                                            {s.status==="saving"&&<Loader2 size={13} className="text-blue-400 animate-spin"/>}
                                            {s.status==="pending"&&<div className="w-3 h-3 rounded-full border-2 border-gray-400"/>}
                                            <div>
                                                <p className="font-semibold text-sm">{s.reference}</p>
                                                {s.status==="error"&&<p className="text-xs text-red-400">{s.error}</p>}
                                                {s.status==="pending"&&<p className="text-xs opacity-40">{Object.values(s.versions).filter(v=>v).length}/7 translations</p>}
                                            </div>
                                        </div>
                                        {expandIdx===i?<ChevronUp size={13} className="opacity-40"/>:<ChevronDown size={13} className="opacity-40"/>}
                                    </button>
                                    {expandIdx===i&&(<div className={`px-3 pb-3 border-t ${darkMode?"border-white/10":"border-gray-100"}`}>
                                        <div className="mt-2 space-y-1">
                                            {IMPORT_VERSIONS.map(v=>s.versions[v]?(<div key={v} className="text-xs"><span className="font-bold opacity-40 mr-1">{v}:</span><span className="opacity-60">{s.versions[v].slice(0,90)}{s.versions[v].length>90?"…":""}</span></div>):null)}
                                        </div>
                                    </div>)}
                                </div>
                            ))}
                        </div>
                    </div>)}
                </div>)}

                {/* SINGLE TAB */}
                {tab==="single"&&(<div className="space-y-4">
                    <Msg m={singleMsg}/>
                    <div><label className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Reference *</label><input type="text" value={singleRef} onChange={e=>setSingleRef(e.target.value)} placeholder="e.g., John 3:16" className={inp}/></div>
                    <div className="flex gap-3 text-xs mb-1">
                        <button onClick={()=>setOpenV(Object.fromEntries(IMPORT_VERSIONS.map(v=>[v,true])))} className="opacity-50 hover:opacity-80">Expand all</button>
                        <button onClick={()=>setOpenV({})} className="opacity-50 hover:opacity-80">Collapse all</button>
                    </div>
                    {IMPORT_VERSIONS.map(v=>(
                        <div key={v} className={`rounded-xl border overflow-hidden ${darkMode?"border-white/10":"border-gray-200"}`}>
                            <button onClick={()=>setOpenV(p=>({...p,[v]:!p[v]}))} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition ${darkMode?"hover:bg-white/5":"hover:bg-gray-50"}`}>
                                <span className="flex items-center gap-2">{v}{singleV[v]&&<span className="text-[10px] text-green-400 font-normal">{singleV[v].length}c ✓</span>}</span>
                                {openV[v]?<ChevronUp size={12} className="opacity-40"/>:<ChevronDown size={12} className="opacity-40"/>}
                            </button>
                            {openV[v]&&<div className={`px-4 pb-3 border-t ${darkMode?"border-white/10":"border-gray-100"}`}><textarea value={singleV[v]} onChange={e=>setSingleV(p=>({...p,[v]:e.target.value}))} placeholder={`${v} text…`} rows={3} className={`${ta} mt-2`}/></div>}
                        </div>
                    ))}
                    <button onClick={handleSingleSave} disabled={singleBusy} className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 transition">
                        {singleBusy?<><Loader2 size={16} className="animate-spin"/>Saving…</>:<><Database size={16}/>Save to Database</>}
                    </button>
                </div>)}

                {/* MULTI TAB */}
                {tab==="multi"&&(<div className="space-y-4">
                    <Msg m={multiMsg}/>
                    <p className="text-xs opacity-40">Fill rows then save all at once. Only rows with a reference are saved.</p>
                    {multiRows.map((row,i)=>(
                        <div key={i} className={`${c} border rounded-2xl p-4 space-y-3`}>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black opacity-30 w-4">{i+1}</span>
                                <input type="text" value={row.reference} onChange={e=>setMultiRows(p=>p.map((r,idx)=>idx===i?{...r,reference:e.target.value}:r))} placeholder="Reference" className={`flex-1 ${inp} font-semibold`}/>
                                {multiRows.length>1&&<button onClick={()=>setMultiRows(p=>p.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13}/></button>}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2 ml-6">
                                {IMPORT_VERSIONS.map(v=>(
                                    <div key={v}>
                                        <label className="block text-[10px] font-bold uppercase opacity-30 mb-1">{v}</label>
                                        <textarea value={row.versions[v]} onChange={e=>setMultiRows(p=>p.map((r,idx)=>idx===i?{...r,versions:{...r.versions,[v]:e.target.value}}:r))} placeholder={`${v}…`} rows={2} className={`${ta} text-xs`}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={()=>setMultiRows(p=>[...p,{reference:"",versions:EMPTY_V(),status:"pending"}])} className={`w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 border-2 border-dashed transition ${darkMode?"border-white/20 hover:border-white/40 text-white/40 hover:text-white":"border-gray-300 hover:border-gray-400 text-gray-400"}`}>
                        <Plus size={13}/> Add Row
                    </button>
                    <button onClick={handleMultiSave} disabled={multiBusy} className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 transition">
                        {multiBusy?<><Loader2 size={16} className="animate-spin"/>Saving…</>:<><Database size={16}/>Save {multiRows.filter(r=>r.reference.trim()).length} to Database</>}
                    </button>
                </div>)}
            </div>
        );
    };


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
        const [lessonsLoading,   setLessonsLoading]   = useState(true);
        const lessonsLoadingRef = useRef(false);
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
        const [showImporter,     setShowImporter]     = useState(false);

        // ── Speed: memoize expensive derived values ───────────────────────────────
        const filteredScriptureKeys = useMemo(() => {
            const q = scriptureSearch.toLowerCase();
            return Object.keys(scriptureDB).filter(r => r.toLowerCase().includes(q)).sort();
        }, [scriptureDB, scriptureSearch]);

        const subDaysLeft = useMemo(() =>
            subscription
                ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86_400_000))
                : 0,
        [subscription]);

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

        // ── Refs ──────────────────────────────────────────────────────────────────
        const resolvingRef    = useRef(false);
        const loadingPctRef   = useRef(0);
        const scriptureSeeded = useRef(false);
        const scriptureOpRef  = useRef(false);
        const lessonSaveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

        // Keep a stable ref to activeLessonId so the visibility handler can read it
        // without being re-created on every render
        const activeLessonIdRef = useRef<string|null>(null);
        useEffect(() => { activeLessonIdRef.current = activeLessonId; }, [activeLessonId]);

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
        const loadLessons = useCallback(async () => {
        if (lessonsLoadingRef.current) return;
        lessonsLoadingRef.current = true;
        setLessonsLoading(true);

        try {
            const { data, error } = await supabase
                .from("lessons")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            const rows = (data ?? []) as LessonRow[];
            
            if (rows.length > 0) {
                const liveLesson = rows.find(l => l.is_active) ?? rows[0];

                if (profile?.role === "admin") {
                    // Admins see all rows from the database (Obedience, Disobedience, etc.)
                    setLessons(rows);
                    const currentActive = rows.find(l => l.id === activeLessonIdRef.current) ?? liveLesson;
                    setActiveLessonId(currentActive.id);
                    setContentData(hydrateLessonData(currentActive.content));
                } else {
                    // Standard users view only the active lesson
                    setLessons([liveLesson]);
                    setActiveLessonId(liveLesson.id);
                    setContentData(hydrateLessonData(liveLesson.content));
                }
            } else {
                setLessons([]);
                setActiveLessonId(null);
                setContentData(makeDefaultContent());
            }
        } catch (err) {
            console.error("loadLessons handling failure:", err);
        } finally {
            setLessonsLoading(false);
            lessonsLoadingRef.current = false;
        }
        // 🧠 Leave profile?.role as the only metric here
    }, [profile?.role]);

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

        // const createNewLesson = async () => {
        //     if (!newLessonTitle.trim()) { alert("Please enter a lesson title."); return; }
        //     setCreatingLesson(true);
        //     const newContent = makeDefaultContent(newLessonTitle.trim(), newLessonDate.trim() || new Date().toLocaleDateString());
        //     const { data, error } = await supabase
        //         .from("lessons")
        //         .insert({ title:newLessonTitle.trim(), is_active:true, content:newContent })
        //         .select().single();
        //     if (error) { alert("Failed to create lesson: "+error.message); setCreatingLesson(false); return; }
        //     const row = data as LessonRow;
        //     setLessons(prev => [row, ...prev]);
        //     setCreatingLesson(false);
        //     setShowNewLesson(false);
        //     setNewLessonTitle(""); setNewLessonDate("");
        //     await switchLesson(row);
        // };

        
        const createNewLesson = async () => {
        if (!newLessonTitle.trim()) { alert("Please enter a lesson title."); return; }
        setCreatingLesson(true);
        
        const newContent = makeDefaultContent(
            newLessonTitle.trim(), 
            newLessonDate.trim() || new Date().toLocaleDateString()
        );

        try {
            const { data, error } = await supabase
                .from("lessons")
                .insert({ 
                    title: newLessonTitle.trim(), 
                    is_active: false, // Saves as background draft option
                    content: newContent 
                })
                .select()
                .single();

            if (error) throw error;

            const row = data as LessonRow;

            // Update states directly without introducing async execution delays
            setLessons(prev => [row, ...prev]);
            setActiveLessonId(row.id);
            setContentData(hydrateLessonData(row.content));

            setShowNewLesson(false);
            setNewLessonTitle(""); 
            setNewLessonDate("");
            
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            alert("Failed to build new lesson: " + msg);
        } finally {
            setCreatingLesson(false);
        }
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
        //  SCRIPTURE HELPERS
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
                scriptureSeeded.current = true;
            }
            setScriptureLoading(false);
        }, [rowToEntry]);

        // ── Scripture operation helpers ───────────────────────────────────────────
        const acquireScriptureOp = (): boolean => {
            if (scriptureOpRef.current) return false;
            scriptureOpRef.current = true;
            setScriptureSyncing(true);
            return true;
        };
        const releaseScriptureOp = () => {
            scriptureOpRef.current = false;
            setScriptureSyncing(false);
        };

        const versionsToRow = (ref: string, v: BibleVersions) => ({
            reference: ref,
            kjv: v.KJV, nkjv: v.NKJV, niv: v.NIV,
            esv: v.ESV, amp:  v.AMP,  nlt: v.NLT, msg: v.MSG,
        });

        const addNewScripture = async () => {
            const ref = newVerse.reference.trim();
            if (!ref || !Object.values(newVerse.versions).some(v => v)) return;
            if (!acquireScriptureOp()) return;
            try {
                const { error } = await supabase
                    .from("scriptures")
                    .upsert(versionsToRow(ref, newVerse.versions), { onConflict: "reference" });
                if (error) { alert("Failed to save: " + error.message); return; }
                setScriptureDB(p => ({ ...p, [ref]: newVerse.versions }));
                setScriptureSaved(ref);
                setTimeout(() => setScriptureSaved(null), 2500);
                setNewVerse({ reference:"", versions:{KJV:"",NKJV:"",NIV:"",ESV:"",AMP:"",NLT:"",MSG:""} });
                setEditMode(false);
            } finally {
                releaseScriptureOp();
            }
        };

        const startEditScripture = (ref: string) => {
            if (scriptureOpRef.current) return;
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
        const updateEditVersion = (v: keyof BibleVersions, text: string) =>
            setEditingVersions(p => ({ ...p, [v]: text }));

        const saveEditScripture = async () => {
            if (!editingRef) return;
            if (!acquireScriptureOp()) return;
            const target = editingRefNew.trim() || editingRef;
            try {
                if (target !== editingRef) {
                    const { error: delErr } = await supabase
                        .from("scriptures").delete().eq("reference", editingRef);
                    if (delErr) { alert("Failed to rename: " + delErr.message); return; }
                }
                const { error } = await supabase
                    .from("scriptures")
                    .upsert(versionsToRow(target, editingVersions), { onConflict: "reference" });
                if (error) { alert("Failed to update: " + error.message); return; }
                setScriptureDB(prev => {
                    const u = { ...prev };
                    if (target !== editingRef) delete u[editingRef];
                    u[target] = { ...editingVersions };
                    return u;
                });
                setScriptureSaved(target);
                setTimeout(() => setScriptureSaved(null), 2500);
                cancelEditScripture();
            } finally {
                releaseScriptureOp();
            }
        };

        const deleteScripture = async (ref: string) => {
            if (!acquireScriptureOp()) return;
            try {
                const { error } = await supabase.from("scriptures").delete().eq("reference", ref);
                if (error) { alert("Failed to delete: " + error.message); return; }
                setScriptureDB(p => { const u = { ...p }; delete u[ref]; return u; });
                setDeleteConfirmRef(null);
                if (editingRef === ref) cancelEditScripture();
            } finally {
                releaseScriptureOp();
            }
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
        // Only run when the app screen becomes active
        if (screen !== "app") return;

        let isMounted = true;
        scriptureSeeded.current = false;

        // PROGRAMMATIC CLEAR: Forcefully unstick loading flags on mount
        lessonsLoadingRef.current = false;
        setLessonsLoading(false);

        const safeBootstrap = async () => {
            // Guard flag to prevent double-firing on slower mobile networks
            if (lessonsLoadingRef.current) return;
            
            try {
                // Fetch lessons and scriptures concurrently in a single flight
                await Promise.all([
                    loadLessons(),
                    loadScripturesFromDB()
                ]);
            } catch (err) {
                console.error("Programmatic bootstrap failed:", err);
            }
        };

        if (isMounted) {
            void safeBootstrap();
        }

        // ─── REALTIME SUBSCRIPTION ──────────────────────────────────────────────
        const channel = supabase
            .channel("lessons-realtime")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "lessons" },
                (payload) => {
                    if (!isMounted) return;
                    const updatedLesson = payload.new as LessonRow;
                    
                    if (profile?.role === "admin") {
                        // Admin: Keep the full database list completely intact
                        setLessons(prev => prev.map(l => l.id === updatedLesson.id ? updatedLesson : l));
                        if (updatedLesson.id === activeLessonIdRef.current) {
                            setContentData(hydrateLessonData(updatedLesson.content));
                        }
                    } else if (updatedLesson.is_active) {
                        // Regular User: Switch view to the new live lesson instantly
                        setActiveLessonId(updatedLesson.id);
                        setContentData(hydrateLessonData(updatedLesson.content));
                        setLessons([updatedLesson]);
                    }
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            void supabase.removeChannel(channel);
        };
        // 🧠 FIXED DEPENDENCY: Removing functions here permanently kills the infinite mobile spin
    }, [screen]);




        useEffect(() => {
            const h=(e:KeyboardEvent)=>{ if(e.ctrlKey&&e.shiftKey&&e.key==="E"&&isAdmin){e.preventDefault();setEditingContent(p=>p?null:activeTab);} };
            window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
        },[activeTab,isAdmin]);

        // ─────────────────────────────────────────────────────────────────────────
        //  EMAIL AUTH
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
        //  CONTENT UPDATERS — debounced auto-save to DB
        // ─────────────────────────────────────────────────────────────────────────
        const upd = (fn:(p:LessonContent)=>LessonContent) => {
            setContentData(prev => {
                const updated = fn(prev);
                if (activeLessonId) debouncedSaveLesson(updated, activeLessonId);
                return updated;
            });
        };

        const updateLessonPoint = <K extends keyof LessonPoint>(index: number, f: K, v: LessonPoint[K]) => {
            const newPoints = [...contentData.lessonPoints];
            newPoints[index][f] = v;
            upd(p => ({ ...p, lessonPoints: newPoints }));
        };

        const updateSubPoint = <K extends keyof SubPoint>(pIdx: number, sIdx: number, f: K, v: SubPoint[K]) => {
            const newPoints = [...contentData.lessonPoints];
            newPoints[pIdx].subPoints[sIdx][f] = v;
            upd(p => ({ ...p, lessonPoints: newPoints }));
        };

        const updateContent = <K extends keyof LessonContent>(f: K, v: LessonContent[K]) => {
            upd(p => ({ ...p, [f]: v }));
        };

        const addSubPoint    = (pi:number) => upd(p=>({...p,lessonPoints:p.lessonPoints.map((pt,i)=>i===pi?{...pt,subPoints:[...pt.subPoints,{title:"New Point",content:"",scriptures:[]}]}:pt)}));
        const deleteSubPoint = (pi:number,si:number) => upd(p=>({...p,lessonPoints:p.lessonPoints.map((pt,i)=>i===pi?{...pt,subPoints:pt.subPoints.filter((_,j)=>j!==si)}:pt)}));

        const hydrateLessonData = (data: Partial<LessonContent>): LessonContent => {
            const defaults = makeDefaultContent(data.lessonTitle, data.lessonDate);
            return {
                ...defaults,
                ...data,
                lessonReadingScriptures:   data.lessonReadingScriptures   || [],
                lessonIntroScriptures:     data.lessonIntroScriptures     || [],
                lessonContentScriptures:   data.lessonContentScriptures   || [],
                conclusionScriptures:      data.conclusionScriptures      || [],
                lessonPoints: (data.lessonPoints || defaults.lessonPoints).map((pt) => ({
                    ...pt,
                    scriptures: pt.scriptures || [],
                    subPoints: (pt.subPoints || []).map((sp) => ({
                        ...sp,
                        scriptures: sp.scriptures || []
                    }))
                }))
            };
        };

        const addScriptureRef = (
            path: "intro" | "lesson" | "conclusion" | "subpoint" | "reading",
            idx?: number,
            subIdx?: number
        ) => {
            if (path === "reading") {
                upd(p => ({ ...p, lessonReadingScriptures: [...(p.lessonReadingScriptures || []), ""] }));
            } else if (path === "intro") {
                upd(p => ({ ...p, lessonIntroScriptures: [...p.lessonIntroScriptures, ""] }));
            } else if (path === "lesson" && idx !== undefined) {
                upd(p => ({
                    ...p,
                    lessonPoints: p.lessonPoints.map((pt, i) =>
                        i === idx ? { ...pt, scriptures: [...pt.scriptures, ""] } : pt
                    )
                }));
            } else if (path === "conclusion") {
                upd(p => ({ ...p, conclusionScriptures: [...p.conclusionScriptures, ""] }));
            } else if (path === "subpoint" && idx !== undefined && subIdx !== undefined) {
                upd(p => ({
                    ...p,
                    lessonPoints: p.lessonPoints.map((pt, i) =>
                        i === idx ? {
                            ...pt,
                            subPoints: pt.subPoints.map((sp, j) =>
                                j === subIdx ? { ...sp, scriptures: [...(sp.scriptures || []), ""] } : sp
                            )
                        } : pt
                    )
                }));
            }
        };

        const updateScriptureRef = (
            path: "intro" | "reading" | "conclusion" | "lesson" | "subpoint",
            val: string,
            idx: number,
            subIdx?: number,
            scriptureIdx?: number
        ) => {
            upd(p => {
                if (path === "intro") {
                    return { ...p, lessonIntroScriptures: p.lessonIntroScriptures.map((s, i) => i === idx ? val : s) };
                }
                if (path === "reading") {
                    return { ...p, lessonReadingScriptures: p.lessonReadingScriptures.map((s, i) => i === idx ? val : s) };
                }
                if (path === "conclusion") {
                    return { ...p, conclusionScriptures: p.conclusionScriptures.map((s, i) => i === idx ? val : s) };
                }
                if (path === "lesson") {
                    return {
                        ...p,
                        lessonPoints: p.lessonPoints.map((pt, i) =>
                            i === idx ? { ...pt, scriptures: pt.scriptures.map((s, j) => j === (subIdx ?? 0) ? val : s) } : pt
                        )
                    };
                }
                if (path === "subpoint" && subIdx !== undefined && scriptureIdx !== undefined) {
                    return {
                        ...p,
                        lessonPoints: p.lessonPoints.map((pt, i) =>
                            i === idx ? {
                                ...pt,
                                subPoints: pt.subPoints.map((sp, j) =>
                                    j === subIdx ? {
                                        ...sp,
                                        scriptures: (sp.scriptures || []).map((s, k) => k === scriptureIdx ? val : s)
                                    } : sp
                                )
                            } : pt
                        )
                    };
                }
                return p;
            });
        };

        const removeScriptureRef = (
            path: "intro" | "reading" | "conclusion" | "lesson" | "subpoint",
            idx: number,
            subIdx?: number,
            scriptureIdx?: number
        ) => {
            upd(p => {
                if (path === "reading") {
                    return { ...p, lessonReadingScriptures: p.lessonReadingScriptures.filter((_, i) => i !== idx) };
                }
                if (path === "intro") {
                    return { ...p, lessonIntroScriptures: p.lessonIntroScriptures.filter((_, i) => i !== idx) };
                }
                if (path === "conclusion") {
                    return { ...p, conclusionScriptures: p.conclusionScriptures.filter((_, i) => i !== idx) };
                }
                if (path === "lesson") {
                    return {
                        ...p,
                        lessonPoints: p.lessonPoints.map((pt, i) =>
                            i === idx ? { ...pt, scriptures: pt.scriptures.filter((_, j) => j !== (subIdx ?? 0)) } : pt
                        )
                    };
                }
                if (path === "subpoint" && subIdx !== undefined && scriptureIdx !== undefined) {
                    return {
                        ...p,
                        lessonPoints: p.lessonPoints.map((pt, i) =>
                            i === idx ? {
                                ...pt,
                                subPoints: pt.subPoints.map((sp, j) =>
                                    j === subIdx ? {
                                        ...sp,
                                        scriptures: (sp.scriptures || []).filter((_, k) => k !== scriptureIdx)
                                    } : sp
                                )
                            } : pt
                        )
                    };
                }
                return p;
            });
        };

        // ─────────────────────────────────────────────────────────────────────────
        //  UI HELPERS
        // ─────────────────────────────────────────────────────────────────────────
        const showBibleVerse     = (ref:string)             => { setSelectedVerse(ref);setShowVerseModal(true);setVerseLoading(true);setTimeout(()=>setVerseLoading(false),700); };
        const changeBibleVersion = (v:keyof BibleVersions) => { setVerseLoading(true);setTimeout(()=>{setBibleVersion(v);setVerseLoading(false);},500); };
        const handleTabChange    = (tab:string)             => { setTabLoading(true);setTimeout(()=>{setActiveTab(tab);setTabLoading(false);},300); };
        const formatVerse        = (text:string)            => text.split(/(\d+)/).map((p,i)=>/^\d+$/.test(p)?<strong key={i}>{p}</strong>:<span key={i}>{p}</span>);

        const th     = darkMode?"bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white":"bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 text-gray-900";
        const cardBg = darkMode?"bg-white/10 backdrop-blur-xl border-white/20":"bg-white/80 border-gray-200";
        const inp    = (extra="") => `${extra} px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-purple-400 ${darkMode?"bg-white/10 border-white/20 text-white placeholder-white/40":"bg-white border-gray-300 text-gray-800 placeholder-gray-400"}`;

        const editBanner = (tab:string) => {
            if(!isAdmin) return null;
            if (editingContent === tab) return (
                <div className="sticky top-0 z-50 mx-2 shadow-lg bg-yellow-500/20 border border-yellow-400/40 rounded-xl p-3 mb-4 flex items-center justify-between backdrop-blur-md">
                    <span className="flex items-center gap-2 text-yellow-400 text-sm font-semibold">
                        <Edit2 size={14}/>
                        Editing — auto-saves to database
                        {lessonSaving && <Loader2 size={12} className="animate-spin"/>}
                    </span>
                    <button
                        onClick={() => setEditingContent(null)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-1.5 rounded-lg text-xs font-bold transition"
                    >
                        ✓ Done Editing
                    </button>
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
            const animText="Supernatural Victory and Progress Through Thanksgiving".split("");
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
                                    <p className="text-6xl font-black mb-1">₦1000</p>
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
                                        {payLoading?<><Loader2 size={20} className="animate-spin"/>Processing…</>:<><CreditCard size={20}/>Pay ₦1000 Paystack</>}
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
        //  MAIN APP
        // ═════════════════════════════════════════════════════════════════════════
        const tabs = [
            {id:"intro",label:"Intro"},{id:"lesson",label:"Lesson"},
            {id:"conclusion",label:"Conclusion"},
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
                            {!isAdmin && (
                                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold ${darkMode?"bg-white/5 border border-white/10":"bg-white/60 border border-gray-200"}`}>
                                    <FileText size={15} className="text-purple-400"/>
                                    <span className="max-w-[200px] truncate">{contentData.lessonTitle}</span>
                                </div>
                            )}
                            {isAdmin && (
                                <button onClick={()=>setShowLessonPicker(p=>!p)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition shadow-sm ${darkMode?"bg-white/10 hover:bg-white/20 border border-white/10":"bg-white/80 hover:bg-white border border-gray-200"}`}>
                                    <FileText size={15} className="text-purple-400"/>
                                    <span className="max-w-[200px] truncate">{contentData.lessonTitle}</span>
                                    <ChevronDown size={14} className={`transition-transform ${showLessonPicker?"rotate-180":""}`}/>
                                </button>
                            )}
                            {isAdmin&&showLessonPicker&&(
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
                                    <div className="p-2 border-t border-white/10">
                                        <button onClick={()=>{setShowLessonPicker(false);setShowNewLesson(true);}}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-green-400 hover:bg-green-500/10 transition">
                                            <Plus size={14}/> Add New Lesson
                                        </button>
                                    </div>
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

                    {tabLoading && (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"/>
                        </div>
                    )}

                    {!tabLoading && (
                        <div className={`${cardBg} border rounded-2xl shadow-2xl p-6 md:p-8`}>

                            {/* ── FIX: Ternary guard — spinner OR content, never both ── */}
                            {lessonsLoading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-purple-500"/>
                                    <p className="text-sm font-semibold opacity-50">Loading lesson…</p>
                                </div>
                            ) : (
                                <>
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
                                                {(editingContent==="intro"&&isAdmin) ? (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <input
                                                            type="text"
                                                            value={contentData.memoryVerseRef}
                                                            onChange={e=>updateContent("memoryVerseRef",e.target.value)}
                                                            placeholder="e.g., Phil. 2:8"
                                                            className={`px-3 py-1.5 rounded-lg border text-sm font-semibold w-36 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`}
                                                        />
                                                        <button onClick={()=>showBibleVerse(contentData.memoryVerseRef)} className="border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95">
                                                            <BookOpen size={13}/> Preview
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={()=>showBibleVerse(contentData.memoryVerseRef)} className="border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95">
                                                        <BookOpen size={15}/> Read {contentData.memoryVerseRef}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Lesson Reading */}
                                            <div className="my-8 border-t border-b py-6 border-gray-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                                                        <BookOpen size={20} className="text-blue-500" />
                                                        <span>Lesson Reading:</span>
                                                        {contentData?.lessonReadingScriptures
                                                            ?.filter(s => s?.trim())
                                                            .map((s, idx) => (
                                                                <span key={`title-ref-${idx}`} className="font-semibold">
                                                                    {s}{idx < (contentData.lessonReadingScriptures.filter(x => x.trim()).length - 1) ? ',' : ''}
                                                                </span>
                                                            ))
                                                        }
                                                    </h3>
                                                    {isAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingContent(editingContent === "reading" ? null : "reading")}
                                                            className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                                                                editingContent === "reading"
                                                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                            }`}
                                                        >
                                                            {editingContent === "reading" ? "Close Editor" : "Edit Reading"}
                                                        </button>
                                                    )}
                                                </div>
                                                {isAdmin && editingContent === "reading" ? (
                                                    <div className="space-y-2 p-4 rounded-xl border-2 border-dashed border-blue-500/30 bg-blue-500/5 animate-in fade-in slide-in-from-top-1">
                                                        <p className="text-[10px] font-black uppercase tracking-tighter opacity-60 mb-2">
                                                            Configure Reading Buttons
                                                        </p>
                                                        {(contentData.lessonReadingScriptures || []).map((s, ri) => (
                                                            <div key={`edit-ref-${ri}`} className="flex items-center gap-2 mb-2">
                                                                <input
                                                                    type="text"
                                                                    value={s}
                                                                    onChange={(e) => updateScriptureRef("reading", e.target.value, ri)}
                                                                    placeholder="e.g., Matthew 13:24-30"
                                                                    className={`px-3 py-2 rounded-lg border text-sm flex-1 outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                                        darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300"
                                                                    }`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeScriptureRef("reading", ri)}
                                                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => addScriptureRef("reading")}
                                                            className="flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-400 mt-2 p-1"
                                                        >
                                                            <Plus size={14} /> Add Reading Reference
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2 flex-wrap">
                                                        {contentData?.lessonReadingScriptures?.filter(s => s?.trim()).length > 0 ? (
                                                            contentData.lessonReadingScriptures.filter(s => s?.trim()).map((s, idx) => (
                                                                <button
                                                                    key={`read-btn-${idx}`}
                                                                    onClick={() => showBibleVerse(s)}
                                                                    className="border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95"
                                                                >
                                                                    <BookOpen size={16} />
                                                                    Read {s}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-gray-400 italic">No reading references set.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="text-2xl font-bold mb-3">Introduction</h3>
                                                {(editingContent==="intro"&&isAdmin)
                                                    ?(<>
                                                        <textarea value={contentData.introduction} onChange={e=>updateContent("introduction",e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`} rows={6}/>
                                                        <div className="mt-3">
                                                            <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Scripture Buttons</p>
                                                            {contentData.lessonIntroScriptures.map((s,ri)=>(
                                                                <div key={ri} className="flex items-center gap-2 mb-2">
                                                                    <input type="text" value={s}
                                                                        onChange={e=>updateScriptureRef("intro", e.target.value, ri)}
                                                                        placeholder="e.g., Colossians 1:17"
                                                                        className={`px-3 py-1.5 rounded-lg border text-sm flex-1 ${darkMode?"bg-gray-800 border-gray-600":"bg-white border-gray-300"}`}/>
                                                                    <button onClick={()=>showBibleVerse(s)} disabled={!s.trim()} className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 disabled:opacity-30"><BookOpen size={13}/></button>
                                                                    <button onClick={()=>removeScriptureRef("intro",ri)} className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400"><X size={13}/></button>
                                                                </div>
                                                            ))}
                                                            <button onClick={()=>addScriptureRef("intro")} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"><Plus size={12}/> Add scripture button</button>
                                                        </div>
                                                    </>)
                                                    :(<p className="leading-relaxed">{contentData.introduction}
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {contentData.lessonIntroScriptures.map(s=>(
                                                                <button key={s} onClick={()=>showBibleVerse(s)} className="border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95"><BookOpen size={13}/>{s}</button>
                                                            ))}
                                                        </div>
                                                    </p>)
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
                                        <div className="space-y-6 animate-in fade-in duration-300">
                                            {editBanner("lesson")}
                                            <h3 className="text-2xl font-bold">Lesson Contents</h3>

                                            {/* Intro Section */}
                                            {isAdmin && editingContent === "lesson" ? (
                                                <>
                                                    <textarea
                                                        value={contentData?.lessonIntro || ""}
                                                        onChange={e => updateContent("lessonIntro", e.target.value)}
                                                        className={`w-full px-4 py-2 rounded-lg border mb-4 outline-none focus:ring-2 focus:ring-purple-500 ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}
                                                        rows={3}
                                                        placeholder="Lesson Introduction..."
                                                    />
                                                    <div className="mb-4">
                                                        <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Lesson Content Scripture Buttons</p>
                                                        {(contentData.lessonContentScriptures || []).map((s, ri) => (
                                                            <div key={ri} className="flex items-center gap-2 mb-2">
                                                                <input
                                                                    type="text"
                                                                    value={s}
                                                                    onChange={(e) => {
                                                                        const updated = [...(contentData.lessonContentScriptures || [])];
                                                                        updated[ri] = e.target.value;
                                                                        updateContent("lessonContentScriptures", updated);
                                                                    }}
                                                                    placeholder="e.g., Gen. 12:1-5"
                                                                    className={`px-3 py-1.5 rounded-lg border text-sm flex-1 ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}
                                                                />
                                                                <button onClick={() => showBibleVerse(s)} disabled={!s.trim()} className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 disabled:opacity-30">
                                                                    <BookOpen size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const updated = (contentData.lessonContentScriptures || []).filter((_, i) => i !== ri);
                                                                        updateContent("lessonContentScriptures", updated);
                                                                    }}
                                                                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400"
                                                                >
                                                                    <X size={13} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => updateContent("lessonContentScriptures", [...(contentData.lessonContentScriptures || []), ""])}
                                                            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-1"
                                                        >
                                                            <Plus size={12} /> Add lesson content scripture
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="leading-relaxed mb-6 opacity-90">
                                                        {contentData?.lessonIntro || "No introduction text."}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(contentData.lessonContentScriptures || []).filter(s => s?.trim()).map((s, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => showBibleVerse(s)}
                                                                className="border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95"
                                                            >
                                                                <BookOpen size={13} />{s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            {/* Main Points Loop */}
                                            {(contentData?.lessonPoints || []).map((section, idx) => (
                                                <div key={`point-${idx}`} className={`relative ${darkMode ? "bg-gray-700/40" : "bg-gray-50"} p-5 rounded-xl border border-transparent`}>
                                                    {isAdmin && editingContent === "lesson" && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if(window.confirm(`Delete Point ${idx + 1}?`)) {
                                                                    const filtered = contentData.lessonPoints.filter((_, i) => i !== idx);
                                                                    updateContent("lessonPoints", filtered);
                                                                }
                                                            }}
                                                            className="absolute -top-2 -right-2 z-50 bg-red-500 text-white p-2 rounded-full shadow-xl hover:bg-red-600 active:scale-90 transition-all border-2 border-white dark:border-gray-800"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                    <div className="space-y-3">
                                                        {isAdmin && editingContent === "lesson" ? (
                                                            <>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black opacity-30 text-lg">{idx + 1}</span>
                                                                    <input
                                                                        type="text"
                                                                        value={section?.title || ""}
                                                                        onChange={e => updateLessonPoint(idx, "title", e.target.value)}
                                                                        className={`w-full px-3 py-2 rounded-lg border font-bold ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}
                                                                        placeholder="Main Point Title"
                                                                    />
                                                                </div>
                                                                <textarea
                                                                    value={section?.content || ""}
                                                                    onChange={e => updateLessonPoint(idx, "content", e.target.value)}
                                                                    className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}
                                                                    rows={2}
                                                                    placeholder="Description..."
                                                                />
                                                                <div className="flex flex-wrap gap-2 py-2">
                                                                    {(section?.scriptures || []).map((s, si) => (
                                                                        <span key={si} className="border border-blue-500 text-blue-400 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold">
                                                                            {s} <X size={10} className="cursor-pointer" onClick={() => {
                                                                                const filtered = section.scriptures.filter((_, i) => i !== si);
                                                                                updateLessonPoint(idx, "scriptures", filtered);
                                                                            }}/>
                                                                        </span>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => {
                                                                            const val = prompt("Enter Verse (e.g. Romans 13:1)");
                                                                            if(val) updateLessonPoint(idx, "scriptures", [...(section?.scriptures || []), val]);
                                                                        }}
                                                                        className="text-[10px] font-bold text-blue-500 border border-blue-500/30 px-2 py-1 rounded hover:bg-blue-500 hover:text-white transition"
                                                                    >
                                                                        + Add Scripture
                                                                    </button>
                                                                </div>
                                                                <div className="ml-6 space-y-3 border-l-2 border-purple-500/20 pl-4 mt-4">
                                                                    {(section?.subPoints ?? []).map((sp, si) => (
                                                                        <div key={`sub-${si}`} className="relative p-3 bg-black/5 rounded-lg mb-3">
                                                                            <button onClick={() => deleteSubPoint(idx, si)} className="absolute top-2 right-2 text-red-400">
                                                                                <X size={14}/>
                                                                            </button>
                                                                            <input
                                                                                type="text"
                                                                                value={sp?.title ?? ""}
                                                                                onChange={e => updateSubPoint(idx, si, "title", e.target.value)}
                                                                                className="w-full bg-transparent border-b border-gray-600 mb-2 text-sm font-bold focus:border-purple-500 outline-none"
                                                                            />
                                                                            <textarea
                                                                                value={sp?.content ?? ""}
                                                                                onChange={e => updateSubPoint(idx, si, "content", e.target.value)}
                                                                                className="w-full bg-transparent text-xs outline-none mb-2"
                                                                                rows={1}
                                                                            />
                                                                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/10">
                                                                                {(sp?.scriptures ?? []).map((ref, sci) => (
                                                                                    <span key={sci} className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                                                                        {ref}
                                                                                        <X size={10} className="cursor-pointer" onClick={() => {
                                                                                            const filtered = (sp?.scriptures ?? []).filter((_, i) => i !== sci);
                                                                                            updateSubPoint(idx, si, "scriptures", filtered);
                                                                                        }}/>
                                                                                    </span>
                                                                                ))}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const val = prompt("Enter Verse");
                                                                                        if(val) updateSubPoint(idx, si, "scriptures", [...(sp?.scriptures ?? []), val]);
                                                                                    }}
                                                                                    className="text-[9px] font-bold text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded hover:bg-blue-400 hover:text-white transition"
                                                                                >
                                                                                    + Add Verse
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => addSubPoint(idx)}
                                                                        className="mt-2 text-xs font-bold text-purple-500 flex items-center gap-1 hover:bg-purple-50 p-2 rounded-lg transition-colors border border-purple-100 border-dashed"
                                                                    >
                                                                        <Plus size={14}/> New Sub-point
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <h4 className="text-xl font-bold mb-2">{idx + 1}. {section?.title || "Untitled Point"}</h4>
                                                                {section?.content && <p className="leading-relaxed mb-3 opacity-80">{section.content}</p>}
                                                                <div className="flex flex-wrap gap-2 mb-4">
                                                                    {(section?.scriptures || []).map(s => (
                                                                        <button key={s} onClick={() => showBibleVerse(s)} className="border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95">
                                                                            <BookOpen size={12} /> <span>{s}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <div className="space-y-4 ml-2 mt-4">
                                                                    {(section?.subPoints || []).map((sp, si) => (
                                                                        <div key={`sub-view-${si}`} className="flex flex-col gap-1">
                                                                            <div className="flex gap-3">
                                                                                <span className="text-purple-500 font-bold">{String.fromCharCode(97 + si)}.</span>
                                                                                <div className="flex-1">
                                                                                    <p className="text-sm font-bold">{sp?.title}</p>
                                                                                    <p className="text-sm opacity-80">{sp?.content}</p>
                                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                                        {(sp?.scriptures || []).map((ss, ssi) => (
                                                                                            <button
                                                                                                key={`${si}-${ssi}`}
                                                                                                onClick={() => showBibleVerse(ss)}
                                                                                                className="border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95"
                                                                                            >
                                                                                                {ss}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Master Add Section button */}
                                            {isAdmin && editingContent === "lesson" && (
                                                <div className="mt-10 pt-6 border-t-2 border-dashed border-gray-200 dark:border-gray-800">
                                                    <button
                                                        onClick={() => {
                                                            const newSection = {
                                                                title: "",
                                                                content: "",
                                                                scriptures: [],
                                                                subPoints: [{ title: "", content: "", scriptures: [] }]
                                                            };
                                                            updateContent("lessonPoints", [...(contentData?.lessonPoints || []), newSection]);
                                                        }}
                                                        className="w-full py-8 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/5 transition-all group flex flex-col items-center justify-center gap-3"
                                                    >
                                                        <div className="bg-purple-500 text-white p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                                            <Plus size={24} strokeWidth={3} />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="font-black uppercase tracking-widest text-purple-500">Add New Lesson Section</p>
                                                            <p className="text-xs opacity-50">This adds a main point (e.g., Point {(contentData?.lessonPoints?.length || 0) + 1})</p>
                                                        </div>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── CONCLUSION ── */}
                                    {activeTab==="conclusion"&&(
                                        <div className="space-y-6">
                                            {editBanner("conclusion")}
                                            <h3 className="text-2xl font-bold">Conclusion</h3>
                                            {isAdmin && editingContent === "conclusion" ? (
                                                <div className="space-y-4">
                                                    <textarea
                                                        value={contentData?.conclusion || ""}
                                                        onChange={e => updateContent("conclusion", e.target.value)}
                                                        className={`w-full px-4 py-2 rounded-xl border text-lg ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}
                                                        rows={6}
                                                    />
                                                    <div className="p-4 border-2 border-dashed border-blue-500/20 rounded-xl">
                                                        <p className="text-[10px] font-black uppercase text-blue-500 mb-3 tracking-widest">Concluding Verses</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(contentData?.conclusionScriptures || []).map((s, i) => (
                                                                <span key={i} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
                                                                    {s} <X size={12} className="cursor-pointer" onClick={() => {
                                                                        const filtered = contentData.conclusionScriptures.filter((_, idx) => idx !== i);
                                                                        updateContent("conclusionScriptures", filtered);
                                                                    }}/>
                                                                </span>
                                                            ))}
                                                            <button
                                                                onClick={() => {
                                                                    const val = prompt("Enter Verse");
                                                                    if(val) updateContent("conclusionScriptures", [...(contentData?.conclusionScriptures || []), val]);
                                                                }}
                                                                className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-lg text-xs font-bold"
                                                            >
                                                                + Add Verse
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <p className="text-lg leading-relaxed opacity-90">{contentData?.conclusion || "No conclusion yet."}</p>
                                                    <div className="flex flex-wrap gap-3">
                                                        {(contentData?.conclusionScriptures || []).map(s => (
                                                            <button key={s} onClick={() => showBibleVerse(s)} className="border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95">
                                                                <BookOpen size={16} /> {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── MANAGE (scriptures) ── */}
                                    {activeTab==="manage"&&(
                                        <div className="space-y-5">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-2xl font-bold flex items-center gap-2"><Database className="text-blue-400" size={22}/>Scripture Database</h3>
                                                    <p className="text-xs opacity-50 mt-0.5">{Object.keys(scriptureDB).length} entries ({filteredScriptureKeys.length} shown) · {isAdmin?"Admin — full edit access":"Read-only"}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <button onClick={()=>void loadScripturesFromDB()} disabled={scriptureLoading||scriptureSyncing}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 transition disabled:opacity-40">
                                                        <RefreshCw size={13} className={scriptureLoading?"animate-spin":""}/> Sync DB
                                                    </button>
                                                    {isAdmin&&(<>
                                                        <button onClick={()=>{setShowImporter(p=>!p);setEditMode(false);}}
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${showImporter?"bg-purple-700 hover:bg-purple-800":"bg-purple-600 hover:bg-purple-700"} text-white`}>
                                                            <Upload size={14}/> {showImporter?"Close Importer":"Bulk Import"}
                                                        </button>
                                                        <button onClick={()=>{setEditMode(!editMode);setShowImporter(false);}} disabled={scriptureSyncing}
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-40 ${editMode?"bg-red-600 hover:bg-red-700":"bg-green-600 hover:bg-green-700"} text-white`}>
                                                            {editMode?<><X size={14}/> Cancel</>:<><Plus size={14}/> Add One</>}
                                                        </button>
                                                    </>)}
                                                </div>
                                            </div>

                                            {scriptureSaved&&(
                                                <div className="flex items-center gap-2 px-4 py-3 bg-green-600/20 border border-green-500/40 rounded-xl text-green-400 text-sm font-semibold">
                                                    <CheckCircle size={16}/> "{scriptureSaved}" saved to database!
                                                </div>
                                            )}

                                            {isAdmin&&showImporter&&(
                                                <div className={`${darkMode?"bg-gray-700/60 border-white/10":"bg-gray-50 border-gray-200"} border rounded-2xl p-5`}>
                                                    <ScriptureImporter
                                                        darkMode={darkMode}
                                                        onDone={()=>{
                                                            void loadScripturesFromDB();
                                                            setShowImporter(false);
                                                        }}
                                                    />
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
                                                {!scriptureLoading&&filteredScriptureKeys.map(ref=>{
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
                                                                    <button onClick={()=>showBibleVerse(ref)} className="border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95"><BookOpen size={12}/> View</button>
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
                                                {!scriptureLoading&&filteredScriptureKeys.length===0&&(
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
                                </>
                            )}
                            {/* END ternary guard */}

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
