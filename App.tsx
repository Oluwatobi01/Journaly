import React, { useState, useEffect, useRef } from 'react';
import { Screen, JournalEntry, ChatMessage, Mood } from './types';
import { BottomNav } from './components/BottomNav';
import { Icon } from './components/Icon';
import { MOODS, MOCK_ENTRIES } from './constants';
import { generateJournalResponse, analyzeEntryMood, generateDailySummary } from './services/geminiService';
import { 
    LineChart, Line, XAxis, ResponsiveContainer, Tooltip, 
    PieChart, Pie, Cell, Tooltip as PieTooltip
} from 'recharts';

// --- Shared Components ---

const BackgroundOrbs = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-purple/10 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-accent-coral/5 rounded-full blur-[80px] animate-float" />
    </div>
);

// --- Screen Components ---

const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => (
  <div className="flex flex-col h-full items-center justify-center p-8 text-center relative overflow-hidden">
    <BackgroundOrbs />
    
    <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in w-full max-w-sm mx-auto">
        {/* Abstract Art Animation */}
        <div className="relative w-72 h-72 mb-4 animate-float">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-accent-purple to-accent-coral rounded-[3rem] opacity-30 blur-2xl animate-pulse-glow" />
            <div className="absolute inset-4 bg-gradient-to-bl from-surface-highlight to-background rounded-[2.5rem] border border-black/5 dark:border-white/10 flex items-center justify-center backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-purple/30 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/2" />
                <Icon name="auto_awesome" className="text-text-main/90 text-8xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>
        </div>
        
        <div className="space-y-4">
            <h1 className="text-5xl font-bold text-text-main leading-[1.1] tracking-tight">
                Your vibe.<br/>
                Your diary.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-purple">AI-powered.</span>
            </h1>
            <p className="text-text-muted text-lg font-medium leading-relaxed">
                Track your mood, spill the tea, and vibe check your day with Aura.
            </p>
        </div>

        <div className="w-full space-y-4 mt-8">
            <button 
                onClick={onComplete}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-[#102122] font-bold text-lg rounded-2xl shadow-[0_4px_20px_rgba(13,223,242,0.4)] active:scale-95 transform duration-200 hover:shadow-[0_4px_30px_rgba(13,223,242,0.6)]"
            >
                Let's Go
            </button>
            <button 
                onClick={onComplete}
                className="w-full py-4 bg-black/5 dark:bg-white/5 backdrop-blur-sm text-text-main font-bold text-lg rounded-2xl border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transform duration-200"
            >
                Continue Anonymously
            </button>
        </div>
    </div>
  </div>
);

const Home: React.FC<{ 
    entries: JournalEntry[]; 
    onNewEntry: (text: string) => void; 
    onViewEntry: (entry: JournalEntry) => void;
    onNavigate: (screen: Screen) => void;
}> = ({ entries, onNewEntry, onViewEntry, onNavigate }) => {
    const [inputText, setInputText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            onNewEntry(inputText);
            setInputText('');
        }
    };

    const getMoodColor = (mood: string) => {
        return MOODS.find(m => m.type === mood)?.color || 'bg-gray-500';
    }

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning ☀️";
        if (hour < 18) return "Good afternoon 👋";
        return "Good evening ✨";
    };

    return (
        <div className="flex flex-col h-full relative">
             <header className="flex flex-col gap-1 p-6 pt-8 pb-2 sticky top-0 bg-background/80 backdrop-blur-xl z-20 transition-all">
                <div className="flex justify-between items-start mb-2">
                     <p className="text-sm font-bold text-primary uppercase tracking-widest">Journaly</p>
                     <button 
                        onClick={() => onNavigate(Screen.Settings)}
                        className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-text-main hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                     >
                        <Icon name="account_circle" />
                    </button>
                </div>
                <h1 className="text-3xl font-bold text-text-main tracking-tight">{getGreeting()}</h1>
                <p className="text-text-muted font-medium">Ready to log your vibe?</p>
            </header>

            <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4 pt-4 no-scrollbar">
                {/* Vibe Check Widget */}
                {entries.length > 0 && (
                    <div className="bg-gradient-to-br from-primary/20 to-accent-purple/20 border border-black/5 dark:border-white/10 rounded-[2rem] p-6 mb-6 flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <p className="text-primary font-bold text-xs uppercase tracking-wider mb-1">Current Vibe</p>
                            <h3 className="text-2xl font-bold text-text-main">
                                {entries[0].mood === 'happy' ? 'Main Character Energy' : 
                                 entries[0].mood === 'sad' ? 'In My Feels' :
                                 entries[0].mood === 'excited' ? 'Hype Mode' : 'Just Villed'}
                            </h3>
                        </div>
                        <div className="relative z-10 w-12 h-12 bg-surface/50 backdrop-blur rounded-full flex items-center justify-center text-2xl border border-black/10 dark:border-white/10 shadow-lg">
                            {MOODS.find(m => m.type === entries[0].mood)?.emoji || '✨'}
                        </div>
                    </div>
                )}

                <p className="text-xs font-bold tracking-widest text-text-muted/60 uppercase px-2">Recent Memories</p>

                {entries.map((entry) => (
                    <div 
                        key={entry.id}
                        onClick={() => onViewEntry(entry)}
                        className="group bg-surface/40 hover:bg-surface/60 backdrop-blur-md active:scale-[0.98] transition-all duration-300 rounded-[1.5rem] p-4 cursor-pointer flex gap-4 border border-black/5 dark:border-white/5 hover:border-primary/30 shadow-sm"
                    >
                        <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-2xl ${getMoodColor(entry.mood)} bg-opacity-20 text-text-main shadow-inner`}>
                            {MOODS.find(m => m.type === entry.mood)?.emoji}
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-w-0 py-1">
                            <p className="text-text-main font-medium line-clamp-2 leading-snug">
                                {entry.summary}
                            </p>
                            <p className="text-xs text-text-muted mt-2 font-medium flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-primary/50" />
                                {entry.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex items-center text-text-muted/30 group-hover:text-primary transition-colors">
                             <Icon name="arrow_forward_ios" className="text-xs" />
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="absolute bottom-[90px] left-0 right-0 px-4 z-30">
                <div className="flex items-center gap-2 bg-surface/80 backdrop-blur-xl p-2 pl-5 rounded-[2rem] shadow-2xl shadow-black/10 dark:shadow-black/40 border border-black/5 dark:border-white/10 focus-within:ring-2 focus-within:ring-primary/50 transition-all transform hover:-translate-y-1">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="How was your day?"
                        className="flex-1 bg-transparent border-none text-text-main placeholder-text-muted/70 py-3 focus:ring-0 text-base font-medium"
                    />
                    <button 
                        type="submit"
                        disabled={!inputText.trim()}
                        className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-primary-dark disabled:opacity-50 disabled:from-surface-highlight disabled:to-surface-highlight text-[#102122] flex items-center justify-center transition-all shadow-lg hover:shadow-primary/30"
                    >
                        <Icon name="arrow_upward" className="font-bold text-xl" />
                    </button>
                </div>
            </form>
        </div>
    );
};

const Chat: React.FC<{ 
    initialMessage?: string; 
    existingEntry?: JournalEntry;
    onClose: () => void;
    onSave: (entry: Partial<JournalEntry>) => void;
}> = ({ initialMessage, existingEntry, onClose, onSave }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showMoodSelector, setShowMoodSelector] = useState(false);
    const [selectedMood, setSelectedMood] = useState<Mood | null>(existingEntry ? existingEntry.mood : null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize chat state
    useEffect(() => {
        if (existingEntry) {
            // Load existing chat
            setMessages(existingEntry.messages);
            setShowMoodSelector(true); // Allow changing mood for existing entries
        } else {
            // Start new chat
            if (initialMessage && messages.length === 0) {
                handleSendMessage(initialMessage);
            } else if (messages.length === 0) {
                setMessages([{
                    id: 'init',
                    sender: 'ai',
                    text: "Hey bestie! 👋 What's the vibe today?",
                    timestamp: new Date()
                }]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSendMessage = async (text: string) => {
        const newUserMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text,
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsTyping(true);

        const history = messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text
        }));

        const responseText = await generateJournalResponse(history, text);
        
        const newAiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: responseText,
            timestamp: new Date()
        };

        setIsTyping(false);
        setMessages(prev => [...prev, newAiMsg]);

        if (!showMoodSelector) {
            setShowMoodSelector(true);
        }
    };

    const handleMoodSelect = (mood: Mood) => {
        setSelectedMood(mood);
    };

    const handleFinish = async () => {
        let finalMood = selectedMood;
        const fullText = messages.filter(m => m.sender === 'user').map(m => m.text).join('\n');
        
        if (!finalMood) {
            const detected = await analyzeEntryMood(fullText);
            finalMood = detected as Mood;
        }

        const summary = await generateDailySummary(fullText);

        onSave({
            ...existingEntry, // Preserve ID/Date if editing
            fullText,
            messages,
            mood: finalMood || 'neutral',
            summary
        });
        onClose();
    };

    return (
        <div className="flex flex-col h-full z-50 fixed inset-0 bg-background/95 backdrop-blur-3xl">
            <BackgroundOrbs />
            <header className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 backdrop-blur-xl shrink-0 border-b border-black/5 dark:border-white/5">
                <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-black/5 dark:hover:bg-white/10 hover:text-text-main transition-colors">
                    <Icon name="close" />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-text-main font-bold tracking-tight">
                        {existingEntry ? new Date(existingEntry.date).toLocaleDateString() : "Today's Entry"}
                    </h2>
                    <span className="text-xs text-primary font-medium uppercase tracking-wide">
                        {existingEntry ? "Revisiting" : new Date().toLocaleDateString(undefined, { weekday: 'long'})}
                    </span>
                </div>
                <button onClick={handleFinish} className="px-5 py-2 bg-gradient-to-r from-primary/20 to-accent-purple/20 text-primary font-bold rounded-full text-sm hover:from-primary/30 hover:to-accent-purple/30 border border-primary/20">
                    Done
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}>
                        <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center shadow-lg ${
                            msg.sender === 'ai' 
                                ? 'bg-gradient-to-tr from-accent-purple to-blue-500 ring-2 ring-white/10' 
                                : 'bg-surface border border-black/5 dark:border-white/10'
                        }`}>
                             {msg.sender === 'ai' ? <Icon name="auto_awesome" className="text-white text-sm" /> : <Icon name="person" className="text-text-muted text-sm" />}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed shadow-sm backdrop-blur-sm ${
                            msg.sender === 'user' 
                                ? 'bg-primary text-[#102122] font-bold rounded-br-none shadow-[0_4px_15px_rgba(13,223,242,0.3)]' 
                                : 'bg-black/5 dark:bg-white/10 text-text-main rounded-bl-none border border-black/5 dark:border-white/5'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex gap-3 animate-fade-in">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent-purple to-blue-500 flex items-center justify-center shrink-0 ring-2 ring-white/10">
                             <Icon name="auto_awesome" className="text-white text-sm" />
                        </div>
                        <div className="bg-black/5 dark:bg-white/5 rounded-2xl rounded-bl-none px-4 py-4 flex items-center gap-1.5 border border-black/5 dark:border-white/5">
                            <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-accent-purple/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-accent-coral/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                
                {showMoodSelector && (
                    <div className="py-6 animate-fade-in">
                        <div className="flex items-center gap-2 mb-4 justify-center">
                            <div className="h-[1px] w-12 bg-black/10 dark:bg-white/10"></div>
                            <p className="text-center text-xs font-bold text-text-muted uppercase tracking-widest">How's the vibe?</p>
                            <div className="h-[1px] w-12 bg-black/10 dark:bg-white/10"></div>
                        </div>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2 justify-start sm:justify-center snap-x">
                            {MOODS.map(mood => (
                                <button
                                    key={mood.type}
                                    onClick={() => handleMoodSelect(mood.type)}
                                    className={`snap-center flex flex-col items-center gap-2 p-3 min-w-[80px] rounded-2xl border transition-all duration-300 shrink-0 ${
                                        selectedMood === mood.type 
                                            ? `${mood.color} bg-opacity-20 border-primary text-text-main scale-110` 
                                            : 'bg-black/5 dark:bg-white/5 border-transparent text-text-muted hover:bg-black/10 dark:hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-3xl filter drop-shadow-md">{mood.emoji}</span>
                                    <span className="text-xs font-bold">{mood.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 pt-2 bg-background/80 backdrop-blur-xl border-t border-black/5 dark:border-white/5">
                <form 
                    onSubmit={(e) => { e.preventDefault(); if(inputValue.trim()) handleSendMessage(inputValue); }}
                    className="flex items-center gap-3"
                >
                    <input
                        className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-6 py-4 text-text-main placeholder-text-muted/50 focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all outline-none"
                        placeholder="Type a message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button 
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent-purple disabled:opacity-50 disabled:grayscale text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg shadow-purple-500/20"
                    >
                        <Icon name="send" className="text-xl" />
                    </button>
                </form>
            </div>
        </div>
    );
};

const History: React.FC<{ entries: JournalEntry[] }> = ({ entries }) => {
    const [viewMode, setViewMode] = useState<'Calendar' | 'Chart'>('Calendar');
    const [displayDate, setDisplayDate] = useState(new Date());

    const handlePrevMonth = () => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    // Dynamic Calendar Generation based on displayDate
    const currentMonth = displayDate.getMonth();
    const currentYear = displayDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
    
    // Create grid with empty slots for days before start of month
    const calendarGrid = [
        ...Array(startDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];

    const getMoodForDay = (day: number) => {
        // Find entry for this specific day/month/year
        const entry = entries.find(e => {
            const d = new Date(e.date);
            return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        return entry ? MOODS.find(m => m.type === entry.mood) : null;
    };

    const monthName = displayDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });

    // Most Frequent Mood Calculation for the displayed month
    const monthlyEntries = entries.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const moodCounts = monthlyEntries.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const topMoodType = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topMood = MOODS.find(m => m.type === topMoodType);

    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    return (
        <div className="flex flex-col h-full px-4 pb-28 pt-8 overflow-y-auto no-scrollbar relative">
             <header className="flex items-center justify-between pb-8">
                <h1 className="text-3xl font-bold text-text-main tracking-tight">Mood History</h1>
                <div className="bg-surface/50 backdrop-blur rounded-xl p-1 flex gap-1 border border-black/5 dark:border-white/5">
                    <button 
                        onClick={() => setViewMode('Calendar')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'Calendar' ? 'bg-black/10 dark:bg-white/10 text-primary shadow-sm border border-black/5 dark:border-white/5' : 'text-text-muted hover:text-text-main'}`}
                    >
                        Calendar
                    </button>
                    <button 
                        onClick={() => setViewMode('Chart')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'Chart' ? 'bg-black/10 dark:bg-white/10 text-primary shadow-sm border border-black/5 dark:border-white/5' : 'text-text-muted hover:text-text-main'}`}
                    >
                        Chart
                    </button>
                </div>
            </header>

            <div className="flex items-center justify-between mb-8 px-2 bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5">
                <button onClick={handlePrevMonth} className="text-text-muted hover:text-text-main w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"><Icon name="chevron_left" /></button>
                <h2 className="text-lg font-bold text-text-main w-40 text-center">{monthName}</h2>
                <button onClick={handleNextMonth} className="text-text-muted hover:text-text-main w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"><Icon name="chevron_right" /></button>
            </div>

            {viewMode === 'Calendar' ? (
                <div className="grid grid-cols-7 gap-y-8 gap-x-2 text-center mb-8 animate-fade-in">
                    {['S','M','T','W','T','F','S'].map(d => (
                        <div key={d} className="text-xs font-bold text-primary/60 uppercase">{d}</div>
                    ))}
                    
                    {calendarGrid.map((day, index) => {
                        if (!day) return <div key={`empty-${index}`} />;
                        const mood = getMoodForDay(day);
                        const isToday = isCurrentMonth && day === today.getDate();
                        
                        return (
                            <div key={day} className="flex flex-col items-center gap-2 group cursor-pointer relative">
                                {mood ? (
                                    <div className={`w-10 h-10 rounded-full ${mood.color} bg-opacity-20 text-xl flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-primary/50 transition-all group-hover:scale-110 shadow-[0_0_10px_rgba(0,0,0,0.1)]`}>
                                        {mood.emoji}
                                    </div>
                                ) : (
                                    <div className={`w-10 h-10 rounded-full ${isToday ? 'bg-black/10 dark:bg-white/20 ring-1 ring-primary' : 'bg-black/5 dark:bg-white/5'} border border-black/5 dark:border-white/5 flex items-center justify-center group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors`}>
                                        <div className={`w-1.5 h-1.5 ${isToday ? 'bg-primary' : 'bg-black/10 dark:bg-white/10'} rounded-full`} />
                                    </div>
                                )}
                                 <div className={`text-[10px] font-bold ${isToday ? 'text-primary' : 'text-text-muted'} group-hover:text-text-main absolute -bottom-4`}>{day}</div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-text-muted animate-fade-in">
                    <Icon name="bar_chart" className="text-4xl mb-2 opacity-50" />
                    <p>Chart view coming soon!</p>
                </div>
            )}

            <div className="bg-gradient-to-br from-surface/50 to-surface-highlight/30 rounded-[2rem] p-6 border border-black/5 dark:border-white/10 backdrop-blur-md">
                <h3 className="text-text-main font-bold mb-4 flex items-center gap-2">
                    <Icon name="summarize" className="text-accent-purple" />
                    Monthly Vibe
                </h3>
                {topMood ? (
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(13,223,242,0.2)] border border-primary/20">
                            {topMood.emoji}
                        </div>
                        <div>
                            <p className="text-text-main font-bold text-xl">Mostly {topMood.label}</p>
                            <p className="text-text-muted text-sm font-medium mt-1">You logged '{topMood.label}' the most. Keep glowing! ✨</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-text-muted text-sm">No entries for this month yet.</p>
                )}
            </div>
        </div>
    );
};

const Insights: React.FC<{ entries: JournalEntry[] }> = ({ entries }) => {
    const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Month');

    // Basic Calculations
    const totalEntries = entries.length;
    // Calculate streak (consecutive days backward from today)
    const calculateStreak = () => {
        const sortedDates = [...new Set(entries.map(e => new Date(e.date).toDateString()))]
            .map(d => new Date(d as string).getTime())
            .sort((a, b) => b - a); // Descending

        const today = new Date();
        today.setHours(0,0,0,0);
        const todayTime = today.getTime();
        
        // If no entry today, check yesterday for active streak
        if (sortedDates.length === 0) return 0;
        
        // Check if streak is broken (must have entry today or yesterday)
        const firstDate = sortedDates[0];
        
        // Fix TS error: ensure firstDate is a number (defined) before arithmetic
        if (typeof firstDate !== 'number') return 0;

        const diff = (todayTime - firstDate) / (1000 * 60 * 60 * 24);
        if (diff > 1.1) return 0; // Using 1.1 to cover "greater than 1 day" roughly

        let streak = 1;
        let currentDate = firstDate;

        for (let i = 1; i < sortedDates.length; i++) {
             const prevDate = sortedDates[i];
             if (typeof prevDate !== 'number') continue;
             const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
             if (Math.round(diffDays) === 1) {
                 streak++;
                 currentDate = prevDate;
             } else {
                 break;
             }
        }
        return streak;
    };
    const streak = calculateStreak();

    // Data for Donut Chart (calculated from entries)
    const moodCounts = entries.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const moodData = Object.keys(moodCounts).map(key => {
        const moodObj = MOODS.find(m => m.type === key);
        return {
            name: moodObj?.label || key,
            value: moodCounts[key],
            color: moodObj?.color.includes('primary') ? '#0ddff2' : 
                   moodObj?.color.includes('purple') ? '#9B5DE5' : 
                   moodObj?.color.includes('coral') ? '#F15BB5' : '#888888',
            percent: Math.round((moodCounts[key] / totalEntries) * 100)
        }
    }).sort((a, b) => b.value - a.value);

    // Placeholder data for Line Chart (mocking trends for visual demo)
    const lineData = [
        { day: '1', value: 2 }, { day: '5', value: 3.8 }, { day: '10', value: 2.5 },
        { day: '15', value: 4.8 }, { day: '20', value: 2.0 }, { day: '25', value: 5.0 },
        { day: '30', value: 4.5 },
    ];

    const themes = [
        { label: 'Work', bg: 'bg-primary/20', text: 'text-primary' },
        { label: 'Friends', bg: 'bg-accent-purple/20', text: 'text-accent-purple' },
        { label: 'Project', bg: 'bg-accent-coral/20', text: 'text-accent-coral' },
        { label: 'Weekend', bg: 'bg-accent-coral/20', text: 'text-accent-coral' },
    ];

    const activities = [
        { name: 'Exercise', icon: 'fitness_center', impact: '+15% Mood', iconBg: 'bg-accent-purple/20', iconColor: 'text-accent-purple' },
        { name: 'Socializing', icon: 'groups', impact: '+12% Mood', iconBg: 'bg-accent-coral/20', iconColor: 'text-accent-coral' },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface/90 border border-black/5 dark:border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md">
                    <p className="text-text-muted text-xs font-bold mb-1">Day {label}</p>
                    <p className="text-primary font-bold">Mood: {payload[0].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full relative overflow-y-auto pb-28 no-scrollbar">
             {/* Header */}
             <header className="flex items-center justify-between p-6 sticky top-0 bg-background/80 backdrop-blur-xl z-20 border-b border-black/5 dark:border-white/5">
                <button className="w-10 h-10 flex items-center justify-center text-text-main/80 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                    <Icon name="arrow_back_ios_new" className="text-lg" />
                </button>
                <h1 className="text-lg font-bold text-text-main tracking-tight">Insights & Statistics</h1>
                <button 
                    onClick={() => alert("Insights help you track your mood trends over time.")}
                    className="w-10 h-10 flex items-center justify-center text-text-main/80 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                    <Icon name="info" className="text-2xl" />
                </button>
            </header>

            <div className="p-4 space-y-6">
                {/* Tabs */}
                <div className="bg-surface/50 rounded-2xl p-1.5 flex border border-black/5 dark:border-white/5">
                    {['Week', 'Month', 'Year'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setTimeRange(tab as any)}
                            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                                timeRange === tab 
                                ? 'bg-black/10 dark:bg-white/10 text-primary shadow-sm border border-black/5 dark:border-white/5' 
                                : 'text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/5 dark:bg-white/5 rounded-[2rem] p-5 border border-black/5 dark:border-white/5 relative overflow-hidden group hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-2">Entries</p>
                        <p className="text-4xl font-black text-text-main tracking-tight">{totalEntries}</p>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 rounded-[2rem] p-5 border border-black/5 dark:border-white/5 relative overflow-hidden group hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                         <div className="absolute bottom-0 left-0 w-20 h-20 bg-accent-purple/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                        <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-2">Streak</p>
                        <p className="text-4xl font-black text-text-main tracking-tight">{streak} <span className="text-lg text-primary font-medium">Days</span></p>
                    </div>
                </div>

                {/* Mood Over Time */}
                <div className="bg-surface/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-black/5 dark:border-white/5 shadow-sm">
                    <div className="mb-6">
                        <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-2">Mood Trend ({timeRange})</p>
                        <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">Mostly Positive</h2>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                             <span className="text-text-main/80 text-xs font-medium">This {timeRange}</span>
                             <span className="text-primary font-bold text-xs">+5%</span>
                        </div>
                    </div>
                    
                    <div className="h-48 w-full -ml-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData}>
                                <defs>
                                    <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#0ddff2" />
                                        <stop offset="100%" stopColor="#9B5DE5" />
                                    </linearGradient>
                                </defs>
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#90c6cb', fontSize: 11, fontWeight: 600}} 
                                    dy={10}
                                    ticks={['1', '5', '10', '15', '20', '25', '30']}
                                />
                                <Tooltip cursor={{stroke: 'rgba(255,255,255,0.1)'}} content={<CustomTooltip />} />
                                <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="url(#lineColor)" 
                                    strokeWidth={4} 
                                    dot={false}
                                    activeDot={{r: 6, fill: '#102122', stroke: '#0ddff2', strokeWidth: 3}}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Mood Breakdown */}
                <div className="bg-surface/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-black/5 dark:border-white/5 shadow-sm">
                    <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-6">Mood Breakdown</p>
                    {moodData.length > 0 ? (
                        <div className="flex flex-col items-center justify-center relative">
                            <div className="h-64 w-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={moodData}
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                            stroke="none"
                                            cornerRadius={10}
                                        >
                                            {moodData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-6xl font-black text-text-main tracking-tighter drop-shadow-lg">4.1</span>
                                    <span className="text-text-muted font-bold uppercase text-xs tracking-widest mt-2">Avg Mood</span>
                                </div>
                            </div>

                            {/* Custom Legend */}
                            <div className="w-full mt-8 grid grid-cols-1 gap-4 px-2">
                                {moodData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                                            <span className="text-text-main font-bold">{item.name}</span>
                                        </div>
                                        <span className="text-text-main/60 font-medium">{item.percent}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-text-muted">
                            Start journaling to see your mood breakdown!
                        </div>
                    )}
                </div>

                {/* Common Themes */}
                <div className="bg-surface/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-black/5 dark:border-white/5 shadow-sm">
                    <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-5">Common Themes</p>
                    <div className="flex flex-wrap gap-2">
                        {themes.map((theme) => (
                            <span 
                                key={theme.label} 
                                className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide border border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors ${theme.bg} ${theme.text}`}
                            >
                                {theme.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* What Lifts You Up */}
                <div className="bg-surface/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-black/5 dark:border-white/5 shadow-sm">
                     <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-5">What Lifts You Up?</p>
                     <div className="space-y-3">
                        {activities.map((activity) => (
                            <div key={activity.name} className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/5">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activity.iconBg}`}>
                                    <Icon name={activity.icon} className={activity.iconColor} />
                                </div>
                                <span className="flex-1 text-text-main font-bold text-base">{activity.name}</span>
                                <span className="text-[#00ff9d] font-bold text-sm bg-[#00ff9d]/10 px-3 py-1 rounded-lg border border-[#00ff9d]/20">
                                    {activity.impact}
                                </span>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    )
}

const Settings: React.FC<{ 
    onNavigate: (screen: Screen) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    accentColor: string;
    setAccentColor: (color: string) => void;
    onSignOut: () => void;
}> = ({ onNavigate, isDarkMode, toggleTheme, accentColor, setAccentColor, onSignOut }) => {
    const [pushEnabled, setPushEnabled] = useState(true);

    return (
        <div className="flex flex-col h-full relative overflow-y-auto pb-28 no-scrollbar">
            {/* Header */}
            <div className="flex flex-col p-6 pb-4 sticky top-0 bg-background/80 backdrop-blur-xl z-20 transition-all">
                <div className="flex items-center h-12 -ml-2">
                   <button 
                        onClick={() => onNavigate(Screen.Home)}
                        className="w-10 h-10 flex items-center justify-center text-text-main/80 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <Icon name="arrow_back_ios_new" className="text-xl" />
                    </button>
                </div>
                <h1 className="text-4xl font-bold text-text-main tracking-tight leading-tight mt-2">Settings</h1>
            </div>

            {/* Account Section */}
            <div className="px-4 mt-6">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-4">Account</h3>
                <div className="bg-surface/30 backdrop-blur-md rounded-[1.5rem] overflow-hidden border border-black/5 dark:border-white/5 divide-y divide-black/5 dark:divide-white/5">
                    <button 
                        onClick={() => alert("Profile settings are not implemented in this demo.")}
                        className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center"><Icon name="person" /></div>
                            <span className="text-text-main text-base font-bold">Profile</span>
                        </div>
                        <Icon name="chevron_right" className="text-text-muted group-hover:text-text-main transition-colors" />
                    </button>
                    <button 
                        onClick={() => alert("Security settings are not implemented in this demo.")}
                        className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center"><Icon name="lock" /></div>
                            <span className="text-text-main text-base font-bold">Security</span>
                        </div>
                        <Icon name="chevron_right" className="text-text-muted group-hover:text-text-main transition-colors" />
                    </button>
                </div>
            </div>

            {/* Appearance Section */}
            <div className="px-4 mt-8">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-4">Appearance</h3>
                <div className="bg-surface/30 backdrop-blur-md rounded-[1.5rem] overflow-hidden border border-black/5 dark:border-white/5 divide-y divide-black/5 dark:divide-white/5">
                    <div 
                        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        onClick={toggleTheme}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center"><Icon name="dark_mode" /></div>
                            <span className="text-text-main text-base font-bold">Dark Theme</span>
                        </div>
                        <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 shadow-inner ${isDarkMode ? 'bg-primary' : 'bg-surface-highlight'}`}>
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </div>
                    </div>
                    <div className="w-full flex flex-col gap-4 p-4">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center"><Icon name="palette" /></div>
                            <span className="text-text-main text-base font-bold">Accent Color</span>
                        </div>
                        <div className="flex items-center gap-4 pl-[60px]">
                             <button 
                                onClick={() => setAccentColor('#0ddff2')}
                                className={`w-8 h-8 rounded-full bg-[#0ddff2] transition-transform hover:scale-110 shadow-[0_0_10px_#0ddff2] ${accentColor === '#0ddff2' ? 'ring-2 ring-offset-2 ring-offset-surface ring-white scale-110' : ''}`} 
                             />
                             <button 
                                onClick={() => setAccentColor('#9B5DE5')}
                                className={`w-8 h-8 rounded-full bg-[#9B5DE5] hover:scale-110 transition-transform shadow-[0_0_10px_#9B5DE5] ${accentColor === '#9B5DE5' ? 'ring-2 ring-offset-2 ring-offset-surface ring-white scale-110' : ''}`} 
                             />
                             <button 
                                onClick={() => setAccentColor('#F15BB5')}
                                className={`w-8 h-8 rounded-full bg-[#F15BB5] hover:scale-110 transition-transform shadow-[0_0_10px_#F15BB5] ${accentColor === '#F15BB5' ? 'ring-2 ring-offset-2 ring-offset-surface ring-white scale-110' : ''}`} 
                             />
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="px-4 mt-8">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-4">Notifications</h3>
                <div className="bg-surface/30 backdrop-blur-md rounded-[1.5rem] overflow-hidden border border-black/5 dark:border-white/5 divide-y divide-black/5 dark:divide-white/5">
                    <div 
                        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        onClick={() => setPushEnabled(!pushEnabled)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center"><Icon name="notifications" /></div>
                            <span className="text-text-main text-base font-bold">Push Notifications</span>
                        </div>
                        <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 shadow-inner ${pushEnabled ? 'bg-primary' : 'bg-surface-highlight'}`}>
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </div>
                    </div>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center"><Icon name="edit_calendar" /></div>
                            <span className="text-text-main text-base font-bold">Journal Reminders</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="text-text-muted text-sm font-bold bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg">9:00 PM</span>
                             <Icon name="chevron_right" className="text-text-muted group-hover:text-text-main transition-colors" />
                        </div>
                    </button>
                </div>
            </div>

            {/* Data & Privacy Section */}
            <div className="px-4 mt-8">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-4">Data & Privacy</h3>
                <div className="bg-surface/30 backdrop-blur-md rounded-[1.5rem] overflow-hidden border border-black/5 dark:border-white/5 divide-y divide-black/5 dark:divide-white/5">
                    <button 
                        onClick={() => alert("Privacy Policy is not available in this demo.")}
                        className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center"><Icon name="privacy_tip" /></div>
                            <span className="text-text-main text-base font-bold">Privacy Policy</span>
                        </div>
                        <Icon name="chevron_right" className="text-text-muted group-hover:text-text-main transition-colors" />
                    </button>
                    <button 
                        onClick={() => alert("Export functionality is coming soon!")}
                        className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center"><Icon name="download" /></div>
                            <span className="text-text-main text-base font-bold">Export Journal Data</span>
                        </div>
                        <Icon name="chevron_right" className="text-text-muted group-hover:text-text-main transition-colors" />
                    </button>
                </div>
            </div>
            
            <div className="px-4 mt-8 mb-8">
                <button 
                    onClick={onSignOut}
                    className="w-full p-4 rounded-[1.5rem] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-red-400 font-bold flex items-center gap-4 transition-colors group border border-black/5 dark:border-white/5"
                >
                    <div className="w-11 h-11 rounded-xl bg-red-400/20 text-red-400 flex items-center justify-center shadow-[0_0_15px_rgba(248,113,113,0.2)]">
                        <Icon name="logout" />
                    </div>
                    <span className="text-base">Sign Out</span>
                </button>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.Onboarding);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntryText, setNewEntryText] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | undefined>(undefined);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState('#0ddff2');

  // Theme configuration for dynamic accent colors
  const THEMES = {
      '#0ddff2': { primary: '#0ddff2', dark: '#0abccb' }, // Neon Teal
      '#9B5DE5': { primary: '#9B5DE5', dark: '#7b4acb' }, // Soft Purple
      '#F15BB5': { primary: '#F15BB5', dark: '#d14b95' }, // Coral
  };

  // Hydrate with mock data
  useEffect(() => {
    // In a real app, this would come from a database
    const mock = MOCK_ENTRIES.map(e => ({...e, date: new Date(e.date)}));
    setEntries(mock);
  }, []);

  // Handle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle Accent Color Change
  useEffect(() => {
      const theme = THEMES[accentColor as keyof typeof THEMES];
      if (theme) {
          document.documentElement.style.setProperty('--color-primary', theme.primary);
          document.documentElement.style.setProperty('--color-primary-dark', theme.dark);
      }
  }, [accentColor]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleNavigate = (newScreen: Screen) => {
    setScreen(newScreen);
    if (newScreen !== Screen.Chat) {
        setSelectedEntry(undefined);
    }
  };

  const handleSignOut = () => {
      setScreen(Screen.Onboarding);
  };

  const startNewEntry = (text: string) => {
    setSelectedEntry(undefined);
    setNewEntryText(text);
    setScreen(Screen.Chat);
  };

  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setNewEntryText('');
    setScreen(Screen.Chat);
  };

  const handleSaveEntry = (partialEntry: Partial<JournalEntry>) => {
    if (partialEntry.id) {
        // Update existing entry
        setEntries(prev => prev.map(e => e.id === partialEntry.id ? { ...e, ...partialEntry } as JournalEntry : e));
    } else {
        // Create new entry
        const newEntry: JournalEntry = {
            id: Date.now().toString(),
            date: partialEntry.date || new Date(),
            summary: partialEntry.summary || partialEntry.fullText?.substring(0, 50) + '...' || '',
            fullText: partialEntry.fullText || '',
            mood: partialEntry.mood || 'neutral',
            messages: partialEntry.messages || []
        };
        setEntries(prev => [newEntry, ...prev]);
    }
    
    setScreen(Screen.Home);
    setNewEntryText('');
    setSelectedEntry(undefined);
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col mx-auto max-w-md shadow-2xl overflow-hidden relative font-sans text-text-main selection:bg-primary/30">
      
      {/* Global Background */}
      <BackgroundOrbs />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10">
        {screen === Screen.Onboarding && <Onboarding onComplete={() => setScreen(Screen.Home)} />}
        {screen === Screen.Home && (
            <Home 
                entries={entries} 
                onNewEntry={startNewEntry} 
                onViewEntry={handleViewEntry} 
                onNavigate={handleNavigate}
            />
        )}
        {screen === Screen.Chat && (
            <Chat 
                initialMessage={newEntryText}
                existingEntry={selectedEntry} 
                onClose={() => setScreen(Screen.Home)} 
                onSave={handleSaveEntry}
            />
        )}
        {screen === Screen.History && <History entries={entries} />}
        {screen === Screen.Insights && <Insights entries={entries} />}
        {screen === Screen.Settings && (
            <Settings 
                onNavigate={handleNavigate} 
                isDarkMode={isDarkMode} 
                toggleTheme={toggleTheme}
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                onSignOut={handleSignOut}
            />
        )}
      </main>

      {/* Bottom Navigation (Hidden on Chat/Onboarding) */}
      {screen !== Screen.Chat && screen !== Screen.Onboarding && (
        <BottomNav currentScreen={screen} onNavigate={handleNavigate} />
      )}
    </div>
  );
};

export default App;