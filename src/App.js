import { useState, useEffect, useRef, useCallback } from "react";

const INAT_TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjoxMDU2NTcwNywiZXhwIjoxNzc5NjY2MzQwfQ.0Q39DkizagFZKsp7gRwXZGLcdzkBkMiSLK7e03Wdi46aainAWuIZLABhabDHs7e5kbHafXSQCE4lKOBPD05RHg";

const AVATAR_OPTIONS = ["🌿","🌱","🌳","🌸","🍃","🌻","🦋","🐝","🌾","🍀","🌊","🦅","🐢","🦊","🌵","🍄"];

const RANKS = [
  { name: "Semilla",     min: 0,    emoji: "🌱", color: "#86efac" },
  { name: "Brote",       min: 100,  emoji: "🌿", color: "#4ade80" },
  { name: "Explorador",  min: 300,  emoji: "🔭", color: "#22d3ee" },
  { name: "Botánico",    min: 700,  emoji: "🌸", color: "#a78bfa" },
  { name: "Naturalista", min: 1500, emoji: "🌳", color: "#fbbf24" },
  { name: "Guardián",    min: 3000, emoji: "🛡️", color: "#f87171" },
];

const RECYCLE_ITEMS = [
  { id: "plastic",  label: "Plástico",  emoji: "🧴", points: 10, color: "#FFD700" },
  { id: "glass",    label: "Vidrio",    emoji: "🍾", points: 15, color: "#88D498" },
  { id: "paper",    label: "Papel",     emoji: "📦", points: 8,  color: "#A8DADC" },
  { id: "metal",    label: "Metal",     emoji: "🥫", points: 12, color: "#C0C0C0" },
  { id: "organic",  label: "Orgánico",  emoji: "🍂", points: 5,  color: "#8B6914" },
  { id: "battery",  label: "Pila",      emoji: "🔋", points: 20, color: "#FF6B6B" },
];

const ACHIEVEMENTS = [
  { id: "first_plant",  title: "Primer brote",    desc: "Identifica tu primera planta",     emoji: "🌱", bonus: 20,  check: (p)       => Object.keys(p).length >= 1 },
  { id: "plants_5",     title: "Explorador",       desc: "Identifica 5 especies distintas",  emoji: "🔭", bonus: 50,  check: (p)       => Object.keys(p).length >= 5 },
  { id: "plants_10",    title: "Botánico",           desc: "Identifica 10 especies distintas", emoji: "🌿", bonus: 150, check: (p)       => Object.keys(p).length >= 10 },
  { id: "plants_20",    title: "Naturalista",       desc: "Identifica 20 especies distintas", emoji: "🌳", bonus: 400, check: (p)       => Object.keys(p).length >= 20 },
  { id: "recycle_5",    title: "Eco-consciente",    desc: "Recicla 5 objetos",                 emoji: "♻️", bonus: 30,  check: (p,r)     => Object.values(r).reduce((a,b)=>a+b,0) >= 5 },
  { id: "recycle_20",   title: "Eco-héroe",          desc: "Recicla 20 objetos",               emoji: "🦸", bonus: 100, check: (p,r)     => Object.values(r).reduce((a,b)=>a+b,0) >= 20 },
  { id: "all_recycle",  title: "Reciclador total",  desc: "Recicla al menos 1 de cada tipo",  emoji: "🏅", bonus: 80,  check: (p,r)     => RECYCLE_ITEMS.every(i=>(r[i.id]||0)>=1) },
  { id: "invasora",     title: "Detector invasor",  desc: "Encuentra una planta invasora",    emoji: "🚨", bonus: 60,  check: (p,r,inv) => inv > 0 },
];

const STATUS_COLORS = { "Autóctona": "#4CAF50", "Invasora": "#F44336", "Cultivada": "#FF9800" };

function load(key, def) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; } catch { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function getRank(points) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (points >= r.min) rank = r; }
  return rank;
}
function getNextRank(points) {
  return RANKS.find(r => r.min > points) || null;
}

// ── PROCESADOR INTELIGENTE DE CUIDADOS BOTÁNICOS ──────────────────────────
function generateCareSpecs(commonName, scientificName, wikiExtract, family) {
  const text = (wikiExtract + " " + family + " " + commonName).toLowerCase();
  
  let leafType = "Perenne (Verde e intacta todo el año)";
  if (text.includes("caduc") || text.includes("hoja caduca") || text.includes("pierde la hoja")) {
    leafType = "Caduca (Se cae o debilita en otoño/invierno)";
  } else if (text.includes("cactus") || text.includes("suculenta") || text.includes("crasa") || text.includes("cactaceae")) {
    leafType = "Carnosa / Suculenta (Gruesa, almacena su propia agua)";
  } else if (text.includes("pino") || text.includes("conífera") || text.includes("acícula")) {
    leafType = "Acicular (Hojas finas en forma de aguja)";
  }

  let flowering = "Primavera y Verano";
  if (text.includes("otoño") || text.includes("autumn")) flowering = "Finales de Verano y Otoño";
  if (text.includes("invierno") || text.includes("winter")) flowering = "Invierno y principios de Primavera";
  if (text.includes("todo el año") || text.includes("siempre florece")) flowering = "Continua (Florece de manera constante)";
  if (text.includes("no tiene flor") || text.includes("helecho") || text.includes("fern")) flowering = "No florece (Planta por esporas)";

  let watering = "Moderado (1 o 2 veces por semana, dejando secar la superficie)";
  if (text.includes("cactus") || text.includes("suculenta") || text.includes("desiert") || text.includes("seco") || text.includes("crasa")) {
    watering = "Bajo (Cada 10-15 días, solo si la tierra está completamente seca)";
  } else if (text.includes("tropical") || text.includes("humed") || text.includes("pantano") || text.includes("río") || text.includes("agua")) {
    watering = "Alto (Sustrato siempre húmedo pero bien drenado, sin encharcar)";
  }

  let feature = "Planta de gran valor ornamental y equilibrio en ecosistemas locales.";
  if (wikiExtract) {
    const sentences = wikiExtract.split(/[.🧱]/);
    if (sentences.length > 1) {
      const candidate = sentences[1].trim().length > 30 ? sentences[1].trim() : sentences[0].trim();
      feature = candidate.endsWith(".") ? candidate : candidate + ".";
    }
  }

  return { leafType, flowering, watering, feature };
}

async function fetchWikiInfo(scientificName, commonName, family) {
  const queries = [scientificName, commonName].filter(Boolean);
  let rawExtract = "";
  let thumbnail = null;
  let wikiUrl = null;

  for (const q of queries) {
    try {
      const searchUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`;
      const res = await fetch(searchUrl);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.extract && data.extract.length > 30) {
        rawExtract = data.extract;
        thumbnail = data.thumbnail?.source || null;
        wikiUrl = data.content_urls?.desktop?.page || null;
        break;
      }
    } catch {}
  }

  if (!rawExtract) {
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`);
      if (res.ok) {
        const data = await res.json();
        rawExtract = data.extract || "";
        thumbnail = thumbnail || data.thumbnail?.source || null;
        wikiUrl = wikiUrl || data.content_urls?.desktop?.page || null;
      }
    } catch {}
  }

  const careSpecs = generateCareSpecs(commonName, scientificName, rawExtract, family || "");
  return { ...careSpecs, thumbnail, wikiUrl };
}

async function fetchInatTaxonDetails(taxonId) {
  try {
    const res = await fetch(`https://api.inaturalist.org/v1/taxa/${taxonId}`, {
      headers: { "Authorization": INAT_TOKEN }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const taxon = data.results?.[0];
    if (!taxon) return null;
    return {
      conservation: taxon.conservation_status?.status_name || null,
      rank: taxon.rank || null,
      extinct: taxon.extinct || false,
      observations: taxon.observations_count || 0,
      ancestors: taxon.ancestor_ids || [],
    };
  } catch { return null; }
}

// ── Componente Mapa ──────────────────────────────────────────────────────────
function PlantMap({ markers }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
    function initMap() {
      if (mapInstanceRef.current || !mapRef.current) return;
      const map = window.L.map(mapRef.current).setView([40.4168, -3.7038], 5);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
      addMarkers(map);
    }
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) addMarkers(mapInstanceRef.current);
  }, [markers]);

  function addMarkers(map) {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    markers.forEach(m => {
      const icon = window.L.divIcon({
        html: `<div style="background:linear-gradient(135deg,#16a34a,#0d9488);border-radius:50% 50% 50% 0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;transform:rotate(-45deg);box-shadow:0 2px 8px #0007"><span style="transform:rotate(45deg)">🌿</span></div>`,
        className: "", iconSize: [32, 32], iconAnchor: [16, 32],
      });
      const marker = window.L.marker([m.lat, m.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${m.name}</b><br><i>${m.scientific || ""}</i><br><small>${m.date}</small>`);
      markersRef.current.push(marker);
    });
    if (markers.length > 0) {
      const group = window.L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.3));
    }
  }

  return <div ref={mapRef} style={{ width: "100%", height: 340, borderRadius: 20, overflow: "hidden" }} />;
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function EcoQuest() {
  const [tab, setTab] = useState("scan");

  const [userName,   setUserName]   = useState(() => load("eq_username", ""));
  const [userAvatar, setUserAvatar] = useState(() => load("eq_avatar", "🌿"));
  const [myPoints,          setMyPoints]          = useState(() => load("eq_points", 0));
  const [plantCount,        setPlantCount]        = useState(() => load("eq_plants", {}));
  const [recycleCount,      setRecycleCount]      = useState(() => load("eq_recycle", {}));
  const [invasoraCount,      setInvasoraCount]     = useState(() => load("eq_invasora", 0));
  const [unlockedAch,        setUnlockedAch]       = useState(() => load("eq_achievements", []));
  const [plantMarkers,      setPlantMarkers]      = useState(() => load("eq_markers", []));
  const [locationPerm,      setLocationPerm]      = useState(() => load("eq_loc_perm", null));

  const [scanning,    setScanning]    = useState(false);
  const [result,      setResult]      = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const fileInputRef = useRef(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName,       setTempName]       = useState("");
  const [tempAvatar,     setTempAvatar]     = useState("🌿");
  const [notification,   setNotification]   = useState(null);

  useEffect(() => { save("eq_points",       myPoints);       }, [myPoints]);
  useEffect(() => { save("eq_plants",       plantCount);    }, [plantCount]);
  useEffect(() => { save("eq_recycle",      recycleCount);  }, [recycleCount]);
  useEffect(() => { save("eq_invasora",     invasoraCount); }, [invasoraCount]);
  useEffect(() => { save("eq_achievements", unlockedAch);   }, [unlockedAch]);
  useEffect(() => { save("eq_markers",      plantMarkers);  }, [plantMarkers]);
  useEffect(() => { save("eq_username",      userName);      }, [userName]);
  useEffect(() => { save("eq_avatar",       userAvatar);    }, [userAvatar]);
  useEffect(() => { save("eq_loc_perm",      locationPerm);  }, [locationPerm]);

  useEffect(() => {
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAch.includes(ach.id) && ach.check(plantCount, recycleCount, invasoraCount)) {
        setUnlockedAch(prev => {
          if (prev.includes(ach.id)) return prev;
          setMyPoints(pts => pts + ach.bonus);
          showNotif(`¡Logro: ${ach.title}! (+${ach.bonus} pts)`, ach.emoji);
          return [...prev, ach.id];
        });
      }
    });
  }, [plantCount, recycleCount, invasoraCount]);

  const addPoints = (pts, label, emoji) => {
    setMyPoints(prev => prev + pts);
    showNotif(`+${pts} pts — ${label}`, emoji);
  };
  const showNotif = (msg, emoji) => {
    setNotification({ msg, emoji });
    setTimeout(() => setNotification(null), 3500);
  };

  const requestLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (locationPerm === "denied") { resolve(null); return; }
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        pos => { setLocationPerm("granted"); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
        ()  => { setLocationPerm("denied");  resolve(null); },
        { timeout: 8000 }
      );
    });
  }, [locationPerm]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setScanning(true);
    setResult(null);

    const location = await requestLocation();

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("https://api.inaturalist.org/v1/computervision/score_image", {
        method: "POST",
        headers: { "Authorization": INAT_TOKEN },
        body: formData,
      });
      if (!res.ok) {
        setResult({ type: "error", message: `Error iNaturalist (${res.status}). Intenta de nuevo.` });
        setScanning(false);
        return;
      }
      const data = await res.json();
      const top = data.results?.[0];

      if (top?.taxon) {
        const taxon     = top.taxon;
        const name      = taxon.preferred_common_name || taxon.name;
        const scientific= taxon.name;
        const score     = Math.round((top.combined_score || 0) * 100);
        const pts       = Math.min(60, Math.max(10, Math.round(score * 0.6)));
        const isInvasora= taxon.establishment_means?.establishment_means === "introduced";
        const familyName = taxon.family_name || null;

        const parsed = {
          type: "plant", name, scientific,
          origin:     isInvasora ? "Introducida" : "Nativa",
          status:     isInvasora ? "Invasora" : "Autóctona",
          points:     pts,
          confidence: score > 70 ? "Alta" : score > 40 ? "Media" : "Baja",
          score,
          inatImage:  taxon.default_photo?.medium_url || null,
          taxonId:    taxon.id,
          family:     familyName,
          observations: taxon.observations_count || 0,
          wikiInfo:   null,
          taxonDetails: null,
        };

        setResult(parsed);
        setScanning(false);

        if (location) {
          setPlantMarkers(prev => [...prev, { lat: location.lat, lng: location.lng, name, scientific, date: new Date().toLocaleDateString("es-ES") }]);
        }
        setPlantCount(prev => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
        if (isInvasora) setInvasoraCount(c => c + 1);
        addPoints(pts, name, "🌿");

        setLoadingInfo(true);
        const [wikiInfo, taxonDetails] = await Promise.all([
          fetchWikiInfo(scientific, name, familyName),
          fetchInatTaxonDetails(taxon.id),
        ]);
        setResult(prev => prev ? { ...prev, wikiInfo, taxonDetails } : prev);
        setLoadingInfo(false);

      } else {
        setResult({ type: "none", message: "No se detectó ninguna planta. Intenta con otra foto con mejor luz." });
        setScanning(false);
      }
    } catch (err) {
      setResult({ type: "error", message: "Error de red. Comprueba tu conexión." });
      setScanning(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRecycle = (item) => {
    setRecycleCount(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    addPoints(item.points, `Reciclé ${item.label}`, item.emoji);
  };

  const uniquePlants  = Object.keys(plantCount).length;
  const totalRecycled = Object.values(recycleCount).reduce((a, b) => a + b, 0);
  const currentRank   = getRank(myPoints);
  const nextRank      = getNextRank(myPoints);
  const rankProgress  = nextRank ? ((myPoints - currentRank.min) / (nextRank.min - currentRank.min)) * 100 : 100;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1628 0%,#0d2218 50%,#0a1628 100%)", fontFamily: "system-ui, sans-serif", color: "#e8f5e9", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {[...Array(18)].map((_, i) => (
          <div key={i} style={{ position: "absolute", width: 3+(i%4)*2, height: 3+(i%4)*2, borderRadius: "50%", background: i%3===0?"#4ade8044":i%3===1?"#86efac22":"#22d3ee22", left: ((i*37+10)%95)+"%", top: ((i*53+7)%90)+"%", animation: `float ${3+i%4}s ease-in-out infinite alternate`, animationDelay: (i*0.3)+"s" }} />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float   { from{transform:translateY(0)} to{transform:translateY(-12px)} }
        @keyframes slideIn { from{transform:translateY(-50px) scale(.85);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes fadeUp  { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        .card-tap:active   { transform:scale(.96) }
      `}} />

      {notification && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#16a34a,#0d9488)", color:"white", borderRadius:50, padding:"12px 24px", fontWeight:"bold", fontSize:14, zIndex:9999, boxShadow:"0 8px 32px #4ade8055", animation:"slideIn .3s ease", display:"flex", alignItems:"center", gap:10, maxWidth:"90vw" }}>
          <span style={{ fontSize:20 }}>{notification.emoji}</span>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{notification.msg}</span>
        </div>
      )}

      <div style={{ maxWidth:480, margin:"0 auto", padding:"0 0 110px", position:"relative", zIndex:1 }}>

        {/* HEADER */}
        <div style={{ padding:"28px 24px 16px", textAlign:"center" }}>
          <div style={{ fontSize:11, letterSpacing:4, color:"#4ade80", textTransform:"uppercase", marginBottom:6 }}>Proyecto</div>
          <div style={{ fontSize:40, fontWeight:"900", letterSpacing:-1, lineHeight:1, background:"linear-gradient(135deg,#4ade80,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>🌿 EcoQuest</div>
          <div style={{ fontSize:12, color:"#86efac55", marginTop:4 }}>Identifica · Recicla · Compite</div>
        </div>

        {/* STATS */}
        <div style={{ margin:"0 20px 16px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[
            { label:"Puntos",    val:myPoints,   emoji:"⭐", color:"#fbbf24" },
            { label:"Especies",  val:uniquePlants,  emoji:"🌿", color:"#4ade80" },
            { label:"Reciclado", val:totalRecycled, emoji:"♻️", color:"#22d3ee" },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,0.05)", borderRadius:14, padding:"12px 6px", textAlign:"center", border:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:18 }}>{s.emoji}</div>
              <div style={{ fontSize:20, fontWeight:"800", color:s.color }}>{s.val}</div>
              <div style={{ fontSize:9, color:"#86efac66", marginTop:1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* RANGO MINI */}
        <div style={{ margin:"0 20px 20px", background:`linear-gradient(135deg,${currentRank.color}18,${currentRank.color}08)`, borderRadius:16, padding:"12px 16px", border:`1px solid ${currentRank.color}44`, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:28 }}>{currentRank.emoji}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:"700", color:currentRank.color }}>{currentRank.name}</div>
            {nextRank ? (
              <>
                <div style={{ height:5, background:"rgba(255,255,255,0.1)", borderRadius:3, marginTop:6 }}>
                  <div style={{ height:"100%", borderRadius:3, width:`${Math.min(rankProgress,100)}%`, background:`linear-gradient(90deg,${currentRank.color},${nextRank.color})`, transition:"width .6s ease" }} />
                </div>
                <div style={{ fontSize:10, color:"#86efac55", marginTop:3 }}>{myPoints} / {nextRank.min} pts para {nextRank.emoji} {nextRank.name}</div>
              </>
            ) : (
              <div style={{ fontSize:11, color:currentRank.color, marginTop:4 }}>¡Rango máximo! 🏆</div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:"flex", margin:"0 20px 22px", background:"rgba(0,0,0,0.35)", borderRadius:16, padding:4, gap:3 }}>
          {[
            { id:"scan",         label:"📸", title:"Plantas"  },
            { id:"recycle",      label:"♻️", title:"Reciclar" },
            { id:"achievements", label:"🏆", title:"Logros"   },
            { id:"map",          label:"🗺️", title:"Mapa"     },
            { id:"profile",      label:"👤", title:"Perfil"   },
          ].map(t => (
            <button key={t.id} className="card-tap" onClick={() => setTab(t.id)} style={{ flex:1, padding:"9px 2px 6px", borderRadius:12, border:"none", background:tab===t.id?"linear-gradient(135deg,#16a34a,#0d9488)":"transparent", color:tab===t.id?"white":"#86efac77", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, boxShadow:tab===t.id?"0 4px 12px #16a34a44":"none" }}>
              <span style={{ fontSize:16 }}>{t.label}</span>
              <span style={{ fontSize:9, fontWeight:tab===t.id?"700":"400" }}>{t.title}</span>
            </button>
          ))}
        </div>

        {/* ══════════ TAB SCAN ══════════ */}
        {tab==="scan" && (
          <div style={{ padding:"0 20px" }}>
            <div onClick={() => fileInputRef.current?.click()} style={{ background:"rgba(255,255,255,0.03)", borderRadius:24, padding:28, border:"2px dashed rgba(74,222,128,0.3)", textAlign:"center", marginBottom:20, cursor:"pointer" }}>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display:"none" }} />
              {scanning ? (
                <>
                  {previewUrl && <img src={previewUrl} alt="" style={{ width:"100%", maxHeight:160, objectFit:"cover", borderRadius:14, marginBottom:14, opacity:.6 }} />}
                  <div style={{ fontSize:44, animation:"spin 1s linear infinite", display:"inline-block" }}>🔍</div>
                  <div style={{ marginTop:12, color:"#4ade80", fontSize:14 }}>Identificando especie...</div>
                  <div style={{ fontSize:11, color:"#86efac55", marginTop:4 }}>iNaturalist · base de datos global</div>
                </>
              ) : result?.type==="plant" && previewUrl ? (
                <>
                  <img src={previewUrl} alt="" style={{ width:"100%", maxHeight:150, objectFit:"cover", borderRadius:14, marginBottom:10 }} />
                  <div style={{ fontSize:12, color:"#4ade80" }}>📸 Toca para analizar otra foto</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:52 }}>📸</div>
                  <div style={{ fontSize:16, fontWeight:"700", color:"#4ade80", marginTop:10 }}>Fotografía una planta</div>
                  <div style={{ fontSize:12, color:"#86efac77", marginTop:5 }}>Identificación inteligente</div>
                  <div style={{ marginTop:14, display:"inline-block", background:"linear-gradient(135deg,#16a34a,#0d9488)", color:"white", borderRadius:50, padding:"9px 26px", fontSize:13, fontWeight:"700" }}>Abrir cámara</div>
                </>
              )}
            </div>

            {result?.type==="plant" && (
              <div style={{ background:"linear-gradient(135deg,rgba(22,163,74,0.1),rgba(13,148,136,0.1))", borderRadius:22, padding:20, border:"1px solid rgba(74,222,128,0.25)", marginBottom:20, animation:"fadeUp .4s ease" }}>
                <div style={{ display:"flex", gap:14, marginBottom:18 }}>
                  {result.inatImage
                    ? <img src={result.inatImage} alt="" style={{ width:64, height:64, borderRadius:14, objectFit:"cover", flexShrink:0 }} />
                    : <div style={{ fontSize:48, flexShrink:0 }}>🌿</div>
                  }
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:8 }}>
                      <div style={{ fontSize:18, fontWeight:"800" }}>{result.name}</div>
                      <span style={{ background:(STATUS_COLORS[result.status]||"#888")+"33", color:STATUS_COLORS[result.status]||"#888", borderRadius:50, padding:"2px 10px", fontSize:10, fontWeight:"700" }}>{result.status}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#86efac77", fontStyle:"italic", marginTop:2 }}>{result.scientific}</div>
                    <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:"#fbbf24" }}>🌍 {result.origin}</span>
                      <span style={{ fontSize:11, color:"#fbbf24" }}>⭐ +{result.points} pts</span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize:13, fontWeight:"bold", color:"#4ade80", letterSpacing:1, marginBottom:10, textTransform:"uppercase" }}>📋 Guía de Cuidados y Datos</div>
                
                {loadingInfo ? (
                  <div style={{ textAlign:"center", padding:"14px 0", color:"#4ade8077", fontSize:12, animation:"pulse 1.5s infinite" }}>
                    📖 Analizando datos botánicos...
                  </div>
                ) : result.wikiInfo ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 14px", borderLeft: "4px solid #4ade80" }}>
                      <span style={{ color: "#86efac", fontSize: 11, fontWeight: "bold", display: "block" }}>🍁 TIPO DE HOJA</span>
                      <span style={{ fontSize: 13, color: "#fff" }}>{result.wikiInfo.leafType}</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 14px", borderLeft: "4px solid #a78bfa" }}>
                      <span style={{ color: "#c084fc", fontSize: 11, fontWeight: "bold", display: "block" }}>🌸 ÉPOCA DE FLORACIÓN</span>
                      <span style={{ fontSize: 13, color: "#fff" }}>{result.wikiInfo.flowering}</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 14px", borderLeft: "4px solid #22d3ee" }}>
                      <span style={{ color: "#22d3ee", fontSize: 11, fontWeight: "bold", display: "block" }}>💧 FRECUENCIA DE RIEGO</span>
                      <span style={{ fontSize: 13, color: "#fff" }}>{result.wikiInfo.watering}</span>
                    </div>
                    <div style={{ background: "rgba(251,191,36,0.06)", borderRadius: 12, padding: "12px 14px", border: "1px dashed rgba(251,191,36,0.3)" }}>
                      <span style={{ color: "#fbbf24", fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 2 }}>✨ CARACTERÍSTICA DESTACADA</span>
                      <p style={{ fontSize: 13, color: "#e8f5e9", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{result.wikiInfo.feature}"</p>
                    </div>
                    {result.wikiInfo.wikiUrl && (
                      <a href={result.wikiInfo.wikiUrl} target="_blank" rel="noopener noreferrer" style={{ display:"inline-block", alignSelf: "flex-start", marginTop:4, fontSize:11, color:"#86efac", textDecoration:"none", background:"rgba(74,222,128,0.1)", borderRadius:50, padding:"4px 12px" }}>
                        Ver artículo completo →
                      </a>
                    )}
                  </div>
                ) : (
                  <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:14, padding:"12px 14px", fontSize:12, color:"#86efac66", textAlign:"center", marginBottom: 16 }}>
                    No se han podido procesar los cuidados automáticos para esta especie.
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {result.family && (
                    <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:10, padding:"8px 10px" }}>
                      <div style={{ fontSize:9, color:"#86efac66", fontWeight:"700" }}>FAMILIA</div>
                      <div style={{ fontSize:11, color:"#cce5cc" }}>{result.family}</div>
                    </div>
                  )}
                  {result.observations > 0 && (
                    <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:10, padding:"8px 10px" }}>
                      <div style={{ fontSize:9, color:"#86efac66", fontWeight:"700" }}>REGISTROS GLOBALES</div>
                      <div style={{ fontSize:11, color:"#cce5cc" }}>{result.observations.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && (result.type==="none"||result.type==="error") && (
              <div style={{ background:"rgba(248,113,113,0.08)", borderRadius:18, padding:18, border:"1px solid rgba(248,113,113,0.25)", textAlign:"center", marginBottom:18 }}>
                <div style={{ fontSize:30 }}>{result.type==="none"?"🔎":"⚠️"}</div>
                <div style={{ color:"#fca5a5", marginTop:8, fontSize:13 }}>{result.message}</div>
              </div>
            )}

            {uniquePlants > 0 && (
              <div style={{ marginTop:4 }}>
                <div style={{ fontSize:10, letterSpacing:3, color:"#86efac55", textTransform:"uppercase", marginBottom:10 }}>Especies encontradas ({uniquePlants})</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {Object.entries(plantCount).map(([name, count]) => (
                    <div key={name} style={{ background:"rgba(74,222,128,0.1)", borderRadius:50, padding:"5px 12px", fontSize:11, color:"#4ade80", border:"1px solid rgba(74,222,128,0.2)", display:"flex", alignItems:"center", gap:5 }}>
                      {name}{count>1&&<span style={{ background:"rgba(74,222,128,0.2)", borderRadius:50, padding:"1px 6px", fontSize:10 }}>x{count}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB RECICLAR ══════════ */}
        {tab==="recycle" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ fontSize:10, letterSpacing:3, color:"#86efac55", textTransform:"uppercase", marginBottom:14 }}>Toca lo que reciclas</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {RECYCLE_ITEMS.map(item => (
                <div key={item.id} className="card-tap" onClick={() => handleRecycle(item)} style={{ background:"rgba(255,255,255,0.04)", borderRadius:20, padding:"20px 14px", textAlign:"center", border:`1px solid ${item.color}44`, cursor:"pointer" }}>
                  <div style={{ fontSize:38 }}>{item.emoji}</div>
                  <div style={{ fontSize:14, fontWeight:"700", marginTop:10, color:item.color }}>{item.label}</div>
                  <div style={{ fontSize:11, color:"#86efac77", marginTop:4 }}>+{item.points} pts</div>
                  {recycleCount[item.id]>0 && <div style={{ marginTop:8, background:item.color+"22", borderRadius:50, padding:"2px 10px", display:"inline-block", fontSize:11, color:item.color, fontWeight:"700" }}>x{recycleCount[item.id]}</div>}
                </div>
              ))}
            </div>
            {Object.keys(recycleCount).length > 0 && (
              <div style={{ marginTop: 20, background: "rgba(255,255,255,0.02)", padding: 15, borderRadius: 14 }}>
                <span style={{ fontSize: 12, color: "#86efac77", display: "block", marginBottom: 8 }}>RESUMEN RECICLAJE</span>
                {Object.entries(recycleCount).map(([id, val]) => {
                  const rItem = RECYCLE_ITEMS.find(i => i.id === id);
                  return val > 0 ? (
                    <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                      <span>{rItem?.emoji} {rItem?.label}</span>
                      <span style={{ fontWeight: "bold", color: rItem?.color }}>{val} uds</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
