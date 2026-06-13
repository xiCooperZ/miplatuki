import { useState, useEffect, useCallback, useMemo } from "react";

// ─── CATEGORÍAS BASE ──────────────────────────────────────────────────────────
const DEFAULT_CATS = {
  fijo:      { label:"Fijo",           icon:"🏠", color:"#4ade80", desc:"Arriendo, luz, agua, gas — lo que siempre llega" },
  hormiga:   { label:"Hormiga",        icon:"🐜", color:"#fb923c", desc:"Café, snacks, compras chicas que se acumulan" },
  antojo:    { label:"Antojo",         icon:"🛒", color:"#f472b6", desc:"Compras impulsivas — lo que quieres pero no necesitas" },
  variable:  { label:"Variable",       icon:"📦", color:"#60a5fa", desc:"Transporte, remedios, ropa — cambia cada mes" },
  regaloneo: { label:"Regaloneo",      icon:"🎁", color:"#a78bfa", desc:"Regalos y caprichos para ti y los que quieres" },
  fantasma:  { label:"Gasto Fantasma", icon:"👻", color:"#94a3b8", desc:"Suscripciones que te chupan la plata sin que te des cuenta — Spotify, Netflix, etc." },
  ahorro:    { label:"Ahorro",         icon:"💰", color:"#34d399", desc:"Plata guardada intencionalmente para el futuro" },
  deudas:    { label:"Deudas",         icon:"💰", color:"#f87171", desc:"Cuotas, préstamos y compromisos financieros" },
  salud:     { label:"Salud",          icon:"🏥", color:"#38bdf8", desc:"Médico, remedios, atenciones — lo que no se puede dejar" },
  emergencias:{ label:"Emergencias",  icon:"🚨", color:"#fbbf24", desc:"Imprevistos que aparecen cuando menos los esperas" },
};

const STORAGE_KEY = "sueldo_tracker_v8";
const THEME_KEY   = "miplatuki_theme";

// ─── TEMAS ────────────────────────────────────────────────────────────────────
const THEMES = {
  default: {
    name: "Default",       emoji: "🌑",
    bg:   "#09090b",       surface: "#18181b",  surface2: "#09090b",
    border: "#27272a",     border2: "#3f3f46",
    text:   "#f4f4f5",     text2: "#a1a1aa",    text3: "#52525b",
    accent: "#4ade80",     accentGrad: "linear-gradient(135deg,#4ade80,#22c55e)",
  },
  amoled: {
    name: "AMOLED",        emoji: "⚫",
    bg:   "#000000",       surface: "#0a0a0a",  surface2: "#000000",
    border: "#1a1a1a",     border2: "#2a2a2a",
    text:   "#ffffff",     text2: "#888888",    text3: "#444444",
    accent: "#ffffff",     accentGrad: "linear-gradient(135deg,#ffffff,#cccccc)",
  },
  matrix: {
    name: "Matrix",        emoji: "💚",
    bg:   "#000000",       surface: "#001a00",  surface2: "#000d00",
    border: "#003300",     border2: "#005500",
    text:   "#00ff41",     text2: "#00cc33",    text3: "#006600",
    accent: "#00ff41",     accentGrad: "linear-gradient(135deg,#00ff41,#00cc33)",
  },
  neon: {
    name: "Neon",          emoji: "💙",
    bg:   "#050510",       surface: "#0a0a1f",  surface2: "#05050f",
    border: "#1a1a4a",     border2: "#2a2a6a",
    text:   "#e0e0ff",     text2: "#8888cc",    text3: "#444488",
    accent: "#4488ff",     accentGrad: "linear-gradient(135deg,#4488ff,#0044cc)",
  },
  cyberpunk: {
    name: "Cyberpunk",     emoji: "🟣",
    bg:   "#0d0015",       surface: "#1a0028",  surface2: "#0d0015",
    border: "#3d0066",     border2: "#6600aa",
    text:   "#ff00ff",     text2: "#cc00cc",    text3: "#660066",
    accent: "#ff00ff",     accentGrad: "linear-gradient(135deg,#ff00ff,#cc00cc)",
  },
  minimal: {
    name: "Minimalista",   emoji: "⚪",
    bg:   "#111111",       surface: "#1c1c1c",  surface2: "#111111",
    border: "#2c2c2c",     border2: "#3c3c3c",
    text:   "#eeeeee",     text2: "#999999",    text3: "#555555",
    accent: "#eeeeee",     accentGrad: "linear-gradient(135deg,#eeeeee,#cccccc)",
  },
  sunset: {
    name: "Sunset",        emoji: "🌅",
    bg:   "#0f0508",       surface: "#1f0d10",  surface2: "#0f0508",
    border: "#3d1520",     border2: "#6d2535",
    text:   "#ffd4a0",     text2: "#cc8855",    text3: "#664422",
    accent: "#ff6633",     accentGrad: "linear-gradient(135deg,#ff6633,#ff3366)",
  },
  ocean: {
    name: "Ocean",         emoji: "🌊",
    bg:   "#020d18",       surface: "#051e33",  surface2: "#020d18",
    border: "#0a3a5c",     border2: "#0d5c8a",
    text:   "#b0e0ff",     text2: "#5599cc",    text3: "#224466",
    accent: "#00aaff",     accentGrad: "linear-gradient(135deg,#00aaff,#0066cc)",
  },
};

const COLOR_PALETTE = [
  "#4ade80","#22c55e","#86efac","#16a34a","#052e16",
  "#fb923c","#f97316","#fdba74","#ea580c","#7c2d12",
  "#f472b6","#ec4899","#f9a8d4","#be185d","#831843",
  "#60a5fa","#3b82f6","#93c5fd","#1d4ed8","#1e3a8a",
  "#a78bfa","#8b5cf6","#c4b5fd","#7c3aed","#4c1d95",
  "#94a3b8","#64748b","#cbd5e1","#475569","#1e293b",
  "#f87171","#ef4444","#fca5a5","#dc2626","#7f1d1d",
  "#facc15","#eab308","#fde047","#ca8a04","#713f12",
  "#34d399","#10b981","#6ee7b7","#059669","#064e3b",
  "#e879f9","#d946ef","#f0abfc","#a21caf","#581c87",
  "#38bdf8","#0ea5e9","#7dd3fc","#0284c7","#0c4a6e",
  "#fbbf24","#f59e0b","#fde68a","#d97706","#78350f",
];

// 120+ emojis organizados por categoría
const EMOJIS = [
  // Hogar y servicios
  "🏠","🏡","🏢","🏗️","🔑","💡","🔌","💧","🔥","❄️","🛁","🛏️","🪑","🚪","🪟",
  // Comida y bebida
  "🍕","🍔","🌮","🍜","🍣","🥗","🍰","☕","🧋","🍺","🥤","🍷","🧃","🍦","🥑",
  // Transporte
  "🚗","🚌","🚇","✈️","🛵","🚴","🚕","🚂","⛽","🅿️","🛞",
  // Tecnología
  "📱","💻","🖥️","⌚","📷","🎧","🖨️","💾","🔋","📡","🎮",
  // Salud y bienestar
  "💊","🏥","🩺","🧴","🪥","💪","🧘","🏋️","🩹","🧬","🫀",
  // Ropa y moda
  "👗","👟","👜","🧢","💄","💍","👔","🧣","🕶️","👠",
  // Entretenimiento
  "🎵","🎬","🎪","🎯","🎲","🎸","🎭","🎨","📚","🎠",
  // Naturaleza y animales
  "🐾","🌿","🌸","🌊","🐶","🐱","🌙","⭐","🌈","🦋","🐠",
  // Dinero y negocios
  "💰","💳","💵","🪙","📈","📊","🏦","💼","🤝","📋","✅",
  // Personas y emociones
  "🎁","🎀","💝","🎊","🥳","😊","🌟","🏆","🎖️","👑","💫",
  // Misceláneos
  "🚨","🔔","📣","🛍️","🧹","🪣","🔧","🛠️","📦","🗂️","📌",
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt    = n => "$" + Math.round(Math.max(0, n)).toLocaleString("es-CL");
const parse$ = s => {
  const n = parseFloat(String(s).replace(/\./g, "").replace(",", "."));
  if (isNaN(n) || n < 0) return 0;
  return Math.round(n);
};
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
function monthLabel(iso) {
  if (!iso || typeof iso !== "string") return "—";
  const [y, m] = iso.split("-");
  const idx = parseInt(m, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx > 11) return iso;
  return MONTHS[idx] + " " + y;
}
function currentMonth() { return new Date().toISOString().slice(0, 7); }
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function stepMonth(iso, step) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 1 + step, 1);
  return d.toISOString().slice(0, 7);
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
async function loadDB() {
  try { const r = window.localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
async function saveDB(d) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────
const DEFAULT_CAT_KEYS = Object.keys(DEFAULT_CATS);
const DEFAULT = {
  activo:    { mes: currentMonth(), sueldo: 0, gastos: [] },
  historial: [],
  pendientes:[],
  subcats:   Object.fromEntries(DEFAULT_CAT_KEYS.map(k => [k, []])),
  cats:      { ...DEFAULT_CATS },
  catKeys:   DEFAULT_CAT_KEYS, // orden de categorías, incluye custom
};

function sanitizeState(d) {
  const cats = d.cats ? { ...DEFAULT_CATS, ...d.cats } : { ...DEFAULT_CATS };
  const catKeys = Array.isArray(d.catKeys) ? d.catKeys : Object.keys(cats);
  const subcats = { ...Object.fromEntries(catKeys.map(k => [k, []])), ...(d.subcats || {}) };
  return {
    activo: {
      mes:    typeof d.activo?.mes === "string" ? d.activo.mes : currentMonth(),
      sueldo: typeof d.activo?.sueldo === "number" && d.activo.sueldo >= 0 ? d.activo.sueldo : 0,
      gastos: Array.isArray(d.activo?.gastos) ? d.activo.gastos : [],
    },
    historial:  Array.isArray(d.historial)  ? d.historial  : [],
    pendientes: Array.isArray(d.pendientes) ? d.pendientes : [],
    subcats, cats, catKeys,
  };
}

// ─── SVG RING ─────────────────────────────────────────────────────────────────
function Ring({ pct, color, size = 76, stroke = 8 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (Math.min(Math.max(pct, 0), 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", display:"block", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#27272a" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition:"stroke-dashoffset 0.7s ease" }}/>
    </svg>
  );
}

// ─── BOTTOM SHEET ─────────────────────────────────────────────────────────────
function Sheet({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999,backdropFilter:"blur(5px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#18181b",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:520,border:"1px solid #3f3f46",borderBottom:"none",boxShadow:"0 -24px 60px rgba(0,0,0,0.6)",maxHeight:"94vh",overflowY:"auto",padding:"26px 20px 44px" }}>
        <div style={{ width:40,height:4,background:"#3f3f46",borderRadius:99,margin:"0 auto 20px" }}/>
        {children}
      </div>
    </div>
  );
}

function Badge({ cat, cats }) {
  const c = (cats || DEFAULT_CATS)[cat];
  if (!c) return null;
  return (
    <span style={{ background:c.color+"22",color:c.color,border:`1px solid ${c.color}55`,borderRadius:6,padding:"2px 7px",fontSize:11,fontWeight:700,whiteSpace:"nowrap" }}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── EDIT CAT SHEET — emoji + color + nombre + descripción ───────────────────
function EditCatSheet({ catKey, cat, onSave, onClose, isCustom, onDelete }) {
  const [icon,  setIcon]  = useState(cat.icon);
  const [color, setColor] = useState(cat.color);
  const [label, setLabel] = useState(cat.label);
  const [desc,  setDesc]  = useState(cat.desc);
  const [tab,   setTab]   = useState("emoji");
  const [confirmDel, setConfirmDel] = useState(false);

  const ok = label.trim().length > 0;

  return (
    <Sheet onClose={onClose}>
      <h2 style={{ color:"#f4f4f5",fontSize:18,marginBottom:4 }}>✏️ Personalizar categoría</h2>

      {/* Preview */}
      <div style={{ display:"flex",alignItems:"center",gap:12,background:"#09090b",borderRadius:12,padding:"12px 14px",marginBottom:16 }}>
        <div style={{ width:42,height:42,borderRadius:11,background:color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:`2px solid ${color}55`,flexShrink:0 }}>{icon}</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ color:"#f4f4f5",fontWeight:700,fontSize:14 }}>{label||"Sin nombre"}</div>
          <div style={{ color:"#52525b",fontSize:11,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{desc}</div>
        </div>
        <div style={{ width:18,height:18,borderRadius:"50%",background:color,flexShrink:0 }}/>
      </div>

      {/* Nombre y descripción */}
      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:5,fontWeight:700,letterSpacing:"0.07em" }}>NOMBRE</label>
      <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="ej: Suscripciones"
        style={{ width:"100%",boxSizing:"border-box",background:"#09090b",border:"1px solid #3f3f46",borderRadius:10,padding:"10px 12px",color:"#f4f4f5",fontSize:14,marginBottom:12,outline:"none" }}/>

      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:5,fontWeight:700,letterSpacing:"0.07em" }}>DESCRIPCIÓN</label>
      <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="ej: Netflix, Spotify, etc."
        style={{ width:"100%",boxSizing:"border-box",background:"#09090b",border:"1px solid #3f3f46",borderRadius:10,padding:"10px 12px",color:"#f4f4f5",fontSize:13,marginBottom:16,outline:"none" }}/>

      {/* Sub-tabs emoji / color */}
      <div style={{ display:"flex",gap:6,marginBottom:12 }}>
        {["emoji","color"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:"8px",borderRadius:10,border:`1px solid ${tab===t?color:"#3f3f46"}`,background:tab===t?color+"18":"transparent",color:tab===t?color:"#71717a",cursor:"pointer",fontSize:12,fontWeight:700,textTransform:"uppercase" }}>
            {t === "emoji" ? "🎭 Emoji" : "🎨 Color"}
          </button>
        ))}
      </div>

      {tab === "emoji" && (
        <div style={{ display:"flex",flexWrap:"wrap",gap:5,maxHeight:180,overflowY:"auto",marginBottom:16 }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={()=>setIcon(e)} style={{ width:36,height:36,borderRadius:9,border:`2px solid ${icon===e?color:"#3f3f46"}`,background:icon===e?color+"22":"transparent",fontSize:19,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>{e}</button>
          ))}
        </div>
      )}

      {tab === "color" && (
        <div style={{ display:"flex",flexWrap:"wrap",gap:7,marginBottom:16 }}>
          {COLOR_PALETTE.map(col => (
            <button key={col} onClick={()=>setColor(col)} style={{ width:28,height:28,borderRadius:"50%",background:col,border:`3px solid ${color===col?"#f4f4f5":"transparent"}`,cursor:"pointer",outline:"none",transition:"transform 0.1s",transform:color===col?"scale(1.2)":"scale(1)" }}/>
          ))}
        </div>
      )}

      <div style={{ display:"flex",gap:10,marginTop:4 }}>
        {isCustom && !confirmDel && (
          <button onClick={()=>setConfirmDel(true)} style={{ padding:"10px 14px",borderRadius:12,border:"1px solid #ef444455",background:"transparent",color:"#f87171",cursor:"pointer",fontSize:13 }}>🗑️</button>
        )}
        {isCustom && confirmDel && (
          <button onClick={()=>onDelete(catKey)} style={{ padding:"10px 14px",borderRadius:12,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700 }}>¿Eliminar?</button>
        )}
        <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
        <button onClick={()=>ok&&onSave(catKey,{icon,color,label:label.trim(),desc:desc.trim()})} disabled={!ok} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:ok?`linear-gradient(135deg,${color},${color}bb)`:"#27272a",color:ok?"#09090b":"#71717a",fontWeight:800,cursor:ok?"pointer":"not-allowed",fontSize:14 }}>Guardar</button>
      </div>
    </Sheet>
  );
}

// ─── NUEVA CATEGORÍA SHEET ────────────────────────────────────────────────────
function NewCatSheet({ onSave, onClose }) {
  const [icon,  setIcon]  = useState("⭐");
  const [color, setColor] = useState("#facc15");
  const [label, setLabel] = useState("");
  const [desc,  setDesc]  = useState("");
  const [tab,   setTab]   = useState("emoji");
  const ok = label.trim().length > 0;
  return (
    <Sheet onClose={onClose}>
      <h2 style={{ color:"#f4f4f5",fontSize:18,marginBottom:4 }}>➕ Nueva categoría</h2>
      <p style={{ color:"#71717a",fontSize:13,marginBottom:16 }}>Crea una categoría personalizada</p>

      <div style={{ display:"flex",alignItems:"center",gap:12,background:"#09090b",borderRadius:12,padding:"12px 14px",marginBottom:16 }}>
        <div style={{ width:42,height:42,borderRadius:11,background:color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:`2px solid ${color}55`,flexShrink:0 }}>{icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ color:"#f4f4f5",fontWeight:700,fontSize:14 }}>{label||"Sin nombre"}</div>
          <div style={{ color:"#52525b",fontSize:11,marginTop:1 }}>{desc||"Sin descripción"}</div>
        </div>
      </div>

      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:5,fontWeight:700,letterSpacing:"0.07em" }}>NOMBRE</label>
      <input autoFocus value={label} onChange={e=>setLabel(e.target.value)} placeholder="ej: Mascotas"
        style={{ width:"100%",boxSizing:"border-box",background:"#09090b",border:"1px solid #3f3f46",borderRadius:10,padding:"10px 12px",color:"#f4f4f5",fontSize:14,marginBottom:12,outline:"none" }}/>

      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:5,fontWeight:700,letterSpacing:"0.07em" }}>DESCRIPCIÓN</label>
      <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="ej: Comida, veterinario, accesorios"
        style={{ width:"100%",boxSizing:"border-box",background:"#09090b",border:"1px solid #3f3f46",borderRadius:10,padding:"10px 12px",color:"#f4f4f5",fontSize:13,marginBottom:16,outline:"none" }}/>

      <div style={{ display:"flex",gap:6,marginBottom:12 }}>
        {["emoji","color"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:"8px",borderRadius:10,border:`1px solid ${tab===t?color:"#3f3f46"}`,background:tab===t?color+"18":"transparent",color:tab===t?color:"#71717a",cursor:"pointer",fontSize:12,fontWeight:700,textTransform:"uppercase" }}>
            {t==="emoji"?"🎭 Emoji":"🎨 Color"}
          </button>
        ))}
      </div>

      {tab==="emoji"&&(
        <div style={{ display:"flex",flexWrap:"wrap",gap:5,maxHeight:180,overflowY:"auto",marginBottom:16 }}>
          {EMOJIS.map(e=>(
            <button key={e} onClick={()=>setIcon(e)} style={{ width:36,height:36,borderRadius:9,border:`2px solid ${icon===e?color:"#3f3f46"}`,background:icon===e?color+"22":"transparent",fontSize:19,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>{e}</button>
          ))}
        </div>
      )}
      {tab==="color"&&(
        <div style={{ display:"flex",flexWrap:"wrap",gap:7,marginBottom:16 }}>
          {COLOR_PALETTE.map(col=>(
            <button key={col} onClick={()=>setColor(col)} style={{ width:28,height:28,borderRadius:"50%",background:col,border:`3px solid ${color===col?"#f4f4f5":"transparent"}`,cursor:"pointer",outline:"none",transition:"transform 0.1s",transform:color===col?"scale(1.2)":"scale(1)" }}/>
          ))}
        </div>
      )}

      <div style={{ display:"flex",gap:10,marginTop:4 }}>
        <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
        <button onClick={()=>ok&&onSave({icon,color,label:label.trim(),desc:desc.trim()})} disabled={!ok} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:ok?`linear-gradient(135deg,${color},${color}bb)`:"#27272a",color:ok?"#09090b":"#71717a",fontWeight:800,cursor:ok?"pointer":"not-allowed",fontSize:14 }}>Crear categoría</button>
      </div>
    </Sheet>
  );
}

// ─── SUELDO SHEET ─────────────────────────────────────────────────────────────
function SueldoSheet({ current, onSave, onClose }) {
  const [v, setV] = useState(current > 0 ? String(current) : "");
  const val = parse$(v);
  const tooLarge = val > 100_000_000;
  const ok = val > 0 && !tooLarge;
  return (
    <Sheet onClose={onClose}>
      <h2 style={{ color:"#f4f4f5",fontSize:20,marginBottom:4 }}>💼 Tu sueldo mensual</h2>
      <p style={{ color:"#71717a",fontSize:13,marginBottom:18 }}>Monto neto que recibes en mano</p>
      <div style={{ position:"relative",marginBottom:6 }}>
        <span style={{ position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"#a1a1aa",fontWeight:700 }}>$</span>
        <input autoFocus type="number" value={v} onChange={e=>setV(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&ok&&onSave(val)} placeholder="600000"
          style={{ width:"100%",boxSizing:"border-box",background:"#09090b",border:`1px solid ${tooLarge?"#ef4444":"#3f3f46"}`,borderRadius:12,padding:"13px 13px 13px 28px",color:"#f4f4f5",fontSize:20,outline:"none" }}/>
      </div>
      {tooLarge&&<p style={{ color:"#f87171",fontSize:12,marginBottom:10 }}>⚠️ Revisa el monto ingresado</p>}
      {!tooLarge&&<div style={{ marginBottom:14 }}/>}
      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
        <button onClick={()=>ok&&onSave(val)} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#4ade80,#22c55e)",color:"#052e16",fontWeight:800,cursor:ok?"pointer":"not-allowed",opacity:ok?1:0.5,fontSize:15 }}>Guardar</button>
      </div>
    </Sheet>
  );
}

// ─── GASTO SHEET ──────────────────────────────────────────────────────────────
function GastoSheet({ onSave, onClose, onAddSub, onDeleteSub, gastoEditar, subcats, cats, catKeys }) {
  const [nombre,    setNombre]    = useState(gastoEditar?.nombre    || "");
  const [monto,     setMonto]     = useState(gastoEditar?.monto     ? String(gastoEditar.monto) : "");
  const [cat,       setCat]       = useState(gastoEditar?.categoria || catKeys[0] || "fijo");
  const [subcat,    setSubcat]    = useState(gastoEditar?.subcat    || "");
  const [newSub,    setNewSub]    = useState("");
  const [showAdd,   setShowAdd]   = useState(false);
  const [localSubs, setLocalSubs] = useState(subcats);

  const montoVal = parse$(monto);
  const tooLarge = montoVal > 100_000_000;
  const ok = nombre.trim().length > 0 && montoVal > 0 && !tooLarge;
  const c  = cats[cat] || DEFAULT_CATS[cat] || Object.values(cats)[0];
  const subs = localSubs[cat] || [];

  const save = () => {
    if (!ok) return;
    onSave({ id:gastoEditar?.id||uid(), nombre:nombre.trim(), monto:montoVal, categoria:cat, subcat:subcat||"", fecha:gastoEditar?.fecha||new Date().toLocaleDateString("es-CL") });
  };

  const handleAddSub = () => {
    const s = newSub.trim();
    if (!s || subs.includes(s)) { setNewSub(""); setShowAdd(false); return; }
    const updated = { ...localSubs, [cat]: [...subs, s] };
    setLocalSubs(updated); onAddSub(cat, s); setSubcat(s); setNewSub(""); setShowAdd(false);
  };

  const handleDeleteSub = s => {
    const updated = { ...localSubs, [cat]: subs.filter(x => x !== s) };
    setLocalSubs(updated); if (subcat===s) setSubcat(""); onDeleteSub(cat, s);
  };

  return (
    <Sheet onClose={onClose}>
      <h2 style={{ color:"#f4f4f5",fontSize:19,marginBottom:4 }}>{gastoEditar?"✏️ Editar gasto":"💸 Registrar gasto"}</h2>
      <p style={{ color:"#71717a",fontSize:13,marginBottom:16 }}>Asigna descripción, monto y clasificación</p>

      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:8,fontWeight:700,letterSpacing:"0.07em" }}>CATEGORÍA</label>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:16,maxHeight:160,overflowY:"auto" }}>
        {catKeys.map(k => {
          const cx = cats[k] || DEFAULT_CATS[k]; if (!cx) return null;
          const sel = cat === k;
          return (
            <button key={k} onClick={()=>{ setCat(k); setSubcat(""); setShowAdd(false); }} style={{ padding:"8px 4px",borderRadius:10,border:`2px solid ${sel?cx.color:"#3f3f46"}`,background:sel?cx.color+"18":"transparent",color:sel?cx.color:"#71717a",cursor:"pointer",textAlign:"center",transition:"all 0.15s" }}>
              <div style={{ fontSize:17,marginBottom:1 }}>{cx.icon}</div>
              <div style={{ fontSize:9,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{cx.label}</div>
            </button>
          );
        })}
      </div>

      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:5,fontWeight:700,letterSpacing:"0.07em" }}>DESCRIPCIÓN</label>
      <input autoFocus value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="ej: Torito en el super"
        onKeyDown={e=>e.key==="Enter"&&save()}
        style={{ width:"100%",boxSizing:"border-box",background:"#09090b",border:"1px solid #3f3f46",borderRadius:11,padding:"12px 13px",color:"#f4f4f5",fontSize:14,marginBottom:12,outline:"none" }}/>

      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:5,fontWeight:700,letterSpacing:"0.07em" }}>MONTO (CLP)</label>
      <div style={{ position:"relative",marginBottom:6 }}>
        <span style={{ position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"#a1a1aa",fontWeight:700 }}>$</span>
        <input type="number" value={monto} onChange={e=>setMonto(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&save()} placeholder="2000"
          style={{ width:"100%",boxSizing:"border-box",background:"#09090b",border:`1px solid ${tooLarge?"#ef4444":"#3f3f46"}`,borderRadius:11,padding:"12px 13px 12px 28px",color:"#f4f4f5",fontSize:14,outline:"none" }}/>
      </div>
      {tooLarge&&<p style={{ color:"#f87171",fontSize:11,marginBottom:10 }}>⚠️ Monto fuera del rango</p>}
      {!tooLarge&&<div style={{ marginBottom:14 }}/>}

      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:8,fontWeight:700,letterSpacing:"0.07em" }}>SUBCATEGORÍA <span style={{ color:"#52525b",fontWeight:400 }}>(opcional)</span></label>
      {subs.length>0&&(
        <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:8 }}>
          <button onClick={()=>setSubcat("")} style={{ padding:"5px 10px",borderRadius:99,fontSize:11,border:`1px solid ${subcat===""?c.color:"#3f3f46"}`,background:subcat===""?c.color+"18":"transparent",color:subcat===""?c.color:"#71717a",cursor:"pointer" }}>Ninguna</button>
          {subs.map(s=>(
            <div key={s} style={{ display:"flex",alignItems:"center" }}>
              <button onClick={()=>setSubcat(s)} style={{ padding:"5px 8px",borderRadius:"99px 0 0 99px",fontSize:11,border:`1px solid ${subcat===s?c.color:"#3f3f46"}`,borderRight:"none",background:subcat===s?c.color+"18":"transparent",color:subcat===s?c.color:"#71717a",cursor:"pointer" }}>{s}</button>
              <button onClick={()=>handleDeleteSub(s)} style={{ padding:"5px 6px",borderRadius:"0 99px 99px 0",fontSize:10,border:`1px solid ${subcat===s?c.color:"#3f3f46"}`,background:subcat===s?c.color+"18":"transparent",color:"#52525b",cursor:"pointer",lineHeight:1 }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginBottom:18 }}>
        {!showAdd?(
          <button onClick={()=>setShowAdd(true)} style={{ background:"transparent",border:"1px dashed #3f3f46",color:"#a1a1aa",padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",fontWeight:600 }}>＋ Nueva subcategoría</button>
        ):(
          <div style={{ display:"flex",gap:8 }}>
            <input value={newSub} onChange={e=>setNewSub(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddSub()} placeholder={`Nueva en ${c.label}...`} autoFocus
              style={{ flex:1,background:"#09090b",border:"1px solid #3f3f46",borderRadius:10,padding:"9px 12px",color:"#f4f4f5",fontSize:13,outline:"none" }}/>
            <button onClick={handleAddSub} style={{ padding:"9px 14px",borderRadius:10,border:"none",background:c.color,color:"#09090b",fontWeight:700,cursor:"pointer",fontSize:13 }}>+</button>
            <button onClick={()=>{ setNewSub(""); setShowAdd(false); }} style={{ padding:"9px 10px",borderRadius:10,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>✕</button>
          </div>
        )}
      </div>

      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
        <button onClick={save} disabled={!ok} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:ok?`linear-gradient(135deg,${c.color},${c.color}bb)`:"#27272a",color:ok?"#09090b":"#71717a",fontWeight:800,cursor:ok?"pointer":"not-allowed",fontSize:14,transition:"all 0.2s" }}>
          {gastoEditar?"Guardar cambios":"Confirmar gasto"}
        </button>
      </div>
    </Sheet>
  );
}

// ─── CERRAR MES SHEET ─────────────────────────────────────────────────────────
function CerrarSheet({ activo, onConfirm, onClose }) {
  const total    = activo.gastos.reduce((a, g) => a + g.monto, 0);
  const ahorrado = activo.gastos.filter(g=>g.categoria==="ahorro").reduce((a,g)=>a+g.monto,0);
  const sobrante = activo.sueldo - total;
  const superavit= sobrante > 0;
  const totalAhorro = ahorrado + Math.max(0, sobrante);
  const pctAhorro   = activo.sueldo > 0 ? Math.min(100,(totalAhorro/activo.sueldo)*100) : 0;

  const getMensaje = () => {
    if (activo.sueldo===0)  return { emoji:"📊", text:"Cierra el mes para archivarlo en el historial." };
    if (sobrante < 0)       return { emoji:"⚠️", text:`Te pasaste por ${fmt(Math.abs(sobrante))} este mes. ¡El próximo será mejor, tú puedes!` };
    if (sobrante === 0)     return { emoji:"🎯", text:"Gastaste exactamente lo que tenías. ¡Al peso, eso también es control!" };
    if (pctAhorro >= 20)    return { emoji:"🚀", text:`¡Excelente! Guardaste el ${pctAhorro.toFixed(0)}% de tu sueldo. ¡Eso es un golazo!` };
    if (pctAhorro >= 15)    return { emoji:"🌟", text:`¡Excelente! ${pctAhorro.toFixed(0)}% guardado este mes. Vas por muy buen camino.` };
    if (pctAhorro >= 10)    return { emoji:"💪", text:`¡Excelente! Cerraste el mes con ${fmt(sobrante)} guardados. ¡Sigue así!` };
    if (pctAhorro >= 5)     return { emoji:"😊", text:`¡Muy bien! Guardaste ${fmt(totalAhorro)} este mes. Cada peso que guardas suma.` };
    if (pctAhorro >= 2)     return { emoji:"✨", text:`¡Bien! Cerraste con ${fmt(totalAhorro)} guardados. Arrancar es lo más difícil.` };
    return { emoji:"🌱", text:`Cerraste con ${fmt(sobrante)} sin usar. Cualquier ahorro, por pequeño que sea, es un paso adelante.` };
  };
  const { emoji, text } = getMensaje();

  return (
    <Sheet onClose={onClose}>
      <h2 style={{ color:"#f4f4f5",fontSize:19,marginBottom:6 }}>📦 Cerrar {monthLabel(activo.mes)}</h2>
      <p style={{ color:"#71717a",fontSize:13,marginBottom:18,lineHeight:1.5 }}>El mes quedará guardado en el historial.</p>
      <div style={{ background:"#09090b",borderRadius:16,padding:"16px",marginBottom:14 }}>
        <div style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:14,padding:"10px 12px",background:"#18181b",borderRadius:11,border:`1px solid ${superavit?"#4ade8033":"#f8717133"}` }}>
          <span style={{ fontSize:20,flexShrink:0 }}>{emoji}</span>
          <p style={{ color:superavit?"#a1a1aa":"#f87171",fontSize:12,lineHeight:1.5,margin:0 }}>{text}</p>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:9 }}>
          {[["Sueldo del mes",fmt(activo.sueldo),"#4ade80"],["Total gastado",fmt(total),"#fb923c"],["Ahorro registrado",fmt(ahorrado),"#34d399"]].map(([l,v,col])=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ color:"#71717a",fontSize:13 }}>{l}</span>
              <span style={{ color:col,fontWeight:700,fontSize:14 }}>{v}</span>
            </div>
          ))}
          <div style={{ height:1,background:"#27272a",margin:"2px 0" }}/>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ color:"#a1a1aa",fontWeight:600,fontSize:14 }}>{sobrante>=0?"💸 Sin usar":"⚠️ Excedido"}</span>
            <span style={{ color:sobrante>=0?"#4ade80":"#f87171",fontWeight:800,fontSize:20 }}>{fmt(Math.abs(sobrante))}</span>
          </div>
        </div>
        {activo.sueldo>0&&(
          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
              <span style={{ color:"#52525b",fontSize:11 }}>Ahorro total del mes</span>
              <span style={{ color:"#34d399",fontSize:11,fontWeight:700 }}>{pctAhorro.toFixed(0)}% del sueldo</span>
            </div>
            <div style={{ background:"#27272a",borderRadius:99,height:7,overflow:"hidden" }}>
              <div style={{ height:"100%",borderRadius:99,width:`${pctAhorro}%`,background:"linear-gradient(90deg,#10b981,#34d399)",transition:"width 0.6s ease" }}/>
            </div>
          </div>
        )}
      </div>
      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
        <button onClick={onConfirm} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#818cf8,#6366f1)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14 }}>Cerrar mes ✓</button>
      </div>
    </Sheet>
  );
}

// ─── CLASIFICAR PENDIENTE SHEET ───────────────────────────────────────────────
function ClasificarSheet({ pendiente, onSave, onClose, cats, catKeys }) {
  const firstKey = catKeys[0] || "hormiga";
  const [cat, setCat] = useState(firstKey);
  const c = cats[cat] || DEFAULT_CATS[cat] || Object.values(cats)[0];
  return (
    <Sheet onClose={onClose}>
      <h2 style={{ color:"#f4f4f5",fontSize:19,marginBottom:4 }}>🗂️ Clasificar gasto</h2>
      <p style={{ color:"#71717a",fontSize:13,marginBottom:16 }}>¿A qué categoría pertenece este gasto?</p>
      <div style={{ background:"#09090b",borderRadius:12,padding:"13px 15px",marginBottom:16 }}>
        <div style={{ color:"#f4f4f5",fontSize:14,fontWeight:600,marginBottom:3 }}>{pendiente.nombre}</div>
        <div style={{ color:"#4ade80",fontSize:19,fontWeight:800 }}>{fmt(pendiente.monto)}</div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:20,maxHeight:180,overflowY:"auto" }}>
        {catKeys.map(k=>{ const cx=cats[k]||DEFAULT_CATS[k]; if(!cx)return null; const sel=cat===k;
          return(<button key={k} onClick={()=>setCat(k)} style={{ padding:"9px 5px",borderRadius:10,border:`2px solid ${sel?cx.color:"#3f3f46"}`,background:sel?cx.color+"18":"transparent",color:sel?cx.color:"#71717a",cursor:"pointer",textAlign:"center" }}>
            <div style={{ fontSize:17,marginBottom:1 }}>{cx.icon}</div><div style={{ fontSize:9,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{cx.label}</div>
          </button>);
        })}
      </div>
      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
        <button onClick={()=>onSave({...pendiente,categoria:cat})} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:`linear-gradient(135deg,${c.color},${c.color}bb)`,color:"#09090b",fontWeight:800,cursor:"pointer",fontSize:14 }}>Registrar como {c.label}</button>
      </div>
    </Sheet>
  );
}

// ─── RESUMEN MES ──────────────────────────────────────────────────────────────
function ResumenMes({ mes, cats, catKeys }) {
  const total = mes.gastos.reduce((a,g)=>a+g.monto,0);
  const ahorro= mes.sueldo-total;
  const bycat = catKeys.map(k=>({ k, v:mes.gastos.filter(g=>g.categoria===k).reduce((a,g)=>a+g.monto,0) })).filter(x=>x.v>0);
  const [open,setOpen]=useState(false);
  return (
    <div style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:13,marginBottom:10,overflow:"hidden" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:"100%",padding:"14px 15px",background:"transparent",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontWeight:800,fontSize:15,color:"#f4f4f5" }}>{monthLabel(mes.mes)}</div>
          <div style={{ color:"#52525b",fontSize:11,marginTop:1 }}>{mes.gastos.length} gastos · {fmt(total)} gastado</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:ahorro>=0?"#4ade80":"#f87171",fontWeight:800,fontSize:14 }}>{ahorro>=0?"💰":""}{fmt(Math.abs(ahorro))}</div>
          <div style={{ color:"#52525b",fontSize:10 }}>{ahorro>=0?"ahorrado":"excedido"}</div>
        </div>
      </button>
      {open&&(
        <div style={{ padding:"0 15px 15px",borderTop:"1px solid #27272a" }}>
          <div style={{ display:"flex",flexDirection:"column",gap:7,marginTop:11 }}>
            {bycat.map(({ k,v })=>{ const c=cats[k]||DEFAULT_CATS[k]; if(!c)return null; return(
              <div key={k} style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ color:"#a1a1aa",fontSize:12 }}>{c.icon} {c.label}</span>
                <div><span style={{ color:c.color,fontWeight:700,fontSize:12 }}>{fmt(v)}</span>
                  {mes.sueldo>0&&<span style={{ color:"#52525b",fontSize:10,marginLeft:5 }}>{((v/mes.sueldo)*100).toFixed(0)}%</span>}
                </div>
              </div>
            );})}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB DASHBOARD ────────────────────────────────────────────────────────────
function TabDashboard({ activo, pendientes, cats, catKeys, catData, total, restante, pct, pctColor, onShowSueldo, onClasificar, onDescartar, onCerrar }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
      {activo.sueldo===0&&(
        <div onClick={onShowSueldo} style={{ background:"#18181b",border:"2px dashed #4ade8044",borderRadius:13,padding:"20px",textAlign:"center",cursor:"pointer" }}>
          <div style={{ fontSize:28,marginBottom:6 }}>💼</div>
          <div style={{ color:"#4ade80",fontWeight:700,fontSize:14 }}>Ingresa tu sueldo para empezar</div>
          <div style={{ color:"#52525b",fontSize:12,marginTop:3 }}>Toca aquí para configurarlo</div>
        </div>
      )}

      {pendientes.length>0&&(
        <div style={{ background:"#18181b",border:"1px solid #fb923c55",borderRadius:13,padding:"13px 15px" }}>
          <div style={{ color:"#fb923c",fontSize:11,fontWeight:700,letterSpacing:"0.06em",marginBottom:9 }}>⏳ GASTOS PENDIENTES DE CLASIFICAR</div>
          <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
            {pendientes.map(p=>(
              <div key={p.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:"#09090b",borderRadius:10,padding:"9px 12px" }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ color:"#f4f4f5",fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.nombre}</div>
                  <div style={{ color:"#52525b",fontSize:10,marginTop:1 }}>Detectado desde correo</div>
                </div>
                <div style={{ display:"flex",gap:6,flexShrink:0,marginLeft:8 }}>
                  <button onClick={()=>onClasificar(p)} style={{ padding:"5px 10px",borderRadius:9,border:"none",background:"#fb923c",color:"#09090b",fontWeight:700,cursor:"pointer",fontSize:12 }}>{fmt(p.monto)}</button>
                  <button onClick={()=>onDescartar(p.id)} style={{ padding:"5px 8px",borderRadius:9,border:"1px solid #3f3f46",background:"transparent",color:"#71717a",cursor:"pointer",fontSize:12 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Balance principal */}
      <div style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:16,padding:"16px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
          <div>
            <div style={{ color:"#52525b",fontSize:10,fontWeight:700,letterSpacing:"0.05em",marginBottom:3 }}>DISPONIBLE</div>
            <div style={{ color:restante>=0?"#4ade80":"#f87171",fontSize:22,fontWeight:800,fontFamily:"system-ui,sans-serif",lineHeight:1 }}>{fmt(Math.abs(restante))}</div>
            {restante<0&&<div style={{ color:"#f87171",fontSize:11,marginTop:3 }}>⚠️ Presupuesto excedido</div>}
          </div>
          <div style={{ position:"relative",width:76,height:76,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ring pct={pct} color={pctColor} size={76} stroke={8}/>
            <div style={{ position:"absolute",textAlign:"center" }}>
              <div style={{ color:"#fff",fontWeight:800,fontSize:14,fontFamily:"system-ui,sans-serif" }}>{Math.round(pct)}%</div>
              <div style={{ color:"#a1a1aa",fontSize:8,fontWeight:700 }}>GASTADO</div>
            </div>
          </div>
        </div>
        <div style={{ height:1,background:"#27272a",marginBottom:12 }}/>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <div>
            <div style={{ color:"#52525b",fontSize:10,fontWeight:700,marginBottom:2 }}>SUELDO NETO</div>
            <div style={{ color:"#4ade80",fontSize:15,fontWeight:800,fontFamily:"system-ui,sans-serif" }}>{activo.sueldo>0?fmt(activo.sueldo):"—"}</div>
          </div>
          <div>
            <div style={{ color:"#52525b",fontSize:10,fontWeight:700,marginBottom:2 }}>TOTAL GASTOS</div>
            <div style={{ color:"#fb923c",fontSize:15,fontWeight:800,fontFamily:"system-ui,sans-serif" }}>{total>0?fmt(total):"—"}</div>
          </div>
        </div>
      </div>

      {/* Barra progreso */}
      {activo.sueldo>0&&(
        <div style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:12,padding:"13px 14px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
            <span style={{ color:"#a1a1aa",fontSize:12 }}>Progreso del mes</span>
            <span style={{ color:pctColor,fontWeight:700,fontSize:12 }}>{pct.toFixed(1)}%</span>
          </div>
          <div style={{ background:"#27272a",borderRadius:99,height:8,overflow:"hidden" }}>
            <div style={{ height:"100%",borderRadius:99,width:`${pct}%`,background:pct>90?"linear-gradient(90deg,#ef4444,#f87171)":pct>70?"linear-gradient(90deg,#f97316,#fb923c)":"linear-gradient(90deg,#16a34a,#4ade80)",transition:"width 0.6s ease" }}/>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",marginTop:4 }}>
            <span style={{ color:"#52525b",fontSize:10 }}>$0</span>
            <span style={{ color:"#52525b",fontSize:10 }}>{fmt(activo.sueldo)}</span>
          </div>
        </div>
      )}

      {/* Anillos por categoría */}
      {catData.length>0&&(
        <div style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:13,padding:"14px" }}>
          <div style={{ color:"#a1a1aa",fontSize:11,fontWeight:700,letterSpacing:"0.06em",marginBottom:12 }}>DISTRIBUCIÓN DE CATEGORÍAS</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
            {catData.map(({ k,total:t,pct:p })=>{
              const c=cats[k]||DEFAULT_CATS[k]; if(!c)return null;
              return(
                <div key={k} style={{ background:"#09090b",borderRadius:11,padding:"10px",display:"flex",alignItems:"center",gap:9 }}>
                  <div style={{ position:"relative",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <Ring pct={p} color={c.color} size={36} stroke={4}/>
                    <div style={{ position:"absolute",fontSize:13 }}>{c.icon}</div>
                  </div>
                  <div style={{ minWidth:0,flex:1 }}>
                    <div style={{ color:"#a1a1aa",fontSize:10,fontWeight:700,marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.label}</div>
                    <div style={{ color:c.color,fontSize:12,fontWeight:800,fontFamily:"system-ui,sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{fmt(t)}</div>
                    <div style={{ color:"#52525b",fontSize:9,marginTop:1 }}>{p.toFixed(0)}% sueldo</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={onCerrar} style={{ width:"100%",padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer",fontSize:13 }}>
        📦 Cerrar mes y guardar en historial
      </button>

      {activo.gastos.length===0&&pendientes.length===0&&activo.sueldo>0&&(
        <div style={{ textAlign:"center",padding:"40px 20px",background:"#18181b",borderRadius:13,border:"1px solid #27272a" }}>
          <div style={{ fontSize:38,marginBottom:8 }}>🧾</div>
          <div style={{ color:"#71717a",fontSize:14,marginBottom:4 }}>Sin gastos todavía</div>
          <div style={{ color:"#52525b",fontSize:13 }}>Toca <strong style={{ color:"#4ade80" }}>+</strong> para empezar</div>
        </div>
      )}

      {/* Easter eggs */}
      <div style={{ textAlign:"center",paddingTop:6,paddingBottom:2,display:"flex",flexDirection:"column",gap:3 }}>
        <span style={{ color:"#1f1f23",fontSize:10,letterSpacing:"0.04em",userSelect:"none" }}>te amo Fran ❤️ 🐰</span>
        <span style={{ color:"#1f1f23",fontSize:10,letterSpacing:"0.03em",userSelect:"none" }}>eres el amor de mi vida 💫</span>
      </div>
    </div>
  );
}

// ─── TAB GASTOS ───────────────────────────────────────────────────────────────
function TabGastos({ gastosOrdenados, total, cats, catKeys, onDelete, onEdit }) {
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
        <h2 style={{ fontSize:16,fontWeight:800 }}>Gastos <span style={{ color:"#52525b",fontWeight:400,fontSize:12 }}>({gastosOrdenados.reduce((a,g)=>a+g.items.length,0)})</span></h2>
        {gastosOrdenados.length>0&&<span style={{ color:"#52525b",fontSize:12 }}>Total: <strong style={{ color:"#fb923c",fontFamily:"system-ui,sans-serif" }}>{fmt(total)}</strong></span>}
      </div>
      {gastosOrdenados.length===0?(
        <div style={{ textAlign:"center",padding:"40px 20px",background:"#18181b",borderRadius:13,border:"1px solid #27272a" }}>
          <div style={{ fontSize:38,marginBottom:8 }}>📋</div>
          <div style={{ color:"#71717a" }}>No hay gastos aún</div>
        </div>
      ):(
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {gastosOrdenados.map(({ k,items })=>{
            const c=cats[k]||DEFAULT_CATS[k]; if(!c)return null;
            const subtotal=items.reduce((a,g)=>a+g.monto,0);
            return(
              <div key={k}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,paddingBottom:5,borderBottom:`1px solid ${c.color}33` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontSize:15 }}>{c.icon}</span>
                    <span style={{ color:c.color,fontWeight:700,fontSize:13 }}>{c.label}</span>
                    <span style={{ color:"#52525b",fontSize:11 }}>({items.length})</span>
                  </div>
                  <span style={{ color:c.color,fontWeight:800,fontSize:13,fontFamily:"system-ui,sans-serif" }}>{fmt(subtotal)}</span>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  {items.map(g=>(
                    <div key={g.id} style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:11,padding:"10px 12px",display:"flex",alignItems:"center",gap:9 }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ color:"#f4f4f5",fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{g.nombre}</div>
                        <div style={{ display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",marginTop:2 }}>
                          {g.subcat&&<span style={{ color:"#52525b",fontSize:10,background:"#27272a",borderRadius:5,padding:"1px 5px" }}>{g.subcat}</span>}
                          <span style={{ color:"#52525b",fontSize:10 }}>{g.fecha}</span>
                        </div>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:5,flexShrink:0 }}>
                        <div style={{ color:c.color,fontWeight:800,fontSize:13,fontFamily:"system-ui,sans-serif",whiteSpace:"nowrap" }}>{fmt(g.monto)}</div>
                        <button onClick={()=>onEdit(g)} style={{ background:"#27272a",border:"none",color:"#a1a1aa",cursor:"pointer",fontSize:12,padding:"4px 6px",borderRadius:7,lineHeight:1 }}>✏️</button>
                        <button onClick={()=>onDelete(g.id)} style={{ background:"#27272a",border:"none",color:"#71717a",cursor:"pointer",fontSize:12,padding:"4px 6px",borderRadius:7,lineHeight:1 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TAB CATEGORÍAS — con añadir y eliminar ───────────────────────────────────
function TabCategorias({ cats, catKeys, defaultCatKeys, onEdit, onNew }) {
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <div>
          <h2 style={{ fontSize:16,fontWeight:800,marginBottom:2 }}>🎨 Categorías</h2>
          <p style={{ color:"#71717a",fontSize:12 }}>Personaliza o crea las tuyas</p>
        </div>
        <button onClick={onNew} style={{ padding:"8px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#818cf8,#6366f1)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:12 }}>+ Nueva</button>
      </div>

      {/* Categorías base */}
      <div style={{ color:"#52525b",fontSize:10,fontWeight:700,letterSpacing:"0.06em",marginBottom:8 }}>CATEGORÍAS BASE</div>
      <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:18 }}>
        {catKeys.filter(k=>defaultCatKeys.includes(k)).map(k=>{
          const c=cats[k]||DEFAULT_CATS[k]; if(!c)return null;
          return(
            <button key={k} onClick={()=>onEdit({key:k,cat:c,isCustom:false})} style={{ display:"flex",alignItems:"center",gap:12,background:"#18181b",border:`1px solid ${c.color}33`,borderRadius:12,padding:"12px 14px",cursor:"pointer",textAlign:"left",width:"100%" }}>
              <div style={{ width:40,height:40,borderRadius:11,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`2px solid ${c.color}44`,flexShrink:0 }}>{c.icon}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ color:"#f4f4f5",fontWeight:700,fontSize:13 }}>{c.label}</div>
                <div style={{ color:"#52525b",fontSize:11,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.desc}</div>
              </div>
              <div style={{ width:16,height:16,borderRadius:"50%",background:c.color,flexShrink:0 }}/>
            </button>
          );
        })}
      </div>

      {/* Categorías personalizadas */}
      {catKeys.filter(k=>!defaultCatKeys.includes(k)).length>0&&(
        <>
          <div style={{ color:"#52525b",fontSize:10,fontWeight:700,letterSpacing:"0.06em",marginBottom:8 }}>MIS CATEGORÍAS</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {catKeys.filter(k=>!defaultCatKeys.includes(k)).map(k=>{
              const c=cats[k]; if(!c)return null;
              return(
                <button key={k} onClick={()=>onEdit({key:k,cat:c,isCustom:true})} style={{ display:"flex",alignItems:"center",gap:12,background:"#18181b",border:`1px solid ${c.color}55`,borderRadius:12,padding:"12px 14px",cursor:"pointer",textAlign:"left",width:"100%" }}>
                  <div style={{ width:40,height:40,borderRadius:11,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`2px solid ${c.color}66`,flexShrink:0 }}>{c.icon}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ color:"#f4f4f5",fontWeight:700,fontSize:13 }}>{c.label}</div>
                    <div style={{ color:"#52525b",fontSize:11,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.desc}</div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
                    <div style={{ width:16,height:16,borderRadius:"50%",background:c.color }}/>
                    <span style={{ color:"#52525b",fontSize:11 }}>✏️</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Aniversario escondido — al fondo del tab categorías */}
      <div style={{ marginTop:32,textAlign:"center" }}>
        <span style={{ color:"#1f1f23",fontSize:10,userSelect:"none",letterSpacing:"0.04em" }}>
          16/08/25 ❤️
        </span>
      </div>
    </div>
  );
}

// ─── TAB HISTORIAL ────────────────────────────────────────────────────────────
function TabHistorial({ historial, totalAhorro, cats, catKeys }) {
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
        <h2 style={{ fontSize:16,fontWeight:800 }}>Historial <span style={{ color:"#52525b",fontWeight:400,fontSize:12 }}>({historial.length} meses)</span></h2>
      </div>
      {historial.length>0&&(
        <div style={{ background:"#18181b",border:`1px solid ${totalAhorro>=0?"#4ade8044":"#f8717144"}`,borderRadius:13,padding:"13px",marginBottom:12 }}>
          <div style={{ color:"#a1a1aa",fontSize:10,fontWeight:700,letterSpacing:"0.06em",marginBottom:4 }}>{totalAhorro>=0?"💰 AHORRO TOTAL ACUMULADO":"⚠️ DÉFICIT TOTAL ACUMULADO"}</div>
          <div style={{ color:totalAhorro>=0?"#4ade80":"#f87171",fontSize:22,fontWeight:800,fontFamily:"system-ui,sans-serif" }}>{fmt(Math.abs(totalAhorro))}</div>
          <div style={{ color:"#52525b",fontSize:10,marginTop:2 }}>en {historial.length} {historial.length===1?"mes":"meses"} cerrados</div>
        </div>
      )}
      {historial.length===0?(
        <div style={{ textAlign:"center",padding:"40px 20px",background:"#18181b",borderRadius:13,border:"1px solid #27272a" }}>
          <div style={{ fontSize:38,marginBottom:8 }}>🗂️</div>
          <div style={{ color:"#71717a",fontSize:13,marginBottom:4 }}>Sin historial todavía</div>
          <div style={{ color:"#52525b",fontSize:12 }}>Usa <strong style={{ color:"#818cf8" }}>"Cerrar mes"</strong> para guardar</div>
        </div>
      ):(historial.map(m=><ResumenMes key={m._uid||m.mes} mes={m} cats={cats} catKeys={catKeys}/>))}
    </div>
  );
}

// ─── TAB EMAIL ────────────────────────────────────────────────────────────────
function TabEmail({ emailText, setEmailText, emailLoading, emailError, setEmailError, onParse, pendientes }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
      <div>
        <h2 style={{ fontSize:16,fontWeight:800,marginBottom:4 }}>📧 Pegar correo del banco</h2>
        <p style={{ color:"#71717a",fontSize:13,lineHeight:1.5 }}>La IA extrae los gastos y los deja como <strong style={{ color:"#fb923c" }}>pendientes</strong>. Tú los clasificas cuando quieras.</p>
      </div>
      <textarea value={emailText} onChange={e=>{ setEmailText(e.target.value); setEmailError(""); }}
        placeholder={"Pega aquí el correo del banco...\n\nEjemplo:\nHola Sebastián, se realizó un cargo de $1.890 en OK Market con tu tarjeta terminada en 1234.\nFecha: 01/06/2026"}
        rows={7} style={{ width:"100%",background:"#18181b",border:"1px solid #3f3f46",borderRadius:12,padding:"12px",color:"#f4f4f5",fontSize:13,resize:"vertical",outline:"none",lineHeight:1.6 }}/>
      <button onClick={onParse} disabled={emailLoading||!emailText.trim()} style={{ width:"100%",padding:12,borderRadius:12,border:"none",background:emailLoading||!emailText.trim()?"#27272a":"linear-gradient(135deg,#818cf8,#6366f1)",color:emailLoading||!emailText.trim()?"#52525b":"#fff",fontWeight:800,cursor:emailLoading||!emailText.trim()?"not-allowed":"pointer",fontSize:14,transition:"all 0.2s" }}>
        {emailLoading?"⏳ Extrayendo gastos...":"🔍 Detectar gastos con IA"}
      </button>
      {emailError&&<div style={{ background:"#18181b",border:"1px solid #ef444455",borderRadius:12,padding:"12px 14px",color:"#f87171",fontSize:13 }}>⚠️ {emailError}</div>}
      <div style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:12,padding:"12px 14px" }}>
        <div style={{ color:"#71717a",fontSize:12,lineHeight:1.6 }}>
          <strong style={{ color:"#a1a1aa" }}>¿Cómo funciona?</strong><br/>
          1. Pegas el correo → 2. IA detecta gastos → 3. Aparecen como <span style={{ color:"#fb923c" }}>pendientes</span> → 4. Tú los clasificas.
        </div>
      </div>
      {pendientes.length>0&&(
        <div style={{ background:"#18181b",border:"1px solid #fb923c44",borderRadius:12,padding:"12px 14px" }}>
          <div style={{ color:"#fb923c",fontSize:11,fontWeight:700,marginBottom:7 }}>PENDIENTES ({pendientes.length})</div>
          {pendientes.map(p=>(
            <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
              <span style={{ color:"#a1a1aa",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,marginRight:8 }}>{p.nombre}</span>
              <span style={{ color:"#fb923c",fontWeight:700,fontSize:13,fontFamily:"system-ui,sans-serif",flexShrink:0 }}>{fmt(p.monto)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB TEMAS ────────────────────────────────────────────────────────────────
function TabTemas({ temaActual, onChangeTema, th }) {
  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontSize:16,fontWeight:800,color:th.text,marginBottom:4 }}>🎨 Temas</h2>
        <p style={{ color:th.text3,fontSize:13 }}>Elige el look de tu app</p>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {Object.entries(THEMES).map(([key, tema]) => {
          const activo = temaActual === key;
          return (
            <button key={key} onClick={()=>onChangeTema(key)} style={{
              display:"flex", alignItems:"center", gap:14,
              background: activo ? tema.accent+"22" : th.surface,
              border: `2px solid ${activo ? tema.accent : th.border}`,
              borderRadius:14, padding:"14px 16px", cursor:"pointer",
              textAlign:"left", width:"100%", transition:"all 0.2s",
            }}>
              {/* Preview mini del tema */}
              <div style={{ width:48,height:48,borderRadius:12,background:tema.bg,border:`2px solid ${tema.border2}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",position:"relative" }}>
                <div style={{ position:"absolute",inset:0,background:tema.surface,opacity:0.8 }}/>
                <span style={{ fontSize:22,position:"relative",zIndex:1 }}>{tema.emoji}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color:activo?tema.accent:th.text,fontWeight:700,fontSize:14,marginBottom:3 }}>{tema.name}</div>
                {/* Mini paleta de colores */}
                <div style={{ display:"flex",gap:4 }}>
                  {[tema.bg,tema.surface,tema.accent,tema.border2].map((c,i)=>(
                    <div key={i} style={{ width:14,height:14,borderRadius:"50%",background:c,border:"1px solid rgba(255,255,255,0.1)" }}/>
                  ))}
                </div>
              </div>
              {activo && (
                <div style={{ width:24,height:24,borderRadius:"50%",background:tema.accentGrad,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12 }}>✓</div>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop:20,padding:"12px 14px",background:th.surface,borderRadius:12,border:`1px solid ${th.border}` }}>
        <p style={{ color:th.text3,fontSize:12,lineHeight:1.6 }}>
          💡 El tema se guarda automáticamente y se aplica cada vez que abres la app.
        </p>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [st, setSt]         = useState(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab]       = useState("dashboard");
  const [tema, setTema]     = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || "default"; } catch { return "default"; }
  });
  const th = THEMES[tema] || THEMES.default;

  const handleChangeTema = (key) => {
    setTema(key);
    try { localStorage.setItem(THEME_KEY, key); } catch {}
  };

  const [showSueldo,  setShowSueldo]  = useState(false);
  const [showCerrar,  setShowCerrar]  = useState(false);
  const [showNewCat,  setShowNewCat]  = useState(false);
  const [deleteId,    setDeleteId]    = useState(null);
  const [clasificar,  setClasificar]  = useState(null);
  const [editCat,     setEditCat]     = useState(null);
  const [gastoEditar, setGastoEditar] = useState(null);

  const [emailText,    setEmailText]    = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError,   setEmailError]   = useState("");

  useEffect(()=>{
    loadDB().then(d=>{
      if(d) setSt(sanitizeState(d)); else setShowSueldo(true);
      setLoaded(true);
    });
  },[]);
  useEffect(()=>{ if(!loaded)return; saveDB(st); },[st,loaded]);

  const saveSueldo = useCallback(s=>{ setSt(p=>({...p,activo:{...p.activo,sueldo:s}})); setShowSueldo(false); },[]);
  const handleAddSub = useCallback((cat,sub)=>{ setSt(p=>({...p,subcats:{...p.subcats,[cat]:[...(p.subcats[cat]||[]),sub]}})); },[]);
  const handleDeleteSub = useCallback((cat,sub)=>{ setSt(p=>({...p,subcats:{...p.subcats,[cat]:(p.subcats[cat]||[]).filter(s=>s!==sub)}})); },[]);

  const handleSaveCat = useCallback((key, changes)=>{
    setSt(p=>({...p, cats:{...p.cats,[key]:{...p.cats[key],...changes}}}));
    setEditCat(null);
  },[]);

  const handleNewCat = useCallback(({ icon, color, label, desc })=>{
    const key = uid();
    const newCat = { label, icon, color, desc };
    setSt(p=>({
      ...p,
      cats:    { ...p.cats, [key]: newCat },
      catKeys: [...p.catKeys, key],
      subcats: { ...p.subcats, [key]: [] },
    }));
    setShowNewCat(false);
  },[]);

  const handleDeleteCat = useCallback((key)=>{
    setSt(p=>{
      const { [key]:_, ...restCats }   = p.cats;
      const { [key]:__, ...restSubs }  = p.subcats;
      return {
        ...p,
        cats:    restCats,
        catKeys: p.catKeys.filter(k=>k!==key),
        subcats: restSubs,
        activo:  { ...p.activo, gastos: p.activo.gastos.map(g=>g.categoria===key?{...g,categoria:"variable"}:g) },
      };
    });
    setEditCat(null);
  },[]);

  const handleGastoSave = useCallback(g=>{
    setSt(p=>{ const gastos=[...p.activo.gastos]; const idx=gastos.findIndex(x=>x.id===g.id); if(idx>-1)gastos[idx]=g; else gastos.unshift(g); return {...p,activo:{...p.activo,gastos}}; });
    setGastoEditar(null);
  },[]);

  const confirmarPendiente = useCallback(g=>{
    const nuevo={...g,id:uid(),fecha:new Date().toLocaleDateString("es-CL")};
    setSt(p=>({...p,activo:{...p.activo,gastos:[nuevo,...p.activo.gastos]},pendientes:p.pendientes.filter(x=>x.id!==g.id)}));
    setClasificar(null);
  },[]);

  const descartarPendiente = useCallback(id=>{ setSt(p=>({...p,pendientes:p.pendientes.filter(x=>x.id!==id)})); },[]);
  const deleteGasto = useCallback(id=>{ setSt(p=>({...p,activo:{...p.activo,gastos:p.activo.gastos.filter(g=>g.id!==id)}})); setDeleteId(null); },[]);

  const cerrarMes = useCallback(()=>{
    setSt(p=>{ if(p.historial.length>0&&p.historial[0].mes===p.activo.mes)return p;
      return { historial:[{...p.activo,_uid:uid()},...p.historial], activo:{mes:currentMonth(),sueldo:0,gastos:[]}, pendientes:p.pendientes, subcats:p.subcats, cats:p.cats, catKeys:p.catKeys };
    });
    setShowCerrar(false); setShowSueldo(true);
  },[]);

  const cambiarMes = useCallback(step=>{
    setSt(p=>{
      const nuevoMes=stepMonth(p.activo.mes,step);
      let hist=[...p.historial];
      if(p.activo.sueldo>0||p.activo.gastos.length>0){
        const existeIdx=hist.findIndex(h=>h.mes===p.activo.mes);
        const snapshot={...p.activo,_uid:p.activo._uid||uid()};
        if(existeIdx>-1)hist[existeIdx]=snapshot; else hist=[snapshot,...hist];
      }
      const archivado=hist.find(h=>h.mes===nuevoMes);
      return {...p, activo:archivado?{...archivado}:{mes:nuevoMes,sueldo:0,gastos:[]}, historial:hist.filter(h=>h.mes!==nuevoMes)};
    });
  },[]);

  const parseEmail = async()=>{
    if(!emailText.trim())return;
    setEmailLoading(true); setEmailError("");
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),15000);
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"}, signal:controller.signal,
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:400,
          system:`Extrae TODOS los gastos de un correo bancario chileno. Responde SOLO con JSON array sin backticks: [{"nombre":"nombre corto","monto":12345}]. Si no hay gasto claro: []`,
          messages:[{role:"user",content:emailText}] }),
      });
      clearTimeout(timer);
      if(!res.ok)throw new Error(`Error de servidor (${res.status}).`);
      const json=await res.json();
      const text=(json.content||[]).map(b=>b.text||"").join("").trim();
      let arr; try{arr=JSON.parse(text);}catch{throw new Error("La IA no devolvió un formato válido.");}
      if(!Array.isArray(arr))throw new Error("Respuesta inesperada.");
      if(arr.length===0){setEmailError("No se detectaron gastos en ese correo.");}
      else{
        const nuevos=arr.filter(g=>g.nombre&&typeof g.monto==="number"&&g.monto>0).map(g=>({nombre:String(g.nombre).slice(0,80),monto:Math.round(g.monto),id:uid(),origen:"correo"}));
        if(nuevos.length===0)setEmailError("Se detectaron gastos pero con datos inválidos.");
        else{setSt(p=>({...p,pendientes:[...p.pendientes,...nuevos]}));setEmailText("");setTab("dashboard");}
      }
    }catch(e){
      setEmailError(e.name==="AbortError"?"Tiempo de espera agotado.":(e.message||"Error desconocido."));
    }finally{setEmailLoading(false);}
  };

  const { activo, historial, pendientes, subcats, cats, catKeys } = st;
  const total    = useMemo(()=>activo.gastos.reduce((a,g)=>a+g.monto,0),[activo.gastos]);
  const restante = activo.sueldo - total;
  const pct      = activo.sueldo>0?Math.min(100,(total/activo.sueldo)*100):0;
  const pctColor = pct>90?"#f87171":pct>70?"#fb923c":"#4ade80";
  const catData  = useMemo(()=>catKeys.map(k=>{ const t=activo.gastos.filter(g=>g.categoria===k).reduce((a,g)=>a+g.monto,0); return{k,total:t,pct:activo.sueldo>0?Math.min(100,(t/activo.sueldo)*100):0}; }).filter(x=>x.total>0),[activo.gastos,activo.sueldo,catKeys]);
  const totalAhorro = useMemo(()=>historial.reduce((a,m)=>{const g=m.gastos.reduce((x,y)=>x+y.monto,0);return a+(m.sueldo-g);},0),[historial]);
  const gastosOrdenados = useMemo(()=>catKeys.map(k=>({k,items:activo.gastos.filter(g=>g.categoria===k).sort((a,b)=>b.monto-a.monto)})).filter(g=>g.items.length>0).sort((a,b)=>b.items.reduce((s,g)=>s+g.monto,0)-a.items.reduce((s,g)=>s+g.monto,0)),[activo.gastos,catKeys]);

  if(!loaded)return(<div style={{ minHeight:"100vh",background:"#09090b",display:"flex",alignItems:"center",justifyContent:"center",color:"#4ade80",fontSize:32 }}>⏳</div>);

  return (
    <div style={{ minHeight:"100vh",background:th.bg,color:th.text,fontFamily:"system-ui,-apple-system,sans-serif",maxWidth:"100vw",overflowX:"hidden" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${th.border2};border-radius:99px;}
        textarea,button,input{font-family:system-ui,-apple-system,sans-serif;}
      `}</style>

      {showSueldo&&<SueldoSheet current={activo.sueldo} onSave={saveSueldo} onClose={()=>setShowSueldo(false)}/>}
      {gastoEditar!==null&&<GastoSheet gastoEditar={Object.keys(gastoEditar).length>0?gastoEditar:null} onSave={handleGastoSave} onAddSub={handleAddSub} onDeleteSub={handleDeleteSub} onClose={()=>setGastoEditar(null)} subcats={subcats} cats={cats} catKeys={catKeys}/>}
      {showCerrar&&<CerrarSheet activo={activo} onConfirm={cerrarMes} onClose={()=>setShowCerrar(false)}/>}
      {clasificar&&<ClasificarSheet pendiente={clasificar} onSave={confirmarPendiente} onClose={()=>setClasificar(null)} cats={cats} catKeys={catKeys}/>}
      {editCat&&<EditCatSheet catKey={editCat.key} cat={editCat.cat} isCustom={editCat.isCustom} onSave={handleSaveCat} onDelete={handleDeleteCat} onClose={()=>setEditCat(null)}/>}
      {showNewCat&&<NewCatSheet onSave={handleNewCat} onClose={()=>setShowNewCat(false)}/>}
      {deleteId&&(
        <Sheet onClose={()=>setDeleteId(null)}>
          <h3 style={{ color:"#f4f4f5",marginBottom:8,fontSize:18,fontWeight:800 }}>¿Eliminar gasto?</h3>
          <p style={{ color:"#71717a",fontSize:14,marginBottom:20 }}>Esta acción no se puede deshacer.</p>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>setDeleteId(null)} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
            <button onClick={()=>deleteGasto(deleteId)} style={{ flex:1,padding:12,borderRadius:12,border:"none",background:"#ef4444",color:"#fff",fontWeight:700,cursor:"pointer" }}>Eliminar</button>
          </div>
        </Sheet>
      )}

      <header style={{ padding:"12px 16px",borderBottom:"1px solid #1f1f23",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#09090b",zIndex:100 }}>
        <div>
          <h1 style={{ fontSize:15,fontWeight:800,letterSpacing:"-0.02em" }}>💸 ¿Dónde va mi sueldo?</h1>
          <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:2 }}>
            <button onClick={()=>cambiarMes(-1)} style={{ background:"transparent",border:"none",color:"#52525b",cursor:"pointer",fontSize:12,padding:"0 2px",lineHeight:1 }}>◀</button>
            <span style={{ color:"#52525b",fontSize:11,fontWeight:600 }}>{monthLabel(activo.mes)}</span>
            <button onClick={()=>cambiarMes(1)} style={{ background:"transparent",border:"none",color:"#52525b",cursor:"pointer",fontSize:12,padding:"0 2px",lineHeight:1 }}>▶</button>
          </div>
        </div>
        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
          {pendientes.length>0&&<button onClick={()=>setTab("dashboard")} style={{ padding:"5px 9px",borderRadius:10,border:"1px solid #fb923c55",background:"#fb923c18",color:"#fb923c",cursor:"pointer",fontSize:12,fontWeight:700 }}>⏳ {pendientes.length}</button>}
          <button onClick={()=>setShowSueldo(true)} style={{ padding:"5px 9px",borderRadius:10,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer",fontSize:12,whiteSpace:"nowrap" }}>✏️ {activo.sueldo>0?fmt(activo.sueldo):"Sueldo"}</button>
          <button onClick={()=>setGastoEditar({})} style={{ padding:"6px 13px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4ade80,#22c55e)",color:"#052e16",fontWeight:800,cursor:"pointer",fontSize:14 }}>+</button>
        </div>
      </header>

      <div style={{ display:"flex",borderBottom:`1px solid ${th.border}`,padding:"0 16px",overflowX:"auto" }}>
        {[["dashboard","📊 Resumen"],["gastos","📋 Gastos"],["categorias","🎨 Categorías"],["historial","🗂️ Historial"],["temas","🌈 Temas"],["email","📧 Correo"]].map(([k,lbl])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ padding:"10px 11px",background:"transparent",border:"none",color:tab===k?th.accent:th.text3,cursor:"pointer",fontSize:12,borderBottom:`2px solid ${tab===k?th.accent:"transparent"}`,transition:"all 0.15s",whiteSpace:"nowrap" }}>{lbl}</button>
        ))}
      </div>

      <main style={{ padding:"16px",maxWidth:600,margin:"0 auto" }}>
        {tab==="dashboard"&&<TabDashboard activo={activo} pendientes={pendientes} cats={cats} catKeys={catKeys} catData={catData} total={total} restante={restante} pct={pct} pctColor={pctColor} onShowSueldo={()=>setShowSueldo(true)} onClasificar={setClasificar} onDescartar={descartarPendiente} onCerrar={()=>setShowCerrar(true)}/>}
        {tab==="gastos"&&<TabGastos gastosOrdenados={gastosOrdenados} total={total} cats={cats} catKeys={catKeys} onDelete={setDeleteId} onEdit={g=>setGastoEditar(g)}/>}
        {tab==="categorias"&&<TabCategorias cats={cats} catKeys={catKeys} defaultCatKeys={DEFAULT_CAT_KEYS} onEdit={setEditCat} onNew={()=>setShowNewCat(true)}/>}
        {tab==="historial"&&<TabHistorial historial={historial} totalAhorro={totalAhorro} cats={cats} catKeys={catKeys}/>}
        {tab==="temas"&&<TabTemas temaActual={tema} onChangeTema={handleChangeTema} th={th}/>}
        {tab==="email"&&<TabEmail emailText={emailText} setEmailText={setEmailText} emailLoading={emailLoading} emailError={emailError} setEmailError={setEmailError} onParse={parseEmail} pendientes={pendientes}/>}
      </main>
    </div>
  );
}
