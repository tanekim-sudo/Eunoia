
import React, { useState, useEffect } from 'react';
import { ViewState, DecisionContext, ValueAttribute, DecisionAnalysis, SavedDecision, CustomVoice } from './types';
import { ICONS } from './constants';
import { DecisionInput } from './components/DecisionInput';
import { ValuesRadar } from './components/ValuesRadar';
import { AnalysisResult } from './components/AnalysisResult';
import { DecisionLibrary } from './components/DecisionLibrary';
import { Auth } from './components/Auth';
import { analyzeDecision, suggestValues } from './services/geminiService';
import { db } from './services/db';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [pendingView, setPendingView] = useState<ViewState | null>(null);
  
  const [context, setContext] = useState<DecisionContext>({ 
      id: '', title: '', description: '', files: [], dateCreated: Date.now() 
  });
  const [values, setValues] = useState<ValueAttribute[]>([]);
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Persistence
  const [savedDecisions, setSavedDecisions] = useState<SavedDecision[]>([]);
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([]);

  // Load User Data when currentUser changes
  useEffect(() => {
      const loadUserData = async () => {
        if (currentUser) {
            try {
                const [decisions, voices] = await Promise.all([
                    db.getDecisions(currentUser),
                    db.getVoices(currentUser)
                ]);
                setSavedDecisions(decisions);
                setCustomVoices(voices);
            } catch (e) {
                console.error("Failed to load user data", e);
                setError("Failed to load database data.");
            }
        } else {
            setSavedDecisions([]);
            setCustomVoices([]);
            // Don't force redirect to LOGIN here. Stay on current view (usually HOME).
        }
      };
      
      loadUserData();
  }, [currentUser]);

  const handleLogin = (username: string) => {
      setCurrentUser(username);
      // Redirect to pending view if it exists (e.g., they clicked Library then logged in)
      if (pendingView) {
          setView(pendingView);
          setPendingView(null);
      } else {
          setView(ViewState.HOME);
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setView(ViewState.HOME);
  };

  const initiateLogin = (targetView: ViewState = ViewState.HOME) => {
      setPendingView(targetView);
      setView(ViewState.LOGIN);
  };

  const saveToLibrary = async (currentAnalysis: DecisionAnalysis, currentValues: ValueAttribute[]) => {
      if (!currentUser) return; // Only save to DB if logged in
      
      const newDecision: SavedDecision = {
          id: context.id || `dec_${Date.now()}`,
          context: { ...context, id: context.id || `dec_${Date.now()}` },
          values: currentValues,
          analysis: currentAnalysis,
          lastModified: Date.now()
      };
      
      // Update UI Optimistically
      const updatedList = [newDecision, ...savedDecisions.filter(d => d.id !== newDecision.id)];
      setSavedDecisions(updatedList);
      
      // Save to DB
      try {
          await db.saveDecision(currentUser, newDecision);
      } catch (e) {
          console.error("Failed to save decision", e);
          setError("Failed to save to database.");
      }
  };

  const handleAddVoice = async (voice: CustomVoice) => {
      // Allow adding voices locally even if not logged in
      const updated = [...customVoices, voice];
      setCustomVoices(updated); 
      
      if (currentUser) {
          try {
              await db.saveVoice(currentUser, voice);
          } catch (e) {
              console.error("Failed to save voice", e);
          }
      }
  }

  const handleDeleteVoice = async (id: string) => {
      const updated = customVoices.filter(v => v.id !== id);
      setCustomVoices(updated); // Optimistic
      
      if (currentUser) {
          try {
              await db.deleteVoice(id);
          } catch (e) {
              console.error("Failed to delete voice", e);
          }
      }
  }

  // Step 1: Generate Values from Context
  const handleContextSubmit = async () => {
    if (!process.env.API_KEY) { setError("Missing API Key."); return; }
    setView(ViewState.GENERATING_VALUES);
    try {
        const suggested = await suggestValues(context);
        setValues(suggested);
        setView(ViewState.VALUES_DIAL);
    } catch (err) {
        setError("Failed to generate values: " + (err as Error).message);
    }
  };

  // Step 2: Run Analysis (Initial)
  const runAnalysis = async () => {
    setView(ViewState.ANALYZING);
    setError(null);
    try {
      const result = await analyzeDecision(context, values, customVoices);
      setAnalysis(result);
      setView(ViewState.ANALYSIS);
      if (currentUser) {
          await saveToLibrary(result, values); // Auto-save if logged in
      }
    } catch (err) {
      setError("Analysis failed. " + (err as Error).message);
    }
  };

  // Update Logic (Sensitivity Lab)
  const handleUpdateValues = async (newValues: ValueAttribute[]) => {
      setIsUpdating(true);
      try {
          const result = await analyzeDecision(context, newValues, customVoices);
          setAnalysis(result);
          setValues(newValues);
          if (currentUser) {
              await saveToLibrary(result, newValues); // Auto-save update
          }
      } catch (err) {
          setError("Re-analysis failed: " + (err as Error).message);
      } finally {
          setIsUpdating(false);
      }
  };

  const restart = () => {
    setAnalysis(null);
    setContext({ id: '', title: '', description: '', files: [], dateCreated: Date.now() });
    setValues([]);
    setView(ViewState.HOME);
  };

  // Library Handlers
  const handleLoadDecision = (decision: SavedDecision) => {
      setContext(decision.context);
      setValues(decision.values);
      setAnalysis(decision.analysis);
      setView(ViewState.ANALYSIS);
  };

  const handleDeleteDecision = async (id: string) => {
      if (!currentUser) return;
      const updated = savedDecisions.filter(d => d.id !== id);
      setSavedDecisions(updated); // Optimistic
      try {
          await db.deleteDecision(id);
      } catch (e) {
          console.error("Failed to delete decision", e);
      }
  };

  // ---------------- RENDER ----------------

  if (view === ViewState.LOGIN) {
      return (
        <Auth 
            onLogin={handleLogin} 
            onCancel={() => {
                setPendingView(null);
                setView(ViewState.HOME);
            }} 
        />
      );
  }

  // LOADING STATE
  if (view === ViewState.GENERATING_VALUES || view === ViewState.ANALYZING) {
      const isGenerating = view === ViewState.GENERATING_VALUES;
      return (
        <div className="flex flex-col items-center justify-center min-h-screen animate-pulse bg-slate-50">
           <div className="relative w-24 h-24 mb-8">
               <div className="absolute inset-0 border-4 border-eunoia-200 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                    {isGenerating ? <ICONS.Compass /> : <ICONS.Brain />}
               </div>
           </div>
           <h2 className="text-3xl font-serif text-eunoia-800">{isGenerating ? 'Designing Decision Architecture...' : 'Generating Truth...'}</h2>
           <p className="text-eunoia-500 mt-2 text-lg">
               {isGenerating ? 'Identifying critical values & risks' : 'Running agent simulations & stress tests'}
           </p>
        </div>
      );
  }

  // ERROR STATE
  if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center max-w-md mx-auto bg-slate-50">
            <div className="text-rose-500 mb-4 text-4xl">⚠</div>
            <h3 className="text-xl font-bold text-eunoia-900">System Alert</h3>
            <p className="text-eunoia-600 mt-2 mb-6">{error}</p>
            <button onClick={() => setView(ViewState.HOME)} className="px-6 py-2 bg-eunoia-800 text-white rounded-lg">Reset</button>
        </div>
      );
  }

  if (view === ViewState.LIBRARY) {
      return (
          <DecisionLibrary 
              savedDecisions={savedDecisions}
              customVoices={customVoices}
              onLoadDecision={handleLoadDecision}
              onDeleteDecision={handleDeleteDecision}
              onDeleteVoice={handleDeleteVoice}
              onBack={restart}
          />
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Navigation */}
      {view !== ViewState.ANALYSIS && (
          <nav className="sticky top-0 z-50 glass-panel border-b border-white/20 px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div 
                    className="font-serif font-bold text-xl tracking-wider cursor-pointer flex items-center gap-2" 
                    onClick={restart}
                >
                    <div className="w-8 h-8 bg-indigo-600 rounded-br-xl rounded-tl-xl flex items-center justify-center text-white text-[10px]">E</div>
                    EUNOIA
                </div>
                
                {/* User Controls */}
                <div className="flex items-center gap-4">
                    {currentUser ? (
                        <>
                            <span className="text-xs font-bold text-eunoia-500 uppercase tracking-wide hidden sm:inline-block">
                                {currentUser}
                            </span>
                            <button 
                                onClick={handleLogout}
                                className="text-xs bg-eunoia-100 hover:bg-rose-50 hover:text-rose-600 px-3 py-1.5 rounded-lg transition-colors font-medium"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => initiateLogin(ViewState.HOME)}
                            className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-200"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
          </nav>
      )}

      <main className={view === ViewState.ANALYSIS ? 'h-screen' : 'max-w-7xl mx-auto px-6 py-8'}>
        {view === ViewState.HOME && (
             <DecisionInput 
                context={context} 
                setContext={setContext} 
                onNext={handleContextSubmit} 
                customVoices={customVoices}
                onAddVoice={handleAddVoice}
                onOpenLibrary={() => {
                    if (currentUser) setView(ViewState.LIBRARY);
                    else initiateLogin(ViewState.LIBRARY);
                }}
             />
        )}

        {view === ViewState.VALUES_DIAL && (
          <div className="h-full flex flex-col pb-20 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-serif text-eunoia-900">Calibration</h2>
                </div>
                <button 
                    onClick={runAnalysis}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 font-medium"
                >
                    <ICONS.Brain /> Finalize Analysis
                </button>
            </div>
            <ValuesRadar values={values} setValues={setValues} context={context} />
          </div>
        )}

        {view === ViewState.ANALYSIS && analysis && (
            <AnalysisResult 
                data={analysis} 
                values={values}
                onRestart={restart} 
                onUpdateValues={handleUpdateValues}
                isUpdating={isUpdating}
            />
        )}
      </main>
    </div>
  );
};

export default App;
