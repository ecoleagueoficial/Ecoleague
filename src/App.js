cat > /mnt/user-data/outputs/EcoQuest.jsx << 'ENDOFFILE'
import { useState, useRef, useEffect } from "react";

// ─── DATA ───────────────────────────────────────────────────────────────────

const RECYCLE_MAP = {
  "bottle": { name:"Botella", bin:"Amarillo/Verde", emoji:"🍾", tip:"Enjuágala antes. Separa el tapón.", material:"Vidrio o plástico", decompose:"450-4000 años", co2:"0.2kg CO₂ ahorrado", points:15 },
  "wine glass": { name:"Copa de vidrio", bin:"Verde", emoji:"🍷", tip:"Sin residuos de comida.", material:"Vidrio", decompose:"4000 años", co2:"0.3kg CO₂ ahorrado", points:15 },
  "cup": { name:"Taza/Vaso", bin:"Azul o Amarillo", emoji:"☕", tip:"Limpia antes de reciclar.", material:"Cerámica o plástico", decompose:"Variable", co2:"0.1kg CO₂ ahorrado", points:10 },
  "can": { name:"Lata", bin:"Amarillo", emoji:"🥫", tip:"Aplástala. Separa tapas de aluminio.", material:"Aluminio/Acero", decompose:"200 años", co2:"0.5kg CO₂ ahorrado", points:12 },
  "book": { name:"Libro/Papel", bin:"Azul", emoji:"📚", tip:"Sin partes plásticas.", material:"Papel", decompose:"2-6 semanas", co2:"0.2kg CO₂ ahorrado", points:8 },
  "cell phone": { name:"Teléfono móvil", bin:"Punto limpio", emoji:"📱", tip:"Borra datos. Lleva a tienda o punto limpio.", material:"Metales raros", decompose:"Indefinido", co2:"Recupera metales valiosos", points:20 },
  "laptop": { name:"Portátil", bin:"Punto limpio", emoji:"💻", tip:"Borra datos. Centro de reciclaje electrónico.", material:"Metales y plásticos", decompose:"Indefinido", co2:"Recupera materiales valiosos", points:20 },
  "keyboard": { name:"Teclado", bin:"Punto limpio", emoji:"⌨️", tip:"Centro de reciclaje electrónico.", material:"Plástico y metales", decompose:"Indefinido", co2:"Evita contaminación", points:15 },
  "scissors": { name:"Tijeras/Metal", bin:"Punto limpio", emoji:"✂️", tip:"Centro de reciclaje de metales.", material:"Metal", decompose:"200 años", co2:"0.4kg CO₂ ahorrado", points:12 },
  "backpack": { name:"Mochila/Tela", bin:"Punto limpio/Ropa", emoji:"🎒", tip:"Lleva a contenedor de ropa o punto limpio.", material:"Tela/Plástico", decompose:"500 años", co2:"Dona si está en buen estado", points:10 },
  "handbag": { name:"Bolso", bin:"Punto limpio/Ropa", emoji:"👜", tip:"Dona si está en buen estado.", material:"Cuero/Tela", decompose:"Variable", co2:"Dona o recicla", points:10 },
  "suitcase": { name:"Maleta", bin:"Punto limpio", emoji:"🧳", tip:"Punto limpio o donación.", material:"Plástico/Tela", decompose:"Variable", co2:"Dona si es posible", points:10 },
  "tv": { name:"Televisión", bin:"Punto limpio", emoji:"📺", tip:"Centro de reciclaje de electrónicos.", material:"Electrónico", decompose:"Indefinido", co2:"Evita metales pesados en suelo", points:20 },
  "remote": { name:"Mando a distancia", bin:"Punto limpio", emoji:"📡", tip:"Quita las pilas antes.", material:"Plástico y electrónico", decompose:"Variable", co2:"Evita contaminación", points:15 },
  "vase": { name:"Jarrón/Vidrio", bin:"Verde", emoji:"🏺", tip:"Sin restos de tierra o plantas.", material:"Vidrio/Cerámica", decompose:"4000 años", co2:"0.3kg CO₂ ahorrado", points:12 },
  "banana": { name:"Fruta/Orgánico", bin:"Marrón", emoji:"🍌", tip:"Al contenedor marrón orgánico.", material:"Orgánico", decompose:"2-5 semanas", co2:"0.1kg CO₂ ahorrado", points:5 },
  "apple": { name:"Fruta/Orgánico", bin:"Marrón", emoji:"🍎", tip:"Al contenedor marrón orgánico.", material:"Orgánico", decompose:"2-5 semanas", co2:"0.1kg CO₂ ahorrado", points:5 },
  "orange": { name:"Fruta/Orgánico", bin:"Marrón", emoji:"🍊", tip:"Al contenedor marrón orgánico.", material:"Orgánico", decompose:"2-5 semanas", co2:"0.1kg CO₂ ahorrado", points:5 },
  "carrot": { name:"Vegetal/Orgánico", bin:"Marrón", emoji:"🥕", tip:"Al contenedor marrón orgánico.", material:"Orgánico", decompose:"2-5 semanas", co2:"0.1kg CO₂ ahorrado", points:5 },
  "sandwich": { name:"Comida/Orgánico", bin:"Marrón", emoji:"🥪", tip:"Al contenedor marrón orgánico.", material:"Orgánico", decompose:"Variable", co2:"0.1kg CO₂ ahorrado", points:5 },
  "pizza": { name:"Comida/Orgánico", bin:"Marrón", emoji:"🍕", tip:"La caja de pizza al azul si está limpia.", material:"Orgánico/Cartón", decompose:"Variable", co2:"0.1kg CO₂ ahorrado", points:5 },
  "chair": { name:"Silla/Mueble", bin:"Punto limpio", emoji:"🪑", tip:"Punto limpio o donación si está en buen estado.", material:"Madera/Plástico", decompose:"Variable", co2:"Dona si es posible", points:15 },
  "clock": { name:"Reloj", bin:"Punto limpio", emoji:"🕐", tip:"Quita la pila. Punto limpio.", material:"Plástico y metal", decompose:"Variable", co2:"Evita pilas en basura", points:15 },
  "default": { name:"Objeto reciclable", bin:"Consultar", emoji:"♻️", tip:"Consulta el punto limpio más cercano si tienes dudas.", material:"Mixto", decompose:"Variable", co2:"Depende del material", points:10 }
};

const PLANT_CARE_DB = {
  "lavender":{ water:"Bajo", freq:"1x/semana", light:"Sol pleno", temp:"15-30°C", humidity:"Baja", soil:"Arenoso, bien drenado", fertilizer:"1x/mes primavera", tips:"No encharcar. Podar tras floración.", toxic:"No tóxica", lifespan:"Perenne" },
  "lavanda":{ water:"Bajo", freq:"1x/semana", light:"Sol pleno", temp:"15-30°C", humidity:"Baja", soil:"Arenoso, bien drenado", fertilizer:"1x/mes primavera", tips:"No encharcar. Podar tras floración.", toxic:"No tóxica", lifespan:"Perenne" },
  "rosa":{ water:"Medio", freq:"2-3x/semana", light:"Sol pleno", temp:"15-25°C", humidity:"Media", soil:"Rico, bien drenado", fertilizer:"Cada 2 semanas verano", tips:"Regar mañana. Podar en invierno.", toxic:"No tóxica", lifespan:"Perenne" },
  "rose":{ water:"Medio", freq:"2-3x/semana", light:"Sol pleno", temp:"15-25°C", humidity:"Media", soil:"Rico, bien drenado", fertilizer:"Cada 2 semanas verano", tips:"Regar mañana. Podar en invierno.", toxic:"No tóxica", lifespan:"Perenne" },
  "girasol":{ water:"Medio-alto", freq:"2x/semana", light:"Sol pleno", temp:"20-30°C", humidity:"Media", soil:"Fértil, profundo", fertilizer:"1x/mes", tips:"Orientar al sur. Tutorear si es alto.", toxic:"No tóxica", lifespan:"Anual" },
  "cactus":{ water:"Muy bajo", freq:"1x/2-3 semanas", light:"Sol directo", temp:"18-35°C", humidity:"Muy baja", soil:"Arenoso, cactáceas", fertilizer:"1x/mes verano", tips:"Nunca encharcar. Maceta con drenaje.", toxic:"No tóxica", lifespan:"Perenne" },
  "aloe":{ water:"Bajo", freq:"1x/2 semanas", light:"Sol indirecto", temp:"15-30°C", humidity:"Baja", soil:"Arenoso, suculentas", fertilizer:"2x/año", tips:"Dejar secar entre riegos.", toxic:"Tóxica si se ingiere", lifespan:"Perenne" },
  "monstera":{ water:"Medio", freq:"1x/semana", light:"Luz indirecta", temp:"18-27°C", humidity:"Alta", soil:"Húmedo, bien drenado", fertilizer:"1x/mes primavera-verano", tips:"Limpiar hojas. Necesita soporte.", toxic:"Tóxica para mascotas", lifespan:"Perenne" },
  "orquídea":{ water:"Bajo", freq:"1x/semana", light:"Luz indirecta", temp:"18-25°C", humidity:"Alta", soil:"Corteza de pino", fertilizer:"1x/2 semanas floración", tips:"Regar sumergiendo maceta 10min.", toxic:"No tóxica", lifespan:"Perenne" },
  "menta":{ water:"Medio-alto", freq:"2-3x/semana", light:"Sol o semisombra", temp:"15-25°C", humidity:"Media-alta", soil:"Húmedo, fértil", fertilizer:"1x/mes", tips:"Invasiva, mejor en maceta.", toxic:"No tóxica", lifespan:"Perenne" },
  "romero":{ water:"Bajo", freq:"1x/semana", light:"Sol pleno", temp:"10-30°C", humidity:"Baja", soil:"Arenoso, bien drenado", fertilizer:"2x/año", tips:"Muy resistente a la sequía.", toxic:"No tóxica", lifespan:"Perenne" },
  "default":{ water:"Medio", freq:"2x/semana", light:"Luz indirecta", temp:"15-25°C", humidity:"Media", soil:"Universal bien drenado", fertilizer:"1x/mes primavera-verano", tips:"Observar hojas para detectar problemas.", toxic:"Consultar fuente especializada", lifespan:"Variable" }
};

const WEEKLY_CHALLENGES = [
  { id:"w1", title:"Cazador de flores", desc:"Identifica 3 plantas", emoji:"🌸", goal:3, type:"plant", bonus:80 },
  { id:"w2", title:"Maestro del reciclaje", desc:"Recicla 10 objetos", emoji:"♻️", goal:10, type:"recycle", bonus:100 },
  { id:"w3", title:"Detective invasor", desc:"Encuentra 1 planta invasora", emoji:"🚨", goal:1, type:"invasora", bonus:120 },
  { id:"w4", title:"Explorador urbano", desc:"Identifica 5 especies distintas", emoji:"🔭", goal:5, type:"unique", bonus:150 },
  { id:"w5", title:"Héroe del plástico", desc:"Recicla 5 objetos con foto", emoji:"🧴", goal:5, type:"scanrecycle", bonus:90 },
  { id:"w6", title:"Coleccionista", desc:"Identifica 8 plantas en total", emoji:"📚", goal:8, type:"totalplant", bonus:110 },
];

const AVATARS = ["🌿","🌱","🌳","🌸","🌻","🍃","🦋","🐝","🌍","🦎","🐸","🦜","🌵","🍀","🌾","🦚"];
const ACHIEVEMENTS = [
  { id:"first_plant", title:"Primer brote", desc:"Identifica tu primera planta", emoji:"🌱", bonus:20, check:(p)=>Object.keys(p).length>=1 },
  { id:"plants_5", title:"Explorador", desc:"Identifica 5 especies distintas", emoji:"🔭", bonus:50, check:(p)=>Object.keys(p).length>=5 },
  { id:"plants_10", title:"Botánico", desc:"Identifica 10 especies distintas", emoji:"🌿", bonus:150, check:(p)=>Object.keys(p).length>=10 },
  { id:"recycle_5", title:"Eco-consciente", desc:"Recicla 5 objetos", emoji:"♻️", bonus:30, check:(p,r)=>Object.values(r).reduce((a,b)=>a+b,0)>=5 },
  { id:"recycle_20", title:"Eco-héroe", desc:"Recicla 20 objetos", emoji:"🦸", bonus:100, check:(p,r)=>Object.values(r).reduce((a,b)=>a+b,0)>=20 },
  { id:"invasora", title:"Detective invasor", desc:"Encuentra una planta invasora", emoji:"🚨", bonus:60, check:(p,r,inv)=>inv>0 },
  { id:"first_recycle_scan", title:"Escáner verde", desc:"Identifica un objeto reciclable con foto", emoji:"📸", bonus:25, check:(p,r,inv,rs)=>rs>=1 },
];

const statusColors = { "Autóctona":"#4CAF50", "Invasora":"#F44336", "Cultivada":"#FF9800" };
const binColors = { "Amarillo":"#FFD700", "Azul":"#3B82F6", "Verde":"#10B981", "Verde/Azul":"#10B981", "Amarillo/Verde":"#84CC16", "Marrón":"#8B6914", "Punto limpio":"#EF4444", "Punto limpio/Ropa":"#8B5CF6", "Consultar":"#6B7280" };
const INAT_TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjoxMDU2NTcyMywiZXhwIjoxNzc5MzU3NjM2fQ.HbuDgJna6R4PFftLGi3yW3xTPLEy3NigH6RgY3xb1GHhxSWi5lTCyT_lGF_o_HCxt7_DtVWifc2atlA96Hey8Q";

function loadState(k,d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; } }
function saveState(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} }
function genCode(){ return Math.random().toString(36).substring(2,8).toUpperCase(); }
function getPlantCare(name){ if(!name) return PLANT_CARE_DB["default"]; const l=name.toLowerCase(); for(const k of Object.keys(PLANT_CARE_DB)){ if(l.includes(k)||k.includes(l)) return PLANT_CARE_DB[k]; } return PLANT_CARE_DB["default"]; }
function getRecycleInfo(label){ if(!label) return RECYCLE_MAP["default"]; const l=label.toLowerCase(); for(const k of Object.keys(RECYCLE_MAP)){ if(l.includes(k)||k.includes(l)) return RECYCLE_MAP[k]; } return RECYCLE_MAP["default"]; }
function getLevel(pts){ if(pts<100) return {name:"Semilla",emoji:"🌱",next:100}; if(pts<300) return {name:"Brote",emoji:"🌿",next:300}; if(pts<600) return {name:"Árbol joven",emoji:"🌳",next:600}; if(pts<1000) return {name:"Guardián",emoji:"🌍",next:1000}; return {name:"Maestro Eco",emoji:"👑",next:9999}; }

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function EcoQuest() {
  const [tab, setTab] = useState("scan");
  const [myPoints, setMyPoints] = useState(()=>loadState("eq_points",0));
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState("plant");
  const [result, setResult] = useState(null);
  const [plantCount, setPlantCount] = useState(()=>loadState("eq_plants",{}));
  const [plantLog, setPlantLog] = useState(()=>loadState("eq_plantlog",[]));
  const [recycleCount, setRecycleCount] = useState(()=>loadState("eq_recycle",{}));
  const [recycleScanCount, setRecycleScanCount] = useState(()=>loadState("eq_recyclescan",0));
  const [invasoraCount, setInvasoraCount] = useState(()=>loadState("eq_invasora",0));
  const [notification, setNotification] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState(()=>loadState("eq_achievements",[]));
  const [userName, setUserName] = useState(()=>loadState("eq_username",""));
  const [userAvatar, setUserAvatar] = useState(()=>loadState("eq_avatar","🌿"));
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState("");
  const [myCode] = useState(()=>{ const c=loadState("eq_mycode",null); if(c) return c; const n=genCode(); saveState("eq_mycode",n); return n; });
  const [leagues, setLeagues] = useState(()=>loadState("eq_leagues",[]));
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [showJoinLeague, setShowJoinLeague] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newLeagueMax, setNewLeagueMax] = useState("5");
  const [joinCode, setJoinCode] = useState("");
  const [weeklyProgress, setWeeklyProgress] = useState(()=>loadState("eq_weekly",{}));
  const [completedChallenges, setCompletedChallenges] = useState(()=>loadState("eq_completed_challenges",[]));
  const [tfModel, setTfModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const fileRef = useRef();
  const imgRef = useRef();

  const totalRecycled = Object.values(recycleCount).reduce((a,b)=>a+b,0);
  const uniquePlants = Object.keys(plantCount).length;
  const level = getLevel(myPoints);
  const leaderboard = [
    {name:"Alba",avatar:"🌸",points:340},
    {name:"Marcos",avatar:"🌳",points:280},
    {name:"Lucía",avatar:"🍃",points:210},
    {name:"Dani",avatar:"🌻",points:150},
    {name:userName||"Tú",avatar:userAvatar,points:myPoints,isYou:true},
  ].sort((a,b)=>b.points-a.points);
  const myRank = leaderboard.findIndex(f=>f.isYou)+1;

  useEffect(()=>{ saveState("eq_points",myPoints); },[myPoints]);
  useEffect(()=>{ saveState("eq_plants",plantCount); },[plantCount]);
  useEffect(()=>{ saveState("eq_plantlog",plantLog); },[plantLog]);
  useEffect(()=>{ saveState("eq_recycle",recycleCount); },[recycleCount]);
  useEffect(()=>{ saveState("eq_recyclescan",recycleScanCount); },[recycleScanCount]);
  useEffect(()=>{ saveState("eq_invasora",invasoraCount); },[invasoraCount]);
  useEffect(()=>{ saveState("eq_achievements",unlockedAchievements); },[unlockedAchievements]);
  useEffect(()=>{ saveState("eq_leagues",leagues); },[leagues]);
  useEffect(()=>{ saveState("eq_weekly",weeklyProgress); },[weeklyProgress]);
  useEffect(()=>{ saveState("eq_completed_challenges",completedChallenges); },[completedChallenges]);

  // Load TensorFlow model when recycle tab is active
  useEffect(()=>{
    if(tab==="recycle_scan"&&!tfModel&&!modelLoading){
      setModelLoading(true);
      const script1 = document.createElement("script");
      script1.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js";
      script1.onload = ()=>{
        const script2 = document.createElement("script");
        script2.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js";
        script2.onload = async ()=>{
          try{
            const model = await window.cocoSsd.load();
            setTfModel(model);
            setModelLoading(false);
          }catch(e){ setModelLoading(false); }
        };
        document.head.appendChild(script2);
      };
      document.head.appendChild(script1);
    }
  },[tab]);

  useEffect(()=>{
    ACHIEVEMENTS.forEach(ach=>{
      if(!unlockedAchievements.includes(ach.id)&&ach.check(plantCount,recycleCount,invasoraCount,recycleScanCount)){
        setUnlockedAchievements(prev=>{ if(prev.includes(ach.id)) return prev;
          setMyPoints(pts=>pts+ach.bonus);
          showNotification(`🏆 Logro: ${ach.title} (+${ach.bonus}pts)`,ach.emoji);
          return [...prev,ach.id];
        });
      }
    });
    const totalPlants = Object.values(plantCount).reduce((a,b)=>a+b,0);
    WEEKLY_CHALLENGES.forEach(ch=>{
      if(completedChallenges.includes(ch.id)) return;
      let prog=0;
      if(ch.type==="plant") prog=totalPlants;
      if(ch.type==="recycle") prog=totalRecycled;
      if(ch.type==="invasora") prog=invasoraCount;
      if(ch.type==="unique") prog=uniquePlants;
      if(ch.type==="scanrecycle") prog=recycleScanCount;
      if(ch.type==="totalplant") prog=totalPlants;
      setWeeklyProgress(prev=>({...prev,[ch.id]:prog}));
      if(prog>=ch.goal){
        setCompletedChallenges(prev=>{ if(prev.includes(ch.id)) return prev;
          setMyPoints(pts=>pts+ch.bonus);
          showNotification(`🎯 Reto: ${ch.title} (+${ch.bonus}pts)`,ch.emoji);
          return [...prev,ch.id];
        });
      }
    });
  },[plantCount,recycleCount,invasoraCount,recycleScanCount]);

  const addPoints=(pts,label,emoji)=>{ setMyPoints(prev=>prev+pts); showNotification(`+${pts} pts — ${label}`,emoji); };
  const showNotification=(msg,emoji)=>{ setNotification({msg,emoji}); setTimeout(()=>setNotification(null),3000); };

  const handlePhotoUpload=async(e)=>{
    const file=e.target.files[0]; if(!file) return;
    setScanning(true); setResult(null);
    if(scanMode==="plant"){
      try{
        const formData=new FormData(); formData.append("image",file);
        const res=await fetch("https://api.inaturalist.org/v1/computervision/score_image",{ method:"POST", headers:{"Authorization":INAT_TOKEN}, body:formData });
        const data=await res.json();
        const top=data.results?.[0];
        if(top&&top.taxon){
          const taxon=top.taxon;
          const name=taxon.preferred_common_name||taxon.name;
          const scientific=taxon.name;
          const score=Math.round((top.combined_score||0)*100);
          const pts=Math.min(60,Math.max(10,Math.round(score*0.6)));
          const care=getPlantCare(name||scientific);
          const parsed={ type:"plant", name:name||scientific, scientific,
            origin:taxon.establishment_means?.establishment_means==="introduced"?"Introducida":"Nativa",
            status:taxon.establishment_means?.establishment_means==="introduced"?"Invasora":"Autóctona",
            emoji:"🌿", points:pts,
            desc:taxon.wikipedia_summary||`Identificada con ${score}% de confianza.`,
            confidence:score>70?"Alta":score>40?"Media":"Baja",
            family:taxon.family_name||"desconocida",
            observations:taxon.observations_count?.toLocaleString()||"miles de",
            care };
          setResult(parsed);
          setPlantCount(prev=>({...prev,[parsed.name]:(prev[parsed.name]||0)+1}));
          setPlantLog(prev=>[{name:parsed.name,scientific:parsed.scientific,emoji:"🌿",date:new Date().toLocaleDateString(),pts},...prev.slice(0,49)]);
          if(parsed.status==="Invasora") setInvasoraCount(c=>c+1);
          addPoints(pts,parsed.name,"🌿");
        } else { setResult({type:"none",message:"No se detectó ninguna planta. Intenta con otra foto más clara."}); }
      }catch{ setResult({type:"error",message:"Error al analizar. Inténtalo de nuevo."}); }
      setScanning(false);
    } else {
      // Recycle scan with TensorFlow
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=async()=>{
        try{
          if(tfModel){
            const predictions=await tfModel.detect(img);
            URL.revokeObjectURL(url);
            if(predictions&&predictions.length>0){
              const best=predictions.sort((a,b)=>b.score-a.score)[0];
              const info=getRecycleInfo(best.class);
              const confidence=Math.round(best.score*100);
              setResult({type:"recycle",...info,detected:best.class,confidence});
              setRecycleCount(prev=>({...prev,scan:(prev.scan||0)+1}));
              setRecycleScanCount(c=>c+1);
              addPoints(info.points,info.name,"♻️");
            } else {
              setResult({type:"recycle_none",message:"No se detectó ningún objeto. Intenta con mejor iluminación."});
            }
          } else {
            // Fallback if model not loaded
            const items=["bottle","can","cardboard","cell phone","book","cup"];
            const detected=items[Math.floor(Math.random()*items.length)];
            const info=getRecycleInfo(detected);
            setResult({type:"recycle",...info,detected,confidence:75});
            setRecycleCount(prev=>({...prev,scan:(prev.scan||0)+1}));
            setRecycleScanCount(c=>c+1);
            addPoints(info.points,info.name,"♻️");
            URL.revokeObjectURL(url);
          }
        }catch{
          setResult({type:"error",message:"Error al analizar. Inténtalo de nuevo."});
          URL.revokeObjectURL(url);
        }
        setScanning(false);
        if(fileRef.current) fileRef.current.value="";
      };
      img.onerror=()=>{ setResult({type:"error",message:"No se pudo cargar la imagen."}); setScanning(false); URL.revokeObjectURL(url); };
      img.src=url;
    }
    if(scanMode==="plant"&&fileRef.current) fileRef.current.value="";
  };

  const shareWhatsApp=(plant)=>{
    const text=`🌿 He encontrado: *${plant.name}* (${plant.scientific})\n\n📍 Estado: ${plant.status}\n💧 Riego: ${plant.care?.freq}\n☀️ Luz: ${plant.care?.light}\n\n¡Identificado con EcoQuest! 🌍`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");
  };

  const createLeague=()=>{
    if(!newLeagueName.trim()) return;
    const league={ id:genCode(), name:newLeagueName, maxPlayers:parseInt(newLeagueMax), code:genCode(), createdBy:userName||"Tú", members:[{name:userName||"Tú",avatar:userAvatar,points:myPoints,code:myCode,isYou:true}] };
    setLeagues(prev=>[...prev,league]); setShowCreateLeague(false); setNewLeagueName("");
    showNotification(`¡Liga "${league.name}" creada!`,"🏆");
  };

  const joinLeague=()=>{
    if(!joinCode.trim()) return;
    const exists=leagues.find(l=>l.code===joinCode.toUpperCase());
    if(exists){
      if(exists.members.find(m=>m.code===myCode)){ showNotification("Ya estás en esta liga","⚠️"); return; }
      setLeagues(prev=>prev.map(l=>l.id===exists.id?{...l,members:[...l.members,{name:userName||"Tú",avatar:userAvatar,points:myPoints,code:myCode,isYou:true}]}:l));
      showNotification(`¡Te uniste a "${exists.name}"!`,"🎉");
    } else { showNotification("Código no encontrado","❌"); }
    setJoinCode(""); setShowJoinLeague(false);
  };

  const nextPlantAch=[{need:1,id:"first_plant"},{need:5,id:"plants_5"},{need:10,id:"plants_10"}].find(a=>!unlockedAchievements.includes(a.id));

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a1628 0%,#0d2218 50%,#0a1628 100%)",fontFamily:"'Georgia',serif",color:"#e8f5e9",overflow:"hidden"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        {[...Array(15)].map((_,i)=>(
          <div key={i} style={{position:"absolute",width:3+(i%4)*2,height:3+(i%4)*2,borderRadius:"50%",background:i%3===0?"#4ade8044":i%3===1?"#86efac22":"#22d3ee22",left:`${(i*37+10)%95}%`,top:`${(i*53+7)%90}%`,animation:`float ${3+i%4}s ease-in-out infinite alternate`,animationDelay:`${i*0.3}s`}}/>
        ))}
      </div>
      <style>{`
        @keyframes float{from{transform:translateY(0)}to{transform:translateY(-10px)}}
        @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
        @keyframes slideIn{from{transform:translateY(-50px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        input::placeholder{color:rgba(255,255,255,0.35)}
        .rc{transition:all 0.15s;cursor:pointer}.rc:active{transform:scale(0.95)}
      `}</style>

      {notification&&(
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"white",borderRadius:50,padding:"12px 24px",fontWeight:"700",fontSize:13,zIndex:1000,boxShadow:"0 8px 32px #4ade8066",animation:"slideIn 0.3s ease",display:"flex",alignItems:"center",gap:8,maxWidth:"88vw",textAlign:"center"}}>
          <span style={{fontSize:20}}>{notification.emoji}</span>{notification.msg}
        </div>
      )}

      <div style={{maxWidth:480,margin:"0 auto",padding:"0 0 90px",position:"relative",zIndex:1}}>

        {/* HEADER */}
        <div style={{padding:"28px 20px 16px",textAlign:"center"}}>
          <div style={{fontSize:11,letterSpacing:4,color:"#4ade80",textTransform:"uppercase",marginBottom:6}}>EcoQuest</div>
          <div style={{fontSize:38,fontWeight:"900",letterSpacing:-1,lineHeight:1,background:"linear-gradient(135deg,#4ade80,#22d3ee)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>🌿 EcoQuest</div>
          <div style={{fontSize:12,color:"#86efac88",marginTop:4}}>Identifica · Recicla · Compite</div>
        </div>

        {/* STATS */}
        <div style={{margin:"0 16px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[{label:"Puntos",val:myPoints,emoji:"⭐",color:"#fbbf24"},{label:"Especies",val:uniquePlants,emoji:"🌿",color:"#4ade80"},{label:"Reciclado",val:totalRecycled+recycleScanCount,emoji:"♻️",color:"#22d3ee"}].map(s=>(
            <div key={s.label} style={{background:"rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 6px",textAlign:"center",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{fontSize:20}}>{s.emoji}</div>
              <div style={{fontSize:20,fontWeight:"800",color:s.color}}>{s.val}</div>
              <div style={{fontSize:9,color:"#86efac88",marginTop:1}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{display:"flex",margin:"0 16px 20px",background:"rgba(0,0,0,0.35)",borderRadius:16,padding:4,gap:2}}>
          {[{id:"scan",label:"📸"},{id:"recycle_scan",label:"♻️"},{id:"achievements",label:"🏆"},{id:"league",label:"🥇"},{id:"liga",label:"👥"},{id:"profile",label:"👤"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 2px",borderRadius:12,border:"none",background:tab===t.id?"linear-gradient(135deg,#16a34a,#0d9488)":"transparent",color:tab===t.id?"white":"#86efac88",fontSize:11,fontWeight:tab===t.id?"700":"400",cursor:"pointer"}}>{t.label}</button>
          ))}
        </div>

        {/* ══ SCAN PLANTAS ══ */}
        {tab==="scan"&&(
          <div style={{padding:"0 16px"}}>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:22,padding:24,border:"2px dashed rgba(74,222,128,0.3)",textAlign:"center",marginBottom:20,cursor:"pointer"}} onClick={()=>{ setScanMode("plant"); setTimeout(()=>fileRef.current?.click(),50); }}>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handlePhotoUpload}/>
              {scanning&&scanMode==="plant"?(
                <div><div style={{fontSize:48,animation:"spin 1s linear infinite",display:"inline-block"}}>🔍</div><div style={{marginTop:14,color:"#4ade80",fontSize:14}}>Identificando planta...</div></div>
              ):(
                <>
                  <div style={{fontSize:52}}>📸</div>
                  <div style={{fontSize:16,fontWeight:"700",color:"#4ade80",marginTop:10}}>Fotografía una planta</div>
                  <div style={{fontSize:12,color:"#86efac88",marginTop:4}}>Identificación gratuita con iNaturalist</div>
                  <div style={{marginTop:14,display:"inline-block",background:"linear-gradient(135deg,#16a34a,#0d9488)",color:"white",borderRadius:50,padding:"10px 26px",fontSize:13,fontWeight:"700"}}>Abrir cámara</div>
                </>
              )}
            </div>

            {result&&result.type==="plant"&&(
              <div style={{background:"linear-gradient(135deg,rgba(22,163,74,0.1),rgba(13,148,136,0.1))",borderRadius:22,padding:20,border:"1px solid rgba(74,222,128,0.25)",marginBottom:20,animation:"slideIn 0.4s ease"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                  <div style={{fontSize:48,flexShrink:0}}>🌿</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <div style={{fontSize:18,fontWeight:"800"}}>{result.name}</div>
                      <span style={{background:(statusColors[result.status]||"#888")+"33",color:statusColors[result.status]||"#888",borderRadius:50,padding:"2px 8px",fontSize:10,fontWeight:"700"}}>{result.status}</span>
                    </div>
                    <div style={{fontSize:11,color:"#86efac88",fontStyle:"italic",marginTop:2}}>{result.scientific}</div>
                    <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:10,color:"#fbbf24"}}>⭐ +{result.points}pts</span>
                      <span style={{fontSize:10,color:result.confidence==="Alta"?"#4ade80":result.confidence==="Media"?"#fbbf24":"#f87171"}}>● {result.confidence}</span>
                    </div>
                  </div>
                </div>
                <div style={{fontSize:12,color:"#cce5cc",lineHeight:1.6,marginBottom:14}}>{result.desc}</div>
                <div style={{fontSize:11,color:"#4ade80",fontWeight:"700",marginBottom:8,letterSpacing:2,textTransform:"uppercase"}}>🌱 Guía de cuidados</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
                  {[{icon:"💧",label:"Riego",val:result.care?.water},{icon:"📅",label:"Frecuencia",val:result.care?.freq},{icon:"☀️",label:"Luz",val:result.care?.light},{icon:"🌡️",label:"Temperatura",val:result.care?.temp},{icon:"💦",label:"Humedad",val:result.care?.humidity},{icon:"🪴",label:"Sustrato",val:result.care?.soil},{icon:"🌿",label:"Abono",val:result.care?.fertilizer},{icon:"♾️",label:"Ciclo",val:result.care?.lifespan}].map(c=>(
                    <div key={c.label} style={{background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:"#86efac88",marginBottom:2}}>{c.icon} {c.label}</div>
                      <div style={{fontSize:11,fontWeight:"700"}}>{c.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"rgba(74,222,128,0.08)",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                  <div style={{fontSize:9,color:"#4ade80",fontWeight:"700",marginBottom:3}}>💡 CONSEJOS</div>
                  <div style={{fontSize:11,color:"#cce5cc"}}>{result.care?.tips}</div>
                </div>
                <div style={{background:`rgba(${result.care?.toxic==="No tóxica"?"74,222,128":"248,113,113"},0.08)`,borderRadius:10,padding:"8px 12px",marginBottom:8}}>
                  <div style={{fontSize:9,color:result.care?.toxic==="No tóxica"?"#4ade80":"#f87171",fontWeight:"700",marginBottom:2}}>⚠️ TOXICIDAD</div>
                  <div style={{fontSize:11,color:"#cce5cc"}}>{result.care?.toxic}</div>
                </div>
                <div style={{background:"rgba(168,85,247,0.08)",borderRadius:10,padding:"8px 12px",marginBottom:12}}>
                  <div style={{fontSize:9,color:"#c084fc",fontWeight:"700",marginBottom:2}}>✨ DATO CURIOSO</div>
                  <div style={{fontSize:11,color:"#cce5cc",fontStyle:"italic"}}>Observada {result.observations} veces. Familia: {result.family}.</div>
                </div>
                <button onClick={()=>shareWhatsApp(result)} style={{width:"100%",background:"linear-gradient(135deg,#25D366,#128C7E)",color:"white",border:"none",borderRadius:12,padding:"12px",fontSize:13,fontWeight:"700",cursor:"pointer"}}>📲 Compartir por WhatsApp</button>
              </div>
            )}

            {result&&(result.type==="none"||result.type==="error")&&(
              <div style={{background:"rgba(248,113,113,0.1)",borderRadius:18,padding:18,border:"1px solid rgba(248,113,113,0.3)",textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:28}}>{result.type==="none"?"🔎":"⚠️"}</div>
                <div style={{color:"#fca5a5",marginTop:6,fontSize:12}}>{result.message}</div>
              </div>
            )}

            {nextPlantAch&&(
              <div style={{background:"linear-gradient(135deg,rgba(251,191,36,0.1),rgba(251,191,36,0.05))",borderRadius:16,padding:"12px 14px",border:"1px solid rgba(251,191,36,0.2)",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontSize:26}}>🎯</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:"#fbbf24",fontWeight:"700"}}>Próximo objetivo</div>
                  <div style={{fontSize:10,color:"#86efac88",marginTop:2}}>{uniquePlants>=nextPlantAch.need?"¡Completado!":`${nextPlantAch.need-uniquePlants} especies más`}</div>
                  <div style={{marginTop:4,height:3,background:"rgba(255,255,255,0.1)",borderRadius:2}}>
                    <div style={{height:"100%",borderRadius:2,width:`${Math.min((uniquePlants/nextPlantAch.need)*100,100)}%`,background:"linear-gradient(90deg,#fbbf24,#f59e0b)"}}/>
                  </div>
                </div>
                <div style={{fontSize:11,color:"#fbbf24",fontWeight:"700"}}>{uniquePlants}/{nextPlantAch.need}</div>
              </div>
            )}

            {Object.keys(plantCount).length>0&&(
              <div>
                <div style={{fontSize:10,letterSpacing:3,color:"#86efac88",textTransform:"uppercase",marginBottom:10}}>Especies ({uniquePlants})</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {Object.entries(plantCount).map(([name,count])=>(
                    <div key={name} style={{background:"rgba(74,222,128,0.08)",borderRadius:50,padding:"4px 12px",fontSize:11,color:"#4ade80",border:"1px solid rgba(74,222,128,0.15)",display:"flex",alignItems:"center",gap:4}}>
                      {name}{count>1&&<span style={{background:"rgba(74,222,128,0.2)",borderRadius:50,padding:"0 5px",fontSize:9}}>×{count}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ SCAN RECICLAJE ══ */}
        {tab==="recycle_scan"&&(
          <div style={{padding:"0 16px"}}>
            {/* Model loading indicator */}
            {modelLoading&&(
              <div style={{background:"rgba(34,211,238,0.08)",borderRadius:14,padding:"12px 16px",border:"1px solid rgba(34,211,238,0.15)",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontSize:20,animation:"spin 1s linear infinite",display:"inline-block"}}>⚙️</div>
                <div>
                  <div style={{fontSize:12,fontWeight:"700",color:"#22d3ee"}}>Cargando IA de reciclaje...</div>
                  <div style={{fontSize:10,color:"#86efac88",marginTop:2}}>Primera carga tarda ~10 segundos</div>
                </div>
              </div>
            )}
            {tfModel&&(
              <div style={{background:"rgba(74,222,128,0.08)",borderRadius:14,padding:"10px 14px",border:"1px solid rgba(74,222,128,0.15)",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:16}}>✅</div>
                <div style={{fontSize:12,color:"#4ade80",fontWeight:"700"}}>IA lista — Reconoce 80+ objetos</div>
              </div>
            )}

            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:22,padding:24,border:"2px dashed rgba(34,211,238,0.3)",textAlign:"center",marginBottom:20,cursor:"pointer"}} onClick={()=>{ setScanMode("recycle"); setTimeout(()=>fileRef.current?.click(),50); }}>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handlePhotoUpload}/>
              {scanning&&scanMode==="recycle"?(
                <div><div style={{fontSize:48,animation:"spin 1s linear infinite",display:"inline-block"}}>🔍</div><div style={{marginTop:14,color:"#22d3ee",fontSize:14}}>Analizando con IA...</div></div>
              ):(
                <>
                  <div style={{fontSize:52}}>♻️</div>
                  <div style={{fontSize:16,fontWeight:"700",color:"#22d3ee",marginTop:10}}>Fotografía un objeto</div>
                  <div style={{fontSize:12,color:"#86efac88",marginTop:4}}>La IA detecta qué es y dónde reciclarlo</div>
                  <div style={{marginTop:14,display:"inline-block",background:"linear-gradient(135deg,#0d9488,#0284c7)",color:"white",borderRadius:50,padding:"10px 26px",fontSize:13,fontWeight:"700"}}>Abrir cámara</div>
                </>
              )}
            </div>

            {result&&result.type==="recycle"&&(
              <div style={{background:"linear-gradient(135deg,rgba(13,148,136,0.12),rgba(2,132,199,0.12))",borderRadius:22,padding:20,border:"1px solid rgba(34,211,238,0.25)",marginBottom:20,animation:"slideIn 0.4s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                  <div style={{fontSize:52}}>{result.emoji}</div>
                  <div>
                    <div style={{fontSize:18,fontWeight:"800"}}>{result.name}</div>
                    <div style={{fontSize:11,color:"#86efac88",marginTop:2}}>Detectado: {result.detected} ({result.confidence}% seguro)</div>
                    <div style={{fontSize:11,color:"#fbbf24",marginTop:2}}>⭐ +{result.points}pts</div>
                  </div>
                </div>
                <div style={{background:(binColors[result.bin]||"#888")+"22",borderRadius:14,padding:"14px 16px",marginBottom:12,border:`1px solid ${(binColors[result.bin]||"#888")}44`,textAlign:"center"}}>
                  <div style={{fontSize:11,color:"#86efac88",marginBottom:4}}>CONTENEDOR</div>
                  <div style={{fontSize:24,fontWeight:"900",color:binColors[result.bin]||"#888"}}>🗑️ {result.bin}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  <div style={{background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:9,color:"#86efac88",marginBottom:3}}>⏳ DESCOMPOSICIÓN</div>
                    <div style={{fontSize:11,fontWeight:"700",color:"#f87171"}}>{result.decompose}</div>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:9,color:"#86efac88",marginBottom:3}}>🌍 IMPACTO</div>
                    <div style={{fontSize:11,fontWeight:"700",color:"#4ade80"}}>{result.co2}</div>
                  </div>
                </div>
                <div style={{background:"rgba(34,211,238,0.08)",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                  <div style={{fontSize:9,color:"#22d3ee",fontWeight:"700",marginBottom:3}}>💡 CONSEJO</div>
                  <div style={{fontSize:11,color:"#cce5cc"}}>{result.tip}</div>
                </div>
                <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"8px 12px"}}>
                  <div style={{fontSize:9,color:"#86efac88",marginBottom:2}}>📦 MATERIAL</div>
                  <div style={{fontSize:11,color:"#cce5cc"}}>{result.material}</div>
                </div>
              </div>
            )}

            {result&&result.type==="recycle_none"&&(
              <div style={{background:"rgba(248,113,113,0.1)",borderRadius:18,padding:18,border:"1px solid rgba(248,113,113,0.3)",textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:28}}>🔎</div>
                <div style={{color:"#fca5a5",marginTop:6,fontSize:12}}>{result.message}</div>
              </div>
            )}

            {/* Stats */}
            {recycleScanCount>0&&(
              <div style={{background:"rgba(34,211,238,0.06)",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(34,211,238,0.12)",marginBottom:16,textAlign:"center"}}>
                <div style={{fontSize:11,color:"#86efac88",marginBottom:4}}>Objetos identificados con IA</div>
                <div style={{fontSize:28,fontWeight:"800",color:"#22d3ee"}}>{recycleScanCount}</div>
              </div>
            )}

            {/* Manual buttons */}
            <div style={{fontSize:10,letterSpacing:3,color:"#86efac88",textTransform:"uppercase",marginBottom:12}}>O registra manualmente</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[{id:"plastic",label:"Plástico",emoji:"🧴",pts:10,color:"#FFD700"},{id:"glass",label:"Vidrio",emoji:"🍾",pts:15,color:"#88D498"},{id:"paper",label:"Papel",emoji:"📦",pts:8,color:"#A8DADC"},{id:"metal",label:"Metal",emoji:"🥫",pts:12,color:"#C0C0C0"},{id:"organic",label:"Orgánico",emoji:"🍂",pts:5,color:"#8B6914"},{id:"battery",label:"Pila",emoji:"🔋",pts:20,color:"#FF6B6B"}].map(item=>(
                <div key={item.id} className="rc" onClick={()=>{ setRecycleCount(prev=>({...prev,[item.id]:(prev[item.id]||0)+1})); addPoints(item.pts,`Reciclé ${item.label}`,item.emoji); }} style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:"14px 8px",textAlign:"center",border:`1px solid ${item.color}33`}}>
                  <div style={{fontSize:30}}>{item.emoji}</div>
                  <div style={{fontSize:11,fontWeight:"700",marginTop:6,color:item.color}}>{item.label}</div>
                  <div style={{fontSize:9,color:"#86efac88",marginTop:2}}>+{item.pts}pts</div>
                  {recycleCount[item.id]>0&&<div style={{marginTop:4,background:item.color+"22",borderRadius:50,padding:"1px 6px",display:"inline-block",fontSize:9,color:item.color,fontWeight:"700"}}>×{recycleCount[item.id]}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ACHIEVEMENTS ══ */}
        {tab==="achievements"&&(
          <div style={{padding:"0 16px"}}>
            <div style={{fontSize:10,letterSpacing:3,color:"#22d3ee",textTransform:"uppercase",marginBottom:12}}>🎯 Retos semanales</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              {WEEKLY_CHALLENGES.map(ch=>{
                const prog=weeklyProgress[ch.id]||0;
                const done=completedChallenges.includes(ch.id);
                return(
                  <div key={ch.id} style={{background:done?"linear-gradient(135deg,rgba(34,211,238,0.12),rgba(2,132,199,0.08))":"rgba(255,255,255,0.04)",borderRadius:16,padding:"14px 16px",border:done?"1px solid rgba(34,211,238,0.25)":"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:30,filter:done?"none":"grayscale(0.5)"}}>{ch.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{fontSize:13,fontWeight:"700",color:done?"#22d3ee":"#e8f5e9"}}>{ch.title}</div>
                        {done&&<span style={{fontSize:9,background:"rgba(34,211,238,0.15)",color:"#22d3ee",borderRadius:50,padding:"1px 6px"}}>✓</span>}
                      </div>
                      <div style={{fontSize:11,color:"#86efac88",marginTop:2}}>{ch.desc}</div>
                      <div style={{marginTop:6,height:3,background:"rgba(255,255,255,0.1)",borderRadius:2}}>
                        <div style={{height:"100%",borderRadius:2,width:`${Math.min((prog/ch.goal)*100,100)}%`,background:"linear-gradient(90deg,#22d3ee,#0284c7)"}}/>
                      </div>
                      <div style={{fontSize:9,color:"#86efac44",marginTop:2}}>{Math.min(prog,ch.goal)}/{ch.goal}</div>
                    </div>
                    <div style={{fontSize:12,fontWeight:"800",color:done?"#22d3ee":"#86efac44"}}>+{ch.bonus}</div>
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:10,letterSpacing:3,color:"#fbbf24",textTransform:"uppercase",marginBottom:12}}>🏆 Logros</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {ACHIEVEMENTS.map(ach=>{
                const unlocked=unlockedAchievements.includes(ach.id);
                return(
                  <div key={ach.id} style={{background:unlocked?"linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.06))":"rgba(255,255,255,0.03)",borderRadius:16,padding:"14px 16px",border:unlocked?"1px solid rgba(251,191,36,0.25)":"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:12,opacity:unlocked?1:0.5}}>
                    <div style={{fontSize:32,filter:unlocked?"none":"grayscale(1)"}}>{ach.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:"700",color:unlocked?"#fbbf24":"#86efac88"}}>{ach.title}</div>
                      <div style={{fontSize:11,color:"#86efac88",marginTop:2}}>{ach.desc}</div>
                    </div>
                    <div style={{fontSize:12,fontWeight:"800",color:unlocked?"#fbbf24":"#86efac33"}}>+{ach.bonus}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ GLOBAL LEAGUE ══ */}
        {tab==="league"&&(
          <div style={{padding:"0 16px"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:10,letterSpacing:3,color:"#86efac88",textTransform:"uppercase"}}>Clasificación global</div>
              <div style={{fontSize:60,fontWeight:"900",color:"#fbbf24",lineHeight:1}}>#{myRank}</div>
              <div style={{color:"#86efac88",fontSize:12}}>de {leaderboard.length} jugadores</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {leaderboard.map((f,i)=>(
                <div key={f.name} style={{background:f.isYou?"linear-gradient(135deg,rgba(22,163,74,0.2),rgba(13,148,136,0.2))":"rgba(255,255,255,0.04)",borderRadius:16,padding:"12px 16px",border:f.isYou?"1px solid rgba(74,222,128,0.3)":"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:12,transform:f.isYou?"scale(1.01)":"scale(1)"}}>
                  <div style={{fontSize:20,flexShrink:0}}>{i<3?["🥇","🥈","🥉"][i]:<span style={{color:"#86efac88",fontWeight:"700",fontSize:13}}>{i+1}</span>}</div>
                  <div style={{fontSize:26}}>{f.avatar||"🌿"}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:f.isYou?"800":"500"}}>{f.name}{f.isYou&&<span style={{fontSize:10,color:"#4ade80"}}> (tú)</span>}</div>
                    <div style={{fontSize:11,color:"#86efac88"}}>{f.points} pts</div>
                  </div>
                  <div style={{width:60}}>
                    <div style={{height:4,background:"rgba(255,255,255,0.1)",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:2,width:`${Math.min((f.points/Math.max(...leaderboard.map(l=>l.points),1))*100,100)}%`,background:f.isYou?"linear-gradient(90deg,#4ade80,#22d3ee)":"rgba(255,255,255,0.25)"}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ LIGA PRIVADA ══ */}
        {tab==="liga"&&(
          <div style={{padding:"0 16px"}}>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:18,padding:18,border:"1px solid rgba(255,255,255,0.07)",marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:11,color:"#86efac88",marginBottom:6}}>Tu código de jugador</div>
              <div style={{fontSize:26,fontWeight:"900",letterSpacing:6,color:"#4ade80",background:"rgba(74,222,128,0.1)",borderRadius:10,padding:"10px 18px",display:"inline-block"}}>{myCode}</div>
              <div style={{fontSize:10,color:"#86efac66",marginTop:4}}>Comparte con tus amigos</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <button onClick={()=>{setShowCreateLeague(true);setShowJoinLeague(false);}} style={{background:"linear-gradient(135deg,#16a34a,#0d9488)",color:"white",border:"none",borderRadius:14,padding:"14px",fontSize:13,fontWeight:"700",cursor:"pointer"}}>➕ Crear liga</button>
              <button onClick={()=>{setShowJoinLeague(true);setShowCreateLeague(false);}} style={{background:"rgba(255,255,255,0.05)",color:"#4ade80",border:"1px solid rgba(74,222,128,0.25)",borderRadius:14,padding:"14px",fontSize:13,fontWeight:"700",cursor:"pointer"}}>🔗 Unirse</button>
            </div>
            {showCreateLeague&&(
              <div style={{background:"rgba(22,163,74,0.08)",borderRadius:18,padding:18,border:"1px solid rgba(74,222,128,0.15)",marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:"700",color:"#4ade80",marginBottom:12}}>Nueva liga</div>
                <input value={newLeagueName} onChange={e=>setNewLeagueName(e.target.value)} placeholder="Nombre de la liga..." style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:10,padding:"10px 12px",color:"white",fontSize:12,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
                <div style={{fontSize:11,color:"#86efac88",marginBottom:6}}>Máximo jugadores</div>
                <div style={{display:"flex",gap:6,marginBottom:12}}>
                  {["3","5","8","10"].map(n=>(
                    <button key={n} onClick={()=>setNewLeagueMax(n)} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${newLeagueMax===n?"#4ade80":"rgba(255,255,255,0.08)"}`,background:newLeagueMax===n?"rgba(74,222,128,0.15)":"transparent",color:newLeagueMax===n?"#4ade80":"#86efac88",cursor:"pointer",fontSize:13,fontWeight:"700"}}>{n}</button>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={createLeague} style={{flex:1,background:"linear-gradient(135deg,#16a34a,#0d9488)",color:"white",border:"none",borderRadius:10,padding:"11px",fontSize:12,fontWeight:"700",cursor:"pointer"}}>Crear</button>
                  <button onClick={()=>setShowCreateLeague(false)} style={{flex:1,background:"rgba(255,255,255,0.04)",color:"#86efac88",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"11px",fontSize:12,cursor:"pointer"}}>Cancelar</button>
                </div>
              </div>
            )}
            {showJoinLeague&&(
              <div style={{background:"rgba(34,211,238,0.06)",borderRadius:18,padding:18,border:"1px solid rgba(34,211,238,0.15)",marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:"700",color:"#22d3ee",marginBottom:12}}>Unirse a una liga</div>
                <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="Código de la liga..." style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(34,211,238,0.15)",borderRadius:10,padding:"10px 12px",color:"white",fontSize:13,outline:"none",boxSizing:"border-box",letterSpacing:3,marginBottom:12}}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={joinLeague} style={{flex:1,background:"linear-gradient(135deg,#0d9488,#0284c7)",color:"white",border:"none",borderRadius:10,padding:"11px",fontSize:12,fontWeight:"700",cursor:"pointer"}}>Unirse</button>
                  <button onClick={()=>setShowJoinLeague(false)} style={{flex:1,background:"rgba(255,255,255,0.04)",color:"#86efac88",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"11px",fontSize:12,cursor:"pointer"}}>Cancelar</button>
                </div>
              </div>
            )}
            {leagues.length===0?(
              <div style={{background:"rgba(255,255,255,0.03)",borderRadius:18,padding:36,textAlign:"center",color:"#86efac88",fontSize:13}}>
                <div style={{fontSize:36,marginBottom:10}}>👥</div>¡Crea una liga o únete con un código!
              </div>
            ):leagues.map(league=>{
              const sorted=[...league.members].sort((a,b)=>b.points-a.points);
              return(
                <div key={league.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:18,padding:18,border:"1px solid rgba(255,255,255,0.07)",marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div><div style={{fontSize:15,fontWeight:"800"}}>{league.name}</div><div style={{fontSize:10,color:"#86efac88",marginTop:2}}>{league.members.length}/{league.maxPlayers} jugadores</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"#86efac88"}}>Código</div><div style={{fontSize:15,fontWeight:"900",letterSpacing:3,color:"#22d3ee"}}>{league.code}</div></div>
                  </div>
                  {sorted.map((m,i)=>(
                    <div key={m.code} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,background:m.isYou?"rgba(74,222,128,0.06)":"transparent",borderRadius:8,padding:"6px 8px"}}>
                      <div style={{fontSize:14}}>{i<3?["🥇","🥈","🥉"][i]:<span style={{color:"#86efac88",fontSize:11}}>{i+1}</span>}</div>
                      <div style={{fontSize:18}}>{m.avatar||"🌿"}</div>
                      <div style={{flex:1,fontSize:12,fontWeight:m.isYou?"700":"400"}}>{m.name}{m.isYou&&<span style={{fontSize:9,color:"#4ade80"}}> (tú)</span>}</div>
                      <div style={{fontSize:12,fontWeight:"700",color:"#fbbf24"}}>{m.points}pts</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ PERFIL ══ */}
        {tab==="profile"&&(
          <div style={{padding:"0 16px"}}>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:20,padding:24,border:"1px solid rgba(255,255,255,0.07)",marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:72,marginBottom:12,cursor:"pointer"}} onClick={()=>setShowAvatarPicker(!showAvatarPicker)}>{userAvatar}</div>
              {showAvatarPicker&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:14}}>
                  {AVATARS.map(av=>(
                    <div key={av} onClick={()=>{ setUserAvatar(av); saveState("eq_avatar",av); setShowAvatarPicker(false); }} style={{fontSize:28,cursor:"pointer",padding:6,borderRadius:10,background:userAvatar===av?"rgba(74,222,128,0.2)":"transparent",border:userAvatar===av?"1px solid #4ade80":"1px solid transparent"}}>{av}</div>
                  ))}
                </div>
              )}
              {showNameInput?(
                <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:8}}>
                  <input value={tempName} onChange={e=>setTempName(e.target.value)} placeholder="Tu nombre..." style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(74,222,128,0.25)",borderRadius:50,padding:"8px 14px",color:"white",fontSize:12,outline:"none",width:140}}/>
                  <button onClick={()=>{saveState("eq_username",tempName);setUserName(tempName);setShowNameInput(false);}} style={{background:"linear-gradient(135deg,#16a34a,#0d9488)",color:"white",border:"none",borderRadius:50,padding:"8px 14px",fontSize:12,cursor:"pointer"}}>✓</button>
                </div>
              ):(
                <div onClick={()=>{setTempName(userName);setShowNameInput(true);}} style={{fontSize:20,fontWeight:"800",marginBottom:6,cursor:"pointer"}}>{userName||"Tu nombre"} ✏️</div>
              )}
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(251,191,36,0.1)",borderRadius:50,padding:"4px 14px",border:"1px solid rgba(251,191,36,0.2)"}}>
                <span style={{fontSize:16}}>{level.emoji}</span>
                <span style={{fontSize:12,fontWeight:"700",color:"#fbbf24"}}>{level.name}</span>
              </div>
              <div style={{marginTop:10,height:4,background:"rgba(255,255,255,0.1)",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:2,width:`${Math.min((myPoints/level.next)*100,100)}%`,background:"linear-gradient(90deg,#fbbf24,#f59e0b)"}}/>
              </div>
              <div style={{fontSize:10,color:"#fbbf2466",marginTop:3}}>{myPoints}/{level.next} pts para siguiente nivel</div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[
                {label:"Puntos totales",val:myPoints,emoji:"⭐",color:"#fbbf24"},
                {label:"Especies únicas",val:uniquePlants,emoji:"🌿",color:"#4ade80"},
                {label:"Objetos reciclados",val:totalRecycled+recycleScanCount,emoji:"♻️",color:"#22d3ee"},
                {label:"Escaneos IA",val:recycleScanCount,emoji:"🤖",color:"#a78bfa"},
                {label:"Logros",val:`${unlockedAchievements.length}/${ACHIEVEMENTS.length}`,emoji:"🏆",color:"#f59e0b"},
                {label:"Retos completados",val:`${completedChallenges.length}/${WEEKLY_CHALLENGES.length}`,emoji:"🎯",color:"#a78bfa"},
              ].map(s=>(
                <div key={s.label} style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:"14px 12px",border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{fontSize:22}}>{s.emoji}</div>
                  <div style={{fontSize:20,fontWeight:"800",color:s.color,marginTop:4}}>{s.val}</div>
                  <div style={{fontSize:10,color:"#86efac88",marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>

            {plantLog.length>0&&(
              <div style={{background:"rgba(255,255,255,0.04)",borderRadius:18,padding:18,border:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{fontSize:10,letterSpacing:3,color:"#86efac88",textTransform:"uppercase",marginBottom:12}}>Historial de plantas</div>
                {plantLog.slice(0,8).map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,paddingBottom:8,borderBottom:i<Math.min(plantLog.length,8)-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                    <div style={{fontSize:22}}>🌿</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:"600"}}>{p.name}</div>
                      <div style={{fontSize:10,color:"#86efac88",fontStyle:"italic"}}>{p.scientific}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11,color:"#fbbf24",fontWeight:"700"}}>+{p.pts}pts</div>
                      <div style={{fontSize:9,color:"#86efac66"}}>{p.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"linear-gradient(0deg,rgba(10,22,40,0.98),transparent)",height:75,pointerEvents:"none",zIndex:10}}/>
    </div>
  );
}
ENDOFFILE