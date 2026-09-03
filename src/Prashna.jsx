import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import {
  Mic, Volume2, ArrowLeft, RefreshCw, Globe, HelpCircle, QrCode, Keyboard, UserPlus, User,
  Camera, Upload, Check, X, AlertTriangle, ShieldAlert, FileText, Download, Timer,
  Stethoscope, Pill, Syringe, FlaskConical, Thermometer, Wind, Droplets, Brain, Bone,
  Eye, Hand, Activity, Heart, Baby, Cigarette, Wine, Briefcase, Utensils, Moon, Flame,
  Leaf, Scale, Trash2, Settings, LayoutGrid, Users, Play, CircleDot, Contrast, Type,
  ChevronRight, Clock, Ban, Sun, Waves, Zap, Sparkles, ClipboardList, ScanLine, Volume1, Search,
} from "lucide-react";

/* ============================================================================
   PRASHNA (प्रश्न) — patient intake kiosk + doctor review dashboard
   "Ayurveda's method of diagnosis by questioning"

   Team Stack Overlords · Smart India Hackathon 2026 · PS 26047
   Ministry of Ayush / All India Institute of Ayurveda (AIIA).

   Prashna is one of the three Pariksha, alongside Darshana (observation) and
   Sparshana (palpation). A kiosk can only perform Prashna — it cannot look at
   a patient or lay hands on one. That limit is the design, not a shortcoming:
   it is why every field here is patient-reported or OCR-derived, and it is why
   the GI_BLEED rule substitutes a proxy for abdominal rigidity below.

   SCOPE OF THIS FILE: frontend only, single process, no network, no credentials.
   All five provider adapters resolve to their MOCK implementation. Every screen
   that shows provider-derived data carries a LIVE / SIMULATED badge.

   NON-NEGOTIABLES ENFORCED IN CODE:
   - The app never produces a diagnosis, differential, treatment or dosage.
   - The summariser is extractive: every field carries a sourceId + the exact
     words the patient said (or that OCR read). No source -> field is omitted.
   - No free-text input anywhere in the patient flow.
   - OCR extractions below CONFIDENCE_GATE are never written to structured
     fields; the page is attached raw for the doctor to read.
   ========================================================================== */

const C = {
  navy: "#0E3A66", teal: "#0E7C86", saffron: "#C0561C", amber: "#E08A2B",
  green: "#1E7B45", ink: "#1A2733", bg: "#EAF3FB", peach: "#FBDCC4",
  mint: "#D8EDD5", white: "#FFFFFF",
  line: "#C4D8EA", muted: "#5B7185", navySoft: "#1B4F86",
};

const CONFIDENCE_GATE = 0.85;   // OCR: below this, no structured write
const ASR_GATE = 0.55;          // ASR: below this, force icon-only mode
const MANUAL_BASELINE_SEC = 8 * 60; // configurable manual history-taking baseline

/* ---------------------------------------------------------------- languages */
const LANGS = [
  { code: "hi", native: "हिन्दी",   en: "Hindi",   bcp: "hi-IN", pack: "full" },
  { code: "mr", native: "मराठी",    en: "Marathi", bcp: "mr-IN", pack: "full" },
  { code: "ta", native: "தமிழ்",    en: "Tamil",   bcp: "ta-IN", pack: "full" },
  { code: "en", native: "English",  en: "English", bcp: "en-IN", pack: "full" },
  { code: "bn", native: "বাংলা",    en: "Bengali", bcp: "bn-IN", pack: "full", review: true },
  { code: "te", native: "తెలుగు",   en: "Telugu",  bcp: "te-IN", pack: "full", review: true },
  { code: "kn", native: "ಕನ್ನಡ",     en: "Kannada", bcp: "kn-IN", pack: "full", review: true },
  { code: "gu", native: "ગુજરાતી",  en: "Gujarati",bcp: "gu-IN", pack: "full", review: true },
];
const MORE_LANGS = 14; // 22 scheduled languages total — architected, not shipped

const PACK = {
  bn: {
    "Touch anywhere to begin": "শুরু করতে যেকোনো জায়গায় ছোঁয়ান",
    "Choose your language": "আপনার ভাষা বেছে নিন",
    "Back": "পিছনে",
    "Repeat": "আবার শুনুন",
    "Language": "ভাষা",
    "Get help": "সাহায্য চাই",
    "Hold to speak": "বলতে চেপে ধরুন",
    "or tap a picture": "অথবা ছবি বেছে নিন",
    "Listening…": "শুনছি…",
    "Next": "পরের",
    "Yes": "হ্যাঁ",
    "No": "না",
    "Not sure": "ঠিক জানি না",
    "It's noisy — please tap instead": "আওয়াজ বেশি — অনুগ্রহ করে ছবি ছোঁয়ান",
    "Kiosk Mitra has been called": "কিয়স্ক মিত্রকে ডাকা হয়েছে",
    "Session cleared": "তথ্য মুছে ফেলা হয়েছে",
    "Full text for this language is not in the demo. Showing English; voice stays in your language.": "এই ভাষার সম্পূর্ণ লেখা ডেমোতে নেই। ইংরেজি দেখানো হচ্ছে; কণ্ঠস্বর আপনার ভাষাতেই থাকবে।",
    "You do not need to do anything.": "আপনাকে কিছু করতে হবে না।",
    "A staff member is coming to see you now. Please stay here.": "একজন কর্মী এখনই আপনার কাছে আসছেন। এখানেই থাকুন।",
    "Chest": "বুক",
    "Head": "মাথা",
    "Stomach": "পেট",
    "Arms & legs": "হাত ও পা",
    "Skin": "চামড়া",
    "Urine": "প্রস্রাব",
    "Somewhere else": "অন্য কোথাও",
    "Where is the trouble?": "কোথায় কষ্ট হচ্ছে?",
    "Pain": "ব্যথা",
    "Fever": "জ্বর",
    "Cough": "কাশি",
    "Breathlessness": "শ্বাসকষ্ট",
    "Vomiting": "বমি",
    "Nausea": "গা গোলানো",
    "Dizziness": "মাথা ঘোরা",
    "Weakness or tiredness": "দুর্বলতা বা ক্লান্তি",
    "Bleeding": "রক্তপাত",
    "Rash": "চামড়ায় ফুসকুড়ি",
    "Injury": "আঘাত",
    "Sweating": "ঘাম",
    "Something else": "অন্য কিছু",
    "What troubles you most?": "সবচেয়ে বেশি কী কষ্ট দিচ্ছে?",
    "How does the pain feel?": "ব্যথাটা কেমন লাগে?",
    "Heavy, pressing": "ভারী, চেপে ধরার মতো",
    "Sharp, stabbing": "ধারালো, খোঁচার মতো",
    "Burning": "জ্বালা",
    "Cramping": "মোচড়ানো",
    "Dull ache": "চিনচিনে ব্যথা",
    "Does the pain travel anywhere?": "ব্যথা কি অন্য কোথাও যায়?",
    "Into the left arm": "বাঁ হাতে",
    "Into the jaw or neck": "চোয়াল বা গলায়",
    "Into the back": "পিঠে",
    "Down the leg": "পায়ের দিকে",
    "Stays in one place": "এক জায়গাতেই থাকে",
    "What else is happening along with it?": "এর সঙ্গে আর কী হচ্ছে?",
    "Nothing else": "আর কিছু না",
    "How does it come and go?": "কীভাবে আসে আর যায়?",
    "All the time": "সব সময়",
    "Comes and goes": "আসে আর যায়",
    "Getting worse": "বাড়ছে",
    "About the same": "প্রায় একই রকম",
    "What makes it better or worse?": "কীসে ভালো বা খারাপ লাগে?",
    "Rest helps": "বিশ্রামে আরাম হয়",
    "Medicine helps": "ওষুধে আরাম হয়",
    "Worse on moving": "নড়াচড়ায় বাড়ে",
    "Worse after food": "খাওয়ার পরে বাড়ে",
    "Nothing helps": "কিছুতেই আরাম হয় না",
    "How strong is it? Tap a face.": "কতটা জোরে? একটা মুখ ছোঁয়ান।",
    "Since when?": "কবে থেকে?",
    "Since today": "আজ থেকে",
    "This week": "এই সপ্তাহে",
    "A few days": "কয়েক দিন",
    "A few weeks": "কয়েক সপ্তাহ",
    "A few months": "কয়েক মাস",
    "More than three months": "তিন মাসের বেশি",
    "When do you get breathless?": "কখন শ্বাসকষ্ট হয়?",
    "Only on walking": "শুধু হাঁটলে",
    "Even while sitting still": "বসে থাকলেও",
    "Cannot finish a sentence": "এক কথা শেষ করতে পারি না",
    "Is any of this happening right now?": "এর কোনোটা কি এখনই হচ্ছে?",
    "Face pulled to one side": "মুখ একদিকে বেঁকে গেছে",
    "Weakness on one side": "এক দিক দুর্বল",
    "Speech slurred": "কথা জড়িয়ে যাচ্ছে",
    "Sudden loss of sight": "হঠাৎ চোখে দেখা বন্ধ",
    "Confusion": "বিভ্রান্তি",
    "Fits": "খিঁচুনি",
    "Very bad headache": "খুব জোর মাথা ব্যথা",
    "Stiff neck": "ঘাড় শক্ত",
    "Is any of this happening?": "এর কোনোটা কি হচ্ছে?",
    "Vomiting blood": "রক্ত বমি",
    "Black stools": "কালো পায়খানা",
    "None of these": "এর কোনোটাই নয়",
    "Mind & mood": "মন ও মেজাজ",
    "How has your mind been these last few days?": "গত কয়েক দিন মন কেমন আছে?",
    "Low or sad": "মন খারাপ",
    "Anxious or fearful": "উদ্বিগ্ন বা ভয়",
    "Cannot sleep": "ঘুম আসে না",
    "Thoughts of harming myself": "নিজের ক্ষতি করার চিন্তা",
    "Do you already have any of these?": "এর কোনোটা কি আগে থেকে আছে?",
    "Diabetes": "ডায়াবেটিস (সুগার)",
    "High BP": "উচ্চ রক্তচাপ",
    "Heart disease": "হৃদরোগ",
    "Asthma or COPD": "হাঁপানি বা শ্বাসকষ্ট",
    "TB": "যক্ষ্মা",
    "Thyroid": "থাইরয়েড",
    "Kidney": "কিডনি",
    "Cancer": "ক্যান্সার",
    "None|कोई नहीं": "কিছু নেই",
    "Show me the medicines you take.": "আপনি যে ওষুধ খান তা দেখান।",
    "Show the strips": "পাতা দেখান",
    "Say the names": "নাম বলুন",
    "No medicines": "কোনো ওষুধ নয়",
    "Does any medicine or food disagree with you?": "কোনো ওষুধ বা খাবারে কি সমস্যা হয়?",
    "A medicine": "কোনো ওষুধ",
    "A food": "কোনো খাবার",
    "Nothing": "কিছুই না",
    "Does anyone at home have these?": "বাড়িতে কারও কি এসব আছে?",
    "No one": "কারও নেই",
    "Do you use any of these?": "এর কোনোটা কি ব্যবহার করেন?",
    "Beedi or cigarette": "বিড়ি বা সিগারেট",
    "Tobacco or gutka": "তামাক বা গুটখা",
    "Alcohol": "মদ",
    "None|कुछ नहीं": "কিছুই না",
    "What work do you do?": "আপনি কী কাজ করেন?",
    "Farming": "চাষবাস",
    "Daily labour": "দিনমজুরি",
    "Shop or office": "দোকান বা অফিস",
    "Driving": "গাড়ি চালানো",
    "Work at home": "ঘরের কাজ",
    "Are you pregnant?": "আপনি কি গর্ভবতী?",
    "When was your last period?": "শেষ মাসিক কবে হয়েছিল?",
    "About two weeks ago": "প্রায় দুই সপ্তাহ আগে",
    "About a month ago": "প্রায় এক মাস আগে",
    "Irregular": "অনিয়মিত",
    "Baby moving less": "বাচ্চার নড়াচড়া কম",
    "Which describes your body and nature best?": "আপনার শরীর ও স্বভাব কোনটির সঙ্গে মেলে?",
    "Thin, quick, dry skin": "পাতলা, চটপটে, শুকনো চামড়া",
    "Medium, warm, sharp": "মাঝারি, গরম, তীক্ষ্ণ",
    "Heavy, calm, oily skin": "ভারী, শান্ত, তেলতেলে চামড়া",
    "Mixed": "মিশ্র",
    "Which feels out of balance now?": "এখন কোনটা বেঠিক লাগছে?",
    "Dryness, gas, joint pain": "শুষ্কতা, গ্যাস, গাঁটে ব্যথা",
    "Burning, acidity, anger": "জ্বালা, অম্বল, রাগ",
    "Heaviness, cough, sluggishness": "ভার, কাশি, আলসেমি",
    "How would you describe your overall tissue strength?": "আপনার শরীরের সার্বিক শক্তি কেমন?",
    "Strong": "শক্ত",
    "Moderate": "মাঝারি",
    "Weak": "দুর্বল",
    "How is your build?": "আপনার গড়ন কেমন?",
    "Well built": "সুগঠিত",
    "Medium": "মাঝারি",
    "Lean": "রোগা",
    "How many kinds of food suit you?": "কত রকম খাবার আপনার সহ্য হয়?",
    "All kinds": "সব রকম",
    "Some kinds": "কিছু রকম",
    "Very few": "খুব কম",
    "How do you handle difficulty?": "কষ্টের সময় কেমন সামলান?",
    "Stay steady": "স্থির থাকি",
    "Somewhat affected": "কিছুটা প্রভাব পড়ে",
    "Easily upset": "সহজে ভেঙে পড়ি",
    "How is your appetite?": "আপনার খিদে কেমন?",
    "Good": "ভালো",
    "Poor": "কম",
    "How long can you work before tiring?": "ক্লান্ত হওয়ার আগে কতক্ষণ কাজ করতে পারেন?",
    "All day": "সারা দিন",
    "Until afternoon": "দুপুর পর্যন্ত",
    "Tire quickly": "তাড়াতাড়ি ক্লান্ত হই",
    "Which stage of life are you in?": "আপনি জীবনের কোন পর্যায়ে?",
    "Under 30": "ত্রিশের কম",
    "30 to 60": "ত্রিশ থেকে ষাট",
    "Over 60": "ষাটের বেশি",
    "How is your weight compared to usual?": "আগের তুলনায় ওজন কেমন?",
    "Heavier": "বেড়েছে",
    "Lighter": "কমেছে",
    "How is your digestion?": "হজম কেমন হয়?",
    "Very sharp, hungry often": "খুব ভালো, বারবার খিদে পায়",
    "Slow, heavy after food": "ধীর, খাওয়ার পরে ভার",
    "Changes day to day": "দিনে দিনে বদলায়",
    "How are your bowels?": "পায়খানা কেমন হয়?",
    "Regular": "নিয়মিত",
    "Hard, difficult": "শক্ত, কষ্ট হয়",
    "Loose": "পাতলা",
    "How do you sleep?": "ঘুম কেমন হয়?",
    "Sound sleep": "গভীর ঘুম",
    "Broken sleep": "ঘুম ভেঙে যায়",
    "Very little sleep": "খুব কম ঘুম",
    "What do you usually eat?": "সাধারণত কী খান?",
    "Vegetarian": "নিরামিষ",
    "Mostly outside food": "বেশিরভাগ বাইরের খাবার",
    "Years": "বছর",
    "There is a lot of pain in my chest.": "বুকে খুব ব্যথা হচ্ছে।",
    "Pain, since about two hours.": "ব্যথা, প্রায় দুই ঘণ্টা ধরে।",
    "It feels like a heavy weight pressing on my chest.": "মনে হচ্ছে বুকের উপর ভারী কিছু চেপে আছে।",
    "The pain is going down into my left arm.": "ব্যথা বাঁ হাতের দিকে নামছে।",
    "I am sweating a lot and I feel breathless.": "খুব ঘাম হচ্ছে আর শ্বাস নিতে কষ্ট হচ্ছে।",
    "It keeps getting worse.": "ক্রমশ বাড়ছে।",
    "Nothing I do makes it better.": "কিছুতেই আরাম হচ্ছে না।",
    "It started today, about two hours back.": "আজই শুরু হয়েছে, প্রায় দুই ঘণ্টা আগে।",
    "I have sugar. I take a tablet for it.": "আমার সুগার আছে, তার ওষুধ খাই।",
    "No, nothing troubles me.": "না, কিছুতেই সমস্যা হয় না।",
    "I do farming.": "আমি চাষ করি।",
  },
  te: {
    "Touch anywhere to begin": "ప్రారంభించడానికి ఎక్కడైనా తాకండి",
    "Choose your language": "మీ భాషను ఎంచుకోండి",
    "Back": "వెనుకకు",
    "Repeat": "మళ్ళీ వినండి",
    "Language": "భాష",
    "Get help": "సహాయం కావాలి",
    "Hold to speak": "మాట్లాడటానికి నొక్కి పట్టుకోండి",
    "or tap a picture": "లేదా బొమ్మను ఎంచుకోండి",
    "Listening…": "వింటున్నాం…",
    "Next": "తరువాత",
    "Yes": "అవును",
    "No": "కాదు",
    "Not sure": "ఖచ్చితంగా తెలియదు",
    "It's noisy — please tap instead": "శబ్దం ఎక్కువగా ఉంది — దయచేసి బొమ్మను తాకండి",
    "Kiosk Mitra has been called": "కియోస్క్ మిత్రను పిలిచాం",
    "Session cleared": "సమాచారం తొలగించబడింది",
    "Full text for this language is not in the demo. Showing English; voice stays in your language.": "ఈ భాషకు పూర్తి వచనం డెమోలో లేదు. ఇంగ్లీషు చూపిస్తున్నాం; స్వరం మీ భాషలోనే ఉంటుంది.",
    "You do not need to do anything.": "మీరు ఏమీ చేయనవసరం లేదు.",
    "A staff member is coming to see you now. Please stay here.": "ఒక సిబ్బంది ఇప్పుడే మీ దగ్గరకు వస్తున్నారు. ఇక్కడే ఉండండి.",
    "Chest": "ఛాతీ",
    "Head": "తల",
    "Stomach": "కడుపు",
    "Arms & legs": "చేతులు, కాళ్ళు",
    "Skin": "చర్మం",
    "Urine": "మూత్రం",
    "Somewhere else": "ఇంకెక్కడైనా",
    "Where is the trouble?": "ఇబ్బంది ఎక్కడ ఉంది?",
    "Pain": "నొప్పి",
    "Fever": "జ్వరం",
    "Cough": "దగ్గు",
    "Breathlessness": "ఊపిరి ఆడకపోవడం",
    "Vomiting": "వాంతులు",
    "Nausea": "వికారం",
    "Dizziness": "కళ్ళు తిరగడం",
    "Weakness or tiredness": "నీరసం లేదా అలసట",
    "Bleeding": "రక్తస్రావం",
    "Rash": "దద్దుర్లు",
    "Injury": "గాయం",
    "Sweating": "చెమట",
    "Something else": "ఇంకేదైనా",
    "What troubles you most?": "మిమ్మల్ని ఎక్కువగా బాధించేది ఏమిటి?",
    "How does the pain feel?": "నొప్పి ఎలా అనిపిస్తుంది?",
    "Heavy, pressing": "బరువుగా, నొక్కినట్టు",
    "Sharp, stabbing": "పదునుగా, గుచ్చినట్టు",
    "Burning": "మంట",
    "Cramping": "మెలిపెట్టినట్టు",
    "Dull ache": "మెల్లగా నొప్పి",
    "Does the pain travel anywhere?": "నొప్పి ఇంకెక్కడికైనా వెళ్తుందా?",
    "Into the left arm": "ఎడమ చేతిలోకి",
    "Into the jaw or neck": "దవడ లేదా మెడలోకి",
    "Into the back": "వీపులోకి",
    "Down the leg": "కాలు వైపు",
    "Stays in one place": "ఒకే చోట ఉంటుంది",
    "What else is happening along with it?": "దీనితో పాటు ఇంకా ఏమి జరుగుతోంది?",
    "Nothing else": "ఇంకేమీ లేదు",
    "How does it come and go?": "ఇది ఎలా వస్తుంది పోతుంది?",
    "All the time": "అన్ని వేళలా",
    "Comes and goes": "వస్తుంది పోతుంది",
    "Getting worse": "ఎక్కువ అవుతోంది",
    "About the same": "దాదాపు అలాగే ఉంది",
    "What makes it better or worse?": "దేనితో తగ్గుతుంది లేదా పెరుగుతుంది?",
    "Rest helps": "విశ్రాంతితో తగ్గుతుంది",
    "Medicine helps": "మందుతో తగ్గుతుంది",
    "Worse on moving": "కదిలితే పెరుగుతుంది",
    "Worse after food": "తిన్న తరువాత పెరుగుతుంది",
    "Nothing helps": "దేనితోనూ తగ్గదు",
    "How strong is it? Tap a face.": "ఎంత తీవ్రంగా ఉంది? ఒక ముఖాన్ని తాకండి.",
    "Since when?": "ఎప్పటి నుండి?",
    "Since today": "ఈ రోజు నుండి",
    "This week": "ఈ వారం",
    "A few days": "కొన్ని రోజులు",
    "A few weeks": "కొన్ని వారాలు",
    "A few months": "కొన్ని నెలలు",
    "More than three months": "మూడు నెలలకు మించి",
    "When do you get breathless?": "ఊపిరి ఎప్పుడు ఆడదు?",
    "Only on walking": "నడిచినప్పుడు మాత్రమే",
    "Even while sitting still": "కూర్చున్నప్పుడు కూడా",
    "Cannot finish a sentence": "ఒక వాక్యం పూర్తి చేయలేను",
    "Is any of this happening right now?": "ఇందులో ఏదైనా ఇప్పుడు జరుగుతోందా?",
    "Face pulled to one side": "ముఖం ఒక వైపు వంగింది",
    "Weakness on one side": "ఒక వైపు బలహీనత",
    "Speech slurred": "మాట ముద్దగా వస్తోంది",
    "Sudden loss of sight": "అకస్మాత్తుగా చూపు పోవడం",
    "Confusion": "గందరగోళం",
    "Fits": "ఫిట్స్",
    "Very bad headache": "చాలా తీవ్రమైన తలనొప్పి",
    "Stiff neck": "మెడ బిగుసుకుపోవడం",
    "Is any of this happening?": "ఇందులో ఏదైనా జరుగుతోందా?",
    "Vomiting blood": "రక్తం వాంతి",
    "Black stools": "నల్లని మలం",
    "None of these": "ఇందులో ఏదీ కాదు",
    "Mind & mood": "మనసు, మానసిక స్థితి",
    "How has your mind been these last few days?": "గత కొన్ని రోజులుగా మీ మనసు ఎలా ఉంది?",
    "Low or sad": "దిగులుగా లేదా విచారంగా",
    "Anxious or fearful": "ఆందోళన లేదా భయం",
    "Cannot sleep": "నిద్ర పట్టదు",
    "Thoughts of harming myself": "నన్ను నేను హాని చేసుకోవాలనే ఆలోచన",
    "Do you already have any of these?": "ఇందులో ఏదైనా ఇప్పటికే ఉందా?",
    "Diabetes": "చక్కెర వ్యాధి",
    "High BP": "అధిక రక్తపోటు",
    "Heart disease": "గుండె జబ్బు",
    "Asthma or COPD": "ఉబ్బసం లేదా శ్వాస సమస్య",
    "TB": "క్షయ",
    "Thyroid": "థైరాయిడ్",
    "Kidney": "మూత్రపిండాలు",
    "Cancer": "క్యాన్సర్",
    "None|कोई नहीं": "ఏదీ లేదు",
    "Show me the medicines you take.": "మీరు వాడే మందులు చూపించండి.",
    "Show the strips": "స్ట్రిప్‌లు చూపించండి",
    "Say the names": "పేర్లు చెప్పండి",
    "No medicines": "మందులేమీ లేవు",
    "Does any medicine or food disagree with you?": "ఏదైనా మందు లేదా ఆహారం పడదా?",
    "A medicine": "ఏదైనా మందు",
    "A food": "ఏదైనా ఆహారం",
    "Nothing": "ఏమీ లేదు",
    "Does anyone at home have these?": "ఇంట్లో ఎవరికైనా ఇవి ఉన్నాయా?",
    "No one": "ఎవరికీ లేదు",
    "Do you use any of these?": "ఇందులో ఏదైనా వాడతారా?",
    "Beedi or cigarette": "బీడీ లేదా సిగరెట్",
    "Tobacco or gutka": "పొగాకు లేదా గుట్కా",
    "Alcohol": "మద్యం",
    "None|कुछ नहीं": "ఏమీ లేదు",
    "What work do you do?": "మీరు ఏ పని చేస్తారు?",
    "Farming": "వ్యవసాయం",
    "Daily labour": "రోజువారీ కూలి",
    "Shop or office": "దుకాణం లేదా ఆఫీసు",
    "Driving": "డ్రైవింగ్",
    "Work at home": "ఇంటి పని",
    "Are you pregnant?": "మీరు గర్భవతినా?",
    "When was your last period?": "చివరి రుతుస్రావం ఎప్పుడు?",
    "About two weeks ago": "సుమారు రెండు వారాల క్రితం",
    "About a month ago": "సుమారు నెల క్రితం",
    "Irregular": "క్రమం తప్పి",
    "Baby moving less": "బిడ్డ కదలిక తక్కువ",
    "Which describes your body and nature best?": "మీ శరీరం, స్వభావం దేనికి సరిపోతుంది?",
    "Thin, quick, dry skin": "సన్నగా, చురుకుగా, పొడి చర్మం",
    "Medium, warm, sharp": "మధ్యస్థం, వెచ్చగా, పదునుగా",
    "Heavy, calm, oily skin": "బరువుగా, ప్రశాంతంగా, జిడ్డు చర్మం",
    "Mixed": "మిశ్రమం",
    "Which feels out of balance now?": "ఇప్పుడు ఏది సమతుల్యం తప్పినట్టు అనిపిస్తోంది?",
    "Dryness, gas, joint pain": "పొడిబారడం, గ్యాస్, కీళ్ల నొప్పి",
    "Burning, acidity, anger": "మంట, ఆమ్లత్వం, కోపం",
    "Heaviness, cough, sluggishness": "బరువు, దగ్గు, బద్ధకం",
    "How would you describe your overall tissue strength?": "మీ శరీర మొత్తం బలం ఎలా ఉంది?",
    "Strong": "బలంగా",
    "Moderate": "మధ్యస్థం",
    "Weak": "బలహీనం",
    "How is your build?": "మీ శరీర నిర్మాణం ఎలా ఉంది?",
    "Well built": "దృఢంగా",
    "Medium": "మధ్యస్థం",
    "Lean": "సన్నగా",
    "How many kinds of food suit you?": "ఎన్ని రకాల ఆహారం మీకు సరిపోతుంది?",
    "All kinds": "అన్ని రకాలు",
    "Some kinds": "కొన్ని రకాలు",
    "Very few": "చాలా తక్కువ",
    "How do you handle difficulty?": "కష్టాన్ని ఎలా ఎదుర్కొంటారు?",
    "Stay steady": "నిబ్బరంగా ఉంటాను",
    "Somewhat affected": "కొంత ప్రభావితమవుతాను",
    "Easily upset": "త్వరగా కలత చెందుతాను",
    "How is your appetite?": "మీకు ఆకలి ఎలా ఉంది?",
    "Good": "బాగుంది",
    "Poor": "తక్కువ",
    "How long can you work before tiring?": "అలసిపోకముందు ఎంతసేపు పని చేయగలరు?",
    "All day": "రోజంతా",
    "Until afternoon": "మధ్యాహ్నం వరకు",
    "Tire quickly": "త్వరగా అలసిపోతాను",
    "Which stage of life are you in?": "మీరు జీవితంలో ఏ దశలో ఉన్నారు?",
    "Under 30": "ముప్ఫై లోపు",
    "30 to 60": "ముప్ఫై నుండి అరవై",
    "Over 60": "అరవై పైన",
    "How is your weight compared to usual?": "మామూలు కంటే బరువు ఎలా ఉంది?",
    "Heavier": "ఎక్కువైంది",
    "Lighter": "తగ్గింది",
    "How is your digestion?": "మీ జీర్ణక్రియ ఎలా ఉంది?",
    "Very sharp, hungry often": "చాలా బాగా, తరచూ ఆకలి",
    "Slow, heavy after food": "నెమ్మదిగా, తిన్నాక బరువు",
    "Changes day to day": "రోజుకో రకంగా",
    "How are your bowels?": "మీ మల విసర్జన ఎలా ఉంది?",
    "Regular": "క్రమంగా",
    "Hard, difficult": "గట్టిగా, కష్టంగా",
    "Loose": "వదులుగా",
    "How do you sleep?": "మీ నిద్ర ఎలా ఉంది?",
    "Sound sleep": "గాఢ నిద్ర",
    "Broken sleep": "నిద్ర తెగుతుంది",
    "Very little sleep": "చాలా తక్కువ నిద్ర",
    "What do you usually eat?": "మీరు సాధారణంగా ఏమి తింటారు?",
    "Vegetarian": "శాకాహారం",
    "Mostly outside food": "ఎక్కువగా బయటి ఆహారం",
    "Years": "సంవత్సరాలు",
    "There is a lot of pain in my chest.": "ఛాతీలో చాలా నొప్పిగా ఉంది.",
    "Pain, since about two hours.": "నొప్పి, సుమారు రెండు గంటల నుండి.",
    "It feels like a heavy weight pressing on my chest.": "ఛాతీపై బరువు నొక్కినట్టు అనిపిస్తోంది.",
    "The pain is going down into my left arm.": "నొప్పి ఎడమ చేతిలోకి పాకుతోంది.",
    "I am sweating a lot and I feel breathless.": "చాలా చెమట పడుతోంది, ఊపిరి ఆడటం లేదు.",
    "It keeps getting worse.": "ఇంకా ఎక్కువ అవుతూనే ఉంది.",
    "Nothing I do makes it better.": "ఏమి చేసినా తగ్గడం లేదు.",
    "It started today, about two hours back.": "ఈ రోజే మొదలైంది, సుమారు రెండు గంటల క్రితం.",
    "I have sugar. I take a tablet for it.": "నాకు చక్కెర ఉంది, దానికి మాత్ర వేసుకుంటాను.",
    "No, nothing troubles me.": "లేదు, ఏదీ ఇబ్బంది పెట్టదు.",
    "I do farming.": "నేను వ్యవసాయం చేస్తాను.",
  },
  kn: {
    "Touch anywhere to begin": "ಪ್ರಾರಂಭಿಸಲು ಎಲ್ಲಿಯಾದರೂ ಸ್ಪರ್ಶಿಸಿ",
    "Choose your language": "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ",
    "Back": "ಹಿಂದೆ",
    "Repeat": "ಮತ್ತೆ ಕೇಳಿ",
    "Language": "ಭಾಷೆ",
    "Get help": "ಸಹಾಯ ಬೇಕು",
    "Hold to speak": "ಮಾತನಾಡಲು ಒತ್ತಿ ಹಿಡಿಯಿರಿ",
    "or tap a picture": "ಅಥವಾ ಚಿತ್ರ ಆರಿಸಿ",
    "Listening…": "ಕೇಳುತ್ತಿದ್ದೇವೆ…",
    "Next": "ಮುಂದೆ",
    "Yes": "ಹೌದು",
    "No": "ಇಲ್ಲ",
    "Not sure": "ಖಚಿತವಾಗಿ ಗೊತ್ತಿಲ್ಲ",
    "It's noisy — please tap instead": "ಗದ್ದಲ ಜಾಸ್ತಿ ಇದೆ — ದಯವಿಟ್ಟು ಚಿತ್ರ ಸ್ಪರ್ಶಿಸಿ",
    "Kiosk Mitra has been called": "ಕಿಯೋಸ್ಕ್ ಮಿತ್ರರನ್ನು ಕರೆಯಲಾಗಿದೆ",
    "Session cleared": "ಮಾಹಿತಿ ಅಳಿಸಲಾಗಿದೆ",
    "Full text for this language is not in the demo. Showing English; voice stays in your language.": "ಈ ಭಾಷೆಯ ಪೂರ್ಣ ಪಠ್ಯ ಡೆಮೊದಲ್ಲಿ ಇಲ್ಲ. ಇಂಗ್ಲಿಷ್ ತೋರಿಸಲಾಗುತ್ತಿದೆ; ಧ್ವನಿ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲೇ ಇರುತ್ತದೆ.",
    "You do not need to do anything.": "ನೀವು ಏನೂ ಮಾಡಬೇಕಾಗಿಲ್ಲ.",
    "A staff member is coming to see you now. Please stay here.": "ಒಬ್ಬ ಸಿಬ್ಬಂದಿ ಈಗಲೇ ನಿಮ್ಮ ಬಳಿ ಬರುತ್ತಿದ್ದಾರೆ. ಇಲ್ಲೇ ಇರಿ.",
    "Chest": "ಎದೆ",
    "Head": "ತಲೆ",
    "Stomach": "ಹೊಟ್ಟೆ",
    "Arms & legs": "ಕೈ ಮತ್ತು ಕಾಲು",
    "Skin": "ಚರ್ಮ",
    "Urine": "ಮೂತ್ರ",
    "Somewhere else": "ಬೇರೆ ಎಲ್ಲಿಯಾದರೂ",
    "Where is the trouble?": "ತೊಂದರೆ ಎಲ್ಲಿದೆ?",
    "Pain": "ನೋವು",
    "Fever": "ಜ್ವರ",
    "Cough": "ಕೆಮ್ಮು",
    "Breathlessness": "ಉಸಿರಾಟದ ತೊಂದರೆ",
    "Vomiting": "ವಾಂತಿ",
    "Nausea": "ವಾಕರಿಕೆ",
    "Dizziness": "ತಲೆಸುತ್ತು",
    "Weakness or tiredness": "ಸುಸ್ತು ಅಥವಾ ಆಯಾಸ",
    "Bleeding": "ರಕ್ತಸ್ರಾವ",
    "Rash": "ಚರ್ಮದ ಗುಳ್ಳೆ",
    "Injury": "ಗಾಯ",
    "Sweating": "ಬೆವರು",
    "Something else": "ಬೇರೆ ಏನಾದರೂ",
    "What troubles you most?": "ನಿಮಗೆ ಹೆಚ್ಚು ತೊಂದರೆ ಏನು?",
    "How does the pain feel?": "ನೋವು ಹೇಗೆ ಅನಿಸುತ್ತದೆ?",
    "Heavy, pressing": "ಭಾರ, ಒತ್ತಿದಂತೆ",
    "Sharp, stabbing": "ಚೂಪಾದ, ಚುಚ್ಚಿದಂತೆ",
    "Burning": "ಉರಿ",
    "Cramping": "ಹಿಂಡಿದಂತೆ",
    "Dull ache": "ಮಂದ ನೋವು",
    "Does the pain travel anywhere?": "ನೋವು ಬೇರೆ ಕಡೆ ಹೋಗುತ್ತದೆಯೇ?",
    "Into the left arm": "ಎಡ ಕೈಗೆ",
    "Into the jaw or neck": "ದವಡೆ ಅಥವಾ ಕುತ್ತಿಗೆಗೆ",
    "Into the back": "ಬೆನ್ನಿಗೆ",
    "Down the leg": "ಕಾಲಿನ ಕಡೆಗೆ",
    "Stays in one place": "ಒಂದೇ ಕಡೆ ಇರುತ್ತದೆ",
    "What else is happening along with it?": "ಇದರ ಜೊತೆ ಇನ್ನೇನು ಆಗುತ್ತಿದೆ?",
    "Nothing else": "ಬೇರೇನೂ ಇಲ್ಲ",
    "How does it come and go?": "ಹೇಗೆ ಬರುತ್ತದೆ ಮತ್ತು ಹೋಗುತ್ತದೆ?",
    "All the time": "ಎಲ್ಲಾ ಸಮಯದಲ್ಲೂ",
    "Comes and goes": "ಬರುತ್ತದೆ ಹೋಗುತ್ತದೆ",
    "Getting worse": "ಹೆಚ್ಚಾಗುತ್ತಿದೆ",
    "About the same": "ಸುಮಾರು ಹಾಗೇ ಇದೆ",
    "What makes it better or worse?": "ಯಾವುದರಿಂದ ಕಡಿಮೆ ಅಥವಾ ಹೆಚ್ಚು ಆಗುತ್ತದೆ?",
    "Rest helps": "ವಿಶ್ರಾಂತಿಯಿಂದ ಕಡಿಮೆಯಾಗುತ್ತದೆ",
    "Medicine helps": "ಔಷಧಿಯಿಂದ ಕಡಿಮೆಯಾಗುತ್ತದೆ",
    "Worse on moving": "ಚಲಿಸಿದರೆ ಹೆಚ್ಚಾಗುತ್ತದೆ",
    "Worse after food": "ಊಟದ ನಂತರ ಹೆಚ್ಚಾಗುತ್ತದೆ",
    "Nothing helps": "ಯಾವುದರಿಂದಲೂ ಕಡಿಮೆಯಾಗುವುದಿಲ್ಲ",
    "How strong is it? Tap a face.": "ಎಷ್ಟು ತೀವ್ರವಾಗಿದೆ? ಒಂದು ಮುಖ ಸ್ಪರ್ಶಿಸಿ.",
    "Since when?": "ಯಾವಾಗಿನಿಂದ?",
    "Since today": "ಇಂದಿನಿಂದ",
    "This week": "ಈ ವಾರ",
    "A few days": "ಕೆಲವು ದಿನಗಳು",
    "A few weeks": "ಕೆಲವು ವಾರಗಳು",
    "A few months": "ಕೆಲವು ತಿಂಗಳುಗಳು",
    "More than three months": "ಮೂರು ತಿಂಗಳಿಗಿಂತ ಹೆಚ್ಚು",
    "When do you get breathless?": "ಉಸಿರಾಟದ ತೊಂದರೆ ಯಾವಾಗ ಆಗುತ್ತದೆ?",
    "Only on walking": "ನಡೆದಾಗ ಮಾತ್ರ",
    "Even while sitting still": "ಸುಮ್ಮನೆ ಕುಳಿತಾಗಲೂ",
    "Cannot finish a sentence": "ಒಂದು ವಾಕ್ಯ ಮುಗಿಸಲಾಗುವುದಿಲ್ಲ",
    "Is any of this happening right now?": "ಇದರಲ್ಲಿ ಯಾವುದಾದರೂ ಈಗ ಆಗುತ್ತಿದೆಯೇ?",
    "Face pulled to one side": "ಮುಖ ಒಂದು ಕಡೆ ಸೆಳೆದಿದೆ",
    "Weakness on one side": "ಒಂದು ಕಡೆ ಸುಸ್ತು",
    "Speech slurred": "ಮಾತು ತೊದಲುತ್ತಿದೆ",
    "Sudden loss of sight": "ಹಠಾತ್ ದೃಷ್ಟಿ ಹೋಗುವುದು",
    "Confusion": "ಗೊಂದಲ",
    "Fits": "ಫಿಟ್ಸ್",
    "Very bad headache": "ತುಂಬಾ ತೀವ್ರ ತಲೆನೋವು",
    "Stiff neck": "ಕುತ್ತಿಗೆ ಬಿಗಿತ",
    "Is any of this happening?": "ಇದರಲ್ಲಿ ಯಾವುದಾದರೂ ಆಗುತ್ತಿದೆಯೇ?",
    "Vomiting blood": "ರಕ್ತ ವಾಂತಿ",
    "Black stools": "ಕಪ್ಪು ಮಲ",
    "None of these": "ಇವುಗಳಲ್ಲಿ ಯಾವುದೂ ಇಲ್ಲ",
    "Mind & mood": "ಮನಸ್ಸು ಮತ್ತು ಮನೋಸ್ಥಿತಿ",
    "How has your mind been these last few days?": "ಕಳೆದ ಕೆಲವು ದಿನಗಳಲ್ಲಿ ಮನಸ್ಸು ಹೇಗಿದೆ?",
    "Low or sad": "ಕುಗ್ಗಿದ ಅಥವಾ ದುಃಖ",
    "Anxious or fearful": "ಆತಂಕ ಅಥವಾ ಭಯ",
    "Cannot sleep": "ನಿದ್ರೆ ಬರುವುದಿಲ್ಲ",
    "Thoughts of harming myself": "ನನ್ನನ್ನೇ ನೋಯಿಸಿಕೊಳ್ಳುವ ಆಲೋಚನೆ",
    "Do you already have any of these?": "ಇವುಗಳಲ್ಲಿ ಯಾವುದಾದರೂ ಈಗಾಗಲೇ ಇದೆಯೇ?",
    "Diabetes": "ಸಕ್ಕರೆ ಕಾಯಿಲೆ",
    "High BP": "ಅಧಿಕ ರಕ್ತದೊತ್ತಡ",
    "Heart disease": "ಹೃದಯ ಕಾಯಿಲೆ",
    "Asthma or COPD": "ಅಸ್ತಮಾ ಅಥವಾ ಉಸಿರಾಟದ ಕಾಯಿಲೆ",
    "TB": "ಕ್ಷಯ",
    "Thyroid": "ಥೈರಾಯ್ಡ್",
    "Kidney": "ಮೂತ್ರಪಿಂಡ",
    "Cancer": "ಕ್ಯಾನ್ಸರ್",
    "None|कोई नहीं": "ಯಾವುದೂ ಇಲ್ಲ",
    "Show me the medicines you take.": "ನೀವು ತೆಗೆದುಕೊಳ್ಳುವ ಔಷಧಿ ತೋರಿಸಿ.",
    "Show the strips": "ಸ್ಟ್ರಿಪ್ ತೋರಿಸಿ",
    "Say the names": "ಹೆಸರು ಹೇಳಿ",
    "No medicines": "ಯಾವ ಔಷಧಿಯೂ ಇಲ್ಲ",
    "Does any medicine or food disagree with you?": "ಯಾವುದಾದರೂ ಔಷಧಿ ಅಥವಾ ಆಹಾರ ಹಿಡಿಸುವುದಿಲ್ಲವೇ?",
    "A medicine": "ಯಾವುದಾದರೂ ಔಷಧಿ",
    "A food": "ಯಾವುದಾದರೂ ಆಹಾರ",
    "Nothing": "ಏನೂ ಇಲ್ಲ",
    "Does anyone at home have these?": "ಮನೆಯಲ್ಲಿ ಯಾರಿಗಾದರೂ ಇವೆಯೇ?",
    "No one": "ಯಾರಿಗೂ ಇಲ್ಲ",
    "Do you use any of these?": "ಇವುಗಳಲ್ಲಿ ಯಾವುದಾದರೂ ಬಳಸುತ್ತೀರಾ?",
    "Beedi or cigarette": "ಬೀಡಿ ಅಥವಾ ಸಿಗರೇಟ್",
    "Tobacco or gutka": "ತಂಬಾಕು ಅಥವಾ ಗುಟ್ಕಾ",
    "Alcohol": "ಮದ್ಯ",
    "None|कुछ नहीं": "ಏನೂ ಇಲ್ಲ",
    "What work do you do?": "ನೀವು ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತೀರಿ?",
    "Farming": "ವ್ಯವಸಾಯ",
    "Daily labour": "ದಿನಗೂಲಿ",
    "Shop or office": "ಅಂಗಡಿ ಅಥವಾ ಕಚೇರಿ",
    "Driving": "ಚಾಲನೆ",
    "Work at home": "ಮನೆಕೆಲಸ",
    "Are you pregnant?": "ನೀವು ಗರ್ಭಿಣಿಯೇ?",
    "When was your last period?": "ಕೊನೆಯ ಮುಟ್ಟು ಯಾವಾಗ?",
    "About two weeks ago": "ಸುಮಾರು ಎರಡು ವಾರಗಳ ಹಿಂದೆ",
    "About a month ago": "ಸುಮಾರು ಒಂದು ತಿಂಗಳ ಹಿಂದೆ",
    "Irregular": "ಅನಿಯಮಿತ",
    "Baby moving less": "ಮಗುವಿನ ಚಲನೆ ಕಡಿಮೆ",
    "Which describes your body and nature best?": "ನಿಮ್ಮ ದೇಹ ಮತ್ತು ಸ್ವಭಾವ ಯಾವುದಕ್ಕೆ ಹೊಂದುತ್ತದೆ?",
    "Thin, quick, dry skin": "ತೆಳ್ಳಗೆ, ಚುರುಕು, ಒಣ ಚರ್ಮ",
    "Medium, warm, sharp": "ಮಧ್ಯಮ, ಬೆಚ್ಚಗೆ, ತೀಕ್ಷ್ಣ",
    "Heavy, calm, oily skin": "ಭಾರ, ಶಾಂತ, ಎಣ್ಣೆ ಚರ್ಮ",
    "Mixed": "ಮಿಶ್ರ",
    "Which feels out of balance now?": "ಈಗ ಯಾವುದು ಏರುಪೇರಾಗಿದೆ ಅನಿಸುತ್ತದೆ?",
    "Dryness, gas, joint pain": "ಒಣಗುವಿಕೆ, ಗ್ಯಾಸ್, ಕೀಲು ನೋವು",
    "Burning, acidity, anger": "ಉರಿ, ಹುಳಿತೇಗು, ಕೋಪ",
    "Heaviness, cough, sluggishness": "ಭಾರ, ಕೆಮ್ಮು, ಜಡತ್ವ",
    "How would you describe your overall tissue strength?": "ನಿಮ್ಮ ದೇಹದ ಒಟ್ಟಾರೆ ಶಕ್ತಿ ಹೇಗಿದೆ?",
    "Strong": "ಬಲಿಷ್ಠ",
    "Moderate": "ಮಧ್ಯಮ",
    "Weak": "ದುರ್ಬಲ",
    "How is your build?": "ನಿಮ್ಮ ಮೈಕಟ್ಟು ಹೇಗಿದೆ?",
    "Well built": "ಸದೃಢ",
    "Medium": "ಮಧ್ಯಮ",
    "Lean": "ತೆಳ್ಳಗೆ",
    "How many kinds of food suit you?": "ಎಷ್ಟು ಬಗೆಯ ಆಹಾರ ನಿಮಗೆ ಒಗ್ಗುತ್ತದೆ?",
    "All kinds": "ಎಲ್ಲಾ ಬಗೆ",
    "Some kinds": "ಕೆಲವು ಬಗೆ",
    "Very few": "ತುಂಬಾ ಕಡಿಮೆ",
    "How do you handle difficulty?": "ಕಷ್ಟವನ್ನು ಹೇಗೆ ನಿಭಾಯಿಸುತ್ತೀರಿ?",
    "Stay steady": "ಸ್ಥಿರವಾಗಿರುತ್ತೇನೆ",
    "Somewhat affected": "ಸ್ವಲ್ಪ ವಿಚಲಿತನಾಗುತ್ತೇನೆ",
    "Easily upset": "ಬೇಗ ವಿಚಲಿತನಾಗುತ್ತೇನೆ",
    "How is your appetite?": "ನಿಮ್ಮ ಹಸಿವು ಹೇಗಿದೆ?",
    "Good": "ಚೆನ್ನಾಗಿದೆ",
    "Poor": "ಕಡಿಮೆ",
    "How long can you work before tiring?": "ದಣಿಯುವ ಮೊದಲು ಎಷ್ಟು ಹೊತ್ತು ಕೆಲಸ ಮಾಡಬಲ್ಲಿರಿ?",
    "All day": "ದಿನವಿಡೀ",
    "Until afternoon": "ಮಧ್ಯಾಹ್ನದವರೆಗೆ",
    "Tire quickly": "ಬೇಗ ದಣಿಯುತ್ತೇನೆ",
    "Which stage of life are you in?": "ನೀವು ಜೀವನದ ಯಾವ ಹಂತದಲ್ಲಿದ್ದೀರಿ?",
    "Under 30": "ಮೂವತ್ತಕ್ಕಿಂತ ಕಡಿಮೆ",
    "30 to 60": "ಮೂವತ್ತರಿಂದ ಅರವತ್ತು",
    "Over 60": "ಅರವತ್ತಕ್ಕಿಂತ ಹೆಚ್ಚು",
    "How is your weight compared to usual?": "ಎಂದಿನ ಹೋಲಿಕೆಯಲ್ಲಿ ತೂಕ ಹೇಗಿದೆ?",
    "Heavier": "ಹೆಚ್ಚಾಗಿದೆ",
    "Lighter": "ಕಡಿಮೆಯಾಗಿದೆ",
    "How is your digestion?": "ನಿಮ್ಮ ಜೀರ್ಣಕ್ರಿಯೆ ಹೇಗಿದೆ?",
    "Very sharp, hungry often": "ತುಂಬಾ ಚೆನ್ನಾಗಿ, ಪದೇಪದೇ ಹಸಿವು",
    "Slow, heavy after food": "ನಿಧಾನ, ಊಟದ ನಂತರ ಭಾರ",
    "Changes day to day": "ದಿನದಿಂದ ದಿನಕ್ಕೆ ಬದಲಾಗುತ್ತದೆ",
    "How are your bowels?": "ನಿಮ್ಮ ಮಲವಿಸರ್ಜನೆ ಹೇಗಿದೆ?",
    "Regular": "ನಿಯಮಿತ",
    "Hard, difficult": "ಗಟ್ಟಿ, ಕಷ್ಟ",
    "Loose": "ಸಡಿಲ",
    "How do you sleep?": "ನಿಮ್ಮ ನಿದ್ರೆ ಹೇಗಿದೆ?",
    "Sound sleep": "ಗಾಢ ನಿದ್ರೆ",
    "Broken sleep": "ನಿದ್ರೆ ತುಂಡಾಗುತ್ತದೆ",
    "Very little sleep": "ತುಂಬಾ ಕಡಿಮೆ ನಿದ್ರೆ",
    "What do you usually eat?": "ಸಾಮಾನ್ಯವಾಗಿ ಏನು ತಿನ್ನುತ್ತೀರಿ?",
    "Vegetarian": "ಸಸ್ಯಾಹಾರ",
    "Mostly outside food": "ಹೆಚ್ಚಾಗಿ ಹೊರಗಿನ ಆಹಾರ",
    "Years": "ವರ್ಷಗಳು",
    "There is a lot of pain in my chest.": "ಎದೆಯಲ್ಲಿ ತುಂಬಾ ನೋವಾಗುತ್ತಿದೆ.",
    "Pain, since about two hours.": "ನೋವು, ಸುಮಾರು ಎರಡು ಗಂಟೆಯಿಂದ.",
    "It feels like a heavy weight pressing on my chest.": "ಎದೆಯ ಮೇಲೆ ಭಾರ ಒತ್ತಿದಂತೆ ಅನಿಸುತ್ತಿದೆ.",
    "The pain is going down into my left arm.": "ನೋವು ಎಡ ಕೈಗೆ ಇಳಿಯುತ್ತಿದೆ.",
    "I am sweating a lot and I feel breathless.": "ತುಂಬಾ ಬೆವರುತ್ತಿದೆ ಮತ್ತು ಉಸಿರಾಟ ಕಷ್ಟವಾಗಿದೆ.",
    "It keeps getting worse.": "ಹೆಚ್ಚಾಗುತ್ತಲೇ ಇದೆ.",
    "Nothing I do makes it better.": "ಏನು ಮಾಡಿದರೂ ಕಡಿಮೆಯಾಗುತ್ತಿಲ್ಲ.",
    "It started today, about two hours back.": "ಇಂದೇ ಶುರುವಾಯಿತು, ಸುಮಾರು ಎರಡು ಗಂಟೆ ಹಿಂದೆ.",
    "I have sugar. I take a tablet for it.": "ನನಗೆ ಸಕ್ಕರೆ ಇದೆ, ಅದಕ್ಕೆ ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳುತ್ತೇನೆ.",
    "No, nothing troubles me.": "ಇಲ್ಲ, ಯಾವುದೂ ತೊಂದರೆ ಕೊಡುವುದಿಲ್ಲ.",
    "I do farming.": "ನಾನು ವ್ಯವಸಾಯ ಮಾಡುತ್ತೇನೆ.",
  },
  gu: {
    "Touch anywhere to begin": "શરૂ કરવા ગમે ત્યાં અડકો",
    "Choose your language": "તમારી ભાષા પસંદ કરો",
    "Back": "પાછળ",
    "Repeat": "ફરી સાંભળો",
    "Language": "ભાષા",
    "Get help": "મદદ જોઈએ",
    "Hold to speak": "બોલવા દબાવી રાખો",
    "or tap a picture": "અથવા ચિત્ર પસંદ કરો",
    "Listening…": "સાંભળી રહ્યા છીએ…",
    "Next": "આગળ",
    "Yes": "હા",
    "No": "ના",
    "Not sure": "ચોક્કસ ખબર નથી",
    "It's noisy — please tap instead": "ઘોંઘાટ છે — કૃપા કરી ચિત્ર દબાવો",
    "Kiosk Mitra has been called": "કિયોસ્ક મિત્રને બોલાવ્યા છે",
    "Session cleared": "માહિતી ભૂંસી નાખી છે",
    "Full text for this language is not in the demo. Showing English; voice stays in your language.": "આ ભાષાનું પૂરું લખાણ ડેમોમાં નથી. અંગ્રેજી બતાવીએ છીએ; અવાજ તમારી ભાષામાં જ રહેશે.",
    "You do not need to do anything.": "તમારે કંઈ કરવાનું નથી.",
    "A staff member is coming to see you now. Please stay here.": "એક કર્મચારી હમણાં જ તમારી પાસે આવે છે. અહીં જ રહો.",
    "Chest": "છાતી",
    "Head": "માથું",
    "Stomach": "પેટ",
    "Arms & legs": "હાથ અને પગ",
    "Skin": "ચામડી",
    "Urine": "પેશાબ",
    "Somewhere else": "બીજે ક્યાંક",
    "Where is the trouble?": "તકલીફ ક્યાં છે?",
    "Pain": "દુખાવો",
    "Fever": "તાવ",
    "Cough": "ઉધરસ",
    "Breathlessness": "શ્વાસ ચઢવો",
    "Vomiting": "ઉલટી",
    "Nausea": "ઉબકા",
    "Dizziness": "ચક્કર",
    "Weakness or tiredness": "નબળાઈ કે થાક",
    "Bleeding": "લોહી નીકળવું",
    "Rash": "ચામડી પર ચકામા",
    "Injury": "ઈજા",
    "Sweating": "પરસેવો",
    "Something else": "બીજું કંઈક",
    "What troubles you most?": "સૌથી વધુ શું તકલીફ આપે છે?",
    "How does the pain feel?": "દુખાવો કેવો લાગે છે?",
    "Heavy, pressing": "ભારે, દબાણ જેવું",
    "Sharp, stabbing": "તીક્ષ્ણ, ભોંકાય તેવું",
    "Burning": "બળતરા",
    "Cramping": "આમળાય તેવું",
    "Dull ache": "ધીમો દુખાવો",
    "Does the pain travel anywhere?": "દુખાવો બીજે ક્યાંય જાય છે?",
    "Into the left arm": "ડાબા હાથમાં",
    "Into the jaw or neck": "જડબા કે ગળામાં",
    "Into the back": "પીઠમાં",
    "Down the leg": "પગ તરફ",
    "Stays in one place": "એક જ જગ્યાએ રહે છે",
    "What else is happening along with it?": "એની સાથે બીજું શું થાય છે?",
    "Nothing else": "બીજું કંઈ નહીં",
    "How does it come and go?": "કેવી રીતે આવે અને જાય છે?",
    "All the time": "બધો સમય",
    "Comes and goes": "આવે અને જાય",
    "Getting worse": "વધતું જાય છે",
    "About the same": "લગભગ એવું જ",
    "What makes it better or worse?": "શેનાથી સારું કે ખરાબ થાય છે?",
    "Rest helps": "આરામથી રાહત થાય છે",
    "Medicine helps": "દવાથી રાહત થાય છે",
    "Worse on moving": "હલનચલનથી વધે છે",
    "Worse after food": "જમ્યા પછી વધે છે",
    "Nothing helps": "કશાથી રાહત નથી",
    "How strong is it? Tap a face.": "કેટલું તીવ્ર છે? એક ચહેરો દબાવો.",
    "Since when?": "ક્યારથી?",
    "Since today": "આજથી",
    "This week": "આ અઠવાડિયે",
    "A few days": "થોડા દિવસ",
    "A few weeks": "થોડા અઠવાડિયા",
    "A few months": "થોડા મહિના",
    "More than three months": "ત્રણ મહિનાથી વધુ",
    "When do you get breathless?": "શ્વાસ ક્યારે ચઢે છે?",
    "Only on walking": "ફક્ત ચાલતી વખતે",
    "Even while sitting still": "બેઠા હોઈએ ત્યારે પણ",
    "Cannot finish a sentence": "એક વાક્ય પૂરું નથી કરી શકતો",
    "Is any of this happening right now?": "આમાંનું કંઈ અત્યારે થાય છે?",
    "Face pulled to one side": "મોઢું એક બાજુ ખેંચાયું છે",
    "Weakness on one side": "એક બાજુ નબળાઈ",
    "Speech slurred": "બોલવામાં લોચા",
    "Sudden loss of sight": "અચાનક દેખાવાનું બંધ",
    "Confusion": "ગૂંચવણ",
    "Fits": "આંચકી",
    "Very bad headache": "ખૂબ સખત માથાનો દુખાવો",
    "Stiff neck": "ગરદન અકડાઈ",
    "Is any of this happening?": "આમાંનું કંઈ થાય છે?",
    "Vomiting blood": "લોહીની ઉલટી",
    "Black stools": "કાળો ઝાડો",
    "None of these": "આમાંનું કંઈ નહીં",
    "Mind & mood": "મન અને મિજાજ",
    "How has your mind been these last few days?": "છેલ્લા થોડા દિવસથી મન કેવું છે?",
    "Low or sad": "ઉદાસ કે નિરાશ",
    "Anxious or fearful": "ચિંતા કે ડર",
    "Cannot sleep": "ઊંઘ નથી આવતી",
    "Thoughts of harming myself": "પોતાને નુકસાન કરવાના વિચાર",
    "Do you already have any of these?": "આમાંનું કંઈ પહેલેથી છે?",
    "Diabetes": "ડાયાબિટીસ (સુગર)",
    "High BP": "હાઈ બી.પી.",
    "Heart disease": "હૃદય રોગ",
    "Asthma or COPD": "દમ કે શ્વાસની બીમારી",
    "TB": "ટી.બી.",
    "Thyroid": "થાઇરોઇડ",
    "Kidney": "કિડની",
    "Cancer": "કેન્સર",
    "None|कोई नहीं": "કંઈ નથી",
    "Show me the medicines you take.": "તમે લેતા હો તે દવા બતાવો.",
    "Show the strips": "પત્તા બતાવો",
    "Say the names": "નામ કહો",
    "No medicines": "કોઈ દવા નહીં",
    "Does any medicine or food disagree with you?": "કોઈ દવા કે ખોરાક માફક નથી આવતો?",
    "A medicine": "કોઈ દવા",
    "A food": "કોઈ ખોરાક",
    "Nothing": "કંઈ નહીં",
    "Does anyone at home have these?": "ઘરમાં કોઈને આ છે?",
    "No one": "કોઈને નહીં",
    "Do you use any of these?": "આમાંનું કંઈ વાપરો છો?",
    "Beedi or cigarette": "બીડી કે સિગારેટ",
    "Tobacco or gutka": "તમાકુ કે ગુટખા",
    "Alcohol": "દારૂ",
    "None|कुछ नहीं": "કંઈ નહીં",
    "What work do you do?": "તમે શું કામ કરો છો?",
    "Farming": "ખેતી",
    "Daily labour": "રોજમદારી",
    "Shop or office": "દુકાન કે ઓફિસ",
    "Driving": "ડ્રાઇવિંગ",
    "Work at home": "ઘરકામ",
    "Are you pregnant?": "તમે ગર્ભવતી છો?",
    "When was your last period?": "છેલ્લું માસિક ક્યારે આવ્યું?",
    "About two weeks ago": "લગભગ બે અઠવાડિયા પહેલા",
    "About a month ago": "લગભગ એક મહિના પહેલા",
    "Irregular": "અનિયમિત",
    "Baby moving less": "બાળકની હલચલ ઓછી",
    "Which describes your body and nature best?": "તમારું શરીર અને સ્વભાવ કોની સાથે મળે છે?",
    "Thin, quick, dry skin": "પાતળું, ઝડપી, સૂકી ચામડી",
    "Medium, warm, sharp": "મધ્યમ, ગરમ, તીક્ષ્ણ",
    "Heavy, calm, oily skin": "ભારે, શાંત, તેલવાળી ચામડી",
    "Mixed": "મિશ્ર",
    "Which feels out of balance now?": "અત્યારે શું અસંતુલિત લાગે છે?",
    "Dryness, gas, joint pain": "સૂકાપણું, ગેસ, સાંધાનો દુખાવો",
    "Burning, acidity, anger": "બળતરા, એસિડિટી, ગુસ્સો",
    "Heaviness, cough, sluggishness": "ભારેપણું, ઉધરસ, સુસ્તી",
    "How would you describe your overall tissue strength?": "તમારા શરીરની એકંદર શક્તિ કેવી છે?",
    "Strong": "મજબૂત",
    "Moderate": "મધ્યમ",
    "Weak": "નબળું",
    "How is your build?": "તમારો બાંધો કેવો છે?",
    "Well built": "મજબૂત બાંધો",
    "Medium": "મધ્યમ",
    "Lean": "પાતળું",
    "How many kinds of food suit you?": "કેટલા પ્રકારનો ખોરાક તમને માફક આવે છે?",
    "All kinds": "બધા પ્રકાર",
    "Some kinds": "કેટલાક પ્રકાર",
    "Very few": "બહુ ઓછા",
    "How do you handle difficulty?": "મુશ્કેલી કેવી રીતે સંભાળો છો?",
    "Stay steady": "સ્થિર રહું છું",
    "Somewhat affected": "થોડી અસર થાય છે",
    "Easily upset": "જલદી વ્યથિત થાઉં છું",
    "How is your appetite?": "તમારી ભૂખ કેવી છે?",
    "Good": "સારી",
    "Poor": "ઓછી",
    "How long can you work before tiring?": "થાક્યા પહેલા કેટલો સમય કામ કરી શકો છો?",
    "All day": "આખો દિવસ",
    "Until afternoon": "બપોર સુધી",
    "Tire quickly": "જલદી થાકી જાઉં છું",
    "Which stage of life are you in?": "તમે જીવનના કયા તબક્કામાં છો?",
    "Under 30": "ત્રીસથી ઓછું",
    "30 to 60": "ત્રીસથી સાઠ",
    "Over 60": "સાઠથી વધુ",
    "How is your weight compared to usual?": "સામાન્ય કરતાં વજન કેવું છે?",
    "Heavier": "વધ્યું છે",
    "Lighter": "ઘટ્યું છે",
    "How is your digestion?": "તમારું પાચન કેવું છે?",
    "Very sharp, hungry often": "બહુ સારું, વારંવાર ભૂખ",
    "Slow, heavy after food": "ધીમું, જમ્યા પછી ભારે",
    "Changes day to day": "દિવસે દિવસે બદલાય છે",
    "How are your bowels?": "તમારો ઝાડો કેવો છે?",
    "Regular": "નિયમિત",
    "Hard, difficult": "કઠણ, મુશ્કેલ",
    "Loose": "પાતળો",
    "How do you sleep?": "તમારી ઊંઘ કેવી છે?",
    "Sound sleep": "ગાઢ ઊંઘ",
    "Broken sleep": "ઊંઘ તૂટે છે",
    "Very little sleep": "બહુ ઓછી ઊંઘ",
    "What do you usually eat?": "સામાન્ય રીતે શું ખાઓ છો?",
    "Vegetarian": "શાકાહારી",
    "Mostly outside food": "મોટે ભાગે બહારનું ખાવાનું",
    "Years": "વર્ષ",
    "There is a lot of pain in my chest.": "છાતીમાં બહુ દુખાવો થાય છે.",
    "Pain, since about two hours.": "દુખાવો, લગભગ બે કલાકથી.",
    "It feels like a heavy weight pressing on my chest.": "છાતી પર ભારે વજન દબાયું હોય એવું લાગે છે.",
    "The pain is going down into my left arm.": "દુખાવો ડાબા હાથમાં ઊતરે છે.",
    "I am sweating a lot and I feel breathless.": "બહુ પરસેવો થાય છે અને શ્વાસ ચઢે છે.",
    "It keeps getting worse.": "વધતું જ જાય છે.",
    "Nothing I do makes it better.": "કંઈ કરવાથી રાહત નથી.",
    "It started today, about two hours back.": "આજે જ શરૂ થયું, લગભગ બે કલાક પહેલા.",
    "I have sugar. I take a tablet for it.": "મને સુગર છે, એની ગોળી લઉં છું.",
    "No, nothing troubles me.": "ના, કશાથી તકલીફ નથી.",
    "I do farming.": "હું ખેતી કરું છું.",
  },
};

// L(en, hi, mr, ta) carries the four packs written inline. bn/te/kn/gu are
// supplied by PACK below, keyed on the English source string, so adding a
// language costs one table and zero edits at the ~240 L() call sites.
const L = (en, hi, mr, ta) => ({ en, hi: hi || en, mr: mr || en, ta: ta || en });

// One English string in the trees carries two senses ("None" = no conditions
// vs. no habits), so PACK keys may be disambiguated as "English|<hindi>".
// Lookup tries the specific key first, then the plain one, then falls back
// to English — a missing entry degrades, it never throws or blanks.
const tr = (obj, lang) => {
  if (typeof obj === "string") return obj;
  if (!obj) return "";
  if (obj[lang]) return obj[lang];
  const p = PACK[lang];
  if (p) {
    const hit = p[`${obj.en}|${obj.hi}`] ?? p[obj.en];
    if (hit) return hit;
  }
  return obj.en || "";
};

// Share of the translatable surface a language actually covers. Computed, not
// asserted, so the language picker cannot claim coverage the tables lack.
function packCoverage(lang) {
  if (lang === "en") return 1;
  const keys = Object.keys(PACK.bn);
  if (["hi", "mr", "ta"].includes(lang)) return 1;
  const p = PACK[lang];
  if (!p) return 0;
  return keys.filter((k) => p[k]).length / keys.length;
}

const UI = {
  touchBegin:  L("Touch anywhere to begin", "शुरू करने के लिए कहीं भी छुएँ", "सुरू करण्यासाठी कुठेही स्पर्श करा", "தொடங்க எங்கும் தொடவும்"),
  chooseLang:  L("Choose your language", "अपनी भाषा चुनें", "तुमची भाषा निवडा", "உங்கள் மொழியைத் தேர்வு செய்யவும்"),
  back:        L("Back", "पीछे", "मागे", "பின்"),
  repeat:      L("Repeat", "फिर सुनें", "पुन्हा ऐका", "மீண்டும்"),
  changeLang:  L("Language", "भाषा", "भाषा", "மொழி"),
  getHelp:     L("Get help", "मदद चाहिए", "मदत हवी", "உதவி வேண்டும்"),
  holdSpeak:   L("Hold to speak", "बोलने के लिए दबाए रखें", "बोलण्यासाठी दाबून धरा", "பேச அழுத்திப் பிடிக்கவும்"),
  orTap:       L("or tap a picture", "या चित्र चुनें", "किंवा चित्र निवडा", "அல்லது படத்தைத் தேர்ந்தெடுக்கவும்"),
  listening:   L("Listening…", "सुन रहे हैं…", "ऐकत आहोत…", "கேட்கிறது…"),
  next:        L("Next", "आगे", "पुढे", "அடுத்து"),
  noisy:       L("It's noisy — please tap instead", "शोर है — कृपया चित्र छुएँ", "गोंगाट आहे — कृपया चित्र निवडा", "இரைச்சல் அதிகம் — தயவுசெய்து தொடவும்"),
  yes:         L("Yes", "हाँ", "होय", "ஆம்"),
  no:          L("No", "नहीं", "नाही", "இல்லை"),
  staffComing: L("A staff member is coming to see you now. Please stay here.",
                 "एक कर्मचारी अभी आपके पास आ रहे हैं। कृपया यहीं रहें।",
                 "एक कर्मचारी आत्ताच तुमच्याकडे येत आहेत. कृपया इथेच थांबा.",
                 "ஒரு பணியாளர் இப்போது உங்களிடம் வருகிறார். தயவுசெய்து இங்கேயே இருங்கள்."),
  sitTight:    L("You do not need to do anything.", "आपको कुछ नहीं करना है।", "तुम्हाला काही करायचे नाही.", "நீங்கள் எதுவும் செய்ய வேண்டாம்."),
  sessionClr:  L("Session cleared", "सत्र मिटाया गया", "सत्र पुसले गेले", "அமர்வு அழிக்கப்பட்டது"),
  helpCalled:  L("Kiosk Mitra has been called", "कियोस्क मित्र को बुलाया गया", "कियोस्क मित्र यांना बोलावले", "கியாஸ்க் மித்ரா அழைக்கப்பட்டார்"),
  packStub:    L("Full text for this language is not in the demo. Showing English; voice stays in your language.",
                 "इस भाषा का पूरा पाठ डेमो में नहीं है।", "या भाषेचा पूर्ण मजकूर डेमोमध्ये नाही.", "இந்த மொழியின் முழு உரை டெமோவில் இல்லை."),
};

/* ------------------------------------------------------------- tiny helpers */
const uid = (p = "id") => `${p}-${Math.random().toString(36).slice(2, 10)}`;
const nowISO = () => new Date().toISOString();
const clock = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const mmss = (s) => `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, "0")} s`;

/* ------------------------------------------------------------ design tokens */
const FONT_UI = "'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Tamil', system-ui, -apple-system, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const GlobalStyle = () => (
  <style>{`
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Tamil:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
* { box-sizing: border-box; }
.pr-root { font-family: ${FONT_UI}; color: ${C.ink}; -webkit-font-smoothing: antialiased; }
.pr-root button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
.pr-root button:focus-visible, .pr-root [tabindex]:focus-visible {
  outline: 3px solid ${C.teal}; outline-offset: 3px; border-radius: 6px; }
.pr-mono { font-family: ${FONT_MONO}; font-variant-numeric: tabular-nums; }
.pr-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
.pr-scroll::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 8px; }
.pr-scroll::-webkit-scrollbar-track { background: transparent; }
@keyframes prFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes prPulse { 0%,100% { transform: scale(1); opacity: .85 } 50% { transform: scale(1.06); opacity: 1 } }
@keyframes prRipple { 0% { transform: scale(.7); opacity: .55 } 100% { transform: scale(2.1); opacity: 0 } }
@keyframes prSweep { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
@keyframes prFlagIn { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: none } }
@keyframes prVoiceArmGesture {
  0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
  15% { transform: translate(0px, 0px) rotate(0deg); }
  42% { transform: translate(-30px, -44px) rotate(-16deg); }
  78% { transform: translate(-30px, -44px) rotate(-16deg); }
  92% { transform: translate(0px, 0px) rotate(0deg); }
}
@keyframes prVoiceSoundWaves {
  0%, 35% { opacity: 0; transform: scale(0.6) translate(-8px, 0); }
  50% { opacity: 0.95; transform: scale(1) translate(0px, 0); }
  75% { opacity: 0.3; transform: scale(1.35) translate(8px, 0); }
  85%, 100% { opacity: 0; transform: scale(1.6) translate(14px, 0); }
}
@keyframes prScanCardMove {
  0%, 100% { transform: translateY(22px) rotate(-3deg); opacity: 0.82; }
  32%, 76% { transform: translateY(0px) rotate(0deg); opacity: 1; }
  90% { transform: translateY(22px) rotate(-3deg); opacity: 0.82; }
}
@keyframes prLaserSweepLine {
  0%, 100% { transform: translateY(0px); opacity: 0.3; }
  50% { transform: translateY(120px); opacity: 1; }
}
@keyframes prScanTargetLock {
  0%, 28% { stroke: #5B7185; opacity: 0.6; }
  42%, 82% { stroke: #1E7B45; opacity: 1; }
  92%, 100% { stroke: #5B7185; opacity: 0.6; }
}
@keyframes prCheckPop {
  0%, 38% { transform: scale(0); opacity: 0; }
  50%, 82% { transform: scale(1.1); opacity: 1; }
  92%, 100% { transform: scale(0); opacity: 0; }
}
@keyframes prDocSlideIn {
  0%, 100% { transform: translateY(-18px) scale(0.96); opacity: 0.7; }
  35%, 80% { transform: translateY(0px) scale(1); opacity: 1; }
  90% { transform: translateY(-18px) scale(0.96); opacity: 0.7; }
}
.pr-in { animation: prFade .32s cubic-bezier(.2,.7,.3,1) both; }
.pr-tile { transition: transform .14s ease, box-shadow .14s ease, background .14s ease; }
.pr-tile:active { transform: scale(.975); }
.pr-row:hover { background: ${C.bg}; }
@media (prefers-reduced-motion: reduce) {
  .pr-root *, .pr-root *::before, .pr-root *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
  `}</style>
);

/* --------------------------------------------------------- store / context */
const Store = createContext(null);
const useStore = () => useContext(Store);

/* ------------------------------------------------------------- UI primitives */
function Badge({ tone = "navy", children, mono, title, size = "sm", style }) {
  const tones = {
    navy:    { bg: "#DCEAF7", fg: C.navy,    bd: "#B9D3EC" },
    teal:    { bg: "#D4EEF0", fg: "#0A5F67", bd: "#A9DCE0" },
    saffron: { bg: "#FBE2D4", fg: "#8E3E14", bd: "#F0C2A6" },
    amber:   { bg: "#FBEDD6", fg: "#8A5410", bd: "#F2D6A8" },
    green:   { bg: C.mint,    fg: "#155C33", bd: "#B4DDBB" },
    grey:    { bg: "#E7EEF5", fg: C.muted,   bd: "#D2DFEA" },
  }[tone];
  return (
    <span title={title} className={mono ? "pr-mono" : ""} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: tones.bg, color: tones.fg, border: `1px solid ${tones.bd}`,
      padding: size === "sm" ? "2px 7px" : "4px 10px",
      borderRadius: 999, fontSize: size === "sm" ? 11 : 13, fontWeight: 700,
      letterSpacing: ".02em", whiteSpace: "nowrap", lineHeight: 1.5, ...style,
    }}>{children}</span>
  );
}

function Card({ children, style, pad = 16, ...rest }) {
  return (
    <div {...rest} style={{
      background: C.white, border: `1px solid ${C.line}`, borderRadius: 14,
      padding: pad, boxShadow: "0 1px 2px rgba(14,58,102,.05)", ...style,
    }}>{children}</div>
  );
}

function Btn({ children, onClick, tone = "navy", icon: Icon, size = "md", disabled, style, ghost, title, ...rest }) {
  const palette = { navy: C.navy, teal: C.teal, saffron: C.saffron, green: C.green, grey: C.muted }[tone];
  const S = { sm: { p: "7px 12px", f: 13, i: 15 }, md: { p: "11px 18px", f: 15, i: 18 }, lg: { p: "18px 28px", f: 20, i: 24 } }[size];
  return (
    <button onClick={onClick} disabled={disabled} title={title} {...rest} className="pr-tile" style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9,
      background: ghost ? "transparent" : palette, color: ghost ? palette : C.white,
      border: ghost ? `1.5px solid ${palette}` : "1.5px solid transparent",
      padding: S.p, borderRadius: 10, fontSize: S.f, fontWeight: 700,
      opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? "none" : "auto", ...style,
    }}>
      {Icon && <Icon size={S.i} strokeWidth={2.2} />}{children}
    </button>
  );
}

function Toggle({ on, onChange, label, sub, id }) {
  return (
    <div onClick={() => onChange(!on)} role="switch" aria-checked={on} tabIndex={0} id={id}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(!on); } }}
      style={{ display: "flex", gap: 14, alignItems: "flex-start", cursor: "pointer", padding: "12px 4px" }}>
      <div style={{
        width: 58, height: 34, flex: "0 0 58px", borderRadius: 999, marginTop: 2,
        background: on ? C.green : "#C3D2DF", position: "relative", transition: "background .18s",
      }}>
        <div style={{
          position: "absolute", top: 3, left: on ? 27 : 3, width: 28, height: 28,
          borderRadius: "50%", background: C.white, transition: "left .18s cubic-bezier(.2,.7,.3,1)",
          boxShadow: "0 1px 3px rgba(0,0,0,.25)",
        }} />
      </div>
      <div>
        <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.35 }}>{label}</div>
        {sub && <div style={{ fontSize: 15, color: C.muted, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <h3 style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: C.muted }}>{children}</h3>
      {right}
    </div>
  );
}

function Empty({ icon: Icon = ClipboardList, title, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "34px 18px", color: C.muted }}>
      <Icon size={26} strokeWidth={1.7} style={{ opacity: .55 }} />
      <div style={{ fontWeight: 700, marginTop: 10, color: C.ink, fontSize: 14 }}>{title}</div>
      {hint && <div style={{ fontSize: 13, marginTop: 4, maxWidth: 280, marginInline: "auto", lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

/* ============================================================================
   CLINICAL CONTENT — fixed question trees.
   This is a bounded structured interview, not a chatbot. The interview can
   only ever ask questions that appear below; the LLM (when configured) is
   allowed to rephrase and to extract, never to decide what to ask next.
   ========================================================================== */

const ICONS = {
  head: Brain, chest: Heart, abdomen: CircleDot, limbs: Bone, skin: Hand,
  urinary: Droplets, mind: Sparkles, other: HelpCircle,
  fever: Thermometer, cough: Wind, pain: Zap, breathless: Wind, vomiting: Droplets,
  dizziness: Waves, rash: Hand, injury: Bone,
  sweat: Droplets, nausea: Droplets, blood: Droplets, stool: CircleDot,
  neck: Bone, confusion: Brain, none: Ban,
  pressing: Scale, burning: Flame, stabbing: Zap, cramping: Waves, dull: CircleDot,
  arm: Hand, jaw: Bone, back: Bone, leg: Bone, stay: CircleDot,
  today: Sun, days: Clock, weeks: Clock, months: Clock, years: Clock,
  diabetes: Droplets, bp: Activity, heart: Heart, asthma: Wind, tb: Wind,
  thyroid: CircleDot, kidney: CircleDot, cancer: CircleDot, epilepsy: Zap,
  camera: Camera, speak: Mic, pill: Pill, syringe: Syringe, food: Utensils,
  smoke: Cigarette, tobacco: Leaf, alcohol: Wine,
  farm: Leaf, labour: Hand, drive: Activity, office: Briefcase, home: Users,
  pregnant: Baby, sleep: Moon, digestion: Utensils, eye: Eye, walk: Activity,
  strong: Activity, medium: Scale, weak: Waves, leaf: Leaf, sun: Sun, moon: Moon,
  water: Droplets, constant: Clock, worse: Activity, rest: Moon, move: Activity,
};
const Ico = ({ name, size = 40, color }) => {
  const Cmp = ICONS[name] || CircleDot;
  return <Cmp size={size} strokeWidth={1.9} color={color} />;
};

const o = (id, icon, label, tags = []) => ({ id, icon, label, tags });

/* ------------------------------------------------- ALLOPATHY question tree */
const ALLOPATHY = [
  { id: "cc.site", section: "Complaint", kind: "single", body: true,
    text: L("Where is the trouble?", "तकलीफ़ कहाँ है?", "त्रास कुठे आहे?", "பிரச்சனை எங்கே?"),
    options: [
      o("head", "head", L("Head", "सिर", "डोके", "தலை")),
      o("chest", "chest", L("Chest", "छाती", "छाती", "மார்பு"), ["chest"]),
      o("abdomen", "abdomen", L("Stomach", "पेट", "पोट", "வயிறு"), ["abdomen"]),
      o("limbs", "limbs", L("Arms & legs", "हाथ-पैर", "हात-पाय", "கை-கால்")),
      o("skin", "skin", L("Skin", "त्वचा", "त्वचा", "தோல்")),
      o("urinary", "urinary", L("Urine", "पेशाब", "लघवी", "சிறுநீர்")),
      o("mind", "mind", L("Mind & mood", "मन", "मन", "மனம்"), ["mind"]),
      o("other", "other", L("Somewhere else", "और कहीं", "इतर ठिकाणी", "வேறு இடம்")),
    ] },

  { id: "cc.symptom", section: "Complaint", kind: "multi",
    text: L("What troubles you most?", "सबसे ज़्यादा क्या तकलीफ़ है?", "सर्वात जास्त काय त्रास होतो?", "மிகவும் என்ன தொந்தரவு?"),
    options: [
      o("fever", "fever", L("Fever", "बुखार", "ताप", "காய்ச்சல்"), ["fever"]),
      o("cough", "cough", L("Cough", "खाँसी", "खोकला", "இருமல்")),
      o("pain", "pain", L("Pain", "दर्द", "वेदना", "வலி"), ["pain"]),
      o("breathless", "breathless", L("Breathlessness", "साँस फूलना", "धाप लागणे", "மூச்சுத் திணறல்"), ["breathless"]),
      o("vomiting", "vomiting", L("Vomiting", "उल्टी", "उलटी", "வாந்தி")),
      o("dizziness", "dizziness", L("Dizziness", "चक्कर", "चक्कर", "தலைச்சுற்றல்")),
      o("rash", "rash", L("Rash", "चकत्ते", "पुरळ", "தடிப்பு")),
      o("injury", "injury", L("Injury", "चोट", "जखम", "காயம்")),
      o("fatigue", "weak", L("Weakness or tiredness", "कमज़ोरी या थकान", "अशक्तपणा किंवा थकवा", "பலவீனம் அல்லது சோர்வு")),
    ] },

  { id: "neuro.now", section: "Complaint", kind: "multi", when: (a) => a["cc.site"]?.ids?.includes("head"),
    text: L("Is any of this happening right now?", "क्या अभी इनमें से कुछ हो रहा है?", "आत्ता यापैकी काही होत आहे का?", "இப்போது இவற்றில் ஏதேனும் உள்ளதா?"),
    options: [
      o("droop", "head", L("Face pulled to one side", "मुँह टेढ़ा", "तोंड वाकडे", "முகம் கோணல்"), ["facial_droop"]),
      o("weak", "limbs", L("Weakness on one side", "एक तरफ़ कमज़ोरी", "एका बाजूला अशक्तपणा", "ஒரு பக்க பலவீனம்"), ["unilateral_weakness"]),
      o("speech", "speak", L("Speech slurred", "बोलने में लड़खड़ाहट", "बोलताना अडखळणे", "பேச்சு தடுமாற்றம்"), ["slurred_speech"]),
      o("vision", "eye", L("Sudden loss of sight", "अचानक दिखना बंद", "अचानक दिसणे बंद", "திடீர் பார்வை இழப்பு"), ["vision_loss"]),
      o("none", "none", L("None of these", "कुछ नहीं", "यापैकी काही नाही", "எதுவும் இல்லை")),
    ] },

  { id: "mind.mood", section: "Complaint", kind: "single", when: (a) => a["cc.site"]?.ids?.includes("mind"),
    text: L("How has your mind been these last few days?", "पिछले कुछ दिनों में मन कैसा रहा?", "गेल्या काही दिवसांत मन कसे होते?", "கடந்த சில நாட்களாக மனநிலை எப்படி?"),
    options: [
      o("low", "moon", L("Low or sad", "उदास", "उदास", "சோகம்")),
      o("anx", "waves", L("Anxious or fearful", "घबराहट", "भीती वाटते", "பதட்டம்")),
      o("sleep", "sleep", L("Cannot sleep", "नींद नहीं आती", "झोप येत नाही", "தூக்கம் இல்லை")),
      o("harm", "none", L("Thoughts of harming myself", "खुद को नुकसान पहुँचाने का ख़याल", "स्वतःला इजा करण्याचा विचार", "என்னைக் காயப்படுத்தும் எண்ணம்"), ["self_harm"]),
      o("other", "other", L("Something else", "और कुछ", "इतर काही", "வேறு ஏதாவது")),
    ] },

  { id: "soc.character", section: "Pain detail", kind: "single",
    when: (a) => a["cc.symptom"]?.ids?.includes("pain"),
    text: L("How does the pain feel?", "दर्द कैसा है?", "वेदना कशी आहे?", "வலி எப்படி இருக்கிறது?"),
    options: [
      o("pressing", "pressing", L("Heavy, pressing", "दबाव जैसा भारी", "दाबल्यासारखे जड", "அழுத்தமான கனம்")),
      o("burning", "burning", L("Burning", "जलन", "जळजळ", "எரிச்சல்")),
      o("stabbing", "stabbing", L("Sharp, stabbing", "चुभन", "टोचल्यासारखे", "குத்தல்")),
      o("cramping", "cramping", L("Cramping", "मरोड़", "पिळवटणे", "பிடிப்பு")),
      o("dull", "dull", L("Dull ache", "हल्का दर्द", "हलकी वेदना", "மந்தமான வலி")),
    ] },

  { id: "soc.radiation", section: "Pain detail", kind: "single",
    when: (a) => a["cc.symptom"]?.ids?.includes("pain"),
    text: L("Does the pain travel anywhere?", "दर्द कहीं और जाता है?", "वेदना दुसरीकडे जाते का?", "வலி வேறு எங்காவது பரவுகிறதா?"),
    options: [
      o("arm", "arm", L("Into the left arm", "बाएँ हाथ में", "डाव्या हातात", "இடது கைக்கு"), ["radiate_arm"]),
      o("jaw", "jaw", L("Into the jaw or neck", "जबड़े या गर्दन में", "जबड्यात किंवा मानेत", "தாடை அல்லது கழுத்துக்கு"), ["radiate_jaw"]),
      o("back", "back", L("Into the back", "पीठ में", "पाठीत", "முதுகுக்கு")),
      o("leg", "leg", L("Down the leg", "पैर की ओर", "पायाकडे", "காலை நோக்கி")),
      o("stay", "stay", L("Stays in one place", "एक ही जगह रहता है", "एकाच ठिकाणी राहते", "ஒரே இடத்தில்")),
    ] },

  { id: "soc.associated", section: "Pain detail", kind: "multi",
    when: (a) => a["cc.symptom"]?.ids?.includes("pain") || a["cc.symptom"]?.ids?.includes("fever"),
    text: L("What else is happening along with it?", "साथ में और क्या हो रहा है?", "सोबत आणखी काय होत आहे?", "அத்துடன் வேறு என்ன?"),
    options: [
      o("sweat", "sweat", L("Sweating", "पसीना", "घाम", "வியர்வை"), ["sweating"]),
      o("breathless", "breathless", L("Breathlessness", "साँस फूलना", "धाप लागणे", "மூச்சுத் திணறல்"), ["breathless"]),
      o("nausea", "nausea", L("Nausea", "जी मिचलाना", "मळमळ", "குமட்டல்")),
      o("hematemesis", "blood", L("Vomiting blood", "खून की उल्टी", "रक्ताची उलटी", "ரத்த வாந்தி"), ["hematemesis"]),
      o("melena", "stool", L("Black stools", "काला पखाना", "काळे शौच", "கருப்பு மலம்"), ["melena"]),
      o("neck", "neck", L("Stiff neck", "गर्दन अकड़ना", "मान अवघडणे", "கழுத்து விறைப்பு"), ["neck_stiffness"]),
      o("confusion", "confusion", L("Confusion", "उलझन", "गोंधळ", "குழப்பம்"), ["confusion"]),
      o("none", "none", L("Nothing else", "कुछ नहीं", "काही नाही", "வேறு எதுவும் இல்லை")),
    ] },

  { id: "soc.timecourse", section: "Pain detail", kind: "single",
    when: (a) => a["cc.symptom"]?.ids?.includes("pain"),
    text: L("How does it come and go?", "दर्द कैसे चलता है?", "वेदना कशी चालते?", "வலி எப்படி வருகிறது?"),
    options: [
      o("constant", "constant", L("All the time", "लगातार", "सतत", "தொடர்ச்சியாக")),
      o("intermittent", "waves", L("Comes and goes", "आता-जाता है", "येते-जाते", "வந்து போகும்")),
      o("worse", "worse", L("Getting worse", "बढ़ रहा है", "वाढत आहे", "அதிகரிக்கிறது")),
    ] },

  { id: "soc.relieving", section: "Pain detail", kind: "single",
    when: (a) => a["cc.symptom"]?.ids?.includes("pain"),
    text: L("What makes it better or worse?", "किससे आराम या ज़्यादा होता है?", "कशाने आराम किंवा जास्त होते?", "எதனால் குறையும் அல்லது அதிகரிக்கும்?"),
    options: [
      o("rest", "rest", L("Rest helps", "आराम से ठीक", "आरामाने बरे", "ஓய்வால் நிவாரணம்")),
      o("move", "move", L("Worse on moving", "हिलने पर ज़्यादा", "हालचालीने वाढते", "அசைவால் அதிகரிக்கும்")),
      o("food", "food", L("Worse after food", "खाने के बाद ज़्यादा", "जेवणानंतर वाढते", "உணவுக்குப் பின் அதிகரிக்கும்")),
      o("medicine", "pill", L("Medicine helps", "दवा से आराम", "औषधाने आराम", "மருந்தால் நிவாரணம்")),
      o("nothing", "none", L("Nothing helps", "किसी से नहीं", "कशानेही नाही", "எதுவும் பயனில்லை")),
    ] },

  { id: "soc.severity", section: "Pain detail", kind: "scale",
    when: (a) => a["cc.symptom"]?.ids?.includes("pain"),
    text: L("How strong is it? Tap a face.", "कितना तेज़ है? एक चेहरा छुएँ।", "किती तीव्र आहे? एक चेहरा निवडा.", "எவ்வளவு கடுமை? ஒரு முகத்தைத் தொடவும்.") },

  { id: "breath.when", section: "Complaint", kind: "single",
    when: (a) => a["cc.symptom"]?.ids?.includes("breathless") || a["soc.associated"]?.ids?.includes("breathless"),
    text: L("When do you get breathless?", "साँस कब फूलती है?", "धाप कधी लागते?", "மூச்சுத் திணறல் எப்போது?"),
    options: [
      o("walking", "walk", L("Only on walking", "सिर्फ़ चलने पर", "फक्त चालताना", "நடக்கும்போது மட்டும்")),
      o("rest", "rest", L("Even while sitting still", "बैठे-बैठे भी", "बसल्यावरही", "உட்கார்ந்திருக்கும்போதும்"), ["breathless_rest"]),
      o("sentence", "speak", L("Cannot finish a sentence", "पूरा वाक्य नहीं बोल पाते", "पूर्ण वाक्य बोलता येत नाही", "முழு வாக்கியம் பேச முடியாது"), ["cannot_complete_sentence"]),
    ] },

  { id: "duration", section: "Duration", kind: "single",
    text: L("Since when?", "कब से है?", "कधीपासून आहे?", "எப்போதிருந்து?"),
    options: [
      o("today", "today", L("Since today", "आज से", "आजपासून", "இன்றிலிருந்து")),
      o("days", "days", L("A few days", "कुछ दिन", "काही दिवस", "சில நாட்கள்")),
      o("weeks", "weeks", L("A few weeks", "कुछ हफ़्ते", "काही आठवडे", "சில வாரங்கள்")),
      o("months", "months", L("A few months", "कुछ महीने", "काही महिने", "சில மாதங்கள்")),
      o("years", "years", L("Years", "कई साल", "अनेक वर्षे", "பல ஆண்டுகள்")),
    ] },

  { id: "pmh", section: "Past history", kind: "multi",
    text: L("Do you already have any of these?", "पहले से कोई बीमारी है?", "आधीपासून काही आजार आहे?", "ஏற்கனவே ஏதேனும் உள்ளதா?"),
    options: [
      o("diabetes", "diabetes", L("Diabetes", "मधुमेह", "मधुमेह", "நீரிழிவு")),
      o("htn", "bp", L("High BP", "बीपी", "रक्तदाब", "உயர் ரத்த அழுத்தம்")),
      o("cad", "heart", L("Heart disease", "दिल की बीमारी", "हृदयविकार", "இதய நோய்"), ["known_cad"]),
      o("asthma", "asthma", L("Asthma or COPD", "दमा", "दमा", "ஆஸ்துமா")),
      o("tb", "tb", L("TB", "टीबी", "क्षयरोग", "காசநோய்")),
      o("thyroid", "thyroid", L("Thyroid", "थायरॉइड", "थायरॉईड", "தைராய்டு")),
      o("kidney", "kidney", L("Kidney", "गुर्दा", "मूत्रपिंड", "சிறுநீரகம்")),
      o("cancer", "cancer", L("Cancer", "कैंसर", "कर्करोग", "புற்றுநோய்")),
      o("epilepsy", "epilepsy", L("Fits", "मिर्गी", "फेफरे", "வலிப்பு")),
      o("none", "none", L("None", "कोई नहीं", "काही नाही", "எதுவும் இல்லை")),
    ] },

  { id: "meds", section: "Medicines", kind: "capture",
    text: L("Show me the medicines you take.", "आप जो दवा लेते हैं, दिखाइए।", "तुम्ही घेत असलेली औषधे दाखवा.", "நீங்கள் எடுக்கும் மருந்துகளைக் காட்டுங்கள்."),
    options: [
      o("camera", "camera", L("Show the strips", "पत्ते दिखाएँ", "पाकिटे दाखवा", "மருந்துகளைக் காட்டு")),
      o("speak", "speak", L("Say the names", "नाम बोलें", "नावे सांगा", "பெயர்களைச் சொல்")),
      o("none", "none", L("No medicines", "कोई दवा नहीं", "औषध नाही", "மருந்து இல்லை")),
    ] },

  { id: "allergy", section: "Allergies", kind: "multi",
    text: L("Does any medicine or food disagree with you?", "किसी दवा या खाने से तकलीफ़ होती है?", "कोणत्या औषधाचा किंवा अन्नाचा त्रास होतो?", "மருந்து அல்லது உணவு ஒவ்வாமை உள்ளதா?"),
    options: [
      o("drug", "syringe", L("A medicine", "दवा से", "औषधाचा", "மருந்து")),
      o("food", "food", L("A food", "खाने से", "अन्नाचा", "உணவு")),
      o("none", "none", L("Nothing", "नहीं", "नाही", "இல்லை")),
    ] },

  { id: "family", section: "Family & social", kind: "multi",
    text: L("Does anyone at home have these?", "घर में किसी को ये बीमारी है?", "घरात कोणाला हे आजार आहेत?", "வீட்டில் யாருக்காவது இவை உள்ளதா?"),
    options: [
      o("diabetes", "diabetes", L("Diabetes", "मधुमेह", "मधुमेह", "நீரிழிவு")),
      o("htn", "bp", L("High BP", "बीपी", "रक्तदाब", "உயர் ரத்த அழுத்தம்")),
      o("cad", "heart", L("Heart disease", "दिल की बीमारी", "हृदयविकार", "இதய நோய்")),
      o("cancer", "cancer", L("Cancer", "कैंसर", "कर्करोग", "புற்றுநோய்")),
      o("tb", "tb", L("TB", "टीबी", "क्षयरोग", "காசநோய்")),
      o("none", "none", L("No one", "कोई नहीं", "कोणीही नाही", "யாரும் இல்லை")),
    ] },

  { id: "social", section: "Family & social", kind: "multi",
    text: L("Do you use any of these?", "इनमें से कुछ लेते हैं?", "यापैकी काही घेता का?", "இவற்றில் ஏதேனும் பயன்படுத்துகிறீர்களா?"),
    options: [
      o("smoke", "smoke", L("Beedi or cigarette", "बीड़ी-सिगरेट", "बिडी-सिगारेट", "பீடி அல்லது சிகரெட்")),
      o("tobacco", "tobacco", L("Tobacco or gutka", "तंबाकू-गुटखा", "तंबाखू-गुटखा", "புகையிலை")),
      o("alcohol", "alcohol", L("Alcohol", "शराब", "दारू", "மது")),
      o("none", "none", L("None", "कुछ नहीं", "काही नाही", "எதுவும் இல்லை")),
    ] },

  { id: "occupation", section: "Family & social", kind: "single",
    text: L("What work do you do?", "आप क्या काम करते हैं?", "तुम्ही काय काम करता?", "நீங்கள் என்ன வேலை செய்கிறீர்கள்?"),
    options: [
      o("farm", "farm", L("Farming", "खेती", "शेती", "விவசாயம்")),
      o("labour", "labour", L("Daily labour", "मज़दूरी", "मजुरी", "கூலி வேலை")),
      o("drive", "drive", L("Driving", "ड्राइविंग", "वाहन चालवणे", "ஓட்டுநர்")),
      o("office", "office", L("Shop or office", "दुकान या दफ़्तर", "दुकान किंवा ऑफिस", "கடை அல்லது அலுவலகம்")),
      o("home", "home", L("Work at home", "घर का काम", "घरकाम", "வீட்டு வேலை")),
      o("other", "other", L("Something else", "और कुछ", "इतर काही", "வேறு ஏதாவது")),
    ] },

  { id: "wh.pregnancy", section: "Women's health", kind: "single",
    when: (a, p) => p?.sex === "F" && p?.age >= 12 && p?.age <= 55,
    text: L("Are you pregnant?", "क्या आप गर्भवती हैं?", "तुम्ही गर्भवती आहात का?", "நீங்கள் கர்ப்பமாக இருக்கிறீர்களா?"),
    options: [
      o("yes", "pregnant", L("Yes", "हाँ", "होय", "ஆம்"), ["pregnant"]),
      o("no", "none", L("No", "नहीं", "नाही", "இல்லை")),
      o("unsure", "other", L("Not sure", "पता नहीं", "माहीत नाही", "தெரியவில்லை")),
    ] },

  { id: "wh.warning", section: "Women's health", kind: "multi",
    when: (a) => a["wh.pregnancy"]?.ids?.includes("yes"),
    text: L("Is any of this happening?", "क्या इनमें से कुछ हो रहा है?", "यापैकी काही होत आहे का?", "இவற்றில் ஏதேனும் நடக்கிறதா?"),
    options: [
      o("bleeding", "blood", L("Bleeding", "खून आना", "रक्तस्राव", "ரத்தப்போக்கு"), ["obs_bleeding"]),
      o("headache", "head", L("Very bad headache", "बहुत तेज़ सिरदर्द", "खूप तीव्र डोकेदुखी", "கடுமையான தலைவலி"), ["obs_headache"]),
      o("movement", "pregnant", L("Baby moving less", "बच्चा कम हिल रहा है", "बाळ कमी हलत आहे", "குழந்தை அசைவு குறைவு"), ["obs_fetal"]),
      o("none", "none", L("None of these", "कुछ नहीं", "काही नाही", "எதுவும் இல்லை")),
    ] },

  { id: "wh.lmp", section: "Women's health", kind: "single",
    when: (a, p) => p?.sex === "F" && p?.age >= 12 && p?.age <= 55,
    text: L("When was your last period?", "आख़िरी माहवारी कब हुई?", "शेवटची पाळी कधी आली?", "கடைசி மாதவிடாய் எப்போது?"),
    options: [
      o("week", "today", L("This week", "इस हफ़्ते", "या आठवड्यात", "இந்த வாரம்")),
      o("fortnight", "days", L("About two weeks ago", "करीब दो हफ़्ते पहले", "सुमारे दोन आठवड्यांपूर्वी", "சுமார் இரண்டு வாரங்கள் முன்")),
      o("month", "weeks", L("About a month ago", "करीब एक महीना पहले", "सुमारे एक महिन्यापूर्वी", "சுமார் ஒரு மாதம் முன்")),
      o("longer", "months", L("More than three months", "तीन महीने से ज़्यादा", "तीन महिन्यांहून अधिक", "மூன்று மாதங்களுக்கு மேல்")),
    ] },
];

/* ------------------------- AYUSH: Dashavidha Pariksha (ten-fold assessment) */
const AYUSH = [
  { id: "ay.prakriti", section: "Prakriti", kind: "single", sanskrit: "प्रकृति",
    text: L("Which describes your body and nature best?", "आपका शरीर और स्वभाव किससे मिलता है?", "तुमचे शरीर व स्वभाव कशाशी जुळते?", "உங்கள் உடல் மற்றும் இயல்பு எதற்கு பொருந்தும்?"),
    options: [
      o("vata", "waves", L("Thin, quick, dry skin", "पतला, फुर्तीला, रूखी त्वचा", "बारीक, चपळ, कोरडी त्वचा", "மெலிந்த, விரைவான, வறண்ட தோல்")),
      o("pitta", "sun", L("Medium, warm, sharp", "मध्यम, गरम, तेज़", "मध्यम, उष्ण, तीक्ष्ण", "நடுத்தர, சூடான, கூர்மையான")),
      o("kapha", "water", L("Heavy, calm, oily skin", "भारी, शांत, तैलीय त्वचा", "जड, शांत, तेलकट त्वचा", "கனமான, அமைதியான, எண்ணெய் தோல்")),
    ] },
  { id: "ay.vikriti", section: "Vikriti", kind: "single", sanskrit: "विकृति",
    text: L("Which feels out of balance now?", "अभी क्या असंतुलित लगता है?", "आत्ता काय असंतुलित वाटते?", "இப்போது எது சமநிலையற்றது?"),
    options: [
      o("vata", "waves", L("Dryness, gas, joint pain", "सूखापन, गैस, जोड़ों का दर्द", "कोरडेपणा, गॅस, सांधेदुखी", "வறட்சி, வாயு, மூட்டு வலி")),
      o("pitta", "burning", L("Burning, acidity, anger", "जलन, अम्लता, गुस्सा", "जळजळ, आम्लता, राग", "எரிச்சல், அமிலம், கோபம்")),
      o("kapha", "water", L("Heaviness, cough, sluggishness", "भारीपन, कफ, सुस्ती", "जडपणा, कफ, सुस्ती", "கனம், சளி, சோர்வு")),
      o("unsure", "other", L("Not sure", "पता नहीं", "माहीत नाही", "தெரியவில்லை")),
    ] },
  { id: "ay.sara", section: "Sara", kind: "single", sanskrit: "सार",
    text: L("How would you describe your overall tissue strength?", "आपकी शारीरिक मज़बूती कैसी है?", "तुमची शारीरिक ताकद कशी आहे?", "உங்கள் உடல் வலிமை எப்படி?"),
    options: [
      o("uttama", "strong", L("Strong", "मज़बूत", "मजबूत", "வலிமையான")),
      o("madhyama", "medium", L("Moderate", "मध्यम", "मध्यम", "நடுத்தரம்")),
      o("avara", "weak", L("Weak", "कमज़ोर", "कमकुवत", "பலவீனம்")),
    ] },
  { id: "ay.samhanana", section: "Samhanana", kind: "single", sanskrit: "संहनन",
    text: L("How is your build?", "आपकी काया कैसी है?", "तुमची शरीरयष्टी कशी आहे?", "உங்கள் உடல் அமைப்பு எப்படி?"),
    options: [
      o("compact", "strong", L("Well built", "सुगठित", "सुदृढ", "நன்கு கட்டமைந்த")),
      o("medium", "medium", L("Medium", "मध्यम", "मध्यम", "நடுத்தரம்")),
      o("lean", "weak", L("Lean", "दुबला", "बारीक", "மெலிந்த")),
    ] },
  { id: "ay.satmya", section: "Satmya", kind: "single", sanskrit: "सात्म्य",
    text: L("How many kinds of food suit you?", "कितने तरह का खाना आपको सूट करता है?", "किती प्रकारचे अन्न तुम्हाला मानवते?", "எத்தனை வகை உணவு உங்களுக்கு ஒத்துக்கொள்கிறது?"),
    options: [
      o("pravara", "food", L("All kinds", "सब कुछ", "सर्व प्रकार", "எல்லா வகையும்")),
      o("madhyama", "medium", L("Some kinds", "कुछ ही", "काहीच", "சில வகை")),
      o("avara", "weak", L("Very few", "बहुत कम", "फार कमी", "மிகச் சில")),
    ] },
  { id: "ay.satva", section: "Satva", kind: "single", sanskrit: "सत्त्व",
    text: L("How do you handle difficulty?", "मुश्किल में आप कैसे रहते हैं?", "अडचणीत तुम्ही कसे राहता?", "சிரமத்தை எப்படி எதிர்கொள்கிறீர்கள்?"),
    options: [
      o("pravara", "strong", L("Stay steady", "स्थिर रहता हूँ", "स्थिर राहतो", "நிலையாக இருப்பேன்")),
      o("madhyama", "medium", L("Somewhat affected", "थोड़ा असर होता है", "थोडा परिणाम होतो", "சற்று பாதிக்கும்")),
      o("avara", "weak", L("Easily upset", "जल्दी घबरा जाता हूँ", "लवकर घाबरतो", "எளிதில் கலங்குவேன்")),
    ] },
  { id: "ay.ahara", section: "Ahara Shakti", kind: "single", sanskrit: "आहार शक्ति",
    text: L("How is your appetite?", "भूख कैसी लगती है?", "भूक कशी लागते?", "பசி எப்படி இருக்கிறது?"),
    options: [
      o("good", "food", L("Good", "अच्छी", "चांगली", "நல்லது")),
      o("variable", "medium", L("Changes day to day", "बदलती रहती है", "बदलत राहते", "நாளுக்கு நாள் மாறும்")),
      o("poor", "weak", L("Poor", "कम", "कमी", "குறைவு")),
    ] },
  { id: "ay.vyayama", section: "Vyayama Shakti", kind: "single", sanskrit: "व्यायाम शक्ति",
    text: L("How long can you work before tiring?", "थकने से पहले कितना काम कर लेते हैं?", "थकण्यापूर्वी किती काम करू शकता?", "சோர்வடையும் முன் எவ்வளவு வேலை செய்வீர்கள்?"),
    options: [
      o("pravara", "strong", L("All day", "पूरा दिन", "पूर्ण दिवस", "நாள் முழுவதும்")),
      o("madhyama", "medium", L("Until afternoon", "दोपहर तक", "दुपारपर्यंत", "மதியம் வரை")),
      o("avara", "weak", L("Tire quickly", "जल्दी थक जाता हूँ", "लवकर थकतो", "விரைவில் சோர்வு")),
    ] },
  { id: "ay.vaya", section: "Vaya", kind: "single", sanskrit: "वय",
    text: L("Which stage of life are you in?", "आप जीवन के किस पड़ाव में हैं?", "तुम्ही आयुष्याच्या कोणत्या टप्प्यात आहात?", "வாழ்க்கையின் எந்தப் பருவம்?"),
    options: [
      o("bala", "sun", L("Under 30", "तीस से कम", "तीसच्या आत", "30க்கு கீழ்")),
      o("madhya", "medium", L("30 to 60", "तीस से साठ", "तीस ते साठ", "30 முதல் 60")),
      o("vriddha", "moon", L("Over 60", "साठ से ऊपर", "साठच्या वर", "60க்கு மேல்")),
    ] },
  { id: "ay.pramana", section: "Pramana", kind: "single", sanskrit: "प्रमाण",
    text: L("How is your weight compared to usual?", "आपका वज़न सामान्य से कैसा है?", "तुमचे वजन नेहमीपेक्षा कसे आहे?", "உங்கள் எடை வழக்கத்தை விட எப்படி?"),
    options: [
      o("sama", "medium", L("About the same", "लगभग वही", "जवळपास तेच", "கிட்டத்தட்ட அதே")),
      o("adhika", "strong", L("Heavier", "ज़्यादा", "जास्त", "அதிகம்")),
      o("hina", "weak", L("Lighter", "कम", "कमी", "குறைவு")),
    ] },
  { id: "ay.agni", section: "Agni", kind: "single", sanskrit: "अग्नि",
    text: L("How is your digestion?", "पाचन कैसा है?", "पचन कसे आहे?", "செரிமானம் எப்படி?"),
    options: [
      o("sama", "digestion", L("Regular", "ठीक", "नियमित", "ஒழுங்கானது")),
      o("vishama", "waves", L("Irregular", "अनियमित", "अनियमित", "ஒழுங்கற்றது")),
      o("tikshna", "burning", L("Very sharp, hungry often", "बहुत तेज़, जल्दी भूख", "खूप तीक्ष्ण, लवकर भूक", "மிகக் கூர்மை, அடிக்கடி பசி")),
      o("manda", "weak", L("Slow, heavy after food", "धीमा, खाने के बाद भारी", "मंद, जेवणानंतर जड", "மந்தம், உணவுக்குப் பின் கனம்")),
    ] },
  { id: "ay.koshtha", section: "Koshtha", kind: "single", sanskrit: "कोष्ठ",
    text: L("How are your bowels?", "पखाना कैसा होता है?", "शौच कसे होते?", "மலம் எப்படி?"),
    options: [
      o("madhya", "digestion", L("Regular", "ठीक", "नियमित", "ஒழுங்கானது")),
      o("krura", "stay", L("Hard, difficult", "कड़ा, मुश्किल", "कठीण", "கடினம்")),
      o("mridu", "water", L("Loose", "पतला", "पातळ", "தளர்வானது")),
    ] },
  { id: "ay.nidra", section: "Nidra", kind: "single", sanskrit: "निद्रा",
    text: L("How do you sleep?", "नींद कैसी आती है?", "झोप कशी लागते?", "தூக்கம் எப்படி?"),
    options: [
      o("sound", "sleep", L("Sound sleep", "गहरी नींद", "गाढ झोप", "நல்ல தூக்கம்")),
      o("broken", "moon", L("Broken sleep", "टूटती नींद", "तुटक झोप", "இடையிடையே விழிப்பு")),
      o("little", "weak", L("Very little sleep", "बहुत कम नींद", "फार कमी झोप", "மிகக் குறைவு")),
    ] },
  { id: "ay.diet", section: "Ahara", kind: "single", sanskrit: "आहार",
    text: L("What do you usually eat?", "आम तौर पर क्या खाते हैं?", "सहसा काय खाता?", "வழக்கமாக என்ன சாப்பிடுவீர்கள்?"),
    options: [
      o("veg", "leaf", L("Vegetarian", "शाकाहारी", "शाकाहारी", "சைவம்")),
      o("mixed", "food", L("Mixed", "मिश्रित", "मिश्र", "கலப்பு")),
      o("outside", "office", L("Mostly outside food", "ज़्यादातर बाहर का", "बहुतेक बाहेरचे", "பெரும்பாலும் வெளி உணவு")),
    ] },
];

const TREES = { ALLOPATHY, AYUSH };

const SECTION_NAMES = {
  "Complaint": L("Complaint", "मुख्य समस्या", "मुख्य त्रास", "புகார்"),
  "Pain detail": L("Pain detail", "दर्द का विवरण", "दुखण्याचा तपशील", "வலி விவரம்"),
  "Duration": L("Duration", "कब से है", "कधीपासून", "கால அளவு"),
  "Past history": L("Past history", "पुरानी बीमारी", "जुना आजार", "முந்தைய வரலாறு"),
  "Medicines": L("Medicines", "दवाइयाँ", "औषधे", "மருந்துகள்"),
  "Allergies": L("Allergies", "एलर्जी", "अ‍ॅलर्जी", "ஒவ்வாமை"),
  "Family & social": L("Family & social", "पारिवारिक व जीवनशैली", "कौटुंबिक व सामाजिक", "குடும்பம் & சமூகம்"),
  "Women's health": L("Women's health", "महिला स्वास्थ्य", "महिला आरोग्य", "பெண்கள் நலம்"),
  "Prakriti": L("Prakriti", "प्रकृति", "प्रकृती", "பிரகிருதி"),
  "Vikriti": L("Vikriti", "विकृति", "विकृती", "விக்ருதி"),
  "Sara": L("Sara", "सार", "सार", "சாரம்"),
  "Samhanana": L("Samhanana", "संहनन", "संहनन", "சம்ஹனனா"),
  "Satmya": L("Satmya", "सात्म्य", "सात्म्य", "சாத்மியா"),
  "Satva": L("Satva", "सत्त्व", "सत्त्व", "சத்வா"),
  "Ahara Shakti": L("Ahara Shakti", "आहार शक्ति", "आहार शक्ती", "ஆஹார சக்தி"),
  "Vyayama Shakti": L("Vyayama Shakti", "व्यायाम शक्ति", "व्यायाम शक्ती", "வியாயாம சக்தி"),
  "Vaya": L("Vaya", "वय (आयु)", "वय", "வயது"),
  "Pramana": L("Pramana", "प्रमाण", "प्रमाण", "பிரமாணம்"),
  "Agni": L("Agni", "अग्नि (पाचन)", "अग्नी", "அக்னி"),
  "Koshtha": L("Koshtha", "कोष्ठ (पेट)", "कोष्ठ", "கோஷ்டா"),
  "Nidra": L("Nidra", "निद्रा (नींद)", "झोप", "நித்திரை"),
  "Ahara": L("Ahara", "आहार (खानपान)", "आहार", "உணவு"),
};

/* ============================================================================
   RED-FLAG ENGINE
   Runs after every answer. Rules are deterministic, named, and each carries the
   clinical reason it exists. The engine returns a rule code only — it never
   returns a diagnosis, a probability, or a severity score to the patient.
   ========================================================================== */

const RED_FLAG_RULES = [
  {
    code: "CARDIAC",
    label: "Possible acute coronary syndrome",
    // Chest pain with radiation, diaphoresis or dyspnoea is the classic ACS
    // presentation. Time-to-ECG is the single biggest modifiable factor in
    // OPD mortality, so this fires before the patient reaches the doctor.
    rationale: "Chest pain with radiation, sweating or breathlessness. Target: ECG within 10 minutes of arrival.",
    test: (t) => t.has("chest") && t.has("pain") &&
      (t.has("radiate_arm") || t.has("radiate_jaw") || t.has("sweating") || t.has("breathless")),
    sources: ["cc.site", "cc.symptom", "soc.radiation", "soc.associated"],
  },
  {
    code: "STROKE_FAST",
    label: "Possible stroke — FAST positive",
    // BE-FAST screen. Thrombolysis window is 4.5 h; queue position must not
    // decide whether a patient makes that window.
    rationale: "Facial droop, one-sided weakness, slurred speech or sudden vision loss. Thrombolysis window is time-critical.",
    test: (t) => t.has("facial_droop") || t.has("unilateral_weakness") || t.has("slurred_speech") || t.has("vision_loss"),
    sources: ["neuro.now"],
  },
  {
    code: "RESPIRATORY_DISTRESS",
    label: "Respiratory distress",
    // Breathlessness at rest, or inability to complete a sentence in one
    // breath, is a bedside marker of severe airflow limitation or hypoxia.
    rationale: "Breathless at rest or cannot complete a sentence in one breath. Needs immediate saturation check.",
    test: (t) => t.has("breathless_rest") || t.has("cannot_complete_sentence"),
    sources: ["breath.when"],
  },
  {
    code: "GI_BLEED",
    label: "Possible gastrointestinal bleed",
    // Haematemesis or melena imply active upper-GI bleeding. Abdominal
    // rigidity needs palpation, which a kiosk cannot do — severity >= 8 with
    // an abdominal site is used as the screening proxy and is deliberately
    // labelled as a proxy in the rule trace shown to the doctor.
    rationale: "Vomiting blood, black stools, or severe abdominal pain. Rigidity cannot be assessed by kiosk — severity is used as a proxy.",
    test: (t, a) => t.has("hematemesis") || t.has("melena") ||
      (t.has("abdomen") && (a["soc.severity"]?.value ?? 0) >= 8),
    sources: ["soc.associated", "cc.site", "soc.severity"],
  },
  {
    code: "OBSTETRIC",
    label: "Obstetric emergency",
    // Antepartum haemorrhage, severe headache (pre-eclampsia) and reduced
    // fetal movement each carry immediate fetal and maternal risk.
    rationale: "Pregnancy with bleeding, severe headache or reduced fetal movement. Route to obstetric triage, not general OPD.",
    test: (t) => t.has("pregnant") && (t.has("obs_bleeding") || t.has("obs_headache") || t.has("obs_fetal")),
    sources: ["wh.pregnancy", "wh.warning"],
  },
  {
    code: "MENINGITIS",
    label: "Possible meningitis",
    // Classic triad. Incomplete in many real cases, so this is a high-
    // specificity, low-sensitivity rule: it is an alert, not a screen.
    rationale: "Fever with neck stiffness and confusion. High specificity, low sensitivity — absence does not exclude.",
    test: (t) => t.has("fever") && t.has("neck_stiffness") && t.has("confusion"),
    sources: ["cc.symptom", "soc.associated"],
  },
  {
    code: "MENTAL_HEALTH_URGENT",
    label: "Immediate clinician review — patient safety",
    // The kiosk does not counsel, does not assess intent, and does not offer
    // coping content. It stops the interview and brings a human.
    rationale: "Patient expressed thoughts of self-harm. Kiosk stops the interview and escalates to a clinician. No automated counselling.",
    test: (t) => t.has("self_harm"),
    sources: ["mind.mood"],
  },
];

function evaluateRedFlags(answers) {
  const tags = new Set();
  Object.values(answers).forEach((a) => (a.tags || []).forEach((x) => tags.add(x)));
  return RED_FLAG_RULES.filter((r) => {
    try { return r.test(tags, answers); } catch { return false; }
  }).map((r) => ({
    code: r.code, label: r.label, rationale: r.rationale,
    triggeringAnswers: r.sources.filter((s) => answers[s]),
  }));
}

/* ============================================================================
   PROVIDER ADAPTER LAYER
   Interface + mock implementation for each. Real adapters are declared with
   their endpoint and the env var that activates them, then reported as
   unavailable, because no credentials exist in the demo environment.
   ========================================================================== */

const PROVIDER_REGISTRY = [
  { key: "asr",        title: "Speech to text", real: "Bhashini ASR / AI4Bharat IndicConformer", env: "BHASHINI_API_KEY", fallback: "Web Speech API → MockASR" },
  { key: "tts",        title: "Text to speech", real: "Bhashini TTS",                            env: "BHASHINI_API_KEY", fallback: "SpeechSynthesis → audio stubs" },
  { key: "ocr",        title: "Document OCR",   real: "PaddleOCR / TrOCR microservice",          env: "OCR_ENDPOINT",     fallback: "tesseract.js → MockOCR fixtures" },
  { key: "summariser", title: "Summariser",     real: "Anthropic claude-sonnet-4-6, extractive prompt", env: "ANTHROPIC_API_KEY", fallback: "Deterministic rule-based summariser" },
  { key: "abdm",       title: "ABDM",           real: "ABDM Sandbox M1–M3 (ABHA, consent, HIP link)",   env: "ABDM_CLIENT_ID",    fallback: "MockABDM, OTP 123456" },
];

/* MockASR — canned transcripts. Confidence is deliberately degraded when the
   "noisy OPD" switch is on so the icon-only fallback path can be demonstrated. */
const SPEECH = {
  "cc.site": { pick: "chest", say: L("There is a lot of pain in my chest.", "छाती में बहुत दर्द हो रहा है।", "छातीत खूप दुखतंय.", "மார்பில் மிகவும் வலிக்கிறது.") },
  "cc.symptom": { pick: "pain", say: L("Pain, since about two hours.", "दर्द है, करीब दो घंटे से।", "दुखतंय, साधारण दोन तासांपासून.", "வலி, சுமார் இரண்டு மணி நேரமாக.") },
  "soc.character": { pick: "pressing", say: L("It feels like a heavy weight pressing on my chest.", "जैसे छाती पर कोई भारी चीज़ रखी हो।", "छातीवर जड ओझं ठेवल्यासारखं वाटतंय.", "மார்பில் கனமான பாரம் வைத்தது போல் இருக்கிறது.") },
  "soc.radiation": { pick: "arm", say: L("The pain is going down into my left arm.", "दर्द बाएँ हाथ तक जा रहा है।", "वेदना डाव्या हातापर्यंत जातेय.", "வலி இடது கை வரை செல்கிறது.") },
  "soc.associated": { pick: ["sweat", "breathless"], say: L("I am sweating a lot and I feel breathless.", "बहुत पसीना आ रहा है और साँस फूल रही है।", "खूप घाम येतोय आणि धाप लागतेय.", "நிறைய வியர்க்கிறது, மூச்சும் வாங்குகிறது.") },
  "soc.timecourse": { pick: "worse", say: L("It keeps getting worse.", "बढ़ता ही जा रहा है।", "वाढतच चाललंय.", "மேலும் அதிகரித்துக்கொண்டே இருக்கிறது.") },
  "soc.relieving": { pick: "nothing", say: L("Nothing I do makes it better.", "किसी भी चीज़ से आराम नहीं मिल रहा।", "कशानेही आराम मिळत नाही.", "எதுவும் நிவாரணம் தரவில்லை.") },
  "duration": { pick: "today", say: L("It started today, about two hours back.", "आज ही शुरू हुआ, करीब दो घंटे पहले।", "आजच सुरू झालं, दोन तासांपूर्वी.", "இன்று தான் ஆரம்பித்தது, இரண்டு மணி நேரம் முன்.") },
  "pmh": { pick: "diabetes", say: L("I have sugar. I take a tablet for it.", "मुझे शुगर है, उसकी गोली लेता हूँ।", "मला साखर आहे, त्याची गोळी घेतो.", "எனக்கு சர்க்கரை உள்ளது, மாத்திரை எடுக்கிறேன்.") },
  "allergy": { pick: "none", say: L("No, nothing troubles me.", "नहीं, किसी चीज़ से तकलीफ़ नहीं होती।", "नाही, कशाचाही त्रास होत नाही.", "இல்லை, எதுவும் தொந்தரவு இல்லை.") },
  "occupation": { pick: "farm", say: L("I do farming.", "मैं खेती करता हूँ।", "मी शेती करतो.", "நான் விவசாயம் செய்கிறேன்.") },
};

function makeASR({ noisy }) {
  return {
    impl: "MockASR", mode: "SIMULATED",
    async transcribe(question, lang) {
      await new Promise((r) => setTimeout(r, 850));
      const s = SPEECH[question.id];
      const confidence = noisy ? 0.28 + Math.random() * 0.2 : 0.86 + Math.random() * 0.11;
      if (!s) {
        const first = (question.options || []).find((x) => x.id !== "none") || (question.options || [])[0];
        return { text: first ? tr(first.label, lang) : "", pick: first ? first.id : null, confidence, lang };
      }
      return { text: tr(s.say, lang), pick: s.pick, confidence, lang };
    },
  };
}

function makeTTS() {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  return {
    impl: synth ? "Browser SpeechSynthesis" : "AudioStub",
    mode: "SIMULATED",
    speak(text, bcp) {
      if (!synth || !text) return false;
      try {
        if (synth.speaking || synth.pending) {
          synth.cancel();
        }
        if (synth.paused) {
          synth.resume();
        }
        const u = new SpeechSynthesisUtterance(String(text));
        const targetBcp = bcp || "hi-IN";
        u.lang = targetBcp;
        u.rate = 0.90;
        u.pitch = 1.0;

        const voices = synth.getVoices ? synth.getVoices() : [];
        if (voices && voices.length > 0) {
          const langPrefix = targetBcp.slice(0, 2).toLowerCase();
          const match = voices.find((v) => v.lang.toLowerCase() === targetBcp.toLowerCase() || v.lang.toLowerCase().replace("_", "-") === targetBcp.toLowerCase()) ||
                        voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
                        voices.find((v) => v.lang.toLowerCase().includes("in"));
          if (match) u.voice = match;
        }
        synth.speak(u);
        return true;
      } catch (err) {
        console.warn("TTS error:", err);
        return false;
      }
    },
    stop() { try { synth && synth.cancel(); } catch {} },
  };
}

const MockABDM = {
  impl: "MockABDM", mode: "SIMULATED",
  newAbha() {
    let n = "";
    for (let i = 0; i < 14; i++) n += Math.floor(Math.random() * 10);
    return n.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, "$1-$2-$3-$4");
  },
  verifyOtp(code) { return code === "123456"; },
};

/* ============================================================================
   SYNTHETIC DOCUMENTS — drawn, never scraped. No real patient artefacts.
   ========================================================================== */

const Paper = ({ children, tilt = 0, tone = "#FDFBF6" }) => (
  <svg viewBox="0 0 300 400" style={{ width: "100%", height: "100%", display: "block" }}>
    <g transform={`rotate(${tilt} 150 200)`}>
      <rect x="10" y="8" width="280" height="384" rx="3" fill={tone} stroke="#D9CFC0" />
      {children}
    </g>
  </svg>
);
const Ln = ({ y, x = 28, w = 240, o = 0.75, h = 5, c = "#5A5148" }) => (
  <rect x={x} y={y} width={w} height={h} rx={2} fill={c} opacity={o} />
);

const DocPrescription = () => (
  <Paper tilt={-1.2}>
    <rect x="10" y="8" width="280" height="46" fill="#EDE4D6" />
    <Ln y={22} x={28} w={120} h={9} c="#2F2A24" o={0.9} />
    <Ln y={38} x={28} w={170} h={5} o={0.5} />
    <Ln y={70} x={28} w={90} h={5} o={0.45} /><Ln y={70} x={190} w={80} h={5} o={0.45} />
    <line x1="24" y1="86" x2="276" y2="86" stroke="#C9BCA8" />
    <text x="28" y="112" fontSize="15" fontFamily="serif" fill="#2F2A24">Rx</text>
    <Ln y={130} x={50} w={150} h={6} /><Ln y={142} x={50} w={90} h={4} o={0.5} />
    <Ln y={168} x={50} w={175} h={6} /><Ln y={180} x={50} w={80} h={4} o={0.5} />
    <Ln y={206} x={50} w={130} h={6} /><Ln y={218} x={50} w={95} h={4} o={0.5} />
    <line x1="24" y1="250" x2="276" y2="250" stroke="#C9BCA8" />
    <Ln y={266} x={28} w={200} h={4} o={0.4} /><Ln y={278} x={28} w={160} h={4} o={0.4} />
    <path d="M195 330 q14-22 26 0 t26-6" stroke="#2B4C8C" strokeWidth="2" fill="none" />
    <Ln y={352} x={195} w={72} h={3} o={0.4} />
  </Paper>
);

const DocLab = () => (
  <Paper tilt={0.8} tone="#FCFDFB">
    <rect x="10" y="8" width="280" height="40" fill="#DFEAE0" />
    <Ln y={22} x={28} w={140} h={8} c="#26402C" o={0.85} />
    <Ln y={62} x={28} w={100} h={4} o={0.45} /><Ln y={62} x={190} w={80} h={4} o={0.45} />
    <line x1="24" y1="80" x2="276" y2="80" stroke="#C9D6C9" />
    {[104, 134, 164, 194, 224].map((y, i) => (
      <g key={y}>
        <Ln y={y} x={28} w={92} h={5} o={0.7} />
        <Ln y={y} x={150} w={38} h={5} o={0.85} c={i === 0 || i === 3 ? "#A33" : "#5A5148"} />
        <Ln y={y} x={212} w={58} h={4} o={0.4} />
      </g>
    ))}
    <line x1="24" y1="252" x2="276" y2="252" stroke="#C9D6C9" />
    <Ln y={268} x={28} w={180} h={4} o={0.35} />
    <rect x="196" y="300" width="70" height="70" rx="4" fill="none" stroke="#C9D6C9" />
    <path d="M206 335 h50 M231 310 v50" stroke="#C9D6C9" strokeWidth="2" />
  </Paper>
);

const DocScrawl = () => (
  <Paper tilt={2.6} tone="#F7F2E7">
    <Ln y={30} x={26} w={110} h={6} o={0.55} />
    {[70, 104, 138, 172, 206, 240].map((y, i) => (
      <path key={y} d={`M30 ${y} q12 -13 24 0 t24 -3 t26 6 t22 -9 t28 4 t${20 + i * 6} -2`}
        stroke="#3A3A6B" strokeWidth="2.2" fill="none" opacity="0.8" strokeLinecap="round" />
    ))}
    <path d="M32 292 q20-16 40 4 t44-10" stroke="#3A3A6B" strokeWidth="2.2" fill="none" opacity=".7" />
    <path d="M190 340 q16-24 30 2 t30-8" stroke="#2B4C8C" strokeWidth="2" fill="none" />
  </Paper>
);

const DocEcg = () => (
  <Paper tilt={-2} tone="#FFF7F4">
    <rect x="10" y="8" width="280" height="34" fill="#F6DFD3" />
    <Ln y={20} x={28} w={120} h={7} c="#6B3216" o={0.8} />
    <g opacity="0.25">
      {Array.from({ length: 13 }).map((_, i) => <line key={"v" + i} x1={20 + i * 22} y1="52" x2={20 + i * 22} y2="330" stroke="#D08A6A" />)}
      {Array.from({ length: 13 }).map((_, i) => <line key={"h" + i} x1="20" y1={56 + i * 22} x2="284" y2={56 + i * 22} stroke="#D08A6A" />)}
    </g>
    {[110, 190, 270].map((base) => (
      <path key={base} fill="none" stroke="#7A2E12" strokeWidth="1.9"
        d={`M22 ${base} h22 l6 -8 l6 16 l7 -46 l7 56 l6 -18 h20 l6 -8 l6 16 l7 -46 l7 56 l6 -18 h20 l6 -8 l6 16 l7 -46 l7 56 l6 -18 h24 l6 -8 l6 16 l7 -46 l7 56 l6 -18 h20`} />
    ))}
    <Ln y={352} x={28} w={150} h={4} o={0.4} />
  </Paper>
);

const DOC_ART = { prescription: DocPrescription, lab: DocLab, scrawl: DocScrawl, ecg: DocEcg };

/* ============================================================================
   MOCK OCR — fixture extractions with per-field confidence.
   The confidence gate is applied by the caller, not by the fixture, so the
   gate itself stays visible and testable.
   ========================================================================== */

const OCR_FIXTURES = {
  prescription: {
    title: "Prescription slip", date: "2025-11-12", pageConfidence: 0.91,
    extractions: [
      { type: "MEDICATION", confidence: 0.94, read: "TAB. METFORMIN 500 MG — 1 TAB TWICE DAILY AFTER FOOD", value: { name: "Metformin", dose: "500 mg", frequency: "Twice daily, after food" } },
      { type: "MEDICATION", confidence: 0.91, read: "TAB. TELMISARTAN 40 MG — 1 TAB ONCE DAILY MORNING", value: { name: "Telmisartan", dose: "40 mg", frequency: "Once daily, morning" } },
      { type: "MEDICATION", confidence: 0.88, read: "TAB. ASPIRIN 75 MG — 1 TAB ONCE DAILY", value: { name: "Aspirin", dose: "75 mg", frequency: "Once daily" } },
      { type: "DIAGNOSIS", confidence: 0.90, read: "DIAGNOSIS: TYPE 2 DIABETES MELLITUS", value: { text: "Type 2 diabetes mellitus", snomed: "44054006" } },
      { type: "DATE", confidence: 0.96, read: "DATE: 12/11/2025", value: { date: "2025-11-12", label: "Prescribed on" } },
    ],
  },
  lab: {
    title: "Lab report — thyroid and haemogram", date: "2026-02-03", pageConfidence: 0.94,
    extractions: [
      { type: "LAB", confidence: 0.93, read: "TSH  8.4 mIU/L   (0.4 - 4.0)", value: { name: "TSH", loinc: "3016-3", value: 8.4, unit: "mIU/L", refLow: 0.4, refHigh: 4.0 } },
      { type: "LAB", confidence: 0.95, read: "HAEMOGLOBIN  9.1 g/dL   (12.0 - 15.0)", value: { name: "Haemoglobin", loinc: "718-7", value: 9.1, unit: "g/dL", refLow: 12, refHigh: 15 } },
      { type: "LAB", confidence: 0.92, read: "MCV  74 fL   (80 - 100)", value: { name: "MCV", loinc: "787-2", value: 74, unit: "fL", refLow: 80, refHigh: 100 } },
      { type: "DATE", confidence: 0.97, read: "COLLECTED: 03-FEB-2026", value: { date: "2026-02-03", label: "Sample collected" } },
    ],
  },
  scrawl: {
    title: "Handwritten prescription", date: null, pageConfidence: 0.42,
    extractions: [
      { type: "MEDICATION", confidence: 0.44, read: "T. ?vit—D3 / ?vib—D3   1 wk??", value: { name: "unreadable" } },
      { type: "MEDICATION", confidence: 0.38, read: "Cap ??roxin 500  1-0-1", value: { name: "unreadable" } },
    ],
  },
  ecg: {
    title: "ECG report", date: "2025-08-19", pageConfidence: 0.89,
    extractions: [
      { type: "DATE", confidence: 0.93, read: "ECG RECORDED 19/08/2025", value: { date: "2025-08-19", label: "ECG recorded" } },
      { type: "DIAGNOSIS", confidence: 0.87, read: "REPORT: SINUS RHYTHM, NO ACUTE CHANGE", value: { text: "Prior ECG report text: sinus rhythm, no acute change" } },
    ],
  },
};

// Applies the confidence gate. Below the gate nothing is written to structured
// fields; the page is kept as an image for the doctor to read.
function runOcr(kind, docId) {
  const f = OCR_FIXTURES[kind];
  const gated = f.pageConfidence < CONFIDENCE_GATE;
  return {
    title: f.title, date: f.date, pageConfidence: f.pageConfidence,
    isRawOnly: gated,
    extractions: gated ? [] : f.extractions
      .filter((e) => e.confidence >= CONFIDENCE_GATE)
      .map((e, i) => ({ ...e, id: `${docId}-x${i}`, documentId: docId })),
    rejected: gated ? f.extractions.length
      : f.extractions.filter((e) => e.confidence < CONFIDENCE_GATE).length,
  };
}

const labFlag = (v) => {
  if (v.value == null || v.refLow == null) return null;
  if (v.value > v.refHigh) return "HIGH";
  if (v.value < v.refLow) return "LOW";
  return null;
};

/* ============================================================================
   SUMMARISER — deterministic, extractive, provenance-linked.
   A field is emitted only when it has a source. Missing stays missing.
   ========================================================================== */

function buildSummary(session) {
  const S = [];
  const push = (sectionKey, sectionLabel, fields) => {
    const kept = fields.filter(Boolean);
    if (kept.length) S.push({ key: sectionKey, label: sectionLabel, fields: kept });
  };
  const A = session.answers;

  const fromAnswer = (qid, label) => {
    const a = A[qid];
    if (!a) return null;                      // no source -> no field. Never inferred.
    const value = a.kind === "scale" ? `${a.value} out of 10` : a.labels.map((l) => tr(l, "en")).join(", ");
    if (!value) return null;
    // The doctor's column stays clinical English — it has to travel to FHIR and
    // to a clinician who may not read the patient's language. But the patient's
    // own rendering rides alongside it, so the doctor never has to open a modal
    // to find out what was actually said.
    const native = a.kind === "scale" ? "" : a.labels.map((l) => tr(l, a.lang)).join(", ");
    return {
      path: `${qid}`, label, value, draft: true,
      valueNative: native && native !== value ? native : null,
      valueLang: a.lang,
      source: { kind: "ANSWER", id: a.id, quote: a.transcript, method: a.method, lang: a.lang, confidence: a.confidence, at: a.at },
    };
  };

  push("cc", "Chief complaint", [
    fromAnswer("cc.symptom", "Reported symptom"),
    fromAnswer("cc.site", "Site"),
    fromAnswer("duration", "Duration"),
  ]);

  push("hpi", "History of present illness — SOCRATES", [
    fromAnswer("cc.site", "S — Site"),
    fromAnswer("duration", "O — Onset"),
    fromAnswer("soc.character", "C — Character"),
    fromAnswer("soc.radiation", "R — Radiation"),
    fromAnswer("soc.associated", "A — Associated symptoms"),
    fromAnswer("soc.timecourse", "T — Time course"),
    fromAnswer("soc.relieving", "E — Exacerbating / relieving"),
    fromAnswer("soc.severity", "S — Severity"),
  ]);

  push("ros", "Review of systems", [
    fromAnswer("breath.when", "Respiratory"),
    fromAnswer("neuro.now", "Neurological"),
    fromAnswer("mind.mood", "Mental health"),
  ]);

  push("pmh", "Past medical history", [fromAnswer("pmh", "Known conditions")]);

  const medFields = [];
  // The capture prompts ("show the strips", "say the names") are not clinical
  // content. Only an explicit "no medicines" is worth carrying forward.
  const medAnswer = A["meds"]?.ids?.includes("none") ? fromAnswer("meds", "Patient reported") : null;
  if (medAnswer) medFields.push(medAnswer);
  session.documents.forEach((d) => (d.extractions || []).forEach((e) => {
    if (e.type !== "MEDICATION") return;
    medFields.push({
      path: `doc.${e.id}`, label: "From scanned document", draft: true,
      value: [e.value.name, e.value.dose, e.value.frequency].filter(Boolean).join(" · "),
      source: { kind: "EXTRACTION", id: e.id, quote: e.read, confidence: e.confidence, at: d.uploadedAt, documentId: d.id },
    });
  }));
  push("meds", "Medications", medFields);

  push("allergy", "Allergies", [fromAnswer("allergy", "Reported")]);
  push("family", "Family history", [fromAnswer("family", "Reported")]);
  push("social", "Social history", [fromAnswer("social", "Habits"), fromAnswer("occupation", "Occupation")]);
  push("wh", "Women's health", [
    fromAnswer("wh.pregnancy", "Pregnancy"),
    fromAnswer("wh.warning", "Warning signs"),
    fromAnswer("wh.lmp", "Last menstrual period"),
  ]);

  const labs = [];
  session.documents.forEach((d) => (d.extractions || []).forEach((e) => {
    if (e.type !== "LAB") return;
    const flag = labFlag(e.value);
    labs.push({
      path: `doc.${e.id}`, label: e.value.name, draft: true, flag,
      value: `${e.value.value} ${e.value.unit}  (ref ${e.value.refLow}–${e.value.refHigh})`,
      source: { kind: "EXTRACTION", id: e.id, quote: e.read, confidence: e.confidence, at: d.uploadedAt, documentId: d.id },
    });
  }));
  push("labs", "Lab values from documents", labs);

  if (session.mode === "AYUSH") {
    push("ayush", "Dashavidha Pariksha", AYUSH.map((q) => fromAnswer(q.id, `${q.section} · ${q.sanskrit || ""}`.trim())));
  }
  return S;
}

/* ============================================================================
   FHIR R4 — document Bundle. Codes are only emitted where a real code is
   known; everything else uses code.text. No invented codes.
   ========================================================================== */

const SNOMED = {
  "cc.symptom:fever": "386661006", "cc.symptom:cough": "49727002",
  "cc.symptom:pain": "22253000", "cc.symptom:breathless": "267036007",
  "cc.symptom:vomiting": "422400008", "cc.symptom:dizziness": "404640003",
  "cc.site:chest": "29857009", "pmh:diabetes": "44054006",
  "pmh:htn": "38341003", "pmh:asthma": "195967001",
};

function buildFhir(session, patient, summary) {
  const ids = { pt: `urn:uuid:${uid("pt")}`, enc: `urn:uuid:${uid("enc")}`, comp: `urn:uuid:${uid("comp")}` };
  const entries = [];
  const add = (fullUrl, resource) => { entries.push({ fullUrl, resource }); return fullUrl; };
  const now = nowISO();

  add(ids.pt, {
    resourceType: "Patient", id: ids.pt.slice(9),
    identifier: patient.abha ? [{ system: "https://healthid.abdm.gov.in/ns/abha", value: patient.abha }] : [{ system: "urn:prashna:opd-token", value: patient.token }],
    name: [{ text: patient.name }],
    gender: patient.sex === "F" ? "female" : patient.sex === "M" ? "male" : "unknown",
    _birthDate: { extension: [{ url: "http://hl7.org/fhir/StructureDefinition/data-absent-reason", valueCode: "asked-declined" }] },
    extension: [{ url: "urn:prashna:age-years", valueInteger: patient.age }],
    communication: [{ language: { text: LANGS.find((l) => l.code === patient.lang)?.en || "English" }, preferred: true }],
  });

  add(ids.enc, {
    resourceType: "Encounter", id: ids.enc.slice(9), status: "in-progress",
    class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB", display: "ambulatory" },
    subject: { reference: ids.pt },
    period: { start: session.startedAt },
    serviceType: { text: session.mode === "AYUSH" ? "AYUSH outpatient" : "General outpatient" },
  });

  const provenanceTargets = [];
  const mkProv = (targetRef, src) => {
    const u = `urn:uuid:${uid("prov")}`;
    add(u, {
      resourceType: "Provenance", id: u.slice(9), target: [{ reference: targetRef }],
      recorded: src.at || now,
      activity: { text: src.kind === "ANSWER" ? "Kiosk interview response" : "OCR extraction from patient-supplied document" },
      agent: [{ type: { text: "PRASHNA intake" }, who: { display: `PRASHNA (${src.kind === "ANSWER" ? "MockASR / touch" : "MockOCR"}, SIMULATED)` } }],
      entity: [{ role: "source", what: { display: src.quote || "(no transcript)" } }],
      extension: [
        { url: "urn:prashna:source-kind", valueString: src.kind },
        { url: "urn:prashna:source-id", valueString: String(src.id) },
        ...(src.confidence != null ? [{ url: "urn:prashna:confidence", valueDecimal: Number(src.confidence.toFixed(2)) }] : []),
        { url: "urn:prashna:verification-status", valueString: "DRAFT — not verified by a clinician" },
      ],
    });
    provenanceTargets.push(u);
  };

  const conditionRefs = [], observationRefs = [], medRefs = [], allergyRefs = [], docRefs = [];

  const ccField = summary.find((s) => s.key === "cc")?.fields || [];
  const siteAnswer = session.answers["cc.site"];
  const bodySite = siteAnswer ? [{ text: siteAnswer.labels.map((l) => tr(l, "en")).join(", ") }] : undefined;
  ccField.filter((f) => f.path === "cc.symptom").forEach((f) => {
    const a = session.answers[f.path];
    const code = a?.ids?.map((i) => SNOMED[`${f.path}:${i}`]).find(Boolean);
    const u = `urn:uuid:${uid("cond")}`;
    add(u, {
      resourceType: "Condition", id: u.slice(9),
      clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
      verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "unconfirmed", display: "Unconfirmed — patient-reported, clinician review pending" }] },
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "problem-list-item" }] }],
      code: { ...(code ? { coding: [{ system: "http://snomed.info/sct", code }] } : {}), text: f.value },
      ...(bodySite ? { bodySite } : {}),
      subject: { reference: ids.pt }, encounter: { reference: ids.enc }, recordedDate: f.source.at,
    });
    conditionRefs.push(u); mkProv(u, f.source);
  });

  (summary.find((s) => s.key === "pmh")?.fields || [])
    .filter(() => !session.answers["pmh"]?.ids?.includes("none"))
    .forEach((f) => {
    const u = `urn:uuid:${uid("cond")}`;
    add(u, {
      resourceType: "Condition", id: u.slice(9),
      clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
      verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "unconfirmed" }] },
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "problem-list-item" }] }],
      code: { text: f.value }, subject: { reference: ids.pt }, encounter: { reference: ids.enc },
    });
    conditionRefs.push(u); mkProv(u, f.source);
  });

  const sev = session.answers["soc.severity"];
  if (sev) {
    const u = `urn:uuid:${uid("obs")}`;
    add(u, {
      resourceType: "Observation", id: u.slice(9), status: "preliminary",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey" }] }],
      code: { coding: [{ system: "http://loinc.org", code: "72514-3", display: "Pain severity — 0-10 verbal numeric rating" }], text: "Pain severity" },
      subject: { reference: ids.pt }, encounter: { reference: ids.enc },
      effectiveDateTime: sev.at, valueInteger: sev.value,
    });
    observationRefs.push(u); mkProv(u, { kind: "ANSWER", id: sev.id, quote: sev.transcript, at: sev.at, confidence: sev.confidence });
  }

  (summary.find((s) => s.key === "labs")?.fields || []).forEach((f) => {
    const ex = session.documents.flatMap((d) => d.extractions || []).find((e) => e.id === f.source.id);
    if (!ex) return;
    const u = `urn:uuid:${uid("obs")}`;
    const flag = labFlag(ex.value);
    add(u, {
      resourceType: "Observation", id: u.slice(9), status: "preliminary",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory" }] }],
      code: { coding: [{ system: "http://loinc.org", code: ex.value.loinc, display: ex.value.name }], text: ex.value.name },
      subject: { reference: ids.pt },
      valueQuantity: { value: ex.value.value, unit: ex.value.unit, system: "http://unitsofmeasure.org" },
      referenceRange: [{ low: { value: ex.value.refLow, unit: ex.value.unit }, high: { value: ex.value.refHigh, unit: ex.value.unit } }],
      ...(flag ? { interpretation: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: flag === "HIGH" ? "H" : "L" }] }] } : {}),
    });
    observationRefs.push(u); mkProv(u, f.source);
  });

  (summary.find((s) => s.key === "meds")?.fields || []).forEach((f) => {
    const u = `urn:uuid:${uid("med")}`;
    add(u, {
      resourceType: "MedicationStatement", id: u.slice(9), status: "unknown",
      medicationCodeableConcept: { text: f.value },
      subject: { reference: ids.pt }, context: { reference: ids.enc },
      note: [{ text: "Transcribed from a patient-supplied document. Not verified against a dispensing record." }],
    });
    medRefs.push(u); mkProv(u, f.source);
  });

  (summary.find((s) => s.key === "allergy")?.fields || []).forEach((f) => {
    const u = `urn:uuid:${uid("alg")}`;
    add(u, {
      resourceType: "AllergyIntolerance", id: u.slice(9),
      clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", code: "active" }] },
      verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification", code: "unconfirmed" }] },
      code: session.answers["allergy"]?.ids?.includes("none")
        ? { coding: [{ system: "http://snomed.info/sct", code: "716186003", display: "No known allergy" }], text: f.value }
        : { text: f.value },
      patient: { reference: ids.pt },
    });
    allergyRefs.push(u); mkProv(u, f.source);
  });

  session.documents.forEach((d) => {
    const u = `urn:uuid:${uid("docref")}`;
    add(u, {
      resourceType: "DocumentReference", id: u.slice(9), status: "current",
      type: { text: d.title }, subject: { reference: ids.pt }, date: d.uploadedAt,
      content: [{ attachment: { contentType: "image/png", title: d.filename, creation: d.date || undefined } }],
      context: { encounter: [{ reference: ids.enc }] },
      description: d.isRawOnly
        ? `Raw scan only. OCR page confidence ${d.pageConfidence.toFixed(2)} is below the ${CONFIDENCE_GATE} gate, so no structured fields were written.`
        : `OCR page confidence ${d.pageConfidence.toFixed(2)}. ${(d.extractions || []).length} field(s) extracted.`,
    });
    docRefs.push(u);
  });

  const sect = (title, refs) => (refs.length ? [{ title, entry: refs.map((r) => ({ reference: r })) }] : []);
  add(ids.comp, {
    resourceType: "Composition", id: ids.comp.slice(9), status: "preliminary",
    type: { coding: [{ system: "http://loinc.org", code: "34117-2", display: "History and physical note" }], text: "Pre-consultation intake summary" },
    subject: { reference: ids.pt }, encounter: { reference: ids.enc }, date: now,
    author: [{ display: "PRASHNA intake kiosk (all providers SIMULATED)" }],
    title: `Pre-consultation intake — ${patient.name} — token ${patient.token}`,
    confidentiality: "R",
    section: [
      ...sect("Problems and history", conditionRefs),
      ...sect("Observations", observationRefs),
      ...sect("Medications", medRefs),
      ...sect("Allergies", allergyRefs),
      ...sect("Patient-supplied documents", docRefs),
      ...sect("Provenance", provenanceTargets),
    ],
    note: [{ text: "Every assertion in this document is patient-reported or OCR-derived and is marked DRAFT until a clinician verifies it. This document contains no diagnosis, no differential and no treatment recommendation." }],
  });

  entries.sort((a, b) => (a.resource.resourceType === "Composition" ? -1 : b.resource.resourceType === "Composition" ? 1 : 0));
  return { resourceType: "Bundle", id: uid("bundle"), type: "document", timestamp: now, entry: entries };
}

/* ------------------------------------------------------------- severity face */
const Face = ({ level, size = 56, color }) => {
  const t = level / 10;
  const mouth = 14 - t * 26;
  const brow = t * 5;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="27" fill="none" stroke={color} strokeWidth="3.2" />
      <circle cx="23" cy={27 + brow * 0.4} r="2.9" fill={color} />
      <circle cx="41" cy={27 + brow * 0.4} r="2.9" fill={color} />
      <path d={`M20 ${20 + brow} l8 ${-brow * 0.9}`} stroke={color} strokeWidth="2.6" strokeLinecap="round" opacity={t > 0.35 ? 1 : 0} />
      <path d={`M44 ${20 + brow} l-8 ${-brow * 0.9}`} stroke={color} strokeWidth="2.6" strokeLinecap="round" opacity={t > 0.35 ? 1 : 0} />
      <path d={`M20 ${45 - t * 3} Q32 ${45 - t * 3 + mouth} 44 ${45 - t * 3}`} stroke={color} strokeWidth="3.2" fill="none" strokeLinecap="round" />
    </svg>
  );
};

/* ============================================================================
   SESSION HELPERS + SEED DATA (synthetic — no real people, no real ABHA)
   ========================================================================== */

const AYUSH_TREE = [
  ALLOPATHY.find((q) => q.id === "cc.site"),
  ALLOPATHY.find((q) => q.id === "cc.symptom"),
  ALLOPATHY.find((q) => q.id === "duration"),
  ...AYUSH,
];
const treeFor = (mode) => (mode === "AYUSH" ? AYUSH_TREE : ALLOPATHY);

function mkAnswer(mode, qid, sel, meta = {}) {
  const q = treeFor(mode).find((x) => x.id === qid);
  if (!q) return null;
  if (q.kind === "scale") {
    return { id: uid("ans"), questionId: qid, section: q.section, kind: "scale", value: sel,
      ids: [], labels: [`${sel}/10`], tags: [], method: meta.m || "TOUCH",
      transcript: meta.t || "", confidence: meta.c ?? null, lang: meta.lang || "en", at: meta.at || nowISO() };
  }
  const ids = Array.isArray(sel) ? sel : [sel];
  const opts = ids.map((i) => q.options.find((x) => x.id === i)).filter(Boolean);
  return {
    id: uid("ans"), questionId: qid, section: q.section, kind: q.kind, ids,
    labels: opts.map((x) => x.label), tags: opts.flatMap((x) => x.tags || []),
    method: meta.m || "TOUCH", transcript: meta.t || "", confidence: meta.c ?? null,
    lang: meta.lang || "en", at: meta.at || nowISO(),
  };
}
// Answers are stored with label objects; render them in the reader's language.
const answerText = (a, lang) => (a.kind === "scale" ? `${a.value}/10` : a.labels.map((l) => tr(l, lang)).join(", "));

function mkDoc(kind, filename, minutesAgo = 5) {
  const id = uid("doc");
  const r = runOcr(kind, id);
  return { id, kind, filename, title: r.title, date: r.date, pageNo: 1,
    pageConfidence: r.pageConfidence, isRawOnly: r.isRawOnly, extractions: r.extractions,
    rejected: r.rejected, uploadedAt: new Date(Date.now() - minutesAgo * 60000).toISOString() };
}

const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

function seedDb() {
  const mk = (p, mode, answerSpecs, docs, intakeSec) => {
    const answers = {};
    answerSpecs.forEach(([qid, sel, meta]) => {
      const a = mkAnswer(mode, qid, sel, { ...meta, lang: p.lang, at: ago(p.waited - 2) });
      if (a) answers[qid] = a;
    });
    const session = {
      id: uid("ses"), patientId: p.id, mode, status: "COMPLETE",
      startedAt: ago(p.waited), completedAt: ago(p.waited - 6), wipedAt: null,
      answers, documents: docs, intakeSeconds: intakeSec,
      consent: { scopes: ["RECORD_HISTORY", "LINK_ABHA"], language: p.lang, grantedAt: ago(p.waited), artifact: "consent-v1" },
      transcriptLog: answerSpecs.filter(([, , m]) => m && m.t).map(([qid, , m]) => ({ qid, text: m.t, lang: p.lang, at: ago(p.waited - 2) })),
      verifications: [],
    };
    session.summary = buildSummary(session);
    const flags = evaluateRedFlags(answers).map((f) => ({
      ...f, id: uid("flag"), sessionId: session.id, patientId: p.id,
      firedAt: ago(p.waited - 4), acknowledgedBy: null, acknowledgedAt: null,
    }));
    return { patient: p, session, flags };
  };

  const ramesh = mk(
    { id: uid("pt"), name: "Ramesh Patil", age: 62, sex: "M", lang: "mr", token: "A-014",
      abha: "91-4738-2201-5566", phoneMasked: "•••••• 4471", dept: "General Medicine", waited: 14 },
    "ALLOPATHY",
    [
      ["cc.site", "chest", { m: "VOICE", c: 0.93, t: "छातीत खूप दुखतंय." }],
      ["cc.symptom", ["pain"], { m: "VOICE", c: 0.91, t: "दुखतंय, साधारण दोन तासांपासून." }],
      ["soc.character", "pressing", { m: "VOICE", c: 0.88, t: "छातीवर जड ओझं ठेवल्यासारखं वाटतंय." }],
      ["soc.radiation", "arm", { m: "VOICE", c: 0.90, t: "वेदना डाव्या हातापर्यंत जातेय." }],
      ["soc.associated", ["sweat", "breathless"], { m: "VOICE", c: 0.87, t: "खूप घाम येतोय आणि धाप लागतेय." }],
      ["soc.timecourse", "worse", { m: "TOUCH" }],
      ["soc.relieving", "nothing", { m: "TOUCH" }],
      ["soc.severity", 8, { m: "TOUCH" }],
      ["duration", "today", { m: "VOICE", c: 0.94, t: "आजच सुरू झालं, दोन तासांपूर्वी." }],
      ["pmh", ["diabetes"], { m: "VOICE", c: 0.86, t: "मला साखर आहे, त्याची गोळी घेतो." }],
      ["meds", "camera", { m: "TOUCH" }],
      ["allergy", ["none"], { m: "TOUCH" }],
      ["family", ["cad"], { m: "TOUCH" }],
      ["social", ["tobacco"], { m: "TOUCH" }],
      ["occupation", "farm", { m: "VOICE", c: 0.92, t: "मी शेती करतो." }],
    ],
    [mkDoc("prescription", "rx-nov-2025.png", 12), mkDoc("ecg", "ecg-aug-2025.png", 11)],
    342
  );

  const sunita = mk(
    { id: uid("pt"), name: "Sunita Devi", age: 34, sex: "F", lang: "hi", token: "A-021",
      abha: null, phoneMasked: "•••••• 9038", dept: "General Medicine", waited: 26 },
    "ALLOPATHY",
    [
      ["cc.site", "other", { m: "TOUCH" }],
      ["cc.symptom", ["fatigue"], { m: "VOICE", c: 0.89, t: "तीन महीने से बहुत थकान रहती है और बाल बहुत झड़ रहे हैं।" }],
      ["duration", "months", { m: "VOICE", c: 0.92, t: "करीब तीन महीने से।" }],
      ["pmh", ["none"], { m: "TOUCH" }],
      ["meds", "camera", { m: "TOUCH" }],
      ["allergy", ["none"], { m: "TOUCH" }],
      ["family", ["diabetes"], { m: "TOUCH" }],
      ["social", ["none"], { m: "TOUCH" }],
      ["occupation", "home", { m: "VOICE", c: 0.90, t: "घर का काम करती हूँ।" }],
      ["wh.pregnancy", "no", { m: "TOUCH" }],
      ["wh.lmp", "fortnight", { m: "TOUCH" }],
    ],
    [mkDoc("lab", "lab-feb-2026.png", 9), mkDoc("scrawl", "handwritten-rx.png", 8)],
    408
  );

  const lakshmi = mk(
    { id: uid("pt"), name: "Lakshmi Iyer", age: 48, sex: "F", lang: "ta", token: "B-007",
      abha: "27-9910-4432-8871", phoneMasked: "•••••• 2215", dept: "AYUSH", waited: 19 },
    "AYUSH",
    [
      ["cc.site", "limbs", { m: "VOICE", c: 0.88, t: "மூட்டுகளில் ரொம்ப நாளாக வலி." }],
      ["cc.symptom", ["pain"], { m: "TOUCH" }],
      ["duration", "years", { m: "VOICE", c: 0.91, t: "மூன்று வருஷமா இருக்கு." }],
      ["ay.prakriti", "vata", { m: "TOUCH" }],
      ["ay.vikriti", "vata", { m: "VOICE", c: 0.86, t: "உடம்பு வறட்சியா இருக்கு, வாயு தொல்லை." }],
      ["ay.sara", "madhyama", { m: "TOUCH" }],
      ["ay.samhanana", "lean", { m: "TOUCH" }],
      ["ay.satmya", "madhyama", { m: "TOUCH" }],
      ["ay.satva", "madhyama", { m: "TOUCH" }],
      ["ay.ahara", "poor", { m: "VOICE", c: 0.87, t: "பசி சரியா எடுக்கிறதில்லை." }],
      ["ay.vyayama", "avara", { m: "TOUCH" }],
      ["ay.vaya", "madhya", { m: "TOUCH" }],
      ["ay.pramana", "hina", { m: "TOUCH" }],
      ["ay.agni", "manda", { m: "VOICE", c: 0.85, t: "சாப்பிட்ட பிறகு வயிறு கனமா இருக்கு." }],
      ["ay.koshtha", "krura", { m: "TOUCH" }],
      ["ay.nidra", "broken", { m: "TOUCH" }],
      ["ay.diet", "veg", { m: "TOUCH" }],
    ],
    [],
    396
  );

  const rows = [ramesh, sunita, lakshmi];
  return {
    patients: rows.map((r) => r.patient),
    sessions: rows.map((r) => r.session),
    flags: rows.flatMap((r) => r.flags),
    log: [{ at: nowISO(), provider: "seed", impl: "seedDb", mode: "SIMULATED", detail: "3 synthetic personas restored" }],
  };
}

/* ============================================================================
   ROOT
   ========================================================================== */

const NAV = [
  { key: "kiosk", label: "Kiosk", icon: LayoutGrid, sub: "Patient screen" },
  { key: "queue", label: "Doctor", icon: Stethoscope, sub: "Review dashboard" },
  { key: "triage", label: "Triage", icon: ShieldAlert, sub: "Red-flag board" },
  { key: "admin", label: "Demo control", icon: Settings, sub: "Providers & reset" },
];

export default function Prashna() {
  const [db, setDb] = useState(() => seedDb());
  const [view, setView] = useState("kiosk");
  const [openPatient, setOpenPatient] = useState(null);
  const [settings, setSettings] = useState({ noisy: false, highContrast: false, largePrint: false, baseline: MANUAL_BASELINE_SEC });
  const [live, setLive] = useState(null); // the in-progress kiosk session

  const tts = useMemo(() => makeTTS(), []);
  const asr = useMemo(() => makeASR({ noisy: settings.noisy }), [settings.noisy]);

  const log = useCallback((provider, impl, detail, mode = "SIMULATED") => {
    setDb((d) => ({ ...d, log: [{ at: nowISO(), provider, impl, mode, detail }, ...d.log].slice(0, 120) }));
  }, []);

  const commitSession = useCallback((patient, session, flags) => {
    setDb((d) => ({
      ...d,
      patients: [patient, ...d.patients.filter((p) => p.id !== patient.id)],
      sessions: [session, ...d.sessions.filter((s) => s.id !== session.id)],
      flags: [...flags.filter((f) => !d.flags.some((g) => g.id === f.id)), ...d.flags],
    }));
  }, []);

  const acknowledge = useCallback((flagId, who) => {
    setDb((d) => ({ ...d, flags: d.flags.map((f) => (f.id === flagId ? { ...f, acknowledgedBy: who, acknowledgedAt: nowISO() } : f)) }));
  }, []);

  const verifyField = useCallback((sessionId, path, action, before, after) => {
    setDb((d) => ({
      ...d,
      sessions: d.sessions.map((s) => s.id !== sessionId ? s : {
        ...s,
        verifications: [...s.verifications.filter((v) => v.path !== path),
          { id: uid("ver"), path, action, valueBefore: before, valueAfter: after, doctorId: "dr.demo", at: nowISO() }],
      }),
    }));
  }, []);

  const resetDemo = useCallback(() => {
    setDb(seedDb()); setLive(null); setOpenPatient(null);
  }, []);

  const store = { db, setDb, settings, setSettings, tts, asr, log, commitSession, acknowledge,
    verifyField, resetDemo, live, setLive, openPatient, setOpenPatient, setView, view };

  const unacked = db.flags.filter((f) => !f.acknowledgedAt).length;

  return (
    <Store.Provider value={store}>
      <GlobalStyle />
      <div className="pr-root" style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <TopBar unacked={unacked} />
        <div style={{ flex: 1, minHeight: 0 }}>
          {view === "kiosk" && <KioskApp />}
          {view === "queue" && (openPatient ? <PatientView /> : <QueueView />)}
          {view === "triage" && <TriageBoard />}
          {view === "admin" && <AdminView />}
        </div>
      </div>
    </Store.Provider>
  );
}

function TopBar({ unacked }) {
  const { view, setView, setOpenPatient } = useStore();
  return (
    <header style={{ background: C.navy, color: C.white, display: "flex", alignItems: "stretch", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 18px", flex: "0 0 auto" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: C.teal, display: "grid", placeItems: "center", flex: "0 0 34px" }}>
          <Stethoscope size={19} strokeWidth={2.4} />
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: ".02em" }}>PRASHNA</span>
            <span lang="sa" style={{ fontSize: 15, fontWeight: 600, opacity: .8 }}>प्रश्न</span>
          </div>
          <div style={{ fontSize: 10.5, opacity: .72, letterSpacing: ".07em", textTransform: "uppercase" }}>OPD intake · SIH 2026 demo</div>
        </div>
      </div>
      <nav style={{ display: "flex", gap: 2, padding: "8px 10px", flex: 1, minWidth: 260, flexWrap: "wrap" }}>
        {NAV.map((n) => {
          const on = view === n.key;
          return (
            <button key={n.key} onClick={() => { setView(n.key); if (n.key === "queue") setOpenPatient(null); }}
              className="pr-tile" aria-current={on ? "page" : undefined}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: 9,
                background: on ? "rgba(255,255,255,.16)" : "transparent", color: C.white,
                fontWeight: on ? 700 : 500, fontSize: 13.5, position: "relative" }}>
              <n.icon size={16} strokeWidth={2.1} />{n.label}
              {n.key === "triage" && unacked > 0 && (
                <span className="pr-mono" style={{ background: C.saffron, borderRadius: 999, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{unacked}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px" }}>
        <Badge tone="amber" mono title="No provider credentials are configured. Every provider is running its mock implementation.">
          <Ban size={11} /> ALL PROVIDERS SIMULATED
        </Badge>
      </div>
    </header>
  );
}

/* ============================================================================
   A. KIOSK — patient-facing. No free-text entry exists anywhere below.
   ========================================================================== */

const STAGES = ["idle", "lang", "identify", "consent", "mode", "interview", "docs", "review", "done"];

function KioskApp() {
  const { tts, asr, log, settings, setSettings, commitSession, setLive } = useStore();
  const [stage, setStage] = useState("idle");
  const [orient, setOrient] = useState("portrait");
  const [lang, setLang] = useState("en");
  const [patient, setPatient] = useState(null);
  const [consent, setConsent] = useState({ record: false, abha: false, refused: false });
  const [mode, setMode] = useState("ALLOPATHY");
  const [answers, setAnswers] = useState({});
  const [documents, setDocuments] = useState([]);
  const [qi, setQi] = useState(0);
  const [flag, setFlag] = useState(null);
  const [firedCodes, setFiredCodes] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [helpFlag, setHelpFlag] = useState(false);
  const [wiped, setWiped] = useState(false);

  const T = (k) => tr(UI[k], lang);
  const bcp = LANGS.find((l) => l.code === lang)?.bcp || "en-IN";
  const scale = settings.largePrint ? 1.18 : 1;
  const hc = settings.highContrast;

  const tree = treeFor(mode);
  const visible = useMemo(() => tree.filter((q) => !q.when || q.when(answers, patient)), [tree, answers, patient]);
  const question = visible[qi];

  const reset = useCallback(() => {
    setStage("idle"); setLang("en"); setPatient(null); setAnswers({}); setDocuments([]);
    setQi(0); setFlag(null); setFiredCodes([]); setConsent({ record: false, abha: false, refused: false });
    setStartedAt(null); setHelpFlag(false); setWiped(false); setLive(null); tts.stop();
  }, [tts, setLive]);

  const say = useCallback((text) => {
    const ok = tts.speak(text, bcp);
    log("tts", tts.impl, `${ok ? "spoke" : "no audio device"} · ${bcp} · "${String(text).slice(0, 46)}…"`);
  }, [tts, bcp, log]);

  // Push the in-progress session to the shared store so the queue and triage
  // board update while the patient is still at the kiosk.
  const publish = useCallback((ans = answers, docs = documents, newFlags = []) => {
    if (!patient) return;
    const session = {
      id: patient.sessionId, patientId: patient.id, mode,
      status: stage === "done" ? "COMPLETE" : "IN_PROGRESS",
      startedAt: startedAt || nowISO(), completedAt: stage === "done" ? nowISO() : null, wipedAt: null,
      answers: ans, documents: docs, consent: consent.refused ? null : { scopes: [consent.record && "RECORD_HISTORY", consent.abha && "LINK_ABHA"].filter(Boolean), language: lang, grantedAt: startedAt, artifact: "consent-v1" },
      intakeSeconds: startedAt ? Math.round((Date.now() - new Date(startedAt)) / 1000) : 0,
      transcriptLog: Object.values(ans).filter((a) => a.transcript).map((a) => ({ qid: a.questionId, text: a.transcript, lang: a.lang, at: a.at })),
      verifications: [],
    };
    session.summary = buildSummary(session);
    const flags = newFlags.map((f) => ({ ...f, sessionId: session.id, patientId: patient.id }));
    commitSession(patient, session, flags);
    setLive({ patientId: patient.id, sessionId: session.id });
  }, [patient, mode, stage, startedAt, answers, documents, consent, lang, commitSession, setLive]);

  // Commit an answer, then run the red-flag engine on the new answer set.
  const answer = useCallback((qid, sel, meta) => {
    const a = mkAnswer(mode, qid, sel, { ...meta, lang });
    if (!a) return;
    const next = { ...answers, [qid]: a };
    setAnswers(next);
    const fired = evaluateRedFlags(next).filter((f) => !firedCodes.includes(f.code));
    if (fired.length) {
      const f = fired[0];
      const rec = { ...f, id: uid("flag"), firedAt: nowISO(), acknowledgedBy: null, acknowledgedAt: null };
      setFiredCodes((c) => [...c, f.code]);
      setFlag(rec);
      log("redflag", "rules/red_flags.ts", `${f.code} fired on ${qid}`, "LIVE");
      publish(next, documents, [rec]);
      tts.stop();
      return;
    }
    const step = () => setQi((i) => Math.min(i + 1, 999));
    setTimeout(step, 220);
  }, [answers, mode, lang, firedCodes, documents, log, tts, publish]);

  useEffect(() => { if (patient && stage !== "idle") publish(); /* eslint-disable-next-line */ }, [qi, stage, documents.length]);

  const frameW = orient === "portrait" ? 660 : 1180;
  const bg = hc ? "#FFFFFF" : C.white;
  const fg = hc ? "#000000" : C.ink;

  const shell = (children, opts = {}) => (
    <div style={{ padding: "18px 16px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <KioskChrome orient={orient} setOrient={setOrient} lang={lang} stage={stage} onReset={reset} />
      <div style={{
        width: "100%", maxWidth: frameW, background: bg, color: fg,
        border: `${hc ? 3 : 1}px solid ${hc ? "#000" : C.line}`, borderRadius: 20,
        minHeight: orient === "portrait" ? 720 : 600, display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 18px 44px rgba(14,58,102,.16)", position: "relative",
        fontSize: 20 * scale,
      }}>{children}</div>
      {opts.foot}
    </div>
  );

  /* ---------------------------------------------------------------- A1 idle */
  if (stage === "idle") return shell(<IdleScreen onStart={() => { setStage("lang"); setStartedAt(nowISO()); }} />);

  /* ------------------------------------------------------------ A2 language */
  if (stage === "lang") return shell(
    <LangScreen scale={scale} onPick={(code) => {
      setLang(code);
      const l = LANGS.find((x) => x.code === code);
      tts.speak(l.native, l.bcp);
      log("tts", tts.impl, `language name spoken · ${l.bcp}`);
      setStage("identify");
    }} onSpeak={(l) => { tts.speak(l.native, l.bcp); log("tts", tts.impl, `preview · ${l.bcp}`); }} />
  );

  /* ------------------------------------------------------------ A3 identify */
  if (stage === "identify") return shell(
    <IdentifyScreen lang={lang} scale={scale} onDone={(p) => {
      setPatient({ ...p, id: uid("pt"), sessionId: uid("ses"), lang, dept: mode === "AYUSH" ? "AYUSH" : "General Medicine", waited: 0 });
      setStage("consent");
    }} log={log} T={T} say={say} />
  );

  /* ------------------------------------------------------------- A4 consent */
  if (stage === "consent") return shell(
    <ConsentScreen lang={lang} scale={scale} consent={consent} setConsent={setConsent} say={say}
      onContinue={() => setStage("mode")} T={T} />
  );

  /* ---------------------------------------------------------------- A5 mode */
  if (stage === "mode") return shell(
    <ModeScreen lang={lang} scale={scale} onPick={(m) => { setMode(m); setQi(0); setStage("interview"); }} say={say} />
  );

  /* ----------------------------------------------------- A7 red-flag interrupt */
  if (flag) return shell(
    <FlagScreen flag={flag} lang={lang} T={T} scale={scale}
      onStaffContinue={() => { setFlag(null); setQi((i) => i + 1); }} />
  );

  /* ----------------------------------------------------------- A6 interview */
  if (stage === "interview") {
    if (!question) return shell(<Advance to="docs" go={setStage} />);
    return shell(
      <InterviewScreen key={question.id} q={question} lang={lang} scale={scale} say={say} asr={asr} log={log}
        answers={answers} onAnswer={answer} onBack={() => setQi((i) => Math.max(0, i - 1))}
        onLang={() => setStage("lang")} onHelp={() => { setHelpFlag(true); log("staff", "KioskMitra", "assistance requested", "LIVE"); }}
        helpFlag={helpFlag} T={T} sections={visible} qi={qi} noisy={settings.noisy}
        onCapture={() => setStage("docs")} settings={settings} setSettings={setSettings} />
    );
  }

  /* ------------------------------------------------------------ A8 documents */
  if (stage === "docs") return shell(
    <DocsScreen lang={lang} scale={scale} documents={documents} T={T} say={say}
      onAdd={(kind, filename) => { const d = mkDoc(kind, filename, 0); setDocuments((x) => [...x, d]); log("ocr", "MockOCR", `${filename} · page conf ${d.pageConfidence} · ${d.isRawOnly ? "GATED, raw only" : `${d.extractions.length} field(s)`}`); }}
      onDone={() => setStage("review")} />
  );

  /* --------------------------------------------------------------- A9 review */
  if (stage === "review") return shell(
    <ReviewScreen lang={lang} scale={scale} answers={answers} documents={documents} say={say} T={T}
      onReject={(qid) => setAnswers((a) => { const n = { ...a }; delete n[qid]; return n; })}
      onDone={() => { setStage("done"); }} />
  );

  /* ----------------------------------------------------------------- A10 done */
  return shell(
    <DoneScreen patient={patient} lang={lang} scale={scale} T={T} wiped={wiped}
      onWipe={() => { setDocuments([]); setWiped(true); tts.stop(); log("privacy", "SessionWipe", "in-memory audio, transcripts and images cleared", "LIVE"); }}
      onReset={reset} />
  );
}

// Renders nothing; moves the machine on in an effect rather than during render.
function Advance({ to, go }) {
  useEffect(() => { go(to); }, [to, go]);
  return <div style={{ flex: 1 }} />;
}

function KioskChrome({ orient, setOrient, lang, stage, onReset }) {
  const { settings, setSettings } = useStore();
  return (
    <div style={{ width: "100%", maxWidth: 1180, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 12 }}>
      <Badge tone="grey" mono>SCREEN {STAGES.indexOf(stage) + 1}/9 · {stage.toUpperCase()}</Badge>
      <Badge tone="navy" mono>{orient === "portrait" ? "1080×1920" : "1920×1080"}</Badge>
      <div style={{ flex: 1 }} />
      <Btn size="sm" ghost tone="navy" onClick={() => setOrient(orient === "portrait" ? "landscape" : "portrait")}>
        {orient === "portrait" ? "Landscape" : "Portrait"}
      </Btn>
      <Btn size="sm" ghost tone="navy" icon={Contrast} onClick={() => setSettings((s) => ({ ...s, highContrast: !s.highContrast }))}
        style={settings.highContrast ? { background: C.navy, color: C.white } : undefined}>High contrast</Btn>
      <Btn size="sm" ghost tone="navy" icon={Type} onClick={() => setSettings((s) => ({ ...s, largePrint: !s.largePrint }))}
        style={settings.largePrint ? { background: C.navy, color: C.white } : undefined}>Large print</Btn>
      <Btn size="sm" ghost tone="saffron" icon={RefreshCw} onClick={onReset}>Restart kiosk</Btn>
    </div>
  );
}

/* --------------------------------------------------------------- A1 idle */
function IdleScreen({ onStart }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % LANGS.length), 1900); return () => clearInterval(t); }, []);
  const l = LANGS[i];
  return (
    <button onClick={onStart} aria-label="Touch anywhere to begin" style={{
      flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 30, background: `radial-gradient(120% 90% at 50% 0%, ${C.navySoft} 0%, ${C.navy} 62%)`,
      color: C.white, padding: 40, textAlign: "center",
    }}>
      <div style={{ position: "relative", width: 128, height: 128, display: "grid", placeItems: "center" }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${C.teal}`, animation: "prRipple 2.6s ease-out infinite" }} />
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${C.teal}`, animation: "prRipple 2.6s ease-out infinite 1.3s" }} />
        <div style={{ width: 108, height: 108, borderRadius: 30, background: C.teal, display: "grid", placeItems: "center", animation: "prPulse 2.6s ease-in-out infinite" }}>
          <Stethoscope size={54} strokeWidth={2} />
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: ".03em" }}>PRASHNA</span>
          <span lang="sa" style={{ fontSize: 40, fontWeight: 600, opacity: .82 }}>प्रश्न</span>
        </div>
        <div style={{ fontSize: 18, opacity: .8, marginTop: 8, maxWidth: 460, marginLeft: "auto", marginRight: "auto", lineHeight: 1.45 }}>
          Ayurveda's method of diagnosis by questioning
        </div>
        <div style={{ fontSize: 15, opacity: .62, marginTop: 8, letterSpacing: ".16em", textTransform: "uppercase" }}>Government OPD · Intake</div>
      </div>
      <div key={i} className="pr-in" style={{ minHeight: 78 }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>{tr(UI.touchBegin, l.code)}</div>
        <div style={{ fontSize: 17, opacity: .7, marginTop: 6 }}>{l.native} · {l.en}</div>
      </div>
      <div style={{ fontSize: 15, opacity: .6, maxWidth: 420, lineHeight: 1.6 }}>
        Your history goes to the doctor before you walk in. Nothing here is a diagnosis.
      </div>
    </button>
  );
}

/* ----------------------------------------------------------- A2 language */
function LangScreen({ onPick, onSpeak, scale }) {
  return (
    <div style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column" }}>
      <h1 style={{ fontSize: 30 * scale, margin: "4px 0 4px", fontWeight: 800 }}>Choose your language</h1>
      <p style={{ fontSize: 18 * scale, color: C.muted, margin: "0 0 20px" }}>अपनी भाषा चुनें · तुमची भाषा निवडा · உங்கள் மொழியைத் தேர்வு செய்யவும்</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        {LANGS.map((l) => (
          <button key={l.code} className="pr-tile" onClick={() => onPick(l.code)}
            onPointerEnter={() => onSpeak(l)}
            style={{ minHeight: 118, borderRadius: 16, border: `2px solid ${C.line}`, background: C.white,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: 12 }}>
            <span style={{ fontSize: 27 * scale, fontWeight: 700 }}>{l.native}</span>
            <span style={{ fontSize: 14, color: C.muted }}>{l.en}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: C.teal, fontWeight: 700, marginTop: 2 }}>
              <Volume2 size={13} /> {(() => {
                const c = packCoverage(l.code);
                return c >= 1 ? "Full text pack" : `${Math.round(c * 100)}% translated · voice in your language`;
              })()}
            </span>
          </button>
        ))}
        <div style={{ minHeight: 118, borderRadius: 16, border: `2px dashed ${C.line}`, background: "transparent",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: C.muted, padding: 12, textAlign: "center" }}>
          <Globe size={26} strokeWidth={1.8} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>+{MORE_LANGS} more</span>
          <span style={{ fontSize: 11.5 }}>22 scheduled languages — routed through the same adapter</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- Voice audio caption bar */
function VoiceCaptionBar({ text, onRepeat, scale = 1, lang }) {
  if (!text) return null;
  return (
    <div className="pr-in" style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "linear-gradient(90deg, #EAF3FB 0%, #D4EEF0 100%)",
      border: `1.5px solid ${C.teal}`, borderRadius: 12,
      padding: "8px 14px", marginBottom: 12,
      boxShadow: "0 2px 8px rgba(14,124,134,0.08)"
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%", background: C.teal,
        display: "grid", placeItems: "center", color: "#FFF", flex: "0 0 30px"
      }}>
        <Volume2 size={17} style={{ animation: "prPulse 1.2s infinite" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 10.5 * scale, color: "#0A5F67", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", display: "block" }}>
          {tr(L("Audio Instruction · Voice prompt", "ऑडियो आवाज़ · बोलकर बताया गया", "ऑडिओ आवाज · बोलून सांगितले", "குரல் அறிவிப்பு"), lang)}
        </span>
        <span style={{ fontSize: 14.5 * scale, fontWeight: 700, color: C.navy, lineHeight: 1.35, display: "block" }}>
          “{text}”
        </span>
      </div>
      {onRepeat && (
        <button
          onClick={onRepeat}
          className="pr-tile"
          title="Repeat audio"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 11px", borderRadius: 8, background: C.white,
            border: `1.5px solid ${C.teal}`, color: C.teal, fontSize: 12.5 * scale, fontWeight: 800
          }}>
          <Volume2 size={14} />
          <span>{tr(L("Repeat", "फिर सुनें", "पुन्हा ऐका", "மீண்டும்"), lang)}</span>
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------- Gesture animation guides */
function VoiceGestureGuide({ lang = "hi", scale = 1, compact = false }) {
  const steps = [
    { num: "1", title: L("Hold Button", "बटन दबाकर रखें", "बटन दाबून धरा", "பொத்தானை அழுத்துங்கள்"), sub: L("Press & hold blue mic", "नीला माइक दबाए रखें", "निळा माइक दाबून ठेवा", "நீல மைக்கை அழுத்துங்கள்") },
    { num: "2", title: L("Bring Close", "मुंह के पास लाएं", "तोंडाजवळ आणा", "வாயருகே கொண்டு வாருங்கள்"), sub: L("Hold 5 cm near mouth", "मुंह से 5 सेमी पास रखें", "तोंडापासून 5 सेमी जवळ", "வாயருகே 5 செ.மீ தூரம்") },
    { num: "3", title: L("Speak Clearly", "साफ़ आवाज़ में बोलें", "स्पष्ट आवाजात बोला", "தெளிவாகப் பேசுங்கள்"), sub: L("State your symptom", "अपनी तकलीफ़ बताएं", "तुमचा त्रास सांगा", "உங்கள் பிரச்சனையை கூறுங்கள்") },
  ];

  return (
    <div style={{
      background: "#FFFFFF", border: `2px solid ${C.line}`, borderRadius: 18,
      padding: compact ? "12px 14px" : "14px 18px", display: "flex", flexDirection: "column", gap: 10,
      boxShadow: "0 4px 16px rgba(14,58,102,0.06)", marginBottom: 14
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: "#D4EEF0",
          display: "grid", placeItems: "center", color: C.teal, fontWeight: 800
        }}>
          <Volume2 size={17} />
        </div>
        <div>
          <b style={{ fontSize: 15 * scale, color: C.navy, display: "block" }}>
            {tr(L("How to speak into the Kiosk", "कियोस्क में बोलने का तरीका", "कियोस्कमध्ये बोलण्याची पद्धत", "கியாஸ்க்கில் பேசும் முறை"), lang)}
          </b>
          <span style={{ fontSize: 11.5 * scale, color: C.muted }}>
            {tr(L("Hold button, bring near mouth & speak clearly", "बटन दबाएं, मुंह के पास लाएं और साफ़ बोलें", "बटन दाबा, तोंडाजवळ आणा आणि स्पष्ट बोला", "பொத்தானை அழுத்தி, வாயருகே கொண்டு பேசவும்"), lang)}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        {/* Animated Character Graphic */}
        <div style={{
          flex: "0 0 160px", height: 146,
          background: "radial-gradient(circle at 50% 40%, #F4F9FD 0%, #E2EEF8 100%)",
          borderRadius: 14, border: `1px solid ${C.line}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden"
        }}>
          <svg viewBox="0 0 200 200" width="150" height="146" style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F5CBA7" />
                <stop offset="100%" stopColor="#E59866" />
              </linearGradient>
              <linearGradient id="clothesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E7B45" />
                <stop offset="100%" stopColor="#145A32" />
              </linearGradient>
              <linearGradient id="phoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A2733" />
                <stop offset="100%" stopColor="#0E3A66" />
              </linearGradient>
            </defs>

            {/* Background hospital cross/glow */}
            <circle cx="100" cy="95" r="70" fill="#FFFFFF" opacity="0.6" />
            <rect x="94" y="55" width="12" height="80" rx="6" fill="#D4EEF0" opacity="0.45" />
            <rect x="60" y="89" width="80" height="12" rx="6" fill="#D4EEF0" opacity="0.45" />

            {/* Character Torso */}
            <path d="M 50 200 Q 55 130 95 125 Q 135 130 145 200 Z" fill="url(#clothesGrad)" />
            {/* Scarf / Shawl */}
            <path d="M 80 125 Q 95 145 110 125 Q 95 155 80 125" fill="#E08A2B" />

            {/* Character Neck */}
            <rect x="88" y="105" width="16" height="24" rx="5" fill="url(#skinGrad)" />

            {/* Character Head */}
            <ellipse cx="96" cy="76" rx="26" ry="30" fill="url(#skinGrad)" />

            {/* Hair / Headwear */}
            <path d="M 70 68 Q 76 42 96 42 Q 118 42 122 68 Q 110 54 96 54 Q 80 54 70 68 Z" fill="#424949" />
            <circle cx="70" cy="76" r="5" fill="#E59866" />

            {/* Eyes */}
            <ellipse cx="86" cy="72" rx="3" ry="3.5" fill="#1A2733" />
            <ellipse cx="104" cy="72" rx="3" ry="3.5" fill="#1A2733" />
            <circle cx="87" cy="71" r="1" fill="#FFFFFF" />
            <circle cx="105" cy="71" r="1" fill="#FFFFFF" />
            {/* Eyebrows */}
            <path d="M 81 66 Q 86 63 91 66" stroke="#424949" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M 99 66 Q 104 63 109 66" stroke="#424949" strokeWidth="2.2" fill="none" strokeLinecap="round" />

            {/* Nose */}
            <path d="M 95 72 Q 97 81 94 83" stroke="#D35400" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Mouth */}
            <path d="M 88 89 Q 95 98 103 89" stroke="#922B21" strokeWidth="2.5" fill="#C0392B" strokeLinecap="round" />

            {/* Bindi */}
            <circle cx="95" cy="62" r="2.2" fill="#C0561C" />

            {/* Sound Waves Expanding from Mouth */}
            <g style={{ animation: "prVoiceSoundWaves 3.2s cubic-bezier(0.2, 0.7, 0.4, 1) infinite" }}>
              <path d="M 110 84 A 12 12 0 0 1 110 96" stroke="#0E7C86" strokeWidth="2.8" fill="none" strokeLinecap="round" />
              <path d="M 116 79 A 22 22 0 0 1 116 101" stroke="#0E7C86" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.8" />
              <path d="M 123 74 A 32 32 0 0 1 123 106" stroke="#1E7B45" strokeWidth="3.6" fill="none" strokeLinecap="round" opacity="0.6" />
            </g>

            {/* Animated Arm + Phone Group */}
            <g style={{
              transformOrigin: "145px 175px",
              animation: "prVoiceArmGesture 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}>
              {/* Sleeve */}
              <path d="M 136 142 Q 160 156 150 180 Q 130 170 126 146 Z" fill="url(#clothesGrad)" />
              {/* Forearm */}
              <path d="M 148 166 Q 132 138 123 120" stroke="url(#skinGrad)" strokeWidth="16" strokeLinecap="round" fill="none" />

              {/* Hand holding device */}
              <circle cx="120" cy="116" r="8" fill="url(#skinGrad)" />

              {/* Smartphone / Handset */}
              <g transform="translate(106, 84) rotate(-14)">
                <rect x="0" y="0" width="26" height="44" rx="5" fill="url(#phoneGrad)" stroke="#A9DCE0" strokeWidth="1.4" />
                <rect x="3" y="4" width="20" height="31" rx="3" fill="#08131F" />
                {/* Glowing mic */}
                <circle cx="13" cy="19" r="6" fill="#0E7C86" style={{ animation: "prPulse 1.2s infinite" }} />
                <path d="M 13 16 L 13 20 M 11 18 A 2 2 0 0 0 15 18" stroke="#FFFFFF" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                {/* Audio wave bars on screen */}
                <rect x="5" y="28" width="2.2" height="4" rx="1" fill="#2ECC71" />
                <rect x="9" y="26" width="2.2" height="6" rx="1" fill="#2ECC71" />
                <rect x="13" y="24" width="2.2" height="8" rx="1" fill="#2ECC71" />
                <rect x="17" y="26" width="2.2" height="6" rx="1" fill="#2ECC71" />
              </g>
            </g>
          </svg>

          {/* Live Action Badge */}
          <div style={{
            position: "absolute", bottom: 5, right: 5,
            background: "rgba(14,124,134,0.92)", color: "#FFF",
            fontSize: 9.5, fontWeight: 800, padding: "2px 6px", borderRadius: 999,
            display: "flex", alignItems: "center", gap: 3
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2ECC71", display: "inline-block", animation: "prPulse 1s infinite" }} />
            <span>5 cm</span>
          </div>
        </div>

        {/* 3 Steps Guidance Column */}
        <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 6 }}>
          {steps.map((st) => (
            <div key={st.num} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "5px 9px", borderRadius: 9,
              background: C.bg, border: `1px solid ${C.line}`
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: C.navy, color: "#FFFFFF",
                fontSize: 11.5, fontWeight: 800, display: "grid", placeItems: "center"
              }}>{st.num}</span>
              <div style={{ lineHeight: 1.2 }}>
                <b style={{ fontSize: 13 * scale, color: C.ink }}>{tr(st.title, lang)}</b>
                <span style={{ display: "block", fontSize: 11 * scale, color: C.muted }}>{tr(st.sub, lang)}</span>
              </div>
            </div>
          ))}

          {/* Quick Do / Don't Pill */}
          <div style={{ display: "flex", gap: 10, marginTop: 2, fontSize: 11 * scale, fontWeight: 700 }}>
            <span style={{ color: "#155C33", display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Check size={13} strokeWidth={3} /> {tr(L("Near mouth", "मुंह के पास", "तोंडाजवळ", "வாயருகே"), lang)}
            </span>
            <span style={{ color: "#C0561C", display: "inline-flex", alignItems: "center", gap: 3 }}>
              <X size={13} strokeWidth={3} /> {tr(L("Not far away", "दूर रखकर नहीं", "लांब ठेवून नाही", "தொலைவில் அல்ல"), lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanGestureGuide({ lang = "hi", scale = 1, onSimulate, T }) {
  return (
    <div style={{
      width: "100%", maxWidth: 460,
      background: "#FFFFFF", border: `2px solid ${C.line}`, borderRadius: 20,
      padding: "20px 22px", display: "flex", flexDirection: "column", alignItems: "center",
      gap: 16, boxShadow: "0 10px 28px rgba(14,58,102,0.08)"
    }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 22 * scale, margin: 0, fontWeight: 800, color: C.navy }}>
          {tr(L("Hold your card in front of camera", "कार्ड को कैमरे के सामने सीधा रखें", "कार्ड कॅमेऱ्यासमोर सरळ धरा", "அட்டையை கேமரா முன் நேராகப் பிடியுங்கள்"), lang)}
        </h2>
        <p style={{ fontSize: 14 * scale, color: C.muted, margin: "4px 0 0" }}>
          {tr(L("Keep 15 cm distance and hold steady", "15 सेमी की दूरी रखें और हिलाएं नहीं", "15 सेमी अंतर ठेवा आणि हलवू नका", "15 செ.மீ இடைவெளியில் அசையாமல் வைக்கவும்"), lang)}
        </p>
      </div>

      {/* Interactive Animated Scanner Visual */}
      <div style={{
        width: 280, height: 220, borderRadius: 18,
        background: "radial-gradient(ellipse at 50% 10%, #15293E 0%, #08131F 100%)",
        border: "3px solid #0E7C86", position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        overflow: "hidden", boxShadow: "inset 0 0 24px rgba(14,124,134,0.4)"
      }}>
        {/* Top Kiosk Camera & Green Light */}
        <div style={{
          position: "absolute", top: 8, left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7, zIndex: 10
        }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#1A2733", border: "2px solid #0E7C86", display: "grid", placeItems: "center" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#2ECC71", animation: "prPulse 1s infinite" }} />
          </div>
          <span style={{ fontSize: 9.5, color: "#A9DCE0", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
            {tr(L("Kiosk Scanner Active", "कियोस्क स्कैनर सक्रिय", "कियोस्क स्कॅनर सक्रिय", "கியாஸ்க் ஸ்கேனர் தயார்"), lang)}
          </span>
        </div>

        {/* Laser Scanning Cone & Beam */}
        <div style={{
          position: "absolute", top: 22, left: 20, right: 20, height: 125,
          background: "linear-gradient(180deg, rgba(14,124,134,0.3) 0%, rgba(14,124,134,0.02) 100%)",
          clipPath: "polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)",
          pointerEvents: "none", zIndex: 2
        }} />

        {/* Laser Moving Line */}
        <div style={{
          position: "absolute", left: 26, right: 26, height: 3,
          background: "linear-gradient(90deg, transparent, #2ECC71 20%, #A9DCE0 50%, #2ECC71 80%, transparent)",
          boxShadow: "0 0 14px #2ECC71, 0 0 22px #0E7C86", zIndex: 4,
          animation: "prLaserSweepLine 2.4s ease-in-out infinite",
        }} />

        {/* Alignment Corner Brackets */}
        <div style={{
          position: "absolute", width: 170, height: 110,
          border: "2px dashed rgba(169, 220, 224, 0.4)", borderRadius: 10, zIndex: 3,
          display: "flex", justifyContent: "space-between", padding: 4, boxSizing: "border-box",
          animation: "prScanTargetLock 3.5s infinite"
        }}>
          <div style={{ width: 14, height: 14, borderTop: "3px solid #2ECC71", borderLeft: "3px solid #2ECC71" }} />
          <div style={{ width: 14, height: 14, borderTop: "3px solid #2ECC71", borderRight: "3px solid #2ECC71" }} />
        </div>

        {/* Animated Hand & ABHA Card */}
        <div style={{
          position: "relative", zIndex: 5,
          animation: "prScanCardMove 3.5s ease-in-out infinite",
          display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          {/* ABHA / Ayushman Bharat Card */}
          <div style={{
            width: 155, height: 95, borderRadius: 9,
            background: "linear-gradient(135deg, #FFFFFF 0%, #F5F9FD 100%)",
            border: "2px solid #C0561C", boxShadow: "0 8px 22px rgba(0,0,0,0.45)",
            padding: 7, display: "flex", flexDirection: "column", justifyContent: "space-between",
            position: "relative"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E08A2B", paddingBottom: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: "#C0561C" }}>ABHA</span>
                <span style={{ fontSize: 7, color: "#1E7B45", fontWeight: 700 }}>आभा</span>
              </div>
              <span style={{ fontSize: 6.5, color: "#5B7185", fontWeight: 700 }}>NATIONAL HEALTH AUTHORITY</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 32, borderRadius: 4, background: "#DCEAF7", border: "1px solid #B9D3EC", display: "grid", placeItems: "center" }}>
                <User size={17} color="#0E3A66" />
              </div>
              <div style={{ width: 34, height: 34, background: "#08131F", borderRadius: 4, padding: 2, display: "grid", placeItems: "center" }}>
                <QrCode size={28} color="#FFFFFF" />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ width: 32, height: 4, background: "#0E3A66", borderRadius: 2 }} />
                <div style={{ width: 44, height: 3, background: "#5B7185", borderRadius: 2 }} />
                <div style={{ width: 38, height: 3, background: "#C0561C", borderRadius: 2 }} />
              </div>
            </div>

            <div style={{ fontSize: 7.5, fontWeight: 800, color: "#0E3A66", letterSpacing: ".08em", textAlign: "center" }}>
              91-4829-1049-3821
            </div>
          </div>

          {/* Illustrated Hand holding the card */}
          <svg width="80" height="38" viewBox="0 0 80 38" style={{ marginTop: -10, zIndex: 6 }}>
            <ellipse cx="28" cy="14" rx="7" ry="12" fill="#E59866" transform="rotate(-30 28 14)" stroke="#C0392B" strokeWidth="0.5" />
            <rect x="22" y="16" width="36" height="18" rx="8" fill="#F5CBA7" stroke="#C0392B" strokeWidth="0.5" />
            <path d="M 28 34 Q 40 42 54 34 L 54 42 L 28 42 Z" fill="#E59866" />
          </svg>
        </div>

        {/* Success Checkmark Pop */}
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 20,
          width: 30, height: 30, borderRadius: "50%", background: "#1E7B45",
          display: "grid", placeItems: "center", color: "#FFF",
          boxShadow: "0 0 12px rgba(30,123,69,0.8)",
          animation: "prCheckPop 3.5s infinite"
        }}>
          <Check size={18} strokeWidth={3} />
        </div>
      </div>

      {/* Visual Do / Don't Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
        <div style={{
          background: C.mint, border: "1.5px solid #B4DDBB", borderRadius: 12,
          padding: "8px 10px", display: "flex", alignItems: "center", gap: 8
        }}>
          <Check size={17} color="#155C33" strokeWidth={3} />
          <div style={{ lineHeight: 1.2 }}>
            <b style={{ fontSize: 12.5 * scale, color: "#155C33", display: "block" }}>
              {tr(L("Hold Steady", "सीधा पकड़ें", "सरळ धरा", "நேராகப் பிடி"), lang)}
            </b>
            <span style={{ fontSize: 11 * scale, color: "#155C33", opacity: 0.85 }}>
              {tr(L("15 cm from lens", "15 सेमी दूर", "15 सेमी अंतर", "15 செ.மீ தூரம்"), lang)}
            </span>
          </div>
        </div>

        <div style={{
          background: "#FBE2D4", border: "1.5px solid #F0C2A6", borderRadius: 12,
          padding: "8px 10px", display: "flex", alignItems: "center", gap: 8
        }}>
          <X size={17} color="#8E3E14" strokeWidth={3} />
          <div style={{ lineHeight: 1.2 }}>
            <b style={{ fontSize: 12.5 * scale, color: "#8E3E14", display: "block" }}>
              {tr(L("Don't Shake", "हिलाएं नहीं", "हलवू नका", "அசைக்காதீர்"), lang)}
            </b>
            <span style={{ fontSize: 11 * scale, color: "#8E3E14", opacity: 0.85 }}>
              {tr(L("Keep fingers off QR", "अंगूठा QR पर न रखें", "QR झाकू नका", "QR மூடாதீர்"), lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
        <Btn size="lg" tone="teal" icon={ScanLine} onClick={onSimulate} style={{ flex: 1, minHeight: 56 }}>
          {tr(L("Simulate scan", "स्कैन सिमुलेट करें", "स्कॅन सिम्युलेट करा", "ஸ்கேன் உருவகப்படுத்து"), lang)}
        </Btn>
      </div>
    </div>
  );
}

function DocScanGestureGuide({ lang = "hi", scale = 1 }) {
  return (
    <div style={{
      background: "#FFFFFF", border: `2px solid ${C.line}`, borderRadius: 16,
      padding: "12px 18px", display: "flex", alignItems: "center", gap: 16,
      marginBottom: 14, boxShadow: "0 2px 10px rgba(14,58,102,0.04)"
    }}>
      <div style={{
        width: 100, height: 76, flex: "0 0 100px",
        background: "radial-gradient(circle at 50% 30%, #EAF3FB 0%, #D2DFEA 100%)",
        borderRadius: 10, border: `1.5px solid ${C.teal}`,
        position: "relative", overflow: "hidden", display: "grid", placeItems: "center"
      }}>
        <div style={{
          width: 58, height: 58, background: "#FFF", borderRadius: 4,
          border: "1px solid #C4D8EA", boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          padding: 4, display: "flex", flexDirection: "column", gap: 3,
          animation: "prDocSlideIn 3s ease-in-out infinite"
        }}>
          <div style={{ width: 24, height: 3, background: C.teal, borderRadius: 1 }} />
          <div style={{ width: 44, height: 2, background: C.line, borderRadius: 1 }} />
          <div style={{ width: 38, height: 2, background: C.line, borderRadius: 1 }} />
          <div style={{ width: 46, height: 2, background: C.line, borderRadius: 1 }} />
          <div style={{ width: 30, height: 2, background: C.line, borderRadius: 1 }} />
        </div>

        <div style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: C.teal, boxShadow: `0 0 10px ${C.teal}`,
          animation: "prLaserSweepLine 2s infinite"
        }} />
      </div>

      <div style={{ flex: 1 }}>
        <b style={{ fontSize: 15 * scale, color: C.navy, display: "block" }}>
          {tr(L("How to scan your papers", "कागज़ कैसे स्कैन करें", "कागदपत्रे कशी स्कॅन करावीत", "ஆவணங்களை எவ்வாறு ஸ்கேன் செய்வது"), lang)}
        </b>
        <span style={{ fontSize: 13 * scale, color: C.muted, display: "block", marginTop: 2 }}>
          {tr(L("Place the paper flat on the tray below the camera. Do not fold.",
                "पर्चे को ट्रे पर बिल्कुल सीधा और चपटा रखें। मोड़े नहीं।",
                "कागद ट्रेवर पूर्णपणे सरळ आणि सपाट ठेवा. घडी घालू नका.",
                "காகிதத்தை தட்டில் தட்டையாக வைக்கவும். மடிக்க வேண்டாம்."), lang)}
        </span>
        <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11.5 * scale, fontWeight: 700 }}>
          <span style={{ color: "#155C33", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Check size={14} strokeWidth={3} /> {tr(L("Keep flat", "बिल्कुल सीधा", "सपाट ठेवा", "தட்டையாக வைக்கவும்"), lang)}
          </span>
          <span style={{ color: "#C0561C", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <X size={14} strokeWidth={3} /> {tr(L("No folds", "मोड़े नहीं", "घडी नाही", "மடிப்புகள் வேண்டாம்"), lang)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- A3 identify */
function IdentifyScreen({ lang, scale, onDone, log, T, say }) {
  const [step, setStep] = useState("choose");
  const [digits, setDigits] = useState("");
  const [otp, setOtp] = useState("");
  const [abha, setAbha] = useState(null);

  const introVoice = tr(L(
    "Please choose how you want to identify yourself. Scan your ABHA card, enter mobile number, or use OPD token slip.",
    "कृपया अपनी पहचान का तरीका चुनें। अपना आभा कार्ड स्कैन करें, मोबाइल नंबर डालें, या टोकन पर्ची बताएं।",
    "कृपया तुमची ओळख निवडण्याचा पर्याय निवडा. तुमचे आभा कार्ड स्कॅन करा, मोबाइल नंबर टाका, किंवा टोकन पावती सांगा.",
    "உங்கள் அடையாள முறையைத் தேர்வு செய்யவும். ABHA அட்டையை ஸ்கேன் செய்யவும் அல்லது அலைபேசி எண்ணை உள்ளிடவும்."
  ), lang);

  useEffect(() => {
    if (say && step === "choose") say(introVoice);
    /* eslint-disable-next-line */
  }, [lang, step]);

  const big = { minHeight: 120, borderRadius: 16, border: `2px solid ${C.line}`, background: C.white,
    display: "flex", alignItems: "center", gap: 18, padding: "16px 20px", textAlign: "left", width: "100%" };

  const finish = (name, extra) => onDone({ name, age: 54, sex: "M", token: `A-0${20 + Math.floor(Math.random() * 60)}`, phoneMasked: "•••••• " + (digits.slice(-4) || "0000"), abha: extra || null });

  if (step === "choose") return (
    <div style={{ flex: 1, padding: 26, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1 style={{ fontSize: 29 * scale, margin: 0, fontWeight: 800 }}>
        {tr(L("Who are you?", "आपकी पहचान क्या है?", "तुमची ओळख काय आहे?", "உங்கள் அடையாளம் என்ன?"), lang)}
      </h1>
      <p style={{ fontSize: 16.5 * scale, color: C.muted, margin: 0 }}>
        {tr(L("Any one of these is enough. You do not need a smartphone.",
              "इनमें से कोई भी एक चलेगा। स्मार्टफोन की ज़रूरत नहीं है।",
              "यापैकी कोणताही एक पुरावा चालेल. स्मार्टफोनची गरज नाही.",
              "இவற்றில் ஏதேனும் ஒன்று போதும். ஸ்மார்ட்போன் தேவையில்லை."), lang)}
      </p>

      <VoiceCaptionBar text={introVoice} onRepeat={() => say && say(introVoice)} lang={lang} scale={scale} />

      <button className="pr-tile" style={big} onClick={() => setStep("qr")}>
        <QrCode size={42} color={C.teal} strokeWidth={1.8} />
        <span>
          <b style={{ fontSize: 21 * scale, display: "block" }}>
            {tr(L("Scan my ABHA QR", "मेरा ABHA QR स्कैन करें", "माझे ABHA QR स्कॅन करा", "என் ABHA QR ஸ்கேன் செய்"), lang)}
          </b>
          <span style={{ fontSize: 15, color: C.muted }}>
            {tr(L("Hold the card in front of the camera", "कार्ड को कैमरे के सामने दिखाएं", "कार्ड कॅमेऱ्यासमोर धरा", "அட்டையை கேமரா முன் காட்டவும்"), lang)}
          </span>
        </span>
      </button>

      <button className="pr-tile" style={big} onClick={() => setStep("mobile")}>
        <Keyboard size={42} color={C.teal} strokeWidth={1.8} />
        <span>
          <b style={{ fontSize: 21 * scale, display: "block" }}>
            {tr(L("ABHA number or mobile", "ABHA नंबर या मोबाइल नंबर", "ABHA क्रमांक किंवा मोबाइल", "ABHA எண் அல்லது அலைபேசி"), lang)}
          </b>
          <span style={{ fontSize: 15, color: C.muted }}>
            {tr(L("Numbers only, then an OTP", "केवल नंबर डालें, फिर एक OTP आएगा", "फक्त क्रमांक टाका, नंतर OTP येईल", "எண்கள் மட்டும், பிறகு ஒரு OTP வரும்"), lang)}
          </span>
        </span>
      </button>

      <button className="pr-tile" style={big} onClick={() => setStep("token")}>
        <FileText size={42} color={C.teal} strokeWidth={1.8} />
        <span>
          <b style={{ fontSize: 21 * scale, display: "block" }}>
            {tr(L("My OPD token slip", "मेरी ओपीडी टोकन पर्ची", "माझी OPD टोकन पावती", "என் OPD டோக்கன் சீட்டு"), lang)}
          </b>
          <span style={{ fontSize: 15, color: C.muted }}>
            {tr(L("The paper from the counter", "काउंटर से मिला हुआ कागज़", "काउंटरवरून मिळालेला कागद", "கவுண்டரில் பெற்ற சீட்டு"), lang)}
          </span>
        </span>
      </button>

      <button className="pr-tile" style={{ ...big, borderStyle: "dashed" }} onClick={() => { const n = MockABDM.newAbha(); setAbha(n); log("abdm", MockABDM.impl, `provisional record created, ABHA ${n} (fake)`); finish("New patient", n); }}>
        <UserPlus size={42} color={C.saffron} strokeWidth={1.8} />
        <span>
          <b style={{ fontSize: 21 * scale, display: "block" }}>
            {tr(L("I don't have any of these", "मेरे पास इनमें से कुछ नहीं है", "माझ्याकडे यातील काहीही नाही", "என்னிடம் எதுவும் இல்லை"), lang)}
          </b>
          <span style={{ fontSize: 15, color: C.muted }}>
            {tr(L("We will start a temporary record and can make an ABHA later",
                  "हम एक अस्थायी रिकॉर्ड बनाएंगे, ABHA बाद में भी बन सकता है",
                  "आम्ही तात्पुरती नोंद सुरू करू, ABHA नंतरही बनवता येईल",
                  "தற்காலிக பதிவு தொடங்குவோம், ABHA பிறகு உருவாக்கலாம்"), lang)}
          </span>
        </span>
      </button>

      <div style={{ marginTop: "auto", paddingTop: 10 }}>
        <Badge tone="amber" mono>
          {tr(L("ABDM Sandbox M1–M3 — architecture ready, running MockABDM",
                "ABDM सैंडबॉक्स M1–M3 · आर्किटेक्चर तैयार, MockABDM सक्रिय",
                "ABDM सँडबॉक्स M1–M3 · सज्ज, MockABDM सक्रिय",
                "ABDM சாண்ட்பாக்ஸ் M1–M3 · தயார்"), lang)}
        </Badge>
      </div>
    </div>
  );

  if (step === "qr") return (
    <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <ScanGestureGuide
        lang={lang} scale={scale} T={T}
        onSimulate={() => {
          const n = MockABDM.newAbha();
          log("abdm", MockABDM.impl, `QR decoded (simulated) → ABHA ${n}`);
          finish("Ramesh Patil", n);
        }}
      />
      <Btn ghost tone="grey" icon={ArrowLeft} onClick={() => setStep("choose")}>{T("back")}</Btn>
    </div>
  );

  if (step === "token") return (
    <NumPad
      title={tr(L("Type the number on your token slip", "अपनी टोकन पर्ची का नंबर डालें", "तुमच्या टोकन पावतीवरील क्रमांक टाका", "டோக்கன் சீட்டிலுள்ள எண்ணைத் தட்டச்சு செய்க"), lang)}
      value={digits} setValue={setDigits} scale={scale} lang={lang}
      max={4} onBack={() => setStep("choose")} onOk={() => finish("Walk-in patient", null)}
      okLabel={tr(L("Continue", "आगे बढ़ें", "पुढे जा", "தொடரவும்"), lang)} T={T}
    />
  );

  if (step === "mobile") return (
    <NumPad
      title={tr(L("Your mobile number", "अपना मोबाइल नंबर डालें", "तुमचा मोबाइल क्रमांक टाका", "உங்கள் அலைபேசி எண்"), lang)}
      value={digits} setValue={setDigits} scale={scale} max={10} lang={lang}
      onBack={() => setStep("choose")} onOk={() => setStep("otp")}
      okLabel={tr(L("Send OTP", "OTP भेजें", "OTP पाठवा", "OTP அனுப்பு"), lang)} T={T}
    />
  );

  return (
    <NumPad
      title={tr(L("Enter the OTP", "OTP दर्ज करें", "OTP टाका", "OTP உள்ளிடவும்"), lang)}
      hint={tr(L("Demo OTP is 1 2 3 4 5 6", "डेमो OTP है: 1 2 3 4 5 6", "डेमो OTP आहे: 1 2 3 4 5 6", "டெமோ OTP: 1 2 3 4 5 6"), lang)}
      value={otp} setValue={setOtp} scale={scale} max={6} lang={lang}
      onBack={() => setStep("mobile")}
      okLabel={tr(L("Verify", "सत्यापित करें", "तपासा", "சரிபார்"), lang)}
      error={otp.length === 6 && !MockABDM.verifyOtp(otp) ? tr(L("That OTP did not match. Try 123456.", "वह OTP सही नहीं था। 123456 आज़माएं।", "तो OTP जुळला नाही. 123456 वापरा.", "OTP பொருந்தவில்லை. 123456 முயற்சிக்கவும்."), lang) : null}
      onOk={() => { if (MockABDM.verifyOtp(otp)) { const n = MockABDM.newAbha(); log("abdm", MockABDM.impl, `OTP verified → ABHA ${n} (fake)`); finish("Ramesh Patil", n); } }} T={T}
    />
  );
}

function NumPad({ title, hint, value, setValue, max, onOk, onBack, okLabel, error, scale, T, lang }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clr", "0", "ok"];
  const clearLabel = tr(L("Clear", "साफ़ करें", "पुसा", "அழி"), lang);
  return (
    <div style={{ flex: 1, padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 style={{ fontSize: 28 * scale, margin: 0, fontWeight: 800 }}>{title}</h1>
      {hint && <p style={{ fontSize: 17, color: C.muted, margin: 0 }}>{hint}</p>}
      <div className="pr-mono" style={{ fontSize: 38, letterSpacing: ".22em", padding: "16px 18px", background: C.bg,
        border: `2px solid ${error ? C.saffron : C.line}`, borderRadius: 12, minHeight: 74, textAlign: "center" }}>
        {value || <span style={{ opacity: .3 }}>{"·".repeat(max)}</span>}
      </div>
      {error && <div style={{ color: C.saffron, fontSize: 16, fontWeight: 700 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, flex: 1 }}>
        {keys.map((k) => (
          <button key={k} className="pr-tile" onClick={() => {
            if (k === "clr") setValue("");
            else if (k === "ok") onOk();
            else setValue(value.length < max ? value + k : value);
          }} style={{ minHeight: 68, borderRadius: 12, fontSize: k.length > 1 ? 17 : 30, fontWeight: 700,
            border: `2px solid ${C.line}`,
            background: k === "ok" ? C.navy : C.white, color: k === "ok" ? C.white : C.ink }}>
            {k === "clr" ? clearLabel : k === "ok" ? (okLabel || "OK") : k}
          </button>
        ))}
      </div>
      <Btn ghost tone="grey" icon={ArrowLeft} onClick={onBack}>{T("back")}</Btn>
    </div>
  );
}

/* ------------------------------------------------------------ A4 consent */
function ConsentScreen({ lang, scale, consent, setConsent, onContinue, say, T }) {
  const text = tr(L(
    "The kiosk will ask you about your health and save your answers for the doctor you are about to see. You can say no. If you say no, you will still see the doctor.",
    "यह कियोस्क आपसे आपकी सेहत के बारे में पूछेगा और आपके जवाब डॉक्टर के लिए सुरक्षित रखेगा। आप मना कर सकते हैं। मना करने पर भी आप डॉक्टर से मिलेंगे।",
    "हे कियोस्क तुम्हाला तुमच्या तब्येतीबद्दल विचारेल आणि तुमची उत्तरे डॉक्टरांसाठी जतन करेल. तुम्ही नकार देऊ शकता. नकार दिला तरी तुम्ही डॉक्टरांना भेटाल.",
    "இந்த கியாஸ்க் உங்கள் உடல்நலம் பற்றி கேட்டு, பதில்களை மருத்துவருக்காக சேமிக்கும். நீங்கள் மறுக்கலாம். மறுத்தாலும் மருத்துவரைப் பார்க்கலாம்."), lang);
  useEffect(() => { say(text); /* eslint-disable-next-line */ }, []);
  const ok = consent.record;
  return (
    <div style={{ flex: 1, padding: 26, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 29 * scale, margin: 0, fontWeight: 800, flex: 1 }}>{tr(L("Your permission", "आपकी अनुमति", "तुमची परवानगी", "உங்கள் அனுமதி"), lang)}</h1>
        <Btn tone="teal" ghost icon={Volume2} onClick={() => say(text)}>{T("repeat")}</Btn>
      </div>

      <VoiceCaptionBar text={text} onRepeat={() => say(text)} lang={lang} scale={scale} />

      <div style={{ background: C.bg, borderRadius: 14, padding: "6px 16px", border: `1px solid ${C.line}` }}>
        <Toggle on={consent.record} onChange={(v) => setConsent((c) => ({ ...c, record: v, refused: false }))}
          label={tr(L("Record my history for today's doctor", "आज के डॉक्टर के लिए मेरी जानकारी सहेजें", "आजच्या डॉक्टरांसाठी माझी माहिती जतन करा", "இன்றைய மருத்துவருக்காக என் தகவலைச் சேமிக்கவும்"), lang)}
          sub={tr(L("Kept on this hospital's system.", "इसी अस्पताल के सिस्टम में रहेगा।", "याच रुग्णालयाच्या प्रणालीत राहील.", "இந்த மருத்துவமனையிலேயே இருக்கும்."), lang)} />
        <div style={{ height: 1, background: C.line }} />
        <Toggle on={consent.abha} onChange={(v) => setConsent((c) => ({ ...c, abha: v }))}
          label={tr(L("Also link it to my ABHA health record", "मेरे ABHA रिकॉर्ड से भी जोड़ें", "माझ्या ABHA नोंदीशीही जोडा", "என் ABHA பதிவுடன் இணைக்கவும்"), lang)}
          sub={tr(L("Optional. You can refuse this and still continue.", "वैकल्पिक। मना करके भी आगे बढ़ सकते हैं।", "पर्यायी. नकार देऊनही पुढे जाऊ शकता.", "விருப்பம். மறுத்தாலும் தொடரலாம்."), lang)} />
      </div>
      <div style={{ marginTop: "auto", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Btn size="lg" tone="navy" disabled={!ok} onClick={() => onContinue()} icon={Check}>
          {tr(L("I agree", "मैं सहमत हूँ", "मी सहमत आहे", "நான் ஒப்புக்கொள்கிறேன்"), lang)}
        </Btn>
        <Btn size="lg" ghost tone="saffron" icon={X} onClick={() => { setConsent({ record: false, abha: false, refused: true }); onContinue(); }}>
          {tr(L("No, skip this", "नहीं, छोड़ दें", "नाही, वगळा", "இல்லை, தவிர்"), lang)}
        </Btn>
      </div>
      <div style={{ fontSize: 13, color: C.muted }}>
        {tr(L("A consent artefact is written with the timestamp, the language you are reading, and exactly which scopes you granted.",
              "आपकी सहमति का एक रिकॉर्ड समय, चुनी गई भाषा और आपके द्वारा दी गई अनुमति के साथ सुरक्षित रखा जाता है।",
              "तुमच्या संमतीची नोंद वेळ, निवडलेली भाषा आणि तुम्ही दिलेल्या परवानग्यांसह जतन केली जाते.",
              "உங்கள் ஒப்புதல் பதிவு நேரம் மற்றும் மொழியுடன் பாதுகாக்கப்படுகிறது."), lang)}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- A5 mode */
function ModeScreen({ lang, scale, onPick, say }) {
  const modeVoice = tr(L(
    "Which department are you visiting? Allopathy or AYUSH Ayurveda?",
    "आप किस विभाग में आए हैं? एलोपैथी या आयुष आयुर्वेद?",
    "तुम्ही कोणत्या विभागात आला आहात? ॲलोपॅथी की आयुष आयुर्वेद?",
    "எந்தப் பிரிவுக்கு வந்துள்ளீர்கள்? அலோபதி அல்லது ஆயுஷ் ஆயுர்வேதம்?"
  ), lang);

  useEffect(() => {
    if (say) say(modeVoice);
    /* eslint-disable-next-line */
  }, [lang]);

  const card = { flex: 1, minHeight: 220, borderRadius: 18, border: `2px solid ${C.line}`, background: C.white,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 22, minWidth: 220 };
  return (
    <div style={{ flex: 1, padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: 29 * scale, margin: 0, fontWeight: 800 }}>
        {tr(L("Which department are you visiting?", "आप किस विभाग में आए हैं?", "तुम्ही कोणत्या विभागात आला आहात?", "எந்தப் பிரிவுக்கு வந்துள்ளீர்கள்?"), lang)}
      </h1>

      <VoiceCaptionBar text={modeVoice} onRepeat={() => say && say(modeVoice)} lang={lang} scale={scale} />

      <div style={{ display: "flex", gap: 16, flex: 1, flexWrap: "wrap" }}>
        <button className="pr-tile" style={card} onClick={() => onPick("ALLOPATHY")}>
          <Stethoscope size={66} color={C.navy} strokeWidth={1.6} />
          <span style={{ fontSize: 26 * scale, fontWeight: 800 }}>
            {tr(L("Allopathy", "एलोपैथी (Allopathy)", "ॲलोपॅथी (Allopathy)", "அலோபதி"), lang)}
          </span>
          <span style={{ fontSize: 15, color: C.muted, textAlign: "center" }}>
            {tr(L("General medicine · SOCRATES history", "सामान्य चिकित्सा · लक्षण इतिहास", "सामान्य वैद्यकीय · लक्षणांचा इतिहास", "பொது மருத்துவம் · அறிகுறிகள் வரலாறு"), lang)}
          </span>
        </button>
        <button className="pr-tile" style={{ ...card, borderColor: C.green }} onClick={() => onPick("AYUSH")}>
          <Leaf size={66} color={C.green} strokeWidth={1.6} />
          <span style={{ fontSize: 26 * scale, fontWeight: 800, color: C.green }}>
            {tr(L("AYUSH", "आयुष (AYUSH)", "आयुष (AYUSH)", "ஆயுஷ்"), lang)}
          </span>
          <span style={{ fontSize: 15, color: C.muted, textAlign: "center" }}>
            {tr(L("Ayurveda · Dashavidha Pariksha", "आयुर्वेद · दशविध परीक्षा", "आयुर्वेद · दशविध परीक्षा", "ஆயுர்வேதம் · தசவித பரீட்சை"), lang)}
          </span>
        </button>
      </div>
      <div style={{ fontSize: 14, color: C.muted }}>
        {tr(L("This choice changes the whole question tree, not just a label.",
              "यह चयन पूरी प्रश्न श्रृंखला बदलता है, केवल लेबल नहीं।",
              "हा पर्याय संपूर्ण प्रश्न मालिका बदलतो, फक्त नाव नाही.",
              "இந்தத் தேர்வு முழு கேள்வி வரிசையையும் மாற்றுகிறது."), lang)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- A6 interview core */
function InterviewScreen({ q, lang, scale, say, asr, log, answers, onAnswer, onBack, onLang, onHelp,
  helpFlag, T, sections, qi, noisy, onCapture }) {
  const [sel, setSel] = useState([]);
  const [listening, setListening] = useState(false);
  const [bars, setBars] = useState(Array(26).fill(0.2));
  const [result, setResult] = useState(null);
  const [iconOnly, setIconOnly] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const qText = tr(q.text, lang);

  useEffect(() => { say(qText); /* eslint-disable-next-line */ }, [q.id]);
  useEffect(() => {
    if (!listening) return;
    const t = setInterval(() => setBars(Array.from({ length: 26 }, () => 0.15 + Math.random() * (noisy ? 0.5 : 0.85))), 85);
    return () => clearInterval(t);
  }, [listening, noisy]);

  const groups = useMemo(() => {
    const g = []; sections.forEach((x, i) => {
      const last = g[g.length - 1];
      if (last && last.name === x.section) last.idx.push(i); else g.push({ name: x.section, idx: [i] });
    }); return g;
  }, [sections]);

  const release = async () => {
    setListening(false); setBusy(true);
    const r = await asr.transcribe(q, lang);
    setBusy(false); setResult(r);
    log("asr", asr.impl, `${q.id} · confidence ${r.confidence.toFixed(2)}${r.confidence < ASR_GATE ? " · BELOW GATE, switching to icons" : ""}`);
    if (r.confidence < ASR_GATE) { setAttempts((a) => a + 1); setIconOnly(true); return; }
    setTimeout(() => onAnswer(q.id, r.pick, { m: "VOICE", t: r.text, c: r.confidence }), 780);
  };

  const pick = (id) => {
    if (q.kind === "multi") {
      setSel((s) => id === "none" ? ["none"] : (s.includes(id) ? s.filter((x) => x !== id) : [...s.filter((x) => x !== "none"), id]));
      return;
    }
    if (q.kind === "capture" && id === "camera") { onAnswer(q.id, id, { m: "TOUCH" }); onCapture(); return; }
    onAnswer(q.id, id, { m: "TOUCH" });
  };

  const tile = (opt) => {
    const on = sel.includes(opt.id);
    return (
      <button key={opt.id} className="pr-tile" onClick={() => pick(opt.id)} aria-pressed={q.kind === "multi" ? on : undefined}
        style={{ minHeight: 108, minWidth: 108, borderRadius: 16, padding: "14px 8px",
          border: `2.5px solid ${on ? C.teal : C.line}`, background: on ? C.mint : C.white,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Ico name={opt.icon} size={40} color={on ? C.green : C.navy} />
        <span style={{ fontSize: 15.5 * scale, fontWeight: 700, textAlign: "center", lineHeight: 1.25 }}>{tr(opt.label, lang)}</span>
        {on && <Check size={16} color={C.green} strokeWidth={3} />}
      </button>
    );
  };

  const canSpeak = q.kind !== "scale" && !iconOnly;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* progress by section, never a raw percentage */}
      <div style={{ display: "flex", gap: 6, padding: "14px 22px 10px", flexWrap: "wrap", borderBottom: `1px solid ${C.line}` }}>
        {groups.map((g) => {
          const state = g.idx[g.idx.length - 1] < qi ? "done" : g.idx.includes(qi) ? "now" : "next";
          const secLabel = tr(SECTION_NAMES[g.name] || g.name, lang);
          return (
            <span key={g.name} className="pr-mono" style={{ fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 999,
              background: state === "now" ? C.navy : state === "done" ? C.mint : "transparent",
              color: state === "now" ? C.white : state === "done" ? "#155C33" : C.muted,
              border: `1px solid ${state === "next" ? C.line : "transparent"}` }}>
              {state === "done" ? "✓ " : ""}{secLabel}
            </span>
          );
        })}
      </div>

      <div style={{ padding: "22px 26px 8px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <h1 style={{ fontSize: 30 * scale, lineHeight: 1.32, margin: 0, fontWeight: 800, flex: 1 }}>
          {qText}
          {q.sanskrit && <span style={{ display: "block", fontSize: 17, color: C.green, fontWeight: 700, marginTop: 4 }}>{tr(SECTION_NAMES[q.section] || q.section, lang)} · {q.sanskrit}</span>}
        </h1>
        <button onClick={() => say(qText)} aria-label={T("repeat")} className="pr-tile"
          style={{ width: 64, height: 64, borderRadius: 16, background: C.bg, border: `2px solid ${C.line}`, display: "grid", placeItems: "center", flex: "0 0 64px" }}>
          <Volume2 size={28} color={C.teal} strokeWidth={2.2} />
        </button>
      </div>

      {iconOnly && (
        <div className="pr-in" style={{ margin: "0 26px 10px", padding: "11px 15px", borderRadius: 11, background: C.peach,
          border: `1px solid #EEC9A6`, display: "flex", gap: 10, alignItems: "center", fontSize: 17 * scale, fontWeight: 700, color: "#7A3E12" }}>
          <AlertTriangle size={20} /> {T("noisy")}
          <span className="pr-mono" style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, opacity: .8 }}>
            ASR {result ? result.confidence.toFixed(2) : "—"} &lt; {ASR_GATE}
          </span>
        </div>
      )}

      <div className="pr-scroll" style={{ flex: 1, overflowY: "auto", padding: "6px 26px 16px" }}>
        <VoiceCaptionBar text={qText} onRepeat={() => say(qText)} lang={lang} scale={scale} />
        {canSpeak && <VoiceGestureGuide lang={lang} scale={scale} />}

        {canSpeak && (
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
            <button
              onPointerDown={(e) => { e.preventDefault(); setListening(true); setResult(null); }}
              onPointerUp={release} onPointerLeave={() => listening && release()}
              className="pr-tile"
              style={{ minWidth: 200, minHeight: 96, borderRadius: 18, padding: "14px 22px", flex: "1 1 220px",
                background: listening ? C.teal : C.navy, color: C.white,
                display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
              <Mic size={38} strokeWidth={2.1} style={listening ? { animation: "prPulse 1s ease-in-out infinite" } : undefined} />
              <span style={{ fontSize: 20 * scale, fontWeight: 800 }}>{listening ? T("listening") : T("holdSpeak")}</span>
            </button>
            <div style={{ flex: "2 1 260px", minHeight: 96, borderRadius: 16, border: `2px solid ${C.line}`,
              background: C.bg, padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
              {listening ? (
                <div style={{ display: "flex", alignItems: "center", gap: 3, height: 42 }}>
                  {bars.map((h, i) => <div key={i} style={{ flex: 1, height: `${h * 100}%`, background: noisy ? C.amber : C.teal, borderRadius: 2, transition: "height .08s linear" }} />)}
                </div>
              ) : busy ? (
                <span style={{ fontSize: 17, color: C.muted }}>Transcribing…</span>
              ) : result ? (
                <>
                  <div style={{ fontSize: 19 * scale, fontWeight: 700, lineHeight: 1.4 }}>“{result.text}”</div>
                  <div className="pr-mono" style={{ fontSize: 12, color: result.confidence < ASR_GATE ? C.saffron : C.green, fontWeight: 700 }}>
                    {asr.impl} · SIMULATED · confidence {result.confidence.toFixed(2)}
                  </div>
                </>
              ) : (
                <span style={{ fontSize: 17, color: C.muted }}>{T("orTap")}</span>
              )}
            </div>
          </div>
        )}

        {q.kind === "scale" ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))", gap: 10 }}>
              {Array.from({ length: 11 }).map((_, n) => {
                const col = n <= 3 ? C.green : n <= 6 ? C.amber : C.saffron;
                return (
                  <button key={n} className="pr-tile" onClick={() => onAnswer(q.id, n, { m: "TOUCH" })}
                    aria-label={`${n} out of 10`}
                    style={{ minHeight: 112, borderRadius: 15, border: `2.5px solid ${C.line}`, background: C.white,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Face level={n} size={50} color={col} />
                    <span className="pr-mono" style={{ fontSize: 17, fontWeight: 800, color: col }}>{n}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: C.muted, marginTop: 8 }}>
              <span>{tr(L("No pain", "दर्द नहीं", "वेदना नाही", "வலி இல்லை"), lang)}</span>
              <span>{tr(L("Worst pain", "सबसे तेज़ दर्द", "सर्वात तीव्र वेदना", "மிகக் கடுமையான வலி"), lang)}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(126px, 1fr))", gap: 12 }}>
            {(q.options || []).map(tile)}
          </div>
        )}

        {q.kind === "multi" && (
          <div style={{ marginTop: 18 }}>
            <Btn size="lg" tone="navy" icon={ChevronRight} disabled={!sel.length}
              onClick={() => onAnswer(q.id, sel, { m: "TOUCH" })}>{T("next")}</Btn>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, padding: "12px 20px", borderTop: `1px solid ${C.line}`, background: C.bg, flexWrap: "wrap", alignItems: "center" }}>
        <Btn ghost tone="grey" icon={ArrowLeft} onClick={onBack} style={{ minHeight: 56 }}>{T("back")}</Btn>
        <Btn ghost tone="grey" icon={RefreshCw} onClick={() => say(qText)} style={{ minHeight: 56 }}>{T("repeat")}</Btn>
        <Btn ghost tone="grey" icon={Globe} onClick={onLang} style={{ minHeight: 56 }}>{T("changeLang")}</Btn>
        <div style={{ flex: 1 }} />
        <Btn tone="saffron" ghost={!helpFlag} icon={HelpCircle} onClick={onHelp} style={{ minHeight: 56 }}>
          {helpFlag ? T("helpCalled") : T("getHelp")}
        </Btn>
      </div>
    </div>
  );
}

/* --------------------------------------------------- A7 red-flag interrupt */
function FlagScreen({ flag, lang, T, scale, onStaffContinue }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 26, padding: 40, textAlign: "center", background: C.peach, animation: "prFlagIn .4s ease both" }}>
      <div style={{ width: 118, height: 118, borderRadius: "50%", background: C.saffron, display: "grid", placeItems: "center" }}>
        <Users size={58} color={C.white} strokeWidth={1.9} />
      </div>
      <h1 style={{ fontSize: 34 * scale, margin: 0, fontWeight: 800, lineHeight: 1.35, maxWidth: 560, color: "#6B2F10" }}>
        {T("staffComing")}
      </h1>
      <p style={{ fontSize: 22 * scale, margin: 0, color: "#7A4620" }}>{T("sitTight")}</p>
      <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px dashed #D9A57F`, maxWidth: 520 }}>
        <div style={{ fontSize: 12.5, color: "#8A5836", marginBottom: 10 }}>
          The rule that fired, the answer that triggered it and the timestamp go to the triage board.
          None of it is shown on this screen, and no severity score is shown to the patient.
        </div>
        <Btn size="sm" ghost tone="grey" onClick={onStaffContinue}>Staff use · continue intake</Btn>
      </div>
    </div>
  );
}

/* ----------------------------------------------------- A8 document capture */
function DocsScreen({ lang, scale, documents, onAdd, onDone, T, say }) {
  const [scanning, setScanning] = useState(null);
  const docsVoice = tr(L(
    "Do you have any old papers with you? Prescriptions, lab reports, discharge papers. Place one on the tray.",
    "क्या आपके पास पुराने कागज़ हैं? पर्चे, जाँच रिपोर्ट, डिस्चार्ज कागज़। एक-एक करके ट्रे पर रखें।",
    "तुमच्याकडे जुने कागद आहेत का? चिठ्ठ्या, अहवाल, डिस्चार्ज कागद. एक-एक ट्रेवर ठेवा.",
    "உங்களிடம் பழைய ஆவணங்கள் உள்ளதா? மருந்துச்சீட்டு, அறிக்கை, டிஸ்சார்ஜ் ஆவணம். ஒவ்வொன்றாக வைக்கவும்."
  ), lang);

  useEffect(() => {
    if (say) say(docsVoice);
    /* eslint-disable-next-line */
  }, [lang]);

  const sources = [
    { kind: "prescription", file: "prescription.png", label: L("Printed prescription", "छपा हुआ पर्चा", "छापील चिठ्ठी", "அச்சிடப்பட்ட மருந்துச்சீட்டு") },
    { kind: "lab", file: "lab-report.png", label: L("Lab report", "जाँच रिपोर्ट", "तपासणी अहवाल", "ஆய்வக அறிக்கை") },
    { kind: "scrawl", file: "handwritten.png", label: L("Handwritten note", "हाथ से लिखा पर्चा", "हाताने लिहिलेली चिठ्ठी", "கையால் எழுதியது") },
  ];
  const capture = (s) => {
    setScanning(s.kind);
    setTimeout(() => { onAdd(s.kind, s.file); setScanning(null); }, 1050);
  };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "22px 26px 10px" }}>
        <h1 style={{ fontSize: 29 * scale, margin: 0, fontWeight: 800 }}>
          {tr(L("Do you have any old papers with you?", "क्या आपके पास पुराने कागज़ हैं?", "तुमच्याकडे जुने कागद आहेत का?", "உங்களிடம் பழைய ஆவணங்கள் உள்ளதா?"), lang)}
        </h1>
        <p style={{ fontSize: 18 * scale, color: C.muted, margin: "8px 0 0" }}>
          {tr(L("Prescriptions, lab reports, discharge papers. Place one on the tray.", "पर्चे, जाँच रिपोर्ट, डिस्चार्ज कागज़। एक-एक करके रखें।", "चिठ्ठ्या, अहवाल, डिस्चार्ज कागद. एक-एक ठेवा.", "மருந்துச்சீட்டு, அறிக்கை, டிஸ்சார்ஜ் ஆवணம். ஒவ்வொன்றாக வைக்கவும்."), lang)}
        </p>
      </div>
      <div className="pr-scroll" style={{ flex: 1, overflowY: "auto", padding: "6px 26px 14px" }}>
        <VoiceCaptionBar text={docsVoice} onRepeat={() => say && say(docsVoice)} lang={lang} scale={scale} />
        <DocScanGestureGuide lang={lang} scale={scale} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          {sources.map((s) => {
            const Art = DOC_ART[s.kind];
            const on = scanning === s.kind;
            return (
              <button key={s.kind} className="pr-tile" onClick={() => capture(s)} disabled={!!scanning}
                style={{ borderRadius: 15, border: `2px solid ${on ? C.teal : C.line}`, background: C.white, padding: 10, position: "relative", overflow: "hidden" }}>
                <div style={{ height: 132, overflow: "hidden", borderRadius: 8, position: "relative" }}>
                  <Art />
                  {on && <div style={{ position: "absolute", left: 0, right: 0, top: "45%", height: 3, background: C.teal, boxShadow: `0 0 16px ${C.teal}` }} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "center", marginTop: 9, fontSize: 15.5 * scale, fontWeight: 700 }}>
                  <Camera size={17} color={C.teal} />{on ? "Scanning…" : tr(s.label, lang)}
                </div>
              </button>
            );
          })}
        </div>

        {documents.length > 0 && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {documents.map((d) => <DocResult key={d.id} d={d} scale={scale} />)}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, padding: "12px 22px", borderTop: `1px solid ${C.line}`, background: C.bg, flexWrap: "wrap" }}>
        <Btn size="lg" tone="navy" icon={ChevronRight} onClick={onDone} style={{ minHeight: 60 }}>
          {documents.length ? T("next") : tr(L("I have no papers", "मेरे पास कागज़ नहीं हैं", "माझ्याकडे कागद नाहीत", "என்னிடம் ஆவணம் இல்லை"), lang)}
        </Btn>
        <div style={{ flex: 1 }} />
        <Badge tone="amber" mono>MockOCR · gate {CONFIDENCE_GATE}</Badge>
      </div>
    </div>
  );
}

function DocResult({ d, scale = 1 }) {
  const Art = DOC_ART[d.kind];
  return (
    <div className="pr-in" style={{ display: "flex", gap: 14, border: `2px solid ${d.isRawOnly ? C.saffron : C.line}`,
      borderRadius: 14, padding: 12, background: d.isRawOnly ? "#FFF6EF" : C.white }}>
      <div style={{ width: 84, flex: "0 0 84px", height: 112, overflow: "hidden", borderRadius: 7, border: `1px solid ${C.line}` }}><Art /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <b style={{ fontSize: 17 * scale }}>{d.title}</b>
          <Badge mono tone={d.isRawOnly ? "saffron" : "green"}>page conf {d.pageConfidence.toFixed(2)}</Badge>
          {d.date && <Badge mono tone="grey">{d.date}</Badge>}
        </div>
        {d.isRawOnly ? (
          <div style={{ marginTop: 8, fontSize: 15.5 * scale, color: "#8E3E14", fontWeight: 600, lineHeight: 1.5 }}>
            Could not read this reliably, so nothing was written into your record.
            The page is attached as an image for the doctor to read.
            <div className="pr-mono" style={{ fontSize: 12, marginTop: 6, opacity: .85 }}>
              {d.rejected} candidate field(s) discarded · below {CONFIDENCE_GATE} gate
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 9 }}>
            {d.extractions.map((e) => {
              const flag = e.type === "LAB" ? labFlag(e.value) : null;
              const text = e.type === "MEDICATION" ? `${e.value.name} ${e.value.dose || ""}`
                : e.type === "LAB" ? `${e.value.name} ${e.value.value} ${e.value.unit}`
                : e.type === "DATE" ? `${e.value.label}: ${e.value.date}` : e.value.text;
              return (
                <span key={e.id} className="pr-mono" style={{ fontSize: 12.5, fontWeight: 700, padding: "5px 10px", borderRadius: 8,
                  background: flag ? "#FBE2D4" : C.bg, border: `1px solid ${flag ? "#F0C2A6" : C.line}`, color: flag ? "#8E3E14" : C.ink }}>
                  {text}{flag ? ` · ${flag}` : ""} <span style={{ opacity: .55 }}>{e.confidence.toFixed(2)}</span>
                </span>
              );
            })}
            {d.rejected > 0 && <span className="pr-mono" style={{ fontSize: 12, color: C.saffron, fontWeight: 700, alignSelf: "center" }}>
              {d.rejected} field(s) below gate — not written
            </span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- A9 patient review */
function ReviewScreen({ lang, scale, answers, documents, onDone, onReject, say, T }) {
  const items = Object.values(answers).filter((a) => a.labels.length || a.kind === "scale");
  const line = (a) => {
    const q = [...ALLOPATHY, ...AYUSH].find((x) => x.id === a.questionId);
    const val = a.kind === "scale" ? `${a.value} / 10` : a.labels.map((l) => tr(l, lang)).join(", ");
    return `${tr(q?.text, lang)} — ${val}`;
  };
  const readAll = () => say(items.map(line).join(". "));
  useEffect(() => { readAll(); /* eslint-disable-next-line */ }, []);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "22px 26px 8px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <h1 style={{ fontSize: 29 * scale, margin: 0, fontWeight: 800, flex: 1 }}>
          {tr(L("Is this right?", "क्या यह सही है?", "हे बरोबर आहे का?", "இது சரியா?"), lang)}
        </h1>
        <Btn ghost tone="teal" icon={Volume2} onClick={readAll}>{T("repeat")}</Btn>
      </div>
      <div className="pr-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 26px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
        {items.map((a) => (
          <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "center", border: `2px solid ${C.line}`, borderRadius: 13, padding: "12px 14px" }}>
            <span style={{ flex: 1, fontSize: 18 * scale, lineHeight: 1.45 }}>{line(a)}</span>
            <button className="pr-tile" aria-label="Correct" style={{ width: 58, height: 58, borderRadius: 12, background: C.mint, border: `2px solid ${C.green}`, display: "grid", placeItems: "center" }}>
              <Check size={26} color={C.green} strokeWidth={3} />
            </button>
            <button className="pr-tile" aria-label="Not right, remove" onClick={() => onReject(a.questionId)}
              style={{ width: 58, height: 58, borderRadius: 12, background: "#FBE2D4", border: `2px solid ${C.saffron}`, display: "grid", placeItems: "center" }}>
              <X size={26} color={C.saffron} strokeWidth={3} />
            </button>
          </div>
        ))}
        {documents.map((d) => (
          <div key={d.id} style={{ display: "flex", gap: 12, alignItems: "center", border: `2px solid ${C.line}`, borderRadius: 13, padding: "12px 14px", background: C.bg }}>
            <FileText size={22} color={C.teal} />
            <span style={{ flex: 1, fontSize: 18 * scale }}>{d.title} — {d.isRawOnly ? "kept as a picture for the doctor" : `${d.extractions.length} item(s) read`}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 22px", borderTop: `1px solid ${C.line}`, background: C.bg }}>
        <Btn size="lg" tone="navy" icon={Check} onClick={onDone} style={{ minHeight: 60 }}>
          {tr(L("Yes, this is right", "हाँ, यह सही है", "होय, हे बरोबर आहे", "ஆம், இது சரி"), lang)}
        </Btn>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- A10 done */
function DoneScreen({ patient, lang, scale, T, onWipe, onReset, wiped }) {
  const [countdown, setCountdown] = useState(10);
  useEffect(() => { const t = setTimeout(onWipe, 1400); return () => clearTimeout(t); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (!wiped) return;
    const t = setInterval(() => setCountdown((c) => (c <= 1 ? (onReset(), 0) : c - 1)), 1000);
    return () => clearInterval(t);
  }, [wiped, onReset]);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 36, textAlign: "center" }}>
      <div style={{ width: 96, height: 96, borderRadius: "50%", background: C.mint, display: "grid", placeItems: "center" }}>
        <Check size={50} color={C.green} strokeWidth={2.6} />
      </div>
      <h1 style={{ fontSize: 30 * scale, margin: 0, fontWeight: 800 }}>
        {tr(L("Your doctor already has your history.", "डॉक्टर के पास आपकी जानकारी पहुँच चुकी है।", "डॉक्टरांकडे तुमची माहिती पोहोचली आहे.", "மருத்துவரிடம் உங்கள் தகவல் சென்றுவிட்டது."), lang)}
      </h1>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {[[tr(L("Token", "टोकन", "टोकन", "டோக்கன்"), lang), patient?.token || "—"],
          [tr(L("Queue", "कतार", "रांग", "வரிசை"), lang), "3rd"],
          [tr(L("About", "करीब", "सुमारे", "சுமார்"), lang), "12 min"]].map(([k, v]) => (
          <div key={k} style={{ minWidth: 132, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 20px" }}>
            <div style={{ fontSize: 14, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>{k}</div>
            <div className="pr-mono" style={{ fontSize: 30, fontWeight: 800, color: C.navy }}>{v}</div>
          </div>
        ))}
      </div>
      {wiped ? (
        <div className="pr-in" style={{ display: "flex", alignItems: "center", gap: 10, background: C.mint, border: `2px solid ${C.green}`,
          borderRadius: 13, padding: "14px 20px", fontSize: 19 * scale, fontWeight: 800, color: "#155C33" }}>
          <Trash2 size={22} /> {T("sessionClr")}
          <span className="pr-mono" style={{ fontSize: 13, fontWeight: 700, opacity: .8 }}>· back to idle in {countdown}s</span>
        </div>
      ) : (
        <div style={{ fontSize: 16, color: C.muted, display: "flex", alignItems: "center", gap: 8 }}>
          <Timer size={17} /> Clearing audio, transcripts and images from this kiosk…
        </div>
      )}
      <div style={{ fontSize: 13.5, color: C.muted, maxWidth: 420, lineHeight: 1.6 }}>
        Nothing stays on the kiosk. The record lives on the hospital server against your token.
      </div>
    </div>
  );
}

/* ============================================================================
   B. DOCTOR DASHBOARD
   ========================================================================== */

const completeness = (session, patient) => {
  const tree = treeFor(session.mode);
  const expected = tree.filter((q) => !q.when || q.when(session.answers, patient)).length;
  return Math.min(100, Math.round((Object.keys(session.answers).length / Math.max(expected, 1)) * 100));
};
const oneLiner = (session, lang = "en") => {
  const s = session.answers["cc.symptom"], site = session.answers["cc.site"], d = session.answers["duration"];
  return [s && answerText(s, lang), site && answerText(site, lang), d && answerText(d, lang)].filter(Boolean).join(" · ") || "Intake in progress";
};

function QueueView() {
  const { db, setOpenPatient, live } = useStore();
  const [dept, setDept] = useState("ALL");
  const [mode, setMode] = useState("ALL");
  const [search, setSearch] = useState("");

  const rows = db.sessions.map((s) => {
    const p = db.patients.find((x) => x.id === s.patientId);
    const flags = db.flags.filter((f) => f.sessionId === s.id);
    return { s, p, flags };
  }).filter((r) => r.p)
    .filter((r) => dept === "ALL" || r.p.dept === dept)
    .filter((r) => mode === "ALL" || r.s.mode === mode)
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const complaint = oneLiner(r.s).toLowerCase();
      return (
        r.p.name.toLowerCase().includes(q) ||
        r.p.token.toLowerCase().includes(q) ||
        (r.p.phoneMasked && r.p.phoneMasked.includes(q)) ||
        complaint.includes(q)
      );
    })
    .sort((a, b) => (b.flags.length ? 1 : 0) - (a.flags.length ? 1 : 0) || new Date(a.s.startedAt) - new Date(b.s.startedAt));

  const redFlagsCount = db.flags.filter(f => !f.acknowledgedAt).length;
  const liveCount = db.sessions.filter(s => live?.sessionId === s.id).length;

  const Pill = ({ on, children, ...p }) => (
    <button {...p} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease",
      border: `1px solid ${on ? C.navy : C.line}`, background: on ? C.navy : C.white, color: on ? C.white : C.muted }}>{children}</button>
  );

  return (
    <div style={{ padding: "24px 28px 40px", maxWidth: 1380, margin: "0 auto" }}>
      {/* Header & Metric Summary Cards */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.navy, letterSpacing: "-.01em" }}>OPD Patient Queue</h1>
            <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 14 }}>
              Real-time patient intake dashboard · Triage red-flags automatically prioritized
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 18px", minWidth: 120, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: C.bg, display: "grid", placeItems: "center" }}>
                <Users size={18} color={C.navy} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>In Queue</div>
                <div className="pr-mono" style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>{rows.length}</div>
              </div>
            </div>
            {redFlagsCount > 0 && (
              <div style={{ background: "#FFF6EF", border: `1px solid #F8D7C4`, borderRadius: 12, padding: "10px 18px", minWidth: 130, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#FBE2D4", display: "grid", placeItems: "center" }}>
                  <ShieldAlert size={18} color={C.saffron} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.saffron, textTransform: "uppercase" }}>Red Flags</div>
                  <div className="pr-mono" style={{ fontSize: 20, fontWeight: 800, color: C.saffron }}>{redFlagsCount} Action</div>
                </div>
              </div>
            )}
            <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 18px", minWidth: 120, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#E5F7F8", display: "grid", placeItems: "center" }}>
                <Activity size={18} color={C.teal} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>At Kiosk</div>
                <div className="pr-mono" style={{ fontSize: 20, fontWeight: 800, color: C.teal }}>{liveCount} Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar & Filter Controls */}
        <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 16px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 280px", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 14px" }}>
            <Search size={17} color={C.muted} />
            <input
              type="text"
              placeholder="Search patient name, token #, phone, or symptom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: 14, fontFamily: FONT_UI, color: C.ink }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ border: "none", background: "transparent", cursor: "pointer", color: C.muted, display: "grid", placeItems: "center" }}>
                <X size={15} />
              </button>
            )}
          </div>
          <div style={{ height: 24, width: 1, background: C.line }} />
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginRight: 4 }}>Department:</span>
            {["ALL", "General Medicine", "AYUSH"].map((d) => (
              <Pill key={d} on={dept === d} onClick={() => setDept(d)}>
                {d === "ALL" ? "All Depts" : d}
              </Pill>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginRight: 4 }}>Mode:</span>
            {["ALL", "ALLOPATHY", "AYUSH"].map((m) => (
              <Pill key={m} on={mode === m} onClick={() => setMode(m)}>
                {m === "ALL" ? "All Modes" : m}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Queue Cards */}
      <div style={{ display: "grid", gap: 12 }}>
        {rows.length === 0 && (
          <Card pad={36}>
            <Empty title="No patients match this filter" hint="Clear search terms or filters, or seed patients from Demo control." />
          </Card>
        )}
        {rows.map(({ s, p, flags }) => {
          const isLive = live?.sessionId === s.id;
          const flagged = flags.length > 0;
          const unack = flags.some((f) => !f.acknowledgedAt);
          const comp = completeness(s, p);
          const elapsed = Math.max(0, Math.round((Date.now() - new Date(s.startedAt)) / 60000));
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              className="pr-row pr-tile"
              onClick={() => setOpenPatient(p.id)}
              onKeyDown={(e) => e.key === "Enter" && setOpenPatient(p.id)}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1.5fr 1fr 140px 90px 140px 32px",
                gap: 16,
                alignItems: "center",
                background: C.white,
                cursor: "pointer",
                border: `1px solid ${flagged ? (unack ? "#F5B895" : C.line) : C.line}`,
                boxShadow: flagged && unack ? "0 2px 8px rgba(192,86,28,0.08)" : "none",
                borderRadius: 14,
                padding: "16px 20px",
                transition: "all 0.15s ease",
              }}
            >
              {/* Token Chip */}
              <div
                className="pr-mono"
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.navy,
                  background: C.bg,
                  borderRadius: 10,
                  padding: "8px 12px",
                  textAlign: "center",
                  border: `1px solid ${C.line}`,
                }}
              >
                {p.token}
              </div>

              {/* Patient Info */}
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, display: "flex", gap: 8, alignItems: "center" }}>
                  {p.name}
                  <span style={{ color: C.muted, fontWeight: 600, fontSize: 13.5 }}>({p.age} {p.sex})</span>
                  {isLive && <Badge tone="teal" mono>AT KIOSK NOW</Badge>}
                </div>
                <div style={{ fontSize: 13.5, color: C.ink, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 600, color: C.navy }}>Complaint:</span>
                  <span style={{ color: C.muted }}>{oneLiner(s)}</span>
                </div>
              </div>

              {/* Badges: Mode & Language */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <Badge tone={s.mode === "AYUSH" ? "green" : "navy"}>{s.mode}</Badge>
                <Badge tone="grey" mono>{LANGS.find((l) => l.code === p.lang)?.en}</Badge>
                {p.dept && <Badge tone="teal" mono>{p.dept}</Badge>}
              </div>

              {/* Intake Progress Bar */}
              <div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".06em", marginBottom: 4 }}>INTAKE COMPLETED</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 8, background: C.bg, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${comp}%`, height: "100%", background: comp === 100 ? C.green : C.teal, borderRadius: 999 }} />
                  </div>
                  <span className="pr-mono" style={{ fontSize: 12.5, fontWeight: 700, color: C.navy }}>{comp}%</span>
                </div>
              </div>

              {/* Wait Time */}
              <div className="pr-mono" style={{ fontSize: 13, color: C.muted, textAlign: "center" }}>
                <Clock size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                {elapsed}m wait
              </div>

              {/* Alert Badge */}
              <div style={{ textAlign: "right" }}>
                {flagged ? (
                  <Badge tone="saffron" size="lg">
                    <ShieldAlert size={14} /> {flags[0].code}
                  </Badge>
                ) : (
                  <Badge tone="green" mono><Check size={12} /> READY</Badge>
                )}
              </div>

              {/* Chevron */}
              <ChevronRight size={18} color={C.muted} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- B2 patient view */
function PatientView() {
  const { db, openPatient, setOpenPatient, verifyField, settings, acknowledge } = useStore();
  const p = db.patients.find((x) => x.id === openPatient);
  const s = db.sessions.find((x) => x.patientId === openPatient);
  const flags = db.flags.filter((f) => f.sessionId === s?.id);
  const [showFhir, setShowFhir] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draftVal, setDraftVal] = useState("");
  const [prov, setProv] = useState(null);
  const [activeTab, setActiveTab] = useState("summary"); // "summary" | "docs" | "transcripts"

  if (!p || !s) return <div style={{ padding: 30 }}><Empty title="Patient not found" /></div>;
  const saved = Math.max(0, settings.baseline - s.intakeSeconds);
  const verdict = (path) => s.verifications.find((v) => v.path === path);

  const allFields = s.summary.flatMap((sec) => sec.fields);
  const totalVerified = allFields.filter((f) => verdict(f.path)?.action === "ACCEPT" || verdict(f.path)?.action === "EDIT").length;

  const FieldRow = ({ f }) => {
    const v = verdict(f.path);
    const isEditing = editing === f.path;

    return (
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 10,
          background: isEditing ? "#F0F8FF" : C.white,
          border: `1px solid ${isEditing ? C.teal : C.line}`,
          marginBottom: 8,
          transition: "all 0.15s ease",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".04em", color: C.muted, textTransform: "uppercase" }}>
                {f.label}
              </span>
              {f.flag && <Badge tone="saffron" mono size="sm">{f.flag}</Badge>}
              {v ? (
                <Badge tone={v.action === "ACCEPT" ? "green" : v.action === "EDIT" ? "teal" : "grey"} mono>
                  {v.action === "ACCEPT" ? "VERIFIED" : v.action === "EDIT" ? "EDITED" : "REJECTED"}
                </Badge>
              ) : (
                <Badge tone="amber" mono title="Generated by intake pipeline. Needs clinician review.">DRAFT</Badge>
              )}
            </div>

            {isEditing ? (
              <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                <input
                  value={draftVal}
                  onChange={(e) => setDraftVal(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    fontSize: 14.5,
                    padding: "6px 10px",
                    border: `1.5px solid ${C.teal}`,
                    borderRadius: 7,
                    fontFamily: FONT_UI,
                    fontWeight: 600,
                  }}
                />
                <Btn size="sm" tone="teal" icon={Check} onClick={() => { verifyField(s.id, f.path, "EDIT", f.value, draftVal); setEditing(null); }}>Save</Btn>
                <Btn size="sm" ghost tone="grey" onClick={() => setEditing(null)}>Cancel</Btn>
              </div>
            ) : (
              <div>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: C.ink,
                    textDecoration: v?.action === "REJECT" ? "line-through" : "none",
                    opacity: v?.action === "REJECT" ? 0.45 : 1,
                  }}
                >
                  {v?.action === "EDIT" ? v.valueAfter : f.value}
                </span>
                {f.valueNative && v?.action !== "EDIT" && (
                  <div
                    lang={f.valueLang}
                    style={{ fontSize: 13, fontWeight: 500, color: C.teal, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}
                    title={`Patient response in ${LANGS.find((x) => x.code === f.valueLang)?.en || f.valueLang}`}
                  >
                    <span style={{ fontSize: 11, opacity: 0.7 }}>Patient said:</span> “{f.valueNative}”
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          {!isEditing && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                onClick={() => setProv(f)}
                title="View Source Provenance"
                className="pr-mono"
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: C.teal,
                  display: "inline-flex",
                  gap: 4,
                  alignItems: "center",
                  padding: "5px 9px",
                  borderRadius: 6,
                  background: C.bg,
                  border: `1px solid ${C.line}`,
                  cursor: "pointer",
                }}
              >
                <Eye size={13} /> Source
              </button>
              <div style={{ width: 1, height: 18, background: C.line, margin: "0 2px" }} />
              <button
                onClick={() => verifyField(s.id, f.path, "ACCEPT", f.value, f.value)}
                title="Accept / Verify field"
                style={{
                  padding: "5px 9px",
                  borderRadius: 6,
                  border: `1px solid ${v?.action === "ACCEPT" ? C.green : C.line}`,
                  background: v?.action === "ACCEPT" ? C.mint : C.white,
                  color: C.green,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Check size={14} /> Accept
              </button>
              <button
                onClick={() => { setEditing(f.path); setDraftVal(v?.valueAfter || f.value); }}
                title="Edit field value"
                style={{
                  padding: "5px 9px",
                  borderRadius: 6,
                  border: `1px solid ${v?.action === "EDIT" ? C.teal : C.line}`,
                  background: v?.action === "EDIT" ? "#E5F7F8" : C.white,
                  color: C.navy,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Edit
              </button>
              <button
                onClick={() => verifyField(s.id, f.path, "REJECT", f.value, "")}
                title="Reject field"
                style={{
                  padding: "5px 9px",
                  borderRadius: 6,
                  border: `1px solid ${v?.action === "REJECT" ? C.saffron : C.line}`,
                  background: v?.action === "REJECT" ? "#FBE2D4" : C.white,
                  color: C.saffron,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <X size={14} /> Reject
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px 24px 40px", maxWidth: 1440, margin: "0 auto" }}>
      {/* Top Patient Banner Header */}
      <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 16, padding: "18px 22px", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <Btn ghost tone="grey" size="sm" icon={ArrowLeft} onClick={() => setOpenPatient(null)}>Queue</Btn>
            <div style={{ width: 1, height: 28, background: C.line }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {p.name}
                <span style={{ color: C.muted, fontSize: 14, fontWeight: 600 }}>({p.age} {p.sex})</span>
                <Badge tone={s.mode === "AYUSH" ? "green" : "navy"}>{s.mode}</Badge>
                <Badge tone="grey" mono>{LANGS.find((l) => l.code === p.lang)?.en}</Badge>
              </div>
              <div className="pr-mono" style={{ fontSize: 12.5, color: C.muted, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span>Token: <strong style={{ color: C.navy }}>{p.token}</strong></span>
                <span>ABHA: <strong>{p.abha || "Not linked"}</strong></span>
                <span>Phone: <strong>{p.phoneMasked}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ background: C.mint, border: `1px solid #B4DDBB`, borderRadius: 10, padding: "6px 12px", textAlign: "right" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", color: "#155C33", textTransform: "uppercase" }}>Time Saved</div>
              <div className="pr-mono" style={{ fontSize: 16, fontWeight: 800, color: "#155C33" }}>{mmss(saved)}</div>
            </div>
            <Btn size="sm" tone="green" icon={Check} onClick={() => allFields.forEach((f) => verifyField(s.id, f.path, "ACCEPT", f.value, f.value))}>Verify all</Btn>
            <Btn size="sm" tone="navy" icon={Download} onClick={() => setShowFhir(true)}>Export FHIR R4</Btn>
          </div>
        </div>
      </div>

      {/* Safety Red Flags Alert Banner */}
      {flags.length > 0 && (
        <div style={{ background: "#FFF6EF", border: `1.5px solid ${C.saffron}`, borderRadius: 14, padding: "16px 20px", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <ShieldAlert size={20} color={C.saffron} />
              <span style={{ fontSize: 16, fontWeight: 800, color: C.saffron }}>Triage Red-Flag Alert Active</span>
            </div>
            <Badge tone="saffron" size="lg" mono>{flags.length} Rule(s) Triggered</Badge>
          </div>
          {flags.map((f) => (
            <div key={f.id} style={{ borderTop: `1px dashed #F8D7C4`, paddingTop: 10, marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <Badge tone="saffron" mono>{f.code}</Badge> <strong style={{ fontSize: 14, color: C.ink }}>{f.label}</strong>
                </div>
                {!f.acknowledgedAt && (
                  <Btn size="sm" tone="saffron" onClick={() => acknowledge(f.id, "dr.demo")}>Acknowledge Alert</Btn>
                )}
                {f.acknowledgedAt && (
                  <Badge tone="grey" mono>Acknowledged by {f.acknowledgedBy} at {clock(f.acknowledgedAt)}</Badge>
                )}
              </div>
              <div style={{ fontSize: 13, color: "#7A4620", marginTop: 4 }}>{f.rationale}</div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Review Tabs Navigation */}
      <div style={{ borderBottom: `1px solid ${C.line}`, marginBottom: 20, display: "flex", gap: 8 }}>
        {[
          { id: "summary", label: "Structured Clinical Summary", icon: Stethoscope, badge: `${totalVerified}/${allFields.length}` },
          { id: "docs", label: "Document Timeline & OCR", icon: FileText, badge: `${s.documents.length}` },
          { id: "transcripts", label: "Voice Transcripts & Evidence", icon: Mic, badge: `${s.transcriptLog.length}` },
        ].map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                border: "none",
                borderBottom: `3px solid ${active ? C.navy : "transparent"}`,
                background: "transparent",
                color: active ? C.navy : C.muted,
                fontWeight: active ? 800 : 600,
                fontSize: 14.5,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <t.icon size={16} color={active ? C.navy : C.muted} />
              {t.label}
              <Badge tone={active ? "navy" : "grey"} mono>{t.badge}</Badge>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Clinical Summary */}
      {activeTab === "summary" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
          {/* Main Clinical Summary Cards */}
          <div>
            <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 16, padding: "20px 22px" }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
                Extracted directly from patient answers and document scans. Verify rows or make edits as needed.
              </div>
              {s.summary.map((sec) => (
                <div key={sec.key} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, textTransform: "uppercase", letterSpacing: ".06em", paddingBottom: 8, marginBottom: 10, borderBottom: `2px solid ${C.navy}` }}>
                    {sec.label}
                  </div>
                  {sec.fields.map((f) => (
                    <FieldRow key={f.path + f.label} f={f} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right Clinical Insights Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card pad={16}>
              <SectionTitle>Review Progress</SectionTitle>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  <span>Verified Fields</span>
                  <span className="pr-mono">{totalVerified} / {allFields.length}</span>
                </div>
                <div style={{ height: 8, background: C.bg, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((totalVerified / Math.max(1, allFields.length)) * 100)}%`, height: "100%", background: C.green }} />
                </div>
              </div>
            </Card>

            <Card pad={16}>
              <SectionTitle>Session Info</SectionTitle>
              <div style={{ fontSize: 12.5, color: C.ink, display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                <div><strong>Intake Mode:</strong> {s.mode}</div>
                <div><strong>Language:</strong> {LANGS.find((l) => l.code === p.lang)?.en}</div>
                <div><strong>Duration:</strong> {Math.round(s.intakeSeconds / 60)} minutes</div>
                <div><strong>Started:</strong> {clock(s.startedAt)}</div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Document Timeline */}
      {activeTab === "docs" && (
        <Card pad={20}>
          <SectionTitle>Document Timeline & OCR Extractions</SectionTitle>
          {s.documents.length === 0 ? (
            <Empty icon={FileText} title="No documents attached" hint="This patient did not upload old prescriptions or lab reports at the kiosk." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 14 }}>
              {[...s.documents].sort((a, b) => new Date(b.date || b.uploadedAt) - new Date(a.date || a.uploadedAt)).map((d) => (
                <div key={d.id} style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 4, background: d.isRawOnly ? C.saffron : C.teal, borderRadius: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div className="pr-mono" style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 4 }}>
                      {d.date || "Date unread"}
                    </div>
                    <DocResult d={d} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Voice Transcripts & Evidence */}
      {activeTab === "transcripts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card pad={20}>
            <SectionTitle right={<Badge tone="amber" mono>MT SIMULATED</Badge>}>
              Speech Transcripts (Native vs English Gloss)
            </SectionTitle>
            {s.transcriptLog.length === 0 ? (
              <Empty icon={Mic} title="No voice utterances recorded" hint="All questions were answered via touch icon selection." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                {s.transcriptLog.map((t, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: "12px 14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.line}` }}>
                    <div>
                      <div className="pr-mono" style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>
                        {LANGS.find((l) => l.code === t.lang)?.en} Voice Transcript · {clock(t.at)}
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: C.navy }}>“{t.text}”</div>
                    </div>
                    <div>
                      <div className="pr-mono" style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>
                        English Gloss
                      </div>
                      <div style={{ fontSize: 14, color: C.ink }}>
                        {s.answers[t.qid] ? answerText(s.answers[t.qid], "en") : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card pad={20}>
            <SectionTitle>Consent Artifact & Security</SectionTitle>
            {s.consent ? (
              <div className="pr-mono" style={{ fontSize: 12.5, lineHeight: 1.8, color: C.ink, background: C.bg, padding: 14, borderRadius: 10, border: `1px solid ${C.line}` }}>
                <div><strong>Granted At:</strong> {clock(s.consent.grantedAt)}</div>
                <div><strong>Language:</strong> {s.consent.language}</div>
                <div><strong>Scopes:</strong> [{s.consent.scopes.join(", ")}]</div>
                <div><strong>Artifact Hash:</strong> {s.consent.artifact}</div>
              </div>
            ) : (
              <Empty icon={Ban} title="Consent refused" hint="Session ran strictly locally without cloud backup." />
            )}
          </Card>
        </div>
      )}

      {prov && <ProvenanceModal f={prov} onClose={() => setProv(null)} session={s} />}
      {showFhir && <FhirModal session={s} patient={p} onClose={() => setShowFhir(false)} />}
    </div>
  );
}

function Modal({ title, sub, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(14,39,66,.55)", display: "grid",
      placeItems: "center", padding: 18, zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} className="pr-in" style={{ background: C.white, borderRadius: 16, width: "100%",
        maxWidth: wide ? 860 : 620, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "15px 20px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
            {sub && <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{sub}</div>}
          </div>
          <Btn size="sm" ghost tone="grey" icon={X} onClick={onClose}>Close</Btn>
        </div>
        <div className="pr-scroll" style={{ padding: 20, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function ProvenanceModal({ f, onClose, session }) {
  const src = f.source;
  const doc = src.documentId ? session.documents.find((d) => d.id === src.documentId) : null;
  const Art = doc ? DOC_ART[doc.kind] : null;
  return (
    <Modal title={`Where “${f.value}” came from`} sub={f.label} onClose={onClose}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Badge tone="navy" mono>{src.kind}</Badge>
        <Badge tone="grey" mono>id {String(src.id)}</Badge>
        {src.method && <Badge tone="teal" mono>{src.method}</Badge>}
        {src.confidence != null && <Badge tone={src.confidence >= CONFIDENCE_GATE ? "green" : "saffron"} mono>confidence {src.confidence.toFixed(2)}</Badge>}
        <Badge tone="grey" mono>{clock(src.at)}</Badge>
      </div>
      <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderLeft: `4px solid ${C.teal}`, borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", color: C.muted, marginBottom: 6 }}>
          {src.kind === "ANSWER" ? "EXACTLY WHAT THE PATIENT SAID" : "EXACTLY WHAT OCR READ"}
        </div>
        <div style={{ fontSize: 18, lineHeight: 1.6, fontWeight: 600 }} className={src.kind === "EXTRACTION" ? "pr-mono" : ""}>
          {src.quote ? `“${src.quote}”` : "Answered by tapping an icon — no utterance was recorded."}
        </div>
      </div>
      {Art && (
        <div style={{ marginTop: 14 }}>
          <SectionTitle>Original scan</SectionTitle>
          <div style={{ width: 190, border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}><Art /></div>
        </div>
      )}
      <div style={{ marginTop: 16, fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
        The exported FHIR bundle carries this same link as a <b>Provenance</b> resource, so the trail survives outside PRASHNA.
      </div>
    </Modal>
  );
}

function FhirModal({ session, patient, onClose }) {
  const bundle = useMemo(() => buildFhir(session, patient, session.summary), [session, patient]);
  const json = useMemo(() => JSON.stringify(bundle, null, 2), [bundle]);
  const counts = useMemo(() => {
    const m = {}; bundle.entry.forEach((e) => { m[e.resource.resourceType] = (m[e.resource.resourceType] || 0) + 1; }); return m;
  }, [bundle]);
  const download = () => {
    const blob = new Blob([json], { type: "application/fhir+json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `prashna-${patient.token}-bundle.json`;
    a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <Modal wide title="FHIR R4 document Bundle" sub={`${bundle.entry.length} resources · type: document`} onClose={onClose}>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
        {Object.entries(counts).map(([k, v]) => <Badge key={k} tone="navy" mono>{k} ×{v}</Badge>)}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Btn tone="navy" icon={Download} onClick={download}>Download JSON</Btn>
        <Btn ghost tone="grey" onClick={() => navigator.clipboard?.writeText(json)}>Copy</Btn>
      </div>
      <pre className="pr-mono pr-scroll" style={{ background: "#0E2233", color: "#CFE6F2", padding: 16, borderRadius: 10,
        fontSize: 11.5, lineHeight: 1.55, overflow: "auto", maxHeight: "48vh", margin: 0 }}>{json}</pre>
      <div style={{ marginTop: 12, fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
        Codes are emitted only where a real SNOMED CT or LOINC code is known; everything else uses <code>code.text</code>.
        Conditions carry <code>verificationStatus: unconfirmed</code> until a clinician verifies the field.
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------ B3 triage board */
function TriageBoard() {
  const { db, acknowledge, setOpenPatient, setView } = useStore();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const rows = [...db.flags].sort((a, b) => (a.acknowledgedAt ? 1 : 0) - (b.acknowledgedAt ? 1 : 0) || new Date(b.firedAt) - new Date(a.firedAt));
  const open = rows.filter((f) => !f.acknowledgedAt);

  return (
    <div style={{ padding: "20px 22px 34px", maxWidth: 1120, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Triage board</h1>
          <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13.5 }}>Polling every second. Meant for the second screen at the nursing station.</p>
        </div>
        <div style={{ flex: 1 }} />
        <Badge tone={open.length ? "saffron" : "green"} size="lg" mono>{open.length} OPEN · {rows.length - open.length} ACKNOWLEDGED</Badge>
      </div>
      {rows.length === 0 && <Card><Empty icon={ShieldAlert} title="No alerts" hint="Alerts appear here the moment a rule fires at any kiosk." /></Card>}
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((f) => {
          const p = db.patients.find((x) => x.id === f.patientId);
          const s = db.sessions.find((x) => x.id === f.sessionId);
          const age = Math.max(0, Math.round((Date.now() - new Date(f.firedAt)) / 1000));
          const acked = !!f.acknowledgedAt;
          return (
            <Card key={f.id} style={{ borderLeft: `7px solid ${acked ? C.line : C.saffron}`, background: acked ? C.white : "#FFF6EF", opacity: acked ? .78 : 1 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <div className="pr-mono" style={{ fontSize: 22, fontWeight: 800, color: C.navy, minWidth: 70 }}>{p?.token}</div>
                <div style={{ flex: "1 1 240px", minWidth: 200 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Badge tone="saffron" size="lg" mono>{f.code}</Badge>
                    <b style={{ fontSize: 14.5 }}>{f.label}</b>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    {p?.name} · {p?.age} {p?.sex} · {p?.dept}
                  </div>
                  <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.55 }}>
                    <b>Triggering answer:</b>{" "}
                    {f.triggeringAnswers.map((qid) => s?.answers[qid] ? `${qid} = ${answerText(s.answers[qid], "en")}` : null).filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="pr-mono" style={{ textAlign: "right", minWidth: 96 }}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>SINCE ALERT</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: acked ? C.muted : C.saffron }}>{Math.floor(age / 60)}:{String(age % 60).padStart(2, "0")}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn size="sm" ghost tone="navy" onClick={() => { setOpenPatient(p.id); setView("queue"); }}>Open patient</Btn>
                  {acked ? (
                    <Badge tone="green" mono>ACK {f.acknowledgedBy} · {clock(f.acknowledgedAt)}</Badge>
                  ) : (
                    <Btn size="sm" tone="saffron" icon={Check} onClick={() => acknowledge(f.id, "nurse.demo")}>Acknowledge</Btn>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- B4 demo control */
function AdminView() {
  const { db, settings, setSettings, resetDemo, setView, setOpenPatient } = useStore();
  return (
    <div style={{ padding: "20px 22px 40px", maxWidth: 1180, margin: "0 auto", display: "grid", gap: 14,
      gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", alignItems: "start" }}>
      <Card style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: ".03em", color: C.navy }}>PRASHNA</span>
          <span lang="sa" style={{ fontSize: 18, fontWeight: 600, color: C.teal }}>प्रश्न</span>
          <span style={{ fontSize: 14, color: C.muted }}>Ayurveda's method of diagnosis by questioning</span>
        </div>
        <div className="pr-mono" style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.7 }}>
          Team Stack Overlords · Smart India Hackathon 2026 · PS 26047 · Ministry of Ayush / AIIA
        </div>
      </Card>
      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionTitle>Provider adapters</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: C.muted, fontSize: 11, letterSpacing: ".06em" }}>
                {["PROVIDER", "REAL IMPLEMENTATION", "ACTIVATED BY", "FALLBACK CHAIN", "STATUS"].map((h) => (
                  <th key={h} style={{ padding: "7px 10px", borderBottom: `1px solid ${C.line}`, fontWeight: 800 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROVIDER_REGISTRY.map((p) => (
                <tr key={p.key}>
                  <td style={{ padding: "9px 10px", borderBottom: `1px solid ${C.line}`, fontWeight: 700 }}>{p.title}</td>
                  <td style={{ padding: "9px 10px", borderBottom: `1px solid ${C.line}`, color: C.muted }}>{p.real}</td>
                  <td className="pr-mono" style={{ padding: "9px 10px", borderBottom: `1px solid ${C.line}`, fontSize: 12 }}>{p.env}</td>
                  <td style={{ padding: "9px 10px", borderBottom: `1px solid ${C.line}`, color: C.muted }}>{p.fallback}</td>
                  <td style={{ padding: "9px 10px", borderBottom: `1px solid ${C.line}` }}>
                    <Badge tone="amber" mono title={`${p.env} is not set, so the adapter resolved to its mock.`}>SIMULATED</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 10, lineHeight: 1.6 }}>
          Setting the environment variable is the only change needed to go live — the calling code does not change.
          Nothing in this build ever contacts a real endpoint, and the badge in the header says so.
        </div>
      </Card>

      <Card>
        <SectionTitle>Demo switches</SectionTitle>
        <Toggle on={settings.noisy} onChange={(v) => setSettings((s) => ({ ...s, noisy: v }))}
          label="Simulate a noisy OPD" sub={`Forces ASR confidence below ${ASR_GATE} so the kiosk falls back to icon-only input.`} />
        <div style={{ height: 1, background: C.line }} />
        <Toggle on={settings.highContrast} onChange={(v) => setSettings((s) => ({ ...s, highContrast: v }))}
          label="High contrast kiosk" sub="Pure black on white, heavier borders." />
        <div style={{ height: 1, background: C.line }} />
        <Toggle on={settings.largePrint} onChange={(v) => setSettings((s) => ({ ...s, largePrint: v }))}
          label="Large print kiosk" sub="Scales all kiosk type by 18%." />
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 7 }}>Manual history-taking baseline</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[300, 480, 600].map((v) => (
              <Btn key={v} size="sm" ghost={settings.baseline !== v} tone="navy" onClick={() => setSettings((s) => ({ ...s, baseline: v }))}>{v / 60} min</Btn>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 7 }}>Used for the "time saved" figure. Set it to whatever your site actually measures.</div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Demo data</SectionTitle>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
          Three synthetic personas: a cardiac red flag, a document-digitisation case with one deliberately illegible page,
          and an AYUSH case with a full Dashavidha Pariksha. No real names, no real ABHA numbers, no scraped documents.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn tone="saffron" icon={RefreshCw} onClick={resetDemo}>Reset demo data</Btn>
          <Btn ghost tone="navy" icon={LayoutGrid} onClick={() => setView("kiosk")}>Go to kiosk</Btn>
          <Btn ghost tone="navy" icon={Stethoscope} onClick={() => { setOpenPatient(null); setView("queue"); }}>Go to queue</Btn>
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[["Patients", db.patients.length], ["Sessions", db.sessions.length], ["Red flags", db.flags.length],
            ["Documents", db.sessions.reduce((n, s) => n + s.documents.length, 0)]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".06em" }}>{k.toUpperCase()}</div>
              <div className="pr-mono" style={{ fontSize: 21, fontWeight: 800, color: C.navy }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionTitle right={<Badge tone="grey" mono>{db.log.length} entries</Badge>}>Provider call log</SectionTitle>
        <div className="pr-scroll pr-mono" style={{ maxHeight: 260, overflowY: "auto", fontSize: 12, lineHeight: 1.85 }}>
          {db.log.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 10, borderBottom: `1px dashed ${C.line}`, padding: "3px 0", flexWrap: "wrap" }}>
              <span style={{ color: C.muted, minWidth: 70 }}>{clock(e.at)}</span>
              <span style={{ minWidth: 76, fontWeight: 700, color: C.navy }}>{e.provider}</span>
              <Badge tone={e.mode === "LIVE" ? "green" : "amber"} mono>{e.mode}</Badge>
              <span style={{ minWidth: 120, color: C.teal }}>{e.impl}</span>
              <span style={{ flex: 1, minWidth: 180 }}>{e.detail}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionTitle right={<Badge tone="amber" mono>NEEDS NATIVE REVIEW</Badge>}>Language coverage</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: C.muted, fontSize: 11, letterSpacing: ".06em" }}>
                {["LANGUAGE", "SCRIPT", "TEXT COVERAGE", "TTS VOICE", "TRANSLATION SOURCE"].map((h) => (
                  <th key={h} style={{ padding: "7px 10px", borderBottom: `1px solid ${C.line}`, fontWeight: 800 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LANGS.map((l) => {
                const c = packCoverage(l.code);
                return (
                  <tr key={l.code}>
                    <td style={{ padding: "9px 10px", borderBottom: `1px solid ${C.line}`, fontWeight: 700 }}>{l.en}</td>
                    <td lang={l.code} style={{ padding: "9px 10px", borderBottom: `1px solid ${C.line}`, fontSize: 15 }}>{l.native}</td>
                    <td className="pr-mono" style={{ padding: "9px 10px", borderBottom: `1px solid ${C.line}`,
                      color: c >= 1 ? C.green : C.saffron, fontWeight: 700 }}>{Math.round(c * 100)}%</td>
                    <td className="pr-mono" style={{ padding: "9px 10px", borderBottom: `1px solid ${C.line}`, fontSize: 12 }}>{l.bcp}</td>
                    <td style={{ padding: "9px 10px", borderBottom: `1px solid ${C.line}`, fontSize: 12.5 }}>
                      {l.review
                        ? <span style={{ color: C.saffron, fontWeight: 700 }}>Machine-drafted — not yet reviewed by a native clinician</span>
                        : <span style={{ color: C.muted }}>Hand-written into the question trees</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 10, lineHeight: 1.7 }}>
          Coverage is counted at render time against the translation table, so this figure cannot claim more than the
          tables actually hold. Bengali, Telugu, Kannada and Gujarati were drafted for this build and must be read by a
          native-speaking clinician before any patient sees them — a mistranslated symptom question is a clinical safety
          problem, not a copy problem. Hindi, Marathi and Tamil were written into the question trees directly.
          The remaining {MORE_LANGS} scheduled languages are architected, not shipped.
        </div>
      </Card>

      <Card style={{ gridColumn: "1 / -1", background: "#FFFDF7", borderColor: "#EFD9AE" }}>
        <SectionTitle>What is simulated, plainly</SectionTitle>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.75, color: C.ink }}>
          <li>Every provider is a mock. There is no Bhashini call, no ABDM call, no LLM call, no server.</li>
          <li>ABHA numbers are generated locally and are not valid. OTP is fixed at 123456.</li>
          <li>OCR results are fixtures with hand-set confidences, chosen to exercise the {CONFIDENCE_GATE} gate in both directions.</li>
          <li>The summariser is the deterministic rule-based one. The LLM path is defined but never invoked here.</li>
          <li>There is no authentication. A real deployment needs hospital SSO and an audit log per clinician.</li>
          <li>No clinical validation has been done. The red-flag rules are drawn from standard triage teaching and would need
              prospective sensitivity and specificity testing, ethics approval and CDSCO review before any patient use.</li>
          <li>Bengali, Telugu, Kannada and Gujarati text was drafted for this build and has not been checked by a native
              speaker. Treat those four as demo-grade until reviewed.</li>
          <li>The doctor's summary is written in clinical English on purpose, with the patient's own wording shown beneath
              each field. English is what travels to FHIR and to a clinician who may not share the patient's language.</li>
          <li>This build claims no ABDM certification, no CDSCO approval and no DPDP compliance attestation.</li>
        </ul>
      </Card>
    </div>
  );
}
