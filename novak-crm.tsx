import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const STORAGE_KEYS = { leads: "novak_leads2", asesores: "novak_asesores2", etapas: "novak_etapas2" };
async function load(key, fallback) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : fallback; } catch { return fallback; }
}
async function save(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)); } catch {}
}

const DEFAULT_ASESORES = [
  { id: 1, nombre: "Carlos Mendoza", telefono: "3001111111", email: "carlos@novak.com", activo: true },
  { id: 2, nombre: "Ana Reyes",      telefono: "3002222222", email: "ana@novak.com",    activo: true },
  { id: 3, nombre: "Luis Torres",    telefono: "3003333333", email: "luis@novak.com",   activo: true },
];
const DEFAULT_ETAPAS = ["Nuevo", "Contactado", "Interesado", "Negociación", "Cerrado", "Perdido"];
const DEFAULT_LEADS = [
  { id: 101, nombre: "Jorge Ramírez",   telefono: "3101234567", email: "jorge@email.com", interes: "Casa",        presupuesto: "250000000", fuente: "Redes Sociales", asesorId: 1, etapa: "Interesado",  fecha: "2026-05-20", notas: "Busca casa con jardín zona norte.", fechaInscripcion: "2026-05-21", fechaFirma: "", fechaPago: "" },
  { id: 102, nombre: "Patricia Lozano", telefono: "3209876543", email: "pat@email.com",   interes: "Apartamento", presupuesto: "180000000", fuente: "Referido",       asesorId: 2, etapa: "Negociación", fecha: "2026-05-22", notas: "Piso 3 o superior.",           fechaInscripcion: "2026-05-23", fechaFirma: "2026-05-25", fechaPago: "" },
  { id: 103, nombre: "Andrés Castillo", telefono: "3055551234", email: "",                interes: "Lote",        presupuesto: "120000000", fuente: "Página Web",     asesorId: 3, etapa: "Nuevo",       fecha: "2026-05-28", notas: "",                            fechaInscripcion: "", fechaFirma: "", fechaPago: "" },
];

const INTERESES = ["Casa", "Apartamento", "Local Comercial", "Lote", "Oficina", "Bodega"];
const FUENTES   = ["Redes Sociales", "Referido", "Página Web", "Llamada", "Visita presencial", "Feria", "Otro"];
const ETAPA_COLOR = { "Nuevo":"#FFC107","Contactado":"#3B82F6","Interesado":"#8B5CF6","Negociación":"#F97316","Cerrado":"#22C55E","Perdido":"#EF4444" };
const PIE_COLORS  = ["#FFC107","#3B82F6","#8B5CF6","#F97316","#22C55E","#EF4444","#14B8A6","#EC4899"];

function fmtCOP(v) { const n=parseInt((v||"").toString().replace(/\D/g,""),10); return isNaN(n)?"":n.toLocaleString("es-CO"); }
function fmtFecha(iso) { if(!iso) return "—"; const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; }
function uid() { return Date.now()+Math.random(); }

const T   = { fontFamily:"'Outfit',sans-serif" };
const card= { background:"#181818", border:"1px solid #272727", borderRadius:14 };
const inputSt = (err) => ({ width:"100%", boxSizing:"border-box", background:"#111", border:`1.5px solid ${err?"#EF4444":"#2a2a2a"}`, borderRadius:9, padding:"10px 14px", color:"#fff", fontSize:13, outline:"none", fontFamily:"'Outfit',sans-serif" });
const selSt   = { width:"100%", boxSizing:"border-box", background:"#111", border:"1.5px solid #2a2a2a", borderRadius:9, padding:"10px 14px", color:"#ccc", fontSize:13, outline:"none", fontFamily:"'Outfit',sans-serif" };
const lbl     = { display:"block", fontSize:10, color:"#555", letterSpacing:1.2, marginBottom:5, fontWeight:600 };

const Pill = ({ text }) => (
  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:(ETAPA_COLOR[text]||"#888")+"22", color:ETAPA_COLOR[text]||"#888", letterSpacing:0.3 }}>{text}</span>
);

const CheckDate = ({ label, fecha }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
    <div style={{ width:20, height:20, borderRadius:"50%", background: fecha?"#22C55E18":"#33333366", border:`2px solid ${fecha?"#22C55E":"#333"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      {fecha && <span style={{ color:"#22C55E", fontSize:11, fontWeight:900 }}>✓</span>}
    </div>
    <div>
      <div style={{ fontSize:10, color:"#555", letterSpacing:0.8 }}>{label}</div>
      <div style={{ fontSize:12, fontWeight:600, color: fecha?"#22C55E":"#444" }}>{fecha ? fmtFecha(fecha) : "Pendiente"}</div>
    </div>
  </div>
);

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#000000cc", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ ...card, width:"100%", maxWidth:580, maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:"1px solid #222" }}>
          <div style={{ fontWeight:800, fontSize:16, color:"#FFC107" }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:22, lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab]           = useState("leads");
  const [leads, setLeads]       = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [etapas, setEtapas]     = useState(DEFAULT_ETAPAS);
  const [ready, setReady]       = useState(false);
  const [busq, setBusq]         = useState("");
  const [fAsesor, setFAsesor]   = useState("Todos");
  const [fEtapa, setFEtapa]     = useState("Todas");
  const [modalLead, setModalLead]     = useState(null);
  const [modalAsesor, setModalAsesor] = useState(null);
  const [detalleLead, setDetalleLead] = useState(null);

  useEffect(() => {
    (async () => {
      const [l,a,e] = await Promise.all([
        load(STORAGE_KEYS.leads, DEFAULT_LEADS),
        load(STORAGE_KEYS.asesores, DEFAULT_ASESORES),
        load(STORAGE_KEYS.etapas, DEFAULT_ETAPAS),
      ]);
      setLeads(l); setAsesores(a); setEtapas(e); setReady(true);
    })();
  }, []);

  useEffect(() => { if (ready) save(STORAGE_KEYS.leads, leads); }, [leads, ready]);
  useEffect(() => { if (ready) save(STORAGE_KEYS.asesores, asesores); }, [asesores, ready]);
  useEffect(() => { if (ready) save(STORAGE_KEYS.etapas, etapas); }, [etapas, ready]);

  const saveLead = (lead) => {
    if (lead.id) setLeads(p => p.map(l => l.id===lead.id ? lead : l));
    else setLeads(p => [...p, { ...lead, id: uid() }]);
    setModalLead(null);
  };
  const deleteLead = (id) => { if(confirm("¿Eliminar este cliente?")) { setLeads(p=>p.filter(l=>l.id!==id)); setDetalleLead(null); } };
  const setEtapaLead = (id, etapa) => {
    setLeads(p => p.map(l => l.id===id ? {...l,etapa} : l));
    setDetalleLead(p => p ? {...p,etapa} : p);
  };
  const saveAsesor = (a) => {
    if (a.id) setAsesores(p => p.map(x => x.id===a.id ? a : x));
    else setAsesores(p => [...p, { ...a, id: uid(), activo: true }]);
    setModalAsesor(null);
  };
  const toggleAsesor = (id) => setAsesores(p => p.map(a => a.id===id ? {...a,activo:!a.activo} : a));
  const deleteAsesor = (id) => { if(confirm("¿Eliminar asesor?")) { setAsesores(p=>p.filter(a=>a.id!==id)); setLeads(p=>p.map(l=>l.asesorId===id?{...l,asesorId:null}:l)); } };

  const leadsFiltrados = useMemo(() => leads.filter(l => {
    if (fAsesor!=="Todos" && String(l.asesorId)!==fAsesor) return false;
    if (fEtapa!=="Todas" && l.etapa!==fEtapa) return false;
    if (busq) { const b=busq.toLowerCase(); return l.nombre?.toLowerCase().includes(b)||l.telefono?.includes(b)||l.email?.toLowerCase().includes(b); }
    return true;
  }), [leads,fAsesor,fEtapa,busq]);

  const stats = useMemo(() => {
    const total    = leads.length;
    const cerrados = leads.filter(l=>l.etapa==="Cerrado").length;
    const nuevos   = leads.filter(l=>l.etapa==="Nuevo").length;
    const proceso  = leads.filter(l=>["Contactado","Interesado","Negociación"].includes(l.etapa)).length;
    const conInscripcion = leads.filter(l=>l.fechaInscripcion).length;
    const conFirma       = leads.filter(l=>l.fechaFirma).length;
    const conPago        = leads.filter(l=>l.fechaPago).length;
    const tasa = total ? Math.round(cerrados/total*100) : 0;
    return { total, cerrados, nuevos, proceso, tasa, conInscripcion, conFirma, conPago };
  }, [leads]);

  const etapaData  = useMemo(() => etapas.map(e=>({ name:e, value:leads.filter(l=>l.etapa===e).length })).filter(x=>x.value>0), [leads,etapas]);
  const asesorData = useMemo(() => asesores.filter(a=>a.activo).map(a=>({ name:a.nombre.split(" ")[0], leads:leads.filter(l=>l.asesorId===a.id).length, cerrados:leads.filter(l=>l.asesorId===a.id&&l.etapa==="Cerrado").length })), [leads,asesores]);
  const fuenteData = useMemo(() => { const m={}; leads.forEach(l=>{ if(l.fuente) m[l.fuente]=(m[l.fuente]||0)+1; }); return Object.entries(m).map(([name,value])=>({name,value})); }, [leads]);

  const getAsesor = (id) => asesores.find(a=>a.id===id);

  if (!ready) return <div style={{...T,background:"#111",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFC107",fontSize:15}}>Cargando CRM Novak…</div>;

  return (
    <div style={{ ...T, background:"#111", minHeight:"100vh", color:"#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{ display:"flex", minHeight:"100vh" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width:220, background:"#141414", borderRight:"1px solid #1e1e1e", display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid #1e1e1e" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:38, height:38, background:"#FFC107", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#111", fontSize:18 }}>N</div>
              <div>
                <div style={{ fontWeight:900, fontSize:14, letterSpacing:3, color:"#fff" }}>NOVAK</div>
                <div style={{ fontSize:8, color:"#444", letterSpacing:2 }}>CRM INMOBILIARIO</div>
              </div>
            </div>
          </div>
          <nav style={{ flex:1, padding:"16px 12px" }}>
            {[{id:"leads",icon:"◈",label:"Clientes"},{id:"asesores",icon:"◉",label:"Asesores"},{id:"reportes",icon:"◎",label:"Reportes"}].map(n=>(
              <button key={n.id} onClick={()=>setTab(n.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderRadius:10, border:"none", cursor:"pointer", marginBottom:4, fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, transition:"all 0.15s", background:tab===n.id?"#FFC10718":"transparent", color:tab===n.id?"#FFC107":"#555", borderLeft:tab===n.id?"3px solid #FFC107":"3px solid transparent" }}>
                <span style={{ fontSize:16 }}>{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>
          <div style={{ padding:"16px 16px 24px", borderTop:"1px solid #1e1e1e" }}>
            <div style={{ fontSize:10, color:"#444", letterSpacing:1, marginBottom:10 }}>RESUMEN</div>
            {[{label:"Total clientes",v:stats.total,c:"#FFC107"},{label:"En proceso",v:stats.proceso,c:"#8B5CF6"},{label:"Tasa cierre",v:stats.tasa+"%",c:"#22C55E"}].map(s=>(
              <div key={s.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                <span style={{ fontSize:11, color:"#555" }}>{s.label}</span>
                <span style={{ fontSize:11, fontWeight:800, color:s.c }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex:1, overflowY:"auto" }}>

          {/* ══ LEADS ══ */}
          {tab==="leads" && (
            <div style={{ padding:28 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
                <div>
                  <h1 style={{ margin:0, fontWeight:900, fontSize:22 }}>Clientes Potenciales</h1>
                  <p style={{ margin:"4px 0 0", color:"#555", fontSize:13 }}>{leads.length} clientes registrados</p>
                </div>
                <button onClick={()=>setModalLead("nuevo")} style={{ background:"#FFC107", color:"#111", fontWeight:800, border:"none", borderRadius:10, padding:"11px 22px", cursor:"pointer", fontSize:13, letterSpacing:0.5 }}>+ Nuevo Cliente</button>
              </div>

              {/* Stats cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
                {[{label:"TOTAL",v:stats.total,c:"#FFC107"},{label:"NUEVOS",v:stats.nuevos,c:"#3B82F6"},{label:"EN PROCESO",v:stats.proceso,c:"#8B5CF6"},{label:"CERRADOS",v:stats.cerrados,c:"#22C55E"}].map(s=>(
                  <div key={s.label} style={{ ...card, padding:"16px 20px", borderTop:`3px solid ${s.c}` }}>
                    <div style={{ fontSize:30, fontWeight:900, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:10, color:"#444", letterSpacing:1.5, marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Pipeline cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { label:"CON INSCRIPCIÓN", v:stats.conInscripcion, total:stats.total, c:"#3B82F6", icon:"📋" },
                  { label:"FIRMA DE CONTRATO", v:stats.conFirma, total:stats.total, c:"#8B5CF6", icon:"✍️" },
                  { label:"PAGO REALIZADO", v:stats.conPago, total:stats.total, c:"#22C55E", icon:"💰" },
                ].map(s=>(
                  <div key={s.label} style={{ ...card, padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ fontSize:24 }}>{s.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                        <span style={{ fontSize:22, fontWeight:900, color:s.c }}>{s.v}</span>
                        <span style={{ fontSize:12, color:"#444" }}>/ {s.total}</span>
                      </div>
                      <div style={{ fontSize:9, color:"#444", letterSpacing:1.2 }}>{s.label}</div>
                      <div style={{ marginTop:6, height:4, borderRadius:4, background:"#222", overflow:"hidden" }}>
                        <div style={{ height:"100%", borderRadius:4, background:s.c, width: s.total ? `${Math.round(s.v/s.total*100)}%` : "0%" }}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filtros */}
              <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="🔍  Buscar nombre, teléfono, email..."
                  style={{ flex:1, minWidth:180, background:"#181818", border:"1px solid #252525", borderRadius:9, padding:"9px 14px", color:"#fff", fontSize:13, outline:"none", fontFamily:"'Outfit',sans-serif" }}/>
                <select value={fAsesor} onChange={e=>setFAsesor(e.target.value)} style={{ ...selSt, width:"auto" }}>
                  <option value="Todos">Todos los asesores</option>
                  {asesores.filter(a=>a.activo).map(a=><option key={a.id} value={String(a.id)}>{a.nombre}</option>)}
                </select>
                <select value={fEtapa} onChange={e=>setFEtapa(e.target.value)} style={{ ...selSt, width:"auto" }}>
                  <option value="Todas">Todas las etapas</option>
                  {etapas.map(e=><option key={e}>{e}</option>)}
                </select>
              </div>

              {/* Lista */}
              {leadsFiltrados.length===0 ? (
                <div style={{ textAlign:"center", padding:60, color:"#333" }}><div style={{ fontSize:48 }}>📋</div><div style={{ marginTop:12,fontSize:14 }}>Sin resultados</div></div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {leadsFiltrados.map(lead => {
                    const asesor = getAsesor(lead.asesorId);
                    const steps  = [lead.fechaInscripcion, lead.fechaFirma, lead.fechaPago];
                    const done   = steps.filter(Boolean).length;
                    return (
                      <div key={lead.id}
                        onClick={()=>setDetalleLead(lead)}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="#FFC10755"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="#272727"}
                        style={{ ...card, padding:"14px 20px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, transition:"border-color 0.15s" }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", background:"#FFC10718", border:"2px solid #FFC10766", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#FFC107", fontSize:15, flexShrink:0 }}>
                          {(lead.nombre||"?").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14 }}>{lead.nombre}</div>
                          <div style={{ fontSize:11, color:"#555", marginTop:2 }}>{lead.telefono}{asesor?" · "+asesor.nombre:""}</div>
                        </div>
                        {/* mini pipeline */}
                        <div style={{ display:"flex", gap:4, alignItems:"center", flexShrink:0 }}>
                          {["Ins","Firma","Pago"].map((s,i)=>(
                            <div key={s} title={s} style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${steps[i]?"#22C55E":"#333"}`, background:steps[i]?"#22C55E18":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:9, color:steps[i]?"#22C55E":"#444", fontWeight:700 }}>{steps[i]?"✓":i+1}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                          <span style={{ fontSize:11, background:"#222", borderRadius:6, padding:"3px 8px", color:"#777" }}>{lead.interes}</span>
                          <Pill text={lead.etapa}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ ASESORES ══ */}
          {tab==="asesores" && (
            <div style={{ padding:28 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
                <div>
                  <h1 style={{ margin:0, fontWeight:900, fontSize:22 }}>Equipo de Asesores</h1>
                  <p style={{ margin:"4px 0 0", color:"#555", fontSize:13 }}>{asesores.filter(a=>a.activo).length} activos · {asesores.length} total</p>
                </div>
                <button onClick={()=>setModalAsesor("nuevo")} style={{ background:"#FFC107", color:"#111", fontWeight:800, border:"none", borderRadius:10, padding:"11px 22px", cursor:"pointer", fontSize:13 }}>+ Agregar Asesor</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                {asesores.map(a => {
                  const aLeads    = leads.filter(l=>l.asesorId===a.id);
                  const aCerrados = aLeads.filter(l=>l.etapa==="Cerrado").length;
                  const aFirmas   = aLeads.filter(l=>l.fechaFirma).length;
                  return (
                    <div key={a.id} style={{ ...card, padding:20, opacity:a.activo?1:0.5 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                        <div style={{ width:46, height:46, borderRadius:"50%", background:a.activo?"#FFC10718":"#33333322", border:`2px solid ${a.activo?"#FFC107":"#444"}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:a.activo?"#FFC107":"#666", fontSize:18 }}>
                          {a.nombre.charAt(0)}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:14 }}>{a.nombre}</div>
                          <div style={{ fontSize:11, color:"#555" }}>{a.email||a.telefono}</div>
                        </div>
                        <span style={{ fontSize:10, padding:"3px 8px", borderRadius:20, background:a.activo?"#22C55E18":"#EF444418", color:a.activo?"#22C55E":"#EF4444", fontWeight:700 }}>{a.activo?"Activo":"Inactivo"}</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", marginBottom:14, borderTop:"1px solid #222", paddingTop:12 }}>
                        {[{l:"Leads",v:aLeads.length,c:"#FFC107"},{l:"Firmas",v:aFirmas,c:"#8B5CF6"},{l:"Cerrados",v:aCerrados,c:"#22C55E"}].map(s=>(
                          <div key={s.l} style={{ textAlign:"center" }}>
                            <div style={{ fontWeight:800, fontSize:20, color:s.c }}>{s.v}</div>
                            <div style={{ fontSize:10, color:"#555" }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>setModalAsesor(a)} style={{ flex:1, background:"#222", color:"#FFC107", fontWeight:700, border:"none", borderRadius:8, padding:"8px", cursor:"pointer", fontSize:12, fontFamily:"'Outfit',sans-serif" }}>Editar</button>
                        <button onClick={()=>toggleAsesor(a.id)} style={{ flex:1, background:"#222", color:a.activo?"#EF4444":"#22C55E", fontWeight:700, border:"none", borderRadius:8, padding:"8px", cursor:"pointer", fontSize:12, fontFamily:"'Outfit',sans-serif" }}>{a.activo?"Desactivar":"Activar"}</button>
                        <button onClick={()=>deleteAsesor(a.id)} style={{ background:"#EF444418", color:"#EF4444", fontWeight:700, border:"none", borderRadius:8, padding:"8px 10px", cursor:"pointer", fontSize:12, fontFamily:"'Outfit',sans-serif" }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ REPORTES ══ */}
          {tab==="reportes" && (
            <div style={{ padding:28 }}>
              <h1 style={{ margin:"0 0 8px", fontWeight:900, fontSize:22 }}>Reportes y Estadísticas</h1>
              <p style={{ margin:"0 0 24px", color:"#555", fontSize:13 }}>Visión general del desempeño del equipo</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                {[{label:"LEADS TOTALES",v:stats.total,c:"#FFC107",sub:"registrados"},{label:"EN PROCESO",v:stats.proceso,c:"#8B5CF6",sub:"activos"},{label:"TASA DE CIERRE",v:stats.tasa+"%",c:"#22C55E",sub:"efectividad"},{label:"ASESORES ACTIVOS",v:asesores.filter(a=>a.activo).length,c:"#3B82F6",sub:"en equipo"}].map(s=>(
                  <div key={s.label} style={{ ...card, padding:"18px 20px", borderTop:`3px solid ${s.c}` }}>
                    <div style={{ fontSize:32, fontWeight:900, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:9, color:"#444", letterSpacing:1.5 }}>{s.label}</div>
                    <div style={{ fontSize:11, color:"#333", marginTop:2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Pipeline stats */}
              <div style={{ ...card, padding:20, marginBottom:20 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:16, color:"#FFC107" }}>Embudo de conversión</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                  {[{label:"Inscripción",v:stats.conInscripcion,c:"#3B82F6"},{label:"Firma de contrato",v:stats.conFirma,c:"#8B5CF6"},{label:"Pago",v:stats.conPago,c:"#22C55E"}].map(s=>(
                    <div key={s.label}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:12, color:"#888" }}>{s.label}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:s.c }}>{s.v}<span style={{ color:"#444", fontWeight:400 }}>/{stats.total}</span></span>
                      </div>
                      <div style={{ height:8, borderRadius:8, background:"#222" }}>
                        <div style={{ height:"100%", borderRadius:8, background:s.c, width:stats.total?`${Math.round(s.v/stats.total*100)}%`:"0%", transition:"width 0.5s" }}/>
                      </div>
                      <div style={{ fontSize:10, color:"#444", marginTop:4 }}>{stats.total?Math.round(s.v/stats.total*100):0}% del total</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                <div style={{ ...card, padding:20 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:16, color:"#FFC107" }}>Leads por etapa</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={etapaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {etapaData.map((e,i)=><Cell key={i} fill={ETAPA_COLOR[e.name]||PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, color:"#fff", fontSize:12 }}/>
                      <Legend iconSize={10} wrapperStyle={{ fontSize:11, color:"#777" }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ ...card, padding:20 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:16, color:"#FFC107" }}>Fuente de leads</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={fuenteData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {fuenteData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, color:"#fff", fontSize:12 }}/>
                      <Legend iconSize={10} wrapperStyle={{ fontSize:11, color:"#777" }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ ...card, padding:20 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:16, color:"#FFC107" }}>Leads y cierres por asesor</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={asesorData} barCategoryGap="30%">
                    <XAxis dataKey="name" tick={{ fill:"#555", fontSize:12 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:"#444", fontSize:11 }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:8, color:"#fff", fontSize:12 }}/>
                    <Bar dataKey="leads" name="Leads" fill="#FFC107" radius={[6,6,0,0]}/>
                    <Bar dataKey="cerrados" name="Cerrados" fill="#22C55E" radius={[6,6,0,0]}/>
                    <Legend iconSize={10} wrapperStyle={{ fontSize:11, color:"#777" }}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ DETALLE LEAD ══ */}
      {detalleLead && (() => {
        const lead   = leads.find(l=>l.id===detalleLead.id) || detalleLead;
        const asesor = getAsesor(lead.asesorId);
        return (
          <Modal title="Detalle del Cliente" onClose={()=>setDetalleLead(null)}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20, padding:16, background:"#FFC10710", borderRadius:10, border:"1px solid #FFC10722" }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:"#FFC10722", border:"2px solid #FFC107", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#FFC107", fontSize:22 }}>
                {(lead.nombre||"?").charAt(0)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:17 }}>{lead.nombre}</div>
                <div style={{ fontSize:12, color:"#666", marginTop:2 }}>Registrado: {fmtFecha(lead.fecha)} · <span style={{ color:ETAPA_COLOR[lead.etapa]||"#888" }}>{lead.etapa}</span></div>
              </div>
            </div>

            {/* Info general */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {[{l:"Teléfono",v:lead.telefono},{l:"Email",v:lead.email||"—"},{l:"Interés",v:lead.interes},{l:"Presupuesto",v:lead.presupuesto?`$${fmtCOP(lead.presupuesto)}`:"—"},{l:"Fuente",v:lead.fuente},{l:"Asesor",v:asesor?.nombre||"Sin asignar"}].map(f=>(
                <div key={f.l} style={{ background:"#111", borderRadius:8, padding:"10px 14px" }}>
                  <div style={{ ...lbl }}>{f.l}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#ccc" }}>{f.v}</div>
                </div>
              ))}
            </div>

            {/* Pipeline de fechas */}
            <div style={{ background:"#111", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
              <div style={{ ...lbl, marginBottom:12 }}>PIPELINE DE PROCESO</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <CheckDate label="INSCRIPCIÓN"       fecha={lead.fechaInscripcion}/>
                <CheckDate label="FIRMA CONTRATO"    fecha={lead.fechaFirma}/>
                <CheckDate label="PAGO"              fecha={lead.fechaPago}/>
              </div>
            </div>

            {lead.notas && (
              <div style={{ background:"#111", borderRadius:8, padding:"12px 14px", marginBottom:16 }}>
                <div style={{ ...lbl }}>NOTAS</div>
                <div style={{ fontSize:13, color:"#bbb", lineHeight:1.6 }}>{lead.notas}</div>
              </div>
            )}

            {/* Cambiar etapa */}
            <div style={{ marginBottom:20 }}>
              <div style={{ ...lbl, marginBottom:8 }}>CAMBIAR ESTATUS</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {etapas.map(e=>(
                  <button key={e} onClick={()=>setEtapaLead(lead.id,e)}
                    style={{ fontSize:12, fontWeight:700, padding:"5px 12px", borderRadius:20, border:`2px solid ${lead.etapa===e?ETAPA_COLOR[e]:"#333"}`, background:lead.etapa===e?ETAPA_COLOR[e]+"22":"transparent", color:lead.etapa===e?ETAPA_COLOR[e]:"#555", cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{ setDetalleLead(null); setModalLead(lead); }} style={{ flex:1, background:"#FFC107", color:"#111", fontWeight:800, border:"none", borderRadius:9, padding:12, cursor:"pointer", fontSize:13, fontFamily:"'Outfit',sans-serif" }}>✏️ Editar</button>
              <button onClick={()=>deleteLead(lead.id)} style={{ background:"#EF444418", color:"#EF4444", fontWeight:700, border:"1px solid #EF444433", borderRadius:9, padding:"12px 16px", cursor:"pointer", fontSize:13, fontFamily:"'Outfit',sans-serif" }}>Eliminar</button>
            </div>
          </Modal>
        );
      })()}

      {/* ══ FORM LEAD ══ */}
      {modalLead && <LeadForm lead={modalLead==="nuevo"?null:modalLead} asesores={asesores} etapas={etapas} onSave={saveLead} onClose={()=>setModalLead(null)}/>}

      {/* ══ FORM ASESOR ══ */}
      {modalAsesor && <AsesorForm asesor={modalAsesor==="nuevo"?null:modalAsesor} onSave={saveAsesor} onClose={()=>setModalAsesor(null)}/>}
    </div>
  );
}

/* ════ FORM LEAD ════ */
function LeadForm({ lead, asesores, etapas, onSave, onClose }) {
  const blank = { nombre:"", telefono:"", email:"", interes:"Casa", presupuesto:"", fuente:"Redes Sociales", asesorId: asesores[0]?.id||null, etapa:"Nuevo", fecha: new Date().toISOString().slice(0,10), notas:"", fechaInscripcion:"", fechaFirma:"", fechaPago:"" };
  const [f, setF] = useState(lead ? { ...blank, ...lead } : blank);
  const [err, setErr] = useState({});

  function submit() {
    const e = {};
    if (!f.nombre?.trim()) e.nombre = "Requerido";
    if (!f.telefono?.trim()) e.telefono = "Requerido";
    if (f.email && !/\S+@\S+\.\S+/.test(f.email)) e.email = "Email inválido";
    if (Object.keys(e).length) { setErr(e); return; }
    onSave(f);
  }

  const Row2 = ({ children }) => <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>{children}</div>;
  const F = ({ label, error, children }) => <div><label style={lbl}>{label}</label>{children}{error&&<div style={{ color:"#EF4444",fontSize:11,marginTop:3 }}>{error}</div>}</div>;

  return (
    <Modal title={lead?"Editar Cliente":"Nuevo Cliente"} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <F label="NOMBRE COMPLETO *" error={err.nombre}>
          <input value={f.nombre} onChange={e=>setF({...f,nombre:e.target.value})} placeholder="Juan Pérez" style={inputSt(err.nombre)}/>
        </F>
        <Row2>
          <F label="TELÉFONO *" error={err.telefono}>
            <input value={f.telefono} onChange={e=>setF({...f,telefono:e.target.value})} placeholder="300 000 0000" style={inputSt(err.telefono)}/>
          </F>
          <F label="EMAIL" error={err.email}>
            <input value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="correo@email.com" style={inputSt(err.email)}/>
          </F>
        </Row2>
        <Row2>
          <F label="TIPO DE INMUEBLE">
            <select value={f.interes} onChange={e=>setF({...f,interes:e.target.value})} style={selSt}>
              {["Casa","Apartamento","Local Comercial","Lote","Oficina","Bodega"].map(i=><option key={i}>{i}</option>)}
            </select>
          </F>
          <F label="PRESUPUESTO (COP)">
            <input value={f.presupuesto} onChange={e=>setF({...f,presupuesto:e.target.value.replace(/\D/g,"")})} placeholder="250000000" style={inputSt(false)}/>
          </F>
        </Row2>
        <Row2>
          <F label="FUENTE">
            <select value={f.fuente} onChange={e=>setF({...f,fuente:e.target.value})} style={selSt}>
              {["Redes Sociales","Referido","Página Web","Llamada","Visita presencial","Feria","Otro"].map(x=><option key={x}>{x}</option>)}
            </select>
          </F>
          <F label="ASESOR ASIGNADO">
            <select value={f.asesorId||""} onChange={e=>setF({...f,asesorId:Number(e.target.value)||null})} style={selSt}>
              <option value="">Sin asignar</option>
              {asesores.filter(a=>a.activo).map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </F>
        </Row2>
        <Row2>
          <F label="ESTATUS">
            <select value={f.etapa} onChange={e=>setF({...f,etapa:e.target.value})} style={selSt}>
              {etapas.map(e=><option key={e}>{e}</option>)}
            </select>
          </F>
          <F label="FECHA DE CONTACTO">
            <input type="date" value={f.fecha} onChange={e=>setF({...f,fecha:e.target.value})} style={selSt}/>
          </F>
        </Row2>

        {/* Separador pipeline */}
        <div style={{ borderTop:"1px solid #222", paddingTop:14 }}>
          <div style={{ fontSize:10, color:"#FFC107", letterSpacing:1.5, fontWeight:700, marginBottom:12 }}>📋 PIPELINE DE PROCESO</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            <F label="FECHA INSCRIPCIÓN">
              <input type="date" value={f.fechaInscripcion||""} onChange={e=>setF({...f,fechaInscripcion:e.target.value})} style={selSt}/>
            </F>
            <F label="FECHA FIRMA CONTRATO">
              <input type="date" value={f.fechaFirma||""} onChange={e=>setF({...f,fechaFirma:e.target.value})} style={selSt}/>
            </F>
            <F label="FECHA PAGO">
              <input type="date" value={f.fechaPago||""} onChange={e=>setF({...f,fechaPago:e.target.value})} style={selSt}/>
            </F>
          </div>
        </div>

        <F label="NOTAS">
          <textarea value={f.notas} onChange={e=>setF({...f,notas:e.target.value})} rows={3} placeholder="Observaciones, preferencias..." style={{ ...inputSt(false), resize:"vertical", fontFamily:"'Outfit',sans-serif" }}/>
        </F>
        <button onClick={submit} style={{ background:"#FFC107", color:"#111", fontWeight:800, border:"none", borderRadius:10, padding:14, cursor:"pointer", fontSize:15, fontFamily:"'Outfit',sans-serif", marginTop:4 }}>
          {lead?"Guardar cambios":"Registrar Cliente"}
        </button>
      </div>
    </Modal>
  );
}

/* ════ FORM ASESOR ════ */
function AsesorForm({ asesor, onSave, onClose }) {
  const [f, setF] = useState(asesor ? { ...asesor } : { nombre:"", telefono:"", email:"" });
  const [err, setErr] = useState({});
  function submit() {
    const e = {};
    if (!f.nombre?.trim()) e.nombre = "Requerido";
    if (Object.keys(e).length) { setErr(e); return; }
    onSave(f);
  }
  return (
    <Modal title={asesor?"Editar Asesor":"Nuevo Asesor"} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div><label style={lbl}>NOMBRE COMPLETO *</label>
          <input value={f.nombre} onChange={e=>setF({...f,nombre:e.target.value})} placeholder="Nombre del asesor" style={inputSt(err.nombre)}/>
          {err.nombre&&<div style={{ color:"#EF4444",fontSize:11,marginTop:3 }}>{err.nombre}</div>}
        </div>
        <div><label style={lbl}>TELÉFONO</label><input value={f.telefono} onChange={e=>setF({...f,telefono:e.target.value})} placeholder="300 000 0000" style={inputSt(false)}/></div>
        <div><label style={lbl}>EMAIL</label><input value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="asesor@novak.com" style={inputSt(false)}/></div>
        <button onClick={submit} style={{ background:"#FFC107", color:"#111", fontWeight:800, border:"none", borderRadius:10, padding:14, cursor:"pointer", fontSize:15, fontFamily:"'Outfit',sans-serif", marginTop:4 }}>
          {asesor?"Guardar cambios":"Agregar Asesor"}
        </button>
      </div>
    </Modal>
  );
}
