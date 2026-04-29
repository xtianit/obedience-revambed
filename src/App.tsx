import logo from "./assets/logo.png";
import Header from "./components/Header";
import { AdminPanel } from "./components/AdminPanel";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    Lock, BookOpen, Award, CheckCircle, Edit2, Save, X,
    Clock, Plus, Loader2, ShieldCheck, LogOut,
    CreditCard, Chrome, RefreshCw,
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
    "KJV": "And being found in fashion as a man, he humbled himself, and became obedient unto death, even the death of the cross.",
    "NKJV": "And being found in appearance as a man, He humbled Himself and became obedient to the point of death, even the death of the cross.",
    "NIV": "And being found in appearance as a man, he humbled himself by becoming obedient to death— even death on a cross!",
    "ESV": "And being found in human form, he humbled himself by becoming obedient to the point of death, even death on a cross.",
    "AMP": "After He had appeared in human form, He self-centeredly humbled Himself by becoming obedient to the point of death, even death on a cross.",
    "NLT": "When he appeared in human form, he humbled himself in obedience to God and died a criminal’s death on a cross.",
    "MSG": "Having become human, he stayed human. It was an incredibly humbling process. He didn’t claim special privileges. Instead, he lived a selfless, obedient life and then died a selfless, obedient death—and the worst kind of death at that: a crucifixion."
  },

  "Gen. 12:1-5": {
    "KJV": "1 Now the Lord had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father's house, unto a land that I will show thee: 2 And I will make of thee a great nation, and I will bless thee, and make thy name great; and thou shalt be a blessing: 3 And I will bless them that bless thee, and curse him that curseth thee: and in thee shall all families of the earth be blessed. 4 So Abram departed, as the Lord had spoken unto him; and Lot went with him: and Abram was seventy and five years old when he departed out of Haran. 5 And Abram took Sarai his wife, and Lot his brother's son, and all their substance that they had gathered, and the souls that they had gotten in Haran; and they went forth to go into the land of Canaan; and into the land of Canaan they came.",
    "NKJV": "1 Now the Lord had said to Abram: “Get out of your country, From your family And from your father’s house, To a land that I will show you. 2 I will make you a great nation; I will bless you And make your name great; And you shall be a blessing. 3 I will bless those who bless you, And I will curse him who curses you; And in you all the families of the earth shall be blessed.” 4 So Abram departed as the Lord had spoken to him, and Lot went with him. And Abram was seventy-five years old when he departed from Haran. 5 Then Abram took Sarai his wife and Lot his brother’s son, and all their possessions that they had gathered, and the people whom they had acquired in Haran, and they departed to go to the land of Canaan. So they came to the land of Canaan.",
    "NIV": "1 The Lord had said to Abram, “Go from your country, your people and your father’s household to the land I will show you. 2 “I will make you into a great nation, and I will bless you; I will make your name great, and you will be a blessing. 3 I will bless those who bless you, and whoever curses you I will curse; and all peoples on earth will be blessed through you.” 4 So Abram went, as the Lord had told him; and Lot went with him. Abram was seventy-five years old when he set out from Haran. 5 He took his wife Sarai, his nephew Lot, all the possessions they had accumulated and the people they had acquired in Haran, and they set out for the land of Canaan, and they arrived there.",
    "ESV": "1 Now the Lord said to Abram, “Go from your country and your kindred and your father's house to the land that I will show you. 2 And I will make of you a great nation, and I will bless you and make your name great, so that you will be a blessing. 3 I will bless those who bless you, and him who dishonors you I will curse, and in you all the families of the earth shall be blessed.” 4 So Abram went, as the Lord had told him, and Lot went with him. Abram was seventy-five years old when he departed from Haran. 5 And Abram took Sarai his wife, and Lot his brother's son, and all their possessions that they had gathered, and the people whom they had acquired in Haran, and they set out to go to the land of Canaan. When they came to the land of Canaan,",
    "AMP": "1 Now [in Haran] the Lord said to Abram, “Go away from your country, And from your relatives And from your father’s house, To the land which I will show you; 2 And I will make you a great nation, And I will bless you [abundantly], And make your name great [exalted]; And you shall be a blessing [a source of great good to others]; 3 And I will bless (do good for, benefit) those who bless you, And I will curse [that is, subject to My wrath and judgment] the one who curses (despises, dishonors, has contempt for) you. And in you all the families of the earth will be blessed.” 4 So Abram departed [from Haran] as the Lord had spoken to him; and Lot [his nephew] went with him. Abram was seventy-five years old when he left Haran. 5 Abram took Sarai his wife and Lot his brother’s son, and all their possessions which they had accumulated, and the people [the servants] whom they had acquired in Haran, and they set out for the land of Canaan.",
    "NLT": "1 The Lord had said to Abram, “Leave your native country, your relatives, and your father’s family, and go to the land that I will show you. 2 I will make you into a great nation. I will bless you and make you famous, and you will be a blessing to others. 3 I will bless those who bless you and curse those who treat you with contempt. All the families on earth will be blessed through you.” 4 So Abram departed as the Lord had instructed, and Lot went with him. Abram was seventy-five years old when he left Haran. 5 He took his wife, Sarai, his nephew Lot, and all his wealth—his livestock and all the people he had taken into his household at Haran—and headed for the land of Canaan. When they arrived in Canaan,",
    "MSG": "1-3 God told Abram: “Leave your country, your family, and your father’s home for a land that I will show you. I’ll make you a great nation and bless you. I’ll make you famous; you’ll be a blessing. I’ll bless those who bless you; those who curse you I’ll curse. All the families of the Earth will be blessed through you.” 4-5 Abram left just as God said, and Lot left with him. Abram was seventy-five years old when he left Haran. Abram took his wife Sarai and his nephew Lot with him, along with all the possessions and people they had gotten in Haran, and set out for the land of Canaan and arrived safe and sound."
  },
  "Genesis 12:1": {
    "KJV": "Now the Lord had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father's house, unto a land that I will show thee:",
    "NKJV": "Now the Lord had said to Abram: “Get out of your country, From your family And from your father’s house, To a land that I will show you.",
    "NIV": "The Lord had said to Abram, “Go from your country, your people and your father’s household to the land I will show you.",
    "ESV": "Now the Lord said to Abram, “Go from your country and your kindred and your father's house to the land that I will show you.",
    "AMP": "Now [in Haran] the Lord said to Abram, “Go away from your country, And from your relatives And from your father’s house, To the land which I will show you;",
    "NLT": "The Lord had said to Abram, “Leave your native country, your relatives, and your father’s family, and go to the land that I will show you.",
    "MSG": "God told Abram: “Leave your country, your family, and your father’s home for a land that I will show you."
  },

  "Colossians 1:17": {
    "KJV": "And he is before all things, and by him all things consist.",
    "NKJV": "And He is before all things, and in Him all things consist.",
    "NIV": "He is before all things, and in him all things hold together.",
    "ESV": "And he is before all things, and in him all things hold together.",
    "AMP": "And He Himself existed and is before all things, and in Him all things hold together [within His control].",
    "NLT": "He existed before anything else, and he holds all creation together.",
    "MSG": "He was there before any of it came into existence and holds it all together right up to this moment."
  },

  "2 Cor. 10:5": {
    "KJV": "Casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ;",
    "NKJV": "casting down arguments and every high thing that exalts itself against the knowledge of God, bringing every thought into captivity to the obedience of Christ,",
    "NIV": "We demolish arguments and every pretension that sets itself up against the knowledge of God, and we take captive every thought to make it obedient to Christ.",
    "ESV": "We destroy arguments and every lofty opinion raised against the knowledge of God, and take every thought captive to obey Christ,",
    "AMP": "We are destroying sophisticated arguments and every exalted and proud thing that sets itself up against the [true] knowledge of God, and we are taking every thought and purpose captive to the obedience of Christ,",
    "NLT": "We destroy every proud obstacle that keeps people from knowing God. We capture their rebellious thoughts and teach them to obey Christ.",
    "MSG": "We use our powerful God-tools for smashing warped philosophies, tearing down barriers erected against the truth of God, fitting every loose thought and emotion and impulse into the structure of life shaped by Christ."
  },
  
  "2 Corinthians 10:5": {
    "KJV": "Casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ;",
    "NKJV": "casting down arguments and every high thing that exalts itself against the knowledge of God, bringing every thought into captivity to the obedience of Christ,",
    "NIV": "We demolish arguments and every pretension that sets itself up against the knowledge of God, and we take captive every thought to make it obedient to Christ.",
    "ESV": "We destroy arguments and every lofty opinion raised against the knowledge of God, and take every thought captive to obey Christ,",
    "AMP": "We are destroying sophisticated arguments and every exalted and proud thing that sets itself up against the [true] knowledge of God, and we are taking every thought and purpose captive to the obedience of Christ,",
    "NLT": "We destroy every proud obstacle that keeps people from knowing God. We capture their rebellious thoughts and teach them to obey Christ.",
    "MSG": "We use our powerful God-tools for smashing warped philosophies, tearing down barriers erected against the truth of God, fitting every loose thought and emotion and impulse into the structure of life shaped by Christ."
  },
  "Genesis 12:1-5": {
    "KJV": "1 Now the Lord had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father's house, unto a land that I will show thee: 2 And I will make of thee a great nation, and I will bless thee, and make thy name great; and thou shalt be a blessing: 3 And I will bless them that bless thee, and curse him that curseth thee: and in thee shall all families of the earth be blessed. 4 So Abram departed, as the Lord had spoken unto him; and Lot went with him: and Abram was seventy and five years old when he departed out of Haran. 5 And Abram took Sarai his wife, and Lot his brother's son, and all their substance that they had gathered, and the souls that they had gotten in Haran; and they went forth to go into the land of Canaan; and into the land of Canaan they came.",
    "NKJV": "1 Now the Lord had said to Abram: “Get out of your country, From your family And from your father’s house, To a land that I will show you. 2 I will make you a great nation; I will bless you And make your name great; And you shall be a blessing. 3 I will bless those who bless you, And I will curse him who curses you; And in you all the families of the earth shall be blessed.” 4 So Abram departed as the Lord had spoken to him, and Lot went with him. And Abram was seventy-five years old when he departed from Haran. 5 Then Abram took Sarai his wife and Lot his brother’s son, and all their possessions that they had gathered, and the people whom they had acquired in Haran, and they departed to go to the land of Canaan. So they came to the land of Canaan.",
    "NIV": "1 The Lord had said to Abram, “Go from your country, your people and your father’s household to the land I will show you. 2 “I will make you into a great nation, and I will bless you; I will make your name great, and you will be a blessing. 3 I will bless those who bless you, and whoever curses you I will curse; and all peoples on earth will be blessed through you.” 4 So Abram went, as the Lord had told him; and Lot went with him. Abram was seventy-five years old when he set out from Haran. 5 He took his wife Sarai, his nephew Lot, all the possessions they had accumulated and the people they had acquired in Haran, and they set out for the land of Canaan, and they arrived there.",
    "ESV": "1 Now the Lord said to Abram, “Go from your country and your kindred and your father's house to the land that I will show you. 2 And I will make of you a great nation, and I will bless you and make your name great, so that you will be a blessing. 3 I will bless those who bless you, and him who dishonors you I will curse, and in you all the families of the earth shall be blessed.” 4 So Abram went, as the Lord had told him, and Lot went with him. Abram was seventy-five years old when he departed from Haran. 5 And Abram took Sarai his wife, and Lot his brother's son, and all their possessions that they had gathered, and the people whom they had acquired in Haran, and they set out to go to the land of Canaan. When they came to the land of Canaan,",
    "AMP": "1 Now [in Haran] the Lord said to Abram, “Go away from your country, And from your relatives And from your father’s house, To the land which I will show you; 2 And I will make you a great nation, And I will bless you [abundantly], And make your name great [exalted]; And you shall be a blessing [a source of great good to others]; 3 And I will bless (do good for, benefit) those who bless you, And I will curse [that is, subject to My wrath and judgment] the one who curses (despises, dishonors, has contempt for) you. And in you all the families of the earth will be blessed.” 4 So Abram departed [from Haran] as the Lord had spoken to him; and Lot [his nephew] went with him. Abram was seventy-five years old when he left Haran. 5 Abram took Sarai his wife and Lot his brother’s son, and all their possessions which they had accumulated, and the people [the servants] whom they had acquired in Haran, and they set out for the land of Canaan.",
    "NLT": "1 The Lord had said to Abram, “Leave your native country, your relatives, and your father’s family, and go to the land that I will show you. 2 I will make you into a great nation. I will bless you and make you famous, and you will be a blessing to others. 3 I will bless those who bless you and curse those who treat you with contempt. All the families on earth will be blessed through you.” 4 So Abram departed as the Lord had instructed, and Lot went with him. Abram was seventy-five years old when he left Haran. 5 He took his wife, Sarai, his nephew Lot, and all his wealth—his livestock and all the people he had taken into his household at Haran—and headed for the land of Canaan. When they arrived in Canaan,",
    "MSG": "1-3 God told Abram: “Leave your country, your family, and your father’s home for a land that I will show you. I’ll make you a great nation and bless you. I’ll make you famous; you’ll be a blessing. I’ll bless those who bless you; those who curse you I’ll curse. All the families of the Earth will be blessed through you.” 4-5 Abram left just as God said, and Lot left with him. Abram was seventy-five years old when he left Haran. Abram took his wife Sarai and his nephew Lot with him, along with all the possessions and people they had gotten in Haran, and set out for the land of Canaan and arrived safe and sound."
  },    
  "Gen. 12:1": {
    "KJV": "Now the Lord had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father's house, unto a land that I will show thee:",
    "NKJV": "Now the Lord had said to Abram: “Get out of your country, From your family And from your father’s house, To a land that I will show you.”",
    "NIV": "The Lord had said to Abram, “Go from your country, your people and your father’s household to the land I will show you.”",
    "ESV": "Now the Lord said to Abram, “Go from your country and your kindred and your father's house to the land that I will show you.”",
    "AMP": "Now [in Haran] the Lord said to Abram, “Go away from your country, And from your relatives And from your father’s house, To the land which I will show you;”",
    "NLT": "The Lord had said to Abram, “Leave your native country, your relatives, and your father’s family, and go to the land that I will show you.”",
    "MSG": "God told Abram: “Leave your country, your family, and your father’s home for a land that I will show you.”"
  }

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
    lessonDate:  "May 3, 2026",
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
    const [subChecking,  setSubChecking]  = useState(false);

    // ── App state ─────────────────────────────────────────────────────────────
    const [activeTab,      setActiveTab]      = useState("intro");
    const [darkMode,       setDarkMode]       = useState(true);
    const [fontSize,       setFontSize]       = useState(16);
    const [tabLoading,     setTabLoading]     = useState(false);
    const [scriptureDB,    setScriptureDB]    = useState<ScriptureDB>(initialScriptureDB);
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
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, endDate }));
        } catch {
            // Ignore storage errors
        }
    };

    const readSubCache = (userId: string): boolean => {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return false;

            const { userId: uid, endDate } = JSON.parse(raw);

            return uid === userId && new Date(endDate) > new Date();
        } catch {
            // Ignore invalid cache data
            return false;
        }
    };

    const clearSubCache = () => {
        try {
            localStorage.removeItem(CACHE_KEY);
        } catch {
            // Ignore storage errors
        }
    };

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

    const addNewScripture = () => {
        if (newVerse.reference && Object.values(newVerse.versions).some((v) => v)) {
            setScriptureDB((p) => ({ ...p, [newVerse.reference]: newVerse.versions }));
            setNewVerse({ reference: "", versions: { KJV:"", NKJV:"", NIV:"", ESV:"", AMP:"", NLT:"", MSG:"" } });
            setEditMode(false);
        }
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
    const saveEditScripture = () => {
        if (!editingRef) return;
        setScriptureDB((prev) => {
            const updated = { ...prev };
            // If reference was renamed, remove old key
            if (editingRefNew && editingRefNew !== editingRef) {
                delete updated[editingRef];
                updated[editingRefNew] = { ...editingVersions };
            } else {
                updated[editingRef] = { ...editingVersions };
            }
            return updated;
        });
        setScriptureSaved(editingRefNew || editingRef);
        setTimeout(() => setScriptureSaved(null), 2500);
        cancelEditScripture();
    };
    const deleteScripture = (ref: string) => {
        setScriptureDB((prev) => {
            const updated = { ...prev };
            delete updated[ref];
            return updated;
        });
        setDeleteConfirmRef(null);
        if (editingRef === ref) cancelEditScripture();
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
    //  AUTH SCREEN  — Google Login
    // ═══════════════════════════════════════════════════════════════════════════
    if (screen === "auth") {
        return (
            <div className={`min-h-screen ${th} flex items-center justify-center p-4 relative overflow-hidden`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-96 h-96 bg-purple-500/25 rounded-full blur-3xl -top-48 -left-48 animate-pulse"/>
                    <div className="absolute w-96 h-96 bg-blue-500/25 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{animationDelay:"1s"}}/>
                </div>
                <div className="max-w-sm w-full relative z-10 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/20">
                        <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Sunday School
                    </h1>
                    <p className="opacity-60 mb-2 text-sm">Life Gate Ministries Worldwide</p>
                    <p className="opacity-80 mb-10 font-medium">Sign in to access the lesson</p>

                    <button
                        onClick={async () => { setAuthLoading(true); await signInWithGoogle(); }}
                        disabled={authLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-800 rounded-2xl font-bold shadow-2xl hover:shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
                    >
                        {authLoading
                            ? <Loader2 size={20} className="animate-spin text-blue-600" />
                            : <Chrome size={20} className="text-blue-600" />
                        }
                        {authLoading ? "Redirecting to Google…" : "Continue with Google"}
                    </button>

                    <p className="mt-6 text-xs opacity-40">By signing in you agree to our terms of service.</p>
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
                                    {isAdmin && (
                                        <button onClick={()=>setEditMode(!editMode)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${editMode?"bg-red-600 hover:bg-red-700":"bg-green-600 hover:bg-green-700"} text-white`}>
                                            {editMode ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add New Scripture</>}
                                        </button>
                                    )}
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
                                            <button onClick={addNewScripture}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition">
                                                <Save size={15}/> Save Scripture
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
                                                                            <button onClick={()=>deleteScripture(ref)}
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
                                                                <button onClick={saveEditScripture}
                                                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition">
                                                                    <Save size={15}/> Save Changes
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
                                    {Object.keys(scriptureDB).filter(r=>r.toLowerCase().includes(scriptureSearch.toLowerCase())).length === 0 && (
                                        <div className="text-center py-12 opacity-40">
                                            <BookOpen size={40} className="mx-auto mb-3"/>
                                            <p>No scriptures match "{scriptureSearch}"</p>
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