import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

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
  { id: "first_plant",  title: "Primer brote",      desc: "Identifica tu primera planta",        emoji: "🌱", bonus: 20,  check: (p)      => Object.keys(p).length >= 1 },
  { id: "plants_5",     title: "Explorador",         desc: "Identifica 5 especies distintas",     emoji: "🔭", bonus: 50,  check: (p)      => Object.keys(p).length >= 5 },
  { id: "plants_10",    title: "Botánico",            desc: "Identifica 10 especies distintas",    emoji: "🌿", bonus: 150, check: (p)      => Object.keys(p).length >= 10 },
  { id: "plants_20",    title: "Naturalista",         desc: "Identifica 20 especies distintas",    emoji: "🌳", bonus: 400, check: (p)      => Object.keys(p).length >= 20 },
  { id: "recycle_5",    title: "Eco-consciente",      desc: "Recicla 5 objetos",                   emoji: "♻️", bonus: 30,  check: (p,r)    => Object.values(r).reduce((a,b)=>a+b,0) >= 5 },
  { id: "recycle_20",   title: "Eco-héroe",           desc: "Recicla 20 objetos",                  emoji: "🦸", bonus: 100, check: (p,r)    => Object.values(r).reduce((a,b)=>a+b,0) >= 20 },
  { id: "all_recycle",  title: "Reciclador total",    desc: "Recicla al menos 1 de cada tipo",     emoji: "🏅", bonus: 80,  check: (p,r)    => RECYCLE_ITEMS.every(i=>(r[i.id]||0)>=1) },
  { id: "invasora",     title: "Detector invasor",    desc: "Encuentra una planta invasora",       emoji: "🚨", bonus: 60,  check: (p,r,inv)=> inv > 0 },
];

const STATUS_COLORS = { "Autóctona": "#4CAF50", "Invasora": "#F44336", "Cultivada": "#FF9800" };

// ─── HELPERS ──────────────────────────────────────────────────────────────────

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

// ─── COMPONENTE MAP (Leaflet / OpenStreetMap) ─────────────────────────────────

function PlantMap({ markers }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Cargar Leaflet dinámicamente
    if (!window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (mapInstanceRef.current || !mapRef.current) return;
      const map = window.L.map(mapRef.current).setView([40.4168, -3.7038], 5);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
      addMarkers(map);
    }

    return () => {};
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
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
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

  return <div ref={mapRef} style={{ width: "100%", height: 340, borderRadius: 20, overflow: "hidden", zIndex: 0 }} />;
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function EcoQuest() {
  const [tab, setTab] = useState("scan");

  // Perfil
  const [userName,  setUserName]  = useState(() => load("eq_username", ""));
  const [userAvatar, setUserAvatar] = useState(() => load("eq_avatar", "🌿"));

  // Progreso
  const [myPoints,           setMyPoints]           = useState(() => load("eq_points", 0));
  const [plantCount,         setPlantCount]         = useState(() => load("eq_plants", {}));
  const [recycleCount,       setRecycleCount]       = useState(() => load("eq_recycle", {}));
  const [invasoraCount,      setInvasoraCount]      = useState(() => load("eq_invasora", 0));
  const [unlockedAch,        setUnlockedAch]        = useState(() => load("eq_achievements", []));
  const [plantMarkers,       setPlantMarkers]       = useState(() => load("eq_markers", []));
  const [locationPermission, setLocationPermission] = useState(() => load("eq_location_perm", null)); // null | "granted" | "denied"

  // UI scan
  const [scanning,    setScanning]    = useState(false);
  const [result,      setResult]      = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const fileInputRef = useRef(null);

  // UI perfil
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName,       setTempName]       = useState("");
  const [tempAvatar,     setTempAvatar]     = useState("🌿");

  // Notificación
  const [notification, setNotification] = useState(null);

  // ── Persistencia ──
  useEffect(() => { save("eq_points",      myPoints);      }, [myPoints]);
  useEffect(() => { save("eq_plants",      plantCount);    }, [plantCount]);
  useEffect(() => { save("eq_recycle",     recycleCount);  }, [recycleCount]);
  useEffect(() => { save("eq_invasora",    invasoraCount); }, [invasoraCount]);
  useEffect(() => { save("eq_achievements",unlockedAch);   }, [unlockedAch]);
  useEffect(() => { save("eq_markers",     plantMarkers);  }, [plantMarkers]);
  useEffect(() => { save("eq_username",    userName);      }, [userName]);
  useEffect(() => { save("eq_avatar",      userAvatar);    }, [userAvatar]);
  useEffect(() => { save("eq_location_perm", locationPermission); }, [locationPermission]);

  // ── Logros ──
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

  // ── Helpers ──
  const addPoints = (pts, label, emoji) => {
    setMyPoints(prev => prev + pts);
    showNotif(`+${pts} pts — ${label}`, emoji);
  };

  const showNotif = (msg, emoji) => {
    setNotification({ msg, emoji });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Ubicación ──
  const requestLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (locationPermission === "denied") { resolve(null); return; }
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationPermission("granted");
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setLocationPermission("denied");
          resolve(null);
        },
        { timeout: 8000 }
      );
    });
  }, [locationPermission]);

  // ── Info extra con Claude API ──
  const fetchPlantDetails = async (scientificName, commonName) => {
    setLoadingInfo(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Eres un experto botánico. Dame información sobre la planta "${commonName}" (${scientificName}) en formato JSON EXACTAMENTE así, sin markdown ni explicaciones:
{
  "riego": "frecuencia y cantidad de riego en 1-2 frases",
  "tipoHoja": "descripción del tipo de hoja en 1 frase",
  "floracion": "meses o época de floración",
  "cicloVida": "anual, bienal o perenne con breve explicación",
  "alturaTipica": "altura típica de la planta",
  "curiosidad": "un dato curioso e interesante en 1-2 frases",
  "usos": "usos principales de la planta en 1-2 frases"
}`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    } catch (e) {
      return null;
    } finally {
      setLoadingInfo(false);
    }
  };

  // ── Scan foto ──
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanning(true);
    setResult(null);

    // Pedir ubicación (solo si no la hemos pedido ya)
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
        setResult({ type: "error", message: `Error al conectar con iNaturalist (${res.status}). Intenta de nuevo.` });
        setScanning(false);
        return;
      }

      const data = await res.json();
      const top = data.results?.[0];

      if (top?.taxon) {
        const taxon = top.taxon;
        const name       = taxon.preferred_common_name || taxon.name;
        const scientific = taxon.name;
        const score      = Math.round((top.combined_score || 0) * 100);
        const pts        = Math.min(60, Math.max(10, Math.round(score * 0.6)));
        const isInvasora = taxon.establishment_means?.establishment_means === "introduced";

        const parsed = {
          type: "plant",
          name,
          scientific,
          origin:    isInvasora ? "Introducida" : "Nativa",
          status:    isInvasora ? "Invasora" : "Autóctona",
          points:    pts,
          desc:      taxon.wikipedia_summary || `Especie identificada con un ${score}% de confianza.`,
          confidence: score > 70 ? "Alta" : score > 40 ? "Media" : "Baja",
          imageUrl:  taxon.default_photo?.medium_url || null,
          details:   null,
        };

        setResult(parsed);
        setScanning(false);

        // Guardar marcador en mapa
        if (location) {
          setPlantMarkers(prev => [...prev, {
            lat:       location.lat,
            lng:       location.lng,
            name,
            scientific,
            date:      new Date().toLocaleDateString("es-ES"),
          }]);
        }

        // Actualizar contadores
        setPlantCount(prev => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
        if (isInvasora) setInvasoraCount(c => c + 1);
        addPoints(pts, name, "🌿");

        // Buscar info detallada con IA
        const details = await fetchPlantDetails(scientific, name);
        if (details) setResult(prev => prev ? { ...prev, details } : prev);

      } else {
        setResult({ type: "none", message: "No se detectó ninguna planta. Intenta con otra foto con mejor luz." });
        setScanning(false);
      }
    } catch (err) {
      setResult({ type: "error", message: "Error de red. Comprueba tu conexión e inténtalo de nuevo." });
      setScanning(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Reciclaje ──
  const handleRecycle = (item) => {
    setRecycleCount(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    addPoints(item.points, `Reciclé ${item.label}`, item.emoji);
  };

  // ── Derivados ──
  const uniquePlants   = Object.keys(plantCount).length;
  const totalRecycled  = Object.values(recycleCount).reduce((a, b) => a + b, 0);
  const currentRank    = getRank(myPoints);
  const nextRank       = getNextRank(myPoints);
  const rankProgress   = nextRank
    ? ((myPoints - currentRank.min) / (nextRank.min - currentRank.min)) * 100
    : 100;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1628 0%,#0d2218 50%,#0a1628 100%)", fontFamily: "Georgia,serif", color: "#e8f5e9", position: "relative", overflow: "hidden" }}>

      {/* Partículas */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {[...Array(18)].map((_, i) => (
          <div key={i} style={{ position: "absolute", width: 3 + (i % 4) * 2, height: 3 + (i % 4) * 2, borderRadius: "50%", background: i % 3 === 0 ? "#4ade8055" : i % 3 === 1 ? "#86efac22" : "#22d3ee22", left: ((i * 37 + 10) % 95) + "%", top: ((i * 53 + 7) % 90) + "%", animation: `float ${3 + i % 4}s ease-in-out infinite alternate`, animationDelay: (i * 0.3) + "s" }} />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float    { from { transform:translateY(0) } to { transform:translateY(-12px) } }
        @keyframes slideIn  { from { transform:translateY(-50px) scale(.85); opacity:0 } to { transform:translateY(0) scale(1); opacity:1 } }
        @keyframes fadeUp   { from { transform:translateY(16px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes spin     { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        @keyframes pulse    { 0%,100% { opacity:1 } 50% { opacity:.5 } }
        .tab-btn:active     { transform:scale(.96) }
        .card-hover:active  { transform:scale(.97) }
      ` }} />

      {/* Notificación */}
      {notification && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#16a34a,#0d9488)", color: "white", borderRadius: 50, padding: "12px 24px", fontWeight: "bold", fontSize: 14, zIndex: 9999, boxShadow: "0 8px 32px #4ade8055", animation: "slideIn .3s ease", display: "flex", alignItems: "center", gap: 10, maxWidth: "90vw", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ fontSize: 20 }}>{notification.emoji}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{notification.msg}</span>
        </div>
      )}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 110px", position: "relative", zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div style={{ padding: "28px 24px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#4ade80", textTransform: "uppercase", marginBottom: 6 }}>Proyecto</div>
          <div style={{ fontSize: 40, fontWeight: "900", letterSpacing: -1, lineHeight: 1, background: "linear-gradient(135deg,#4ade80,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🌿 EcoQuest</div>
          <div style={{ fontSize: 12, color: "#86efac66", marginTop: 4 }}>Identifica · Recicla · Compite</div>
        </div>

        {/* ── STATS BAR ── */}
        <div style={{ margin: "0 20px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Puntos",   val: myPoints,      emoji: "⭐", color: "#fbbf24" },
            { label: "Especies", val: uniquePlants,   emoji: "🌿", color: "#4ade80" },
            { label: "Reciclado",val: totalRecycled,  emoji: "♻️", color: "#22d3ee" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "12px 6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 18 }}>{s.emoji}</div>
              <div style={{ fontSize: 20, fontWeight: "800", color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 9, color: "#86efac77", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── RANGO MINI ── */}
        <div style={{ margin: "0 20px 20px", background: `linear-gradient(135deg,${currentRank.color}18,${currentRank.color}08)`, borderRadius: 16, padding: "12px 16px", border: `1px solid ${currentRank.color}44`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 30 }}>{currentRank.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: "700", color: currentRank.color }}>{currentRank.name}</div>
            {nextRank ? (
              <>
                <div style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 3, marginTop: 6 }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${Math.min(rankProgress, 100)}%`, background: `linear-gradient(90deg,${currentRank.color},${nextRank.color})`, transition: "width .6s ease" }} />
                </div>
                <div style={{ fontSize: 10, color: "#86efac66", marginTop: 3 }}>{myPoints} / {nextRank.min} pts para {nextRank.emoji} {nextRank.name}</div>
              </>
            ) : (
              <div style={{ fontSize: 11, color: currentRank.color, marginTop: 4 }}>¡Rango máximo alcanzado! 🏆</div>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", margin: "0 20px 22px", background: "rgba(0,0,0,0.35)", borderRadius: 16, padding: 4, gap: 3 }}>
          {[
            { id: "scan",         label: "📸",   title: "Plantas"  },
            { id: "recycle",      label: "♻️",   title: "Reciclar" },
            { id: "achievements", label: "🏆",   title: "Logros"   },
            { id: "map",          label: "🗺️",   title: "Mapa"     },
            { id: "profile",      label: "👤",   title: "Perfil"   },
          ].map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)} style={{ flex: 1, padding: "9px 2px 6px", borderRadius: 12, border: "none", background: tab === t.id ? "linear-gradient(135deg,#16a34a,#0d9488)" : "transparent", color: tab === t.id ? "white" : "#86efac77", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, boxShadow: tab === t.id ? "0 4px 12px #16a34a44" : "none" }}>
              <span style={{ fontSize: 16 }}>{t.label}</span>
              <span style={{ fontSize: 9, fontWeight: tab === t.id ? "700" : "400" }}>{t.title}</span>
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════
            TAB: SCAN
        ════════════════════════════════════════════════ */}
        {tab === "scan" && (
          <div style={{ padding: "0 20px" }}>

            {/* Zona upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ background: "rgba(255,255,255,0.03)", borderRadius: 24, padding: 28, border: "2px dashed rgba(74,222,128,0.3)", textAlign: "center", marginBottom: 20, cursor: "pointer" }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: "none" }} />

              {scanning ? (
                <>
                  {previewUrl && <img src={previewUrl} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 14, marginBottom: 14, opacity: .6 }} />}
                  <div style={{ fontSize: 44, animation: "spin 1s linear infinite", display: "inline-block" }}>🔍</div>
                  <div style={{ marginTop: 12, color: "#4ade80", fontSize: 14 }}>Identificando especie...</div>
                  <div style={{ fontSize: 11, color: "#86efac55", marginTop: 4 }}>iNaturalist · millones de especies</div>
                </>
              ) : result?.type === "plant" && previewUrl ? (
                <>
                  <img src={previewUrl} alt="" style={{ width: "100%", maxHeight: 150, objectFit: "cover", borderRadius: 14, marginBottom: 10 }} />
                  <div style={{ fontSize: 12, color: "#4ade80" }}>📸 Toca para analizar otra foto</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 52 }}>📸</div>
                  <div style={{ fontSize: 16, fontWeight: "700", color: "#4ade80", marginTop: 10 }}>Fotografía una planta</div>
                  <div style={{ fontSize: 12, color: "#86efac77", marginTop: 5 }}>Identificación con iNaturalist · IA</div>
                  <div style={{ marginTop: 14, display: "inline-block", background: "linear-gradient(135deg,#16a34a,#0d9488)", color: "white", borderRadius: 50, padding: "9px 26px", fontSize: 13, fontWeight: "700" }}>Abrir cámara</div>
                </>
              )}
            </div>

            {/* Resultado */}
            {result?.type === "plant" && (
              <div style={{ background: "linear-gradient(135deg,rgba(22,163,74,0.1),rgba(13,148,136,0.1))", borderRadius: 22, padding: 20, border: "1px solid rgba(74,222,128,0.25)", marginBottom: 20, animation: "fadeUp .4s ease" }}>

                {/* Cabecera especie */}
                <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                  {result.imageUrl
                    ? <img src={result.imageUrl} alt="" style={{ width: 64, height: 64, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ fontSize: 48, flexShrink: 0 }}>🌿</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: "800" }}>{result.name}</div>
                      <span style={{ background: (STATUS_COLORS[result.status] || "#888") + "33", color: STATUS_COLORS[result.status] || "#888", borderRadius: 50, padding: "2px 10px", fontSize: 10, fontWeight: "700" }}>{result.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#86efac77", fontStyle: "italic", marginTop: 2 }}>{result.scientific}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#fbbf24" }}>🌍 {result.origin}</span>
                      <span style={{ fontSize: 11, color: "#fbbf24" }}>⭐ +{result.points} pts</span>
                      <span style={{ fontSize: 11, color: result.confidence === "Alta" ? "#4ade80" : result.confidence === "Media" ? "#fbbf24" : "#f87171" }}>● {result.confidence}</span>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div style={{ fontSize: 13, color: "#cce5cc", lineHeight: 1.65, marginBottom: 14 }}>{result.desc}</div>

                {/* Info detallada IA */}
                {loadingInfo && (
                  <div style={{ textAlign: "center", padding: "16px 0", color: "#4ade8088", fontSize: 12, animation: "pulse 1.5s infinite" }}>
                    ✨ Cargando información detallada con IA...
                  </div>
                )}

                {result.details && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    {[
                      { key: "riego",       label: "💧 RIEGO",       color: "#22d3ee" },
                      { key: "floracion",   label: "🌸 FLORACIÓN",   color: "#f9a8d4" },
                      { key: "tipoHoja",    label: "🍃 TIPO DE HOJA",color: "#4ade80" },
                      { key: "cicloVida",   label: "🔄 CICLO",       color: "#a78bfa" },
                      { key: "alturaTipica",label: "📏 ALTURA",      color: "#fbbf24" },
                      { key: "usos",        label: "🌿 USOS",        color: "#86efac", full: true },
                      { key: "curiosidad",  label: "✨ CURIOSIDAD",  color: "#c084fc", full: true },
                    ].map(f => result.details[f.key] ? (
                      <div key={f.key} style={{ background: f.color + "12", borderRadius: 14, padding: "12px 14px", gridColumn: f.full ? "1/-1" : "auto" }}>
                        <div style={{ fontSize: 10, color: f.color, fontWeight: "700", marginBottom: 5 }}>{f.label}</div>
                        <div style={{ fontSize: 12, color: "#cce5cc", lineHeight: 1.55 }}>{result.details[f.key]}</div>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            )}

            {/* Error / no encontrado */}
            {result && (result.type === "none" || result.type === "error") && (
              <div style={{ background: "rgba(248,113,113,0.08)", borderRadius: 18, padding: 18, border: "1px solid rgba(248,113,113,0.25)", textAlign: "center", marginBottom: 18 }}>
                <div style={{ fontSize: 30 }}>{result.type === "none" ? "🔎" : "⚠️"}</div>
                <div style={{ color: "#fca5a5", marginTop: 8, fontSize: 13 }}>{result.message}</div>
              </div>
            )}

            {/* Especies encontradas */}
            {uniquePlants > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#86efac66", textTransform: "uppercase", marginBottom: 10 }}>Especies encontradas ({uniquePlants})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {Object.entries(plantCount).map(([name, count]) => (
                    <div key={name} style={{ background: "rgba(74,222,128,0.1)", borderRadius: 50, padding: "5px 12px", fontSize: 11, color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", gap: 5 }}>
                      {name}
                      {count > 1 && <span style={{ background: "rgba(74,222,128,0.2)", borderRadius: 50, padding: "1px 6px", fontSize: 10 }}>x{count}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: RECICLAR
        ════════════════════════════════════════════════ */}
        {tab === "recycle" && (
          <div style={{ padding: "0 20px" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#86efac66", textTransform: "uppercase", marginBottom: 14 }}>Toca lo que reciclas</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {RECYCLE_ITEMS.map(item => (
                <div key={item.id} className="card-hover" onClick={() => handleRecycle(item)} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: "20px 14px", textAlign: "center", border: `1px solid ${item.color}44`, cursor: "pointer", transition: "transform .1s ease" }}>
                  <div style={{ fontSize: 38 }}>{item.emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: "700", marginTop: 10, color: item.color }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#86efac77", marginTop: 4 }}>+{item.points} pts</div>
                  {recycleCount[item.id] > 0 && (
                    <div style={{ marginTop: 8, background: item.color + "22", borderRadius: 50, padding: "2px 10px", display: "inline-block", fontSize: 11, color: item.color, fontWeight: "700" }}>x{recycleCount[item.id]}</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 22, background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 18, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 14, fontWeight: "700", color: "#4ade80", marginBottom: 12 }}>♻️ Tu impacto</div>
              {Object.entries(recycleCount).length === 0
                ? <div style={{ color: "#86efac55", fontSize: 13 }}>Aún no has registrado nada</div>
                : Object.entries(recycleCount).map(([id, count]) => {
                    const item = RECYCLE_ITEMS.find(r => r.id === id);
                    return (
                      <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 13 }}>{item.emoji} {item.label}</span>
                        <span style={{ color: item.color, fontWeight: "700", fontSize: 13 }}>{count}× · {count * item.points} pts</span>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: LOGROS
        ════════════════════════════════════════════════ */}
        {tab === "achievements" && (
          <div style={{ padding: "0 20px" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#86efac66", textTransform: "uppercase", marginBottom: 6 }}>Logros</div>
            <div style={{ fontSize: 12, color: "#86efac55", marginBottom: 18 }}>{unlockedAch.length}/{ACHIEVEMENTS.length} desbloqueados</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ACHIEVEMENTS.map(ach => {
                const unlocked = unlockedAch.includes(ach.id);
                return (
                  <div key={ach.id} style={{ background: unlocked ? "linear-gradient(135deg,rgba(251,191,36,0.13),rgba(245,158,11,0.06))" : "rgba(255,255,255,0.03)", borderRadius: 18, padding: "14px 16px", border: unlocked ? "1px solid rgba(251,191,36,0.35)" : "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, opacity: unlocked ? 1 : 0.5 }}>
                    <div style={{ fontSize: 32, filter: unlocked ? "none" : "grayscale(1)" }}>{ach.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 13, fontWeight: "700", color: unlocked ? "#fbbf24" : "#86efac77" }}>{ach.title}</div>
                        {unlocked && <span style={{ fontSize: 9, background: "rgba(251,191,36,0.2)", color: "#fbbf24", borderRadius: 50, padding: "1px 8px" }}>✓ Conseguido</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#86efac66", marginTop: 2 }}>{ach.desc}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: "800", color: unlocked ? "#fbbf24" : "#86efac33" }}>+{ach.bonus}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: MAPA
        ════════════════════════════════════════════════ */}
        {tab === "map" && (
          <div style={{ padding: "0 20px" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#86efac66", textTransform: "uppercase", marginBottom: 6 }}>Mapa de hallazgos</div>
            <div style={{ fontSize: 12, color: "#86efac55", marginBottom: 16 }}>
              {plantMarkers.length === 0
                ? "Aún no has identificado plantas con ubicación"
                : `${plantMarkers.length} planta${plantMarkers.length > 1 ? "s" : ""} registrada${plantMarkers.length > 1 ? "s" : ""}`}
            </div>

            {locationPermission === "denied" && (
              <div style={{ background: "rgba(248,113,113,0.08)", borderRadius: 16, padding: 14, border: "1px solid rgba(248,113,113,0.2)", marginBottom: 16, fontSize: 12, color: "#fca5a5", textAlign: "center" }}>
                ⚠️ Has denegado el permiso de ubicación. Actívalo en la configuración del navegador para registrar plantas en el mapa.
              </div>
            )}

            <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(74,222,128,0.2)", marginBottom: 16 }}>
              <PlantMap markers={plantMarkers} />
            </div>

            {plantMarkers.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...plantMarkers].reverse().map((m, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "12px 16px", border: "1px solid rgba(74,222,128,0.12)", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 24 }}>🌿</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: "700" }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "#86efac66", fontStyle: "italic" }}>{m.scientific}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#86efac55", textAlign: "right" }}>
                      <div>{m.date}</div>
                      <div style={{ fontSize: 10, marginTop: 2 }}>{m.lat.toFixed(3)}, {m.lng.toFixed(3)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: PERFIL
        ════════════════════════════════════════════════ */}
        {tab === "profile" && (
          <div style={{ padding: "0 20px" }}>

            {/* Tarjeta perfil */}
            <div style={{ background: `linear-gradient(135deg,${currentRank.color}18,${currentRank.color}06)`, borderRadius: 24, padding: 24, border: `1px solid ${currentRank.color}33`, marginBottom: 20, textAlign: "center" }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>{userAvatar}</div>
              <div style={{ fontSize: 22, fontWeight: "800" }}>{userName || "Explorador"}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 20 }}>{currentRank.emoji}</span>
                <span style={{ fontSize: 16, color: currentRank.color, fontWeight: "700" }}>{currentRank.name}</span>
              </div>
              <div style={{ fontSize: 13, color: "#86efac66", marginTop: 4 }}>{myPoints} puntos totales</div>

              {/* Barra de rango */}
              {nextRank && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                    <div style={{ height: "100%", borderRadius: 3, width: `${Math.min(rankProgress, 100)}%`, background: `linear-gradient(90deg,${currentRank.color},${nextRank.color})`, transition: "width .6s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#86efac55", marginTop: 6 }}>
                    {nextRank.min - myPoints} pts para {nextRank.emoji} {nextRank.name}
                  </div>
                </div>
              )}

              <button onClick={() => { setTempName(userName); setTempAvatar(userAvatar); setEditingProfile(true); }} style={{ marginTop: 18, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", borderRadius: 50, padding: "9px 22px", fontSize: 13, cursor: "pointer", fontWeight: "700" }}>
                ✏️ Editar perfil
              </button>
            </div>

            {/* Editor perfil */}
            {editingProfile && (
              <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 22, padding: 20, border: "1px solid rgba(74,222,128,0.2)", marginBottom: 20, animation: "fadeUp .3s ease" }}>
                <div style={{ fontSize: 13, fontWeight: "700", color: "#4ade80", marginBottom: 16 }}>Editar perfil</div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#86efac77", marginBottom: 8 }}>NOMBRE</div>
                  <input
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { setUserName(tempName); setUserAvatar(tempAvatar); setEditingProfile(false); } }}
                    placeholder="Tu nombre..."
                    style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 12, padding: "10px 14px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: "#86efac77", marginBottom: 10 }}>AVATAR</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
                    {AVATAR_OPTIONS.map(av => (
                      <div key={av} onClick={() => setTempAvatar(av)} style={{ fontSize: 26, textAlign: "center", padding: 6, borderRadius: 10, cursor: "pointer", background: tempAvatar === av ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.05)", border: tempAvatar === av ? "1px solid rgba(74,222,128,0.5)" : "1px solid transparent" }}>
                        {av}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setUserName(tempName); setUserAvatar(tempAvatar); setEditingProfile(false); }} style={{ flex: 1, background: "linear-gradient(135deg,#16a34a,#0d9488)", color: "white", border: "none", borderRadius: 50, padding: "11px", fontSize: 13, cursor: "pointer", fontWeight: "700" }}>
                    Guardar
                  </button>
                  <button onClick={() => setEditingProfile(false)} style={{ flex: 1, background: "rgba(255,255,255,0.07)", color: "#86efac88", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 50, padding: "11px", fontSize: 13, cursor: "pointer" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Todos los rangos */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 18, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: "700", color: "#4ade80", marginBottom: 14 }}>🏅 Todos los rangos</div>
              {RANKS.map((r, i) => {
                const achieved = myPoints >= r.min;
                const isCurrentRank = getRank(myPoints).name === r.name;
                return (
                  <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < RANKS.length - 1 ? 12 : 0, opacity: achieved ? 1 : 0.4 }}>
                    <div style={{ fontSize: 24 }}>{r.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: "700", color: r.color }}>{r.name}</span>
                        {isCurrentRank && <span style={{ fontSize: 9, background: r.color + "33", color: r.color, borderRadius: 50, padding: "1px 8px" }}>● Actual</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#86efac55" }}>desde {r.min} pts</div>
                    </div>
                    {achieved && <div style={{ fontSize: 16 }}>✅</div>}
                  </div>
                );
              })}
            </div>

            {/* Stats perfil */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Plantas identificadas", val: uniquePlants,   emoji: "🌿", color: "#4ade80" },
                { label: "Objetos reciclados",    val: totalRecycled,  emoji: "♻️", color: "#22d3ee" },
                { label: "Logros obtenidos",       val: unlockedAch.length, emoji: "🏆", color: "#fbbf24" },
                { label: "Puntos totales",         val: myPoints,      emoji: "⭐", color: "#f9a8d4" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "16px 12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: 26 }}>{s.emoji}</div>
                  <div style={{ fontSize: 24, fontWeight: "800", color: s.color, marginTop: 4 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "#86efac55", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Fade inferior */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg,rgba(10,22,40,0.97),transparent)", height: 90, pointerEvents: "none", zIndex: 10 }} />
    </div>
  );
}
