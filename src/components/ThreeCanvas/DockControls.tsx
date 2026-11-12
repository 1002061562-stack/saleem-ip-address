import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, Box, Cpu, Send, RefreshCw } from 'lucide-react';
import { analyzeIP } from '../../services/ipCalculator';
import { audio } from '../../services/audioService';

interface DockControlsProps {
  currentIp: string;
  onIpChange: (newIp: string) => void;
  active3DMode: 'octets' | 'topology' | 'packets';
  onChange3DMode: (mode: 'octets' | 'topology' | 'packets') => void;
  explodedOffset: number;
  onExplodedChange: (val: number) => void;
  selectedOctetIndex: number | null;
  onSelectOctet: (index: number | null) => void;
}

export const DockControls: React.FC<DockControlsProps> = ({
  currentIp,
  onIpChange,
  active3DMode,
  onChange3DMode,
  explodedOffset,
  onExplodedChange,
  selectedOctetIndex,
  onSelectOctet,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [customIpInput, setCustomIpInput] = useState(currentIp);
  const analysis = analyzeIP(currentIp);

  const presets = [
    { label: 'Class A خاص', ip: '10.50.10.1' },
    { label: 'Class B خاص', ip: '172.16.8.20' },
    { label: 'Class C منزلي', ip: '192.168.1.100' },
    { label: 'Class A عام (Google)', ip: '8.8.8.8' },
    { label: 'Loopback محلي', ip: '127.0.0.1' },
  ];

  const handleApplyCustomIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (analyzeIP(customIpInput)) {
      audio.playClick();
      onIpChange(customIpInput.trim());
    }
  };

  const netMaskBytes = analysis?.defaultSubnetMask === '255.0.0.0'
    ? [true, false, false, false]
    : analysis?.defaultSubnetMask === '255.255.0.0'
    ? [true, true, false, false]
    : [true, true, true, false];

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => {
          audio.playClick();
          setIsCollapsed(!isCollapsed);
        }}
        className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-t-lg border-t border-x border-slate-700 text-xs font-semibold shadow-md transition-colors"
        title="طي أو فتح لوحة التحكم ثلاثية الأبعاد"
      >
        {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <span>{isCollapsed ? 'إظهار لوحة المعمل 3D' : 'إخفاء لوحة المعمل (وضع المشاهدة الكامل)'}</span>
      </button>

      {/* Main Glassmorphic Dock Container */}
      {!isCollapsed && (
        <div className="w-full bg-slate-950/95 border border-slate-800 rounded-b-2xl p-3 shadow-2xl flex flex-col gap-3">
          {/* Top row: Mode Switcher & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            {/* 3D Mode Pills */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  audio.playClick();
                  onChange3DMode('octets');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active3DMode === 'octets'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>محلل البايتات (Octets)</span>
              </button>

              <button
                onClick={() => {
                  audio.playClick();
                  onChange3DMode('topology');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active3DMode === 'topology'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>فضاء الفئات (Topology)</span>
              </button>

              <button
                onClick={() => {
                  audio.playClick();
                  onChange3DMode('packets');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active3DMode === 'packets'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>تدفق الحزم (Packets)</span>
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 ml-1">أمثلة سريعة:</span>
              {presets.map((p) => (
                <button
                  key={p.ip}
                  onClick={() => {
                    audio.playClick();
                    onIpChange(p.ip);
                    setCustomIpInput(p.ip);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                    currentIp === p.ip
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {p.label} ({p.ip})
                </button>
              ))}
            </div>
          </div>

          {/* Middle row: Live Octet Cards & Exploded Slider */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {analysis?.octets.map((octetVal, idx) => {
              const isNet = netMaskBytes[idx];
              const isSelected = selectedOctetIndex === idx;
              const bin = analysis.binary[idx];

              return (
                <div
                  key={idx}
                  onClick={() => {
                    audio.playClick();
                    onSelectOctet(isSelected ? null : idx);
                  }}
                  className={`cursor-pointer rounded-xl p-2.5 border transition-all flex flex-col items-center justify-center text-center ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-900/30 ring-1 ring-cyan-400'
                      : isNet
                      ? 'border-cyan-900/60 bg-slate-900/60 hover:border-cyan-700'
                      : 'border-emerald-900/60 bg-slate-900/60 hover:border-emerald-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full text-[10px] text-slate-400 mb-1">
                    <span className="font-mono">Octet {idx + 1}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isNet ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {isNet ? 'شبكة (Net)' : 'جهاز (Host)'}
                    </span>
                  </div>

                  <span className="font-mono text-xl font-black text-white">{octetVal}</span>
                  <span className="font-mono text-[10px] text-slate-400 tracking-wider mt-0.5">{bin}</span>
                </div>
              );
            })}
          </div>

          {/* Bottom row: Exploded Slider & Custom IP Input */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Exploded View Slider */}
            {active3DMode === 'octets' && (
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-cyan-400">فصل البايتات 3D:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={explodedOffset}
                  onChange={(e) => onExplodedChange(parseFloat(e.target.value))}
                  className="w-28 accent-cyan-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 w-8 font-mono">{Math.round(explodedOffset * 100)}%</span>
              </div>
            )}

            {/* Custom IP Input Form */}
            <form onSubmit={handleApplyCustomIp} className="flex items-center gap-1.5 flex-1 max-w-md">
              <input
                type="text"
                value={customIpInput}
                onChange={(e) => setCustomIpInput(e.target.value)}
                placeholder="أدخل عنوان IP لفحصه (مثال: 192.168.1.1)"
                dir="ltr"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>فحص</span>
              </button>
            </form>

            {/* IP Summary Specs */}
            {analysis && (
              <div className="flex items-center gap-3 text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400">الفئة: </span>
                  <span className="font-bold text-cyan-400">Class {analysis.detectedClass}</span>
                </div>
                <div>
                  <span className="text-slate-400">القناع: </span>
                  <span className="font-mono text-emerald-400">{analysis.defaultSubnetMask}</span>
                </div>
                <div>
                  <span className="text-slate-400">النوع: </span>
                  <span
                    className={`font-semibold ${
                      analysis.isPrivate ? 'text-amber-400' : 'text-blue-400'
                    }`}
                  >
                    {analysis.isPrivate ? 'خاص (Private)' : 'عام (Public)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
