export type Lang = "en" | "ar"; 

  

const STRINGS = { 

  en: { 

    search: "Search player or club", 

    allClubs: "All clubs", 

    selected: "Selected", 

    confirm: "Confirm Picks", 

    saving: "Saving...", 

    captain: "Captain", 

    noCaptain: "No captain yet", 

    loading: "Loading…", 

    editPicks: "Edit Picks", 

    noPicks: "No picks saved yet. Go to Pick 11.", 

    pick11: "Pick 11", 
    
    Saved : "Saved ✅"

  }, 

  ar: { 

    search: "ابحث عن لاعب أو نادٍ", 

    allClubs: "جميع الأندية", 

    selected: "المختار", 

    confirm: "تأكيد التشكيلة", 

    saving: "جارٍ الحفظ...", 

    captain: "القائد", 

    noCaptain: "لا يوجد قائد بعد", 

    loading: "جارٍ التحميل…", 

    editPicks: "تعديل التشكيلة", 

    noPicks: "لا توجد تشكيلة محفوظة. اذهب إلى اختر 11.", 

    pick11: "اختر 11", 

    Saved : "تم الحفظ ✅"


  }, 

} as const; 

  

export function getLang(): Lang { 

  if (typeof window === "undefined") return "en"; 

  return (localStorage.getItem("lang") as Lang) || "en"; 

} 

export function setLang(l: Lang) { 

  if (typeof window === "undefined") return; 

  localStorage.setItem("lang", l); 

  window.dispatchEvent(new CustomEvent("lang-change", { detail: l })); 

} 

export function t(key: keyof typeof STRINGS["en"], lang: Lang = getLang()) { 

  return STRINGS[lang][key] || STRINGS.en[key]; 

} 