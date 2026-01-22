
import React, { useRef, useState } from 'react';
import { DecisionContext, DecisionFile, CustomVoice } from '../types';
import { ICONS } from '../constants';

interface DecisionInputProps {
  context: DecisionContext;
  setContext: (ctx: DecisionContext) => void;
  onNext: () => void;
  customVoices: CustomVoice[];
  onAddVoice: (voice: CustomVoice) => void;
  onOpenLibrary: () => void;
}

export const DecisionInput: React.FC<DecisionInputProps> = ({ context, setContext, onNext, customVoices, onAddVoice, onOpenLibrary }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [newVoice, setNewVoice] = useState({ name: '', description: '' });

  const handleChange = (field: keyof DecisionContext, value: string) => {
    setContext({ ...context, [field]: value });
  };

  const processFiles = async (files: FileList | null) => {
    if (!files) return;
    const newFiles: DecisionFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          if (isImage) reader.readAsDataURL(file); 
          else reader.readAsText(file); 
        });
        const finalContent = isImage ? content.split(',')[1] : content;
        newFiles.push({
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          type: file.type || 'text/plain',
          content: finalContent,
          isImage
        });
      } catch (err) {
        console.error("Failed to read file", file.name, err);
      }
    }
    setContext({ ...context, files: [...context.files, ...newFiles] });
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setContext({ ...context, files: context.files.filter(f => f.id !== id) });
  };

  const handleAddVoice = () => {
      if (!newVoice.name || !newVoice.description) return;
      onAddVoice({
          id: `voice_${Date.now()}`,
          name: newVoice.name,
          description: newVoice.description
      });
      setNewVoice({ name: '', description: '' });
      setShowVoiceInput(false);
  };

  const isFormValid = context.title.length > 3 && (context.description.length > 3 || context.files.length > 0);

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh] animate-fade-in relative">
        
        {/* Top Controls */}
        <div className="absolute top-0 right-0 p-4">
             <button onClick={onOpenLibrary} className="flex items-center gap-2 text-sm font-bold text-eunoia-500 hover:text-indigo-600 transition-colors">
                 <ICONS.Layers /> Library
             </button>
        </div>

        {/* Hero Text */}
        <div className="text-center space-y-4 mb-12 mt-12">
            <h1 className="text-6xl md:text-7xl font-serif text-eunoia-900 tracking-tight">
                Think Beautifully.
            </h1>
            <p className="text-xl md:text-2xl text-eunoia-500 font-light tracking-wide">
                Make decisions.
            </p>
        </div>

        {/* Input Interface */}
        <div className="w-full bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/40 space-y-6 relative overflow-visible transition-all hover:shadow-indigo-100/50 duration-500 z-10">
            {/* Input Line */}
            <div className="relative group">
                <input
                    type="text"
                    className="w-full bg-transparent text-2xl md:text-3xl font-serif text-eunoia-900 border-b-2 border-eunoia-200 focus:border-indigo-600 outline-none py-4 transition-all placeholder:text-eunoia-300"
                    placeholder="What are you trying to decide?"
                    value={context.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    autoFocus
                />
            </div>

            {/* Context Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <textarea
                    className="w-full bg-eunoia-50/50 rounded-xl p-4 text-sm text-eunoia-700 outline-none focus:ring-1 focus:ring-indigo-200 resize-none h-32 transition-all border border-transparent focus:bg-white"
                    placeholder="Add context, nuance, or hidden constraints..."
                    value={context.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                />

                {/* File Drop Zone */}
                <div 
                    className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
                        isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-eunoia-200 hover:border-indigo-400 hover:bg-white'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input type="file" className="hidden" multiple ref={fileInputRef} onChange={(e) => processFiles(e.target.files)} />
                    
                    {context.files.length > 0 ? (
                        <div className="w-full h-full p-2 overflow-y-auto grid grid-cols-1 gap-1">
                             {context.files.map(f => (
                                 <div key={f.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-eunoia-100">
                                     <span className="truncate max-w-[80%]">{f.name}</span>
                                     <span onClick={(e) => {e.stopPropagation(); removeFile(f.id)}} className="text-rose-400 hover:text-rose-600 px-1">×</span>
                                 </div>
                             ))}
                        </div>
                    ) : (
                        <div className="text-center p-4">
                            <ICONS.Upload />
                            <span className="block text-xs mt-2 text-eunoia-400">Upload Evidence / Docs</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Versions of You (Custom Voices) */}
            <div className="border-t border-eunoia-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-eunoia-400 uppercase tracking-widest">Active "Versions of You"</span>
                    <button onClick={() => setShowVoiceInput(!showVoiceInput)} className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline">
                        <ICONS.Plus /> Add Perspective
                    </button>
                </div>

                {showVoiceInput && (
                    <div className="bg-indigo-50 p-4 rounded-xl mb-3 animate-fade-in border border-indigo-100">
                        <input 
                            className="w-full mb-2 bg-white rounded px-2 py-1 text-sm border border-indigo-200"
                            placeholder="Perspective Name (e.g. My Pragmatic Self)"
                            value={newVoice.name}
                            onChange={(e) => setNewVoice({...newVoice, name: e.target.value})}
                        />
                        <textarea 
                            className="w-full bg-white rounded px-2 py-1 text-sm border border-indigo-200 h-16 resize-none mb-2"
                            placeholder="How does this version of you think? (e.g. Prioritizes cash flow...)"
                            value={newVoice.description}
                            onChange={(e) => setNewVoice({...newVoice, description: e.target.value})}
                        />
                        <div className="flex justify-end gap-2">
                             <button onClick={() => setShowVoiceInput(false)} className="text-xs text-eunoia-500">Cancel</button>
                             <button onClick={handleAddVoice} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded">Save Voice</button>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {customVoices.map(voice => (
                        <span key={voice.id} className="bg-white border border-eunoia-200 px-3 py-1 rounded-full text-xs text-eunoia-600 flex items-center gap-1 shadow-sm">
                            <ICONS.Brain /> {voice.name}
                        </span>
                    ))}
                    {customVoices.length === 0 && <span className="text-xs text-eunoia-300 italic">No custom perspectives added.</span>}
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={onNext}
                    disabled={!isFormValid}
                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-medium transition-all transform duration-300 ${
                        isFormValid
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-xl shadow-indigo-200'
                            : 'bg-eunoia-100 text-eunoia-300 cursor-not-allowed'
                    }`}
                >
                    <span className="tracking-wide">Calibrate Values</span> 
                    <ICONS.ArrowRight />
                </button>
            </div>
        </div>
        
        <div className="mt-8 flex gap-4 text-xs text-eunoia-400 font-medium tracking-widest uppercase opacity-60">
            <span>Secure</span> • <span>Objective</span> • <span>Private</span>
        </div>
    </div>
  );
};
