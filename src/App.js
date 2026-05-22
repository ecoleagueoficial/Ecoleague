import { useState, useRef, useEffect } from "react";

const FRIENDS = [
  { name: "Tú", avatar: "🌿", points: 0, isYou: true },
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

const statusColors = { "Autóctona": "#4CAF50", "Invasora": "#F44336", "Cultivada": "#FF9800" };

export default function EcoQuest() {
  const [tab, setTab] = useState("scan");
  const [myPoints, setMyPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState(FRIENDS);
  const [log, setLog] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [recycleAnim, setRecycleAnim] = useState(null);
  const [plantCount, setPlantCount] = useState({});
  const [recycleCount, setRecycleCount] = useState({});
  const [invasoraCount, setInvasoraCount] = useState(0);
  const [notification, setNotification] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAchievements.includes(ach.id) && ach.check(plantCount, recycleCount, invasoraCount)) {
        setUnlockedAchievements(prev => {
          if (prev.includes(ach.id)) return prev;
          setMyPoints(pts => {
            const newPts = pts + ach.bonus;
            setLeaderboard(lb => lb.map(f => f.isYou ? { ...f, points: newPts } : f).sort((a,b)=>b.points-a.points));
            return newPts;
          });
          setLog(prev => [{ label: `🏆 Logro: ${ach.title}`, emoji: ach.emoji, pts: ach.bonus, time: new Date().toLocaleTimeString() }, ...prev.slice(0,19)]);
          showNotification(`🏆 ¡Logro desbloqueado! ${ach.title} (+${ach.bonus}pts)`, ach.emoji);
          return [...prev, ach.id];
        });
      }
    });
  }, [plantCount, recycleCount, invasoraCount]);

  const addPoints = (pts, label, emoji) => {
    setMyPoints(prev => {
      const n = prev + pts;
      setLeaderboard(lb => lb.map(f => f.isYou ? { ...f, points: n } : f).sort((a,b)=>b.points-a.points));
      return n;
    });
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
    const base64 = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.readAsDataURL(file); });
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
            { type: "text", text: `Eres experto en botánica. Analiza la imagen y responde SOLO JSON válido sin markdown.\nSi hay planta, árbol, flor u hongo:\n{"type":"plant","name":"nombre común español","scientific":"nombre científico","origin":"región origen","status":"Autóctona|Invasora|Cultivada","emoji":"emoji","points":10-60,"desc":"descripción 1-2 frases","confidence":"Alta|Media|Baja","uses":"usos 1-2 frases","flowering":"época floración","characteristics":"3 rasgos separados por punto y coma","curiosity":"dato curioso"}\nSi no hay planta: {"type":"none","message":"No se detecta ninguna planta en la imagen"}` }
          ]}]
        })
      });
      const data = await response.json();
      const text = data.content?.map(c => c.text||"").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setResult(parsed);
      if (parsed.type === "plant") {
        setPlantCount(prev => ({ ...prev, [parsed.name]: (prev[parsed.name]||0)+1 }));
        if (parsed.status === "Invasora") setInvasoraCount(c => c+1);
        addPoints(parsed.points, parsed.name, parsed.emoji);
      }
    } catch { setResult({ type: "error", message: "No se pudo analizar la imagen. Inténtalo de nuevo." }); }
    setScanning(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRecycle = (item) => {
    setRecycleAnim(item.id);
    setTimeout(() => setRecycleAnim(null), 600);
    setRecycleCount(prev => ({ ...prev, [item.id]: (prev[item.id]||0)+1 }));
    addPoints(item.points, `Reciclé ${item.label}`, item.emoji);
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
        .tab-btn{transition:all 0.2s;cursor:pointer}.tab-btn:hover{transform:translateY(-2px)}
        .rc{transition:all 0.2s;cursor:pointer}.rc:hover{transform:scale(1.05)}
      `}</style>

      {notification && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#16a34a,#15803d)", color:"white", borderRadius:50, padding:"12px 28px", fontWeight:"bold", fontSize:14, zIndex:1000, boxShadow:"0 8px 32px #4ade8066", animation:"slideIn 0.3s ease", display:"flex", alignItems:"center", gap:10, maxWidth:"88vw", textAlign:"center" }}>
          <span style={{ fontSize:22 }}>{notification.emoji}</span>{notification.msg}
        </div>
      )}

      <div style={{ maxWidth:480, margin:"0 auto", padding:"0 0 100px", position:"relative", zIndex:1 }}>
        <div style={{ padding:"32px 24px 20px", textAlign:"center" }}>
          <div style={{ fontSize:13, letterSpacing:4, color:"#4ade80", textTransform:"uppercase", marginBottom:8 }}>Proyecto EcoQuest</div>
          <div style={{ fontSize:42, fontWeight:"900", letterSpacing:-1, lineHeight:1, background:"linear-gradient(135deg,#4ade80,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>🌿 EcoQuest</div>
          <div style={{ fontSize:13, color:"#86efac88", marginTop:6 }}>Identifica, recicla, compite</div>
        </div>

        <div style={{ margin:"0 20px 20px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[{label:"Mis puntos",val:myPoints,emoji:"⭐",color:"#fbbf24"},{label:"Especies",val:uniquePlants,emoji:"🌿",color:"#4ade80"},{label:"Reciclado",val:totalRecycled,emoji:"♻️",color:"#22d3ee"}].map(s=>(
            <div key={s.label} style={{ background:"rgba(255,255,255,0.05)", borderRadius:16, padding:"14px 8px", textAlign:"center", border:"1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize:22 }}>{s.emoji}</div>
              <div style={{ fontSize:22, fontWeight:"800", color:s.color }}>{s.val}</div>
              <div style={{ fontSize:10, color:"#86efac88", marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

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

        <div style={{ display:"flex", margin:"0 20px 24px", background:"rgba(0,0,0,0.3)", borderRadius:16, padding:4, gap:4 }}>
          {[{id:"scan",label:"📸 Plantas"},{id:"recycle",label:"♻️ Reciclar"},{id:"achievements",label:"🏆 Logros"},{id:"league",label:"🥇 Liga"}].map(t=>(
            <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)} style={{ flex:1, padding:"10px 2px", borderRadius:12, border:"none", background:tab===t.id?"linear-gradient(135deg,#16a34a,#0d9488)":"transparent", color:tab===t.id?"white":"#86efac88", fontSize:10, fontWeight:tab===t.id?"700":"400", cursor:"pointer", boxShadow:tab===t.id?"0 4px 12px #16a34a44":"none" }}>{t.label}</button>
          ))}
        </div>

        {tab==="scan" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:24, padding:28, border:"2px dashed rgba(74,222,128,0.3)", textAlign:"center", marginBottom:24, cursor:"pointer" }} onClick={()=>fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handlePhotoUpload} />
              {scanning ? (
                <div>
                  <div style={{ fontSize:50, animation:"spin 1s linear infinite", display:"inline-block" }}>🔍</div>
                  <div style={{ marginTop:16, color:"#4ade80", fontSize:15 }}>Analizando con IA...</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize:56 }}>📸</div>
                  <div style={{ fontSize:17, fontWeight:"700", color:"#4ade80", marginTop:12 }}>Fotografía una planta</div>
                  <div style={{ fontSize:13, color:"#86efac88", marginTop:6 }}>La IA la identificará al instante</div>
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
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  {result.uses && <div style={{ background:"rgba(74,222,128,0.08)", borderRadius:14, padding:"12px 14px", gridColumn:"1/-1" }}><div style={{ fontSize:11, color:"#4ade80", fontWeight:"700", marginBottom:5 }}>🌿 USOS</div><div style={{ fontSize:13, color:"#cce5cc", lineHeight:1.5 }}>{result.uses}</div></div>}
                  {result.flowering && <div style={{ background:"rgba(251,191,36,0.08)", borderRadius:14, padding:"12px 14px" }}><div style={{ fontSize:11, color:"#fbbf24", fontWeight:"700", marginBottom:5 }}>🌸 FLORACIÓN</div><div style={{ fontSize:13, color:"#cce5cc" }}>{result.flowering}</div></div>}
                  {result.characteristics && <div style={{ background:"rgba(34,211,238,0.08)", borderRadius:14, padding:"12px 14px" }}><div style={{ fontSize:11, color:"#22d3ee", fontWeight:"700", marginBottom:5 }}>🔬 CARACTERÍSTICAS</div><div style={{ fontSize:12, color:"#cce5cc", lineHeight:1.7 }}>{result.characteristics.split(";").map((c,i)=><div key={i}>· {c.trim()}</div>)}</div></div>}
                </div>
                {result.curiosity && <div style={{ background:"rgba(168,85,247,0.1)", borderRadius:14, padding:"12px 14px", border:"1px solid rgba(168,85,247,0.2)" }}><div style={{ fontSize:11, color:"#c084fc", fontWeight:"700", marginBottom:5 }}>✨ DATO CURIOSO</div><div style={{ fontSize:13, color:"#cce5cc", fontStyle:"italic" }}>{result.curiosity}</div></div>}
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

        {tab==="league" && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontSize:11, letterSpacing:3, color:"#86efac88", textTransform:"uppercase" }}>Tu posición</div>
              <div style={{ fontSize:64, fontWeight:"900", color:"#fbbf24", lineHeight:1 }}>#{myRank}</div>
              <div style={{ color:"#86efac88", fontSize:13 }}>de {leaderboard.length} jugadores</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {leaderboard.map((f,i)=>(
                <div key={f.name} style={{ background:f.isYou?"linear-gradient(135deg,rgba(22,163,74,0.25),rgba(13,148,136,0.25))":"rgba(255,255,255,0.04)", borderRadius:18, padding:"14px 18px", border:f.isYou?"1px solid rgba(74,222,128,0.4)":"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:14, transform:f.isYou?"scale(1.02)":"scale(1)", boxShadow:f.isYou?"0 4px 20px rgba(74,222,128,0.15)":"none" }}>
                  <div style={{ fontSize:22, flexShrink:0 }}>{i<3?["🥇","🥈","🥉"][i]:<span style={{ color:"#86efac88",fontWeight:"700",fontSize:14 }}>{i+1}</span>}</div>
                  <div style={{ fontSize:28 }}>{f.avatar}</div>
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
            <div style={{ marginTop:20, background:"rgba(255,255,255,0.04)", borderRadius:20, padding:20, border:"1px solid rgba(255,255,255,0.07)", textAlign:"center" }}>
              <div style={{ fontSize:13, color:"#86efac88" }}>📲 Comparte tu código de liga</div>
              <div style={{ marginTop:12, background:"rgba(74,222,128,0.1)", borderRadius:12, padding:"10px 20px", fontSize:22, fontWeight:"900", letterSpacing:4, color:"#4ade80" }}>ECO-4827</div>
              <div style={{ fontSize:11, color:"#86efac8866", marginTop:6 }}>Código de sala</div>
            </div>
          </div>
        )}
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"linear-gradient(0deg,rgba(10,22,40,0.98),transparent)", height:80, pointerEvents:"none", zIndex:10 }} />
    </div>
  );
}
