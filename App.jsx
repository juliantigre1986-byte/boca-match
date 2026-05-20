import { useState, useEffect, useRef } from "react";

const HALF_SECS = 20 * 60;

const ROSTER = [
  { id:1,  s:"Acosta",     n:"Acosta Altamirano L.", isGK:true },
  { id:2,  s:"Vargas",     n:"Vargas C." },
  { id:3,  s:"Taliercio",  n:"Taliercio F." },
  { id:4,  s:"Alarcon",    n:"Alarcón G." },
  { id:5,  s:"Sanchez",    n:"Sánchez A." },
  { id:6,  s:"Corvalan",   n:"Corvalán E." },
  { id:7,  s:"Alvarez",    n:"Alvarez R." },
  { id:8,  s:"Leguizamon", n:"Leguizamón N." },
  { id:9,  s:"Fernandez",  n:"Fernández D." },
  { id:10, s:"Thorp",      n:"Thorp L." },
  { id:11, s:"Yañez",      n:"Yañez L." },
  { id:12, s:"Barrientos", n:"Barrientos N." },
  { id:13, s:"Russo",      n:"Russo F." },
  { id:14, s:"Biurrarena", n:"Biurrarena A." },
  { id:15, s:"Gheneloff",  n:"Gheneloff J." },
  { id:16, s:"Borghetti",  n:"Borghetti O." },
  { id:17, s:"Ramirez",    n:"Ramírez E." },
  { id:18, s:"Caprani",    n:"Caprani G." },
  { id:19, s:"Rios",       n:"Ríos A." },
  { id:20, s:"Cardozo",    n:"Cardozo T." },
  { id:21, s:"Colque",     n:"Colque J." },
  { id:22, s:"Caballero",  n:"Caballero E." },
  { id:23, s:"Menzeguez",  n:"Menzeguez G." },
  { id:24, s:"Bonino",     n:"Bonino M." },
  { id:25, s:"Kuok",       n:"Kuok T." },
  { id:26, s:"Nesprias",   n:"Nesprias V." },
  { id:27, s:"Starna",     n:"Starna G." },
  { id:28, s:"Arce",       n:"Arce T." },
  { id:29, s:"Suarez",     n:"Suárez L." },
  { id:30, s:"Baigorria",  n:"Baigorria J." },
  { id:31, s:"Escobar",    n:"Escobar T." },
];

const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const fmtMin = s => { if(s<=0) return "0'"; const m=Math.floor(s/60),sc=s%60; return sc>0?`${m}'${String(sc).padStart(2,"0")}"`:m+"'"; };

export default function App() {
  useEffect(()=>{
    const s=document.createElement("style");
    s.textContent=`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{background:#000B2E;}`;
    document.head.appendChild(s);
  },[]);

  const [phase, setPhase] = useState("setup"); // setup | match | halftime | done
  const [half, setHalf] = useState(1);
  const [timeLeft, setTimeLeft] = useState(HALF_SECS);
  const [running, setRunning] = useState(false);
  const [onField, setOnField] = useState([]);
  const [minutes, setMinutes] = useState({});
  const [entryTime, setEntryTime] = useState({});
  const [subOut, setSubOut] = useState(null);
  const [score, setScore] = useState({ b:0, r:0 });
  const [fouls, setFouls] = useState({ com:0, rec:0 });
  const [showStats, setShowStats] = useState(false);

  const runRef = useRef(false); runRef.current = running;
  const onFieldRef = useRef([]); onFieldRef.current = onField;
  const entryRef = useRef({}); entryRef.current = entryTime;
  const minsRef = useRef({}); minsRef.current = minutes;
  const tlRef = useRef(HALF_SECS); tlRef.current = timeLeft;

  useEffect(()=>{
    if(!running) return;
    const id = setInterval(()=> setTimeLeft(t=> Math.max(0,t-1)), 1000);
    return ()=> clearInterval(id);
  },[running]);

  useEffect(()=>{
    if(timeLeft===0 && runRef.current){
      flush(0);
      setRunning(false);
      setPhase(half===1?"halftime":"done");
    }
  },[timeLeft]);

  const flush = (cur) => {
    const en = entryRef.current;
    const upd = {...minsRef.current};
    for(const id of onFieldRef.current){
      if(en[id]!==undefined) upd[id]=(upd[id]||0)+(en[id]-cur);
    }
    setMinutes(upd); minsRef.current=upd;
    setEntryTime({}); entryRef.current={};
  };

  const toggleTimer = () => {
    if(running){
      flush(timeLeft);
      setRunning(false);
    } else {
      const en={};
      for(const id of onField) en[id]=timeLeft;
      setEntryTime(en); entryRef.current=en;
      setRunning(true);
    }
  };

  const doSub = (inId) => {
    if(subOut===null) return;
    const en={...entryRef.current};
    const upd={...minsRef.current};
    const cur=tlRef.current;
    if(running && en[subOut]!==undefined){
      upd[subOut]=(upd[subOut]||0)+(en[subOut]-cur);
      delete en[subOut];
    }
    if(running) en[inId]=cur;
    const nf=onField.map(id=>id===subOut?inId:id);
    setOnField(nf); onFieldRef.current=nf;
    setMinutes(upd); minsRef.current=upd;
    setEntryTime(en); entryRef.current=en;
    setSubOut(null);
  };

  const getLive = (id) => {
    const base=minutes[id]||0;
    if(running && entryTime[id]!==undefined) return base+(entryTime[id]-timeLeft);
    return base;
  };

  const startSecondHalf = () => {
    setHalf(2); setTimeLeft(HALF_SECS);
    setRunning(false); setEntryTime({}); setSubOut(null);
    setPhase("setup2");
  };

  const resetAll = () => {
    if(!window.confirm("¿Reiniciar partido?")) return;
    setPhase("setup"); setHalf(1); setTimeLeft(HALF_SECS);
    setRunning(false); setOnField([]); setMinutes({});
    setEntryTime({}); setSubOut(null);
    setScore({b:0,r:0}); setFouls({com:0,rec:0}); setShowStats(false);
  };

  // ----- SETUP SCREEN -----
  if(phase==="setup"||phase==="setup2"){
    return <Setup half={phase==="setup2"?2:1} current={onField} onStart={ids=>{
      setOnField(ids); onFieldRef.current=ids; setPhase("match");
    }}/>;
  }

  // ----- HALFTIME -----
  if(phase==="halftime"){
    return (
      <div style={S.overlay}>
        <div style={S.modal}>
          <div style={S.badge}>⏸ FIN 1er TIEMPO</div>
          <div style={S.modalScore}>BOCA {score.b} — {score.r}</div>
          <p style={{color:"#aaa",fontSize:13,textAlign:"center"}}>Faltas com. {fouls.com} · rec. {fouls.rec}</p>
          <button style={S.btnPrimary} onClick={startSecondHalf}>▶ Iniciar 2do Tiempo</button>
          <button style={S.btnSecondary} onClick={()=>setShowStats(true)}>📊 Ver minutos</button>
          {showStats && <StatsModal roster={ROSTER} getLive={getLive} onClose={()=>setShowStats(false)}/>}
        </div>
      </div>
    );
  }

  // ----- DONE -----
  if(phase==="done"){
    return (
      <div style={S.overlay}>
        <div style={S.modal}>
          <div style={S.badge}>🏁 PARTIDO FINALIZADO</div>
          <div style={S.modalScore}>BOCA {score.b} — {score.r}</div>
          <p style={{color:"#aaa",fontSize:13,textAlign:"center"}}>Faltas com. {fouls.com} · rec. {fouls.rec}</p>
          <button style={S.btnPrimary} onClick={()=>setShowStats(true)}>📊 Estadísticas Finales</button>
          <button style={S.btnSecondary} onClick={resetAll}>↩ Nuevo Partido</button>
          {showStats && <StatsModal roster={ROSTER} getLive={getLive} onClose={()=>setShowStats(false)}/>}
        </div>
      </div>
    );
  }

  // ----- MATCH SCREEN -----
  const fieldPlayers = onField.map(id=>ROSTER.find(p=>p.id===id)).filter(Boolean);
  const bench = ROSTER.filter(p=>!onField.includes(p.id));
  const urgent = timeLeft<=60 && timeLeft>0;

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.badge}>{half===1?"1er TIEMPO":"2do TIEMPO"}</span>
        <div style={{display:"flex",gap:8}}>
          <button style={S.iconBtn} onClick={()=>setShowStats(true)}>📊</button>
          <button style={S.iconBtn} onClick={resetAll}>↩</button>
        </div>
      </div>

      {/* Timer */}
      <div style={S.timerBlock}>
        <div style={{...S.timerDisplay, color: urgent?"#FF4B4B":timeLeft===0?"#555":"#FFD700",
          animation: urgent&&running?"pulse 1s infinite":"none"}}>
          {fmt(timeLeft)}
        </div>
        <button style={{...S.playBtn, background: running?"#CC2200":timeLeft===0?"#555":"#00A85A"}}
          onClick={toggleTimer} disabled={timeLeft===0}>
          {running ? "⏸  PAUSAR" : timeLeft===HALF_SECS ? "▶  INICIAR" : "▶  CONTINUAR"}
        </button>
      </div>

      {/* Score */}
      <div style={S.scoreRow}>
        <div style={S.scoreTeam}>
          <div style={S.teamLbl}>🔵🟡 BOCA</div>
          <div style={S.scoreCtrl}>
            <button style={S.scoreBtn} onClick={()=>setScore(s=>({...s,b:Math.max(0,s.b-1)}))}>−</button>
            <div style={S.scoreNum}>{score.b}</div>
            <button style={S.scoreBtn} onClick={()=>setScore(s=>({...s,b:s.b+1}))}>+</button>
          </div>
        </div>
        <div style={{fontSize:28,color:"#333",alignSelf:"flex-end",paddingBottom:6}}>—</div>
        <div style={S.scoreTeam}>
          <div style={S.teamLbl}>RIVAL</div>
          <div style={S.scoreCtrl}>
            <button style={S.scoreBtn} onClick={()=>setScore(s=>({...s,r:Math.max(0,s.r-1)}))}>−</button>
            <div style={S.scoreNum}>{score.r}</div>
            <button style={S.scoreBtn} onClick={()=>setScore(s=>({...s,r:s.r+1}))}>+</button>
          </div>
        </div>
      </div>

      {/* Fouls */}
      <div style={S.foulsRow}>
        <div style={S.foulItem}>
          <span style={S.foulLbl}>🟥 Cometidas</span>
          <div style={S.foulCtrl}>
            <button style={S.foulBtn} onClick={()=>setFouls(f=>({...f,com:Math.max(0,f.com-1)}))}>−</button>
            <span style={S.foulNum}>{fouls.com}</span>
            <button style={S.foulBtn} onClick={()=>setFouls(f=>({...f,com:f.com+1}))}>+</button>
          </div>
        </div>
        <div style={{width:1,height:40,background:"#1a2a6e"}}/>
        <div style={S.foulItem}>
          <span style={S.foulLbl}>🟨 Recibidas</span>
          <div style={S.foulCtrl}>
            <button style={S.foulBtn} onClick={()=>setFouls(f=>({...f,rec:Math.max(0,f.rec-1)}))}>−</button>
            <span style={S.foulNum}>{fouls.rec}</span>
            <button style={S.foulBtn} onClick={()=>setFouls(f=>({...f,rec:f.rec+1}))}>+</button>
          </div>
        </div>
      </div>

      {/* Field */}
      <div style={S.secLabel}>
        EN CANCHA
        {subOut ? <span style={{color:"#00C16A",fontSize:11,marginLeft:8}}>← elegí quién entra del banco</span>
                : <span style={{color:"#555",fontSize:11,marginLeft:8}}>tocá para sustituir</span>}
      </div>
      <div style={S.fieldGrid}>
        {fieldPlayers.map(p=>{
          const out=subOut===p.id;
          return (
            <div key={p.id} onClick={()=>setSubOut(out?null:p.id)}
              style={{...S.fieldCard,...(out?S.fieldCardOut:{})}}>
              {p.isGK && <span style={S.gkBadge}>PO</span>}
              <div style={S.pName}>{p.s}</div>
              <div style={S.pMins}>{fmtMin(getLive(p.id))}</div>
            </div>
          );
        })}
      </div>

      {/* Bench */}
      <div style={S.secLabel}>
        BANCO
        {subOut===null && <span style={{color:"#555",fontSize:11,marginLeft:8}}>primero tocá un jugador en cancha</span>}
      </div>
      <div style={S.benchGrid}>
        {bench.map(p=>{
          const live=getLive(p.id);
          const active=subOut!==null;
          return (
            <div key={p.id} onClick={()=>active&&doSub(p.id)}
              style={{...S.benchCard,...(active?S.benchActive:{})}}>
              {p.isGK && <span style={{fontSize:8,background:"#FFD700",color:"#000",borderRadius:2,padding:"0 2px",fontWeight:800}}>PO</span>}
              <span style={S.benchName}>{p.s}</span>
              {live>0 && <span style={S.benchMins}>{fmtMin(live)}</span>}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      {showStats && <StatsModal roster={ROSTER} getLive={getLive} onClose={()=>setShowStats(false)}/>}
    </div>
  );
}

function Setup({ half, current, onStart }) {
  const [sel, setSel] = useState(current.length?[...current]:[]);
  const toggle = id => setSel(s=> s.includes(id)?s.filter(x=>x!==id):s.length<5?[...s,id]:s);
  return (
    <div style={S.root}>
      <div style={{...S.header,justifyContent:"space-between"}}>
        <span style={S.badge}>{half===1?"1er":"2do"} TIEMPO — Elegí los 5 titulares</span>
        <span style={{fontSize:24,fontWeight:800,color:"#FFD700"}}>{sel.length}/5</span>
      </div>
      <div style={S.rosterGrid}>
        {ROSTER.map(p=>{
          const on=sel.includes(p.id);
          return (
            <div key={p.id} onClick={()=>toggle(p.id)}
              style={{...S.rCard,...(on?S.rCardSel:{})}}>
              {p.isGK && <span style={S.gkBadge}>PO</span>}
              <div style={S.pName}>{p.s}</div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"0 16px 32px"}}>
        <button style={{...S.btnPrimary,width:"100%",opacity:sel.length===5?1:0.35}}
          disabled={sel.length!==5} onClick={()=>onStart(sel)}>
          ▶  {half===1?"Comenzar 1er Tiempo":"Comenzar 2do Tiempo"}
        </button>
      </div>
    </div>
  );
}

function StatsModal({ roster, getLive, onClose }) {
  const data = roster.map(p=>({...p,secs:getLive(p.id)}))
    .filter(p=>p.secs>0).sort((a,b)=>b.secs-a.secs);
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{...S.modal,maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={S.badge}>📊 MINUTOS JUGADOS</div>
        {data.length===0 && <p style={{color:"#888",fontSize:13}}>Sin datos aún</p>}
        {data.map(p=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,width:"100%",marginBottom:6}}>
            <div style={{width:76,fontSize:12,fontWeight:600,color:"#fff"}}>{p.s}{p.isGK?" (PO)":""}</div>
            <div style={{flex:1,height:8,background:"#1a2a6e",borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",background:"#FFD700",borderRadius:4,
                width:`${Math.min(100,(p.secs/(HALF_SECS*2))*100)}%`}}/>
            </div>
            <div style={{width:44,fontSize:13,color:"#FFD700",textAlign:"right",fontWeight:700}}>{fmtMin(p.secs)}</div>
          </div>
        ))}
        <button style={{...S.btnPrimary,marginTop:12}} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

const F = "Oswald, Arial Narrow, sans-serif";
const S = {
  root:{ minHeight:"100vh", background:"linear-gradient(180deg,#001247 0%,#000B2E 100%)", color:"#fff", fontFamily:F, paddingBottom:60 },
  header:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px 10px", borderBottom:"1px solid #0f1e5e" },
  badge:{ fontSize:12, fontWeight:700, letterSpacing:2, color:"#FFD700", textTransform:"uppercase" },
  iconBtn:{ background:"transparent", border:"1px solid #1a2a6e", color:"#aaa", borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15 },
  timerBlock:{ display:"flex", flexDirection:"column", alignItems:"center", padding:"18px 16px 12px", gap:12 },
  timerDisplay:{ fontSize:80, fontWeight:800, letterSpacing:4, lineHeight:1, fontVariantNumeric:"tabular-nums", transition:"color .3s" },
  playBtn:{ borderRadius:12, border:"none", color:"#fff", fontWeight:700, fontSize:17, padding:"13px 44px", cursor:"pointer", letterSpacing:1, fontFamily:F, transition:"background .2s" },
  scoreRow:{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:20, padding:"10px 16px 12px", borderTop:"1px solid #0f1e5e", borderBottom:"1px solid #0f1e5e", background:"rgba(255,215,0,.04)" },
  scoreTeam:{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 },
  teamLbl:{ fontSize:11, letterSpacing:1, color:"#888", fontWeight:600 },
  scoreCtrl:{ display:"flex", alignItems:"center", gap:14 },
  scoreBtn:{ width:38, height:38, borderRadius:8, border:"1px solid #FFD700", background:"transparent", color:"#FFD700", fontSize:24, cursor:"pointer", fontFamily:F, lineHeight:1 },
  scoreNum:{ fontSize:52, fontWeight:800, minWidth:44, textAlign:"center" },
  foulsRow:{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, padding:"10px 16px", borderBottom:"1px solid #0f1e5e" },
  foulItem:{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flex:1 },
  foulLbl:{ fontSize:11, color:"#888", letterSpacing:1, textTransform:"uppercase" },
  foulCtrl:{ display:"flex", alignItems:"center", gap:10 },
  foulBtn:{ width:30, height:30, borderRadius:6, border:"1px solid #1a2a6e", background:"transparent", color:"#fff", fontSize:20, cursor:"pointer", fontFamily:F, lineHeight:1 },
  foulNum:{ fontSize:28, fontWeight:800, minWidth:30, textAlign:"center" },
  secLabel:{ fontSize:10, letterSpacing:2, color:"#FFD700", padding:"10px 16px 4px", fontWeight:700, textTransform:"uppercase" },
  fieldGrid:{ display:"flex", gap:6, padding:"4px 16px 8px" },
  fieldCard:{ flex:1, background:"#0D2280", borderRadius:10, padding:"10px 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer", border:"1px solid #1a3aaa", position:"relative", transition:"all .15s" },
  fieldCardOut:{ background:"#6b0f0f", border:"2px solid #FF4B4B" },
  gkBadge:{ position:"absolute", top:3, right:3, fontSize:8, background:"#FFD700", color:"#000", borderRadius:3, padding:"1px 3px", fontWeight:800 },
  pName:{ fontSize:10, fontWeight:700, textAlign:"center", lineHeight:1.2 },
  pMins:{ fontSize:13, color:"#FFD700", fontWeight:700 },
  benchGrid:{ display:"flex", flexWrap:"wrap", gap:6, padding:"4px 16px" },
  benchCard:{ flex:"0 0 auto", background:"#060f33", borderRadius:8, padding:"5px 10px", display:"flex", alignItems:"center", gap:4, border:"1px solid #0f1e5e", cursor:"default" },
  benchActive:{ cursor:"pointer", border:"1px solid #00C16A", background:"#071f14" },
  benchName:{ fontSize:12, fontWeight:600 },
  benchMins:{ fontSize:10, color:"#FFD700", marginLeft:3 },
  rosterGrid:{ display:"flex", flexWrap:"wrap", gap:8, padding:"12px 16px" },
  rCard:{ flex:"1 1 calc(25% - 8px)", minWidth:70, background:"#060f33", borderRadius:8, padding:"10px 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer", border:"1px solid #0f1e5e", position:"relative", transition:"all .12s" },
  rCardSel:{ background:"#0D2280", border:"2px solid #FFD700" },
  btnPrimary:{ background:"#FFD700", color:"#000", border:"none", borderRadius:12, padding:"14px 28px", fontSize:16, fontWeight:800, cursor:"pointer", letterSpacing:1, fontFamily:F, display:"block" },
  btnSecondary:{ background:"transparent", color:"#FFD700", border:"1px solid #FFD700", borderRadius:12, padding:"10px 28px", fontSize:14, fontWeight:700, cursor:"pointer", letterSpacing:1, fontFamily:F },
  overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 },
  modal:{ background:"#001247", borderRadius:16, padding:"24px 20px", width:"100%", maxWidth:360, display:"flex", flexDirection:"column", alignItems:"center", gap:14, border:"1px solid #1a3aaa" },
  modalScore:{ fontSize:40, fontWeight:800 },
};
