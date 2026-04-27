import logo from "./assets/logo.png";
import Header from "./components/Header";
import { useState, useEffect } from "react";
import {
    BookOpen,
    Award,
    CheckCircle,
    Edit2,
    Save,
    X,
    Clock,
    Plus,
    Lock,
    Unlock,
} from "lucide-react";

// import { Save, CheckCircle, Heart, Zap, BookOpen, Trophy } from 'lucide-react';



interface PaystackResponse {
    reference: string;
    status: string;
    message: string;
    trans: string;
    transaction: string;
    trxref: string;
}

declare global {
    interface Window {
        PaystackPop: {
            setup: (config: {
                key: string;
                email: string;
                amount: number;
                currency: string;
                reference: string;
                onClose: () => void;
                callback: (response: PaystackResponse) => void;
            }) => { openIframe: () => void };
        };
    }
}

type BibleVersions = {
    KJV: string;
    NKJV: string;
    NIV: string;
    ESV: string;
    AMP: string;
    NLT: string;
    MSG: string;
};

type ScriptureDB = Record<string, BibleVersions>;




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


const quizQuestions = [
  {
    q: "What is the title of today's lesson?",
    a: ["Faithfulness", "OBEDIENCE", "Divine Favour", "Spiritual Growth"],
    correct: 1
  },
  {
    q: "Which scripture is the memory verse for this lesson?",
    a: ["Genesis 12:1-5", "Philippians 2:8", "Romans 12:1", "Psalm 23:1"],
    correct: 1
  },
  {
    q: "According to the lesson, obedience is primarily a relationship between:",
    a: ["Friends and neighbors", "Teacher and student", "A higher authority and a lesser person", "Parents and children only"],
    correct: 2
  },
  {
    q: "Who is presented as the Creator and Possessor of heaven and earth?",
    a: ["Abraham", "Angels", "God", "Man"],
    correct: 2
  },
  {
    q: "Which biblical figure was commanded to leave Haran and his family?",
    a: ["Moses", "David", "Abram", "Isaac"],
    correct: 2
  },
  {
    q: "What was Abram asked to do?",
    a: ["Build a temple", "Fight a battle", "Leave for an unknown land", "Return to Egypt"],
    correct: 2
  },
  {
    q: "The obedience of Abram teaches that personal will must be:",
    a: ["Celebrated", "Ignored", "Buried in God's will", "Shared with others"],
    correct: 2
  },
  {
    q: "According to the lesson, God's instructions are found in:",
    a: ["Traditions only", "Dreams alone", "The Bible", "Human opinions"],
    correct: 2
  },
  {
    q: "What does the lesson say disobedience becomes?",
    a: ["Wisdom", "Sin", "Progress", "Neutral"],
    correct: 1
  },
  {
    q: "True obedience may require laying aside:",
    a: ["Convenience", "Feelings", "Human reasoning", "All of the above"],
    correct: 3
  },
  {
    q: "The phrase 'unto the land that I will show thee' teaches:",
    a: ["Immediate clarity", "Blind trust in God", "Fear of failure", "Material success"],
    correct: 1
  },
  {
    q: "According to the lesson, blessings are often rewards of:",
    a: ["Popularity", "Obedience", "Wealth", "Knowledge"],
    correct: 1
  },
  {
    q: "Which verse says Christ became obedient unto death?",
    a: ["Philippians 2:8", "Genesis 12:1", "John 3:16", "Psalm 91:1"],
    correct: 0
  },
  {
    q: "Jesus is described in the lesson as our perfect example of:",
    a: ["Leadership", "Obedience", "Prosperity", "Wisdom only"],
    correct: 1
  },
  {
    q: "According to Colossians 1:17, Christ does what?",
    a: ["Judges nations", "Holds all things together", "Builds cities", "Creates gold"],
    correct: 1
  },
  {
    q: "The aim of this subject is to bring every man to:",
    a: ["Fame", "Religious activity", "The obedience of Christ", "Earthly power"],
    correct: 2
  },
  {
    q: "One objective of obedience is peaceful coexistence between:",
    a: ["Nations only", "God and man, and man with man", "Churches only", "Families only"],
    correct: 1
  },
  {
    q: "When convenience conflicts with God's pleasure, the lesson says God will:",
    a: ["Compromise", "Wait forever", "Not compromise", "Change His standards"],
    correct: 2
  },
  {
    q: "According to the lesson, many excuses for disobedience are removed because:",
    a: ["Others obeyed first", "Jesus obeyed even unto death", "Life is easy", "Rules changed"],
    correct: 1
  },
  {
    q: "What key truth best summarizes this lesson?",
    a: ["Obedience preserves relationship with God and opens blessings", "Success comes by effort alone", "Feelings should guide decisions", "Delay is harmless"],
    correct: 0
  }
];




const SundaySchoolApp = () => {
    const [showPaymentGate, setShowPaymentGate] = useState(true);
    const [isPaid, setIsPaid] = useState(false);
    const [activeTab, setActiveTab] = useState("intro");


    // new content
// const [activeTab, setActiveTab] = useState("content");
//   const [loveRating, setLoveRating] = useState(5);
    // const [commitmentInput, setCommitmentInput] = useState("");
    // const [commitments, setCommitments] = useState([]);
//   const [darkMode, setDarkMode] = useState(false);
    //End of new content
    const [darkMode, setDarkMode] = useState(true);
    const [fontSize, setFontSize] = useState(16);
    const [loading, setLoading] = useState(false);
    const [appLoading, setAppLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [scriptureDB, setScriptureDB] =
        useState<ScriptureDB>(initialScriptureDB);
    const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
    const [bibleVersion, setBibleVersion] =
        useState<keyof BibleVersions>("KJV");
    const [showVerseModal, setShowVerseModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [newVerse, setNewVerse] = useState<{
        reference: string;
        versions: BibleVersions;
    }>({
        reference: "",
        versions: { KJV: "", NKJV: "", NIV: "", ESV: "", AMP: "", NLT: "", MSG: "" },
    });
    const [verseLoading, setVerseLoading] = useState(false);
    const [quizActive, setQuizActive] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(50);
    const [showResults, setShowResults] = useState(false);
    // const [faithRating, setFaithRating] = useState(5);
    const [commitments, setCommitments] = useState<
        Array<{ text: string; date: string }>
    >([]);
    const [commitmentInput, setCommitmentInput] = useState("");
    const [editingContent, setEditingContent] = useState<string | null>(null);
    const [loveRating, setLoveRating] = useState(5);

    type SubPoint = { 
        title: string; 
        content: string; 
        scriptures?: string[]; 
    };
    type LessonPoint = {
        title: string;
        content: string;
        scriptures: string[];
        subPoints: SubPoint[];
    };
    type ContentData = {
        lessonDate: string;
        lessonTitle: string;
        memoryVerse: string;
        memoryVerseRef: string;
        introduction: string;
        introScriptures: string[];
        lessonIntroScriptures: string[];
        aims: string;
        aimsScriptures: string[];
        objectives: string;
        objectivesScriptures: string[];
        lessonIntro: string;
        lessonPoints: LessonPoint[];
        conclusion: string;
        conclusionScriptures: string[];
        prayerPoints: string[];
    };
const addCommitment = () => {
    if (!commitmentInput.trim()) return;
    const newCommitment = {
      text: commitmentInput,
      date: new Date().toLocaleDateString()
    };
    setCommitments([newCommitment, ...commitments]);
    setCommitmentInput("");
  };

  



const [contentData, setContentData] = useState<ContentData>({
    lessonDate: "July 3, 2016",
    lessonTitle: "OBEDIENCE",

    memoryVerse:
        "And being found in fashion as a man, he humbled himself, and became obedient unto death, even the death of the cross - Phil. 2:8.",
    memoryVerseRef: "Phil. 2:8",

    introScriptures: ["Gen 12:1-5"],
    
    lessonIntroScriptures: [ 
        "Colossians 1:17", 
        "2 Corinthians 10:5"
    ],

    introduction:
        "Obedience is a matter of relationship between two persons, one higher and the other lesser. It therefore has to do with being submissive to another's will, instructions, terms, commandments, conditions or the keeping of another's will/wish. The Bible has proven God beyond any doubt to be the creator and possessor of Heaven and Earth. In them he has made other persons lesser to himself for his pleasure to co-inhabit. This is where obedience steps into the scene of the kingdom of God or else things would fall apart. The creator of wisdom has more wisdom than wisdom and by Christ Jesus he holds all things together in obedience to himself - Colossians 1:17, 2 Corinthians 10:5.",

    aims:
        "This subject is aimed at bringing every man to the obedience of Christ.",

    aimsScriptures: ["Colossians 1:17"],

    objectives:
        "That there may be a peaceful co-existence between God and man, and between man and man.",

    objectivesScriptures: ["2 Corinthians 10:5"],

    lessonIntro:
        "Abraham the son of Terah, a descendant of a Godly seed Shem was asked by God to leave Haran, his family and to move to a land unknown at the time of instruction. Gen. 12:1-5. Many promises were attached to this commandment that was obeyed by Abram, a man like you and I. The lesson drawn from the text is enumerated below:",

    lessonPoints: [
        {
            title: "THE FOUNDATION OF OBEDIENCE",
            content:
                "Obedience is a matter of two parties involving a higher authority and a lesser subject. It requires a mandatory response to divine instructions as seen in the call of Abram. Gen. 12:1.",
            scriptures: ["Gen. 12:1-5"],
            subPoints: [
                {
                    title: "TWO PARTIES INVOLVED",
                    content:
                        "Obedience is a matter of two parties, 'THE LORD SAID TO ABRAM'. Lord and Abram. This means that the Lord requires the obedience of any of us. Gen. 12:1.",
                    scriptures: ["Gen. 12:1"]
                },
                {
                    title: "SURRENDER OF WILL",
                    content:
                        "Abram's will was buried in God's will and that is what He requires of your will also. As Christ Jesus holds all things together, we must align our will with His. Col. 1:17.",
                    scriptures: ["Colossians 1:17"]
                },
                {
                    title: "DIVINE COMMAND",
                    content:
                        "Abram was not given a choice to choose between going and staying back. It shows that God commands and not suggest. The lesser person which is you has to obey mandatorily. If you disobey the instruction, it becomes sin. The Bible is the book where God's instructions are found.",
                    scriptures: []
                }
            ],
        },
        {
            title: "THE COST, FAITH, AND REWARD OF OBEDIENCE",
            content:
                "True obedience disregards personal convenience and feelings, requiring a blind trust in God's leading, exemplified by Christ's obedience unto death. Phil. 2:8.",
            scriptures: ["Phil. 2:8", "2 Corinthians 10:5"],
            subPoints: [
                {
                    title: "CONVENIENCE AND PLEASURE",
                    content:
                        "Abram's convenience was not considered. For a man to be obedient to God, he must forget about his convenience. Remember that you are made for his pleasure and if your convenience double-crosses his pleasure, he will not compromise.",
                    scriptures: []
                },
                {
                    title: "DISREGARDING FEELINGS",
                    content:
                        "God does not care about how you or others feel about what he instructs you to do. Abram had to leave his home-land, family and quit business. We must drop our feelings and fulfill God's conditions and terms. 2 Cor. 10:5.",
                    scriptures: ["2 Corintians 10:5"]
                },
                {
                    title: "BLIND TRUST",
                    content:
                        "The word 'unto the land that I will show thee' speaks of uncertainty, a blind trust and suggests irrationality. Gen 12:1. YOU MAY NOT KNOW WHERE YOUR OBEDIENCE TO GOD WILL TAKE YOU but you are required to TRUST AND OBEY.",
                    scriptures: ["Genesis 12:1"]
                },
                {
                    title: "REWARDS OF OBEDIENCE",
                    content:
                        "The text shows that blessings and benefits are rewards of obedience.",
                    scriptures: []
                }
            ],
        }
    ],

    conclusion:
        "Obedience is the only thing that will keep our relationship with God and the key to God's storehouse of blessing. Jesus our perfect example was also human like us, whose obedience even led him to death. Phil. 2:8. Many things God demand of us are not as much as that and this is why we don't have excuses today if we aren't obedient.",

    conclusionScriptures: [],

    prayerPoints: [
        "Father, help me to bring my will into total subjection to Yours, just as Abram did. Gen. 12:4.",
        "Lord, give me the grace to choose Your pleasure over my personal convenience every day.",
        "Father, strengthen my heart to trust and obey You even when the destination is not clear. Gen. 12:1.",
        "Lord Jesus, empower me by Your Spirit to walk in the same level of obedience that You displayed on the cross. Phil. 2:8."
    ],
});


    const formatScriptureText = (text: string) => {
        const parts = text.split(/(\d+)/);
        return parts.map((part, index) => {
            if (/^\d+$/.test(part)) {
                return (
                    <strong key={index} className="font-bold">
                        {part}
                    </strong>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setAppLoading(false), 500);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
        return () => clearInterval(interval);
    }, []);

    const toggleTheme = () => setDarkMode(!darkMode);
    const adjustFontSize = (delta: number) =>
        setFontSize((prev) => Math.min(Math.max(prev + delta, 12), 24));
    const handleTabChange = (tab: string) => {
        setLoading(true);
        setTimeout(() => {
            setActiveTab(tab);
            setLoading(false);
        }, 500);
    };

    const showBibleVersions = (reference: string) => {
        setSelectedVerse(reference);
        setShowVerseModal(true);
        setVerseLoading(true);
        setTimeout(() => setVerseLoading(false), 800);
    };

    const changeBibleVersion = (version: keyof BibleVersions) => {
        setVerseLoading(true);
        setTimeout(() => {
            setBibleVersion(version);
            setVerseLoading(false);
        }, 600);
    };

    const addNewScripture = () => {
        if (
            newVerse.reference &&
            Object.values(newVerse.versions).some((v) => v !== "")
        ) {
            setScriptureDB((prev) => ({
                ...prev,
                [newVerse.reference]: newVerse.versions,
            }));
            setNewVerse({
                reference: "",
                versions: {
                    KJV: "",
                    NKJV: "",
                    NIV: "",
                    ESV: "",
                    AMP: "",
                    NLT: "",
                    MSG: "",
                },
            });
            setEditMode(false);
        }
    };

    const updateVerseVersion = (version: keyof BibleVersions, text: string) => {
        setNewVerse((prev) => ({
            ...prev,
            versions: { ...prev.versions, [version]: text },
        }));
    };

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | undefined;
        if (quizActive && timeLeft > 0 && !showResults) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        endQuiz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [quizActive, timeLeft, showResults]);

    const startQuiz = () => {
        setQuizActive(true);
        setCurrentQuestion(0);
        setScore(0);
        setTimeLeft(50);
        setShowResults(false);
    };

    const checkAnswer = (choice: number) => {
        if (!quizActive || showResults) return;
        const correct = quizQuestions[currentQuestion].correct === choice;
        const timeBonus = Math.floor(timeLeft / 10);
        const points = correct ? 10 + timeBonus : 0;
        if (correct) setScore((prev) => prev + points);
        if (currentQuestion < quizQuestions.length - 1) {
            setTimeout(() => setCurrentQuestion((prev) => prev + 1), 1000);
        } else {
            setTimeout(() => endQuiz(), 1000);
        }
    };

    const endQuiz = () => {
        setQuizActive(false);
        setShowResults(true);
    };

    

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === "M") {
                e.preventDefault();
                handleTabChange("manage");
            }
            if (e.ctrlKey && e.shiftKey && e.key === "E") {
                e.preventDefault();
                setEditingContent(editingContent ? null : activeTab);
            }
        };
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [editingContent, activeTab]);

    const updateContent = (field: string, value: string) =>
        setContentData((prev) => ({ ...prev, [field]: value }));
    const updateLessonPoint = (index: number, field: string, value: string) => {
        setContentData((prev) => ({
            ...prev,
            lessonPoints: prev.lessonPoints.map((point, i) =>
                i === index ? { ...point, [field]: value } : point
            ),
        }));
    };
    const updatePrayerPoint = (index: number, value: string) => {
        setContentData((prev) => ({
            ...prev,
            prayerPoints: prev.prayerPoints.map((prayer, i) =>
                i === index ? value : prayer
            ),
        }));
    };
    const updateLessonSubPoint = (
        pointIndex: number,
        subIndex: number,
        field: string,
        value: string
    ) => {
        setContentData((prev) => ({
            ...prev,
            lessonPoints: prev.lessonPoints.map((point, i) =>
                i === pointIndex
                    ? {
                          ...point,
                          subPoints: point.subPoints.map((sub, j) =>
                              j === subIndex ? { ...sub, [field]: value } : sub
                          ),
                      }
                    : point
            ),
        }));
    };
    const addLessonSubPoint = (pointIndex: number) => {
        setContentData((prev) => ({
            ...prev,
            lessonPoints: prev.lessonPoints.map((point, i) =>
                i === pointIndex
                    ? {
                          ...point,
                          subPoints: [
                              ...point.subPoints,
                              {
                                  title: "New Point",
                                  content: "",
                                  scripture: "",
                              },
                          ],
                      }
                    : point
            ),
        }));
    };
    const deleteLessonSubPoint = (pointIndex: number, subIndex: number) => {
        setContentData((prev) => ({
            ...prev,
            lessonPoints: prev.lessonPoints.map((point, i) =>
                i === pointIndex
                    ? {
                          ...point,
                          subPoints: point.subPoints.filter(
                              (_, j) => j !== subIndex
                          ),
                      }
                    : point
            ),
        }));
    };
    const addPrayerPoint = () =>
        setContentData((prev) => ({
            ...prev,
            prayerPoints: [...prev.prayerPoints, "New prayer point..."],
        }));

    const PAYSTACK_PUBLIC_KEY =
        "pk_test_bed97038ebcf74b30219ed0500cfffc6e80948f1";
    const PAYMENT_AMOUNT = 500000;

    const handlePaystackSuccess = (reference: unknown) => {
        console.log("Payment successful:", reference);
        setIsPaid(true);
        setShowPaymentGate(false);
    };

    const handlePaystackClose = () => console.log("Payment closed");

    const initializePaystack = () => {
        if (!window.PaystackPop) {
            alert("Paystack script not loaded!");
            return;
        }
        const paystack = window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: "user@example.com",
            amount: PAYMENT_AMOUNT,
            currency: "NGN",
            reference: "SSA_" + Math.floor(Math.random() * 1000000000 + 1),
            onClose: () => handlePaystackClose(),
            callback: (transaction: PaystackResponse) =>
                handlePaystackSuccess(transaction),
        });
        paystack.openIframe();
    };

    const handleFreePlan = () => {
        setShowPaymentGate(false);
        setIsPaid(false);
    };

    const themeClasses = darkMode
        ? "bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white"
        : "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 text-gray-900";


        
    if (appLoading) {
        const animatedText = "Progress Through Thanksgiving".split("");

            return (
                <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="relative mb-8">
                            <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                                <img
                                    src={logo}
                                    alt="Logo"
                                    className="w-20 h-20 object-contain"
                                />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-32 h-32 rounded-full border-4 border-white/30 animate-ping"></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div
                                    className="w-40 h-40 rounded-full border-4 border-white/20 animate-ping"
                                    style={{ animationDelay: "0.3s" }}
                                ></div>
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Life Gate Ministries Worldwide
                        </h1>
                        <p className="text-xl text-white/90 mb-8">
                            Sunday School Lessons
                        </p>

                        {/* Single-color glowing neon text */}
                        <div className="flex justify-center mb-6 text-3xl md:text-4xl font-extrabold">
                            {animatedText.map((char, idx) => (
                                <span
                                    key={idx}
                                    className="inline-block text-blue-400 drop-shadow-[0_0_10px_#00ffff] animate-[wave_1.5s_ease-in-out_infinite]"
                                    style={{
                                        animationDelay: `${idx * 0.1}s`,
                                    }}
                                >
                                    {char === " " ? "\u00A0" : char}
                                </span>
                            ))}
                        </div>

                        <div className="text-white/80 mb-6 text-lg animate-pulse">
                            Loading Sunday School Lesson...
                        </div>
                        <div className="w-64 mx-auto bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-300 ease-out shadow-lg"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-white/70 mt-3 text-sm">
                            {loadingProgress}%
                        </p>
                    </div>

                    {/* Keyframes for smooth wave bounce */}
                    <style>
                        {`
                            @keyframes wave {
                                0%, 100% { transform: translateY(0); }
                                25% { transform: translateY(-12px); }
                                50% { transform: translateY(8px); }
                                75% { transform: translateY(-6px); }
                            }
                        `}
                    </style>
                </div>
            );
        }




    if (showPaymentGate) {
        return (
            <div
                className={`min-h-screen ${themeClasses} flex items-center justify-center p-4 relative overflow-hidden`}
            >
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
                    <div
                        className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse"
                        style={{ animationDelay: "1s" }}
                    ></div>
                    <div
                        className="absolute w-64 h-64 bg-pink-500/20 rounded-full blur-3xl top-1/2 left-1/2 animate-pulse"
                        style={{ animationDelay: "2s" }}
                    ></div>
                </div>
                <div className="max-w-4xl w-full relative z-10">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 mx-auto mb-6 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/20">
                            <img
                                src={logo}
                                alt="Logo"
                                className="w-16 h-16 object-contain"
                            />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Sunday School Lesson
                        </h1>
                        <p className="text-xl opacity-80">
                            LOVING THE LORD YOUR GOD
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition duration-300 shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold">
                                        Free Access
                                    </h3>
                                    <Unlock
                                        className="text-green-400"
                                        size={32}
                                    />
                                </div>
                                <div className="mb-6">
                                    <p className="text-4xl font-bold mb-2">
                                        ₦0
                                    </p>
                                    <p className="opacity-70">View Only Mode</p>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle
                                            size={20}
                                            className="text-green-400"
                                        />
                                        <span>Read all lesson content</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle
                                            size={20}
                                            className="text-green-400"
                                        />
                                        <span>Take interactive quizzes</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <X size={20} className="text-red-400" />
                                        <span className="opacity-50">
                                            No content editing
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <X size={20} className="text-red-400" />
                                        <span className="opacity-50">
                                            No scripture management
                                        </span>
                                    </li>
                                </ul>
                                <button
                                    onClick={handleFreePlan}
                                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-semibold text-white shadow-lg transform hover:scale-105 transition duration-300"
                                >
                                    Continue Free
                                </button>
                            </div>
                        </div>
                        <div className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition duration-300 shadow-2xl">
                                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    BEST VALUE
                                </div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold">
                                        Premium Access
                                    </h3>
                                    <Lock
                                        className="text-purple-400"
                                        size={32}
                                    />
                                </div>
                                <div className="mb-6">
                                    <p className="text-4xl font-bold mb-2">
                                        ₦5,000
                                    </p>
                                    <p className="opacity-70">Full Access</p>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle
                                            size={20}
                                            className="text-purple-400"
                                        />
                                        <span>Everything in Free</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle
                                            size={20}
                                            className="text-purple-400"
                                        />
                                        <span>Edit all lesson content</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle
                                            size={20}
                                            className="text-purple-400"
                                        />
                                        <span>Manage Bible scriptures</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle
                                            size={20}
                                            className="text-purple-400"
                                        />
                                        <span>Save your commitments</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle
                                            size={20}
                                            className="text-purple-400"
                                        />
                                        <span>Priority support</span>
                                    </li>
                                </ul>
                                <button
                                    onClick={initializePaystack}
                                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl font-semibold text-white shadow-lg transform hover:scale-105 transition duration-300"
                                >
                                    Unlock Premium
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-center mt-8 opacity-70 text-sm">
                        Secure payment powered by Paystack • All transactions
                        are encrypted
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen ${themeClasses} transition-all duration-500 relative`}
            style={{ fontSize: `${fontSize}px` }}
        >
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl top-0 left-1/4 animate-pulse"></div>
                <div
                    className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl bottom-0 right-1/4 animate-pulse"
                    style={{ animationDelay: "1s" }}
                ></div>
            </div>
            <Header
                logo={logo}
                contentData={contentData}
                fontSize={fontSize}
                adjustFontSize={adjustFontSize}
                darkMode={darkMode}
                toggleTheme={toggleTheme}
            />
            <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {contentData.lessonTitle}
                </h2>
                <div className="flex gap-2 mb-6 overflow-x-auto flex-nowrap md:flex-wrap justify-start md:justify-center scrollbar-hide backdrop-blur-sm bg-white/5 p-2 rounded-2xl border border-white/10">
                    {[
                        "intro",
                        "lesson",
                        "conclusion",
                        "application",
                        "quiz",
                        "prayer",
                    ].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all flex-shrink-0 ${
                                activeTab === tab
                                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg scale-105"
                                    : darkMode
                                    ? "bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10"
                                    : "bg-black/10 backdrop-blur-md hover:bg-black/20 border border-black/10"
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                    {isPaid && (
                        <button
                            onClick={() => handleTabChange("manage")}
                            className={`px-2 py-3 rounded-xl font-semibold transition-all flex-shrink-0 opacity-0 hover:opacity-10 ${
                                activeTab === "manage"
                                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg scale-105"
                                    : "bg-white/10 backdrop-blur-md"
                            }`}
                            title="Admin"
                            style={{ width: "40px" }}
                        >
                            <Edit2 size={16} className="mx-auto" />
                        </button>
                    )}
                </div>
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                    </div>
                )}
                {!loading && (
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8">
                        {activeTab === "intro" && (
                            <div className="space-y-6">
                                {editingContent === "intro" && (
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 rounded-lg p-3 mb-4 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Edit2
                                                size={16}
                                                className="text-yellow-700"
                                            />
                                            <span className="text-yellow-700 dark:text-yellow-400 font-semibold">
                                                Edit Mode Active
                                            </span>
                                        </span>
                                        <button
                                            onClick={() =>
                                                setEditingContent(null)
                                            }
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Done Editing
                                        </button>
                                    </div>
                                )}
                                <div
                                    className={`${
                                        darkMode
                                            ? "bg-blue-900/30"
                                            : "bg-blue-50"
                                    } p-6 rounded-lg border-l-4 border-blue-600`}
                                >
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                        <BookOpen className="text-blue-600" />{" "}
                                        Memory Verse
                                    </h3>
                                    {editingContent === "intro" ? (
                                        <textarea
                                            value={contentData.memoryVerse}
                                            onChange={(e) =>
                                                updateContent(
                                                    "memoryVerse",
                                                    e.target.value
                                                )
                                            }
                                            className={`w-full px-4 py-2 rounded-lg border text-xl italic mb-4 ${
                                                darkMode
                                                    ? "bg-gray-800 border-gray-600"
                                                    : "bg-white border-gray-300"
                                            }`}
                                            rows={2}
                                        />
                                    ) : (
                                        <blockquote className="text-xl italic mb-4">
                                            "{contentData.memoryVerse}"
                                        </blockquote>
                                    )}
                                    <button
                                        onClick={() =>
                                            showBibleVersions(
                                                contentData.memoryVerseRef
                                            )
                                        }
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                                    >
                                        <BookOpen size={16} />
                                        Read {contentData.memoryVerseRef}
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-3">
                                        Text: Genesis 12:1-5
                                    </h3>
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={() =>
                                                showBibleVersions(
                                                    "Genesis 12:1-5"
                                                )
                                            }
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                                        >
                                        <BookOpen size={16} />
                                            Read Genesis 12:1-5
                                        </button>

                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-3">
                                        Introduction
                                    </h3>
                                    {editingContent === "intro" ? (
                                        <textarea
                                            value={contentData.introduction}
                                            onChange={(e) =>
                                                updateContent(
                                                    "introduction",
                                                    e.target.value
                                                )
                                            }
                                            className={`w-full px-4 py-2 rounded-lg border ${
                                                darkMode
                                                    ? "bg-gray-800 border-gray-600"
                                                    : "bg-white border-gray-300"
                                            }`}
                                            rows={6}
                                        />
                                    ) : (
                                        <p className="leading-relaxed">
                                            {contentData.introduction}
                                            <div className="mt-4 flex flex-wrap gap-2">
                                            {contentData.lessonIntroScriptures.map(
                                                (scripture) => (
                                                    <button
                                                        key={scripture}
                                                        onClick={() =>
                                                            showBibleVersions(
                                                                scripture
                                                            )
                                                        }
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
                                                    >
                                                        <BookOpen size={14} />
                                                        {scripture}
                                                    </button>
                                                )
                                            )}
                                    
                                        </div>
                                            
                                        </p>
                                        
                                    )}
                                   
                                </div>
                                <div
                                    className={`${
                                        darkMode
                                            ? "bg-green-900/30"
                                            : "bg-green-50"
                                    } p-6 rounded-lg`}
                                >
                                    
                                   
                                    <h3 className="text-xl font-bold mb-3">
                                        Aims and Objectives
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <strong className="text-green-700 dark:text-green-400">
                                                AIMS:
                                            </strong>
                                            {editingContent === "intro" ? (
                                                <textarea
                                                    value={contentData.aims}
                                                    onChange={(e) =>
                                                        updateContent(
                                                            "aims",
                                                            e.target.value
                                                        )
                                                    }
                                                    className={`w-full px-3 py-2 rounded-lg border mt-2 ${
                                                        darkMode
                                                            ? "bg-gray-800 border-gray-600"
                                                            : "bg-white border-gray-300"
                                                    }`}
                                                    rows={3}
                                                />
                                            ) : (
                                                <p>{contentData.aims}</p>
                                            )}
                                        </div>
                                        <div>
                                            <strong className="text-green-700 dark:text-green-400">
                                                OBJECTIVES:
                                            </strong>
                                            {editingContent === "intro" ? (
                                                <textarea
                                                    value={
                                                        contentData.objectives
                                                    }
                                                    onChange={(e) =>
                                                        updateContent(
                                                            "objectives",
                                                            e.target.value
                                                        )
                                                    }
                                                    className={`w-full px-3 py-2 rounded-lg border mt-2 ${
                                                        darkMode
                                                            ? "bg-gray-800 border-gray-600"
                                                            : "bg-white border-gray-300"
                                                    }`}
                                                    rows={2}
                                                />
                                            ) : (
                                                <p>{contentData.objectives}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === "lesson" && (
                            <div className="space-y-6">
                                {editingContent === "lesson" && (
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 rounded-lg p-3 mb-4 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Edit2
                                                size={16}
                                                className="text-yellow-700"
                                            />
                                            <span className="text-yellow-700 dark:text-yellow-400 font-semibold">
                                                Edit Mode Active
                                            </span>
                                        </span>
                                        <button
                                            onClick={() =>
                                                setEditingContent(null)
                                            }
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Done Editing
                                        </button>
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold mb-4">
                                    Lesson Content
                                </h3>
                                {editingContent === "lesson" ? (
                                    <textarea
                                        value={contentData.lessonIntro}
                                        onChange={(e) =>
                                            updateContent(
                                                "lessonIntro",
                                                e.target.value
                                            )
                                        }
                                        className={`w-full px-4 py-2 rounded-lg border mb-4 ${
                                            darkMode
                                                ? "bg-gray-800 border-gray-600"
                                                : "bg-white border-gray-300"
                                        }`}
                                        rows={3}
                                    />
                                ) : (
                                    <p className="leading-relaxed mb-4">
                                        {contentData.lessonIntro}
                                        {/* <div className="mt-4 flex flex-wrap gap-2">
                                            {contentData.lessonIntroScriptures.map(
                                                (scripture) => (
                                                    <button
                                                        key={scripture}
                                                        onClick={() =>
                                                            showBibleVersions(
                                                                scripture
                                                            )
                                                        }
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
                                                    >
                                                        <BookOpen size={14} />
                                                        {scripture}
                                                    </button>
                                                )
                                            )}
                                    
                                        </div> */}
                                        
                                    </p>
                                    
                                )}
                                <div className="space-y-6">
                                    {contentData.lessonPoints.map(
                                        (section, idx) => (
                                            <div
                                                key={idx}
                                                className={`${
                                                    darkMode
                                                        ? "bg-gray-700"
                                                        : "bg-gray-50"
                                                } p-5 rounded-lg`}
                                            >
                                                {editingContent === "lesson" ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={
                                                                section.title
                                                            }
                                                            onChange={(e) =>
                                                                updateLessonPoint(
                                                                    idx,
                                                                    "title",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className={`w-full px-3 py-2 rounded-lg border mb-3 text-xl font-semibold ${
                                                                darkMode
                                                                    ? "bg-gray-800 border-gray-600"
                                                                    : "bg-white border-gray-300"
                                                            }`}
                                                        />
                                                        {section.content && (
                                                            <textarea
                                                                value={
                                                                    section.content
                                                                }
                                                                onChange={(e) =>
                                                                    updateLessonPoint(
                                                                        idx,
                                                                        "content",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className={`w-full px-3 py-2 rounded-lg border mb-3 ${
                                                                    darkMode
                                                                        ? "bg-gray-800 border-gray-600"
                                                                        : "bg-white border-gray-300"
                                                                }`}
                                                                rows={3}
                                                            />
                                                        )}
                                                        <div className="ml-6 space-y-3 mt-3">
                                                            {section.subPoints.map(
                                                                (
                                                                    subPoint,
                                                                    subIdx
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            subIdx
                                                                        }
                                                                        className={`${
                                                                            darkMode
                                                                                ? "bg-gray-800"
                                                                                : "bg-white"
                                                                        } p-3 rounded-lg`}
                                                                    >
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <span className="text-sm font-bold text-yellow-600">
                                                                                {String.fromCharCode(
                                                                                    97 +
                                                                                        subIdx
                                                                                )}

                                                                                .
                                                                            </span>
                                                                            <button
                                                                                onClick={() =>
                                                                                    deleteLessonSubPoint(
                                                                                        idx,
                                                                                        subIdx
                                                                                    )
                                                                                }
                                                                                className="text-red-600 hover:text-red-800"
                                                                            >
                                                                                <X
                                                                                    size={
                                                                                        16
                                                                                    }
                                                                                />
                                                                            </button>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={
                                                                                subPoint.title
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateLessonSubPoint(
                                                                                    idx,
                                                                                    subIdx,
                                                                                    "title",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            placeholder="Sub-point title"
                                                                            className={`w-full px-3 py-1 rounded border mb-2 text-sm font-semibold ${
                                                                                darkMode
                                                                                    ? "bg-gray-700 border-gray-600"
                                                                                    : "bg-gray-50 border-gray-300"
                                                                            }`}
                                                                        />
                                                                        <textarea
                                                                            value={
                                                                                subPoint.content
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateLessonSubPoint(
                                                                                    idx,
                                                                                    subIdx,
                                                                                    "content",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            placeholder="Sub-point content"
                                                                            className={`w-full px-3 py-1 rounded border mb-2 text-sm ${
                                                                                darkMode
                                                                                    ? "bg-gray-700 border-gray-600"
                                                                                    : "bg-gray-50 border-gray-300"
                                                                            }`}
                                                                            rows={
                                                                                2
                                                                            }
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={
                                                                                subPoint.scriptures ||
                                                                                ""
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateLessonSubPoint(
                                                                                    idx,
                                                                                    subIdx,
                                                                                    "scripture",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            placeholder="Scripture reference (optional)"
                                                                            className={`w-full px-3 py-1 rounded border text-sm ${
                                                                                darkMode
                                                                                    ? "bg-gray-700 border-gray-600"
                                                                                    : "bg-gray-50 border-gray-300"
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                )
                                                            )}
                                                            <button
                                                                onClick={() =>
                                                                    addLessonSubPoint(
                                                                        idx
                                                                    )
                                                                }
                                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                                            >
                                                                <Plus
                                                                    size={14}
                                                                />{" "}
                                                                Add Sub-point
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h4 className="text-xl font-semibold mb-2">
                                                            {idx + 1}.{" "}
                                                            {section.title}
                                                        </h4>
                                                        {section.content && (
                                                            <p className="leading-relaxed mb-3">
                                                                {
                                                                    section.content
                                                                }
                                                            </p>
                                                        )}
                                                        {section.scriptures &&
                                                            section.scriptures
                                                                .length > 0 && (
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    {section.scriptures.map(
                                                                        (
                                                                            scripture
                                                                        ) => (
                                                                            <button
                                                                                key={
                                                                                    scripture
                                                                                }
                                                                                onClick={() =>
                                                                                    showBibleVersions(
                                                                                        scripture
                                                                                    )
                                                                                }
                                                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition flex items-center gap-2 text-sm"
                                                                            >
                                                                                <BookOpen
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                                {
                                                                                    scripture
                                                                                }
                                                                            </button>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                        {section.subPoints &&
                                                            section.subPoints
                                                                .length > 0 && (
                                                                <ol className="list-[lower-alpha] ml-6 space-y-3 mt-3">
                                                                    {section.subPoints.map(
                                                                        (
                                                                            subPoint,
                                                                            subIdx
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    subIdx
                                                                                }
                                                                            >
                                                                                <strong>
                                                                                    {
                                                                                        subPoint.title
                                                                                    }

                                                                                    :
                                                                                </strong>{" "}
                                                                                {
                                                                                    subPoint.content
                                                                                }
                                                                                <div className="flex flex-row flex-wrap items-center gap-2 mt-2">
                                                                                {subPoint.scriptures?.map((ref, i) => (
                                                                                    <button
                                                                                    key={i}
                                                                                    onClick={() => showBibleVersions(ref)}
                                                                                    className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap px-3 py-1 rounded-lg transition flex items-center gap-2 text-sm flex-shrink-0"
                                                                                    >
                                                                                    📖 Read {ref}
                                                                                    </button>
                                                                                ))}
                                                                                </div>
                                                                            </li>
                                                                        )
                                                                    )}
                                                                </ol>
                                                            )}
                                                    </>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === "conclusion" && (
                            <div className="space-y-4">
                                {editingContent === "conclusion" && (
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 rounded-lg p-3 mb-4 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Edit2
                                                size={16}
                                                className="text-yellow-700"
                                            />
                                            <span className="text-yellow-700 dark:text-yellow-400 font-semibold">
                                                Edit Mode Active
                                            </span>
                                        </span>
                                        <button
                                            onClick={() =>
                                                setEditingContent(null)
                                            }
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Done Editing
                                        </button>
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold mb-4">
                                    Conclusion
                                </h3>
                                {editingContent === "conclusion" ? (
                                    <textarea
                                        value={contentData.conclusion}
                                        onChange={(e) =>
                                            updateContent(
                                                "conclusion",
                                                e.target.value
                                            )
                                        }
                                        className={`w-full px-4 py-2 rounded-lg border text-lg ${
                                            darkMode
                                                ? "bg-gray-800 border-gray-600"
                                                : "bg-white border-gray-300"
                                        }`}
                                        rows={4}
                                    />
                                ) : (
                                    <p className="text-lg leading-relaxed">
                                        {contentData.conclusion}
                                    </p>
                                )}
                                {contentData.conclusionScriptures &&
                                    contentData.conclusionScriptures.length >
                                        0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {contentData.conclusionScriptures.map(
                                                (scripture) => (
                                                    <button
                                                        key={scripture}
                                                        onClick={() =>
                                                            showBibleVersions(
                                                                scripture
                                                            )
                                                        }
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
                                                    >
                                                        <BookOpen size={14} />
                                                        {scripture}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                            </div>
                        )}


                        
            


{activeTab === "application" && (
    <div className="space-y-6">
        <h3 className="text-2xl font-bold mb-4 text-center">🛡️ Living in Obedience</h3>

        {/* Obedience Reflection Meter */}
        <div
            className={`${
                darkMode
                    ? "bg-gray-700 border-blue-900"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100"
            } p-6 rounded-2xl border-2 shadow-sm`}
        >
            <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                📊 Obedience Check
            </h4>

            <p className="mb-6 text-sm opacity-80 leading-relaxed">
                God’s commands are perfect and purposeful. How aligned are you today with His will,
                instructions, and direction? Reflect honestly and assess your current obedience walk.
            </p>

            <div className="space-y-4">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-mono uppercase tracking-wider">
                        Alignment Level
                    </span>

                    <span
                        className={`text-3xl font-black ${
                            loveRating > 7
                                ? "text-green-500"
                                : loveRating > 4
                                ? "text-orange-500"
                                : "text-red-500"
                        }`}
                    >
                        {loveRating * 10}%
                    </span>
                </div>

                <div className="h-8 w-full bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
                    <div
                        className={`h-full transition-all duration-500 ${
                            loveRating > 7
                                ? "bg-green-500"
                                : loveRating > 4
                                ? "bg-orange-400"
                                : "bg-red-500"
                        }`}
                        style={{ width: `${loveRating * 10}%` }}
                    />
                </div>

                <input
                    type="range"
                    min="1"
                    max="10"
                    value={loveRating}
                    onChange={(e) => setLoveRating(Number(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            <div
                className={`mt-6 p-4 rounded-xl text-center text-sm font-medium leading-relaxed ${
                    darkMode ? "bg-gray-800" : "bg-white shadow-sm"
                }`}
            >
                {loveRating >= 8
                    ? "✅ You are walking in strong obedience. Continue yielding your will to God daily."
                    : loveRating >= 5
                    ? "⚡ Growth is happening. Strengthen your obedience through prayer, Scripture, and immediate response to God's voice."
                    : "⚠️ Your obedience needs renewal. Return to surrender, repentance, and trust in God's leading."}
            </div>
        </div>

        {/* Daily Obedience Commitment */}
        <div
            className={`${
                darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-2 border-dashed border-blue-200"
            } p-6 rounded-2xl`}
        >
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                📝 Today's Obedience Action
            </h4>

            <p className="text-sm mb-4 leading-relaxed">
                What one practical step will you take today to obey God despite
                inconvenience, feelings, uncertainty, or delay?
            </p>

            <div className="flex flex-col gap-3 mb-6">
                <input
                    type="text"
                    value={commitmentInput}
                    onChange={(e) => setCommitmentInput(e.target.value)}
                    placeholder="E.g., Forgive someone, pray early, stop a sinful habit..."
                    className={`flex-1 px-4 py-3 rounded-xl border-2 outline-none focus:border-blue-400 transition ${
                        darkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-gray-50 border-gray-200"
                    }`}
                />

                <button
                    onClick={addCommitment}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                    <Save size={18} /> SAVE ACTION
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {commitments.map((commitment, idx) => (
                    <div
                        key={idx}
                        className={`p-4 rounded-xl flex items-center gap-4 ${
                            darkMode
                                ? "bg-gray-800"
                                : "bg-blue-50 border border-blue-100"
                        }`}
                    >
                        <div className="bg-white p-2 rounded-full shadow-sm">
                            <CheckCircle className="text-blue-500" size={24} />
                        </div>

                        <div className="flex-1">
                            <p className="font-bold text-gray-800 dark:text-gray-100">
                                {commitment.text}
                            </p>

                            <p className="text-[10px] uppercase font-black opacity-40 mt-1">
                                Logged: {commitment.date}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 text-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Reflection
                </p>

                <p className="text-sm italic font-medium leading-relaxed">
                    “And being found in fashion as a man, he humbled himself, and became obedient unto death...” (Phil. 2:8).  
                    Jesus is our perfect example of complete obedience.
                </p>
            </div>
        </div>
    </div>
)}









                        {activeTab === "quiz" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-bold">
                                        Speed Quiz Challenge
                                    </h3>
                                    {quizActive && (
                                        <div className="flex gap-4 items-center">
                                            <div className="flex items-center gap-2">
                                                <Clock className="text-blue-600" />
                                                <span className="text-xl font-bold">
                                                    {timeLeft}s
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Award className="text-yellow-600" />
                                                <span className="text-xl font-bold">
                                                    {score}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {!quizActive && !showResults && (
                                    <div className="text-center py-12">
                                        <Award
                                            size={64}
                                            className="mx-auto mb-4 text-yellow-600"
                                        />
                                        <h4 className="text-2xl font-bold mb-4">
                                            Ready to Test Your Knowledge?
                                        </h4>
                                        <p className="mb-6 text-lg">
                                            Answer quickly for bonus points!
                                        </p>
                                        <button
                                            onClick={startQuiz}
                                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-xl font-semibold transition transform hover:scale-105"
                                        >
                                            Start Quiz
                                        </button>
                                    </div>
                                )}
                                {quizActive && !showResults && (
                                    <div>
                                        <div
                                            className={`${
                                                darkMode
                                                    ? "bg-gray-700"
                                                    : "bg-blue-50"
                                            } p-6 rounded-lg mb-6`}
                                        >
                                            <h4 className="text-xl font-semibold mb-4">
                                                Question {currentQuestion + 1}{" "}
                                                of {quizQuestions.length}
                                            </h4>
                                            <p className="text-lg mb-6">
                                                {
                                                    quizQuestions[
                                                        currentQuestion
                                                    ].q
                                                }
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {quizQuestions[
                                                    currentQuestion
                                                ].a.map((answer, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() =>
                                                            checkAnswer(idx)
                                                        }
                                                        className={`${
                                                            darkMode
                                                                ? "bg-gray-800 hover:bg-gray-900"
                                                                : "bg-white hover:bg-gray-50"
                                                        } p-4 rounded-lg border-2 border-blue-600 transition transform hover:scale-105 text-left`}
                                                    >
                                                        <span className="font-bold text-blue-600 mr-2">
                                                            {String.fromCharCode(
                                                                65 + idx
                                                            )}
                                                            .
                                                        </span>
                                                        {answer}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {showResults && (
                                    <div className="text-center space-y-6">
                                        <Award
                                            size={80}
                                            className="mx-auto text-yellow-600"
                                        />
                                        <h4 className="text-3xl font-bold">
                                            Quiz Complete!
                                        </h4>
                                        <div
                                            className={`${
                                                darkMode
                                                    ? "bg-gray-700"
                                                    : "bg-gradient-to-r from-blue-50 to-indigo-50"
                                            } p-8 rounded-lg`}
                                        >
                                            <p className="text-5xl font-bold text-blue-600 mb-2">
                                                {score}
                                            </p>
                                            <p className="text-xl">
                                                Final Score
                                            </p>
                                            <p className="mt-4 text-lg">
                                                {score >= 100
                                                    ? "Outstanding! Excellent knowledge!"
                                                    : score >= 60
                                                    ? "Great work! Keep studying!"
                                                    : "Good effort! Review the lesson."}
                                            </p>
                                        </div>
                                        <button
                                            onClick={startQuiz}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === "prayer" && (
                            <div className="space-y-4">
                                {editingContent === "prayer" && (
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 rounded-lg p-3 mb-4 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Edit2
                                                size={16}
                                                className="text-yellow-700"
                                            />
                                            <span className="text-yellow-700 dark:text-yellow-400 font-semibold">
                                                Edit Mode Active
                                            </span>
                                        </span>
                                        <button
                                            onClick={() =>
                                                setEditingContent(null)
                                            }
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Done Editing
                                        </button>
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold mb-6">
                                    Prayer Points
                                </h3>
                               



                                    <div className="space-y-4">
    {contentData.prayerPoints.map((prayer, idx) => (
        <div
            key={idx}
            className={`${
                darkMode
                    ? "bg-gray-700 border-purple-900"
                    : "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
            } p-6 rounded-xl border-l-4 transition-all hover:shadow-md`}
        >
            {editingContent === "prayer" ? (
                <textarea
                    value={prayer}
                    onChange={(e) =>
                        updatePrayerPoint(
                            idx,
                            e.target.value
                        )
                    }
                    className={`w-full px-3 py-2 rounded-lg border font-medium ${
                        darkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-800"
                    }`}
                    rows={3}
                />
            ) : (
                <div className="flex items-start gap-3">
                    <span className="text-2xl mt-1">
                        {idx === 0 ? "🤝" : idx === 1 ? "💎" : idx === 2 ? "🧠" : "⚡"}
                    </span>
                    <p className={`text-lg leading-relaxed font-medium italic ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>
                        "{prayer}"
                    </p>
                </div>
            )}
        </div>
    ))}
</div>





                                {editingContent === "prayer" && (
                                    <button
                                        onClick={addPrayerPoint}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Add Prayer Point
                                    </button>
                                )}
                            </div>
                        )}
                        {activeTab === "manage" && isPaid && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-bold">
                                        Manage Scriptures
                                    </h3>
                                    <button
                                        onClick={() => setEditMode(!editMode)}
                                        className={`${
                                            editMode
                                                ? "bg-red-600 hover:bg-red-700"
                                                : "bg-green-600 hover:bg-green-700"
                                        } text-white px-4 py-2 rounded-lg transition flex items-center gap-2`}
                                    >
                                        {editMode ? (
                                            <>
                                                <X size={16} /> Cancel
                                            </>
                                        ) : (
                                            <>
                                                <Edit2 size={16} /> Add New
                                            </>
                                        )}
                                    </button>
                                </div>
                                {editMode && (
                                    <div
                                        className={`${
                                            darkMode
                                                ? "bg-gray-700"
                                                : "bg-blue-50"
                                        } p-6 rounded-lg space-y-4`}
                                    >
                                        <input
                                            type="text"
                                            value={newVerse.reference}
                                            onChange={(e) =>
                                                setNewVerse({
                                                    ...newVerse,
                                                    reference: e.target.value,
                                                })
                                            }
                                            placeholder="Scripture Reference (e.g., John 3:16)"
                                            className={`w-full px-4 py-2 rounded-lg border ${
                                                darkMode
                                                    ? "bg-gray-800 border-gray-600"
                                                    : "bg-white border-gray-300"
                                            }`}
                                        />
                                        {(
                                            [
                                                "KJV",
                                                "NKJV",
                                                "NIV",
                                                "ESV",
                                                "AMP",
                                                "NLT",
                                            ] as const
                                        ).map((version) => (
                                            <div key={version}>
                                                <label className="block font-semibold mb-2">
                                                    {version}
                                                </label>
                                                <textarea
                                                    value={
                                                        newVerse.versions[
                                                            version
                                                        ] || ""
                                                    }
                                                    onChange={(e) =>
                                                        updateVerseVersion(
                                                            version,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={`Enter ${version} text...`}
                                                    rows={3}
                                                    className={`w-full px-4 py-2 rounded-lg border ${
                                                        darkMode
                                                            ? "bg-gray-800 border-gray-600"
                                                            : "bg-white border-gray-300"
                                                    }`}
                                                />
                                            </div>
                                        ))}
                                        <button
                                            onClick={addNewScripture}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2"
                                        >
                                            <Save size={16} /> Save Scripture
                                        </button>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {Object.keys(scriptureDB).map(
                                        (reference) => (
                                            <div
                                                key={reference}
                                                className={`${
                                                    darkMode
                                                        ? "bg-gray-700"
                                                        : "bg-white border border-gray-200"
                                                } p-4 rounded-lg`}
                                            >
                                                <h4 className="font-bold text-lg mb-2">
                                                    {reference}
                                                </h4>
                                                <button
                                                    onClick={() =>
                                                        showBibleVersions(
                                                            reference
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    View All Versions →
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === "manage" && !isPaid && (
                            <div className="text-center py-12">
                                <Lock
                                    size={64}
                                    className="mx-auto mb-4 text-purple-400"
                                />
                                <h3 className="text-2xl font-bold mb-4">
                                    Premium Feature
                                </h3>
                                <p className="mb-6">
                                    Upgrade to Premium to access scripture
                                    management
                                </p>
                                <button
                                    onClick={() => setShowPaymentGate(true)}
                                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold"
                                >
                                    Unlock Now
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {showVerseModal && selectedVerse && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setShowVerseModal(false)}
                >
                    <div
                        className={`${
                            darkMode ? "bg-gray-800" : "bg-white"
                        } rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold">
                                    {selectedVerse}
                                </h3>
                                <button
                                    onClick={() => setShowVerseModal(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                            {(
                                [
                                    "KJV",
                                    "NKJV",
                                    "NIV",
                                    "ESV",
                                    "AMP",
                                    "NLT",
                                    "MSG",

                                ] as const
                            ).map((version) => (
                                <button
                                    key={version}
                                    onClick={() => changeBibleVersion(version)}
                                    disabled={verseLoading}
                                    className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                                        bibleVersion === version
                                            ? "bg-blue-600 text-white"
                                            : darkMode
                                            ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                    } ${
                                        verseLoading
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                    }`}
                                >
                                    {version}
                                </button>
                            ))}
                        </div>
                        <div
                            className="p-6 overflow-y-auto"
                            style={{ maxHeight: "calc(85vh - 180px)" }}
                        >
                            {verseLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="relative w-16 h-16 mb-4">
                                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                    </div>
                                    <p className="text-gray-500 animate-pulse">
                                        Loading scripture...
                                    </p>
                                </div>
                            ) : selectedVerse &&
                              scriptureDB[selectedVerse] &&
                              scriptureDB[selectedVerse][bibleVersion] ? (
                                <div className="text-lg leading-relaxed animate-fadeIn">
                                    {formatScriptureText(
                                        scriptureDB[selectedVerse][bibleVersion]
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">
                                    Translation not available
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SundaySchoolApp;
