
import React, { useState, useRef } from 'react';
import { ValueAttribute, DecisionContext } from '../types';
import { ICONS } from '../constants';
import { breakDownFactor } from '../services/geminiService';

interface ValuesRadarProps {
  values: ValueAttribute[];
  setValues: React.Dispatch<React.SetStateAction<ValueAttribute[]>>;
  context?: DecisionContext; // Passed down for recursive breakdown context
}

// Recursive Component for a Single Factor
const FactorRow: React.FC<{
    value: ValueAttribute;
    onChange: (updated: ValueAttribute) => void;
    onDelete: (id: string) => void;
    context: DecisionContext;
    level?: number;
}> = ({ value, onChange, onDelete, context, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(level === 0);
    const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);

    const handleWeightChange = (newWeight: number) => {
        onChange({ ...value, weight: newWeight });
    };

    const handleNotesChange = (notes: string) => {
        onChange({ ...value, userNotes: notes });
    };

    const handleBreakdown = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (value.subFactors && value.subFactors.length > 0) {
            // Already broken down, just expand
            setIsExpanded(true);
            return;
        }

        setIsLoadingBreakdown(true);
        try {
            const subFactors = await breakDownFactor(value, context);
            onChange({ ...value, subFactors });
            setIsExpanded(true);
        } catch (e) {
            console.error("Breakdown failed", e);
        } finally {
            setIsLoadingBreakdown(false);
        }
    };

    const handleSubFactorChange = (updatedSub: ValueAttribute) => {
        if (!value.subFactors) return;
        const newSubs = value.subFactors.map(s => s.id === updatedSub.id ? updatedSub : s);
        
        // Auto-rollup: Parent weight is average of children
        const avgWeight = Math.round(newSubs.reduce((acc, curr) => acc + curr.weight, 0) / newSubs.length);
        
        onChange({ ...value, subFactors: newSubs, weight: avgWeight });
    };

    const getNarrativeStatement = (w: number) => {
        // Use AI-generated statements if available
        if (value.rangeStatements) {
            if (w <= 33) return value.rangeStatements.low;
            if (w >= 67) return value.rangeStatements.high;
            return value.rangeStatements.mid;
        }

        // Fallback for custom values without AI data
        const min = value.minLabel || "Low";
        const max = value.maxLabel || "High";
        if (w <= 15) return `I strongly prioritize ${min}`;
        if (w <= 40) return `I am leaning towards ${min}`;
        if (w >= 85) return `I strongly prioritize ${max}`;
        if (w >= 60) return `I am leaning towards ${max}`;
        return "I want a balanced approach";
    };

    const narrativeText = getNarrativeStatement(value.weight);
    const hasSubFactors = value.subFactors && value.subFactors.length > 0;

    return (
        <div className={`mb-4 transition-all duration-300 ${level > 0 ? 'ml-6 border-l-2 border-indigo-100 pl-4' : ''}`}>
            {/* Card Header / Main Control */}
            <div 
                className={`bg-white rounded-xl shadow-sm border border-eunoia-100 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer ${level > 0 ? 'bg-slate-50' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="p-4 flex items-center gap-4">
                    {/* Expand Toggle */}
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-eunoia-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                        <ICONS.ArrowRight />
                    </div>

                    {/* Main Info */}
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{value.category}</span>
                            <div className="flex items-center gap-2">
                                {/* Fractal Button */}
                                <button 
                                    onClick={handleBreakdown}
                                    disabled={isLoadingBreakdown}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg transition-colors border border-indigo-100"
                                    title="Deep Dive: Break this into first principles"
                                >
                                    {isLoadingBreakdown ? <div className="animate-spin w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full"/> : <ICONS.Split />}
                                    <span>Deep Dive</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(value.id); }} className="p-1.5 text-eunoia-300 hover:text-rose-500 hover:bg-rose-50 rounded"><ICONS.Trash /></button>
                            </div>
                        </div>
                        <h4 className="font-bold text-eunoia-900 text-lg leading-tight">{value.name}</h4>
                        {hasSubFactors && (
                            <div className="text-[10px] text-indigo-400 font-medium mt-1 flex items-center gap-1">
                                <ICONS.Layers /> Auto-calculated from {value.subFactors?.length} sub-factors
                            </div>
                        )}
                    </div>

                    {/* Weight Display */}
                    <div className="text-center w-14">
                         <span className={`text-2xl font-bold ${level > 0 ? 'text-slate-600' : 'text-indigo-600'}`}>{value.weight}</span>
                    </div>
                </div>

                {/* Expanded "Reasoning Deck" */}
                {isExpanded && (
                    <div className="px-4 pb-4 animate-fade-in cursor-default" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs text-eunoia-500 mb-6">{value.description}</p>
                        
                        {/* Dynamic Narrative Label */}
                        <div className="text-center mb-4 px-4">
                             <div className="inline-block relative">
                                <span className="text-sm font-serif italic text-indigo-900 bg-indigo-50 px-6 py-3 rounded-xl border border-indigo-100 shadow-sm block relative z-10 transition-all duration-300">
                                    "{narrativeText}"
                                </span>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-4 h-4 bg-indigo-50 border-r border-b border-indigo-100 rotate-45 z-0"></div>
                             </div>
                        </div>

                        {/* Slider */}
                        <div className="relative pt-2 pb-2 mb-6 px-2">
                            {/* Visual Ticks */}
                            <div className="absolute top-1/2 left-0 w-full flex justify-between px-1 pointer-events-none opacity-20 transform -translate-y-1/2">
                                <div className="w-0.5 h-3 bg-slate-400"></div>
                                <div className="w-px h-2 bg-slate-400"></div>
                                <div className="w-0.5 h-3 bg-slate-400"></div>
                                <div className="w-px h-2 bg-slate-400"></div>
                                <div className="w-0.5 h-3 bg-slate-400"></div>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={value.weight}
                                onChange={(e) => handleWeightChange(parseInt(e.target.value))}
                                disabled={hasSubFactors} // Disable manual if auto-calculated
                                className={`w-full h-2 rounded-lg appearance-none cursor-pointer relative z-10 ${
                                    hasSubFactors ? 'bg-indigo-100/50 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 accent-indigo-600'
                                }`}
                            />
                            <div className="flex justify-between text-[10px] font-bold text-eunoia-400 mt-2 uppercase tracking-wide">
                                <span>{value.minLabel}</span>
                                <span>{value.maxLabel}</span>
                            </div>
                        </div>

                        {/* First Principle Prompt & Notes */}
                        <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100/50">
                            <div className="flex gap-2 items-start mb-2">
                                <div className="text-indigo-500 mt-0.5"><ICONS.Brain /></div>
                                <div className="text-sm font-medium text-indigo-900">{value.firstPrinciplePrompt}</div>
                            </div>
                            <textarea 
                                className="w-full bg-white rounded border border-indigo-100 p-2 text-xs text-eunoia-700 focus:ring-1 focus:ring-indigo-300 outline-none resize-none h-20 placeholder:text-indigo-200"
                                placeholder="Write your reasoning here to ground this value..."
                                value={value.userNotes || ''}
                                onChange={(e) => handleNotesChange(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Recursive Children */}
            {value.subFactors && value.subFactors.length > 0 && isExpanded && (
                <div className="mt-2 space-y-2">
                    {value.subFactors.map(sub => (
                        <FactorRow 
                            key={sub.id} 
                            value={sub} 
                            onChange={handleSubFactorChange}
                            onDelete={(id) => {
                                const newSubs = value.subFactors?.filter(s => s.id !== id);
                                onChange({ ...value, subFactors: newSubs });
                            }}
                            context={context}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const ValuesRadar: React.FC<ValuesRadarProps> = ({ values, setValues, context }) => {
  const [newMode, setNewMode] = useState(false);
  const [tempNewValue, setTempNewValue] = useState<Partial<ValueAttribute>>({ 
      name: '', description: '', weight: 50, minLabel: 'Low', maxLabel: 'High', category: 'Custom' 
  });

  const handleChange = (updated: ValueAttribute) => {
      setValues(prev => prev.map(v => v.id === updated.id ? updated : v));
  };

  const handleDelete = (id: string) => {
    setValues(prev => prev.filter(v => v.id !== id));
  };

  const handleAddNew = () => {
    if (!tempNewValue.name) return;
    const newId = `v${Date.now()}`;
    // Add default prompt if missing
    const fullVal = {
        ...tempNewValue,
        firstPrinciplePrompt: `Why is ${tempNewValue.name} important to this decision?`,
        id: newId
    } as ValueAttribute;
    
    setValues(prev => [...prev, fullVal]);
    setNewMode(false);
    setTempNewValue({ name: '', description: '', weight: 50, minLabel: 'Low', maxLabel: 'High', category: 'Custom' });
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="mb-6 flex justify-between items-end px-2">
            <div>
                <h3 className="text-xl font-serif text-eunoia-900">Decision DNA</h3>
                <p className="text-sm text-eunoia-500">
                    Drill down into what matters. Click <span className="inline-block align-middle bg-indigo-50 px-1.5 py-0.5 rounded text-xs font-bold text-indigo-600 border border-indigo-200">Deep Dive</span> to break a value into first principles.
                </p>
            </div>
            <button 
                onClick={() => setNewMode(true)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
            >
                <ICONS.Plus /> Custom Value
            </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-20">
            {/* New Value Form */}
            {newMode && (
                <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-lg mb-4 animate-fade-in">
                    <input 
                        className="w-full mb-2 px-2 py-1 bg-slate-50 rounded border border-indigo-200 font-bold"
                        placeholder="Name (e.g. Burn Rate)"
                        onChange={(e) => setTempNewValue({...tempNewValue, name: e.target.value})}
                    />
                     <div className="grid grid-cols-2 gap-2 mb-2">
                        <input className="px-2 py-1 text-xs bg-slate-50 rounded border" placeholder="Min Label (e.g. Low Spend)" onChange={(e) => setTempNewValue({...tempNewValue, minLabel: e.target.value})} />
                        <input className="px-2 py-1 text-xs bg-slate-50 rounded border" placeholder="Max Label (e.g. High Spend)" onChange={(e) => setTempNewValue({...tempNewValue, maxLabel: e.target.value})} />
                     </div>
                     <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setNewMode(false)} className="text-xs text-eunoia-500">Cancel</button>
                        <button onClick={handleAddNew} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded">Add Value</button>
                     </div>
                </div>
            )}

            {/* Recursive Factor Tree */}
            {values.map((val) => (
                <FactorRow 
                    key={val.id} 
                    value={val} 
                    onChange={handleChange} 
                    onDelete={handleDelete}
                    context={context || { title: '', description: '', files: [] }}
                />
            ))}
      </div>
    </div>
  );
};
