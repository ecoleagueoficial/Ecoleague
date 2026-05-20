import { useState, useRef, useEffect } from "react";

const FRIENDS_BASE = [
  { name: "Alba", avatar: "🌸", points: 340 },
  { name: "Marcos", avatar: "🌳", points: 280 },
  { name: "Lucía", avatar: "🍃", points: 210 },
  { name: "Dani", avatar: "🌻", points: 150 },
];

const RECYCLE_ITEMS = [
  { id: "plastic", label: "Plástico", emoji: "🧴", points: 10, color: "#FFD700" },
  { id: "glass", label: "Vidrio", emoji: "🍾", points: 15, color: "#88D498" },
  { id: "paper", label: "Papel/Cartón", emoji: "📦", points: 8, color: "#A8DADC" },
  { id: "metal", label: "Metal", emoji: "🥫", points: 12, color: "#C0C0C0" },
  { id: "organic", label: "Orgánico", emoji: "🍂", points: 5, color: "#8B6914" },
  { id: "battery", label: "Pila/Batería", emoji: "🔋", points: 20, color: "#FF6B6B" },
];

const ACHIEVEMENTS = [
  { id: "first_plant", title: "Primer brote", desc: "Identifica tu primera planta", emoji: "🌱", bonus: 20, check: (p) => Object.keys(p).length >= 1 },
  { id: "plants_5", title: "Explorador", desc: "Identifica 5 especies distintas", emoji: "🔭", bonus: 50, check: (p) => Object.keys(p).length >= 5 },
  { id: "plants_10", title: "Botánico", desc: "Identifica 10 especies distintas", emoji: "🌿", bonus: 150, check: (p) => Object.keys(p).length >= 10 },
  { id: "plants_20", title: "Naturalista", desc: "Identifica 20 especies distintas", emoji: "🌳", bonus: 400, check: (p) => Object.keys(p).length >= 20 },
  { id: "recycle_5", title: "Eco-consciente", desc: "Recicla 5 objetos", emoji: "♻️", bonus: 30, check: (p, r) => Object.values(r).reduce((a,b)=>a+b,0) >= 5 },
  { id: "recycle_20", title: "Eco-héroe", desc: "Recicla 20 objetos", emoji: "🦸", bonus: 100, check: (p, r) => Object.values(r).reduce((a,b)=>a+b,0) >= 20 },
  { id: "all_recycle", title: "Reciclador total", desc: "Recicla al menos 1 de cada tipo", emoji: "🏅", bonus: 80, check: (p, r) => RECYCLE_ITEMS.every(i=>(r[i.id]||0)>=1) },
  { id: "invasora", title: "Detector invasor", desc: "Encuentra una planta invasora", emoji: "🚨", bonus: 60, check: (p, r, inv) => inv > 0 },
];

const PLANT_CARE_DB = {
  "lavender": { water: "Bajo", freq: "1x/semana", light: "Sol pleno", temp: "15-30°C", humidity: "Baja", soil: "Arenoso, bien drenado", fertilizer: "1x/mes en primavera", tips: "No encharcar. Podar tras floración.", toxic: "No tóxica", lifespan: "Perenne" },
  "lavanda": { water: "Bajo", freq: "1x/semana", light: "Sol pleno", temp: "15-30°C", humidity: "Baja", soil: "Arenoso, bien drenado", fertilizer: "1x/mes en primavera", tips: "No encharcar. Podar tras floración.", toxic: "No tóxica", lifespan: "Perenne" },
  "rosa": { water: "Medio", freq: "2-3x/semana", light: "Sol pleno", temp: "15-25°C", humidity: "Media", soil: "Rico, bien drenado", fertilizer: "Cada 2 semanas en verano", tips: "Regar por la mañana. Podar en invierno.", toxic: "No tóxica", lifespan: "Perenne" },
  "rose": { water: "Medio", freq: "2-3x/semana", light: "Sol pleno", temp: "15-25°C", humidity: "Media", soil: "Rico, bien drenado", fertilizer: "Cada 2 semanas en verano", tips: "Regar por la mañana. Podar en invierno.", toxic: "No tóxica", lifespan: "Perenne" },
  "girasol": { water: "Medio-alto", freq: "2x/semana", light: "Sol pleno", temp: "20-30°C", humidity: "Media", soil: "Fértil, profundo", fertilizer: "1x/mes", tips: "Orientar hacia el sur. Tutorear si es alto.", toxic: "No tóxica", lifespan: "Anual" },
  "sunflower": { water: "Medio-alto", freq: "2x/semana", light: "Sol pleno", temp: "20-30°C", humidity: "Media", soil: "Fértil, profundo", fertilizer: "1x/mes", tips: "Orientar hacia el sur. Tutorear si es alto.", toxic: "No tóxica", lifespan: "Anual" },
  "cactus": { water: "Muy bajo", freq: "1x/2-3 semanas", light: "Sol directo", temp: "18-35°C", humidity: "Muy baja", soil: "Arenoso, cactáceas", fertilizer: "1x/mes en verano", tips: "Nunca encharcar. Maceta con drenaje.", toxic: "No tóxica", lifespan: "Perenne" },
  "aloe": { water: "Bajo", freq: "1x/2 semanas", light: "Sol indirecto", temp: "15-30°C", humidity: "Baja", soil: "Arenoso, suculentas", fertilizer: "2x/año", tips: "Dejar secar entre riegos. Muy resistente.", toxic: "Tóxica si se ingiere", lifespan: "Perenne" },
  "aloe vera": { water: "Bajo", freq: "1x/2 semanas", light: "Sol indirecto", temp: "15-30°C", humidity: "Baja", soil: "Arenoso, suculentas", fertilizer: "2x/año", tips: "Dejar secar entre riegos. Muy resistente.", toxic: "Tóxica si se ingiere", lifespan: "Perenne" },
  "monstera": { water: "Medio", freq: "1x/semana", light: "Luz indirecta", temp: "18-27°C", humidity: "Alta", soil: "Húmedo, bien drenado", fertilizer: "1x/mes en primavera-verano", tips: "Limpiar hojas. Necesita soporte para crecer.", toxic: "Tóxica para mascotas", lifespan: "Perenne" },
  "pothos": { water: "Bajo-medio", freq: "1x/semana", light: "Poca luz a indirecta", temp: "15-30°C", humidity: "Media", soil: "Universal", fertilizer: "1x/mes en verano", tips: "Muy resistente. Ideal para interiores.", toxic: "Tóxica si se ingiere", lifespan: "Perenne" },
  "ficus": { water: "Medio", freq: "2x/semana en verano", light: "Luz indirecta brillante", temp: "16-24°C", humidity: "Media-alta", soil: "Rico, bien drenado", fertilizer: "Cada 2 semanas en verano", tips: "No mover de sitio. Sensible a corrientes.", toxic: "Tóxica para mascotas", lifespan: "Perenne" },
  "orquídea": { water: "Bajo", freq: "1x/semana", light: "Luz indirecta", temp: "18-25°C", humidity: "Alta", soil: "Corteza de pino especial", fertilizer: "1x/2 semanas en floración", tips: "Regar sumergiendo maceta 10min. No sol directo.", toxic: "No tóxica", lifespan: "Perenne" },
  "orchid": { water: "Bajo", freq: "1x/semana", light: "Luz indirecta", temp: "18-25°C", humidity: "Alta", soil: "Corteza de pino especial", fertilizer: "1x/2 semanas en floración", tips: "Regar sumergiendo maceta 10min. No sol directo.", toxic: "No tóxica", lifespan: "Perenne" },
  "tomato": { water: "Alto", freq: "Diario en verano", light: "Sol pleno", temp: "18-27°C", humidity: "Media", soil: "Rico, abonado", fertilizer: "Cada 2 semanas", tips: "Tutorear. Eliminar chupones. Riego constante.", toxic: "Hojas tóxicas", lifespan: "Anual" },
  "tomate": { water: "Alto", freq: "Diario en verano", light: "Sol pleno", temp: "18-27°C", humidity: "Media", soil: "Rico, abonado", fertilizer: "Cada 2 semanas", tips: "Tutorear. Eliminar chupones. Riego constante.", toxic: "Hojas tóxicas", lifespan: "Anual" },
  "menta": { water: "Medio-alto", freq: "2-3x/semana", light: "Sol o semisombra", temp: "15-25°C", humidity: "Media-alta", soil: "Húmedo, fértil", fertilizer: "1x/mes", tips: "Invasiva, mejor en maceta. Pinzar flores.", toxic: "No tóxica", lifespan: "Perenne" },
  "mint": { water: "Medio-alto", freq: "2-3x/semana", light: "Sol o semisombra", temp: "15-25°C", humidity: "Media-alta", soil: "Húmedo, fértil", fertilizer: "1x/mes", tips: "Invasiva, mejor en maceta. Pinzar flores.", toxic: "No tóxica", lifespan: "Perenne" },
  "romero": { water: "Bajo", freq: "1x/semana", light: "Sol pleno", temp: "10-30°C", humidity: "Baja", soil: "Arenoso, bien drenado", fertilizer: "2x/año", tips: "Muy resistente a la sequía. Podar regularmente.", toxic: "No tóxica", lifespan: "Perenne" },
  "rosemary": { water: "Bajo", freq: "1x/semana", light: "Sol pleno", temp: "10-30°C", humidity: "Baja", soil: "Arenoso, bien drenado", fertilizer: "2x/año", tips: "Muy resistente a la sequía. Podar regularmente.", toxic: "No tóxica", lifespan: "Perenne" },
  "hedera": { water: "Medio", freq: "2x/semana", light: "Sombra a semisombra", temp: "10-20°C", humidity: "Media", soil: "Universal", fertilizer: "1x/mes en primavera", tips: "Podar para controlar. Tóxica, usar guantes.", toxic: "Tóxica", lifespan: "Perenne" },
  "ivy": { water: "Medio", freq: "2x/semana", light: "Sombra a semisombra", temp: "10-20°C", humidity: "Media", soil: "Universal", fertilizer: "1x/mes en primavera", tips: "Podar para controlar. Tóxica, usar guantes.", toxic: "Tóxica", lifespan: "Perenne" },
  "default": { water: "Medio", freq: "2x/semana", light: "Luz indirecta", temp: "15-25°C", humidity: "Media", soil: "Universal bien drenado", fertilizer: "1x/mes en primavera-verano", tips: "Observar hojas para detectar problemas.", toxic: "Consultar fuente especializada", lifespan: "Variable" }
};

function getPlantCare(name) {
  if (!name) return PLANT_CARE_DB["default"];
  const lower = name.toLowerCase();
  for (const key of Object.keys(PLANT_CARE_DB)) {
    if (lower.includes(key) || key.includes(lower)) return PLANT_CARE_DB[key];
  }
  return PLANT_CARE_DB["default"];
}

const statusColors = { "Autóctona": "#4CAF50", "Invasora": "#F44336", "Cultivada": "#FF9800" };
const INAT_TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjoxMDU2NTcyMywiZXhwIjoxNzc5MzU3NjM2fQ.HbuDgJna6R4PFftLGi3yW3xTPLEy3NigH6RgY3xb1GHhxSWi5lTCyT_lGF_o_HCxt7_DtVWifc2atlA96Hey8Q";

function loadState(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function saveState(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function genCode() {
  return Math.random().toString(36).substring(2,8).toUpperCase();
}

export default function EcoQuest() {
  const [tab, setTab] = useState("scan");
  const [myPoints, setMyPoints] = useState(() => loadState("eq_points", 0));
  const [log, setLog] = useState(() => loadState("eq_log", []));
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [recycleAnim, setRecycleAnim] = useState(null);
  const [plantCount, setPlantCount] = useState(() => loadState("eq_plants", {}));
  const [recycleCount, setRecycleCount] = useState(() => loadState("eq_recycle", {}));
  const [invasoraCount, setInvasoraCount] = useState(() => loadState("eq_invasora", 0));
  const [notification, setNotification] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState(() => loadState("eq_achievements", []));
  const [userName, setUserName] = useState(() => loadState("eq_username", ""));
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState("");
  const [myCode] = useState(() => { const c = loadState("eq_mycode", null); if(c) return c; const n = genCode(); saveState("eq_mycode", n); return n; });
  const [leagues, setLeagues] = useState(() => loadState("eq_leagues", []));
  const [leagueTab, setLeagueTab] = useState("global");
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [showJoinLeague, setShowJoinLeague] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newLeagueMax, setNewLeagueMax] = useState("5");
  const [joinCode, setJoinCode] = useState("");
  const fileRef = useRef();

  const leaderboard = [...FRIENDS_BASE, { name: userName || "Tú", avatar: "🌿", points: myPoints, isYou: true }]
    .sort((a,b) => b.points - a.points);

  useEffect(() => { saveState("eq_points", myPoints); }, [myPoints]);
  useEffect(() => { saveState("eq_log", log); }, [log]);
  useEffect(() => { saveState("eq_plants", plantCount); }, [plantCount]);
  useEffect(() => { saveState("eq_recycle", recycleCount); }, [recycleCount]);
  useEffect(() => { saveState("eq_invasora", invasoraCount); }, [invasoraCount]);
  useEffect(() => { saveState("eq_achievements", unlockedAchievements); }, [unlockedAchievements]);
  useEffect(() => { saveState("eq_leagues", leagues); }, [leagues]);

  useEffect(() => {
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAchievements.includes(ach.id) && ach.check(plantCount, recycleCount, invasoraCount)) {
        setUnlockedAchievements(prev => {
          if (prev.includes(ach.id)) return prev;
          setMyPoints(pts => pts + ach.bonus);
          setLog(prev => [{ label: `🏆 Logro: ${ach.title}`, emoji: ach.emoji, pts: ach.bonus, time: new Date().toLocaleTimeString() }, ...prev.slice(0,19)]);
          showNotification(`🏆 ¡Logro desbloqueado! ${ach.title} (+${ach.bonus}pts)`, ach.emoji);
          return [...prev, ach.id];
        });
      }
    });
  }, [plantCount, recycleCount, invasoraCount]);

  const addPoints = (pts, label, emoji) => {
    setMyPoints(prev => prev + pts);
    setLog(prev => [{ label, emoji, pts, time: new Date().toLocaleTimeString() }, ...prev.slice(0,19)]);
    showNotification(`+${pts} pts — ${label}`, emoji);
  };

  const showNotification = (msg, emoji) => {
    setNotification({ msg, emoji });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("https://api.inaturalist.org/v1/computervision/score_image", {
        method: "POST",
        headers: { "Authorization": INAT_TOKEN },
        body: formData
      });
      const data = await res.json();
      const top = data.results?.[0];
      if (top && top.taxon) {
        const taxon = top.taxon;
        const name = taxon.preferred_common_name || taxon.name;
        const scientific = taxon.name;
        const score = Math.round((top.combined_score || 0) * 100);
        const pts = Math.min(60, Math.max(10, Math.round(score * 0.6)));
        const care = getPlantCare(name || scientific);
        const parsed = {
          type: "plant", name: name || scientific, scientific,
          origin: taxon.establishment_means?.establishment_means === "introduced" ? "Introducida" : "Nativa",
          status: taxon.establishment_means?.establishment_means === "introduced" ? "Invasora" : "Autóctona",
          emoji: "🌿", points: pts,
          desc: taxon.wikipedia_summary || `Especie identificada con un ${score}% de confianza.`,
          confidence: score > 70 ? "Alta" : score > 40 ? "Media" : "Baja",
          characteristics: `Especie: ${scientific}; Confianza: ${score}%; Familia: ${taxon.family_name || "desconocida"}`,
          curiosity: `Esta especie ha sido observada ${taxon.observations_count?.toLocaleString() || "miles de"} veces en todo el mundo.`,
          care
        };
        setResult(parsed);
        setPlantCount(prev => ({ ...prev, [parsed.name]: (prev[parsed.name]||0)+1 }));
        if (parsed.status === "Invasora") setInvasoraCount(c => c+1);
        addPoints(parsed.points, parsed.name, parsed.emoji);
      } else {
        setResult({ type: "none", message: "No se detectó ninguna planta. Intenta con otra foto más clara." });
      }
    } catch { setResult({ type: "error", message: "Error al analizar la imagen. Inténtalo de nuevo." }); }
    setScanning(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRecycle = (item) => {
    setRecycleAnim(item.id);
    setTimeout(() => setRecycleAnim(null), 600);
    setRecycleCount(prev => ({ ...prev, [item.id]: (prev[item.id]||0)+1 }));
    addPoints(item.points, `Reciclé ${item.label}`, item.emoji);
  };

  const createLeague = () => {
    if (!newLeagueName.trim()) return;
    const league = {
      id: genCode(), name: newLeagueName, maxPlayers: parseInt(newLeagueMax),
      code: genCode(), createdBy: userName || "Tú",
      members: [{ name: userName || "Tú", points: myPoints, code: myCode, isYou: true }]
    };
    setLeagues(prev => [...prev, league]);
    setShowCreateLeague(false);
    setNewLeagueName("");
    showNotification(`¡Liga "${league.name}" creada!`, "🏆");
  };

  const joinLeague = () => {
    if (!joinCode.trim()) return;
    const exists = leagues.find(l => l.code === joinCode.toUpperCase());
    if (exists) {
      if (exists.members.find(m => m.code === myCode)) {
        showNotification("Ya estás en esta liga", "⚠️"); return;
      }
      setLeagues(prev => prev.map(l => l.id === exists.id ? {
        ...l, members: [...l.members, { name: userName || "Tú", points: myPoints, code: myCode, isYou: true }]
      } : l));
      showNotification(`¡Te uniste a "${exists.name}"!`, "🎉");
    } else {
      showNotification("Código no encontrado", "❌");
    }
    setJoinCode("");
    setShowJoinLeague(false);
  };

  const uniquePlants = Object.keys(plantCount).length;
  const totalRecycled = Object.values(recycleCount).reduce((a,b)=>a+b,0);
  const myRank = leaderboard.findIndex(f => f.isYou) + 1;
  const nextPlantAch = [{need:1,id:"first_plant"},{need:5,id:"plants_5"},{need:10,id:"plants_10"},{need:20,id:"plants_20"}].find(a => !unlockedAchievements.includes(a.id));

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a1628 0%,#0d2218 50%,#0a1628 100%)", fontFamily:"'Georgia',serif", color:"#e8f5e9", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        {[...Array(18)].map((_,i) => (
          <div key={i} style={{ position:"absolute", width:3+(i%4)*2, height:3+(i%4)*2, borderRadius:"50%", background:i%3===0?"#4ade80":i%3===1?"#86efac33":"#22d3ee22", left:`${(i*37+10)%95}%`, top:`${(i*53+7)%90}%`, animation:`float ${3+i%4}s ease-in-out infinite alternate`, animationDelay:`${i*0.3}s` }} />
        ))}
      </div>
      <style>{`
        @keyframes float{from{transform:translateY(0)}to{transform:translateY(-12px)}}
        @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.4)}100%{transform:scale(1)}}
        @keyframes slideIn{from{transform:translateY(-60px) scale(0.8);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .tab-btn{transition:all 0.2s;cursor:pointer}.rc{transition:all 0.2s;cursor:pointer}.rc:hover{transform:scale(1.05)}
        input::placeholder{color:rgba(255,255,255,0.4)}
      `}</style>

      {notification && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#16a34a,#15803d)", color:"white", borderRadius:50, padding:"12px 28px", fontWeight:"bold", fontSize:14, zIndex:1000, boxShadow:"0 8px 32px #4ade8066", animation:"slideIn 0.3s ease", display:"flex", alignItems:"center", gap:10, maxWidth:"88vw", textAlign:"center" }}>
          <span style={{ fontSize:22 }}>{notification.emoji}</span>{notification.msg}
        </div>
      )}

      <div style={{ maxWidth:480, margin:"0 auto", padding:"0 0 100px", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ padding:"32px 24px 20px", textAlign:"center" }}>
          <div style={{ fontSize:13, letterSpacing:4, color:"#4ade80", textTransform:"uppercase", marginBottom:8 }}>Proyecto EcoQuest</div>
          <div style={{ fontSize:42, fontWeight:"900", letterSpacing:-1, lineHeight:1, background:"linear-gradient(135deg,#4ade80,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>🌿 EcoQuest</div>
          <div style={{ fontSize:13, color:"#86efac88", marginTop:6 }}>Identifica, recicla, compite</div>
          <div onClick={()=>setShowNameInput(!showNameInput)} style={{ marginTop:10, display:"inline-block", background:"rgba(74,222,128,0.1)", borderRadius:50, padding:"6px 16px", fontSize:12, color:"#4ade80", cursor:"pointer", border:"1px solid rgba(74,222,128,0.2)" }}>
            👤 {userName || "Pon tu nombre"} ✏️
          </div>
          {showNameInput && (
            <div style={{ marginTop:10, display:"flex", gap:8, justifyContent:"center" }}>
              <input value={tempName} onChange={e=>setTempName(e.target.value)} placeholder="Tu nombre..."
                style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(74,222,128,0.3)", borderRadius:50, padding:"8px 16px", color:"white", fontSize:13, outline:"none", width:150 }} />
              <button onClick={()=>{ saveState("eq_username", tempName); setUserName(tempName); setShowNameInput(false); }}
                style={{ background:"linear-gradient(135deg,#16a34a,#0d9488)", color:"white", border:"none", borderRadius:50, padding:"8px 16px", fontSize:13, cursor:"pointer" }}>Guardar</button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ margin:"0 20px 20px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[{label:"Mis puntos",val:myPoints,emoji:"⭐",color:"#fbbf24"},{label:"Especies",val:uniquePlants,emoji:"🌿",color:"#4ade80"},{label:"Reciclado",val:totalRecycled,emoji:"♻️",color:"#22d3ee"}].map(s=>(
            <div key={s.label} style={{ background:"rgba(255,255,255,0.05)", borderRadius:16, padding:"14px 8px", textAlign:"center", border:"1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize:22 }}>{s.emoji}</div>
              <div style={{ fontSize:22, fontWeight:"800", color:s.color }}>{s.val}</div>
              <div style={{ fontSize:10, color:"#86efac88", marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Next objective */}
        {nextPlantAch && (
          <div style={{ margin:"0 20px 20px", background:"linear-gradient(135deg,rgba(251,191,36,0.12),rgba(251,191,36,0.06))", borderRadius:16, padding:"12px 16px", border:"1px solid rgba(251,191,36,0.25)", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:28 }}>🎯</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:"#fbbf24", fontWeight:"700" }}>Próximo objetivo</div>
              <div style={{ fontSize:11, color:"#86efac88", marginTop:2 }}>{uniquePlants >= nextPlantAch.need ? "¡Completado!" : `Encuentra ${nextPlantAch.need - uniquePlants} especie${nextPlantAch.need-uniquePlants!==1?"s":""} más`}</div>
              <div style={{ marginTop:6, height:4, background:"rgba(255,255,255,0.1)", borderRadius:2 }}>
                <div style={{ height:"100%", borderRadius:2, width:`${Math.min((uniquePlants/nextPlantAch.need)*100,100)}%`, background:"linear-gradient(90deg,#fbbf24,#f59e0b)" }} />
              </div>
              <div style={{ fontSize:10, color:"#fbbf2466", marginTop:3 }}>{uniquePlants}/{nextPlantAch.need} especies</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", margin:"0 20px 24px", background:"rgba(0,0,0,0.3)", borderRadius:16, padding:4, gap:2 }}>
          {[{id:"scan",label:"📸"},{id:"recycle",label:"♻️"},{id:"achievements",label:"🏆"},{id:"league",label:"🥇"},{id:"liga",label:"👥 Liga"}].map(t=>(
            <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)} style={{ flex:1, padding:"10px 2px", borderRadius:12, border:"none", background:tab===t.id?"linear-gradient(135deg,#16a34a,#0d9488)":"transparent", color:tab===t.id?"white":"#86efac88", fontSize:10, fontWeight:tab===t.id?"700":"400", cursor:"pointer", boxShadow:tab===t.id?"0 4px 12px #16a34a44":"none" }}>{t.label}</button>
          ))}
        </div>

        {/* SCAN TAB */}
        {tab==="scan" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:24, padding:28, border:"2px dashed rgba(74,222,128,0.3)", textAlign:"center", marginBottom:24, cursor:"pointer" }} onClick={()=>fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handlePhotoUpload} />
              {scanning ? (
                <div>
                  <div style={{ fontSize:50, animation:"spin 1s linear infinite", display:"inline-block" }}>🔍</div>
                  <div style={{ marginTop:16, color:"#4ade80", fontSize:15 }}>Identificando con iNaturalist...</div>
                  <div style={{ marginTop:6, color:"#86efac66", fontSize:12 }}>Base de datos de millones de especies</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize:56 }}>📸</div>
                  <div style={{ fontSize:17, fontWeight:"700", color:"#4ade80", marginTop:12 }}>Fotografía una planta</div>
                  <div style={{ fontSize:13, color:"#86efac88", marginTop:6 }}>Identificación gratuita con iNaturalist</div>
                  <div style={{ marginTop:16, display:"inline-block", background:"linear-gradient(135deg,#16a34a,#0d9488)", color:"white", borderRadius:50, padding:"10px 28px", fontSize:14, fontWeight:"700" }}>Abrir cámara</div>
                </>
              )}
            </div>

            {result && result.type==="plant" && (
              <div style={{ background:"linear-gradient(135deg,rgba(22,163,74,0.12),rgba(13,148,136,0.12))", borderRadius:24, padding:22, border:"1px solid rgba(74,222,128,0.3)", marginBottom:24, animation:"slideIn 0.4s ease" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:14 }}>
                  <div style={{ fontSize:52, flexShrink:0 }}>{result.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <div style={{ fontSize:20, fontWeight:"800" }}>{result.name}</div>
                      <span style={{ background:(statusColors[result.status]||"#888")+"33", color:statusColors[result.status]||"#888", borderRadius:50, padding:"2px 10px", fontSize:11, fontWeight:"700" }}>{result.status}</span>
                    </div>
                    <div style={{ fontSize:12, color:"#86efac88", fontStyle:"italic", marginTop:2 }}>{result.scientific}</div>
                    <div style={{ display:"flex", gap:10, marginTop:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:"#fbbf24" }}>🌍 {result.origin}</span>
                      <span style={{ fontSize:11, color:"#fbbf24" }}>⭐ +{result.points}pts</span>
                      <span style={{ fontSize:11, color:result.confidence==="Alta"?"#4ade80":result.confidence==="Media"?"#fbbf24":"#f87171" }}>● {result.confidence}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize:13, color:"#cce5cc", lineHeight:1.6, marginBottom:14 }}>{result.desc}</div>

                {/* Care section */}
                {result.care && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:12, color:"#4ade80", fontWeight:"700", marginBottom:10, letterSpacing:2, textTransform:"uppercase" }}>🌱 Guía de cuidados</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {[
                        { icon:"💧", label:"Riego", val:result.care.water },
                        { icon:"📅", label:"Frecuencia", val:result.care.freq },
                        { icon:"☀️", label:"Luz", val:result.care.light },
                        { icon:"🌡️", label:"Temperatura", val:result.care.temp },
                        { icon:"💦", label:"Humedad", val:result.care.humidity },
                        { icon:"🪴", label:"Sustrato", val:result.care.soil },
                        { icon:"🌿", label:"Abono", val:result.care.fertilizer },
                        { icon:"♾️", label:"Ciclo", val:result.care.lifespan },
                      ].map(c=>(
                        <div key={c.label} style={{ background:"rgba(255,255,255,0.05)", borderRadius:12, padding:"10px 12px" }}>
                          <div style={{ fontSize:10, color:"#86efac88", marginBottom:2 }}>{c.icon} {c.label}</div>
                          <div style={{ fontSize:12, fontWeight:"700", color:"#e8f5e9" }}>{c.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop:8, background:"rgba(74,222,128,0.08)", borderRadius:12, padding:"10px 14px" }}>
                      <div style={{ fontSize:10, color:"#4ade80", fontWeight:"700", marginBottom:4 }}>💡 CONSEJOS</div>
                      <div style={{ fontSize:12, color:"#cce5cc" }}>{result.care.tips}</div>
                    </div>
                    <div style={{ marginTop:8, background:`rgba(${result.care.toxic==="No tóxica"?"74,222,128":"248,113,113"},0.08)`, borderRadius:12, padding:"10px 14px" }}>
                      <div style={{ fontSize:10, color: result.care.toxic==="No tóxica"?"#4ade80":"#f87171", fontWeight:"700", marginBottom:4 }}>⚠️ TOXICIDAD</div>
                      <div style={{ fontSize:12, color:"#cce5cc" }}>{result.care.toxic}</div>
                    </div>
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {result.characteristics && <div style={{ background:"rgba(34,211,238,0.08)", borderRadius:14, padding:"12px 14px", gridColumn:"1/-1" }}><div style={{ fontSize:11, color:"#22d3ee", fontWeight:"700", marginBottom:5 }}>🔬 DATOS</div><div style={{ fontSize:12, color:"#cce5cc", lineHeight:1.7 }}>{result.characteristics.split(";").map((c,i)=><div key={i}>· {c.trim()}</div>)}</div></div>}
                </div>
                {result.curiosity && <div style={{ marginTop:10, background:"rgba(168,85,247,0.1)", borderRadius:14, padding:"12px 14px", border:"1px solid rgba(168,85,247,0.2)" }}><div style={{ fontSize:11, color:"#c084fc", fontWeight:"700", marginBottom:5 }}>✨ DATO CURIOSO</div><div style={{ fontSize:13, color:"#cce5cc", fontStyle:"italic" }}>{result.curiosity}</div></div>}
              </div>
            )}

            {result && (result.type==="none"||result.type==="error") && (
              <div style={{ background:"rgba(248,113,113,0.1)", borderRadius:20, padding:20, border:"1px solid rgba(248,113,113,0.3)", textAlign:"center", marginBottom:20 }}>
                <div style={{ fontSize:32 }}>{result.type==="none"?"🔎":"⚠️"}</div>
                <div style={{ color:"#fca5a5", marginTop:8 }}>{result.message}</div>
              </div>
            )}

            {Object.keys(plantCount).length>0 && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:11, letterSpacing:3, color:"#86efac88", textTransform:"uppercase", marginBottom:12 }}>Especies encontradas ({uniquePlants})</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {Object.entries(plantCount).map(([name,count])=>(
                    <div key={name} style={{ background:"rgba(74,222,128,0.1)", borderRadius:50, padding:"6px 14px", fontSize:12, color:"#4ade80", border:"1px solid rgba(74,222,128,0.2)", display:"flex", alignItems:"center", gap:6 }}>
                      {name}{count>1&&<span style={{ background:"rgba(74,222,128,0.2)", borderRadius:50, padding:"1px 6px", fontSize:10 }}>×{count}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RECYCLE TAB */}
        {tab==="recycle" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ fontSize:11, letterSpacing:3, color:"#86efac88", textTransform:"uppercase", marginBottom:16 }}>Toca lo que reciclas</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {RECYCLE_ITEMS.map(item=>(
                <div key={item.id} className="rc" onClick={()=>handleRecycle(item)} style={{ background:recycleAnim===item.id?`linear-gradient(135deg,${item.color}44,${item.color}22)`:"rgba(255,255,255,0.05)", borderRadius:20, padding:"20px 16px", textAlign:"center", border:`1px solid ${item.color}44`, animation:recycleAnim===item.id?"pop 0.5s ease":"none", boxShadow:recycleAnim===item.id?`0 0 24px ${item.color}66`:"none" }}>
                  <div style={{ fontSize:40 }}>{item.emoji}</div>
                  <div style={{ fontSize:14, fontWeight:"700", marginTop:10, color:item.color }}>{item.label}</div>
                  <div style={{ fontSize:12, color:"#86efac88", marginTop:4 }}>+{item.points} puntos</div>
                  {recycleCount[item.id]>0&&<div style={{ marginTop:8, background:item.color+"22", borderRadius:50, padding:"2px 10px", display:"inline-block", fontSize:11, color:item.color, fontWeight:"700" }}>×{recycleCount[item.id]}</div>}
                </div>
              ))}
            </div>
            <div style={{ marginTop:24, background:"rgba(255,255,255,0.04)", borderRadius:20, padding:20, border:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:14, fontWeight:"700", color:"#4ade80", marginBottom:12 }}>♻️ Tu impacto de reciclaje</div>
              {Object.entries(recycleCount).length===0 ? <div style={{ color:"#86efac88", fontSize:13 }}>Aún no has registrado nada</div> : Object.entries(recycleCount).map(([id,count])=>{const item=RECYCLE_ITEMS.find(r=>r.id===id);return(<div key={id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}><span style={{ fontSize:13 }}>{item.emoji} {item.label}</span><span style={{ color:item.color, fontWeight:"700" }}>{count}× · {count*item.points}pts</span></div>);})}
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {tab==="achievements" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ fontSize:11, letterSpacing:3, color:"#86efac88", textTransform:"uppercase", marginBottom:6 }}>Logros y objetivos</div>
            <div style={{ fontSize:13, color:"#86efac66", marginBottom:20 }}>{unlockedAchievements.length}/{ACHIEVEMENTS.length} desbloqueados</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {ACHIEVEMENTS.map(ach=>{
                const unlocked=unlockedAchievements.includes(ach.id);
                return (
                  <div key={ach.id} style={{ background:unlocked?"linear-gradient(135deg,rgba(251,191,36,0.15),rgba(245,158,11,0.08))":"rgba(255,255,255,0.04)", borderRadius:18, padding:"16px 18px", border:unlocked?"1px solid rgba(251,191,36,0.4)":"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:14, opacity:unlocked?1:0.55 }}>
                    <div style={{ fontSize:36, flexShrink:0, filter:unlocked?"none":"grayscale(1)" }}>{ach.emoji}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <div style={{ fontSize:14, fontWeight:"700", color:unlocked?"#fbbf24":"#86efac88" }}>{ach.title}</div>
                        {unlocked&&<span style={{ fontSize:10, background:"rgba(251,191,36,0.2)", color:"#fbbf24", borderRadius:50, padding:"1px 8px" }}>✓ Conseguido</span>}
                      </div>
                      <div style={{ fontSize:12, color:"#86efac88", marginTop:3 }}>{ach.desc}</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:"800", color:unlocked?"#fbbf24":"#86efac44", flexShrink:0 }}>+{ach.bonus}pts</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GLOBAL LEAGUE TAB */}
        {tab==="league" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontSize:11, letterSpacing:3, color:"#86efac88", textTransform:"uppercase" }}>Clasificación global</div>
              <div style={{ fontSize:64, fontWeight:"900", color:"#fbbf24", lineHeight:1 }}>#{myRank}</div>
              <div style={{ color:"#86efac88", fontSize:13 }}>de {leaderboard.length} jugadores</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {leaderboard.map((f,i)=>(
                <div key={f.name} style={{ background:f.isYou?"linear-gradient(135deg,rgba(22,163,74,0.25),rgba(13,148,136,0.25))":"rgba(255,255,255,0.04)", borderRadius:18, padding:"14px 18px", border:f.isYou?"1px solid rgba(74,222,128,0.4)":"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:14, transform:f.isYou?"scale(1.02)":"scale(1)" }}>
                  <div style={{ fontSize:22, flexShrink:0 }}>{i<3?["🥇","🥈","🥉"][i]:<span style={{ color:"#86efac88",fontWeight:"700",fontSize:14 }}>{i+1}</span>}</div>
                  <div style={{ fontSize:28 }}>{f.avatar||"🌿"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:f.isYou?"800":"600" }}>{f.name}{f.isYou&&<span style={{ fontSize:11, color:"#4ade80" }}> (tú)</span>}</div>
                    <div style={{ fontSize:12, color:"#86efac88", marginTop:2 }}>{f.points} puntos</div>
                  </div>
                  <div style={{ width:70 }}>
                    <div style={{ height:5, background:"rgba(255,255,255,0.1)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:3, width:`${Math.min((f.points/Math.max(...leaderboard.map(l=>l.points),1))*100,100)}%`, background:f.isYou?"linear-gradient(90deg,#4ade80,#22d3ee)":"rgba(255,255,255,0.3)" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIGA TAB */}
        {tab==="liga" && (
          <div style={{ padding:"0 20px" }}>
            {/* My code */}
            <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:20, padding:20, border:"1px solid rgba(255,255,255,0.07)", marginBottom:16, textAlign:"center" }}>
              <div style={{ fontSize:12, color:"#86efac88", marginBottom:8 }}>Tu código de jugador</div>
              <div style={{ fontSize:28, fontWeight:"900", letterSpacing:6, color:"#4ade80", background:"rgba(74,222,128,0.1)", borderRadius:12, padding:"12px 20px", display:"inline-block" }}>{myCode}</div>
              <div style={{ fontSize:11, color:"#86efac66", marginTop:6 }}>Comparte este código con tus amigos</div>
            </div>

            {/* Actions */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              <button onClick={()=>{ setShowCreateLeague(true); setShowJoinLeague(false); }} style={{ background:"linear-gradient(135deg,#16a34a,#0d9488)", color:"white", border:"none", borderRadius:16, padding:"14px", fontSize:13, fontWeight:"700", cursor:"pointer" }}>
                ➕ Crear liga
              </button>
              <button onClick={()=>{ setShowJoinLeague(true); setShowCreateLeague(false); }} style={{ background:"rgba(255,255,255,0.05)", color:"#4ade80", border:"1px solid rgba(74,222,128,0.3)", borderRadius:16, padding:"14px", fontSize:13, fontWeight:"700", cursor:"pointer" }}>
                🔗 Unirse
              </button>
            </div>

            {/* Create league form */}
            {showCreateLeague && (
              <div style={{ background:"rgba(22,163,74,0.1)", borderRadius:20, padding:20, border:"1px solid rgba(74,222,128,0.2)", marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:"700", color:"#4ade80", marginBottom:14 }}>Nueva liga</div>
                <input value={newLeagueName} onChange={e=>setNewLeagueName(e.target.value)} placeholder="Nombre de la liga..."
                  style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:12, padding:"10px 14px", color:"white", fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:10 }} />
                <div style={{ fontSize:12, color:"#86efac88", marginBottom:6 }}>Máximo de jugadores</div>
                <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                  {["3","5","8","10"].map(n=>(
                    <button key={n} onClick={()=>setNewLeagueMax(n)} style={{ flex:1, padding:"8px", borderRadius:10, border:`1px solid ${newLeagueMax===n?"#4ade80":"rgba(255,255,255,0.1)"}`, background:newLeagueMax===n?"rgba(74,222,128,0.2)":"transparent", color:newLeagueMax===n?"#4ade80":"#86efac88", cursor:"pointer", fontSize:13, fontWeight:"700" }}>{n}</button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={createLeague} style={{ flex:1, background:"linear-gradient(135deg,#16a34a,#0d9488)", color:"white", border:"none", borderRadius:12, padding:"12px", fontSize:13, fontWeight:"700", cursor:"pointer" }}>Crear</button>
                  <button onClick={()=>setShowCreateLeague(false)} style={{ flex:1, background:"rgba(255,255,255,0.05)", color:"#86efac88", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px", fontSize:13, cursor:"pointer" }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Join league form */}
            {showJoinLeague && (
              <div style={{ background:"rgba(34,211,238,0.08)", borderRadius:20, padding:20, border:"1px solid rgba(34,211,238,0.2)", marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:"700", color:"#22d3ee", marginBottom:14 }}>Unirse a una liga</div>
                <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="Código de la liga..."
                  style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(34,211,238,0.2)", borderRadius:12, padding:"10px 14px", color:"white", fontSize:13, outline:"none", boxSizing:"border-box", letterSpacing:3, marginBottom:14 }} />
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={joinLeague} style={{ flex:1, background:"linear-gradient(135deg,#0d9488,#0284c7)", color:"white", border:"none", borderRadius:12, padding:"12px", fontSize:13, fontWeight:"700", cursor:"pointer" }}>Unirse</button>
                  <button onClick={()=>setShowJoinLeague(false)} style={{ flex:1, background:"rgba(255,255,255,0.05)", color:"#86efac88", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px", fontSize:13, cursor:"pointer" }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* My leagues */}
            {leagues.length === 0 ? (
              <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:20, padding:40, textAlign:"center", color:"#86efac88", fontSize:14 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
                Aún no tienes ligas.<br />¡Crea una o únete con un código!
              </div>
            ) : (
              leagues.map(league => {
                const sorted = [...league.members].sort((a,b)=>b.points-a.points);
                return (
                  <div key={league.id} style={{ background:"rgba(255,255,255,0.04)", borderRadius:20, padding:20, border:"1px solid rgba(255,255,255,0.07)", marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:"800" }}>{league.name}</div>
                        <div style={{ fontSize:11, color:"#86efac88", marginTop:2 }}>{league.members.length}/{league.maxPlayers} jugadores</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:10, color:"#86efac88" }}>Código liga</div>
                        <div style={{ fontSize:16, fontWeight:"900", letterSpacing:3, color:"#22d3ee" }}>{league.code}</div>
                      </div>
                    </div>
                    {sorted.map((m,i)=>(
                      <div key={m.code} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8, background:m.isYou?"rgba(74,222,128,0.08)":"transparent", borderRadius:10, padding:"8px 10px" }}>
                        <div style={{ fontSize:16 }}>{i<3?["🥇","🥈","🥉"][i]:<span style={{ color:"#86efac88",fontSize:12 }}>{i+1}</span>}</div>
                        <div style={{ flex:1, fontSize:13, fontWeight:m.isYou?"700":"400" }}>{m.name}{m.isYou&&<span style={{ fontSize:10, color:"#4ade80" }}> (tú)</span>}</div>
                        <div style={{ fontSize:13, fontWeight:"700", color:"#fbbf24" }}>{m.points}pts</div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"linear-gradient(0deg,rgba(10,22,40,0.98),transparent)", height:80, pointerEvents:"none", zIndex:10 }} />
    </div>
  );
}