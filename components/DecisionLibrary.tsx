
import React from 'react';
import { SavedDecision, CustomVoice } from '../types';
import { ICONS } from '../constants';

interface DecisionLibraryProps {
    savedDecisions: SavedDecision[];
    onLoadDecision: (decision: SavedDecision) => void;
    onDeleteDecision: (id: string) => void;
    onBack: () => void;
    customVoices: CustomVoice[];
    onDeleteVoice: (id: string) => void;
}

export const DecisionLibrary: React.FC<DecisionLibraryProps> = ({ 
    savedDecisions, onLoadDecision, onDeleteDecision, onBack, customVoices, onDeleteVoice 
}) => {
    
    const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="max-w-6xl mx-auto py-12 px-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-eunoia-500 transition-colors"><ICONS.ArrowRight /></button>
                <h1 className="text-4xl font-serif text-eunoia-900">Decision Library</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Past Decisions List */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xs font-bold text-eunoia-400 uppercase tracking-widest border-b border-eunoia-100 pb-2">Past Decisions</h3>
                    {savedDecisions.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-eunoia-200 text-eunoia-400">
                            No decisions recorded yet.
                        </div>
                    ) : (
                        savedDecisions.map(decision => (
                            <div key={decision.id} className="bg-white p-6 rounded-xl border border-eunoia-100 shadow-sm hover:shadow-md transition-all group relative">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-serif font-bold text-xl text-eunoia-900 group-hover:text-indigo-600 transition-colors pr-8">
                                        {decision.context.title}
                                    </h4>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteDecision(decision.id); }} 
                                        className="text-eunoia-300 hover:text-rose-500 p-1 absolute top-4 right-4"
                                    >
                                        <ICONS.Trash />
                                    </button>
                                </div>
                                <p className="text-sm text-eunoia-500 mb-4 line-clamp-2">{decision.context.description}</p>
                                
                                {decision.analysis && (
                                    <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-50 mb-4">
                                        <span className="text-xs font-bold text-indigo-400 uppercase">Outcome</span>
                                        <p className="text-sm font-medium text-indigo-900 line-clamp-1">{decision.analysis.executiveSummary.resolution}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-4 border-t border-eunoia-50 pt-3">
                                    <span className="text-xs text-eunoia-400">{formatDate(decision.lastModified)}</span>
                                    <button 
                                        onClick={() => onLoadDecision(decision)}
                                        className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                    >
                                        Open Decision <ICONS.ArrowRight />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Custom Voices Sidebar */}
                <div className="space-y-6">
                    <h3 className="text-xs font-bold text-eunoia-400 uppercase tracking-widest border-b border-eunoia-100 pb-2">Versions of You (Voices)</h3>
                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                        <p className="text-xs text-indigo-700 mb-4 leading-relaxed">
                            These "Versions of Self" will appear as agents in every future analysis, ensuring your core perspectives are always represented.
                        </p>
                        
                        <div className="space-y-3">
                            {customVoices.map(voice => (
                                <div key={voice.id} className="bg-white p-3 rounded-lg shadow-sm border border-indigo-50 relative group">
                                    <div className="font-bold text-indigo-900 text-sm mb-1">{voice.name}</div>
                                    <div className="text-xs text-eunoia-500 line-clamp-2">{voice.description}</div>
                                    <button 
                                        onClick={() => onDeleteVoice(voice.id)}
                                        className="absolute top-2 right-2 text-eunoia-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <ICONS.X />
                                    </button>
                                </div>
                            ))}
                            {customVoices.length === 0 && <div className="text-xs text-indigo-300 italic">No custom voices added.</div>}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
