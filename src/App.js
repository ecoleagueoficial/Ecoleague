import { useState, useEffect, useRef, useCallback } from "react";

const INAT_TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjoxMDU2NTcwNywiZXhwIjoxNzc5NjY2MzQwfQ.0Q39DkizagFZKsp7gRwXZGLcdzkBkMiSLK7e03Wdi46aainAWuIZLABhabDHs7e5kbHafXSQCE4lKOBPD05RHg";

const AVATAR_OPTIONS = ["🌿","🌱","🌳","🌸","🍃","🌻","🦋","🐝","🌾","🍀","🌊","🦅","🐢","🦊","🌵","🍄"];

const RANKS = [
  { name: "Semilla",     min: 0,    emoji: "🌱", color: "#86efac", desc: "Acabas de plantar tu interés por la naturaleza." },
  { name: "Brote",       min: 100,  emoji: "🌿", color: "#4ade80", desc: "Tu conocimiento empieza a emerger con fuerza." },
  { name: "Explorador",  min: 300,  emoji: "🔭", color: "#22d3ee", desc: "Buscas rincones verdes y cuidas tu entorno activo." },
  { name: "Botánico",    min: 700,  emoji: "🌸", color: "#a78bfa", desc: "Reconoces las sutilezas de la flora urbana y silvestre." },
  { name: "Naturalista", min: 1500, emoji: "🌳", color: "#fbbf24", desc: "Un pilar de la comunidad con un gran impacto ecológico." },
  { name: "Guardián",    min: 3000, emoji: "🛡️", color: "#f87171", desc: "Protector definitivo del planeta y maestro reciclador." },
];

const RECYCLE_ITEMS = [
  { id: "plastic",  label: "Plástico",  emoji: "🧴", points: 10, color: "#FFD700" },
  { id: "glass",    label: "Vidrio",    emoji: "🍾", points: 15, color: "#88D498" },
  { id: "paper",    label: "Papel",     emoji: "📦", points: 8,  color: "#A8DADC" },
  { id: "metal",    label: "Metal",     emoji: "🥫", points: 12, color: "#C0C0C0" },
  { id: "organic",  label: "Orgánico",  emoji: "🍂", points: 5,  color: "#8B6914" },
  { id: "battery",  label: "Pila",      emoji: "🔋", points: 20, color: "#FF6B6B" },
];

// Catálogo ampliado de logros fijos
const ACHIEVEMENTS = [
  { id: "first_plant",  title: "Primer Brote",      desc: "Identifica tu primera planta",     emoji: "🌱", bonus: 20,  check: (p)       => Object.keys(p).length >= 1 },
  { id: "plants_5",     title: "Explorador Verde",  desc: "Identifica 5 especies distintas",  emoji: "🔭", bonus: 50,  check: (p)       => Object.keys(p).length >= 5 },
  { id: "plants_12",    title: "Maestro Botánico",   desc: "Identifica 12 especies distintas", emoji: "🌿", bonus: 180, check: (p)       => Object.keys(p).length >= 12 },
  { id: "plants_25",    title: "Gran Naturalista",  desc: "Identifica 25 especies distintas", emoji: "🌳", bonus: 500, check: (p)       => Object.keys(p).length >= 25 },
  { id: "recycle_5",    title: "Eco-Consciente",    desc: "Recicla 5 objetos en total",       emoji: "♻️", bonus: 30,  check: (p,r)     => Object.values(r).reduce((a,b)=>a+b,0) >= 5 },
  { id: "recycle_25",   title: "Héroe del Contenedor", desc: "Recicla 25 objetos en total",    emoji: "🦸", bonus: 150, check: (p,r)     => Object.values(r).reduce((a,b)=>a+b,0) >= 25 },
  { id: "recycle_50",   title: "Residuos Cero",     desc: "Recicla 50 objetos en total",       emoji: "🌌", bonus: 350, check: (p,r)     => Object.values(r).reduce((a,b)=>a+b,0) >= 50 },
  { id: "all_recycle",  title: "Reciclador Total",  desc: "Recicla al menos 1 de cada tipo",  emoji: "🏅", bonus: 100, check: (p,r)     => RECYCLE_ITEMS.every(i=>(r[i.id]||0)>=1) },
  { id: "battery_king", title: "Carga Limpia",      desc: "Recicla 5 pilas contaminantes",    emoji: "⚡", bonus: 80,  check: (p,r)     => (r["battery"]||0) >= 5 },
  { id: "invasora",     title: "Alerta Biológica",  desc: "Encuentra una planta invasora",    emoji: "🚨", bonus: 60,  check: (p,r,inv) => inv > 0 },
];

// Retos semanales fijos simulados
const WEEKLY_CHALLENGES = [
  { id: "w_1", title: "Operación Vidrio", desc: "Recicla 3 botellas o envases de vidrio esta semana", emoji: "🍾", target: 3, bonus: 40, check: (r) => (r["glass"] || 0) },
  { id: "w_2", title: "Biodiversidad", desc: "Registra 3 plantas diferentes en tu entorno", emoji: "🌻", target: 3, bonus: 60, check: (p) => Object.keys(p).length },
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

// Generador Inteligente de Cuidados y Curiosidades Añadidas
function generateCareSpecs(commonName, scientificName, wikiExtract, family) {
  const text = (wikiExtract + " " + family + " " + commonName).toLowerCase();
  
  let leafType = "Perenne (Verde e intacta todo el año)";
  if (text.includes("caduc") || text.includes("hoja caduca") || text.includes("pierde la hoja")) {
    leafType = "Caduca (Se cae o debilita en otoño/invierno)";
  } else if (text.includes("cactus") || text.includes("suculenta") || text.includes("crasa") || text.includes("cactaceae")) {
    leafType = "Carnosa / Suculenta (Gruesa, almacena su propia agua)";
  }

  let flowering = "Primavera y Verano";
  if (text.includes("otoño") || text.includes("autumn")) flowering = "Finales de Verano y Otoño";
  if (text.includes("invierno") || text.includes("winter")) flowering = "Invierno y principios de Primavera";
  if (text.includes("no tiene flor") || text.includes("helecho")) flowering = "No florece (Se reproduce por esporas)";

  let watering = "Moderado (1 o 2 veces por semana, dejando secar la superficie)";
  if (text.includes("cactus") || text.includes("suculenta") || text.includes("desiert") || text.includes("seco")) {
    watering = "Bajo (Cada 10-15 días, solo si la tierra está totalmente seca)";
  } else if (text.includes("tropical") || text.includes("humed") || text.includes("pantano") || text.includes("río")) {
    watering = "Alto (Mantener sustrato siempre húmedo sin encharcar)";
  }

  let feature = "Planta de gran valor ornamental y equilibrio en ecosistemas locales.";
  if (wikiExtract) {
    const sentences = wikiExtract.split(/[.🧱]/);
    if (sentences.length > 1) {
      const candidate = sentences[1].trim().length > 30 ? sentences[1].trim() : sentences[0].trim();
      feature = candidate.endsWith(".") ? candidate : candidate + ".";
    }
  }

  // ── SECCIÓN NUEVA: GENERACIÓN DE 2 CURIOSIDADES ──
  let curiosities = [
    "Sus células contienen cloroplastos que realizan la fotosíntesis, liberando oxígeno vital a nuestra atmósfera.",
    "Forma complejas redes invisibles bajo tierra con hongos (micorrizas) para intercambiar nutrientes con sus vecinas."
  ];

  if (text.includes("cactus") || text.includes("suculenta") || text.includes("crasa")) {
    curiosities = [
      "Abre sus estomas únicamente por la noche (metabolismo CAM) para evitar perder agua por evaporación diurna.",
      "Sus espinas son en realidad hojas evolutivamente modificadas para protegerse y condensar el rocío matutino."
    ];
  } else if (text.includes("árbol") || text.includes("tree") || text.includes("pino") || text.includes("roble")) {
    curiosities = [
      "Un ejemplar maduro de este tipo puede absorber hasta 22 kg de dióxido de carbono gaseoso al año.",
      "Los anillos de su tronco no solo marcan su edad, sino también los años de sequía o lluvias intensas que ha sobrevivido."
    ];
  } else if (text.includes("flor") || text.includes("abeja") || text.includes("poliniza")) {
    curiosities = [
      "Sus colores y patrones geométricos (muchos visibles solo bajo luz ultravioleta) actúan como pistas de aterrizaje para polinizadores.",
      "Ciertas especies emiten compuestos volátiles específicos para alertar a plantas vecinas si están siendo atacadas por insectos."
    ];
  }

  return { leafType, flowering, watering, feature, curiosities };
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

  const careSpecs = generateCareSpecs(commonName, scientificName, rawExtract, family || "");
  return { ...careSpecs, thumbnail, wikiUrl };
}

export default function EcoQuest() {
  const [tab, setTab] = useState("scan");

  // Perfil del Usuario
  const [userName,   setUserName]   = useState(() => load("eq_username", "Explorador Verde"));
  const [userAvatar, setUserAvatar] = useState(() => load("eq_avatar", "🌿"));
  const [userCode]                  = useState(() => load("eq_usercode", "EQ-" + Math.floor(100000 + Math.random() * 900000)));

  // Sistema de Puntos y Estadísticas
  const [myPoints,          setMyPoints]          = useState(() => load("eq_points", 0));
  const [plantCount,        setPlantCount]        = useState(() => load("eq_plants", {}));
  const [recycleCount,      setRecycleCount]      = useState(() => load("eq_recycle", {}));
  const [invasoraCount,      setInvasoraCount]     = useState(() => load("eq_invasora", 0));
  const [unlockedAch,        setUnlockedAch]       = useState(() => load("eq_achievements", []));

  // Ligas (Novedad)
  const [myLeagues,          setMyLeagues]         = useState(() => load("eq_leagues", ["Liga Global"]));
  const [leagueInput,        setLeagueInput]       = useState("");

  // Escáner
  const [scanning,    setScanning]    = useState(false);
  const [result,      setResult]      = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const fileInputRef = useRef(null);

  // Estados de edición de perfil
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName,       setTempName]       = useState(userName);
  const [tempAvatar,     setTempAvatar]     = useState(userAvatar);
  const [notification,   setNotification]   = useState(null);

  useEffect(() => { save("eq_points",       myPoints);       }, [myPoints]);
  useEffect(() => { save("eq_plants",       plantCount);    }, [plantCount]);
  useEffect(() => { save("eq_recycle",      recycleCount);  }, [recycleCount]);
  useEffect(() => { save("eq_invasora",     invasoraCount); }, [invasoraCount]);
  useEffect(() => { save("eq_achievements", unlockedAch);   }, [unlockedAch]);
  useEffect(() => { save("eq_username",      userName);      }, [userName]);
  useEffect(() => { save("eq_avatar",       userAvatar);    }, [userAvatar]);
  useEffect(() => { save("eq_usercode",     userCode);      }, [userCode]);
  useEffect(() => { save("eq_leagues",      myLeagues);     }, [myLeagues]);

  // Detector automático de logros fijos
  useEffect(() => {
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAch.includes(ach.id) && ach.check(plantCount, recycleCount, invasoraCount)) {
        setUnlockedAch(prev => {
          if (prev.includes(ach.id)) return prev;
          setMyPoints(pts => pts + ach.bonus);
          showNotif(`¡Logro Unlocked: ${ach.title}! (+${ach.bonus} pts)`, ach.emoji);
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setScanning(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("https://api.inaturalist.org/v1/computervision/score_image", {
        method: "POST",
        headers: { "Authorization": INAT_TOKEN },
        body: formData,
      });
      if (!res.ok) {
        setResult({ type: "error", message: `Error de servidor iNaturalist (${res.status}).` });
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
          inatImage:  taxon.default_photo?.medium_url || null,
          family:     familyName,
          observations: taxon.observations_count || 0,
          wikiInfo:   null,
        };

        setResult(parsed);
        setScanning(false);

        setPlantCount(prev => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
        if (isInvasora) setInvasoraCount(c => c + 1);
        addPoints(pts, name, "🌿");

        setLoadingInfo(true);
        const wikiInfo = await fetchWikiInfo(scientific, name, familyName);
        setResult(prev => prev ? { ...prev, wikiInfo } : prev);
        setLoadingInfo(false);

      } else {
        setResult({ type: "none", message: "No se detectó ninguna planta clara en la fotografía." });
        setScanning(false);
      }
    } catch (err) {
      setResult({ type: "error", message: "Error de conexión con la red." });
      setScanning(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRecycle = (item) => {
    setRecycleCount(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    addPoints(item.points, `Reciclé ${item.label}`, item.emoji);
  };

  const handleSaveProfile = () => {
    if(tempName.trim()) setUserName(tempName.trim());
    setUserAvatar(tempAvatar);
    setEditingProfile(false);
    showNotif("Perfil guardado correctamente", "👤");
  };

  const handleJoinLeague = (e) => {
    e.preventDefault();
    if(!leagueInput.trim()) return;
    const name = leagueInput.trim();
    if(myLeagues.includes(name)) {
      showNotif("Ya estás en esta liga", "⚠️");
    } else {
      setMyLeagues(prev => [...prev, name]);
      showNotif(`Te has unido a: ${name}`, "🛡️");
    }
    setLeagueInput("");
  };

  const uniquePlants  = Object.keys(plantCount).length;
  const totalRecycled = Object.values(recycleCount).reduce((a, b) => a + b, 0);
  const currentRank   = getRank(myPoints);
  const nextRank      = getNextRank(myPoints);
  const rankProgress  = nextRank ? ((myPoints - currentRank.min) / (nextRank.min - currentRank.min)) * 100 : 100;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#07121e 0%,#091b13 50%,#07121e 100%)", fontFamily: "system-ui, sans-serif", color: "#e8f5e9", position: "relative", paddingBottom: 120 }}>
      
      {notification && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#16a34a,#0d9488)", color:"white", borderRadius:50, padding:"12px 24px", fontWeight:"bold", fontSize:14, zIndex:9999, boxShadow:"0 8px 24px rgba(22,163,74,0.4)", animation:"slideIn .3s ease", display:"flex", alignItems:"center", gap:10, maxWidth:"90vw" }}>
          <span style={{ fontSize:18 }}>{notification.emoji}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      <div style={{ maxWidth:480, margin:"0 auto" }}>
        
        {/* TOP BAR / USER RESUMEN */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 20px 10px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:32, background:"rgba(255,255,255,0.08)", borderRadius:"50%", padding:6, width:44, height:44, display:"flex", alignItems:"center", justifyValue:"center" }}>{userAvatar}</span>
            <div>
              <div style={{ fontSize:14, fontWeight:"bold", color:"#fff" }}>{userName}</div>
              <div style={{ fontSize:11, color:currentRank.color, fontWeight:"600" }}>{currentRank.emoji} Rango {currentRank.name}</div>
            </div>
          </div>
          <div style={{ background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.3)", borderRadius:12, padding:"6px 12px", textAlign:"right" }}>
            <div style={{ fontSize:10, color:"#fbbf24", fontWeight:"bold" }}>PUNTOS TOTALES</div>
            <div style={{ fontSize:16, fontWeight:"900", color:"#fbbf24" }}>⭐ {myPoints}</div>
          </div>
        </div>

        {/* LOGO DE LA APP */}
        <div style={{ textAlign:"center", padding:"10px 0 20px" }}>
          <div style={{ fontSize:32, fontWeight:"900", letterSpacing:-1, background:"linear-gradient(135deg,#4ade80,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>🌿 EcoQuest</div>
        </div>

        {/* ════════════════ TAB CONTENIDOS ════════════════ */}
        
        {/* 1. COMPONENTE SCAN (PLANTAS) */}
        {tab==="scan" && (
          <div style={{ padding:"0 20px", animation:"fadeUp .3s ease" }}>
            <div onClick={() => fileInputRef.current?.click()} style={{ background:"rgba(255,255,255,0.02)", borderRadius:24, padding:30, border:"2px dashed rgba(74,222,128,0.25)", textAlign:"center", marginBottom:20, cursor:"pointer" }}>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display:"none" }} />
              {scanning ? (
                <>
                  <div style={{ fontSize:40, animation:"spin 1.5s linear infinite", display:"inline-block" }}>🧬</div>
                  <div style={{ marginTop:12, color:"#4ade80", fontSize:14, fontWeight:"600" }}>Analizando taxonomía vegetal...</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:48 }}>📸</div>
                  <div style={{ fontSize:15, fontWeight:"bold", color:"#4ade80", marginTop:10 }}>Fotografiar Planta / Árbol</div>
                  <div style={{ fontSize:11, color:"#86efac55", marginTop:4 }}>Identificación asistida por iNaturalist</div>
                </>
              )}
            </div>

            {result?.type==="plant" && (
              <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:20, padding:20, border:"1px solid rgba(255,255,255,0.06)", marginBottom:20 }}>
                <div style={{ display:"flex", gap:14, marginBottom:16 }}>
                  {result.inatImage ? (
                    <img src={result.inatImage} alt="" style={{ width:60, height:60, borderRadius:12, objectFit:"cover" }} />
                  ) : <div style={{ fontSize:40 }}>🌱</div>}
                  <div>
                    <div style={{ fontSize:18, fontWeight:"800", color:"#fff" }}>{result.name}</div>
                    <div style={{ fontSize:12, color:"#86efac77", fontStyle:"italic" }}>{result.scientific}</div>
                    <div style={{ marginTop:4 }}><span style={{ background:"rgba(74,222,128,0.15)", color:"#4ade80", fontSize:10, padding:"2px 8px", borderRadius:50, fontWeight:"bold" }}>{result.status}</span></div>
                  </div>
                </div>

                {loadingInfo ? (
                  <div style={{ fontSize:12, color:"#86efac66", textAlign:"center", padding:10 }}>Buscando especificaciones y curiosidades...</div>
                ) : result.wikiInfo ? (
                  <div>
                    <div style={{ fontSize:12, color:"#4ade80", fontWeight:"bold", marginBottom:8, letterSpacing:0.5 }}>📋 FICHA DE CUIDADOS</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                      <div style={{ background:"rgba(255,255,255,0.02)", padding:8, borderRadius:8, fontSize:11 }}>
                        <span style={{ color:"#86efac", display:"block", fontWeight:"bold", fontSize:9 }}>RIEGO</span> {result.wikiInfo.watering.split("(")[0]}
                      </div>
                      <div style={{ background:"rgba(255,255,255,0.02)", padding:8, borderRadius:8, fontSize:11 }}>
                        <span style={{ color:"#a78bfa", display:"block", fontWeight:"bold", fontSize:9 }}>FLORACIÓN</span> {result.wikiInfo.flowering}
                      </div>
                    </div>

                    {/* ── APARTADO SOLICITADO: CURIOSIDADES ── */}
                    <div style={{ background:"linear-gradient(135deg,rgba(34,211,238,0.08),rgba(74,222,128,0.04))", padding:"12px 14px", borderRadius:14, border:"1px solid rgba(34,211,238,0.2)", marginBottom:10 }}>
                      <div style={{ fontSize:12, color:"#22d3ee", fontWeight:"bold", marginBottom:6, display:"flex", alignItems:"center", gap:4 }}>💡 CURIOSIDADES BOTÁNICAS</div>
                      {result.wikiInfo.curiosities.map((cur, idx) => (
                        <div key={idx} style={{ fontSize:12, lineHeight:1.4, color:"#e8f5e9", marginBottom:idx===0?6:0, paddingLeft:10, position:"relative" }}>
                          <span style={{ position:"absolute", left:0, color:"#22d3ee" }}>•</span> {cur}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {uniquePlants > 0 && (
              <div>
                <div style={{ fontSize:11, color:"#86efac55", fontWeight:"bold", marginBottom:8 }}>COLECCIÓN DE ESPECIES ESCANEADAS ({uniquePlants})</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {Object.entries(plantCount).map(([name, qty]) => (
                    <span key={name} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:50, padding:"4px 12px", fontSize:12, color:"#fff" }}>
                      🌿 {name} <b style={{ color:"#4ade80" }}>x{qty}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. COMPONENTE RECICLAJE */}
        {tab==="recycle" && (
          <div style={{ padding:"0 20px", animation:"fadeUp .3s ease" }}>
            <div style={{ fontSize:11, color:"#86efac55", fontWeight:"bold", marginBottom:12 }}>REGISTRA TUS ACCIONES DE RECICLAJE</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {RECYCLE_ITEMS.map(item => (
                <div key={item.id} onClick={() => handleRecycle(item)} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${item.color}33`, borderRadius:16, padding:16, textAlign:"center", cursor:"pointer", transition:"transform 0.2s" }}>
                  <div style={{ fontSize:32 }}>{item.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:"bold", color:item.color, marginTop:4 }}>{item.label}</div>
                  <div style={{ fontSize:11, color:"#86efac55" }}>+{item.points} pts</div>
                  {recycleCount[item.id] > 0 && (
                    <div style={{ marginTop:6, background:`${item.color}22`, color:item.color, fontSize:11, fontWeight:"bold", padding:"2px 8px", borderRadius:50, display:"inline-block" }}>
                      Procesados: {recycleCount[item.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. COMPONENTE LOGROS Y RETOS SEMANALES */}
        {tab==="achievements" && (
          <div style={{ padding:"0 20px", animation:"fadeUp .3s ease" }}>
            
            {/* RETOS SEMANALES */}
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:12, color:"#22d3ee", fontWeight:"bold", marginBottom:10, letterSpacing:1 }}>📅 RETOS DE LA SEMANA</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {WEEKLY_CHALLENGES.map(w => {
                  const currentProgress = w.id === "w_1" ? (recycleCount["glass"] || 0) : uniquePlants;
                  const isDone = currentProgress >= w.target;
                  return (
                    <div key={w.id} style={{ background:"linear-gradient(135deg,rgba(34,211,238,0.08),transparent)", border:"1px solid rgba(34,211,238,0.15)", borderRadius:16, padding:14, display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:28 }}>{w.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:"bold", color:"#fff" }}>{w.title}</div>
                        <div style={{ fontSize:11, color:"#86efac77", marginTop:2 }}>{w.desc}</div>
                        <div style={{ height:4, background:"rgba(255,255,255,0.1)", borderRadius:2, marginTop:6 }}>
                          <div style={{ height:"100%", background:"#22d3ee", borderRadius:2, width:`${Math.min((currentProgress/w.target)*100, 100)}%` }} />
                        </div>
                        <div style={{ fontSize:10, color:"#22d3ee", marginTop:4 }}>Progreso: {currentProgress}/{w.target}</div>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <span style={{ display:"block", fontSize:11, fontWeight:"bold", color:isDone?"#4ade80":"#fbbf24" }}>{isDone?"¡Hecho!":`+${w.bonus}`}</span>
                        {!isDone && <span style={{ fontSize:9, color:"#fbbf24" }}>PTS</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LOGROS PERMANENTES */}
            <div>
              <div style={{ fontSize:12, color:"#a78bfa", fontWeight:"bold", marginBottom:10, letterSpacing:1 }}>🏆 MEDALLAS Y LOGROS PERMANENTES</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {ACHIEVEMENTS.map(ach => {
                  const unlocked = unlockedAch.includes(ach.id);
                  return (
                    <div key={ach.id} style={{ background:unlocked?"rgba(167,139,250,0.06)":"rgba(255,255,255,0.01)", border:unlocked?"1px solid rgba(167,139,250,0.3)":"1px solid rgba(255,255,255,0.04)", borderRadius:14, padding:12, display:"flex", alignItems:"center", gap:12, opacity:unlocked ? 1 : 0.5 }}>
                      <span style={{ fontSize:24, filter:unlocked?"none":"grayscale(100%)" }}>{ach.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:"bold", color:unlocked?"#fff":"#86efac55" }}>{ach.title}</div>
                        <div style={{ fontSize:11, color:"#86efac55" }}>{ach.desc}</div>
                      </div>
                      <span style={{ fontSize:11, fontWeight:"bold", color:"#a78bfa" }}>{unlocked ? "🔒 Desbloqueado" : `+${ach.bonus} pts`}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 4. COMPONENTE PERFIL Y LISTA DE RANGOS */}
        {tab==="profile" && (
          <div style={{ padding:"0 20px", animation:"fadeUp .3s ease" }}>
            
            {/* FICHA EDITABLE DE PERFIL */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:20, padding:20, marginBottom:20 }}>
              {editingProfile ? (
                <div>
                  <div style={{ fontSize:12, color:"#4ade80", fontWeight:"bold", marginBottom:6 }}>EDITAR NOMBRE:</div>
                  <input type="text" value={tempName} onChange={e=>setTempName(e.target.value)} style={{ width:"100%", background:"rgba(0,0,0,0.3)", border:"1px solid #4ade80", borderRadius:10, padding:"8px 12px", color:"#fff", fontSize:14, outline:"none", marginBottom:14 }} />
                  
                  <div style={{ fontSize:12, color:"#4ade80", fontWeight:"bold", marginBottom:6 }}>SELECCIONAR AVATAR ECOLÓGICO:</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:6, marginBottom:16 }}>
                    {AVATAR_OPTIONS.map(av => (
                      <span key={av} onClick={()=>setTempAvatar(av)} style={{ fontSize:22, padding:6, textAlign:"center", borderRadius:8, background:tempAvatar===av?"#16a34a":"rgba(255,255,255,0.03)", cursor:"pointer" }}>{av}</span>
                    ))}
                  </div>

                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={handleSaveProfile} style={{ flex:1, background:"linear-gradient(135deg,#16a34a,#0d9488)", border:"none", color:"#fff", padding:"8px 0", borderRadius:10, fontWeight:"bold", cursor:"pointer" }}>Guardar</button>
                    <button onClick={()=>{setEditingProfile(false); setTempName(userName); setTempAvatar(userAvatar);}} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", padding:"8px 14px", borderRadius:10, cursor:"pointer" }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:"center" }}>
                  <span style={{ fontSize:44, display:"inline-block", background:"rgba(255,255,255,0.05)", borderRadius:"50%", padding:12, marginBottom:10 }}>{userAvatar}</span>
                  <div style={{ fontSize:18, fontWeight:"bold", color:"#fff" }}>{userName}</div>
                  <div style={{ fontSize:11, color:"#86efac55", marginTop:2 }}>ID de Jugador: {userCode}</div>
                  <button onClick={()=>{setEditingProfile(true); setTempName(userName); setTempAvatar(userAvatar);}} style={{ marginTop:12, background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.3)", color:"#4ade80", padding:"4px 14px", borderRadius:8, fontSize:12, fontWeight:"bold", cursor:"pointer" }}>✏️ Editar Perfil</button>
                </div>
              )}
            </div>

            {/* ESCALAFÓN COMPLETO DE RANGOS */}
            <div>
              <div style={{ fontSize:12, color:"#fbbf24", fontWeight:"bold", marginBottom:10, letterSpacing:0.5 }}>📈 RANGOS DISPONIBLES EN ECOQUEST</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {RANKS.map(r => {
                  const isCurrent = currentRank.name === r.name;
                  return (
                    <div key={r.name} style={{ background:isCurrent ? `${r.color}15` : "rgba(255,255,255,0.01)", border:isCurrent ? `1px solid ${r.color}` : "1px solid rgba(255,255,255,0.04)", borderRadius:14, padding:12, display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:24 }}>{r.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:"bold", color:isCurrent?"#fff":r.color, display:"flex", alignItems:"center", gap:6 }}>
                          {r.name} {isCurrent && <span style={{ background:"#fbbf24", color:"#000", fontSize:9, padding:"1px 6px", borderRadius:4, fontWeight:"bold" }}>ACTUAL</span>}
                        </div>
                        <div style={{ fontSize:11, color:"#86efac55", marginTop:1 }}>{r.desc}</div>
                      </div>
                      <div style={{ fontSize:11, fontWeight:"bold", color:"#fff", minWidth:60, textAlign:"right" }}>{r.min} pts</div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 5. NUEVA PESTAÑA: LIGAS COMPETITIVAS */}
        {tab === "leagues" && (
          <div style={{ padding:"0 20px", animation:"fadeUp .3s ease" }}>
            
            {/* CÓDIGO PERSONAL */}
            <div style={{ background:"linear-gradient(135deg,rgba(241,191,36,0.1),transparent)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:16, padding:16, marginBottom:16, textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#fbbf24", fontWeight:"bold", letterSpacing:0.5 }}>TU CÓDIGO DE INVITACIÓN PERSONAL</div>
              <div style={{ fontSize:22, fontWeight:"900", color:"#fff", letterSpacing:2, margin:"4px 0" }}>{userCode}</div>
              <div style={{ fontSize:10, color:"#86efac55" }}>Compártelo con tus amigos para que se unan a tus clasificaciones.</div>
            </div>

            {/* FORMULARIO UNIRSE O CREAR */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:18, padding:16, marginBottom:20 }}>
              <form onSubmit={handleJoinLeague}>
                <div style={{ fontSize:12, color:"#4ade80", fontWeight:"bold", marginBottom:6 }}>CREAR O UNIRSE A UNA LIGA:</div>
                <div style={{ display:"flex", gap:8 }}>
                  <input type="text" placeholder="Introduce el nombre o código..." value={leagueInput} onChange={e=>setLeagueInput(e.target.value)} style={{ flex:1, background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"8px 12px", color:"#fff", fontSize:13, outline:"none" }} />
                  <button type="submit" style={{ background:"linear-gradient(135deg,#16a34a,#0d9488)", border:"none", color:"#fff", padding:"0 16px", borderRadius:10, fontWeight:"bold", fontSize:12, cursor:"pointer" }}>Entrar</button>
                </div>
              </form>
            </div>

            {/* MIS LIGAS ACTIVAS */}
            <div>
              <div style={{ fontSize:12, color:"#4ade80", fontWeight:"bold", marginBottom:8 }}>MIS LIGAS ACTIVAS</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {myLeagues.map((league, idx) => (
                  <div key={idx} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:14, padding:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:20 }}>🛡️</span>
                      <span style={{ fontSize:14, fontWeight:"bold", color:"#fff" }}>{league}</span>
                    </div>
                    <span style={{ fontSize:11, color:"#4ade80", background:"rgba(74,222,128,0.1)", padding:"2px 8px", borderRadius:4, fontWeight:"bold" }}>Tu Posición: #1</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* MENÚ DE NAVEGACIÓN INFERIOR TOTALMENTE ADAPTADO */}
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(7,18,30,0.92)", borderTop:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(12px)", zIndex:999 }}>
          <div style={{ maxWidth:480, margin:"0 auto", display:"flex", padding:"10px 10px 24px", gap:4 }}>
            {[
              { id:"scan",         label:"📸", title:"Plantas"  },
              { id:"recycle",      label:"♻️", title:"Reciclar" },
              { id:"achievements", label:"🏆", title:"Logros"   },
              { id:"profile",      label:"👤", title:"Perfil"   },
              { id:"leagues",      label:"🛡️", title:"Ligas"    },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:"8px 0 6px", borderRadius:12, border:"none", background:tab===t.id?"linear-gradient(135deg,#16a34a,#0d9488)":"transparent", color:tab===t.id?"white":"#86efac55", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                <span style={{ fontSize:18 }}>{t.label}</span>
                <span style={{ fontSize:10, fontWeight:tab===t.id?"700":"400" }}>{t.title}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ESTILOS CSS REUTILIZABLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideIn { from{transform:translateY(-40px); opacity:0} to{transform:translateY(0); opacity:1} }
        @keyframes fadeUp  { from{transform:translateY(12px); opacity:0} to{transform:translateY(0); opacity:1} }
      `}} />

    </div>
  );
}
