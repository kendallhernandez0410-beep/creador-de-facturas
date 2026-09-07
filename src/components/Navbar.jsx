import React from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-sm print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Identidad Corporativa */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white text-slate-900 flex items-center justify-center font-black font-serif text-base rounded-xs">
            AF
          </div>
          <div>
            <div className="text-base font-serif font-bold tracking-tight text-white flex items-center gap-1.5">
              AUTOFIX EXPRESS S.A.
            </div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
              Sistema de Facturación Electrónica • V. 2.4
            </div>
          </div>
        </Link>

        {/* Enlaces de Navegación Institucional */}
        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition ${
                isActive
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            Registro de Facturas
          </NavLink>

          <NavLink
            to="/create"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`
            }
          >
            + Emitir Comprobante
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
