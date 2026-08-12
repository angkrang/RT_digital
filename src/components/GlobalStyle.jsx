import React from "react";
import {
  Plus,
} from "lucide-react";
import { C, FONT_STACK } from "../constants/theme";

export const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lexend:wght@500;600;700&display=swap');
    .rtd-root, .rtd-root * { font-family: ${FONT_STACK}; box-sizing: border-box; }
    .rtd-display { font-family: 'Lexend', ${FONT_STACK}; }
    .rtd-root ::-webkit-scrollbar { height: 8px; width: 8px; }
    .rtd-root ::-webkit-scrollbar-thumb { background: #C7CEDA; border-radius: 8px; }
    .rtd-root ::-webkit-scrollbar-track { background: transparent; }
    .rtd-focus:focus-visible { outline: 2px solid ${C.navyMid}; outline-offset: 2px; }
    .rtd-ledger-tab::before {
      content: "";
      position: absolute;
      left: 0; top: 14px; bottom: 14px; width: 5px;
      background: repeating-linear-gradient(180deg, rgba(255,255,255,0.85) 0 6px, transparent 6px 12px);
      border-radius: 3px;
    }
    @keyframes rtdIn { from { opacity: 0; transform: translateY(6px);} to {opacity:1; transform:translateY(0);} }
    .rtd-anim { animation: rtdIn .18s ease-out; }
    @media print {
      .no-print { display: none !important; }
      .rtd-root { background: #fff !important; }
      main { padding: 0 !important; }
    }
  `}</style>
);

/* ============================================================
   KONEKSI BACKEND (Google Apps Script + Google Spreadsheet)
   ------------------------------------------------------------
   1. Deploy Code.gs sebagai Web App (Deploy > New deployment > Web app,
      Execute as: Me, Who has access: Anyone).
   2. Tempel URL hasil deploy (diakhiri /exec) ke bawah ini.
   ============================================================ */
