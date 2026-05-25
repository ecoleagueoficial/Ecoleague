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
  { id: "first_plant",  title: "Primer Brote",         desc: "Identifica tu primera especie",      emoji: "🌱", bonus: 20,  check: (p)   => Object.keys(p).length >= 1 },
  { id: "plants_5",     title: "Explorador Verde",     desc: "Identifica 5 especies distintas",    emoji: "🔭", bonus: 50,  check: (p)   => Object.keys(p).length >= 5 },
  { id: "plants_12",    title: "Maestro Botánico",      desc: "Identifica 12 especies distintas",   emoji: "🌿", bonus: 180, check: (p)   => Object.keys(p).length >= 12 },
  { id: "plants_25",    title: "Gran Naturalista",     desc: "Identifica 25 especies distintas",   emoji: "🌳", bonus: 500, check: (p)   => Object.keys(p).length >= 25 },
  { id: "recycle_5",    title: "Eco-Consciente",       desc: "Recicla 5 objetos en total",         emoji: "♻️", bonus: 30,  check: (p,r) => Object.values(r).reduce((a,b)=>a+b,0) >= 5 },
  { id: "recycle_25",   title: "Héroe del Contenedor", desc: "Recicla 25 objetos en total",        emoji: "🦸", bonus: 150, check: (p,r) => Object.values(r).reduce((a,b)=>a+b,0) >= 25 },
  { id: "all_recycle",  title: "Reciclador Total",     desc: "Recicla al menos 1 de cada tipo",   emoji: "🏅", bonus: 100, check: (p,r) => RECYCLE_ITEMS.every(i=>(r[i.id]||0)>=1) },
];

const WEEKLY_CHALLENGES = [
  { id: "w_1", title: "Operación Vidrio",  desc: "Recicla 3 botellas o envases de vidrio esta semana", emoji: "🍾", target: 3, bonus: 40 },
  { id: "w_2", title: "Biodiversidad Urb", desc: "Registra 3 especies diferentes en tu entorno",        emoji: "🌻", target: 3, bonus: 60 },
];

const SIMULATED_LEADERBOARD = [
  { name: "BioPaula🌱",   points: 890, avatar: "🌸", league: "Plata" },
  { name: "ReciclaPro",   points: 720, avatar: "🤖", league: "Plata" },
  { name: "EcoLucas01",   points: 540, avatar: "🦊", league: "Plata" },
  { name: "NaturaKris",   points: 410, avatar: "🦋", league: "Plata" },
  { name: "PlanetaVerde", points: 280, avatar: "🌳", league: "Plata" },
];

function getRank(points) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (points >= r.min) rank = r; }
  return rank;
}
function getNextRank(points) {
  return RANKS.find(r => r.min > points) || null;
}
function getCompetitionLeague(points) {
  if (points >= 1200) return { name: "Oro",    color: "#fbbf24", bg: "linear-gradient(135deg,#fbbf2422,#b4530911)", border: "#fbbf24cc", badge: "🥇" };
  if (points >= 350)  return { name: "Plata",  color: "#cbd5e1", bg: "linear-gradient(135deg,#cbd5e122,#47556911)", border: "#cbd5e1cc", badge: "🥈" };
  return                      { name: "Bronce", color: "#b45309", bg: "linear-gradient(135deg,#b4530922,#78350f11)", border: "#b45309cc", badge: "🥉" };
}

// ── CLAUDE VISION: análisis completo de la especie ──────────────────────────
async function analyzeImageWithClaude(base64Data, mimeType) {
  const prompt = `Eres un botánico y naturalista experto. Analiza esta imagen e identifica la especie que aparece (planta, animal, hongo, etc.).

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta (sin texto adicional, sin bloques de código):
{
  "nombre": "Nombre común en español",
  "nombreCientifico": "Nombre científico en latín",
  "tipo": "planta | animal | hongo | otro",
  "descripcion": "Descripción breve y educativa de 2-3 frases sobre la especie",
  "agua": "Descripción detallada de sus necesidades de riego",
  "luz": "Descripción detallada de sus necesidades de luz solar",
  "suelo": "Tipo de suelo ideal y composición recomendada",
  "tipoHoja": "Descripción del tipo de hoja (perenne, caduca, acicular, lanceolada, etc.) o 'No aplica' si es animal/hongo",
  "temperatura": "Rango de temperatura óptimo y resistencia a heladas",
  "plagas": "Principales plagas y enfermedades a vigilar",
  "ecologia": "Rol ecológico e impacto en el ecosistema",
  "curiosidades": "Un dato curioso e interesante sobre esta especie",
  "confianza": "alta | media | baja"
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType, data: base64Data }
          },
          { type: "text", text: prompt }
        ]
      }]
    })
  });

  if (!response.ok) throw new Error("Error en la API de Claude");
  const data = await response.json();
  const text = data.content.map(b => b.text || "").join("");
  // Limpiamos posibles bloques de código markdown antes de parsear
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export default function EcoQuest() {
  const [tab, setTab] = useState("scan");

  const [userName,   setUserName]   = useState(() => { try { return JSON.parse(localStorage.getItem("eq_username"))  || "Explorador Verde"; } catch { return "Explorador Verde"; } });
  const [userAvatar, setUserAvatar] = useState(() => { try { return JSON.parse(localStorage.getItem("eq_avatar"))   || "🌿"; }              catch { return "🌿"; } });
  const [userCode]                  = useState(() => { try { return JSON.parse(localStorage.getItem("eq_usercode")) || "EQ-" + Math.floor(100000 + Math.random() * 900000); } catch { return "EQ-" + Math.floor(100000 + Math.random() * 900000); } });

  const [myPoints,    setMyPoints]    = useState(() => { try { return JSON.parse(localStorage.getItem("eq_points"))  || 0;  } catch { return 0; } });
  const [plantCount,  setPlantCount]  = useState(() => { try { return JSON.parse(localStorage.getItem("eq_plants"))  || {}; } catch { return {}; } });
  const [recycleCount,setRecycleCount]= useState(() => { try { return JSON.parse(localStorage.getItem("eq_recycle")) || {}; } catch { return {}; } });
  const [unlockedAch, setUnlockedAch] = useState(() => { try { return JSON.parse(localStorage.getItem("eq_achievements")) || []; } catch { return []; } });

  const [chestWoodState,   setChestWoodState]   = useState(() => { try { return JSON.parse(localStorage.getItem("eq_chest_wood"))    || "ready"; } catch { return "ready"; } });
  const [chestCrystalState,setChestCrystalState]= useState(() => { try { return JSON.parse(localStorage.getItem("eq_chest_crystal")) || "ready"; } catch { return "ready"; } });

  const [timeLeft, setTimeLeft] = useState("2d 11h 45m 23s");

  const [scanning,    setScanning]    = useState(false);
  const [scanPhase,   setScanPhase]   = useState(""); // texto de estado durante el escaneo
  const [result,      setResult]      = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [scanError,   setScanError]   = useState(null);

  const fileInputRef = useRef(null);

  const [tempName,   setTempName]   = useState(userName);
  const [tempAvatar, setTempAvatar] = useState(userAvatar);
  const [notification, setNotification] = useState(null);

  useEffect(() => { localStorage.setItem("eq_points",       JSON.stringify(myPoints));    }, [myPoints]);
  useEffect(() => { localStorage.setItem("eq_plants",       JSON.stringify(plantCount));  }, [plantCount]);
  useEffect(() => { localStorage.setItem("eq_recycle",      JSON.stringify(recycleCount));}, [recycleCount]);
  useEffect(() => { localStorage.setItem("eq_achievements", JSON.stringify(unlockedAch)); }, [unlockedAch]);
  useEffect(() => { localStorage.setItem("eq_username",     JSON.stringify(userName));    }, [userName]);
  useEffect(() => { localStorage.setItem("eq_avatar",       JSON.stringify(userAvatar));  }, [userAvatar]);
  useEffect(() => { localStorage.setItem("eq_chest_wood",   JSON.stringify(chestWoodState));    }, [chestWoodState]);
  useEffect(() => { localStorage.setItem("eq_chest_crystal",JSON.stringify(chestCrystalState)); }, [chestCrystalState]);

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

  // ── Motor de identificación: Claude Vision ───────────────────────────────
  const identifyImageWithAI = async (fileObject) => {
    setScanning(true);
    setResult(null);
    setScanError(null);

    // Convertir el archivo a base64
    setScanPhase("Procesando imagen...");
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsDataURL(fileObject);
    });

    const mimeType = fileObject.type || "image/jpeg";

    try {
      setScanPhase("Consultando IA de visión artificial...");
      const ai = await analyzeImageWithClaude(base64Data, mimeType);

      const pts = ai.confianza === "alta" ? 50 : ai.confianza === "media" ? 35 : 20;

      setResult({ ...ai, points: pts, previewUrl });
      setPlantCount(prev => ({ ...prev, [ai.nombre]: (prev[ai.nombre] || 0) + 1 }));
      addPoints(pts, ai.nombre, "🌱");

    } catch (err) {
      console.error(err);
      setScanError("No se pudo analizar la imagen. Comprueba tu conexión o intenta con otra foto más clara.");
    } finally {
      setScanning(false);
      setScanPhase("");
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
    setScanError(null);
    identifyImageWithAI(file);
  };

  const handleRecycle = (item) => {
    setRecycleCount(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    addPoints(item.points, `Reciclé ${item.label}`, item.emoji);
  };

  const handleSaveProfile = () => {
    if (tempName.trim()) setUserName(tempName.trim());
    setUserAvatar(tempAvatar);
    showNotif("Perfil actualizado", "👤");
  };

  const triggerOpenChest = (type) => {
    if (type === "wood") {
      if (chestWoodState !== "ready") return;
      setChestWoodState("animating");
      setTimeout(() => { setChestWoodState("opened"); addPoints(50, "Cofre de Madera", "🧰"); }, 1000);
    } else {
      if (chestCrystalState !== "ready") return;
      setChestCrystalState("animating");
      setTimeout(() => { setChestCrystalState("opened"); addPoints(150, "Cofre de Cristal", "💎"); }, 1000);
    }
  };

  const uniquePlants  = Object.keys(plantCount).length;
  const totalRecycled = Object.values(recycleCount).reduce((a, b) => a + b, 0);
  const currentRank   = getRank(myPoints);
  const nextRank      = getNextRank(myPoints);
  const compLeague    = getCompetitionLeague(myPoints);

  const combinedLeaderboard = [
    { name: `${userName} (Tú)`, points: myPoints, avatar: userAvatar, league: compLeague.name, isUser: true },
    ...SIMULATED_LEADERBOARD
  ].sort((a, b) => b.points - a.points);

  const userPosition = combinedLeaderboard.findIndex(item => item.isUser) + 1;

  // ── Estilos reutilizables ────────────────────────────────────────────────
  const card = { background:"rgba(255,255,255,0.02)", borderRadius:16, padding:14, border:"1px solid rgba(255,255,255,0.06)" };
  const infoCard = (color) => ({ background:"rgba(255,255,255,0.02)", padding:10, borderRadius:10, borderLeft:`3px solid ${color}` });

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#060f19 0%,#081710 50%,#060f19 100%)", fontFamily:"system-ui, sans-serif", color:"#e8f5e9", paddingBottom:130 }}>

      {/* Notificación flotante */}
      {notification && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#16a34a,#0d9488)", color:"white", borderRadius:50, padding:"12px 24px", fontWeight:"bold", fontSize:13, zIndex:9999, boxShadow:"0 8px 24px rgba(22,163,74,0.4)", display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap" }}>
          <span style={{ fontSize:18 }}>{notification.emoji}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      <div style={{ maxWidth:480, margin:"0 auto" }}>

        {/* Cabecera */}
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

        {/* ══════════ PESTAÑA 1: ESCÁNER CON CLAUDE VISION ══════════ */}
        {tab === "scan" && (
          <div style={{ padding:"0 20px" }}>

            {/* Zona de subida */}
            <div
              onClick={() => !scanning && fileInputRef.current?.click()}
              style={{ background:"rgba(255,255,255,0.01)", borderRadius:24, padding:28, border:"2px dashed rgba(74,222,128,0.2)", textAlign:"center", marginBottom:16, cursor: scanning ? "default" : "pointer", transition:"border-color 0.2s" }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display:"none" }} />

              {scanning ? (
                <div>
                  <div style={{ fontSize:36, animation:"spin 2s linear infinite" }}>🧬</div>
                  <div style={{ marginTop:10, color:"#4ade80", fontSize:13, fontWeight:"700" }}>Analizando con IA...</div>
                  <div style={{ marginTop:4, color:"#86efac88", fontSize:11 }}>{scanPhase}</div>
                  <div style={{ marginTop:12, height:3, background:"rgba(255,255,255,0.05)", borderRadius:10, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:"60%", background:"linear-gradient(90deg,#4ade80,#22d3ee)", borderRadius:10, animation:"progress 1.5s ease-in-out infinite" }} />
                  </div>
                </div>
              ) : previewUrl && !result && !scanError ? (
                <div>
                  <img src={previewUrl} alt="preview" style={{ width:80, height:80, borderRadius:12, objectFit:"cover", opacity:0.6 }} />
                  <div style={{ marginTop:8, color:"#86efac88", fontSize:11 }}>Procesando...</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:40 }}>📸</div>
                  <div style={{ fontSize:14, fontWeight:"bold", color:"#4ade80", marginTop:8 }}>Subir o Tomar Foto de la Especie</div>
                  <div style={{ fontSize:11, color:"#86efac44", marginTop:4 }}>Identificación instantánea por Claude IA con visión artificial</div>
                  <div style={{ marginTop:10, display:"flex", justifyContent:"center", gap:6, flexWrap:"wrap" }}>
                    {["🌸 Flores","🌿 Plantas","🦋 Insectos","🍄 Hongos","🦊 Animales"].map(tag => (
                      <span key={tag} style={{ fontSize:10, background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:50, padding:"3px 8px", color:"#4ade80" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {scanError && (
              <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:14, padding:12, marginBottom:16, fontSize:12, color:"#fca5a5", textAlign:"center" }}>
                ⚠️ {scanError}
              </div>
            )}

            {/* Resultado detallado de Claude */}
            {result && (
              <div style={{ ...card, marginBottom:16 }}>
                {/* Cabecera del resultado */}
                <div style={{ display:"flex", gap:12, marginBottom:12, alignItems:"flex-start" }}>
                  {previewUrl && (
                    <img src={previewUrl} alt="" style={{ width:64, height:64, borderRadius:12, objectFit:"cover", flexShrink:0 }} />
                  )}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:17, fontWeight:"900", color:"#fff", lineHeight:1.2 }}>{result.nombre}</div>
                    {result.nombreCientifico && (
                      <div style={{ fontSize:11, color:"#86efac88", fontStyle:"italic", marginTop:2 }}>{result.nombreCientifico}</div>
                    )}
                    <div style={{ marginTop:6, display:"flex", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, background:"rgba(74,222,128,0.12)", color:"#4ade80", borderRadius:50, padding:"2px 8px", fontWeight:"bold" }}>
                        ✨ +{result.points} pts
                      </span>
                      {result.confianza && (
                        <span style={{ fontSize:10, background: result.confianza === "alta" ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.12)", color: result.confianza === "alta" ? "#4ade80" : "#fbbf24", borderRadius:50, padding:"2px 8px" }}>
                          {result.confianza === "alta" ? "🎯 Alta confianza" : result.confianza === "media" ? "🔍 Confianza media" : "⚠️ Baja confianza"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {result.descripcion && (
                  <p style={{ fontSize:11, color:"#e8f5e9aa", lineHeight:1.5, marginBottom:12, padding:"8px 10px", background:"rgba(255,255,255,0.02)", borderRadius:8 }}>
                    {result.descripcion}
                  </p>
                )}

                {/* Ficha técnica completa */}
                <div style={{ display:"grid", gap:6 }}>
                  {result.agua && (
                    <div style={infoCard("#22d3ee")}>
                      <span style={{ color:"#22d3ee", fontWeight:"bold", fontSize:10, display:"block", marginBottom:2 }}>💧 AGUA / RIEGO</span>
                      <span style={{ fontSize:11 }}>{result.agua}</span>
                    </div>
                  )}
                  {result.luz && (
                    <div style={infoCard("#fbbf24")}>
                      <span style={{ color:"#fbbf24", fontWeight:"bold", fontSize:10, display:"block", marginBottom:2 }}>☀️ LUZ SOLAR</span>
                      <span style={{ fontSize:11 }}>{result.luz}</span>
                    </div>
                  )}
                  {result.tipoHoja && (
                    <div style={infoCard("#a78bfa")}>
                      <span style={{ color:"#a78bfa", fontWeight:"bold", fontSize:10, display:"block", marginBottom:2 }}>🍃 TIPO DE HOJA</span>
                      <span style={{ fontSize:11 }}>{result.tipoHoja}</span>
                    </div>
                  )}
                  {result.suelo && (
                    <div style={infoCard("#f97316")}>
                      <span style={{ color:"#f97316", fontWeight:"bold", fontSize:10, display:"block", marginBottom:2 }}>🪨 TIPO DE SUELO</span>
                      <span style={{ fontSize:11 }}>{result.suelo}</span>
                    </div>
                  )}
                  {result.temperatura && (
                    <div style={infoCard("#f87171")}>
                      <span style={{ color:"#f87171", fontWeight:"bold", fontSize:10, display:"block", marginBottom:2 }}>🌡️ TEMPERATURA</span>
                      <span style={{ fontSize:11 }}>{result.temperatura}</span>
                    </div>
                  )}
                  {result.plagas && (
                    <div style={infoCard("#fb923c")}>
                      <span style={{ color:"#fb923c", fontWeight:"bold", fontSize:10, display:"block", marginBottom:2 }}>🐛 PLAGAS Y ENFERMEDADES</span>
                      <span style={{ fontSize:11 }}>{result.plagas}</span>
                    </div>
                  )}
                  {result.ecologia && (
                    <div style={infoCard("#4ade80")}>
                      <span style={{ color:"#4ade80", fontWeight:"bold", fontSize:10, display:"block", marginBottom:2 }}>🌍 ROL ECOLÓGICO</span>
                      <span style={{ fontSize:11 }}>{result.ecologia}</span>
                    </div>
                  )}
                  {result.curiosidades && (
                    <div style={infoCard("#38bdf8")}>
                      <span style={{ color:"#38bdf8", fontWeight:"bold", fontSize:10, display:"block", marginBottom:2 }}>💡 DATO CURIOSO</span>
                      <span style={{ fontSize:11 }}>{result.curiosidades}</span>
                    </div>
                  )}
                </div>

                {/* Botón para nueva foto */}
                <div
                  onClick={() => { setResult(null); setPreviewUrl(null); setScanError(null); fileInputRef.current?.click(); }}
                  style={{ marginTop:12, textAlign:"center", padding:"8px 0", background:"rgba(74,222,128,0.08)", borderRadius:10, cursor:"pointer", fontSize:12, color:"#4ade80", fontWeight:"bold" }}
                >
                  📸 Identificar otra especie
                </div>
              </div>
            )}

            {/* Historial */}
            {uniquePlants > 0 && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:10, color:"#86efac44", fontWeight:"bold", marginBottom:6, letterSpacing:1 }}>ESPECIES IDENTIFICADAS ({uniquePlants})</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {Object.entries(plantCount).map(([name, qty]) => (
                    <span key={name} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:50, padding:"4px 10px", fontSize:11, color:"#fff" }}>
                      🌿 {name} <b style={{ color:"#4ade80" }}>x{qty}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <style>{`
              @keyframes spin     { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
              @keyframes progress { 0%,100% { margin-left:0; width:40%; } 50% { margin-left:60%; width:40%; } }
            `}</style>
          </div>
        )}

        {/* ══════════ PESTAÑA 2: RECICLAJE ══════════ */}
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

        {/* ══════════ PESTAÑA 3: PREMIOS ══════════ */}
        {tab === "achievements" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ ...card, marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:6 }}>
                <span style={{ color:"#fbbf24", fontWeight:"bold" }}>⏱️ RETOS SEMANALES</span>
                <span style={{ color:"#f87171" }}>{timeLeft}</span>
              </div>
              {WEEKLY_CHALLENGES.map(w => {
                const current = w.id === "w_1" ? (recycleCount["glass"] || 0) : uniquePlants;
                const pct = Math.min(100, Math.round((current / w.target) * 100));
                return (
                  <div key={w.id} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}>
                      <span>{w.emoji} {w.title}</span>
                      <span>{current}/{w.target}</span>
                    </div>
                    <div style={{ height:5, background:"rgba(255,255,255,0.05)", borderRadius:10, overflow:"hidden", marginTop:2 }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:"#4ade80" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div onClick={() => triggerOpenChest("wood")} style={{ ...card, textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize:28 }}>{chestWoodState==="opened"?"🧰":"📦"}</div>
                <div style={{ fontSize:11, fontWeight:"bold" }}>Cofre Madera</div>
                <span style={{ fontSize:10, color:"#4ade80" }}>{chestWoodState==="ready"?"DISPONIBLE":"COMPLETADO"}</span>
              </div>
              <div onClick={() => triggerOpenChest("crystal")} style={{ ...card, textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize:28 }}>{chestCrystalState==="opened"?"💎":"🔮"}</div>
                <div style={{ fontSize:11, fontWeight:"bold" }}>Cofre Cristal</div>
                <span style={{ fontSize:10, color:"#22d3ee" }}>{chestCrystalState==="ready"?"DISPONIBLE":"COMPLETADO"}</span>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {ACHIEVEMENTS.map(ach => {
                const isUnlocked = unlockedAch.includes(ach.id);
                return (
                  <div key={ach.id} style={{ display:"flex", alignItems:"center", gap:10, ...card, opacity: isUnlocked ? 1 : 0.4 }}>
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

        {/* ══════════ PESTAÑA 4: LIGAS ══════════ */}
        {tab === "leagues" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ background:compLeague.bg, border:`1px solid ${compLeague.border}`, borderRadius:20, padding:14 }}>
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

        {/* ══════════ PESTAÑA 5: PERFIL ══════════ */}
        {tab === "profile" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.03),rgba(0,0,0,0.4))", border:"1px solid rgba(74,222,128,0.15)", borderRadius:24, padding:20, textAlign:"center", marginBottom:16 }}>
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
                    <div style={{ height:"100%", width:`${Math.min(100,(myPoints/nextRank.min)*100)}%`, background:"#4ade80" }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              <div style={{ ...card, textAlign:"center" }}>
                <div style={{ fontSize:20 }}>🌿</div>
                <div style={{ fontSize:16, fontWeight:"bold", color:"#fff" }}>{uniquePlants}</div>
                <div style={{ fontSize:10, color:"#86efac44" }}>Especies Únicas</div>
              </div>
              <div style={{ ...card, textAlign:"center" }}>
                <div style={{ fontSize:20 }}>♻️</div>
                <div style={{ fontSize:16, fontWeight:"bold", color:"#fff" }}>{totalRecycled}</div>
                <div style={{ fontSize:10, color:"#86efac44" }}>Residuos Reciclados</div>
              </div>
            </div>

            <div style={{ ...card }}>
              <div style={{ fontSize:11, fontWeight:"bold", color:"#4ade80", marginBottom:8 }}>AJUSTES DE CUENTA</div>
              <input
                type="text"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                style={{ width:"100%", background:"rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:8, color:"#fff", fontSize:12, marginBottom:10, boxSizing:"border-box" }}
                placeholder="Nuevo apodo..."
              />
              <div style={{ fontSize:10, color:"#86efac44", marginBottom:4 }}>Cambiar Emoticono de Avatar:</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(8, 1fr)", gap:4, marginBottom:12 }}>
                {AVATAR_OPTIONS.map(av => (
                  <span key={av} onClick={() => setTempAvatar(av)} style={{ fontSize:18, textAlign:"center", cursor:"pointer", background: tempAvatar === av ? "rgba(74,222,128,0.2)" : "transparent", borderRadius:6, padding:2 }}>{av}</span>
                ))}
              </div>
              <button onClick={handleSaveProfile} style={{ width:"100%", background:"#16a34a", color:"#fff", border:"none", borderRadius:10, padding:"8px 0", fontWeight:"bold", fontSize:12, cursor:"pointer" }}>
                Actualizar Perfil
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ══ MENÚ INFERIOR ══ */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(6,15,25,0.9)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(255,255,255,0.05)", padding:"12px 0", zIndex:999 }}>
        <div style={{ maxWidth:480, margin:"0 auto", display:"flex", justifyContent:"space-around" }}>
          {[
            { id:"scan",         icon:"📸", label:"Escáner"  },
            { id:"recycle",      icon:"♻️",  label:"Reciclar" },
            { id:"achievements", icon:"📦", label:"Premios"  },
            { id:"leagues",      icon:"🛡️", label:"Ligas"    },
            { id:"profile",      icon:"👤", label:"Perfil"   },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setTab(btn.id)}
              style={{ background:"none", border:"none", color: tab === btn.id ? "#4ade80" : "#86efac44", fontSize:11, fontWeight:"bold", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}
            >
              <span style={{ fontSize:20 }}>{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
