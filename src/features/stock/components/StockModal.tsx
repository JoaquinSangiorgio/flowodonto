"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Package, Hash, AlertCircle } from "lucide-react";
import type { ArticuloStock } from "../services/stock.api";
import {ChartCandlestick} from "lucide-react"

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (articulo: ArticuloStock) => void;
  initialData?: ArticuloStock | null;
}

export default function StockModal({ isOpen, onClose, onSave, initialData }: Props) {
  // Estado inicial limpio
  const defaultForm = {
    nombre: "",
    cantidad: 0 as any, // Usamos any para permitir el "" temporalmente
    minimo: 0 as any,
    categoria: "Insumos Clínicos",
    unidad: "Unidades"
  };

  const [form, setForm] = useState<ArticuloStock>(defaultForm as any);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...initialData } : (defaultForm as any));
    }
  }, [isOpen, initialData]);

  // 🛠️ Función mágica para que puedas borrar el "0" sin problemas
  const handleNumberChange = (field: "cantidad" | "minimo", value: string) => {
    if (value === "") {
      setForm({ ...form, [field]: "" as any });
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setForm({ ...form, [field]: num });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    // 🧹 Limpieza final: convertimos los vacíos "" de nuevo a 0 antes de guardar
    const dataToSave: ArticuloStock = {
      ...form,
      cantidad: Number(form.cantidad) || 0,
      minimo: Number(form.minimo) || 0,
    };

    onSave(dataToSave);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`${initialData ? 'bg-sky-600' : 'bg-indigo-700'} p-6 text-white flex justify-between items-center transition-colors`}>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 opacity-70" />
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {initialData ? "Editar Insumo" : "Nuevo Insumo"}
                </h2>
              </div>
              <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {/* Nombre */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre del Producto</label>
                <div className="relative mt-1">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    required
                    type="text"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    placeholder="Ej: Anestesia Tubos"
                    value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                  />
                </div>
              </div>

              {/* Cantidades con lógica de borrado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
                    <ChartCandlestick className="w-5 h-5" /> Stock Actual
                  </label>
                  <input 
                    type="number"
                    min="0"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 mt-1 font-bold outline-none focus:border-indigo-500"
                    value={form.cantidad}
                    onChange={(e) => handleNumberChange("cantidad", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-rose-400 ml-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Mínimo Alerta
                  </label>
                  <input 
                    type="number"
                    min="0"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 mt-1 font-bold outline-none focus:border-rose-400"
                    value={form.minimo}
                    onChange={(e) => handleNumberChange("minimo", e.target.value)}
                  />
                </div>
              </div>

              {/* Categoría y Unidad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 mt-1 font-bold outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                    value={form.categoria}
                    onChange={(e) => setForm({...form, categoria: e.target.value})}
                  >
                    <option value="Insumos Clínicos">Insumos Clínicos</option>
                    <option value="Descartables">Descartables</option>
                    <option value="Cirugía">Cirugía</option>
                    <option value="Ortodoncia">Ortodoncia</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Unidad</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 mt-1 font-bold outline-none focus:border-indigo-500"
                    placeholder="Cajas, ml, etc"
                    value={form.unidad}
                    onChange={(e) => setForm({...form, unidad: e.target.value})}
                  />
                </div>
              </div>
              

              {/* Botones */}
              <div className="pt-2 space-y-3">
                <button 
                  type="submit"
                  className={`w-full ${initialData ? 'bg-sky-600 shadow-sky-200' : 'bg-indigo-700 shadow-indigo-200'} text-white py-4 rounded-2xl font-black shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2`}
                >
                  <Save className="w-5 h-5" /> 
                  {initialData ? "GUARDAR CAMBIOS" : "AÑADIR AL STOCK"}
                </button>
                
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-400 py-4 rounded-2xl font-bold transition-all text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}