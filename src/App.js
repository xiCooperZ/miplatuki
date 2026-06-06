import { useState, useEffect, useCallback, useMemo } from "react";

// ─── CATEGORÍAS BASE ──────────────────────────────────────────────────────────
const DEFAULT_CATS = {
  fijo:      { label:"Fijo",           icon:"🏠", color:"#4ade80", desc:"Arriendo, servicios básicos" },
  hormiga:   { label:"Hormiga",        icon:"🐜", color:"#fb923c", desc:"Café, snacks, cositas chicas" },
  antojo:    { label:"Antojo",         icon:"🛒", color:"#f472b6", desc:"Compras impulsivas, caprichos" },
  variable:  { label:"Variable",       icon:"📦", color:"#60a5fa", desc:"Salud, transporte, ropa" },
  regaloneo: { label:"Regaloneo",      icon:"🎁", color:"#a78bfa", desc:"Regalos a otros y a uno mismo" },
  fantasma:  { label:"Gasto Fantasma", icon:"👻", color:"#94a3b8", desc:"Gastos que no recuerdas haber hecho" },
  ahorro:    { label:"Ahorro",         icon:"💰", color:"#34d399", desc:"Plata guardada intencionalmente" },
};
const CAT_KEYS = Object.keys(DEFAULT_CATS);
const STORAGE_KEY = "sueldo_tracker_v7";

const COLOR_PALETTE = [
  "#4ade80","#22c55e","#86efac","#fb923c","#f97316","#fdba74",
  "#f472b6","#ec4899","#f9a8d4","#60a5fa","#3b82f6","#93c5fd",
  "#a78bfa","#8b5cf6","#c4b5fd","#94a3b8","#64748b","#cbd5e1",
  "#f87171","#ef4444","#fca5a5","#facc15","#eab308","#fde047",
  "#34d399","#10b981","#6ee7b7","#e879f9","#d946ef","#f0abfc",
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt = n => "$" + Math.round(Math.max(0, n)).toLocaleString("es-CL");
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

// Navegar meses: step = -1 o +1
function stepMonth(iso, step) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 1 + step, 1);
  return d.toISOString().slice(0, 7);
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
async function loadDB() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
async function saveDB(d) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────
const DEFAULT = {
  activo:    { mes: currentMonth(), sueldo: 0, gastos: [] },
  historial: [],
  pendientes:[],
  subcats:   { fijo:[], hormiga:[], antojo:[], variable:[], regaloneo:[], fantasma:[], ahorro:[] },
  cats:      DEFAULT_CATS,
};

function sanitizeState(d) {
  return {
    activo: {
      mes:    typeof d.activo?.mes === "string" ? d.activo.mes : currentMonth(),
      sueldo: typeof d.activo?.sueldo === "number" && d.activo.sueldo >= 0 ? d.activo.sueldo : 0,
      gastos: Array.isArray(d.activo?.gastos) ? d.activo.gastos : [],
    },
    historial:  Array.isArray(d.historial)  ? d.historial  : [],
    pendientes: Array.isArray(d.pendientes) ? d.pendientes : [],
    subcats: { ...DEFAULT.subcats, ...(d.subcats || {}) },
    cats:    d.cats ? { ...DEFAULT_CATS, ...d.cats } : { ...DEFAULT_CATS },
  };
}

// ─── SVG RING ─────────────────────────────────────────────────────────────────
function Ring({ pct, color, size = 76, stroke = 8 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (Math.min(Math.max(pct, 0), 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#27272a" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.7s ease" }}/>
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

// ─── EDIT CAT SHEET ───────────────────────────────────────────────────────────
function EditCatSheet({ catKey, cat, onSave, onClose }) {
  const EMOJIS = ["🏠","🐜","🛒","📦","🎁","👻","🍕","🚗","💊","📱","✈️","🎵","🎬","👗","⚽","🐾","🌿","☕","🍺","🎮","💻","🏋️","📚","💈","🛁","🧴","🧹","💡","🔑","🛍️","💰","🌊","🎪","🎯","🧃","🍦","🥑","🐶","🌙","⭐"];
  const [icon,  setIcon]  = useState(cat.icon);
  const [color, setColor] = useState(cat.color);
  return (
    <Sheet onClose={onClose}>
      <h2 style={{ color:"#f4f4f5",fontSize:19,fontFamily:"'Syne',sans-serif",marginBottom:4 }}>✏️ Personalizar categoría</h2>
      <p style={{ color:"#71717a",fontSize:13,marginBottom:20 }}>Emoji y color para <strong style={{ color }}>{cat.label}</strong></p>
      <div style={{ display:"flex",alignItems:"center",gap:12,background:"#09090b",borderRadius:12,padding:"14px 16px",marginBottom:20 }}>
        <div style={{ width:44,height:44,borderRadius:12,background:color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:`2px solid ${color}55` }}>{icon}</div>
        <div>
          <div style={{ color:"#f4f4f5",fontWeight:700,fontSize:15 }}>{cat.label}</div>
          <div style={{ color,fontSize:12,marginTop:2 }}>{cat.desc}</div>
        </div>
      </div>
      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:8,fontWeight:700,letterSpacing:"0.07em" }}>EMOJI</label>
      <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:20,maxHeight:120,overflowY:"auto" }}>
        {EMOJIS.map(e => (
          <button key={e} onClick={() => setIcon(e)} style={{ width:38,height:38,borderRadius:10,border:`2px solid ${icon===e?color:"#3f3f46"}`,background:icon===e?color+"22":"transparent",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>{e}</button>
        ))}
      </div>
      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:8,fontWeight:700,letterSpacing:"0.07em" }}>COLOR</label>
      <div style={{ display:"flex",flexWrap:"wrap",gap:7,marginBottom:22 }}>
        {COLOR_PALETTE.map(col => (
          <button key={col} onClick={() => setColor(col)} style={{ width:30,height:30,borderRadius:"50%",background:col,border:`3px solid ${color===col?"#f4f4f5":"transparent"}`,cursor:"pointer",outline:"none",transition:"transform 0.1s",transform:color===col?"scale(1.2)":"scale(1)" }}/>
        ))}
      </div>
      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
        <button onClick={() => onSave(catKey, { icon, color })} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:`linear-gradient(135deg,${color},${color}bb)`,color:"#09090b",fontWeight:800,cursor:"pointer",fontSize:14,fontFamily:"'Syne',sans-serif" }}>Guardar</button>
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
      <h2 style={{ color:"#f4f4f5",fontSize:20,fontFamily:"'Syne',sans-serif",marginBottom:4 }}>💼 Tu sueldo mensual</h2>
      <p style={{ color:"#71717a",fontSize:13,marginBottom:18 }}>Monto neto que recibes en mano</p>
      <div style={{ position:"relative",marginBottom:6 }}>
        <span style={{ position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"#a1a1aa",fontWeight:700 }}>$</span>
        <input autoFocus type="number" value={v} onChange={e => setV(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ok && onSave(val)} placeholder="600000"
          style={{ width:"100%",boxSizing:"border-box",background:"#09090b",border:`1px solid ${tooLarge?"#ef4444":"#3f3f46"}`,borderRadius:12,padding:"13px 13px 13px 28px",color:"#f4f4f5",fontSize:20,outline:"none",fontFamily:"'Syne',sans-serif" }}/>
      </div>
      {tooLarge && <p style={{ color:"#f87171",fontSize:12,marginBottom:10 }}>⚠️ Revisa el monto ingresado</p>}
      {!tooLarge && <div style={{ marginBottom:14 }}/>}
      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
        <button onClick={() => ok && onSave(val)} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#4ade80,#22c55e)",color:"#052e16",fontWeight:800,cursor:ok?"pointer":"not-allowed",opacity:ok?1:0.5,fontSize:15,fontFamily:"'Syne',sans-serif" }}>Guardar</button>
      </div>
    </Sheet>
  );
}

// ─── GASTO SHEET ─────────────────────────────────────────────────────────────
// MEJORA: recibe `gastoEditar` para editar gastos existentes
function GastoSheet({ onSave, onClose, onAddSub, onDeleteSub, gastoEditar, subcats, cats }) {
  const [nombre,    setNombre]    = useState(gastoEditar?.nombre    || "");
  const [monto,     setMonto]     = useState(gastoEditar?.monto     ? String(gastoEditar.monto) : "");
  const [cat,       setCat]       = useState(gastoEditar?.categoria || "fijo");
  const [subcat,    setSubcat]    = useState(gastoEditar?.subcat    || "");
  const [newSub,    setNewSub]    = useState("");
  const [showAdd,   setShowAdd]   = useState(false);
  const [localSubs, setLocalSubs] = useState(subcats);

  const montoVal = parse$(monto);
  const tooLarge = montoVal > 100_000_000;
  const ok = nombre.trim().length > 0 && montoVal > 0 && !tooLarge;
  const c  = cats[cat] || DEFAULT_CATS[cat];
  const subs = localSubs[cat] || [];

  const save = () => {
    if (!ok) return;
    onSave({
      id:        gastoEditar?.id || uid(),
      nombre:    nombre.trim(),
      monto:     montoVal,
      categoria: cat,
      subcat:    subcat || "",
      fecha:     gastoEditar?.fecha || new Date().toLocaleDateString("es-CL"),
    });
  };

  const handleAddSub = () => {
    const s = newSub.trim();
    if (!s || subs.includes(s)) { setNewSub(""); setShowAdd(false); return; }
    const updated = { ...localSubs, [cat]: [...subs, s] };
    setLocalSubs(updated);
    onAddSub(cat, s);
    setSubcat(s);
    setNewSub("");
    setShowAdd(false);
  };

  const handleDeleteSub = s => {
    const updated = { ...localSubs, [cat]: subs.filter(x => x !== s) };
    setLocalSubs(updated);
    if (subcat === s) setSubcat("");
    onDeleteSub(cat, s);
  };

  return (
    <Sheet onClose={onClose}>
      <h2 style={{ color:"#f4f4f5",fontSize:19,fontFamily:"'Syne',sans-serif",marginBottom:4 }}>
        {gastoEditar ? "✏️ Editar gasto" : "💸 Registrar gasto"}
      </h2>
      <p style={{ color:"#71717a",fontSize:13,marginBottom:20 }}>Asigna descripción, monto y clasificación</p>

      {/* Categoría primero — mejora UX del documento */}
      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:8,fontWeight:700,letterSpacing:"0.07em" }}>CATEGORÍA</label>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:18 }}>
        {CAT_KEYS.map(k => {
          const cx = cats[k] || DEFAULT_CATS[k];
          const sel = cat === k;
          return (
            <button key={k} onClick={() => { setCat(k); setSubcat(""); setShowAdd(false); }} style={{ padding:"9px 6px",borderRadius:10,border:`2px solid ${sel?cx.color:"#3f3f46"}`,background:sel?cx.color+"18":"transparent",color:sel?cx.color:"#71717a",cursor:"pointer",textAlign:"center",transition:"all 0.15s" }}>
              <div style={{ fontSize:18,marginBottom:1 }}>{cx.icon}</div>
              <div style={{ fontSize:10,fontWeight:700 }}>{cx.label}</div>
            </button>
          );
        })}
      </div>

      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:5,fontWeight:700,letterSpacing:"0.07em" }}>DESCRIPCIÓN</label>
      <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)}
        placeholder="ej: Torito en el super"
        onKeyDown={e => e.key === "Enter" && save()}
        style={{ width:"100%",boxSizing:"border-box",background:"#09090b",border:"1px solid #3f3f46",borderRadius:11,padding:"12px 13px",color:"#f4f4f5",fontSize:14,marginBottom:14,outline:"none" }}/>

      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:5,fontWeight:700,letterSpacing:"0.07em" }}>MONTO (CLP)</label>
      <div style={{ position:"relative",marginBottom:6 }}>
        <span style={{ position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"#a1a1aa",fontWeight:700 }}>$</span>
        <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()} placeholder="2000"
          style={{ width:"100%",boxSizing:"border-box",background:"#09090b",border:`1px solid ${tooLarge?"#ef4444":"#3f3f46"}`,borderRadius:11,padding:"12px 13px 12px 28px",color:"#f4f4f5",fontSize:14,outline:"none" }}/>
      </div>
      {tooLarge && <p style={{ color:"#f87171",fontSize:11,marginBottom:10 }}>⚠️ Monto fuera del rango permitido</p>}
      {!tooLarge && <div style={{ marginBottom:16 }}/>}

      <label style={{ display:"block",color:"#a1a1aa",fontSize:10,marginBottom:8,fontWeight:700,letterSpacing:"0.07em" }}>
        SUBCATEGORÍA <span style={{ color:"#52525b",fontWeight:400 }}>(opcional)</span>
      </label>
      {subs.length > 0 && (
        <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:10 }}>
          <button onClick={() => setSubcat("")} style={{ padding:"5px 11px",borderRadius:99,fontSize:11,border:`1px solid ${subcat===""?c.color:"#3f3f46"}`,background:subcat===""?c.color+"18":"transparent",color:subcat===""?c.color:"#71717a",cursor:"pointer" }}>Ninguna</button>
          {subs.map(s => (
            <div key={s} style={{ display:"flex",alignItems:"center" }}>
              <button onClick={() => setSubcat(s)} style={{ padding:"5px 9px",borderRadius:"99px 0 0 99px",fontSize:11,border:`1px solid ${subcat===s?c.color:"#3f3f46"}`,borderRight:"none",background:subcat===s?c.color+"18":"transparent",color:subcat===s?c.color:"#71717a",cursor:"pointer" }}>{s}</button>
              <button onClick={() => handleDeleteSub(s)} style={{ padding:"5px 7px",borderRadius:"0 99px 99px 0",fontSize:10,border:`1px solid ${subcat===s?c.color:"#3f3f46"}`,background:subcat===s?c.color+"18":"transparent",color:"#52525b",cursor:"pointer",lineHeight:1 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom:20 }}>
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} style={{ background:"transparent",border:"1px dashed #3f3f46",color:"#a1a1aa",padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",fontWeight:600 }}>＋ Nueva subcategoría</button>
        ) : (
          <div style={{ display:"flex",gap:8 }}>
            <input value={newSub} onChange={e => setNewSub(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddSub()}
              placeholder={`Nueva en ${c.label}...`} autoFocus
              style={{ flex:1,background:"#09090b",border:"1px solid #3f3f46",borderRadius:10,padding:"9px 12px",color:"#f4f4f5",fontSize:13,outline:"none" }}/>
            <button onClick={handleAddSub} style={{ padding:"9px 14px",borderRadius:10,border:"none",background:c.color,color:"#09090b",fontWeight:700,cursor:"pointer",fontSize:13 }}>Añadir</button>
            <button onClick={() => { setNewSub(""); setShowAdd(false); }} style={{ padding:"9px 10px",borderRadius:10,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>✕</button>
          </div>
        )}
      </div>

      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
        <button onClick={save} disabled={!ok} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:ok?`linear-gradient(135deg,${c.color},${c.color}bb)`:"#27272a",color:ok?"#09090b":"#71717a",fontWeight:800,cursor:ok?"pointer":"not-allowed",fontSize:14,fontFamily:"'Syne',sans-serif",transition:"all 0.2s" }}>
          {gastoEditar ? "Guardar cambios" : "Confirmar gasto"}
        </button>
      </div>
    </Sheet>
  );
}

// ─── CERRAR MES SHEET ─────────────────────────────────────────────────────────
function CerrarSheet({ activo, onConfirm, onClose }) {
  const total    = activo.gastos.reduce((a, g) => a + g.monto, 0);
  const ahorrado = activo.gastos.filter(g => g.categoria === "ahorro").reduce((a, g) => a + g.monto, 0);
  const sobrante = activo.sueldo - total; // lo que sobró sin usar
  const superavit = sobrante > 0;

  // Porcentaje de ahorro sobre sueldo (registrado + sobrante)
  const totalAhorro = ahorrado + Math.max(0, sobrante);
  const pctAhorro   = activo.sueldo > 0 ? Math.min(100, (totalAhorro / activo.sueldo) * 100) : 0;

  // Mensaje motivacional según el resultado
  const getMensaje = () => {
    if (activo.sueldo === 0) return { emoji:"📊", text:"Cierra el mes para archivarlo en el historial." };
    if (sobrante < 0)  return { emoji:"⚠️", text:`Te pasaste por ${fmt(Math.abs(sobrante))} este mes. ¡El próximo será mejor, tú puedes!` };
    if (sobrante === 0) return { emoji:"🎯", text:"Gastaste exactamente lo que tenías. ¡Al peso, eso también es control!" };
    if (pctAhorro >= 20) return { emoji:"🚀", text:`¡Excelente! Guardaste el ${pctAhorro.toFixed(0)}% de tu sueldo. ¡Eso es un golazo!` };
    if (pctAhorro >= 15) return { emoji:"🌟", text:`¡Excelente! ${pctAhorro.toFixed(0)}% guardado este mes. Vas por muy buen camino.` };
    if (pctAhorro >= 10) return { emoji:"💪", text:`¡Excelente! Cerraste el mes con ${fmt(sobrante)} guardados. ¡Sigue así!` };
    if (pctAhorro >= 5)  return { emoji:"😊", text:`¡Muy bien! Guardaste ${fmt(totalAhorro)} este mes. Cada peso que guardas suma.` };
    if (pctAhorro >= 2)  return { emoji:"✨", text:`¡Bien! Cerraste con ${fmt(totalAhorro)} guardados. Arrancar es lo más difícil, ya lo estás haciendo.` };
    return { emoji:"🌱", text:`Cerraste con ${fmt(sobrante)} sin usar. Cualquier ahorro, por pequeño que sea, es un paso adelante.` };
  };
  const { emoji, text } = getMensaje();

  return (
    <Sheet onClose={onClose}>
      <h2 style={{ color:"#f4f4f5",fontSize:19,fontFamily:"'Syne',sans-serif",marginBottom:4 }}>📦 Cerrar {monthLabel(activo.mes)}</h2>
      <p style={{ color:"#71717a",fontSize:13,marginBottom:20,lineHeight:1.5 }}>
        El mes quedará guardado en el historial y podrás ver cómo le fue.
      </p>

      {/* Tarjeta resumen visual */}
      <div style={{ background:"#09090b",borderRadius:16,padding:"18px",marginBottom:16 }}>

        {/* Mensaje motivacional */}
        <div style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:18,padding:"12px 14px",background:"#18181b",borderRadius:12,border:`1px solid ${superavit?"#4ade8033":"#f8717133"}` }}>
          <span style={{ fontSize:22,flexShrink:0 }}>{emoji}</span>
          <p style={{ color: superavit?"#a1a1aa":"#f87171",fontSize:13,lineHeight:1.5,margin:0 }}>{text}</p>
        </div>

        {/* Números */}
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {[
            ["Sueldo del mes",    fmt(activo.sueldo),     "#4ade80"],
            ["Total gastado",     fmt(total),              "#fb923c"],
            ["Ahorro registrado", fmt(ahorrado),           "#34d399"],
          ].map(([l, v, col]) => (
            <div key={l} style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ color:"#71717a",fontSize:13 }}>{l}</span>
              <span style={{ color:col,fontWeight:700,fontSize:14 }}>{v}</span>
            </div>
          ))}
          <div style={{ height:1,background:"#27272a",margin:"2px 0" }}/>
          {/* Sobrante destacado */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ color:"#a1a1aa",fontWeight:600,fontSize:14 }}>
              {sobrante >= 0 ? "💸 Sin usar" : "⚠️ Excedido"}
            </span>
            <span style={{ color:sobrante>=0?"#4ade80":"#f87171",fontWeight:800,fontSize:20,fontFamily:"'Syne',sans-serif" }}>
              {fmt(Math.abs(sobrante))}
            </span>
          </div>
        </div>

        {/* Barra de ahorro total */}
        {activo.sueldo > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
              <span style={{ color:"#52525b",fontSize:11 }}>Ahorro total del mes</span>
              <span style={{ color:"#34d399",fontSize:11,fontWeight:700 }}>{pctAhorro.toFixed(0)}% del sueldo</span>
            </div>
            <div style={{ background:"#27272a",borderRadius:99,height:8,overflow:"hidden" }}>
              <div style={{ height:"100%",borderRadius:99,width:`${pctAhorro}%`,background:"linear-gradient(90deg,#10b981,#34d399)",transition:"width 0.6s ease" }}/>
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
        <button onClick={onConfirm} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#818cf8,#6366f1)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14,fontFamily:"'Syne',sans-serif" }}>
          Cerrar mes ✓
        </button>
      </div>
    </Sheet>
  );
}

// ─── CLASIFICAR PENDIENTE SHEET ───────────────────────────────────────────────
function ClasificarSheet({ pendiente, onSave, onClose, cats }) {
  const [cat, setCat] = useState("hormiga");
  const c = cats[cat] || DEFAULT_CATS[cat];
  return (
    <Sheet onClose={onClose}>
      <h2 style={{ color:"#f4f4f5",fontSize:19,fontFamily:"'Syne',sans-serif",marginBottom:4 }}>🗂️ Clasificar gasto</h2>
      <p style={{ color:"#71717a",fontSize:13,marginBottom:18 }}>¿A qué categoría pertenece este gasto?</p>
      <div style={{ background:"#09090b",borderRadius:12,padding:"14px 16px",marginBottom:18 }}>
        <div style={{ color:"#f4f4f5",fontSize:15,fontWeight:600,marginBottom:4 }}>{pendiente.nombre}</div>
        <div style={{ color:"#4ade80",fontSize:20,fontWeight:800,fontFamily:"'Syne',sans-serif" }}>{fmt(pendiente.monto)}</div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:22 }}>
        {CAT_KEYS.map(k => {
          const cx = cats[k] || DEFAULT_CATS[k];
          const sel = cat === k;
          return (
            <button key={k} onClick={() => setCat(k)} style={{ padding:"9px 6px",borderRadius:10,border:`2px solid ${sel?cx.color:"#3f3f46"}`,background:sel?cx.color+"18":"transparent",color:sel?cx.color:"#71717a",cursor:"pointer",textAlign:"center" }}>
              <div style={{ fontSize:18,marginBottom:1 }}>{cx.icon}</div>
              <div style={{ fontSize:10,fontWeight:700 }}>{cx.label}</div>
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
        <button onClick={() => onSave({ ...pendiente, categoria: cat })} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:`linear-gradient(135deg,${c.color},${c.color}bb)`,color:"#09090b",fontWeight:800,cursor:"pointer",fontSize:14,fontFamily:"'Syne',sans-serif" }}>
          Registrar como {c.label}
        </button>
      </div>
    </Sheet>
  );
}

// ─── RESUMEN MES (historial) ──────────────────────────────────────────────────
function ResumenMes({ mes, cats }) {
  const total  = mes.gastos.reduce((a, g) => a + g.monto, 0);
  const ahorro = mes.sueldo - total;
  const bycat  = CAT_KEYS
    .map(k => ({ k, v: mes.gastos.filter(g => g.categoria === k).reduce((a, g) => a + g.monto, 0) }))
    .filter(x => x.v > 0);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:13,marginBottom:10,overflow:"hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width:"100%",padding:"15px 16px",background:"transparent",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,color:"#f4f4f5" }}>{monthLabel(mes.mes)}</div>
          <div style={{ color:"#52525b",fontSize:11,marginTop:1 }}>{mes.gastos.length} gastos · {fmt(total)} gastado</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:ahorro>=0?"#4ade80":"#f87171",fontWeight:800,fontSize:15,fontFamily:"'Syne',sans-serif" }}>{ahorro >= 0 ? "💰" : ""}{fmt(Math.abs(ahorro))}</div>
          <div style={{ color:"#52525b",fontSize:10 }}>{ahorro >= 0 ? "ahorrado" : "excedido"}</div>
        </div>
      </button>
      {open && (
        <div style={{ padding:"0 16px 16px",borderTop:"1px solid #27272a" }}>
          <div style={{ display:"flex",flexDirection:"column",gap:7,marginTop:12 }}>
            {bycat.map(({ k, v }) => {
              const c = cats[k] || DEFAULT_CATS[k];
              return (
                <div key={k} style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ color:"#a1a1aa",fontSize:12 }}>{c.icon} {c.label}</span>
                  <div>
                    <span style={{ color:c.color,fontWeight:700,fontSize:12 }}>{fmt(v)}</span>
                    {mes.sueldo > 0 && <span style={{ color:"#52525b",fontSize:10,marginLeft:5 }}>{((v / mes.sueldo) * 100).toFixed(0)}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB DASHBOARD ────────────────────────────────────────────────────────────
function TabDashboard({ activo, pendientes, cats, catData, total, restante, pct, pctColor, onShowSueldo, onClasificar, onDescartar, onCerrar }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>

      {/* Sueldo no configurado */}
      {activo.sueldo === 0 && (
        <div onClick={onShowSueldo} style={{ background:"#18181b",border:"2px dashed #4ade8044",borderRadius:13,padding:"20px",textAlign:"center",cursor:"pointer" }}>
          <div style={{ fontSize:28,marginBottom:6 }}>💼</div>
          <div style={{ color:"#4ade80",fontWeight:700,fontSize:14 }}>Ingresa tu sueldo para empezar</div>
          <div style={{ color:"#52525b",fontSize:12,marginTop:3 }}>Toca aquí para configurarlo</div>
        </div>
      )}

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div style={{ background:"#18181b",border:"1px solid #fb923c55",borderRadius:13,padding:"14px 16px" }}>
          <div style={{ color:"#fb923c",fontSize:11,fontWeight:700,letterSpacing:"0.06em",marginBottom:10 }}>⏳ GASTOS PENDIENTES DE CLASIFICAR</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {pendientes.map(p => (
              <div key={p.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:"#09090b",borderRadius:10,padding:"10px 13px" }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ color:"#f4f4f5",fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.nombre}</div>
                  <div style={{ color:"#52525b",fontSize:11,marginTop:1 }}>Detectado desde correo</div>
                </div>
                <div style={{ display:"flex",gap:7,flexShrink:0,marginLeft:8 }}>
                  <button onClick={() => onClasificar(p)} style={{ padding:"6px 11px",borderRadius:9,border:"none",background:"#fb923c",color:"#09090b",fontWeight:700,cursor:"pointer",fontSize:12 }}>{fmt(p.monto)}</button>
                  <button onClick={() => onDescartar(p.id)} style={{ padding:"6px 9px",borderRadius:9,border:"1px solid #3f3f46",background:"transparent",color:"#71717a",cursor:"pointer",fontSize:12 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards resumen — MEJORA: ring grande central como en el documento */}
      <div style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:16,padding:"18px 16px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
          <div>
            <div style={{ color:"#52525b",fontSize:10,fontWeight:700,letterSpacing:"0.05em",marginBottom:4 }}>DISPONIBLE</div>
            <div style={{ color: restante>=0?"#4ade80":"#f87171",fontSize:28,fontWeight:800,fontFamily:"'Syne',sans-serif",lineHeight:1 }}>{fmt(Math.abs(restante))}</div>
            {restante < 0 && <div style={{ color:"#f87171",fontSize:11,marginTop:3 }}>⚠️ Presupuesto excedido</div>}
          </div>
          <div style={{ position:"relative",width:84,height:84,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Ring pct={pct} color={pctColor} size={84} stroke={9}/>
            <div style={{ position:"absolute",textAlign:"center" }}>
              <div style={{ color:"#fff",fontWeight:800,fontSize:15,fontFamily:"'Syne',sans-serif" }}>{Math.round(pct)}%</div>
              <div style={{ color:"#a1a1aa",fontSize:8,fontWeight:700 }}>GASTADO</div>
            </div>
          </div>
        </div>
        <div style={{ height:1,background:"#27272a",marginBottom:14 }}/>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <div>
            <div style={{ color:"#52525b",fontSize:10,fontWeight:700,letterSpacing:"0.05em",marginBottom:3 }}>SUELDO NETO</div>
            <div style={{ color:"#4ade80",fontSize:16,fontWeight:800,fontFamily:"'Syne',sans-serif" }}>{activo.sueldo > 0 ? fmt(activo.sueldo) : "—"}</div>
          </div>
          <div>
            <div style={{ color:"#52525b",fontSize:10,fontWeight:700,letterSpacing:"0.05em",marginBottom:3 }}>TOTAL GASTOS</div>
            <div style={{ color:"#fb923c",fontSize:16,fontWeight:800,fontFamily:"'Syne',sans-serif" }}>{total > 0 ? fmt(total) : "—"}</div>
          </div>
        </div>
      </div>

      {/* Barra progreso */}
      {activo.sueldo > 0 && (
        <div style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:12,padding:"14px 15px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
            <span style={{ color:"#a1a1aa",fontSize:12 }}>Progreso del mes</span>
            <span style={{ color:pctColor,fontWeight:700,fontSize:12 }}>{pct.toFixed(1)}%</span>
          </div>
          <div style={{ background:"#27272a",borderRadius:99,height:9,overflow:"hidden" }}>
            <div style={{ height:"100%",borderRadius:99,width:`${pct}%`,background:pct>90?"linear-gradient(90deg,#ef4444,#f87171)":pct>70?"linear-gradient(90deg,#f97316,#fb923c)":"linear-gradient(90deg,#16a34a,#4ade80)",transition:"width 0.6s ease" }}/>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",marginTop:4 }}>
            <span style={{ color:"#52525b",fontSize:10 }}>$0</span>
            <span style={{ color:"#52525b",fontSize:10 }}>{fmt(activo.sueldo)}</span>
          </div>
        </div>
      )}

      {/* Anillos por categoría — MEJORA: diseño tipo tarjeta del documento */}
      {catData.length > 0 && (
        <div style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:13,padding:"16px" }}>
          <div style={{ color:"#a1a1aa",fontSize:11,fontWeight:700,letterSpacing:"0.06em",marginBottom:14 }}>DISTRIBUCIÓN DE CATEGORÍAS</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10 }}>
            {catData.map(({ k, total: t, pct: p }) => {
              const c = cats[k] || DEFAULT_CATS[k];
              return (
                <div key={k} style={{ background:"#09090b",borderRadius:12,padding:"12px",display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ position:"relative",width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <Ring pct={p} color={c.color} size={48} stroke={5}/>
                    <div style={{ position:"absolute",fontSize:15 }}>{c.icon}</div>
                  </div>
                  <div style={{ minWidth:0,flex:1 }}>
                    <div style={{ color:"#f4f4f5",fontSize:11,fontWeight:700,marginBottom:2 }}>{c.label}</div>
                    <div style={{ color:c.color,fontSize:12,fontWeight:800,fontFamily:"'Syne',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{fmt(t)}</div>
                    <div style={{ color:"#52525b",fontSize:9,marginTop:1 }}>{p.toFixed(0)}% del sueldo</div>
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

      {activo.gastos.length === 0 && pendientes.length === 0 && activo.sueldo > 0 && (
        <div style={{ textAlign:"center",padding:"44px 20px",background:"#18181b",borderRadius:13,border:"1px solid #27272a" }}>
          <div style={{ fontSize:40,marginBottom:9 }}>🧾</div>
          <div style={{ color:"#71717a",fontSize:15,marginBottom:5 }}>Sin gastos todavía</div>
          <div style={{ color:"#52525b",fontSize:13 }}>Toca <strong style={{ color:"#4ade80" }}>+</strong> para empezar</div>
        </div>
      )}

      {/* easter egg */}
      <div style={{ textAlign:"center",paddingTop:8,paddingBottom:2 }}>
        <span style={{ color:"#27272a",fontSize:10,letterSpacing:"0.04em",userSelect:"none" }}>te amo Fran ❤️ 🐰</span>
      </div>
    </div>
  );
}

// ─── TAB GASTOS ───────────────────────────────────────────────────────────────
// MEJORA: botón editar por gasto (del documento)
function TabGastos({ gastosOrdenados, total, cats, onDelete, onEdit }) {
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:16 }}>
          Gastos <span style={{ color:"#52525b",fontWeight:400,fontSize:12 }}>({gastosOrdenados.reduce((a, g) => a + g.items.length, 0)})</span>
        </h2>
        {gastosOrdenados.length > 0 && <span style={{ color:"#52525b",fontSize:12 }}>Total: <strong style={{ color:"#fb923c" }}>{fmt(total)}</strong></span>}
      </div>
      {gastosOrdenados.length === 0 ? (
        <div style={{ textAlign:"center",padding:"44px 20px",background:"#18181b",borderRadius:13,border:"1px solid #27272a" }}>
          <div style={{ fontSize:40,marginBottom:9 }}>📋</div>
          <div style={{ color:"#71717a" }}>No hay gastos aún</div>
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          {gastosOrdenados.map(({ k, items }) => {
            const c = cats[k] || DEFAULT_CATS[k];
            const subtotal = items.reduce((a, g) => a + g.monto, 0);
            return (
              <div key={k}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7,paddingBottom:6,borderBottom:`1px solid ${c.color}33` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                    <span style={{ fontSize:16 }}>{c.icon}</span>
                    <span style={{ color:c.color,fontWeight:700,fontSize:13 }}>{c.label}</span>
                    <span style={{ color:"#52525b",fontSize:11 }}>({items.length})</span>
                  </div>
                  <span style={{ color:c.color,fontWeight:800,fontSize:13,fontFamily:"'Syne',sans-serif" }}>{fmt(subtotal)}</span>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                  {items.map(g => (
                    <div key={g.id} style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:11,padding:"11px 13px",display:"flex",alignItems:"center",gap:10 }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ color:"#f4f4f5",fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{g.nombre}</div>
                        <div style={{ display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",marginTop:3 }}>
                          {g.subcat && <span style={{ color:"#52525b",fontSize:10,background:"#27272a",borderRadius:5,padding:"1px 6px" }}>{g.subcat}</span>}
                          <span style={{ color:"#52525b",fontSize:10 }}>{g.fecha}</span>
                        </div>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
                        <div style={{ color:c.color,fontWeight:800,fontSize:13,fontFamily:"'Syne',sans-serif" }}>{fmt(g.monto)}</div>
                        {/* MEJORA: botón editar */}
                        <button onClick={() => onEdit(g)} style={{ background:"#27272a",border:"none",color:"#a1a1aa",cursor:"pointer",fontSize:12,padding:"4px 7px",borderRadius:7,lineHeight:1 }}>✏️</button>
                        <button onClick={() => onDelete(g.id)} style={{ background:"#27272a",border:"none",color:"#71717a",cursor:"pointer",fontSize:12,padding:"4px 7px",borderRadius:7,lineHeight:1 }}>✕</button>
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

// ─── TAB CATEGORÍAS ───────────────────────────────────────────────────────────
function TabCategorias({ cats, onEdit }) {
  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:16,marginBottom:4 }}>🎨 Personalizar categorías</h2>
        <p style={{ color:"#71717a",fontSize:13 }}>Toca cualquier categoría para cambiar su emoji y color.</p>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:9 }}>
        {CAT_KEYS.map(k => {
          const c = cats[k] || DEFAULT_CATS[k];
          return (
            <button key={k} onClick={() => onEdit({ key: k, cat: c })} style={{ display:"flex",alignItems:"center",gap:13,background:"#18181b",border:`1px solid ${c.color}44`,borderRadius:13,padding:"14px 16px",cursor:"pointer",textAlign:"left",width:"100%" }}>
              <div style={{ width:44,height:44,borderRadius:12,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:`2px solid ${c.color}55`,flexShrink:0 }}>{c.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ color:"#f4f4f5",fontWeight:700,fontSize:14 }}>{c.label}</div>
                <div style={{ color:"#52525b",fontSize:12,marginTop:2 }}>{c.desc}</div>
              </div>
              <div style={{ width:22,height:22,borderRadius:"50%",background:c.color,flexShrink:0 }}/>
              <span style={{ color:"#52525b",fontSize:12 }}>✏️</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── TAB HISTORIAL ────────────────────────────────────────────────────────────
function TabHistorial({ historial, totalAhorro, cats }) {
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:16 }}>
          Historial <span style={{ color:"#52525b",fontWeight:400,fontSize:12 }}>({historial.length} meses)</span>
        </h2>
      </div>
      {historial.length > 0 && (
        <div style={{ background:"#18181b",border:`1px solid ${totalAhorro>=0?"#4ade8044":"#f8717144"}`,borderRadius:13,padding:"15px",marginBottom:13 }}>
          <div style={{ color:"#a1a1aa",fontSize:10,fontWeight:700,letterSpacing:"0.06em",marginBottom:5 }}>{totalAhorro >= 0 ? "💰 AHORRO TOTAL ACUMULADO" : "⚠️ DÉFICIT TOTAL ACUMULADO"}</div>
          <div style={{ color:totalAhorro>=0?"#4ade80":"#f87171",fontSize:24,fontWeight:800,fontFamily:"'Syne',sans-serif" }}>{fmt(Math.abs(totalAhorro))}</div>
          <div style={{ color:"#52525b",fontSize:10,marginTop:3 }}>en {historial.length} {historial.length === 1 ? "mes" : "meses"} cerrados</div>
        </div>
      )}
      {historial.length === 0 ? (
        <div style={{ textAlign:"center",padding:"44px 20px",background:"#18181b",borderRadius:13,border:"1px solid #27272a" }}>
          <div style={{ fontSize:40,marginBottom:9 }}>🗂️</div>
          <div style={{ color:"#71717a",fontSize:14,marginBottom:5 }}>Sin historial todavía</div>
          <div style={{ color:"#52525b",fontSize:12 }}>Usa <strong style={{ color:"#818cf8" }}>&quot;Cerrar mes&quot;</strong> para guardar el mes actual</div>
        </div>
      ) : (
        historial.map(m => <ResumenMes key={m._uid || m.mes} mes={m} cats={cats}/>)
      )}
    </div>
  );
}

// ─── TAB EMAIL ────────────────────────────────────────────────────────────────
function TabEmail({ emailText, setEmailText, emailLoading, emailError, setEmailError, onParse, pendientes }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:13 }}>
      <div>
        <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:16,marginBottom:4 }}>📧 Pegar correo del banco</h2>
        <p style={{ color:"#71717a",fontSize:13,lineHeight:1.5 }}>La IA extrae los gastos y los deja como <strong style={{ color:"#fb923c" }}>pendientes</strong>. Tú los clasificas cuando quieras.</p>
      </div>
      <textarea value={emailText} onChange={e => { setEmailText(e.target.value); setEmailError(""); }}
        placeholder={"Pega aquí el correo del banco...\n\nEjemplo:\nHola Sebastián, se realizó un cargo de $1.890 en OK Market con tu tarjeta terminada en 1234.\nFecha: 01/06/2026"}
        rows={8} style={{ width:"100%",background:"#18181b",border:"1px solid #3f3f46",borderRadius:12,padding:"13px",color:"#f4f4f5",fontSize:13,resize:"vertical",outline:"none",lineHeight:1.6 }}/>
      <button onClick={onParse} disabled={emailLoading || !emailText.trim()} style={{ width:"100%",padding:13,borderRadius:12,border:"none",background:emailLoading||!emailText.trim()?"#27272a":"linear-gradient(135deg,#818cf8,#6366f1)",color:emailLoading||!emailText.trim()?"#52525b":"#fff",fontWeight:800,cursor:emailLoading||!emailText.trim()?"not-allowed":"pointer",fontSize:14,fontFamily:"'Syne',sans-serif",transition:"all 0.2s" }}>
        {emailLoading ? "⏳ Extrayendo gastos..." : "🔍 Detectar gastos con IA"}
      </button>
      {emailError && <div style={{ background:"#18181b",border:"1px solid #ef444455",borderRadius:12,padding:"13px 15px",color:"#f87171",fontSize:13 }}>⚠️ {emailError}</div>}
      <div style={{ background:"#18181b",border:"1px solid #27272a",borderRadius:12,padding:"13px 15px" }}>
        <div style={{ color:"#71717a",fontSize:12,lineHeight:1.6 }}>
          <strong style={{ color:"#a1a1aa" }}>¿Cómo funciona?</strong><br/>
          1. Pegas el correo → 2. IA detecta gastos → 3. Aparecen como <span style={{ color:"#fb923c" }}>pendientes</span> → 4. Tú los clasificas.
        </div>
      </div>
      {pendientes.length > 0 && (
        <div style={{ background:"#18181b",border:"1px solid #fb923c44",borderRadius:12,padding:"13px 15px" }}>
          <div style={{ color:"#fb923c",fontSize:11,fontWeight:700,marginBottom:8 }}>PENDIENTES ACTUALES ({pendientes.length})</div>
          {pendientes.map(p => (
            <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7 }}>
              <span style={{ color:"#a1a1aa",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,marginRight:8 }}>{p.nombre}</span>
              <span style={{ color:"#fb923c",fontWeight:700,fontSize:13,flexShrink:0 }}>{fmt(p.monto)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [st, setSt]         = useState(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab]       = useState("dashboard");

  const [showSueldo,  setShowSueldo]  = useState(false);
  const [showCerrar,  setShowCerrar]  = useState(false);
  const [deleteId,    setDeleteId]    = useState(null);
  const [clasificar,  setClasificar]  = useState(null);
  const [editCat,     setEditCat]     = useState(null);
  // MEJORA: gastoEditar unifica "nuevo gasto" y "editar gasto"
  const [gastoEditar, setGastoEditar] = useState(null); // null=cerrado, {}=nuevo, {id,...}=editar

  const [emailText,    setEmailText]    = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError,   setEmailError]   = useState("");

  // ── LOAD / SAVE ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadDB().then(d => {
      if (d) setSt(sanitizeState(d)); else setShowSueldo(true);
      setLoaded(true);
    });
  }, []);
  useEffect(() => { if (!loaded) return; saveDB(st); }, [st, loaded]);

  // ── ACCIONES ──────────────────────────────────────────────────────────────────
  const saveSueldo = useCallback(s => {
    setSt(p => ({ ...p, activo: { ...p.activo, sueldo: s } }));
    setShowSueldo(false);
  }, []);

  const handleAddSub = useCallback((cat, sub) => {
    setSt(p => ({ ...p, subcats: { ...p.subcats, [cat]: [...(p.subcats[cat]||[]), sub] } }));
  }, []);

  const handleDeleteSub = useCallback((cat, sub) => {
    setSt(p => ({ ...p, subcats: { ...p.subcats, [cat]: (p.subcats[cat]||[]).filter(s => s !== sub) } }));
  }, []);

  const handleSaveCat = useCallback((key, changes) => {
    setSt(p => ({ ...p, cats: { ...p.cats, [key]: { ...p.cats[key], ...changes } } }));
    setEditCat(null);
  }, []);

  // MEJORA: handleGastoSave soporta crear Y editar
  const handleGastoSave = useCallback(g => {
    setSt(p => {
      const gastos = [...p.activo.gastos];
      const idx = gastos.findIndex(x => x.id === g.id);
      if (idx > -1) {
        gastos[idx] = g; // editar existente
      } else {
        gastos.unshift(g); // nuevo al inicio
      }
      return { ...p, activo: { ...p.activo, gastos } };
    });
    setGastoEditar(null);
  }, []);

  const confirmarPendiente = useCallback(g => {
    const nuevo = { ...g, id: uid(), fecha: new Date().toLocaleDateString("es-CL") };
    setSt(p => ({
      ...p,
      activo:     { ...p.activo, gastos: [nuevo, ...p.activo.gastos] },
      pendientes: p.pendientes.filter(x => x.id !== g.id),
    }));
    setClasificar(null);
  }, []);

  const descartarPendiente = useCallback(id => {
    setSt(p => ({ ...p, pendientes: p.pendientes.filter(x => x.id !== id) }));
  }, []);

  const deleteGasto = useCallback(id => {
    setSt(p => ({ ...p, activo: { ...p.activo, gastos: p.activo.gastos.filter(g => g.id !== id) } }));
    setDeleteId(null);
  }, []);

  const cerrarMes = useCallback(() => {
    setSt(p => {
      if (p.historial.length > 0 && p.historial[0].mes === p.activo.mes) return p;
      return {
        historial:  [{ ...p.activo, _uid: uid() }, ...p.historial],
        activo:     { mes: currentMonth(), sueldo: 0, gastos: [] },
        pendientes: p.pendientes,
        subcats:    p.subcats,
        cats:       p.cats,
      };
    });
    setShowCerrar(false);
    setShowSueldo(true);
  }, []);

  // MEJORA: navegación por mes con flechas (del documento)
  const cambiarMes = useCallback(step => {
    setSt(p => {
      const nuevoMes = stepMonth(p.activo.mes, step);
      // Guardar mes actual en historial si tiene datos
      let hist = [...p.historial];
      if (p.activo.sueldo > 0 || p.activo.gastos.length > 0) {
        const existeIdx = hist.findIndex(h => h.mes === p.activo.mes);
        const snapshot = { ...p.activo, _uid: p.activo._uid || uid() };
        if (existeIdx > -1) hist[existeIdx] = snapshot;
        else hist = [snapshot, ...hist];
      }
      // Cargar el mes destino si existe en historial
      const archivado = hist.find(h => h.mes === nuevoMes);
      return {
        ...p,
        activo:    archivado ? { ...archivado } : { mes: nuevoMes, sueldo: 0, gastos: [] },
        historial: hist.filter(h => h.mes !== nuevoMes),
      };
    });
  }, []);

  // ── EMAIL ─────────────────────────────────────────────────────────────────────
  const parseEmail = async () => {
    if (!emailText.trim()) return;
    setEmailLoading(true);
    setEmailError("");
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // En claude.ai el artifact inyecta la autenticación automáticamente.
          // Si corres esto fuera de claude.ai, mueve el fetch a un servidor propio
          // y nunca pongas la API key en código frontend público.
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: `Extrae TODOS los gastos de un correo bancario chileno. Responde SOLO con JSON array sin backticks: [{"nombre":"nombre corto","monto":12345}]. Si no hay gasto claro: []`,
          messages: [{ role: "user", content: emailText }],
        }),
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Error de servidor (${res.status}). Intenta de nuevo.`);
      const json = await res.json();
      const text = (json.content || []).map(b => b.text || "").join("").trim();
      let arr;
      try { arr = JSON.parse(text); } catch { throw new Error("La IA no devolvió un formato válido."); }
      if (!Array.isArray(arr)) throw new Error("Respuesta inesperada. Intenta de nuevo.");
      if (arr.length === 0) {
        setEmailError("No se detectaron gastos en ese correo.");
      } else {
        const nuevos = arr
          .filter(g => g.nombre && typeof g.monto === "number" && g.monto > 0)
          .map(g => ({ nombre: String(g.nombre).slice(0, 80), monto: Math.round(g.monto), id: uid(), origen: "correo" }));
        if (nuevos.length === 0) setEmailError("Se detectaron gastos pero con datos inválidos.");
        else { setSt(p => ({ ...p, pendientes: [...p.pendientes, ...nuevos] })); setEmailText(""); setTab("dashboard"); }
      }
    } catch(e) {
      setEmailError(e.name === "AbortError" ? "Tiempo de espera agotado. Revisa tu conexión." : (e.message || "Error desconocido."));
    } finally {
      setEmailLoading(false);
    }
  };

  // ── DERIVADOS (useMemo para evitar recálculos innecesarios) ───────────────────
  const { activo, historial, pendientes, subcats, cats } = st;

  const total    = useMemo(() => activo.gastos.reduce((a, g) => a + g.monto, 0), [activo.gastos]);
  const restante = activo.sueldo - total;
  const pct      = activo.sueldo > 0 ? Math.min(100, (total / activo.sueldo) * 100) : 0;
  const pctColor = pct > 90 ? "#f87171" : pct > 70 ? "#fb923c" : "#4ade80";

  const catData = useMemo(() => CAT_KEYS.map(k => {
    const t = activo.gastos.filter(g => g.categoria === k).reduce((a, g) => a + g.monto, 0);
    return { k, total: t, pct: activo.sueldo > 0 ? Math.min(100, (t / activo.sueldo) * 100) : 0 };
  }).filter(x => x.total > 0), [activo.gastos, activo.sueldo]);

  const totalAhorro = useMemo(() =>
    historial.reduce((a, m) => { const g = m.gastos.reduce((x, y) => x + y.monto, 0); return a + (m.sueldo - g); }, 0),
    [historial]
  );

  const gastosOrdenados = useMemo(() =>
    CAT_KEYS.map(k => ({
      k,
      items: activo.gastos.filter(g => g.categoria === k).sort((a, b) => b.monto - a.monto),
    }))
    .filter(g => g.items.length > 0)
    .sort((a, b) => b.items.reduce((s, g) => s + g.monto, 0) - a.items.reduce((s, g) => s + g.monto, 0)),
    [activo.gastos]
  );

  if (!loaded) return (
    <div style={{ minHeight:"100vh",background:"#09090b",display:"flex",alignItems:"center",justifyContent:"center",color:"#4ade80",fontSize:32 }}>⏳</div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"#09090b",color:"#f4f4f5",fontFamily:"'DM Sans',sans-serif",maxWidth:"100vw",overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#3f3f46;border-radius:99px;}
        textarea,button{font-family:'DM Sans',sans-serif;}
      `}</style>

      {/* MODALS */}
      {showSueldo  && <SueldoSheet current={activo.sueldo} onSave={saveSueldo} onClose={() => setShowSueldo(false)}/>}
      {gastoEditar !== null && (
        <GastoSheet
          gastoEditar={Object.keys(gastoEditar).length > 0 ? gastoEditar : null}
          onSave={handleGastoSave}
          onAddSub={handleAddSub}
          onDeleteSub={handleDeleteSub}
          onClose={() => setGastoEditar(null)}
          subcats={subcats}
          cats={cats}
        />
      )}
      {showCerrar  && <CerrarSheet activo={activo} onConfirm={cerrarMes} onClose={() => setShowCerrar(false)}/>}
      {clasificar  && <ClasificarSheet pendiente={clasificar} onSave={confirmarPendiente} onClose={() => setClasificar(null)} cats={cats}/>}
      {editCat     && <EditCatSheet catKey={editCat.key} cat={editCat.cat} onSave={handleSaveCat} onClose={() => setEditCat(null)}/>}
      {deleteId    && (
        <Sheet onClose={() => setDeleteId(null)}>
          <h3 style={{ color:"#f4f4f5",fontFamily:"'Syne',sans-serif",marginBottom:8,fontSize:18 }}>¿Eliminar gasto?</h3>
          <p style={{ color:"#71717a",fontSize:14,marginBottom:22 }}>Esta acción no se puede deshacer.</p>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={() => setDeleteId(null)} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer" }}>Cancelar</button>
            <button onClick={() => deleteGasto(deleteId)} style={{ flex:1,padding:12,borderRadius:12,border:"none",background:"#ef4444",color:"#fff",fontWeight:700,cursor:"pointer" }}>Eliminar</button>
          </div>
        </Sheet>
      )}

      {/* HEADER — MEJORA: flechas de navegación de mes (del documento) */}
      <header style={{ padding:"13px 17px",borderBottom:"1px solid #1f1f23",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#09090b",zIndex:100 }}>
        <div>
          <h1 style={{ fontSize:15,fontFamily:"'Syne',sans-serif",fontWeight:800,letterSpacing:"-0.02em" }}>💸 ¿Dónde va mi sueldo?</h1>
          {/* Navegación de mes */}
          <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:2 }}>
            <button onClick={() => cambiarMes(-1)} style={{ background:"transparent",border:"none",color:"#52525b",cursor:"pointer",fontSize:12,padding:"0 2px",lineHeight:1 }}>◀</button>
            <span style={{ color:"#52525b",fontSize:11,fontWeight:600 }}>{monthLabel(activo.mes)}</span>
            <button onClick={() => cambiarMes(1)} style={{ background:"transparent",border:"none",color:"#52525b",cursor:"pointer",fontSize:12,padding:"0 2px",lineHeight:1 }}>▶</button>
          </div>
        </div>
        <div style={{ display:"flex",gap:7,alignItems:"center" }}>
          {pendientes.length > 0 && (
            <button onClick={() => setTab("dashboard")} style={{ padding:"6px 10px",borderRadius:10,border:"1px solid #fb923c55",background:"#fb923c18",color:"#fb923c",cursor:"pointer",fontSize:12,fontWeight:700 }}>⏳ {pendientes.length}</button>
          )}
          <button onClick={() => setShowSueldo(true)} style={{ padding:"6px 10px",borderRadius:10,border:"1px solid #3f3f46",background:"transparent",color:"#a1a1aa",cursor:"pointer",fontSize:12,whiteSpace:"nowrap" }}>
            ✏️ {activo.sueldo > 0 ? fmt(activo.sueldo) : "Sueldo"}
          </button>
          <button onClick={() => setGastoEditar({})} style={{ padding:"7px 13px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4ade80,#22c55e)",color:"#052e16",fontWeight:800,cursor:"pointer",fontSize:14,fontFamily:"'Syne',sans-serif" }}>+</button>
        </div>
      </header>

      {/* TABS */}
      <div style={{ display:"flex",borderBottom:"1px solid #1f1f23",padding:"0 17px",overflowX:"auto" }}>
        {[["dashboard","📊 Resumen"],["gastos","📋 Gastos"],["categorias","🎨 Categorías"],["historial","🗂️ Historial"],["email","📧 Correo"]].map(([k, lbl]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding:"11px 12px",background:"transparent",border:"none",color:tab===k?"#4ade80":"#71717a",cursor:"pointer",fontSize:12,borderBottom:`2px solid ${tab===k?"#4ade80":"transparent"}`,transition:"all 0.15s",whiteSpace:"nowrap" }}>{lbl}</button>
        ))}
      </div>

      <main style={{ padding:"17px",maxWidth:600,margin:"0 auto" }}>
        {tab === "dashboard" && (
          <TabDashboard activo={activo} pendientes={pendientes} cats={cats} catData={catData}
            total={total} restante={restante} pct={pct} pctColor={pctColor}
            onShowSueldo={() => setShowSueldo(true)} onClasificar={setClasificar}
            onDescartar={descartarPendiente} onCerrar={() => setShowCerrar(true)}/>
        )}
        {tab === "gastos" && (
          <TabGastos gastosOrdenados={gastosOrdenados} total={total} cats={cats}
            onDelete={setDeleteId} onEdit={g => setGastoEditar(g)}/>
        )}
        {tab === "categorias" && <TabCategorias cats={cats} onEdit={setEditCat}/>}
        {tab === "historial"  && <TabHistorial historial={historial} totalAhorro={totalAhorro} cats={cats}/>}
        {tab === "email"      && (
          <TabEmail emailText={emailText} setEmailText={setEmailText}
            emailLoading={emailLoading} emailError={emailError} setEmailError={setEmailError}
            onParse={parseEmail} pendientes={pendientes}/>
        )}
      </main>
    </div>
  );
}
