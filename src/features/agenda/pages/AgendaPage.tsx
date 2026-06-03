"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  Plus, 
  X, 
  Trash2, 
  CheckCircle2 
} from "lucide-react";

import { listPacientes, type Paciente } from "../../pacientes/services/pacientes.api";
import {
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../../agenda/services/appointments.api";

import ConfirmDialog from "../../../shared/components/ConfirmDialog";

// ======================================================================
// 🟦 COMPONENTES AUXILIARES
// ======================================================================
function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
    >
      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      <span>{message}</span>
    </motion.div>
  );
}

function formatearFecha(d: Date) {
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function estadoColor(status: string) {
  switch (status) {
    case "confirmed": return "bg-emerald-50 border-emerald-100 text-emerald-700";
    case "pending":   return "bg-amber-50 border-amber-100 text-amber-700";
    case "cancelled": return "bg-rose-50 border-rose-100 text-rose-700";
    case "completed": return "bg-blue-50 border-blue-100 text-blue-700";
    default:          return "bg-slate-50 border-slate-100 text-slate-700";
  }
}

// ======================================================================
// 🟢 COMPONENTE PRINCIPAL
// ======================================================================
export default function AgendaPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [turno, setTurno] = useState<any>({
    paciente_id: "",
    reason: "",
    status: "pending",
    durationMin: 30,
    fechaStr: "",
    horaStr: "09:00",
  });

  useEffect(() => {
    listPacientes().then(setPacientes);
    cargarTurnos();
  }, []);

  async function cargarTurnos() {
    const data = await listAppointments();
    setTurnos([...data]); 
  }

  const cambiarMes = (offset: number) => {
    const nuevaFecha = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + offset, 1);
    setSelectedDate(nuevaFecha);
  };

  const turnosDelDia = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    const hoyStr = `${y}-${m}-${d}`;

    return turnos.filter((t) => {
      if (!t.dateISO) return false;
      const fechaTurno = t.dateISO.replace("T", " ").split(" ")[0].trim();
      return fechaTurno === hoyStr;
    }).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  }, [turnos, selectedDate]);

  const diasConTurnos = useMemo(() => {
    return new Set(
      turnos.filter(t => t.dateISO).map(t => t.dateISO.split(/[ T]/)[0])
    );
  }, [turnos]);

  const handleSave = async () => {
    const pac = pacientes.find(p => String(p.id) === String(turno.paciente_id));
    const payload: any = {
      paciente_id: String(turno.paciente_id),
      paciente_nombre: pac ? `${pac.nombre} ${pac.apellido}` : (turno.paciente_nombre || "Paciente"),
      reason: turno.reason || "",
      status: turno.status || "pending",
      durationMin: Number(turno.durationMin) || 30,
      dateISO: `${turno.fechaStr} ${turno.horaStr}:00`,
    };

    let res;
    if (modalMode === "edit") {
      payload.id = turno.id || turno.db_id;
      res = await updateAppointment(payload);
    } else {
      res = await createAppointment(payload);
    }

    if (res.status === "success" || res.status === "ok") {
      await cargarTurnos(); 
      setShowModal(false);
      setToastMsg(modalMode === "create" ? "Cita creada ✅" : "Cita actualizada ✅");
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  const openCreate = () => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    setTurno({
      paciente_id: "",
      reason: "",
      status: "pending",
      durationMin: 30,
      fechaStr: `${y}-${m}-${d}`,
      horaStr: "09:00",
    });
    setModalMode("create");
    setShowModal(true);
  };

  const openEdit = (t: any) => {
    setTurno({
      ...t,
      fechaStr: t.dateISO.split(/[ T]/)[0],
      horaStr: t.dateISO.split(/[ T]/)[1].substring(0, 5),
    });
    setModalMode("edit");
    setShowModal(true);
  };

  const renderCalendar = () => {
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const startDay = (start.getDay() + 6) % 7;
    const cells = Array(startDay).fill(null).concat([...Array(daysInMonth)].map((_, i) => i + 1));

    return (
      <div className="grid grid-cols-7 gap-1">
        {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
          <div key={`h-${i}`} className="text-[10px] font-black text-slate-300 text-center py-2 uppercase">{day}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const y = selectedDate.getFullYear();
          const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
          const dayStr = String(d).padStart(2, "0");
          const fullDateKey = `${y}-${m}-${dayStr}`;
          const isSelected = selectedDate.getDate() === d;

          return (
            <button
              key={`d-${i}`}
              onClick={() => setSelectedDate(new Date(y, selectedDate.getMonth(), d))}
              className={`relative h-10 w-full rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
                isSelected ? "bg-emerald-600 text-white shadow-lg" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              {d}
              {diasConTurnos.has(fullDateKey) && (
                <span className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-emerald-400"}`} />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-x-hidden">
      <AnimatePresence>{toastMsg && <Toast message={toastMsg} />}</AnimatePresence>

      {/* ASIDE RESPONSIVO */}
      <aside className="w-full md:w-80 bg-white border-r p-6 flex flex-col gap-6 md:sticky md:top-0 md:h-screen">
        <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white">
                <CalendarIcon className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Agenda</h1>
        </div>
        
        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 transition-all"><ChevronLeft /></button>
          <p className="font-black text-slate-700 capitalize text-sm">
            {selectedDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
          </p>
          <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 transition-all"><ChevronRight /></button>
        </div>

        <div className="hidden md:block">
            {renderCalendar()}
        </div>

        {/* Calendar Grid en mobile solo si el usuario quiere (puedes añadir un toggle si prefieres) */}
        <div className="md:hidden">
            {renderCalendar()}
        </div>

        <button onClick={openCreate} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest mt-auto">
          <Plus className="w-5 h-5" /> Nuevo Turno
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-12 w-full max-w-5xl">
        <header className="mb-8">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Listado de citas</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 capitalize leading-none">{formatearFecha(selectedDate)}</h2>
        </header>

        {turnosDelDia.length === 0 ? (
          <div className="bg-white p-12 md:p-20 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <Clock className="w-8 h-8" />
            </div>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay turnos programados</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {turnosDelDia.map((t) => (
              <motion.div
                key={t.id || t.db_id}
                layoutId={t.id}
                onClick={() => openEdit(t)}
                className={`group p-5 md:p-6 rounded-[1.8rem] border-2 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 flex justify-between items-center ${estadoColor(t.status)}`}
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-lg md:text-xl text-slate-900 tracking-tight uppercase">{t.paciente_nombre}</h4>
                    <span className="text-[10px] font-black uppercase px-3 py-1 bg-white/50 rounded-full border border-black/5">{t.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold bg-white/40 px-3 py-1 rounded-xl">
                      <Clock className="w-3.5 h-3.5 opacity-50" />
                      {t.dateISO.split(/[ T]/)[1].substring(0, 5)} hs
                    </div>
                    {t.reason && (
                      <div className="flex items-center gap-1.5 text-xs font-bold opacity-60">
                        <FileText className="w-3.5 h-3.5" />
                        {t.reason}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4 opacity-20 group-hover:opacity-100 transition-opacity">
                    <ChevronRight />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL RESPONSIVO (Bottom sheet en mobile) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                  {modalMode === "create" ? "Nueva Cita" : "Editar Cita"}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"><X /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Paciente</label>
                    <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-emerald-500 text-base" value={turno.paciente_id} onChange={(e) => setTurno({...turno, paciente_id: e.target.value})}>
                      <option value="">Seleccionar Paciente...</option>
                      {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                    </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Fecha</label>
                    <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none text-base" value={turno.fechaStr} onChange={(e) => setTurno({...turno, fechaStr: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Hora</label>
                    <input type="time" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none text-base" value={turno.horaStr} onChange={(e) => setTurno({...turno, horaStr: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Motivo de consulta</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none text-base" placeholder="Ej: Limpieza, Urgencia..." value={turno.reason} onChange={(e) => setTurno({...turno, reason: e.target.value})} />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Estado</label>
                    <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none text-base" value={turno.status} onChange={(e) => setTurno({...turno, status: e.target.value})}>
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                </div>
              </div>

              <div className="flex flex-col-reverse md:flex-row gap-3 pt-4">
                {modalMode === "edit" && (
                  <button onClick={() => { setDeleteId(turno.id || turno.db_id); setConfirmOpen(true); }} className="w-full md:w-auto px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 uppercase text-xs tracking-widest"><Trash2 className="w-4 h-4"/> Eliminar</button>
                )}
                <button onClick={handleSave} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-500 active:scale-95 transition-all uppercase text-xs tracking-widest">Guardar Cita</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Borrar turno?"
        message="Esta acción no se puede deshacer."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (deleteId) {
            await deleteAppointment(deleteId);
            await cargarTurnos();
            setShowModal(false);
          }
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}