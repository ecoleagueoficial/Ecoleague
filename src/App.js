import { useState, useEffect, useRef } from "react";

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

const ACHIEVEMENTS = [
  { id: "first_plant",  title: "Primer Brote",      desc: "Identifica tu primera especie",      emoji: "🌱", bonus: 20,  check: (p)       => Object.keys(p).length >= 1 },
  { id: "plants_5",     title: "Explorador Verde",  desc: "Identifica 5 especies distintas",  emoji: "🔭", bonus: 50,  check: (p)       => Object.keys(p).length >= 5 },
  { id: "plants_12",    title: "Maestro Botánico",   desc: "Identifica 12 especies distintas", emoji: "🌿", bonus: 180, check: (p)       => Object.keys(p).length >= 12 },
  { id: "plants_25",    title: "Gran Naturalista",  desc: "Identifica 25 especies distintas", emoji: "🌳", bonus: 500, check: (p)       => Object.keys(p).length >= 25 },
  { id: "recycle_5",    title: "Eco-Consciente",    desc: "Recicla 5 objetos en total",       emoji: "♻️", bonus: 30,  check: (p,r)     => Object.values(r).reduce((a,b)=>a+b,0) >= 5 },
  { id: "recycle_25",   title: "Héroe del Contenedor", desc: "Recicla 25 objetos en total",    emoji: "🦸", bonus: 150, check: (p,r)     => Object.values(r).reduce((a,b)=>a+b,0) >= 25 },
  { id: "all_recycle",  title: "Reciclador Total",  desc: "Recicla al menos 1 de cada tipo",  emoji: "🏅", bonus: 100, check: (p,r)     => RECYCLE_ITEMS.every(i=>(r[i.id]||0)>=1) },
  { id: "invasora",     title: "Alerta Biológica",  desc: "Encuentra una planta invasora",    emoji: "🚨", bonus: 60,  check: (p,r,inv) => inv > 0 },
];

const WEEKLY_CHALLENGES = [
  { id: "w_1", title: "Operación Vidrio", desc: "Recicla 3 botellas o envases de vidrio esta semana", emoji: "🍾", target: 3, bonus: 40 },
  { id: "w_2", title: "Biodiversidad Urb", desc: "Registra 3 especies diferentes en tu entorno", emoji: "🌻", target: 3, bonus: 60 },
];

const SIMULATED_LEADERBOARD = [
  { name: "BioPaula🌱", points: 890, avatar: "🌸", league: "Plata" },
  { name: "ReciclaPro", points: 720, avatar: "🤖", league: "Plata" },
  { name: "EcoLucas01", points: 540, avatar: "🦊", league: "Plata" },
  { name: "NaturaKris", points: 410, avatar: "🦋", league: "Plata" },
  { name: "PlanetaVerde", points: 280, avatar: "🌳", league: "Plata" },
];

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

function getCompetitionLeague(points) {
  if (points >= 1200) return { name: "Oro", color: "#fbbf24", bg: "linear-gradient(135deg, #fbbf2422, #b4530911)", border: "#fbbf24cc", badge: "🥇" };
  if (points >= 350)  return { name: "Plata", color: "#cbd5e1", bg: "linear-gradient(135deg, #cbd5e122, #47556911)", border: "#cbd5e1cc", badge: "🥈" };
  return { name: "Bronce", color: "#b45309", bg: "linear-gradient(135deg, #b4530922, #78350f11)", border: "#b45309cc", badge: "🥉" };
}

function generateCareSpecs(commonName, scientificName, wikiExtract, family) {
  const text = (wikiExtract + " " + family + " " + commonName + " " + scientificName).toLowerCase();
  
  // Identificar si es planta u otro reino animal/hongo
  const isAnimal = text.includes("animal") || text.includes("ave") || text.includes("pájaro") || text.includes("insecto") || text.includes("mamífero") || text.includes("reptil") || text.includes("mariposa");
  const isHongo = text.includes("hongo") || text.includes("seta") || text.includes("micelio") || text.includes("espora");

  if (isAnimal) {
    return {
      leafType: "Fauna",
      watering: "No aplica (Organismo móvil autónomo)",
      flowering: "No aplica (Reino Animalia)",
      light: "Hábitat natural variable (Zonas boscosas, arbolado urbano o zonas ajardinadas)",
      soil: "No requiere sustrato (Requeres ecosistemas saludables con alimento disponible)",
      pests: "Amenazado por la pérdida de hábitat urbano, pesticidas químicos y contaminación lumínica",
      ecology: "Controlador biológico de plagas de insectos y pieza fundamental en la cadena trófica local",
      feature: "Especie animal detectada en el entorno ecológico urbano.",
      curiosities: [
        "A diferencia de las plantas, busca activamente refugio e interactúa dinámicamente con la flora de la ciudad.",
        "Su presencia indica un grado favorable de biodiversidad y salud ecológica en la cuadrícula urbana."
      ]
    };
  }

  if (isHongo) {
    return {
      leafType: "Fungi",
      watering: "Muy alto (Requiere humedad ambiental constante en madera o suelo en descomposición)",
      flowering: "No produce flores (Se reproduce por liberación masiva de esporas aéreas)",
      light: "Ambientes umbríos (Sombra completa, bosques densos o bajo la hojarasca protegida)",
      soil: "Materia orgánica muerta rico en celulosa, madera en descomposición o suelos húmedos",
      pests: "Sensible a las sequías prolongadas, cambios drásticos de temperatura y sustratos estériles",
      ecology: "Descomponedor principal del ecosistema. Recicla la materia orgánica volviéndola nutrientes para el suelo",
      feature: "Organismo del Reino Fungi vital para la fertilidad del suelo.",
      curiosities: [
        "La seta visible es solo el 'fruto'. El organismo real es una inmensa red subterránea llamada micelio.",
        "Establece simbiosis con las raíces de los árboles para transferirles agua a cambio de azúcares."
      ]
    };
  }

  // Configuración por defecto: Planta
  let watering = "Moderado (1 o 2 veces por semana, esperando a que seque el sustrato)";
  if (text.includes("cactus") || text.includes("suculenta") || text.includes("desiert") || text.includes("seco") || text.includes("crasa")) {
    watering = "Bajo (Solo cuando el suelo esté completamente seco, cada 10-15 días)";
  } else if (text.includes("tropical") || text.includes("humed") || text.includes("helecho") || text.includes("ribera") || text.includes("acuatic")) {
    watering = "Alto (Mantener sustrato húmedo constantemente constante, sin encharcar)";
  }

  let flowering = "Primavera y meses cálidos de Verano";
  if (text.includes("otoño")) flowering = "Finales de Verano y Otoño completo";
  if (text.includes("invierno")) flowering = "Meses fríos de Invierno y principios de Primavera";
  if (text.includes("no tiene flor") || text.includes("helecho") || text.includes("musgo") || text.includes("pino") || text.includes("conífera")) {
    flowering = "No produce flores (Se reproduce por esporas o piñas/conos)";
  }

  let light = "Semisombra o luz solar indirecta brillante (Ideal para evitar quemaduras)";
  if (text.includes("árbol") || text.includes("pino") || text.includes("roble") || text.includes("cactus") || text.includes("mediterrán") || text.includes("olivo") || text.includes("sol")) {
    light = "Pleno sol directo (Requiere alta radiación para fotosíntesis y desarrollo óptimo)";
  } else if (text.includes("interior") || text.includes("sombra") || text.includes("bosque denso")) {
    light = "Sombra protegida o ambientes interiores bien iluminados";
  }

  let soil = "Sustrato universal estándar rico en materia orgánica y con buen drenaje";
  if (text.includes("cactus") || text.includes("suculenta") || text.includes("arenos")) {
    soil = "Suelo poroso y arenoso (Mezcla con perlita o arena para evitar retención hídrica)";
  } else if (text.includes("árbol") || text.includes("profundo") || text.includes("arcill")) {
    soil = "Suelo arcilloso profundo, firme, fértil y capaz de retener nutrientes minerales";
  }

  let pests = "Pulgón verde, cochinilla algodonosa y hongos radiculares por exceso de agua";
  if (text.includes("árbol") || text.includes("pino") || text.includes("roble") || text.includes("leñosa")) {
    pests = "Orugas procesionarias, barrenadores de madera, barrenillo y hongos de corteza";
  } else if (text.includes("flor") || text.includes("rosa") || text.includes("huerto")) {
    pests = "Mosca blanca, araña roja, trips y mildiu / oídio en las hojas tiernas";
  }

  let ecology = "Atrae insectos polinizadores (abejas, mariposas) y cobija microfauna urbana";
  if (text.includes("árbol") || text.includes("bosque") || text.includes("grande")) {
    ecology = "Fuerte sumidero de carbono (CO₂), produce oxígeno masivo, mitiga el calor y da sombra térmica";
  } else if (text.includes("invasora") || text.includes("introducida")) {
    ecology = "Alerta: Puede competir agresivamente por los recursos desplazando a la flora autóctona local";
  }

  let feature = "Planta de gran valor ornamental y equilibrio ambiental.";
  if (wikiExtract) {
    const sentences = wikiExtract.split(/[.🧱]/);
    if (sentences.length > 1) {
      const candidate = sentences[1].trim().length > 30 ? sentences[1].trim() : sentences[0].trim();
      feature = candidate.endsWith(".") ? candidate : candidate + ".";
    }
  }

  let curiosities = [
    "Sus células contienen cloroplastos que realizan la fotosíntesis, liberando oxígeno vital a nuestra atmósfera.",
    "Forma complejas redes invisibles bajo tierra con hongos (micorrizas) para intercambiar nutrientes con sus vecinas."
  ];
  if (text.includes("cactus") || text.includes("suculenta")) {
    curiosities = [
      "Abre sus estomas únicamente por la noche (metabolismo CAM) para evitar perder agua por evaporación diurna.",
      "Sus espinas son en realidad hojas evolutivamente modificadas para protegerse y condensar el rocío."
    ];
  } else if (text.includes("árbol") || text.includes("pino") || text.includes("roble")) {
    curiosities = [
      "Un ejemplar maduro de este tipo puede absorber hasta 22 kg de dióxido de carbono gaseoso al año.",
      "Los anillos de su tronco no solo marcan su edad, sino también las condiciones climáticas históricas que sobrevivió."
    ];
  }

  return { leafType: "General", watering, flowering, light, soil, pests, ecology, feature, curiosities };
}

async function fetchWikiInfo(scientificName, commonName, family) {
  const queries = [scientificName, commonName].filter(Boolean);
  let rawExtract = "";
  let thumbnail = null;
  let wikiUrl = null;

  for (const q of queries) {
    try {
      const res = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.extract && data.extract.length > 30) {
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
  const [leagueSubTab, setLeagueSubTab] = useState("myLeague");

  const [userName, setUserName] = useState(() => load("eq_username", "Explorador Verde"));
  const [userAvatar, setUserAvatar] = useState(() => load("eq_avatar", "🌿"));
  const [userCode] = useState(() => load("eq_usercode", "EQ-" + Math.floor(100000 + Math.random() * 900000)));

  const [myPoints, setMyPoints] = useState(() => load("eq_points", 0));
  const [plantCount, setPlantCount] = useState(() => load("eq_plants", {}));
  const [recycleCount, setRecycleCount] = useState(() => load("eq_recycle", {}));
  const [invasoraCount, setInvasoraCount] = useState(() => load("eq_invasora", 0));
  const [unlockedAch, setUnlockedAch] = useState(() => load("eq_achievements", []));

  const [myLeagues, setMyLeagues] = useState(() => load("eq_leagues", ["Liga Vecinal"]));
  const [leagueInput, setLeagueInput] = useState("");

  const [chestWoodState, setChestWoodState] = useState(() => load("eq_chest_wood", "ready"));
  const [chestCrystalState, setChestCrystalState] = useState(() => load("eq_chest_crystal", "ready"));

  const [timeLeft, setTimeLeft] = useState("2d 11h 45m 23s");

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const fileInputRef = useRef(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [tempAvatar, setTempAvatar] = useState(userAvatar);
  const [notification, setNotification] = useState(null);

  useEffect(() => { save("eq_points", myPoints); }, [myPoints]);
  useEffect(() => { save("eq_plants", plantCount); }, [plantCount]);
  useEffect(() => { save("eq_recycle", recycleCount); }, [recycleCount]);
  useEffect(() => { save("eq_invasora", invasoraCount); }, [invasoraCount]);
  useEffect(() => { save("eq_achievements", unlockedAch); }, [unlockedAch]);
  useEffect(() => { save("eq_username", userName); }, [userName]);
  useEffect(() => { save("eq_avatar", userAvatar); }, [userAvatar]);
  useEffect(() => { save("eq_leagues", myLeagues); }, [myLeagues]);
  useEffect(() => { save("eq_chest_wood", chestWoodState); }, [chestWoodState]);
  useEffect(() => { save("eq_chest_crystal", chestCrystalState); }, [chestCrystalState]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = 23 - now.getHours();
      const minutes = 59 - now.getMinutes();
      const seconds = 59 - now.getSeconds();
      setTimeLeft(`1d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAch.includes(ach.id) && ach.check(plantCount, recycleCount, invasoraCount)) {
        setUnlockedAch(prev => {
          if (prev.includes(ach.id)) return prev;
          setMyPoints(pts => pts + ach.bonus);
          showNotif(`¡Logro Desbloqueado: ${ach.title}! (+${ach.bonus} pts)`, ach.emoji);
          return [...prev, ach.id];
        });
      }
    });
  }, [plantCount, recycleCount, invasoraCount, unlockedAch]);

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

      // SOLUCIÓN AL ESCÁNER: Agregado el parámetro obligatorio per_page=1 de iNaturalist
      const res = await fetch("https://api.inaturalist.org/v1/computervision/score_image?per_page=1", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Error del servidor (${res.status})`);
      }

      const data = await res.json();
      const top = data.results?.[0];

      if (top?.taxon) {
        const taxon = top.taxon;
        const name = taxon.preferred_common_name || taxon.name;
        const scientific = taxon.name;
        const score = Math.round((top.combined_score || 0) * 100);
        const pts = Math.min(60, Math.max(10, Math.round(score * 0.6)));
        const isInvasora = taxon.establishment_means?.establishment_means === "introduced";
        const familyName = taxon.family_name || null;

        setResult({
          type: "plant", name, scientific,
          origin: isInvasora ? "Introducida" : "Nativa",
          status: isInvasora ? "Invasora" : "Autóctona",
          points: pts,
          inatImage: taxon.default_photo?.medium_url || null,
          family: familyName,
          observations: taxon.observations_count || 0,
          wikiInfo: null,
        });

        setPlantCount(prev => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
        if (isInvasora) setInvasoraCount(c => c + 1);
        addPoints(pts, name, "🌿");

        setLoadingInfo(true);
        try {
          const wikiInfo = await fetchWikiInfo(scientific, name, familyName);
          setResult(prev => prev ? { ...prev, wikiInfo } : prev);
        } catch (e) {
          console.error("Error en Wiki:", e);
        }
        setLoadingInfo(false);
      } else {
        setResult({ type: "none", message: "No se identificó el espécimen. Asegura buena iluminación." });
      }
    } catch (err) {
      console.error(err);
      setResult({ type: "error", message: "Fallo de conexión o imagen corrupta. Reinténtalo." });
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRecycle = (item) => {
    setRecycleCount(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    addPoints(item.points, `Reciclé ${item.label}`, item.emoji);
  };

  const handleSaveProfile = () => {
    if (tempName.trim()) setUserName(tempName.trim());
    setUserAvatar(tempAvatar);
    setEditingProfile(false);
    showNotif("Perfil actualizado", "👤");
  };

  const handleJoinLeague = (e) => {
    e.preventDefault();
    if (!leagueInput.trim()) return;
    const name = leagueInput.trim();
    if (myLeagues.includes(name)) {
      showNotif("Ya perteneces a este grupo", "⚠️");
    } else {
      setMyLeagues(prev => [...prev, name]);
      showNotif(`Te has unido al grupo: ${name}`, "🛡️");
    }
    setLeagueInput("");
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(userCode);
    showNotif("¡Código copiado al portapapeles!", "📋");
  };

  const triggerOpenChest = (type) => {
    if (type === "wood") {
      if (chestWoodState !== "ready") return;
      setChestWoodState("animating");
      setTimeout(() => {
        setChestWoodState("opened");
        addPoints(50, "Cofre Ecológico de Madera", "🧰");
      }, 1200);
    } else {
      if (chestCrystalState !== "ready") return;
      setChestCrystalState("animating");
      setTimeout(() => {
        setChestCrystalState("opened");
        addPoints(150, "Cofre Legendario de Cristal", "💎");
      }, 1200);
    }
  };

  const uniquePlants = Object.keys(plantCount).length;
  const currentRank = getRank(myPoints);
  const nextRank = getNextRank(myPoints);
  const compLeague = getCompetitionLeague(myPoints);

  const combinedLeaderboard = [
    { name: `${userName} (Tú)`, points: myPoints, avatar: userAvatar, league: compLeague.name, isUser: true },
    ...SIMULATED_LEADERBOARD
  ].sort((a, b) => b.points - a.points);

  const userPosition = combinedLeaderboard.findIndex(item => item.isUser) + 1;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#060f19 0%,#081710 50%,#060f19 100%)", fontFamily: "system-ui, sans-serif", color: "#e8f5e9", paddingBottom: 130 }}>
      
      {notification && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#16a34a,#0d9488)", color:"white", borderRadius:50, padding:"12px 24px", fontWeight:"bold", fontSize:13, zIndex:9999, boxShadow:"0 8px 24px rgba(22,163,74,0.4)", display:"flex", alignItems:"center", gap:10, maxWidth:"90vw" }}>
          <span style={{ fontSize:18 }}>{notification.emoji}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      <div style={{ maxWidth:480, margin:"0 auto" }}>
        
        {/* BANNER DE USUARIO */}
        <div style={{ display:"flex", alignItems:"center", padding:"20px 20px 10px", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span onClick={() => { setTempName(userName); setTempAvatar(userAvatar); setEditingProfile(true); }} style={{ fontSize:28, background:"rgba(255,255,255,0.06)", borderRadius:"50%", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>{userAvatar}</span>
            <div>
              <div onClick={() => { setTempName(userName); setTempAvatar(userAvatar); setEditingProfile(true); }} style={{ fontSize:14, fontWeight:"bold", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                {userName} <span style={{ fontSize:10, color:"#86efac66" }}>✏️</span>
              </div>
              <div style={{ fontSize:11, color:currentRank.color, fontWeight:"600" }}>{currentRank.emoji} {currentRank.name}</div>
            </div>
          </div>
          <div style={{ background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.25)", borderRadius:12, padding:"6px 12px" }}>
            <div style={{ fontSize:9, color:"#fbbf24", fontWeight:"bold", textAlign:"center" }}>PUNTOS</div>
            <div style={{ fontSize:15, fontWeight:"900", color:"#fbbf24", textAlign:"center" }}>⭐ {myPoints}</div>
          </div>
        </div>

        <div style={{ textAlign:"center", padding:"10px 0 15px" }}>
          <div style={{ fontSize:30, fontWeight:"900", background:"linear-gradient(135deg,#4ade80,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>🌿 EcoQuest</div>
        </div>

        {/* MODAL EDICIÓN PERFIL */}
        {editingProfile && (
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:20, margin:"0 20px 20px", padding:16 }}>
            <div style={{ fontSize:12, fontWeight:"bold", color:"#4ade80", marginBottom:8 }}>EDITAR AVATAR Y APODO</div>
            <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} style={{ width:"100%", background:"rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:10, color:"#fff", fontSize:13, marginBottom:12, boxSizing:"border-box" }} placeholder="Nombre de explorador..." />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(8, 1fr)", gap:6, marginBottom:14 }}>
              {AVATAR_OPTIONS.map(av => (
                <span key={av} onClick={() => setTempAvatar(av)} style={{ fontSize:22, padding:4, textAlign:"center", cursor:"pointer", background: tempAvatar === av ? "rgba(74,222,128,0.2)" : "transparent", borderRadius:8 }}>{av}</span>
              ))}
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={() => setEditingProfile(false)} style={{ background:"transparent", border:"none", color:"#86efac44", fontSize:12, padding:"6px 12px", cursor:"pointer" }}>Cancelar</button>
              <button onClick={handleSaveProfile} style={{ background:"#16a34a", border:"none", color:"#fff", fontSize:12, padding:"6px 14px", borderRadius:8, fontWeight:"bold", cursor:"pointer" }}>Guardar</button>
            </div>
          </div>
        )}

        {/* ════════════════ PESTAÑAS PRINCIPALES ════════════════ */}
        
        {/* PESTAÑA 1: ESCÁNER / CÁMARA */}
        {tab === "scan" && (
          <div style={{ padding:"0 20px" }}>
            <div onClick={() => fileInputRef.current?.click()} style={{ background:"rgba(255,255,255,0.01)", borderRadius:24, padding:32, border:"2px dashed rgba(74,222,128,0.2)", textAlign:"center", marginBottom:20, cursor:"pointer" }}>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display:"none" }} />
              {scanning ? (
                <>
                  <div style={{ fontSize:36, display:"inline-block" }}>🧬</div>
                  <div style={{ marginTop:10, color:"#4ade80", fontSize:13, fontWeight:"600" }}>Analizando fotografía celular...</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:44 }}>📸</div>
                  <div style={{ fontSize:14, fontWeight:"bold", color:"#4ade80", marginTop:8 }}>Fotografiar Naturaleza Urbana</div>
                  <div style={{ fontSize:11, color:"#86efac44", marginTop:2 }}>Identifica plantas, animales, insectos y hongos</div>
                </>
              )}
            </div>

            {/* FICHA TÉCNICA REPARADA TRAS ESCANEO */}
            {result?.type === "plant" && (
              <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:20, padding:18, border:"1px solid rgba(255,255,255,0.06)", marginBottom:20 }}>
                <div style={{ display:"flex", gap:12, marginBottom:14 }}>
                  {result.inatImage ? (
                    <img src={result.inatImage} alt="" style={{ width:56, height:56, borderRadius:10, objectFit:"cover" }} />
                  ) : <div style={{ fontSize:36 }}>🌱</div>}
                  <div>
                    <div style={{ fontSize:16, fontWeight:"800", color:"#fff" }}>{result.name}</div>
                    <div style={{ fontSize:11, color:"#86efac66", fontStyle:"italic" }}>{result.scientific}</div>
                    <div style={{ marginTop:4 }}><span style={{ background:"rgba(74,222,128,0.12)", color:"#4ade80", fontSize:9, padding:"2px 8px", borderRadius:50, fontWeight:"bold" }}>{result.status}</span></div>
                  </div>
                </div>

                {loadingInfo ? (
                  <div style={{ fontSize:11, color:"#86efac44", textAlign:"center", padding:8 }}>Estructurando base de datos botánica...</div>
                ) : result.wikiInfo ? (
                  <div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                      
                      <div style={{ background:"rgba(255,255,255,0.02)", padding:"10px 12px", borderRadius:10, borderLeft:"3px solid #22d3ee" }}>
                        <span style={{ color:"#22d3ee", fontWeight:"bold", fontSize:10, display:"block", letterSpacing:0.5 }}>💧 REQUERIMIENTO HÍDRICO / RIEGO</span>
                        <span style={{ fontSize:12, color:"#e8f5e9" }}>{result.wikiInfo.watering}</span>
                      </div>

                      <div style={{ background:"rgba(255,255,255,0.02)", padding:"10px 12px", borderRadius:10, borderLeft:"3px solid #a78bfa" }}>
                        <span style={{ color:"#a78bfa", fontWeight:"bold", fontSize:10, display:"block", letterSpacing:0.5 }}>🌸 ÉPOCA DE FLORACIÓN / MADUREZ</span>
                        <span style={{ fontSize:12, color:"#e8f5e9" }}>{result.wikiInfo.flowering}</span>
                      </div>

                      <div style={{ background:"rgba(255,255,255,0.02)", padding:"10px 12px", borderRadius:10, borderLeft:"3px solid #fbbf24" }}>
                        <span style={{ color:"#fbbf24", fontWeight:"bold", fontSize:10, display:"block", letterSpacing:0.5 }}>☀️ LUZ Y EXPOSICIÓN SOLAR</span>
                        <span style={{ fontSize:12, color:"#e8f5e9" }}>{result.wikiInfo.light}</span>
                      </div>

                      <div style={{ background:"rgba(255,255,255,0.02)", padding:"10px 12px", borderRadius:10, borderLeft:"3px solid #f59e0b" }}>
                        <span style={{ color:"#f59e0b", fontWeight:"bold", fontSize:10, display:"block", letterSpacing:0.5 }}>🌱 TIPO DE SUELO E IDEAL DE SUSTRATO</span>
                        <span style={{ fontSize:12, color:"#e8f5e9" }}>{result.wikiInfo.soil}</span>
                      </div>

                      <div style={{ background:"rgba(255,255,255,0.02)", padding:"10px 12px", borderRadius:10, borderLeft:"3px solid #f87171" }}>
                        <span style={{ color:"#f87171", fontWeight:"bold", fontSize:10, display:"block", letterSpacing:0.5 }}>🐛 AMENAZAS Y PLAGAS COMUNES</span>
                        <span style={{ fontSize:12, color:"#e8f5e9" }}>{result.wikiInfo.pests}</span>
                      </div>

                      <div style={{ background:"rgba(255,255,255,0.02)", padding:"10px 12px", borderRadius:10, borderLeft:"3px solid #4ade80" }}>
                        <span style={{ color:"#4ade80", fontWeight:"bold", fontSize:10, display:"block", letterSpacing:0.5 }}>🌍 BENEFICIO ECOLÓGICO</span>
                        <span style={{ fontSize:12, color:"#e8f5e9" }}>{result.wikiInfo.ecology}</span>
                      </div>
                    </div>

                    <div style={{ background:"linear-gradient(135deg,rgba(34,211,238,0.06),rgba(74,222,128,0.02))", padding:12, borderRadius:12, border:"1px solid rgba(34,211,238,0.15)" }}>
                      <div style={{ fontSize:11, color:"#22d3ee", fontWeight:"bold", marginBottom:6 }}>💡 SABÍAS QUE...</div>
                      {result.wikiInfo.curiosities.map((cur, i) => (
                        <div key={i} style={{ fontSize:11, lineHeight:1.4, color:"#d1e7dd", marginBottom:i===0?6:0, paddingLeft:8, position:"relative" }}>
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
                <div style={{ fontSize:11, color:"#86efac44", fontWeight:"bold", marginBottom:6 }}>HISTORIAL DE ESPECIES DETECTADAS ({uniquePlants})</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {Object.entries(plantCount).map(([name, qty]) => (
                    <span key={name} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:50, padding:"4px 10px", fontSize:11, color:"#fff" }}>
                      🌿 {name} <b style={{ color:"#4ade80" }}>x{qty}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: RECICLAJE */}
        {tab === "recycle" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ fontSize:11, color:"#86efac44", fontWeight:"bold", marginBottom:10 }}>SELECCIONA TU ACCIÓN ECO</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {RECYCLE_ITEMS.map(item => (
                <div key={item.id} onClick={() => handleRecycle(item)} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${item.color}22`, borderRadius:16, padding:14, textAlign:"center", cursor:"pointer" }}>
                  <div style={{ fontSize:28 }}>{item.emoji}</div>
                  <div style={{ fontSize:12, fontWeight:"bold", color:item.color, marginTop:2 }}>{item.label}</div>
                  <div style={{ fontSize:10, color:"#86efac44" }}>+{item.points} pts</div>
                  {recycleCount[item.id] > 0 && (
                    <div style={{ marginTop:4, background:`${item.color}15`, color:item.color, fontSize:10, fontWeight:"bold", padding:"1px 6px", borderRadius:50, display:"inline-block" }}>
                      Aportados: {recycleCount[item.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: RETOS Y LOGROS (RESTAURADO) */}
        {tab === "achievements" && (
          <div style={{ padding:"0 20px" }}>
            
            {/* RETOS SEMANALES */}
            <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:16, padding:14, border:"1px solid rgba(251,191,36,0.15)", marginBottom:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:11, color:"#fbbf24", fontWeight:"bold" }}>⏱️ RETOS DE LA COMUNIDAD SEMANAL</span>
                <span style={{ fontSize:11, color:"#f87171", fontWeight:"bold" }}>Termina en: {timeLeft}</span>
              </div>
              {WEEKLY_CHALLENGES.map(w => {
                const currentProgress = w.id === "w_1" ? (recycleCount["glass"] || 0) : uniquePlants;
                const pct = Math.min(100, Math.round((currentProgress / w.target) * 100));
                return (
                  <div key={w.id} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                      <span>{w.emoji} {w.title} <span style={{ color:"#86efac44" }}>({w.desc})</span></span>
                      <span style={{ fontWeight:"bold" }}>{currentProgress}/{w.target} ({pct}%)</span>
                    </div>
                    <div style={{ height:6, background:"rgba(255,255,255,0.05)", borderRadius:10, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background: pct === 100 ? "#4ade80" : "linear-gradient(90deg, #fbbf24, #4ade80)" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RECOMPENSAS / COFRES */}
            <div style={{ fontSize:11, color:"#86efac44", fontWeight:"bold", marginBottom:10 }}>COFRES DE RECOMPENSA ACTIVOS</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
              
              <div onClick={() => triggerOpenChest("wood")} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(139,115,85,0.2)", padding:14, borderRadius:16, textAlign:"center", cursor: chestWoodState==="ready"?"pointer":"default" }}>
                <div style={{ fontSize:32 }}>{chestWoodState==="opened"?"🧰" : chestWoodState==="animating"?"⏳":"📦"}</div>
                <div style={{ fontSize:12, fontWeight:"bold", color:"#a16207", marginTop:2 }}>Cofre de Madera</div>
                <button disabled={chestWoodState!=="ready"} style={{ marginTop:6, background:chestWoodState==="ready"?"#a16207":"rgba(255,255,255,0.05)", border:"none", borderRadius:8, color:"#fff", fontSize:10, padding:"4px 10px", fontWeight:"bold", cursor:"pointer" }}>
                  {chestWoodState==="ready"?"RECLAMAR 50 Pts" : chestWoodState==="animating"?"Abriendo...":"Abierto ✅"}
                </button>
              </div>

              <div onClick={() => triggerOpenChest("crystal")} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(34,211,238,0.2)", padding:14, borderRadius:16, textAlign:"center", cursor: chestCrystalState==="ready"?"pointer":"default" }}>
                <div style={{ fontSize:32 }}>{chestCrystalState==="opened"?"💎" : chestCrystalState==="animating"?"⏳":"🔮"}</div>
                <div style={{ fontSize:12, fontWeight:"bold", color:"#22d3ee", marginTop:2 }}>Cofre de Cristal</div>
                <button disabled={chestCrystalState!=="ready"} style={{ marginTop:6, background:chestCrystalState==="ready"?"#0891b2":"rgba(255,255,255,0.05)", border:"none", borderRadius:8, color:"#fff", fontSize:10, padding:"4px 10px", fontWeight:"bold", cursor:"pointer" }}>
                  {chestCrystalState==="ready"?"RECLAMAR 150 Pts" : chestCrystalState==="animating"?"Abriendo...":"Abierto ✅"}
                </button>
              </div>

            </div>

            {/* LOGROS */}
            <div style={{ fontSize:11, color:"#86efac44", fontWeight:"bold", marginBottom:10 }}>LOGROS DE EXPLORACIÓN</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {ACHIEVEMENTS.map(ach => {
                const isUnlocked = unlockedAch.includes(ach.id);
                return (
                  <div key={ach.id} style={{ display:"flex", alignItems:"center", gap:12, background:isUnlocked ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.01)", border:isUnlocked ? "1px solid rgba(74,222,128,0.15)" : "1px solid rgba(255,255,255,0.03)", padding:12, borderRadius:14 }}>
                    <span style={{ fontSize:24, filter: isUnlocked ? "none" : "grayscale(1)" }}>{ach.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:"bold", color: isUnlocked ? "#fff" : "#e8f5e966" }}>{ach.title}</div>
                      <div style={{ fontSize:11, color:"#86efac44" }}>{ach.desc}</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:"bold", color: isUnlocked ? "#4ade80" : "#86efac22" }}>+{ach.bonus} pts</span>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* PESTAÑA 4: COMPETICIÓN / LIGAS (RESTAURADO) */}
        {tab === "leagues" && (
          <div style={{ padding:"0 20px" }}>
            
            <div style={{ display:"flex", background:"rgba(0,0,0,0.2)", borderRadius:12, padding:4, marginBottom:16 }}>
              <button onClick={() => setLeagueSubTab("myLeague")} style={{ flex:1, background: leagueSubTab === "myLeague" ? "rgba(255,255,255,0.06)" : "transparent", border:"none", borderRadius:8, color: leagueSubTab === "myLeague" ? "#fff" : "#86efac44", fontSize:11, fontWeight:"bold", padding:"8px 0", cursor:"pointer" }}>Mi División Global</button>
              <button onClick={() => setLeagueSubTab("groups")} style={{ flex:1, background: leagueSubTab === "groups" ? "rgba(255,255,255,0.06)" : "transparent", border:"none", borderRadius:8, color: leagueSubTab === "groups" ? "#fff" : "#86efac44", fontSize:11, fontWeight:"bold", padding:"8px 0", cursor:"pointer" }}>Grupos / Aulas</button>
            </div>

            {leagueSubTab === "myLeague" ? (
              <div style={{ background: compLeague.bg, border:`1px solid ${compLeague.border}`, borderRadius:20, padding:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:"bold", color:compLeague.color }}>RANGO COMPETITIVO ACTUAL</div>
                    <div style={{ fontSize:20, fontWeight:"900", color:"#fff" }}>{compLeague.badge} Liga de {compLeague.name}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, color:"#86efac44" }}>Tu Posición</div>
                    <div style={{ fontSize:18, fontWeight:"900", color:"#4ade80" }}>#{userPosition}º de 6</div>
                  </div>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {combinedLeaderboard.map((user, idx) => (
                    <div key={idx} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:10, background: user.isUser ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.01)" }}>
                      <span style={{ fontSize:12, fontWeight:"bold", width:16, color: idx===0?"#fbbf24":idx===1?"#cbd5e1":"#86efac44" }}>{idx+1}</span>
                      <span style={{ fontSize:18 }}>{user.avatar}</span>
                      <span style={{ flex:1, fontSize:12, fontWeight: user.isUser?"bold":"normal", color:user.isUser?"#fff":"#e8f5e9" }}>{user.name}</span>
                      <span style={{ fontSize:12, fontWeight:"900", color: user.isUser?"#4ade80":"#fbbf24" }}>{user.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <form onSubmit={handleJoinLeague} style={{ display:"flex", gap:8, marginBottom:16 }}>
                  <input type="text" value={leagueInput} onChange={e => setLeagueInput(e.target.value)} placeholder="Código o Nombre de Aula/Grupo..." style={{ flex:1, background:"rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", color:"#fff", fontSize:12 }} />
                  <button type="submit" style={{ background:"#16a34a", color:"#fff", border:"none", borderRadius:10, padding:"0 16px", fontWeight:"bold", fontSize:12, cursor:"pointer" }}>Unirse</button>
                </form>

                <div style={{ background:"rgba(255,255,255,0.02)", padding:14, borderRadius:16, marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#86efac44", fontWeight:"bold", marginBottom:4 }}>TU CÓDIGO DE INVITACIÓN</div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(0,0,0,0.2)", padding:"8px 12px", borderRadius:10 }}>
                    <code style={{ fontSize:13, color:"#22d3ee", fontWeight:"bold" }}>{userCode}</code>
                    <button onClick={copyCodeToClipboard} style={{ background:"transparent", border:"none", color:"#4ade80", fontSize:11, fontWeight:"bold", cursor:"pointer" }}>Copiar</button>
                  </div>
                </div>

                <div style={{ fontSize:11, color:"#86efac44", fontWeight:"bold", marginBottom:6 }}>MIS COMUNIDADES ACTIVAS</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {myLeagues.map(group => (
                    <div key={group} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.02)", padding:"10px 14px", borderRadius:12, border:"1px solid rgba(255,255,255,0.03)" }}>
                      <span style={{ fontSize:13, fontWeight:"bold" }}>🛡️ {group}</span>
                      <span style={{ background:"rgba(34,211,238,0.1)", color:"#22d3ee", fontSize:10, padding:"2px 8px", borderRadius:50, fontWeight:"bold" }}>Sincronizado</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* MENÚ DE NAVEGACIÓN INFERIOR RESTAURADO */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(6,15,25,0.85)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(255,255,255,0.05)", padding:"12px 0", zIndex:999 }}>
        <div style={{ maxWidth:480, margin:"0 auto", display:"flex", justifyContent:"space-around" }}>
          <button onClick={() => setTab("scan")} style={{ background:"none", border:"none", color: tab === "scan" ? "#4ade80" : "#86efac44", fontSize:12, fontWeight:"bold", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:20 }}>📸</span>Escáner
          </button>
          <button onClick={() => setTab("recycle")} style={{ background:"none", border:"none", color: tab === "recycle" ? "#4ade80" : "#86efac44", fontSize:12, fontWeight:"bold", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:20 }}>♻️</span>Reciclar
          </button>
          <button onClick={() => setTab("achievements")} style={{ background:"none", border:"none", color: tab === "achievements" ? "#4ade80" : "#86efac44", fontSize:12, fontWeight:"bold", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:20 }}>🏅</span>Premios
          </button>
          <button onClick={() => setTab("leagues")} style={{ background:"none", border:"none", color: tab === "leagues" ? "#4ade80" : "#86efac44", fontSize:12, fontWeight:"bold", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:20 }}>🛡️</span>Ligas
          </button>
        </div>
      </div>

    </div>
  );
}
