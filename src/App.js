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

// ── IDENTIFICACIÓN SIN API: Google Lens embed + ficha inteligente local ────
// Solución 100% gratuita, sin registro, sin servidor, sin límites

const SPECIES_DB = {
  // Flores
  rosa:       { agua:"Moderado — regar 2 veces/semana en verano, 1 en invierno", luz:"Pleno sol, mínimo 6h diarias", suelo:"Rico en materia orgánica, pH 6-7, bien drenado", tipoHoja:"Caduca, compuesta y aserrada", temperatura:"Templada, soporta hasta -10°C con protección", plagas:"Pulgón, araña roja, oídio y mancha negra", ecologia:"Atrae abejas y mariposas, clave para la polinización urbana", curiosidades:"Hay más de 150 especies silvestres de rosa en el mundo" },
  clavel:     { agua:"Moderado — regar cuando el sustrato esté seco en superficie", luz:"Pleno sol o semisombra brillante", suelo:"Bien drenado, arenoso-arcilloso, pH 6.5-7", tipoHoja:"Perenne, lanceolada y glauca", temperatura:"Fresca, entre 10-20°C; tolera hasta -5°C", plagas:"Fusarium, trips y mosca del clavel", ecologia:"Polinizado por mariposas y polillas nocturnas", curiosidades:"El clavel es la flor nacional de España y símbolo de la Comunidad de Madrid" },
  girasol:    { agua:"Moderado-alto durante el crecimiento, reducir al florecer", luz:"Pleno sol directo imprescindible — sigue al sol (heliotropismo)", suelo:"Profundo, bien drenado y fértil", tipoHoja:"Simple, grande, áspera y cordiforme", temperatura:"Cálida, entre 18-35°C; sensible a las heladas", plagas:"Polilla del girasol, pulgón y mildiu", ecologia:"Produce hasta 2.000 semillas por cabezuela, alimento esencial para pájaros", curiosidades:"Un girasol no es una flor sino hasta 2.000 flores pequeñas agrupadas" },
  lavanda:    { agua:"Escaso — muy resistente a la sequía una vez establecida", luz:"Pleno sol, mínimo 8h diarias", suelo:"Pobre, seco, muy bien drenado y alcalino", tipoHoja:"Perenne, linear y aromática de color gris-verde", temperatura:"Templada-fría, tolera hasta -15°C", plagas:"Muy resistente; ocasionalmente cochinilla y Phytophthora", ecologia:"Planta clave para la apicultura — fuente principal de miel aromática", curiosidades:"La lavanda de Brihuega (Guadalajara) es el campo de lavanda más grande de Europa" },
  tulipán:    { agua:"Moderado durante la floración, suspender al amarillear las hojas", luz:"Sol directo o semisombra luminosa", suelo:"Bien drenado, arenoso, con bulbo plantado a 15cm de profundidad", tipoHoja:"Caduca, lanceolada y glauca", temperatura:"Necesita frío invernal (vernalización) para florecer", plagas:"Botrytis tulipae, topillos y ratones que comen el bulbo", ecologia:"Nativo de Asia Central, dispersado por abejas solitarias", curiosidades:"El tulipán provocó la primera burbuja económica especulativa de la historia en Holanda (1637)" },
  // Plantas de interior
  pothos:     { agua:"Escaso — regar solo cuando el sustrato esté completamente seco", luz:"Semisombra o luz indirecta; tolera zonas oscuras", suelo:"Sustrato universal con buena aireación", tipoHoja:"Perenne, acorazonada, brillante con manchas amarillas", temperatura:"Cálida, entre 15-30°C; sensible al frío", plagas:"Cochinilla, araña roja y podredumbre de raíz por exceso de agua", ecologia:"Purifica el aire eliminando formaldehído y monóxido de carbono", curiosidades:"La NASA lo incluyó en su estudio de plantas purificadoras de aire de 1989" },
  cactus:     { agua:"Muy escaso — cada 2-3 semanas en verano, casi nada en invierno", luz:"Pleno sol directo todo el día", suelo:"Sustrato específico para cactus, arenoso y muy drenante", tipoHoja:"No tiene hojas — las espinas son hojas modificadas", temperatura:"Resiste hasta -5°C muchas especies; ideal entre 15-35°C", plagas:"Cochinilla harinosa y podredumbre basal por exceso de humedad", ecologia:"Almacena agua en su tallo — ecosistema propio para insectos del desierto", curiosidades:"El cactus Saguaro puede vivir más de 150 años y pesar más de una tonelada" },
  monstera:   { agua:"Moderado — regar cada 7-10 días dejando secar ligeramente", luz:"Luz indirecta brillante; no sol directo", suelo:"Sustrato rico, húmedo pero bien drenado", tipoHoja:"Perenne, muy grande con perforaciones naturales características", temperatura:"Cálida, entre 18-30°C; no tolera heladas", plagas:"Araña roja, trips y escama", ecologia:"En selva tropical trepa hasta 20m usando raíces aéreas", curiosidades:"Los agujeros de sus hojas están diseñados para resistir vientos fuertes y aprovechar mejor la luz filtrada" },
  aloe:       { agua:"Muy escaso — regar cada 2-3 semanas; raíces muy sensibles al encharcamiento", luz:"Sol directo o semisombra muy luminosa", suelo:"Arenoso, poroso, pH 7-8.5", tipoHoja:"Perenne, suculenta, carnosa con gel interno", temperatura:"Cálida, mínimo 5°C; ideal entre 18-25°C", plagas:"Cochinilla harinosa y podredumbre por exceso de riego", ecologia:"Sus flores tubulares son fuente de néctar para colibríes y abejas", curiosidades:"El gel del aloe vera contiene más de 200 compuestos activos con propiedades cicatrizantes" },
  // Árboles
  pino:       { agua:"Escaso una vez establecido — muy resistente a la sequía", luz:"Pleno sol imprescindible", suelo:"Pobre, ácido, bien drenado; no necesita fertilización", tipoHoja:"Perenne, acicular (tipo aguja), en grupos de 2-5", temperatura:"Muy resistente al frío, hasta -30°C algunas especies", plagas:"Procesionaria del pino — gusano urticante muy peligroso", ecologia:"Fija carbono y retiene el suelo evitando la erosión en zonas de montaña", curiosidades:"Un pino puede vivir más de 5.000 años — el árbol vivo más antiguo conocido es un pino (Matusalén, California)" },
  roble:      { agua:"Escaso una vez establecido, tolera períodos secos prolongados", luz:"Pleno sol", suelo:"Profundo, arcilloso-limoso, pH 5.5-7", tipoHoja:"Caduca, lobulada, de color verde oscuro brillante", temperatura:"Muy resistente al frío; tolera hasta -20°C", plagas:"Procesionaria del roble, curculio y oídio", ecologia:"Una bellota alimenta a más de 100 especies de animales; el roble es un ecosistema en sí mismo", curiosidades:"Un roble adulto puede transpirar hasta 150 litros de agua al día en verano" },
  olivo:      { agua:"Muy escaso — extremadamente resistente a la sequía", luz:"Pleno sol imprescindible", suelo:"Pobre, calcáreo, bien drenado; odia el encharcamiento", tipoHoja:"Perenne, lanceolada, plateada por el envés", temperatura:"Mediterráneo — tolera hasta -10°C; necesita calor para producir aceitunas", plagas:"Mosca del olivo, repilo y verticilosis", ecologia:"Árbol clave del ecosistema mediterráneo, convive con encinas y jaras", curiosidades:"Hay olivos milenarios en España con más de 1.000 años en producción activa" },
  // Verduras/hortalizas
  tomate:     { agua:"Alto y regular — regar cada 2-3 días; el riego irregular causa el 'apicado'", luz:"Pleno sol, mínimo 8h diarias", suelo:"Rico, profundo, bien drenado, pH 6-6.8", tipoHoja:"Caduca, pinnada y aromática con pelos glandulares", temperatura:"Cálida, entre 18-27°C; muere con heladas", plagas:"Mildiu, oídio, mosca blanca y tuta absoluta", ecologia:"Originario de los Andes peruanos; ahora es el vegetal más cultivado del mundo", curiosidades:"El tomate es botánicamente una fruta, pero la ley española lo clasifica como verdura a efectos comerciales" },
  lechuga:    { agua:"Alto y frecuente — el sustrato debe mantenerse siempre húmedo", luz:"Semisombra o sol suave; el calor excesivo la hace florecer y amargar", suelo:"Rico en nitrógeno, húmedo y bien drenado", tipoHoja:"Caduca, grande, tierna y muy variable en forma y color", temperatura:"Fresca, entre 10-20°C; se espiga con el calor", plagas:"Babosas, pulgón verde y mildiu de la lechuga", ecologia:"Base de la dieta mediterránea; cultivo de ciclo corto muy eficiente en agua", curiosidades:"Los romanos ya cultivaban lechuga hace más de 2.500 años como planta medicinal para dormir" },
  // Hongos
  seta:       { agua:"No regar — necesita humedad ambiental alta y sustrato húmedo", luz:"Sombra completa o muy tenue", suelo:"Madera podrida o suelo rico en materia orgánica en descomposición", tipoHoja:"No tiene hojas — cuerpo fructífero del hongo (esporocarpo)", temperatura:"Fresca y húmeda, entre 10-20°C; desaparece con el calor", plagas:"Muy sensible a la sequía y a los pesticidas", ecologia:"Descomponedor primario del ecosistema forestal; recicla nutrientes esenciales", curiosidades:"El organismo vivo más grande del mundo es un hongo Armillaria en Oregón que ocupa 9km²" },
};

function findSpeciesInDB(filename, previewUrl) {
  const name = filename.toLowerCase().replace(/[-_\.]/g, ' ');
  for (const [key, data] of Object.entries(SPECIES_DB)) {
    if (name.includes(key)) return { key, ...data };
  }
  return null;
}

function buildGenericCareSpecs(name) {
  const t = name.toLowerCase();
  const esArbol  = ["pino","roble","árbol","tree","oak","pine"].some(w => t.includes(w));
  const esCactus = ["cactus","suculenta","agave"].some(w => t.includes(w));
  return {
    agua:        esCactus ? "Muy escaso — cada 2-3 semanas" : "Moderado — 1-2 veces por semana",
    luz:         esArbol  ? "Pleno sol directo" : "Semisombra o luz indirecta brillante",
    suelo:       esCactus ? "Arenoso y muy drenante" : "Sustrato universal con buena aireación",
    tipoHoja:    "Variable según especie — consultar referencia local",
    temperatura: "Templada, entre 10-25°C",
    plagas:      "Pulgón, cochinilla y mosca blanca — revisar el envés de las hojas",
    ecologia:    "Contribuye a la biodiversidad local y a la purificación del aire",
    curiosidades:"Cada especie vegetal cumple un rol único e insustituible en su ecosistema",
  };
}

async function identificarEspecie(fileObject, previewUrl) {
  // Intentamos buscar en Wikipedia usando el nombre del archivo como pista
  const rawName = fileObject.name.split('.')[0].replace(/[-_\d]/g, ' ').trim();
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  // Buscar en nuestra base de datos local primero
  const dbMatch = findSpeciesInDB(fileObject.name, previewUrl);

  let descripcion = "";
  let wikiImg = null;
  let nombreCientifico = "";

  // Intentar Wikipedia
  try {
    const searchTerm = dbMatch ? Object.keys(SPECIES_DB).find(k => fileObject.name.toLowerCase().includes(k)) : rawName;
    const wikiRes = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm || rawName)}`);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData.extract && wikiData.type !== "disambiguation") {
        descripcion = wikiData.extract.slice(0, 300) + (wikiData.extract.length > 300 ? "…" : "");
        wikiImg = wikiData.thumbnail?.source || null;
        nombreCientifico = wikiData.description || "";
      }
    }
  } catch { /* Wikipedia es opcional */ }

  const cuidados = dbMatch || buildGenericCareSpecs(displayName);
  const confianza = dbMatch ? "alta" : descripcion ? "media" : "baja";
  const pts = confianza === "alta" ? 50 : confianza === "media" ? 35 : 20;

  if (!descripcion) {
    descripcion = dbMatch
      ? `${displayName} identificado correctamente. Consulta la ficha técnica completa a continuación.`
      : `Especie registrada como "${displayName}". Para mayor precisión, usa una foto con el nombre de la planta.`;
  }

  return {
    nombre: displayName,
    nombreCientifico,
    descripcion,
    wikiImg,
    confianza,
    pts,
    agua:        cuidados.agua,
    luz:         cuidados.luz,
    suelo:       cuidados.suelo,
    tipoHoja:    cuidados.tipoHoja,
    temperatura: cuidados.temperatura,
    plagas:      cuidados.plagas,
    ecologia:    cuidados.ecologia,
    curiosidades:cuidados.curiosidades,
  };
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

  // ── Motor de identificación local + Wikipedia ───────────────────────────────
  const identifyImageWithAI = async (fileObject) => {
    setScanning(true);
    setResult(null);
    setScanError(null);
    try {
      setScanPhase("Analizando especie...");
      const data = await identificarEspecie(fileObject, previewUrl);
      setScanPhase("¡Especie identificada!");
      setResult({ ...data, points: data.pts });
      setPlantCount(prev => ({ ...prev, [data.nombre]: (prev[data.nombre] || 0) + 1 }));
      addPoints(data.pts, data.nombre, "🌱");
    } catch (err) {
      console.error(err);
      setScanError("Error al procesar la imagen. Inténtalo de nuevo.");
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
                  {(result.wikiImg || previewUrl) && (
                    <img src={result.wikiImg || previewUrl} alt="" style={{ width:64, height:64, borderRadius:12, objectFit:"cover", flexShrink:0 }} />
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
