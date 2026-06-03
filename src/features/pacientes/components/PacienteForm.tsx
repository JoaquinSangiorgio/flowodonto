"use client"

import { useEffect, useMemo, useState } from "react"
import type { Paciente, PacienteInput } from "../types"
import { Save, X, User, Phone, CreditCard, Mail, Calendar, FileText } from "lucide-react"

const OBRAS = [
  "OSDE",
  "Swiss Medical",
  "Galeno",
  "Sancor",
  "PAMI",
  "IOMA",
  "Medife",
  "Omint",
  "Particular",
] as const

type Props = {
  initial?: Paciente | null
  onSubmit: (values: PacienteInput) => Promise<void> | void
  onCancel: () => void
}

function onlyDigits(s: string) {
  return s.replace(/\D/g, "")
}
function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export default function PacienteForm({ initial, onSubmit, onCancel }: Props) {
  const isEdit = Boolean(initial?.id)

  const [nombre, setNombre] = useState(initial?.nombre ?? "")
  const [apellido, setApellido] = useState(initial?.apellido ?? "")
  const [dni, setDni] = useState(initial?.dni ?? "")
  const [email, setEmail] = useState(initial?.email ?? "")
  const [telefono, setTelefono] = useState(initial?.telefono ?? "")
  const [fechaNacimiento, setFechaNacimiento] = useState(initial?.fechaNacimiento ?? "")
  const [obraSocial, setObraSocial] = useState<string>(initial?.obraSocial ?? "")
  const [numeroAfiliado, setNumeroAfiliado] = useState(initial?.numeroAfiliado ?? "")
  const [notas, setNotas] = useState(initial?.notas ?? "")

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setNombre(initial?.nombre ?? "")
    setApellido(initial?.apellido ?? "")
    setDni(initial?.dni ?? "")
    setEmail(initial?.email ?? "")
    setTelefono(initial?.telefono ?? "")
    setFechaNacimiento(initial?.fechaNacimiento ?? "")
    setObraSocial(initial?.obraSocial ?? "")
    setNumeroAfiliado(initial?.numeroAfiliado ?? "")
    setNotas(initial?.notas ?? "")
    setErrors({})
  }, [initial])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio."
    if (!apellido.trim()) e.apellido = "El apellido es obligatorio."
    if (!dni.trim()) e.dni = "El DNI es obligatorio."
    else if (onlyDigits(dni).length < 7) e.dni = "DNI inválido."
    if (!email.trim()) e.email = "El email es obligatorio."
    else if (email && !isEmail(email.trim().toLowerCase())) e.email = "Email inválido."
    if (!telefono.trim()) e.telefono = "El teléfono es obligatorio."
    if (!fechaNacimiento.trim()) e.fechaNacimiento = "Requerido."
    
    setErrors(e)
    return Object.keys(e).length === 0
  }

 async function handleSubmit(e: React.FormEvent) {
  if (e) e.preventDefault();
  if (!validate()) return;

  // Construimos el payload asegurándonos de no enviar strings vacíos donde el server espera null o nada
  const payload: PacienteInput = {
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    dni: dni ? onlyDigits(dni) : undefined,
    email: email.trim().toLowerCase(),
    telefono: telefono ? onlyDigits(telefono) : undefined,
    fechaNacimiento: fechaNacimiento || undefined,
    obraSocial: obraSocial || "Particular",
    numeroAfiliado: numeroAfiliado.trim() || undefined,
    notas: notas.trim() || undefined,
  };

  // Log para depuración: verifica que no viaje un "id" aquí si es creación
  console.log("Enviando paciente:", payload);

  await onSubmit(payload);
}

  // Clases compartidas
  const fieldCls = (errorKey: string) => `
    w-full border-2 rounded-2xl px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base transition-all outline-none
    ${errors[errorKey] ? "border-rose-400 bg-rose-50" : "border-slate-100 bg-slate-50 focus:border-emerald-500 focus:bg-white"}
  `
  const labelCls = "text-[11px] font-black uppercase text-slate-400 ml-1 tracking-wider flex items-center gap-1"

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* CONTENIDO SCROLLEABLE */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 md:px-8 md:py-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-3 md:space-y-6 pb-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1">
              <label className={labelCls}><User className="w-3 h-3"/> Nombre *</label>
              <input className={fieldCls("nombre")} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Juan" />
              {errors.nombre && <span className="text-[10px] text-rose-500 font-bold ml-1 italic">{errors.nombre}</span>}
            </div>
            <div className="space-y-1">
              <label className={labelCls}><User className="w-3 h-3"/> Apellido *</label>
              <input className={fieldCls("apellido")} value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Ej: Pérez" />
              {errors.apellido && <span className="text-[10px] text-rose-500 font-bold ml-1 italic">{errors.apellido}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-1">
              <label className={labelCls}>DNI *</label>
              <input className={fieldCls("dni")} inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="Solo números" />
              {errors.dni && <span className="text-[10px] text-rose-500 font-bold ml-1 italic">{errors.dni}</span>}
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className={labelCls}><Mail className="w-3 h-3"/> Email *</label>
              <input className={fieldCls("email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="paciente@correo.com" />
              {errors.email && <span className="text-[10px] text-rose-500 font-bold ml-1 italic">{errors.email}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1">
              <label className={labelCls}><Phone className="w-3 h-3"/> Teléfono *</label>
              <input className={fieldCls("telefono")} inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 2615551234" />
              {errors.telefono && <span className="text-[10px] text-rose-500 font-bold ml-1 italic">{errors.telefono}</span>}
            </div>
            <div className="space-y-1">
              <label className={labelCls}><Calendar className="w-3 h-3"/> Nacimiento *</label>
              <input type="date" className={fieldCls("fechaNacimiento")} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
              {errors.fechaNacimiento && <span className="text-[10px] text-rose-500 font-bold ml-1 italic">{errors.fechaNacimiento}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1">
              <label className={labelCls}><CreditCard className="w-3 h-3"/> Obra social</label>
              <select className={fieldCls("obraSocial")} value={obraSocial} onChange={(e) => setObraSocial(e.target.value)}>
                <option value="">Particular</option>
                {OBRAS.filter(o => o !== "Particular").map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>N° afiliado</label>
              <input className={fieldCls("numeroAfiliado")} value={numeroAfiliado} onChange={(e) => setNumeroAfiliado(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelCls}><FileText className="w-3 h-3"/> Notas / Observaciones</label>
            <textarea className={`${fieldCls("notas")} min-h-[70px] md:min-h-[120px] resize-none`} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Alergias, tratamientos previos, etc." />
          </div>
        </form>
      </div>

      {/* FOOTER FIJO */}
      <div className="px-4 py-3 md:px-8 md:py-5 border-t bg-white flex gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border-2 border-slate-100 py-3 md:py-4 rounded-2xl font-bold text-slate-400 active:bg-slate-50 transition-all text-sm uppercase tracking-widest"
        >
          Cancelar
        </button>

        <button
          type="submit"
          onClick={handleSubmit}
          className="flex-[2] bg-emerald-600 text-white py-3 md:py-4 rounded-2xl font-black shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isEdit ? "Guardar" : "Crear"}
        </button>
      </div>
    </div>
  )
}