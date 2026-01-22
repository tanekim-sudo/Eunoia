
import React, { useState, useEffect } from 'react';
import { DecisionAnalysis, AgentPerspective, ValueAttribute } from '../types';
import { ICONS } from '../constants';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface AnalysisResultProps {
  data: DecisionAnalysis;
  values: ValueAttribute[];
  onRestart: () => void;
  onUpdateValues: (newValues: ValueAttribute[]) => void;
  isUpdating: boolean;
}

const AgentCard: React.FC<{ agent: AgentPerspective }> = ({ agent }) => {
  const getColor = (verdict: string) => {
    switch (verdict) {
      case 'Approve': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Reject': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Dissent': return 'bg-rose-100 text-rose-900 border-rose-300 ring-1 ring-rose-400';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className={`p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${agent.isCustom ? 'ring-2 ring-indigo-400 bg-indigo-50/50' : 'bg-white border-eunoia-100'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-serif font-bold text-eunoia-900 flex items-center gap-2">
            {agent.isCustom && <span title="Custom Version of Self"><ICONS.Brain /></span>}
            {agent.name}
          </h4>
          <span className="text-xs text-eunoia-600 uppercase tracking-wide opacity-80">{agent.archetype}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-1 text-xs font-bold rounded border ${getColor(agent.verdict)}`}>
            {agent.verdict}
            </span>
            <span className="text-[10px] text-eunoia-400 font-mono">Score: {agent.score}</span>
        </div>
      </div>
      <p className="text-sm text-eunoia-800 mb-4 leading-relaxed">{agent.reasoning}</p>
      <div className="pt-3 border-t border-black/5">
        <div className="text-xs text-eunoia-500 uppercase font-semibold mb-1">Critical Concern</div>
        <div className="text-xs text-eunoia-700 italic">"{agent.keyConcern}"</div>
      </div>
    </div>
  );
};

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, values, onRestart, onUpdateValues, isUpdating }) => {
  const [activeTab, setActiveTab] = useState<'memo' | 'logic' | 'council' | 'stress'>('memo');
  const [localValues, setLocalValues] = useState<ValueAttribute[]>(values);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local values if props change
  useEffect(() => {
      setLocalValues(values);
      setHasChanges(false);
  }, [values]);

  const handleSliderChange = (id: string, newVal: number) => {
      setLocalValues(prev => prev.map(v => v.id === id ? { ...v, weight: newVal } : v));
      setHasChanges(true);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      
      {/* Top Bar */}
      <div className="h-16 border-b border-eunoia-200 bg-white/80 backdrop-blur flex items-center justify-between px-8 shrink-0">
           <div className="flex gap-6 overflow-x-auto no-scrollbar">
                {[
                    { id: 'memo', label: 'Executive Memo', icon: <ICONS.FileText /> },
                    { id: 'logic', label: 'Glass Box Logic', icon: <ICONS.Layers /> },
                    { id: 'council', label: 'Council of Agents', icon: <ICONS.Users /> },
                    { id: 'stress', label: 'Stress Test', icon: <ICONS.Shield /> },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap ${
                            activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600 h-16' : 'text-eunoia-500 hover:text-eunoia-800'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
           </div>
           <div className="flex items-center gap-4">
               <div className="flex flex-col items-end hidden sm:flex">
                   <span className="text-[10px] uppercase text-eunoia-400 font-bold">Confidence</span>
                   <span className="text-sm font-bold text-indigo-900">{data.confidenceScore}%</span>
               </div>
               <button onClick={onRestart} className="text-xs text-eunoia-400 hover:text-rose-500 underline">Close</button>
           </div>
      </div>

      {/* Scrollable Report Area */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12">
           <div className="max-w-4xl mx-auto animate-fade-in pb-20">
                
                {/* MEMO TAB (McKinsey Format) */}
                {activeTab === 'memo' && (
                    <div className="space-y-12">
                        {/* Executive Summary (SCR) */}
                        <section className="bg-white p-10 rounded-xl shadow-sm border border-eunoia-100">
                            <h2 className="text-2xl font-serif text-eunoia-900 mb-8 border-b pb-4">Executive Summary</h2>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-eunoia-400 uppercase tracking-widest mb-1">Situation</h4>
                                    <p className="text-eunoia-700 leading-relaxed">{data.executiveSummary.situation}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-eunoia-400 uppercase tracking-widest mb-1">Complication</h4>
                                    <p className="text-eunoia-700 leading-relaxed">{data.executiveSummary.complication}</p>
                                </div>
                                <div className="bg-indigo-50/50 p-6 rounded-lg border-l-4 border-indigo-600">
                                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Resolution (Recommendation)</h4>
                                    <p className="text-xl font-serif text-indigo-900 leading-relaxed">{data.executiveSummary.resolution}</p>
                                </div>
                            </div>
                        </section>

                        {/* Strategic Pillars */}
                        <section>
                            <h3 className="text-lg font-bold text-eunoia-900 mb-6">Strategic Rationale</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {data.strategicRationale.pillars.map((pillar, i) => (
                                    <div key={i} className="bg-white p-6 rounded-xl border border-eunoia-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-serif font-bold mb-4">{i+1}</div>
                                        <h4 className="font-bold text-eunoia-800 mb-2">{pillar.title}</h4>
                                        <p className="text-sm text-eunoia-600 leading-relaxed">{pillar.content}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Implementation Plan */}
                        <section className="bg-slate-900 text-slate-200 p-10 rounded-2xl shadow-xl">
                            <h3 className="text-lg font-serif text-white mb-6">Implementation Plan</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Immediate Actions</h4>
                                    <ul className="space-y-3">
                                        {data.implementationPlan.immediateActions.map((action, i) => (
                                            <li key={i} className="flex gap-3 text-sm">
                                                <span className="text-indigo-400">→</span>
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Resource Implications</h4>
                                        <p className="text-sm text-slate-400">{data.implementationPlan.resourceImplications}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Communication Strategy</h4>
                                        <p className="text-sm text-slate-400">{data.implementationPlan.communicationStrategy}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                         {/* SENSITIVITY LAB (INTEGRATED) */}
                         <section className="bg-white p-8 rounded-2xl border border-eunoia-100 shadow-sm mt-12">
                             <div className="flex justify-between items-start mb-8 border-b border-eunoia-50 pb-6">
                                <div>
                                    <h3 className="font-serif text-2xl text-eunoia-900 flex items-center gap-2">
                                        <ICONS.Activity /> Sensitivity Lab
                                    </h3>
                                    <p className="text-eunoia-500 mt-2 max-w-lg">
                                        Adjust your "Decision DNA" to simulate how different values affect the outcome.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => onUpdateValues(localValues)}
                                    disabled={!hasChanges || isUpdating}
                                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                                        hasChanges 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105' 
                                        : 'bg-eunoia-100 text-eunoia-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isUpdating ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"/> : <ICONS.Refresh />}
                                    {isUpdating ? 'Simulating...' : 'Run Simulation'}
                                </button>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                 {localValues.map(v => (
                                    <div key={v.id} className="group">
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-sm font-bold text-eunoia-700 uppercase tracking-wide flex items-center gap-2">
                                                {v.name}
                                                <span className="text-[10px] text-eunoia-400 font-normal normal-case bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                    {v.category}
                                                </span>
                                            </span>
                                            <span className="text-lg font-bold text-indigo-600 font-mono">{v.weight}/100</span>
                                        </div>
                                        
                                        <div className="relative h-2 bg-eunoia-100 rounded-full mb-2">
                                            <div 
                                                className="absolute top-0 left-0 h-full bg-indigo-200 rounded-full" 
                                                style={{width: `${v.weight}%`}}
                                            />
                                            <input 
                                                type="range" 
                                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" 
                                                min="0" 
                                                max="100" 
                                                value={v.weight} 
                                                onChange={(e) => handleSliderChange(v.id, parseInt(e.target.value))}
                                            />
                                            <div 
                                                className="absolute top-1/2 -mt-2 w-4 h-4 bg-indigo-600 rounded-full shadow border-2 border-white pointer-events-none transition-all group-hover:scale-125"
                                                style={{left: `calc(${v.weight}% - 8px)`}}
                                            />
                                        </div>

                                        <div className="flex justify-between text-[10px] text-eunoia-400 font-medium uppercase tracking-wider">
                                            <span>{v.minLabel}</span>
                                            <span>{v.maxLabel}</span>
                                        </div>
                                    </div>
                                 ))}
                             </div>
                        </section>
                    </div>
                )}

                {/* LOGIC TAB */}
                {activeTab === 'logic' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Assumptions */}
                            <div className="bg-white p-6 rounded-2xl border border-eunoia-100 shadow-sm">
                                <h3 className="text-lg font-serif text-eunoia-900 mb-4">Foundational Assumptions</h3>
                                <div className="space-y-4">
                                    {data.assumptions.map((ass, i) => (
                                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${ass.riskLevel === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200'}`}>{ass.riskLevel} Risk</span>
                                                <span className="text-xs font-mono">{ass.validityScore}% Validity</span>
                                            </div>
                                            <p className="text-sm font-medium text-eunoia-800 mb-1">{ass.statement}</p>
                                            <p className="text-xs text-rose-500">If False: {ass.impactIfFalse}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Tradeoffs Chart */}
                            <div className="bg-white p-6 rounded-2xl border border-eunoia-100 shadow-sm flex flex-col">
                                <h3 className="text-lg font-serif text-eunoia-900 mb-4">Tradeoff Impact Analysis</h3>
                                <div className="flex-1 min-h-[300px]">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.tradeoffs} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="gain" width={120} tick={{fontSize: 10}} />
                                            <Tooltip contentStyle={{borderRadius: '12px'}} />
                                            <Bar dataKey="impactScore" barSize={20} radius={[0, 4, 4, 0]}>
                                                {data.tradeoffs.map((_, i) => <Cell key={i} fill={i===0 ? '#4f46e5' : '#94a3b8'} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* COUNCIL TAB (Agents + Voices) */}
                {activeTab === 'council' && (
                    <div>
                         <div className="mb-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                             <h3 className="text-indigo-900 font-bold text-lg mb-2">Council of Rational Agents</h3>
                             <p className="text-indigo-700 text-sm">
                                 Includes standard rational agents plus your defined "Versions of Self".
                             </p>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {data.agents.map((agent, i) => <AgentCard key={i} agent={agent} />)}
                         </div>
                    </div>
                )}

                {/* STRESS TAB */}
                {activeTab === 'stress' && (
                    <div className="space-y-8">
                         <div className="bg-rose-50 p-8 rounded-2xl border border-rose-100">
                             <h3 className="text-rose-900 font-serif text-xl mb-4">Shadow Decision</h3>
                             <div className="flex gap-4 mb-4">
                                 <div className="text-2xl font-bold text-rose-800">{data.shadowDecision.alternativeOption}</div>
                             </div>
                             <p className="text-rose-800 mb-4">{data.shadowDecision.reasoning}</p>
                             <div className="bg-white/50 p-4 rounded-lg">
                                 <span className="text-xs font-bold text-rose-500 uppercase">Why Rejected</span>
                                 <p className="text-sm text-rose-900">{data.shadowDecision.whyRejected}</p>
                             </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {data.contingencies.map((c, i) => (
                                 <div key={i} className="bg-white p-5 rounded-xl border border-eunoia-200 shadow-sm">
                                     <div className="flex items-center gap-2 mb-2 font-bold text-eunoia-900"><ICONS.Shield /> Contingency</div>
                                     <p className="text-sm font-medium mb-2 bg-amber-50 p-2 rounded text-amber-900">{c.triggerCondition}</p>
                                     <p className="text-xs text-eunoia-500">Mitigation: {c.mitigationPlan}</p>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}
           </div>
      </div>
    </div>
  );
};
