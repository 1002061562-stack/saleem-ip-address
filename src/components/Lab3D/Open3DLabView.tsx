import React from 'react';
import {
  Layers,
  ShieldCheck,
  Globe,
  Radio,
  Server,
  Network,
  Cpu,
  Info,
} from 'lucide-react';
import { IPAnalysisResult } from '../../types';
import { analyzeIP } from '../../services/ipCalculator';
import { audio } from '../../services/audioService';

interface Open3DLabViewProps {
  currentIp: string;
  onIpChange: (ip: string) => void;
  active3DMode: 'octets' | 'topology' | 'packets';
  onChange3DMode: (mode: 'octets' | 'topology' | 'packets') => void;
  onSelectOctet: (idx: number | null) => void;
}

export const Open3DLabView: React.FC<Open3DLabViewProps> = ({
  currentIp,
  onIpChange,
  active3DMode,
  onChange3DMode,
  onSelectOctet,
}) => {
  const analysis = analyzeIP(currentIp) as IPAnalysisResult;

  const scenarios = [
    {
      title: 'شبكة مختبر المدرسة',
      desc: 'عنوان محلي ضمن الفئة Class C في شبكة المعمل',
      ip: '192.168.10.25',
      mode: 'octets' as const,
      icon: Network,
    },
    {
      title: 'شبكة جامعة كبرى',
      desc: 'عنوان مؤسسي ضمن الفئة Class B يستوعب 65,000 جهاز',
      ip: '172.16.50.12',
      mode: 'topology' as const,
      icon: Server,
    },
    {
      title: 'خادم DNS عالمي (Google)',
      desc: 'عنوان عام Public يتبع الفئة Class A على الإنترنت',
      ip: '8.8.8.8',
      mode: 'packets' as const,
      icon: Globe,
    },
    {
      title: 'فحص بطاقة الشبكة (Loopback)',
      desc: 'عنوان داخلي 127.0.0.1 لاختبار TCP/IP',
      ip: '127.0.0.1',
      mode: 'octets' as const,
      icon: Radio,
    },
    {
      title: 'فشل خادم DHCP (APIPA)',
      desc: 'عنوان تلقائي مؤقت 169.254 عند انقطاع الاتصال',
      ip: '169.254.20.15',
      mode: 'packets' as const,
      icon: Cpu,
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Scenarios Showcase */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>سيناريوهات واقعية لمنهج الصف العاشر:</span>
          </div>
          <span className="text-xs text-slate-400">انقر على أي سيناريو لاختباره فوراً في الفضاء 3D</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((sc, i) => {
            const Icon = sc.icon;
            const isCurrent = currentIp === sc.ip;

            return (
              <button
                key={i}
                onClick={() => {
                  audio.playClick();
                  onIpChange(sc.ip);
                  onChange3DMode(sc.mode);
                  onSelectOctet(null);
                }}
                className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                  isCurrent
                    ? 'bg-cyan-950/60 border-cyan-500 shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isCurrent ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-xs text-white">{sc.title}</span>
                  <span className="text-[11px] text-slate-400 line-clamp-1">{sc.desc}</span>
                  <span className="font-mono text-xs font-bold text-cyan-400 mt-1">{sc.ip}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time IP Breakdown Matrix */}
      {analysis && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-white">{analysis.ip}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Class {analysis.detectedClass}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  analysis.isPrivate
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}
              >
                {analysis.addressType === 'Private'
                  ? 'عنوان خاص (RFC 1918)'
                  : analysis.addressType === 'Public'
                  ? 'عنوان عام (Public)'
                  : analysis.addressType}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>القناع: {analysis.defaultSubnetMask}</span>
              <span>(/{analysis.cidr})</span>
            </div>
          </div>

          {/* Cards for NetID, HostID, and Broadcast */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/80 border border-cyan-900/60 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-xs text-cyan-400 font-bold">عنوان الشبكة (Network ID):</span>
              <span className="font-mono text-base font-bold text-white">{analysis.networkAddress}</span>
              <span className="text-[11px] text-slate-400 mt-1">يُمثل اسم الشبكة ككل ولا يُعطى لأي جهاز.</span>
            </div>

            <div className="bg-slate-950/80 border border-emerald-900/60 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-xs text-emerald-400 font-bold">عنوان الجهاز (Host ID):</span>
              <span className="font-mono text-base font-bold text-white">{analysis.hostAddress}</span>
              <span className="text-[11px] text-slate-400 mt-1">يُمثل رقم الجهاز الفريد داخل نفس الشبكة.</span>
            </div>

            <div className="bg-slate-950/80 border border-purple-900/60 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-xs text-purple-400 font-bold">عنوان البث العام (Broadcast):</span>
              <span className="font-mono text-base font-bold text-white">{analysis.broadcastAddress}</span>
              <span className="text-[11px] text-slate-400 mt-1">يُرسل رسالة فورية إلى جميع الأجهزة معاً.</span>
            </div>
          </div>

          {/* Explanatory Callout */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-white">تفسير المحلل الشبكي:</span>
              <p>{analysis.explanationAr}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
