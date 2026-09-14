import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import '../styles/FluentPages.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const modules = [
    {
      titleKey: 'moduleAuditTitle',
      descKey: 'moduleAuditDesc',
      borderAccent: 'border-l-[#0078d4]',
      badgeColor: 'text-[#0078d4] bg-[#eff6fc]',
      path: '/picking'
    },
    {
      titleKey: 'moduleHistoryTitle',
      descKey: 'moduleHistoryDesc',
      borderAccent: 'border-l-[#107e3e]',
      badgeColor: 'text-[#107e3e] bg-[#dff6dd]',
      path: '/view_picking_audits'
    },
    {
      titleKey: 'moduleShipmentsTitle',
      descKey: 'moduleShipmentsDesc',
      borderAccent: 'border-l-[#e9730c]',
      badgeColor: 'text-[#ca5010] bg-[#fff4ce]',
      path: '/shipments'
    }
  ];

  return (
    <div className="dashboard-page space-y-6">
      {/* Grid de Módulos Operativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((m, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(m.path)}
            className={`cursor-pointer rounded border border-[#c8c6c4] border-l-4 ${m.borderAccent} bg-white p-6 shadow-xs transition-all hover:shadow-md hover:border-[#605e5c] hover:bg-[#fafafa] flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-[#111827]">
                  {t(m.titleKey)}
                </h3>
                <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded ${m.badgeColor}`}>
                  Módulo
                </span>
              </div>
              <p className="text-sm text-[#374151] leading-relaxed">
                {t(m.descKey)}
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#e5e7eb] flex items-center justify-between text-xs md:text-sm font-semibold text-[#0078d4]">
              <span>Ingresar</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
