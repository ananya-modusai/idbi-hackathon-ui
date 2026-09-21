'use client';

import React from 'react';
import { 
  AlertTriangle, 
  AlertCircle,
  Info, 
  X, 
  Check, 
  CheckCircle2, 
  XCircle,
  Gavel,
  ChevronDown
} from 'lucide-react';
import { linkifyText } from '../utils/pdfLinkUtils';

interface Subrule {
  subrule: string;
  reasoning: string;
  triggered: boolean;
  points?: number;
  severity?: string;
}

interface Rule {
  code: string;
  name: string;
  severity: string;
  triggered: boolean;
  points?: number;
  reasoning: string;
  extra_details?: any;
  subrules: Subrule[];
}

interface VerdictInfo {
  score: number | string;
  maxScore: number;
  riskTier: string;
  formula: string;
  summary: string;
  status?: string;
}

interface DecisioningPDFProps {
  merchantName: string;
  runDate: string;
  website: string;
  aiRiskCommentary: {
    justification: string;
    riskLevel: string;
    statusTag: string;
  };
  verdict: VerdictInfo;
  rules: Rule[];
}

const InvestigationDecisioningPDFTemplate: React.FC<DecisioningPDFProps> = ({
  merchantName,
  runDate,
  website,
  aiRiskCommentary,
  verdict,
  rules
}) => {
  
  const getRiskStyles = (riskLevel: string) => {
    const low = String(riskLevel || '').toLowerCase();
    if (low.includes('critical')) {
      return { bg: 'bg-red-50', text: 'text-red-700', title: 'text-red-800', border: 'border-red-100', dot: 'bg-red-500' };
    }
    if (low.includes('high')) {
      return { bg: 'bg-orange-50', text: 'text-orange-700', title: 'text-orange-800', border: 'border-orange-100', dot: 'bg-orange-500' };
    }
    if (low.includes('medium')) {
      return { bg: 'bg-amber-50', text: 'text-amber-700', title: 'text-amber-800', border: 'border-amber-100', dot: 'bg-amber-500' };
    }
    if (low.includes('manual review') || low.includes('manual')) {
      return { bg: 'bg-purple-50', text: 'text-purple-700', title: 'text-purple-800', border: 'border-purple-100', dot: 'bg-purple-500' };
    }
    if (low.includes('low')) {
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', title: 'text-emerald-800', border: 'border-emerald-100', dot: 'bg-emerald-500' };
    }
    return { bg: 'bg-gray-50', text: 'text-gray-700', title: 'text-gray-800', border: 'border-gray-100', dot: 'bg-gray-500' };
  };


  const scoreNum = Number(verdict.score);
  const commentaryStyles = getRiskStyles(aiRiskCommentary.riskLevel || (scoreNum >= 75 ? 'severe' : scoreNum >= 51 ? 'high' : scoreNum >= 26 ? 'medium' : 'low'));
  
  const verdictStyles = (() => {
    if (scoreNum >= 75) return { bg: 'bg-red-50/60', border: 'border-red-100', text: 'text-red-700', tier: 'text-red-600 bg-red-50 border-red-100', label: 'CRITICAL RISK' };
    if (scoreNum >= 51) return { bg: 'bg-orange-50/60', border: 'border-orange-100', text: 'text-orange-700', tier: 'text-orange-600 bg-orange-50 border-orange-100', label: 'HIGH RISK' };
    if (scoreNum >= 26) return { bg: 'bg-amber-50/60', border: 'border-amber-100', text: 'text-amber-700', tier: 'text-amber-600 bg-amber-50 border-amber-100', label: 'MEDIUM RISK' };
    return { bg: 'bg-emerald-50/60', border: 'border-emerald-100', text: 'text-emerald-700', tier: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'LOW RISK' };
  })();

  const renderFormula = (text: string) => {
    if (!text) return null;
    const hasEquals = text.includes('=');
    const [calcPart, resultPartCombined] = hasEquals ? text.split('=') : [text, ''];
    const parts = calcPart.split('+').map(p => p.trim());

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {parts.map((p, i) => {
          const match = p.match(/([A-Z]{2}\d{3})\s*·\s*(-?\d+)/);
          return (
            <React.Fragment key={i}>
              {match ? (
                <span className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-md font-bold text-[11px] flex items-center gap-1 shadow-sm">
                  {match[1]} <span className="text-orange-300">·</span> {match[2]}
                </span>
              ) : <span className="text-gray-600 font-bold text-[11px]">{p}</span>}
              {i < parts.length - 1 && <span className="text-gray-400 font-bold text-[11px]">+</span>}
            </React.Fragment>
          );
        })}
        {hasEquals && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-gray-400 font-bold text-[11px]">=</span>
            {(() => {
              const [sumPart, transformPart] = resultPartCombined.includes('->') 
                ? resultPartCombined.split('->') 
                : [resultPartCombined, null];
              
              const sumRaw = sumPart.trim();
              const transformRaw = transformPart?.replace(/(capped|floored)\s+at/gi, '').trim() || '';
              
              const formulaResultValue = transformPart ? parseFloat(transformRaw) : parseFloat(sumRaw);
              const hasMismatch = !isNaN(formulaResultValue) && formulaResultValue !== Number(verdict.score);

              return (
                <>
                  {transformPart && (
                    <span className="text-gray-400 font-bold text-[11px] line-through opacity-60">
                      {sumRaw}
                    </span>
                  )}
                  
                  {transformPart && <span className="text-gray-400 font-bold text-[11px]">→</span>}
                  
                  <span className={`px-2 py-0.5 border rounded-md font-bold text-[11px] shadow-sm ${
                    hasMismatch ? 'text-gray-400 line-through opacity-60 border-gray-200 border-dashed' :
                    (transformPart && transformPart.toLowerCase().includes('capped') ? 'bg-red-50 border-red-200 text-red-600 border-dashed' : 
                     transformPart && transformPart.toLowerCase().includes('floored') ? 'bg-emerald-50 border-emerald-200 text-emerald-600 border-dashed' :
                     'bg-white border-gray-200 text-gray-700')
                  }`}>
                    {transformPart ? transformRaw : sumRaw}
                  </span>

                  {hasMismatch && (
                    <>
                      <span className="text-gray-400 font-bold text-[11px]">→</span>
                      <span className={`px-2 py-0.5 border rounded-md font-bold text-[11px] shadow-sm border-dashed ${
                        Number(verdict.score) >= 75 ? 'bg-red-50 border-red-200 text-red-600' :
                        Number(verdict.score) >= 51 ? 'bg-orange-50 border-orange-200 text-orange-600' :
                        Number(verdict.score) >= 26 ? 'bg-amber-50 border-amber-200 text-amber-600' :
                        'bg-emerald-50 border-emerald-200 text-emerald-600'
                      }`}>
                        {verdict.score}
                      </span>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  const getSeverityBadgeStyles = (severity: string) => {
    const s = String(severity || '').toLowerCase();
    if (s.includes('critical') || s.includes('high') || s.includes('severe')) return 'bg-red-50 text-red-700 border-red-100';
    if (s.includes('medium')) return 'bg-orange-50 text-orange-700 border-orange-100';
    if (s.includes('low') || s.includes('good') || s.includes('blue')) return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-gray-50 text-gray-600 border-gray-100';
  };

  return (
    <div className="p-8 bg-white font-sans text-gray-900" style={{ width: '1122px', margin: '0 auto' }}>
      
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 mb-6">
        
        {/* AI Risk Commentary */}
        <div className={`p-4 rounded-xl ${commentaryStyles.bg} relative border ${commentaryStyles.border}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${commentaryStyles.dot}`} />
              <h3 className={`text-[15px] font-black ${commentaryStyles.title} uppercase tracking-tight`}>AI Risk Commentary</h3>
            </div>
            {aiRiskCommentary.statusTag && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black shadow-sm bg-white ${
                aiRiskCommentary.statusTag.toLowerCase().includes('critical') ? 'text-red-600 border-red-100' : 
                aiRiskCommentary.statusTag.toLowerCase().includes('low') ? 'text-emerald-600 border-emerald-100' :
                aiRiskCommentary.statusTag.toLowerCase().includes('high') ? 'text-orange-600 border-orange-100' :
                aiRiskCommentary.statusTag.toLowerCase().includes('medium') ? 'text-amber-600 border-amber-100' :
                aiRiskCommentary.statusTag.toLowerCase().includes('manual review') ? 'text-purple-600 border-purple-100' :
                'text-gray-600 border-gray-100'
              }`}>
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                  aiRiskCommentary.statusTag.toLowerCase().includes('critical') ? 'bg-red-600' : 
                  aiRiskCommentary.statusTag.toLowerCase().includes('low') ? 'bg-emerald-600' :
                  aiRiskCommentary.statusTag.toLowerCase().includes('high') ? 'bg-orange-600' :
                  aiRiskCommentary.statusTag.toLowerCase().includes('medium') ? 'bg-amber-600' :
                  aiRiskCommentary.statusTag.toLowerCase().includes('manual review') ? 'bg-purple-600' :
                  'bg-gray-400'
                }`}>
                  {aiRiskCommentary.statusTag.toLowerCase().includes('critical') ? <X className="w-2 text-white" strokeWidth={5} /> : 
                   aiRiskCommentary.statusTag.toLowerCase().includes('low') ? <Check className="w-2 text-white" strokeWidth={5} /> :
                   aiRiskCommentary.statusTag.toLowerCase().includes('manual review') ? <span className="text-white font-black text-[9px]">!</span> :
                   <AlertCircle className="w-2 text-white" />}
                </div>
                <span>{aiRiskCommentary.statusTag}</span>
              </div>
            )}

          </div>
          <p className={`${commentaryStyles.text} text-[13px] leading-relaxed font-medium whitespace-pre-line`}>
            {linkifyText(aiRiskCommentary.justification)}
          </p>
        </div>

        {/* Verdict and Formula Grid */}
        <div className="grid grid-cols-12 gap-3">
          
          {/* Case Verdict Box */}
          <div className={`col-span-12 lg:col-span-5 p-4 rounded-xl ${verdictStyles.bg} border ${verdictStyles.border} flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className={`w-4 h-4 ${verdictStyles.text}`} />
                <span className={`text-[15px] font-black uppercase ${verdictStyles.text}`}>Case Verdict</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Final Decision</span>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-black shadow-sm bg-white ${
                  verdict.status?.toLowerCase().includes('critical') ? 'text-red-600 border-red-100' : 
                  verdict.status?.toLowerCase().includes('low') ? 'text-emerald-600 border-emerald-100' :
                  verdict.status?.toLowerCase().includes('high') ? 'text-orange-600 border-orange-100' :
                  verdict.status?.toLowerCase().includes('medium') ? 'text-amber-600 border-amber-100' :
                  verdict.status?.toLowerCase().includes('manual review') ? 'text-purple-600 border-purple-100' :
                  'text-gray-600 border-gray-100'
                }`}>
                   <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                     verdict.status?.toLowerCase().includes('critical') ? 'bg-red-600' : 
                     verdict.status?.toLowerCase().includes('low') ? 'bg-emerald-600' :
                     verdict.status?.toLowerCase().includes('high') ? 'bg-orange-600' :
                     verdict.status?.toLowerCase().includes('medium') ? 'bg-amber-600' :
                     verdict.status?.toLowerCase().includes('manual review') ? 'bg-purple-600' :
                     'bg-gray-400'
                   }`}>
                      {verdict.status?.toLowerCase().includes('critical') ? <X className="w-2 text-white" strokeWidth={5} /> : 
                       verdict.status?.toLowerCase().includes('low') ? <Check className="w-2 text-white" strokeWidth={5} /> :
                       verdict.status?.toLowerCase().includes('manual review') ? <span className="text-white font-black text-[9px]">!</span> :
                       <AlertCircle className="w-2 text-white" />}
                   </div>
                   {verdict.status}
                </div>

              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Risk Score</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${verdictStyles.text}`}>{verdict.score}</span>
                  <span className="text-lg font-bold text-gray-300">/ {verdict.maxScore}</span>
                </div>
              </div>
            </div>


            <div className="relative pt-4">
              <div className="h-2 w-full bg-gray-100/50 rounded-full flex shadow-inner overflow-hidden">
                <div className="h-full w-[25%] bg-emerald-500/90" />
                <div className="h-full w-[25%] bg-amber-500/90" />
                <div className="h-full w-[25%] bg-orange-500/90" />
                <div className="h-full w-[25%] bg-red-500/90" />
              </div>
              <div className="flex justify-between mt-2 text-[9px] font-black text-gray-400">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500" /> LOW</div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-amber-500" /> MEDIUM</div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-orange-500" /> HIGH</div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-red-500" /> CRITICAL</div>
              </div>
              {/* Indicator */}
              <div 
                className="absolute top-[15px] transition-all"
                style={{ left: `${Math.min(100, Math.max(0, (Number(verdict.score) / verdict.maxScore) * 100))}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-gray-800" />
              </div>
            </div>
          </div>

          {/* Formula Box */}
          <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-[13px] font-black uppercase text-gray-500 tracking-tight">Score Calculation</span>
            </div>
            
            <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
              {renderFormula(verdict.formula)}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                {String(verdict.summary || '').split('Key contributors:')[0].trim()}
              </p>
              {String(verdict.summary || '').includes('Key contributors:') && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-1">Key Contributors</span>
                  <p className="text-[12px] text-gray-600 leading-relaxed font-medium whitespace-pre-line">
                    {String(verdict.summary || '').split('Key contributors:')[1].trim()}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 2. Risk Rules Section */}
      <div className="flex items-center gap-2 mb-4 border-b-2 border-blue-600 pb-1.5 mt-8" style={{ breakAfter: 'avoid' }}>
        <Gavel className="text-blue-600 w-5 h-5" />
        <h2 className="text-[17px] font-black text-blue-800 uppercase tracking-tight">Decisioning Flags</h2>
      </div>

      <div className="flex flex-col gap-6">
        {rules.map((rule, idx) => {
          const getRuleColor = (severity: string) => {
            const s = String(severity || '').toLowerCase();
            if (s.includes('critical') || s.includes('severe') || s.includes('high')) return 'red';
            if (s.includes('medium')) return 'orange';
            if (s.includes('low')) return 'blue';
            if (s.includes('good') || s.includes('blue') || s.includes('emerald') || s.includes('green')) return 'green';
            return 'gray';
          };
          const color = getRuleColor(rule.severity);
          const colorMap = {
            red: { border: 'border-red-100', left: 'bg-red-500', bg: 'bg-red-50/20', text: 'text-red-700', badge: 'text-red-700 bg-red-50 border-red-100' },
            orange: { border: 'border-orange-100', left: 'bg-orange-500', bg: 'bg-orange-50/20', text: 'text-orange-700', badge: 'text-orange-700 bg-orange-50 border-orange-100' },
            blue: { border: 'border-blue-100', left: 'bg-blue-500', bg: 'bg-blue-50/20', text: 'text-blue-700', badge: 'text-blue-700 bg-blue-50 border-blue-100' },
            green: { border: 'border-emerald-100', left: 'bg-emerald-500', bg: 'bg-emerald-50/20', text: 'text-emerald-700', badge: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
            gray: { border: 'border-gray-100', left: 'bg-gray-400', bg: 'bg-gray-50/20', text: 'text-gray-700', badge: 'text-gray-700 bg-gray-50 border-gray-100' }
          };
          const styles = colorMap[color as keyof typeof colorMap] || colorMap.gray;

          const triggeredSubrules = Array.isArray(rule.subrules) ? rule.subrules.filter((sr: any) => sr.triggered) : [];
          const notTriggeredSubrules = Array.isArray(rule.subrules) ? rule.subrules.filter((sr: any) => !sr.triggered) : [];

          // Fix the duplicate "RISK RISK" issue
          const getCleanSeverity = (sev: string | undefined | null) => {
            if (!sev) return 'RISK';
            const s = sev.toUpperCase();
            if (s.includes('RISK')) return s;
            return `${s} RISK`;
          };

          const hasExtension = triggeredSubrules.length > 0 || notTriggeredSubrules.length > 0 || (rule.extra_details && (rule.code === 'GF004' || rule.code === 'RF016'));

          return (
            <div key={idx} className="flex flex-col mb-4" style={{ breakInside: 'avoid' }}>
              {/* Primary Rule Card */}
              <div className={`p-4 ${hasExtension ? 'rounded-t-xl border-b-0' : 'rounded-xl'} border ${styles.border} flex flex-col gap-3 relative overflow-hidden bg-white shadow-sm`}>
                <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${styles.left}`} />
                
                {/* Header Row */}
                <div className="flex items-center justify-between pl-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-400 tracking-tight">{rule.code}</span>
                    <h4 className={`text-[16px] font-bold ${styles.text}`}>{rule.name}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-tight ${rule.triggered ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                      {rule.triggered ? 'Triggered' : 'Not Triggered'}
                    </div>
                    {rule.code !== 'MR001' && (
                      <div className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-tight ${styles.badge}`}>
                        {getCleanSeverity(rule.severity)}
                      </div>
                    )}
                    {rule.points !== undefined && (
                      <div className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-tight ${styles.badge}`}>
                        SCORE: {rule.points}
                      </div>
                    )}
                    <div className="ml-1">
                      {rule.triggered ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-500/80" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-300/80" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Overall Reasoning */}
                 <div className="flex gap-2.5 ml-1">
                    <div className="w-[1px] bg-gray-100 rounded-full" />
                    <div className="flex-1">
                       <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                         {linkifyText(rule.reasoning || "No reasoning data available.")}
                       </p>
                    </div>
                 </div>
              </div>

              {/* Extension Box - Only show Triggered evidence */}
              {hasExtension && (
                <div className={`p-5 rounded-b-xl border border-t-0 bg-white ${styles.border} flex flex-col gap-4`}>
                  
                  {/* Triggered Conditions Only */}
                  {triggeredSubrules.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {triggeredSubrules.map((sr, sIdx) => {
                        const srSeverity = sr.severity || rule.severity;
                        const srBadgeStyles = getSeverityBadgeStyles(srSeverity);
                        return (
                          <div key={sIdx} className="bg-white border border-gray-100 rounded-lg p-3 flex flex-col gap-2 shadow-[0_1px_6px_rgba(0,0,0,0.01)]" style={{ breakInside: 'avoid' }}>
                            <div className="flex items-center justify-between">
                              <code className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-600 rounded font-mono font-bold border border-gray-100">
                                {sr.subrule.toUpperCase().replace(/_/g, " ")}
                              </code>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-black uppercase">Triggered</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${srBadgeStyles}`}>{getCleanSeverity(srSeverity)}</span>
                                {sr.points !== undefined && <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${srBadgeStyles}`}>Score: {sr.points}</span>}
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                              </div>
                            </div>
                             <div className="flex flex-col gap-0.5">
                               <p className="text-[12px] text-gray-700 leading-relaxed font-medium">{linkifyText(sr.reasoning)}</p>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Not Triggered Conditions */}
                  {notTriggeredSubrules.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {notTriggeredSubrules.map((sr, sIdx) => {
                        return (
                          <div key={sIdx} className="bg-white border border-gray-100 rounded-lg p-3 flex flex-col gap-2 opacity-80" style={{ breakInside: 'avoid' }}>
                            <div className="flex items-center justify-between">
                              <code className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded font-mono font-bold border border-gray-100">
                                {sr.subrule.toUpperCase().replace(/_/g, " ")}
                              </code>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded text-[9px] font-black uppercase">Not Triggered</span>
                                <span className="px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded text-[9px] font-black uppercase">
                                  {getCleanSeverity(sr.severity || 'LOW')}
                                </span>
                                <span className="px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded text-[9px] font-black uppercase">
                                  Score: {sr.points ?? 0}
                                </span>
                                <XCircle className="w-3.5 h-3.5 text-gray-300" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <p className="text-[12px] text-gray-500 leading-relaxed font-medium">{sr.reasoning}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Special Details Handling */}
                  {rule.extra_details && (rule.code === 'GF004') && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 border-b border-gray-100 pb-1.5">
                         <ChevronDown className="w-4 h-4 text-gray-400" />
                         <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Additional Details</span>
                      </div>
                      <div className="overflow-hidden border border-gray-100 rounded-lg">
                        <table className="w-full text-[11px] text-left">
                           <thead className="bg-gray-50 text-gray-400 uppercase font-black tracking-widest border-b border-gray-100">
                              <tr>
                                 <th className="px-4 py-1.5">Particular</th>
                                 <th className="px-4 py-1.5 text-right">Value</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {rule.code === 'GF004' && [
                                { l: 'Unique customers', v: rule.extra_details.unique_customers },
                                { l: 'Successful transactions', v: rule.extra_details.count_successful_txn },
                                { l: 'Customer concentration', v: rule.extra_details.customer_concentration }
                              ].map((row, rIdx) => (
                                <tr key={rIdx}>
                                   <td className="px-4 py-2 font-bold text-gray-600">{row.l}</td>
                                   <td className="px-4 py-2 text-right font-black text-gray-800">{row.v ?? 'N/A'}</td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default InvestigationDecisioningPDFTemplate;
