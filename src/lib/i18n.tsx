"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const en = {
  "nav.home": "Home",
  "nav.track": "Track",
  "nav.about": "What's mocked?",
  "nav.dashboard": "My Dashboard",
  "nav.login": "Login / Register",
  "nav.logout": "Logout",
  "hero.badge": "A cleaner way to use licence services",
  "hero.title": "Driving licence services, minus the confusion",
  "hero.sub": "Apply, upload documents, pay, book your RTO slot and track everything — one clear journey instead of dozens of confusing pages.",
  "hero.cta.apply": "Start an application",
  "hero.cta.track": "Track existing application",
  "task.get.title": "Get a Driving Licence",
  "task.get.desc": "First-time learners-to-licence journey in 4 simple steps.",
  "task.renew.title": "Renew my Licence",
  "task.renew.desc": "Expiring or expired? Renew without the paperwork maze.",
  "task.dup.title": "Lost / Damaged Licence",
  "task.dup.desc": "Apply for a duplicate in minutes.",
  "task.track.title": "Track an Application",
  "task.track.desc": "Know exactly where things stand — no application number hunting.",
  "why.title": "Why this is easier",
  "why.1.t": "One task per screen",
  "why.1.d": "No 20-menu homepage. Pick what you want to do and follow a guided path.",
  "why.2.t": "Plain-language errors",
  "why.2.d": "\"PIN code must contain exactly 6 digits\" — never just \"Invalid input\".",
  "why.3.t": "Always know the next step",
  "why.3.d": "A live checklist shows what's done and what's pending at every stage.",
  "step.type": "Service type",
  "step.rto": "Choose RTO",
  "step.personal": "Personal details",
  "step.address": "Address",
  "step.documents": "Documents",
  "step.review": "Review & submit",
  "common.next": "Continue",
  "common.back": "Back",
  "common.submit": "Submit application",
  "common.pay": "Pay securely",
  "common.confirm": "Confirm booking",
  "common.loading": "Please wait…",
  "common.optional": "optional",
  "auth.login.title": "Welcome back",
  "auth.login.sub": "Log in to continue your application.",
  "auth.register.title": "Create your account",
  "auth.register.sub": "One account for all licence services.",
  "auth.demo.title": "Demo accounts",
  "auth.noAccount": "New here? Create an account",
  "auth.hasAccount": "Already registered? Log in",
  "status.SUBMITTED": "Submitted",
  "status.DOCS_VERIFIED": "Documents verified",
  "status.FEE_PAID": "Fee paid",
  "status.APPOINTMENT_BOOKED": "Appointment booked",
  "status.APPROVED": "Approved",
  "status.REJECTED": "Rejected",
  "status.CORRECTION_REQUIRED": "Correction requested",
  "fees.base": "Application fee",
  "fees.convenience": "Processing fee",
  "fees.total": "Total payable",
  "appt.title": "Book your RTO appointment",
  "appt.slot": "Available slots",
  "appt.none": "No slots left on this day — try another date.",
  "notif.title": "Notifications",
  "dash.applications": "My applications",
  "dash.empty.title": "No applications yet",
  "dash.empty.desc": "Start your first driving licence application — it takes about 5 minutes.",
  "dash.start": "Start new application",
  "wizard.vehicleClass": "Vehicle class",
  "wizard.vehicleClass.hint": "Choose what you want to drive — fee updates automatically",
  "wizard.digilocker.title": "Pull from DigiLocker (recommended)",
  "wizard.digilocker.desc": "Verified docs skip manual review — faster approval. Mock provider for demo.",
  "wizard.digilocker.pull": "Pull docs",
  "wizard.digilocker.pulling": "Pulling…",
  "wizard.digilocker.verified": "DigiLocker verified — 3 docs loaded",
  "wizard.offline": "You are offline — draft is auto-saved. Submit will resume when online.",
  "wizard.draftRestored": "Draft restored",
  "wizard.draftRestoredDesc": "Your previous progress was restored.",
  "wizard.clearDraft": "Clear draft",
  "common.clear": "Clear",
  "status.LL_NEW": "Learner's licence",
  "status.LL_TO_DL": "LL to DL upgrade",
  "vehicle.MCWG": "Motorcycle (gear)",
  "vehicle.LMV": "Car (LMV)",
  "vehicle.MCWG_LMV": "Bike + Car",
  "vehicle.TRANSPORT": "Transport",
};

const hi: Partial<Record<keyof typeof en, string>> = {
  "nav.home": "होम",
  "nav.track": "ट्रैक करें",
  "nav.about": "क्या-क्या डेमो है?",
  "nav.dashboard": "मेरा डैशबोर्ड",
  "nav.login": "लॉगिन / रजिस्टर",
  "nav.logout": "लॉग आउट",
  "hero.badge": "लाइसेंस सेवाओं का आसान तरीका",
  "hero.title": "ड्राइविंग लाइसेंस सेवाएँ — बिना उलझन",
  "hero.sub": "आवेदन करें, दस्तावेज़ अपलोड करें, शुल्क भरें, RTO स्लॉट बुक करें और हर स्थिति एक ही जगह देखें।",
  "hero.cta.apply": "आवेदन शुरू करें",
  "hero.cta.track": "आवेदन ट्रैक करें",
  "task.get.title": "नया ड्राइविंग लाइसेंस",
  "task.get.desc": "पहली बार लाइसेंस? 4 आसान चरणों में आवेदन करें।",
  "task.renew.title": "लाइसेंस नवीनीकरण",
  "task.renew.desc": "लाइसेंस समाप्त हो रहा है? झंझट के बिना नवीनीकरण करें।",
  "task.dup.title": "खोया / क्षतिग्रस्त लाइसेंस",
  "task.dup.desc": "कुछ ही मिनटों में डुप्लिकेट लाइसेंस का आवेदन।",
  "task.track.title": "आवेदन की स्थिति",
  "task.track.desc": "जानें आपका आवेदन ठीक कहाँ तक पहुँचा है।",
  "why.title": "यह आसान क्यों है",
  "why.1.t": "एक स्क्रीन, एक काम",
  "why.1.d": "20 मेनू नहीं — जो करना है वही चुनें और आगे बढ़ें।",
  "why.2.t": "साफ़-साफ़ गलती संदेश",
  "why.2.d": "\"पिन कोड में ठीक 6 अंक होने चाहिए\" — सिर्फ़ \"Invalid input\" नहीं।",
  "why.3.t": "अगला कदम हमेशा दिखे",
  "why.3.d": "हर चरण पर चेकलिस्ट बताती है कि क्या हुआ और क्या बाकी है।",
  "step.type": "सेवा का प्रकार",
  "step.rto": "RTO चुनें",
  "step.personal": "व्यक्तिगत विवरण",
  "step.address": "पता",
  "step.documents": "दस्तावेज़",
  "step.review": "जाँचें और जमा करें",
  "common.next": "आगे बढ़ें",
  "common.back": "पीछे",
  "common.submit": "आवेदन जमा करें",
  "common.pay": "सुरक्षित भुगतान करें",
  "common.confirm": "बुकिंग पक्की करें",
  "common.loading": "कृपया प्रतीक्षा करें…",
  "common.optional": "वैकल्पिक",
  "auth.login.title": "वापसी पर स्वागत है",
  "auth.login.sub": "आवेदन जारी रखने के लिए लॉगिन करें।",
  "auth.register.title": "अपना खाता बनाएँ",
  "auth.register.sub": "एक खाता, सभी लाइसेंस सेवाओं के लिए।",
  "auth.demo.title": "डेमो खाते",
  "auth.noAccount": "नए हैं? खाता बनाएँ",
  "auth.hasAccount": "पहले से खाता है? लॉगिन करें",
  "status.SUBMITTED": "आवेदन जमा",
  "status.DOCS_VERIFIED": "दस्तावेज़ जाँचे गए",
  "status.FEE_PAID": "शुल्क भुगतान",
  "status.APPOINTMENT_BOOKED": "appointment बुक",
  "status.APPROVED": "स्वीकृत",
  "status.REJECTED": "अस्वीकृत",
  "status.CORRECTION_REQUIRED": "सुधार का अनुरोध",
  "fees.base": "आवेदन शुल्क",
  "fees.convenience": "प्रोसेसिंग शुल्क",
  "fees.total": "कुल देय",
  "appt.title": "अपनी RTO appointment चुनें",
  "appt.slot": "उपलब्ध समय",
  "appt.none": "इस दिन कोई स्लॉट खाली नहीं — दूसरी तारीख़ देखें।",
  "notif.title": "सूचनाएँ",
  "dash.applications": "मेरे आवेदन",
  "dash.empty.title": "अभी कोई आवेदन नहीं",
  "dash.empty.desc": "पहला ड्राइविंग लाइसेंस आवेदन शुरू करें — लगभग 5 मिनट लगेंगे।",
  "dash.start": "नया आवेदन शुरू करें",
  "wizard.vehicleClass": "वाहन वर्ग",
  "wizard.vehicleClass.hint": "आप क्या चलाना चाहते हैं चुनें — शुल्क अपने-आप अपडेट होगा",
  "wizard.digilocker.title": "DigiLocker से लें (सुझाया गया)",
  "wizard.digilocker.desc": "सत्यापित दस्तावेज़ों की जाँच तेज़ होती है। डेमो के लिए मॉक सेवा।",
  "wizard.digilocker.pull": "दस्तावेज़ लाएँ",
  "wizard.digilocker.pulling": "ला रहे हैं…",
  "wizard.digilocker.verified": "DigiLocker सत्यापित — 3 दस्तावेज़ लोड हुए",
  "wizard.offline": "आप ऑफ़लाइन हैं — ड्राफ्ट सेव है, ऑनलाइन आते ही जमा होगा।",
  "wizard.draftRestored": "ड्राफ्ट वापस लाया गया",
  "wizard.draftRestoredDesc": "आपकी पिछली प्रगति वापस लाई गई।",
  "wizard.clearDraft": "ड्राफ्ट हटाएँ",
  "common.clear": "हटाएँ",
  "status.LL_NEW": "लर्नर लाइसेंस",
  "status.LL_TO_DL": "LL से DL अपग्रेड",
  "vehicle.MCWG": "मोटरसाइकिल (गियर)",
  "vehicle.LMV": "कार (LMV)",
  "vehicle.MCWG_LMV": "बाइक + कार",
  "vehicle.TRANSPORT": "ट्रांसपोर्ट",
};

const dicts = { en, hi };

type Key = keyof typeof en;

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
}>({ lang: "en", setLang: () => {}, t: (k) => en[k] });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("cd_lang");
    // Post-mount sync of a persisted UI preference (SSR-safe); not an external-system subscription
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "hi" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    window.localStorage.setItem("cd_lang", l);
    setLangState(l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (k: Key) => dicts[lang][k] ?? en[k],
    [lang],
  );

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export type TKey = Key;
