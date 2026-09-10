import React, { useState } from 'react';
import { HelpCircle, FileText, CheckCircle2, X } from 'lucide-react';
import { GUIDE_TOOLTIPS } from '../data/guideTooltips';

interface GuideTooltipProps {
  fieldKey: keyof typeof GUIDE_TOOLTIPS | string;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export const GuideTooltip: React.FC<GuideTooltipProps> = ({ fieldKey, className = '', align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const info = GUIDE_TOOLTIPS[fieldKey];

  if (!info) return null;

  return (
    <div className={`relative inline-flex items-center align-middle ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 cursor-pointer"
        title="לחץ או העבר עכבר להסבר ומורה דרך"
        aria-label={`מורה דרך עבור ${info.title}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={`absolute bottom-full mb-2 z-50 w-72 sm:w-80 p-3.5 bg-white rounded-xl shadow-xl border border-indigo-100 text-right text-xs leading-relaxed transform transition-all ${
            align === 'right' ? 'right-0' : align === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
              <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>{info.title}</span>
            </div>
            {info.badge && (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                {info.badge}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="sm:hidden text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Location & Form */}
          <div className="bg-indigo-50/70 p-2 rounded-lg mb-2 text-indigo-950 font-medium">
            <div className="flex items-center gap-1 text-[11px] text-indigo-700 font-bold mb-0.5">
              <span>איפה מוצאים?</span>
              <span className="bg-indigo-200/80 px-1.5 py-0.2 rounded text-[10px] text-indigo-900">{info.formName}</span>
              {info.fieldCode && (
                <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded text-[10px] font-mono">
                  {info.fieldCode}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-700">{info.locationHint}</p>
          </div>

          {/* Explanation */}
          <p className="text-slate-600 mb-2">{info.explanation}</p>

          {/* Example Box */}
          <div className="bg-slate-50 border border-slate-200/80 p-2 rounded-lg text-slate-700">
            <div className="font-semibold text-[11px] text-slate-800 mb-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>דוגמה להמחשה:</span>
            </div>
            <p className="text-[11px] text-slate-600 italic">{info.example}</p>
          </div>

          {/* Arrow */}
          <div
            className={`absolute top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white ${
              align === 'right' ? 'right-3' : align === 'left' ? 'left-3' : 'left-1/2 -translate-x-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
};
