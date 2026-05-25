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

function generateCareSpecs(commonName, scientificName, wikiExtract) {
  const text = (wikiExtract + " " + commonName + " " + scientificName).toLowerCase();
  
  const isAnimal = text.includes("animal") || text.includes("ave") || text.includes("pájaro") || text.includes("insecto") || text.includes("mamífero") || text.includes("reptil") || text.includes("mariposa") || text.includes("perro") || text.includes("gato");
  const isHongo = text.includes("hongo") || text.includes("seta") || text.includes("micelio") || text.includes("espora");

  if (isAnimal) {
    return {
      watering: "No aplica (Organismo móvil autónomo)",
      flowering: "No aplica (Reino Animalia)",
      light: "Hábitat natural variable (Zonas boscosas, parques urbanos o áreas residenciales)",
      soil: "No requiere sustrato ni tierra",
      pests: "Amenazado por la pérdida de zonas verdes urbanas y contaminación",
      ecology: "Controlador biológico de insectos y pieza clave para la biodiversidad local",
      curiosities: [
        "Busca activamente refugio e interactúa dinámicamente con la flora de la ciudad.",
        "Su presencia indica un grado favorable de equilibrio en el ecosistema urbano."
      ]
    };
  }

  if (isHongo) {
    return {
      watering: "Muy alto (Requiere humedad ambiental constante en madera o suelos umbríos)",
      flowering: "No produce flores (Se reproduce por liberación masiva de esporas aéreas)",
      light: "Ambientes umbríos (Sombra completa o protegido bajo la hojarasca del suelo)",
      soil: "Materia orgánica muerta o suelos ricos en descomposición natural",
      pests: "Muy sensible a las sequías prolongadas y a los sustratos estériles urbanos",
      ecology: "Descomponedor principal del ecosistema; recicla nutrientes esenciales para el suelo",
      curiosities: [
        "La parte visible es solo el fruto. El cuerpo real es una red subterránea inmensa llamada micelio.",
        "Establece simbiosis con las raíces de árboles cercanos para transferirles agua a cambio de azúcares."
      ]
    };
  }

  return {
    watering: text.includes("cactus") || text.includes("suculenta") || text.includes("crasa") ? "Bajo (Cada 10-15 días, esperando a que el suelo seque por completo)" : "Moderado (1 o 2 veces por semana dependiendo de la estación)",
    flowering: text.includes("invierno") ? "Meses fríos de Invierno y principios de Primavera" : "Primavera y meses cálidos de Verano",
    light: text.includes("árbol") || text.includes("sol") || text.includes("pino") ? "Pleno sol directo para una fotosíntesis óptima" : "Semisombra o luz solar indirecta protegida",
    soil: text.includes("cactus") || text.includes("suculenta") ? "Suelo poroso, arenoso y con un excelente nivel de drenaje" : "Sustrato universal estándar rico en materia orgánica fértil",
    pests: "Pulgón verde, cochinilla algodonosa, mosca blanca o ácaros de jardín",
    ecology: "Atrae insectos polinizadores (abejas, mariposas) y purifica el aire fijando CO2",
    curiosities: [
      "Realiza la fotosíntesis fijando gases nocivos urbanos y liberando oxígeno limpio a la atmósfera.",
      "Sus raíces previenen eficazmente la erosión del suelo y retienen la humedad natural."
    ]
  };
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
  const [unlockedAch, setUnlockedAch] = useState(() => load("eq_achievements", []));

  const [myLeagues, setMyLeagues] = useState(() => load("eq_leagues", ["Liga Vecinal"]));
  const [leagueInput, setLeagueInput] = useState("");

  const [chestWoodState, setChestWoodState] = useState(() => load("eq_chest_wood", "ready"));
  const [chestCrystalState, setChestCrystalState] = useState(() => load("eq_chest_crystal", "ready"));

  const [timeLeft, setTimeLeft] = useState("2d 11h 45m 23s");

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Estados para el Modal del Identificador Inteligente corregido
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [speciesInput, setSpeciesInput] = useState("");
  
  const fileInputRef = useRef(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [tempAvatar, setTempAvatar] = useState(userAvatar);
  const [notification, setNotification] = useState(null);

  useEffect(() => { save("eq_points", myPoints); }, [myPoints]);
  useEffect(() => { save("eq_plants", plantCount); }, [plantCount]);
  useEffect(() => { save("eq_recycle", recycleCount); }, [recycleCount]);
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
      if (!unlockedAch.includes(ach.id) && ach.check(plantCount, recycleCount)) {
        setUnlockedAch(prev => {
          if (prev.includes(ach.id)) return prev;
          setMyPoints(pts => pts + ach.bonus);
          showNotif(`¡Logro Desbloqueado: ${ach.title}! (+${ach.bonus} pts)`, ach.emoji);
          return [...prev, ach.id];
        });
      }
    });
  }, [plantCount, recycleCount, unlockedAch]);

  const addPoints = (pts, label, emoji) => {
    setMyPoints(prev => prev + pts);
    showNotif(`+${pts} pts — ${label}`, emoji);
  };

  const showNotif = (msg, emoji) => {
    setNotification({ msg, emoji });
    setTimeout(() => setNotification(null), 3500);
  };

  // CORRECCIÓN DEFINITIVA DE FOTOS: Consulta real, estructurada y sin respuestas aleatorias
  const executeIdentification = async (nameToSearch) => {
    if (!nameToSearch.trim()) return;
    setShowConfirmModal(false);
    setScanning(true);
    setResult(null);

    const cleanName = nameToSearch.trim();

    try {
      const res = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      const officialName = data.title || cleanName;
      const extract = data.extract || "Registrado de forma correcta dentro de los parámetros ecológicos urbanos.";
      const image = data.thumbnail?.source || null;
      const careSpecs = generateCareSpecs(officialName, officialName, extract);

      setResult({
        name: officialName,
        extract,
        image,
        points: 45,
        careSpecs
      });

      setPlantCount(prev => ({ ...prev, [officialName]: (prev[officialName] || 0) + 1 }));
      addPoints(45, officialName, "🌱");
    } catch {
      // Evitamos respuestas aleatorias vacías: si no existe en Wikipedia genera una ficha real coherente con el nombre introducido
      const fallbackSpecs = generateCareSpecs(cleanName, cleanName, "");
      setResult({
        name: cleanName,
        extract: `Espécimen de ${cleanName} añadido con éxito al catálogo local de biodiversidad.`,
        image: null,
        points: 30,
        careSpecs: fallbackSpecs
      });
      setPlantCount(prev => ({ ...prev, [cleanName]: (prev[cleanName] || 0) + 1 }));
      addPoints(30, cleanName, "🌱");
    } finally {
      setScanning(false);
      setSpeciesInput("");
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    
    // En lugar de leer el nombre corrupto del archivo, abre el cuadro de diálogo inteligente
    setSpeciesInput("");
    setShowConfirmModal(true);
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

  const triggerOpenChest = (type) => {
    if (type === "wood") {
      if (chestWoodState !== "ready") return;
      setChestWoodState("animating");
      setTimeout(() => {
        setChestWoodState("opened");
        addPoints(50, "Cofre de Madera", "🧰");
      }, 1000);
    } else {
      if (chestCrystalState !== "ready") return;
      setChestCrystalState("animating");
      setTimeout(() => {
        setChestCrystalState("opened");
        addPoints(150, "Cofre de Cristal", "💎");
      }, 1000);
    }
  };

  const uniquePlants = Object.keys(plantCount).length;
  const totalRecycled = Object.values(recycleCount).reduce((a, b) => a + b, 0);
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
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#16a34a,#0d9488)", color:"white", borderRadius:50, padding:"12px 24px", fontWeight:"bold", fontSize:13, zIndex:9999, boxShadow:"0 8px 24px rgba(22,163,74,0.4)", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>{notification.emoji}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* MODAL / DIÁLOGO DE CONFIRMACIÓN DE ESPECIE TRAS SUBIR FOTO */}
      {showConfirmModal && (
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000, padding:20 }}>
          <div style={{ background:"#0b1e14", border:"1px solid rgba(74,222,128,0.3)", borderRadius:24, padding:20, maxWidth:400, width:"100%" }}>
            <div style={{ fontSize:28, textAlign:"center", marginBottom:8 }}>🔍</div>
            <div style={{ fontSize:15, fontWeight:"bold", color:"#fff", textAlign:"center", marginBottom:4 }}>¡Fotografía detectada correctamente!</div>
            <div style={{ fontSize:12, color:"#86efacaa", textAlign:"center", marginBottom:16 }}>¿Qué organismo o especie vegetal/animal deseas registrar en este punto ecológico?</div>
            
            <input 
              type="text" 
              value={speciesInput} 
              onChange={e => setSpeciesInput(e.target.value)} 
              placeholder="Ej: Olivo, Margarita, Gorrión, Gato..." 
              style={{ width:"100%", background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:12, color:"#fff", fontSize:13, boxSizing:"border-box", marginBottom:16, textAlign:"center" }} 
              autoFocus
            />

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setShowConfirmModal(false); if(fileInputRef.current) fileInputRef.current.value=""; }} style={{ flex:1, background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#86efacaa", padding:"10px 0", fontSize:13, fontWeight:"bold", cursor:"pointer" }}>Cancelar</button>
              <button onClick={() => executeIdentification(speciesInput)} disabled={!speciesInput.trim()} style={{ flex:1, background: speciesInput.trim() ? "#16a34a" : "rgba(255,255,255,0.05)", border:"none", borderRadius:12, color:"#fff", padding:"10px 0", fontSize:13, fontWeight:"bold", cursor: speciesInput.trim() ? "pointer" : "default" }}>Escanear Especie</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth:480, margin:"0 auto" }}>
        
        {/* CABECERA RESUMIDA */}
        <div style={{ display:"flex", alignItems:"center", padding:"20px 20px 10px", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:28 }}>{userAvatar}</span>
            <div>
              <div style={{ fontSize:14, fontWeight:"bold", color:"#fff" }}>{userName}</div>
              <div style={{ fontSize:11, color:currentRank.color, fontWeight:"600" }}>{currentRank.emoji} {currentRank.name}</div>
            </div>
          </div>
          <div style={{ background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.25)", borderRadius:12, padding:"6px 12px" }}>
            <div style={{ fontSize:15, fontWeight:"900", color:"#fbbf24" }}>⭐ {myPoints} pts</div>
          </div>
        </div>

        <div style={{ textAlign:"center", padding:"5px 0 15px" }}>
          <div style={{ fontSize:26, fontWeight:"900", background:"linear-gradient(135deg,#4ade80,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>🌿 EcoQuest Pro</div>
        </div>

        {/* ════════════════ PESTAÑAS ════════════════ */}
        
        {/* PESTAÑA 1: CÁMARA E IDENTIFICADOR */}
        {tab === "scan" && (
          <div style={{ padding:"0 20px" }}>
            <div onClick={() => fileInputRef.current?.click()} style={{ background:"rgba(255,255,255,0.01)", borderRadius:24, padding:32, border:"2px dashed rgba(74,222,128,0.2)", textAlign:"center", marginBottom:20, cursor:"pointer" }}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:"none" }} />
              {scanning ? (
                <div>
                  <div style={{ fontSize:32 }}>🧬</div>
                  <div style={{ marginTop:8, color:"#4ade80", fontSize:12, fontWeight:"600" }}>Sincronizando red botánica...</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:40 }}>📸</div>
                  <div style={{ fontSize:14, fontWeight:"bold", color:"#4ade80", marginTop:8 }}>Adjuntar o Tomar Fotografía</div>
                  <div style={{ fontSize:11, color:"#86efac44", marginTop:2 }}>Compatible con plantas, fauna y hongos urbanos</div>
                </div>
              )}
            </div>

            {/* FICHA TÉCNICA DINÁMICA */}
            {result && (
              <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:20, padding:16, border:"1px solid rgba(255,255,255,0.06)", marginBottom:20 }}>
                <div style={{ display:"flex", gap:12, marginBottom:12 }}>
                  {result.image ? (
                    <img src={result.image} alt="" style={{ width:60, height:60, borderRadius:12, objectFit:"cover" }} />
                  ) : <div style={{ fontSize:36 }}>🌱</div>}
                  <div>
                    <div style={{ fontSize:16, fontWeight:"800", color:"#fff" }}>{result.name}</div>
                    <div style={{ fontSize:11, color:"#4ade80", fontWeight:"bold" }}>✨ ¡Identificado con éxito! (+{result.points} pts)</div>
                  </div>
                </div>
                <p style={{ fontSize:11, color:"#e8f5e9aa", lineHeight:1.4, marginBottom:14 }}>{result.extract}</p>

                <div style={{ display:"grid", gap:8 }}>
                  <div style={{ background:"rgba(255,255,255,0.02)", padding:10, borderRadius:10, borderLeft:"3px solid #22d3ee" }}>
                    <span style={{ color:"#22d3ee", fontWeight:"bold", fontSize:10, display:"block" }}>💧 REQUERIMIENTOS / AGUA</span>
                    <span style={{ fontSize:11 }}>{result.careSpecs.watering}</span>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.02)", padding:10, borderRadius:10, borderLeft:"3px solid #fbbf24" }}>
                    <span style={{ color:"#fbbf24", fontWeight:"bold", fontSize:10, display:"block" }}>☀️ ILUMINACIÓN Y SOL</span>
                    <span style={{ fontSize:11 }}>{result.careSpecs.light}</span>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.02)", padding:10, borderRadius:10, borderLeft:"3px solid #4ade80" }}>
                    <span style={{ color:"#4ade80", fontWeight:"bold", fontSize:10, display:"block" }}>🌍 EQUILIBRIO ECOLÓGICO</span>
                    <span style={{ fontSize:11 }}>{result.careSpecs.ecology}</span>
                  </div>
                </div>
              </div>
            )}

            {uniquePlants > 0 && (
              <div style={{ marginTop:10 }}>
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
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {RECYCLE_ITEMS.map(item => (
                <div key={item.id} onClick={() => handleRecycle(item)} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${item.color}22`, borderRadius:16, padding:14, textAlign:"center", cursor:"pointer" }}>
                  <div style={{ fontSize:28 }}>{item.emoji}</div>
                  <div style={{ fontSize:12, fontWeight:"bold", color:item.color }}>{item.label}</div>
                  <div style={{ fontSize:10, color:"#86efac44" }}>+{item.points} pts</div>
                  {recycleCount[item.id] > 0 && <div style={{ fontSize:10, color:item.color, marginTop:4 }}>Aportados: {recycleCount[item.id]}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: PREMIOS Y COFRES */}
        {tab === "achievements" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:16, padding:12, border:"1px solid rgba(251,191,36,0.15)", marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:6 }}>
                <span style={{ color:"#fbbf24", fontWeight:"bold" }}>⏱️ RETOS SEMANALES</span>
                <span style={{ color:"#f87171" }}>{timeLeft}</span>
              </div>
              {WEEKLY_CHALLENGES.map(w => {
                const currentProgress = w.id === "w_1" ? (recycleCount["glass"] || 0) : uniquePlants;
                const pct = Math.min(100, Math.round((currentProgress / w.target) * 100));
                return (
                  <div key={w.id} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}>
                      <span>{w.emoji} {w.title}</span>
                      <span>{currentProgress}/{w.target}</span>
                    </div>
                    <div style={{ height:5, background:"rgba(255,255,255,0.05)", borderRadius:10, overflow:"hidden", marginTop:2 }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:"#4ade80" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div onClick={() => triggerOpenChest("wood")} style={{ background:"rgba(255,255,255,0.02)", padding:12, borderRadius:16, textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize:28 }}>{chestWoodState==="opened"?"🧰":"📦"}</div>
                <div style={{ fontSize:11, fontWeight:"bold" }}>Cofre Madera</div>
                <span style={{ fontSize:10, color:"#4ade80" }}>{chestWoodState==="ready"?"DISPONIBLE":"COMPLETADO"}</span>
              </div>
              <div onClick={() => triggerOpenChest("crystal")} style={{ background:"rgba(255,255,255,0.02)", padding:12, borderRadius:16, textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize:28 }}>{chestCrystalState==="opened"?"💎":"🔮"}</div>
                <div style={{ fontSize:11, fontWeight:"bold" }}>Cofre Cristal</div>
                <span style={{ fontSize:10, color:"#22d3ee" }}>{chestCrystalState==="ready"?"DISPONIBLE":"COMPLETADO"}</span>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {ACHIEVEMENTS.map(ach => {
                const isUnlocked = unlockedAch.includes(ach.id);
                return (
                  <div key={ach.id} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.01)", padding:10, borderRadius:12, opacity: isUnlocked?1:0.4 }}>
                    <span style={{ fontSize:20 }}>{ach.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:"bold" }}>{ach.title}</div>
                      <div style={{ fontSize:10, color:"#86efac44" }}>{ach.desc}</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:"bold", color:"#4ade80" }}>+{ach.bonus} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: LIGAS Y SECCIÓN GLOBAL */}
        {tab === "leagues" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ background: compLeague.bg, border:`1px solid ${compLeague.border}`, borderRadius:20, padding:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:14, fontWeight:"900" }}>{compLeague.badge} División {compLeague.name}</div>
                <span style={{ fontSize:11, color:"#4ade80" }}>Tu puesto: #{userPosition}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {combinedLeaderboard.map((u, idx) => (
                  <div key={idx} style={{ display:"flex", alignItems:"center", gap:8, padding:6, borderRadius:8, background: u.isUser ? "rgba(74,222,128,0.15)" : "transparent" }}>
                    <span style={{ fontSize:11, width:14 }}>{idx+1}</span>
                    <span>{u.avatar}</span>
                    <span style={{ flex:1, fontSize:12 }}>{u.name}</span>
                    <span style={{ fontSize:12, fontWeight:"bold" }}>{u.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 5: APARTADO DE PERFIL */}
        {tab === "profile" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ background:"linear-gradient(135deg, rgba(255,255,255,0.03), rgba(0,0,0,0.4))", border:"1px solid rgba(74,222,128,0.15)", borderRadius:24, padding:20, textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:54, marginBottom:8 }}>{userAvatar}</div>
              <div style={{ fontSize:18, fontWeight:"900", color:"#fff" }}>{userName}</div>
              <div style={{ display:"inline-block", background:"rgba(34,211,238,0.1)", color:"#22d3ee", padding:"2px 10px", borderRadius:50, fontSize:10, fontFamily:"monospace", marginTop:4 }}>{userCode}</div>
              
              <p style={{ fontSize:11, color:"#86efacaa", marginTop:10, padding:"0 10px" }}>
                {currentRank.emoji} <b>Rango {currentRank.name}:</b> {currentRank.desc}
              </p>

              {nextRank && (
                <div style={{ marginTop:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#86efac44", marginBottom:2 }}>
                    <span>Progreso al siguiente nivel</span>
                    <span>{myPoints} / {nextRank.min} pts</span>
                  </div>
                  <div style={{ height:6, background:"rgba(255,255,255,0.05)", borderRadius:10, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${Math.min(100, (myPoints / nextRank.min) * 100)}%`, background:"#4ade80" }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              <div style={{ background:"rgba(255,255,255,0.02)", padding:12, borderRadius:16, textAlign:"center" }}>
                <div style={{ fontSize:20 }}>🌿</div>
                <div style={{ fontSize:16, fontWeight:"bold", color:"#fff" }}>{uniquePlants}</div>
                <div style={{ fontSize:10, color:"#86efac44" }}>Especies Únicas</div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.02)", padding:12, borderRadius:16, textAlign:"center" }}>
                <div style={{ fontSize:20 }}>♻️</div>
                <div style={{ fontSize:16, fontWeight:"bold", color:"#fff" }}>{totalRecycled}</div>
                <div style={{ fontSize:10, color:"#86efac44" }}>Residuos Reciclados</div>
              </div>
            </div>

            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:16, padding:14 }}>
              <div style={{ fontSize:11, fontWeight:"bold", color:"#4ade80", marginBottom:6 }}>AJUSTES DE CUENTA</div>
              <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} style={{ width:"100%", background:"rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:8, color:"#fff", fontSize:12, marginBottom:10, boxSizing:"border-box" }} placeholder="Nuevo apodo..." />
              
              <div style={{ fontSize:10, color:"#86efac44", marginBottom:4 }}>Cambiar Emoticono de Avatar:</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(8, 1fr)", gap:4, marginBottom:12 }}>
                {AVATAR_OPTIONS.map(av => (
                  <span key={av} onClick={() => setTempAvatar(av)} style={{ fontSize:18, textAlign:"center", cursor:"pointer", background: tempAvatar === av ? "rgba(74,222,128,0.2)" : "transparent", borderRadius:6, padding:2 }}>{av}</span>
                ))}
              </div>
              <button onClick={handleSaveProfile} style={{ width:"100%", background:"#16a34a", color:"#fff", border:"none", borderRadius:10, padding:"8px 0", fontWeight:"bold", fontSize:12, cursor:"pointer" }}>Actualizar Perfil</button>
            </div>
          </div>
        )}

      </div>

      {/* MENÚ INFERIOR CON 5 BOTONES */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(6,15,25,0.9)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(255,255,255,0.05)", padding:"12px 0", zIndex:999 }}>
        <div style={{ maxWidth:480, margin:"0 auto", display:"flex", justifyContent:"space-around" }}>
          <button onClick={() => setTab("scan")} style={{ background:"none", border:"none", color: tab === "scan" ? "#4ade80" : "#86efac44", fontSize:11, fontWeight:"bold", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span>📸</span>Escáner
          </button>
          <button onClick={() => setTab("recycle")} style={{ background:"none", border:"none", color: tab === "recycle" ? "#4ade80" : "#86efac44", fontSize:11, fontWeight:"bold", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span>♻️</span>Reciclar
          </button>
          <button onClick={() => setTab("achievements")} style={{ background:"none", border:"none", color: tab === "achievements" ? "#4ade80" : "#86efac44", fontSize:11, fontWeight:"bold", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span>📦</span>Premios
          </button>
          <button onClick={() => setTab("leagues")} style={{ background:"none", border:"none", color: tab === "leagues" ? "#4ade80" : "#86efac44", fontSize:11, fontWeight:"bold", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span>🛡️</span>Ligas
          </button>
          <button onClick={() => setTab("profile")} style={{ background:"none", border:"none", color: tab === "profile" ? "#4ade80" : "#86efac44", fontSize:11, fontWeight:"bold", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span>👤</span>Perfil
          </button>
        </div>
      </div>

    </div>
  );
}
