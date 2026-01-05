import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Calendar, BookOpen, ChevronDown, ChevronUp, 
  MapPin, User, CheckCircle, Filter, Plus, X 
} from 'lucide-react';
import { 
  collection, onSnapshot, doc, updateDoc, 
  arrayUnion, setDoc, getDoc, arrayRemove 
} from 'firebase/firestore';
import { db } from './firebase';

// --- Types ---
type Grade = '6B+' | '6C' | '6C+' | '7A' | '7A+' | '7B' | '7B+' | '7C' | '8A' | '8B+';

interface Benchmark {
  id: string;
  name: string;
  grade: Grade;
}

interface Completion {
  benchmarkId: string;
  rating: number;
  date: string;
  gradeSuggestion: Grade;
}

interface Person {
  id: string;
  name: string;
  color: string;
  completions: Completion[];
}

interface ScheduleEntry {
  userId: string;
  userName: string;
  location: string;
}

interface DaySchedule {
  date: string; // YYYY-MM-DD
  sessions: ScheduleEntry[];
}

interface RaceDefinition {
  id: string;
  name: string;
  targetGrades: Grade[];
}

// --- Helper Components ---

// 1. Mobile "Drill Down" Accordion Box
const AccordionItem = ({ 
  title, 
  icon: Icon, 
  isOpen, 
  onClick, 
  children 
}: { 
  title: string, 
  icon: any, 
  isOpen: boolean, 
  onClick: () => void, 
  children: React.ReactNode 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
      <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 ${isOpen ? 'bg-slate-50 border-b border-slate-100' : 'bg-white'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
            <Icon size={20} />
          </div>
          <span className="font-bold text-slate-700">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
      </button>
      
      {isOpen && (
        <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

// --- Module 1: Calendar Box ---
const CalendarModule = ({ people }: { people: Person[] }) => {
  const [dates, setDates] = useState<string[]>([]);
  const [scheduleData, setScheduleData] = useState<Record<string, ScheduleEntry[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Form State
  const [selectedUser, setSelectedUser] = useState('');
  const [location, setLocation] = useState('Moonboard');

  // Generate next 7 days
  useEffect(() => {
    const d = [];
    for(let i=0; i<7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      d.push(date.toISOString().split('T')[0]);
    }
    setDates(d);
    setSelectedDate(d[0]);
  }, []);

  // Listen to Schedule Collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'schedule'), (snapshot) => {
      const data: Record<string, ScheduleEntry[]> = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data().sessions || [];
      });
      setScheduleData(data);
    });
    return () => unsub();
  }, []);

  const handleJoin = async () => {
    if (!selectedUser || !location) return;
    const user = people.find(p => p.id === selectedUser);
    if (!user) return;

    const docRef = doc(db, 'schedule', selectedDate);
    // Use setDoc with merge to ensure document exists
    await setDoc(docRef, {
      sessions: arrayUnion({
        userId: user.id,
        userName: user.name,
        location: location
      })
    }, { merge: true });
    
    setLocation('Moonboard'); // Reset location but keep user for ease
  };

  const handleLeave = async (entry: ScheduleEntry) => {
     const docRef = doc(db, 'schedule', selectedDate);
     await updateDoc(docRef, {
       sessions: arrayRemove(entry)
     });
  };

  const currentSessions = scheduleData[selectedDate] || [];

  return (
    <div className="space-y-4">
      {/* Date Scroller */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
        {dates.map(date => {
          const isSelected = date === selectedDate;
          const hasSesh = (scheduleData[date]?.length || 0) > 0;
          const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = new Date(date).getDate();

          return (
            <button 
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border transition-all
                ${isSelected 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-500'
                }`}
            >
              <span className="text-xs font-medium uppercase">{dayName}</span>
              <span className="text-xl font-bold">{dayNum}</span>
              {hasSesh && (
                <div className={`mt-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Daily View */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">
          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        
        {currentSessions.length === 0 ? (
          <p className="text-slate-400 text-sm italic">No sessions planned yet.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {currentSessions.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                   <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                     <User size={16} />
                   </div>
                   <div>
                     <p className="font-bold text-sm text-slate-800">{s.userName}</p>
                     <p className="text-xs text-slate-500 flex items-center gap-1">
                       <MapPin size={10} /> {s.location}
                     </p>
                   </div>
                </div>
                <button onClick={() => handleLeave(s)} className="text-slate-300 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Session Form */}
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
           <select 
             className="w-full text-sm p-2 rounded-md border border-slate-300"
             value={selectedUser}
             onChange={(e) => setSelectedUser(e.target.value)}
           >
             <option value="">Who?</option>
             {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
           <input 
             type="text" 
             placeholder="Where?" 
             className="w-full text-sm p-2 rounded-md border border-slate-300"
             value={location}
             onChange={(e) => setLocation(e.target.value)}
           />
           <button 
             onClick={handleJoin}
             disabled={!selectedUser}
             className="bg-indigo-600 text-white p-2 rounded-md disabled:opacity-50"
           >
             <Plus size={20} />
           </button>
        </div>
      </div>
    </div>
  );
};

// --- Module 2: Leaderboard Box ---
const LeaderboardModule = ({ people, benchmarks }: { people: Person[], benchmarks: Benchmark[] }) => {
  const [selectedGrade, setSelectedGrade] = useState<string>('6B+');
  
  // Define available races dynamically based on grades
  const availableGrades = ['6B+', '6C', '6C+', '7A', '7A+'];
  
  const raceData = useMemo(() => {
    // Filter benchmarks for this grade
    const targetBenchmarks = benchmarks.filter(b => b.grade === selectedGrade);
    const total = targetBenchmarks.length;

    const racers = people.map(p => {
      const completedIds = new Set(p.completions.map(c => c.benchmarkId));
      const score = targetBenchmarks.filter(b => completedIds.has(b.id)).length;
      const percent = total === 0 ? 0 : (score / total) * 100;
      return { ...p, score, percent };
    }).sort((a, b) => b.score - a.score);

    return { total, racers };
  }, [people, benchmarks, selectedGrade]);

  return (
    <div>
      <div className="mb-4">
        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Select League</label>
        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
          {availableGrades.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors
                ${selectedGrade === g 
                  ? 'bg-yellow-400 text-yellow-900' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Grade {g}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {raceData.racers.map((racer, idx) => (
          <div key={racer.id} className="relative">
             <div className="flex justify-between text-xs mb-1">
               <span className="font-bold text-slate-700">
                 {idx + 1}. {racer.name}
               </span>
               <span className="text-slate-500">{racer.score} / {raceData.total}</span>
             </div>
             <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
               <div 
                 className="h-full rounded-full transition-all duration-1000"
                 style={{ 
                   width: `${racer.percent}%`, 
                   backgroundColor: racer.color 
                 }}
               />
             </div>
          </div>
        ))}
        {raceData.total === 0 && <div className="text-center text-sm text-slate-400">No benchmarks found for this grade.</div>}
      </div>
    </div>
  );
};

// --- Module 3: Logbook Box ---
const LogbookModule = ({ people, benchmarks }: { people: Person[], benchmarks: Benchmark[] }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'completed' | 'all'>('completed');

  const activeUser = people.find(p => p.id === selectedUserId);

  // Derive the list of climbs to show
  const displayList = useMemo(() => {
    if (!activeUser) return [];

    let list = [];
    const completedSet = new Set(activeUser.completions.map(c => c.benchmarkId));

    if (viewMode === 'completed') {
      // Show only completions
      list = activeUser.completions.map(c => {
        const bench = benchmarks.find(b => b.id === c.benchmarkId);
        return { 
          name: bench?.name || 'Unknown', 
          grade: bench?.grade || '?', 
          date: c.date, 
          rating: c.rating,
          isDone: true 
        };
      });
    } else {
      // Show ALL benchmarks (to see what is left)
      list = benchmarks.map(b => ({
        name: b.name,
        grade: b.grade,
        date: null,
        rating: null,
        isDone: completedSet.has(b.id)
      }));
    }

    // Apply Grade Filter
    if (filterGrade !== 'All') {
      list = list.filter(item => item.grade === filterGrade);
    }

    return list.sort((a, b) => {
        // Sort by date desc for completions, or name for list
        if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
        return 0;
    });

  }, [activeUser, benchmarks, viewMode, filterGrade]);

  return (
    <div className="space-y-4">
      {/* 1. Select User */}
      <select 
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
      >
        <option value="">Select a Climber's Logbook...</option>
        {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {activeUser && (
        <div className="animate-in fade-in duration-300">
          {/* 2. Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setViewMode(viewMode === 'completed' ? 'all' : 'completed')}
              className="flex items-center gap-1 px-3 py-2 bg-slate-100 rounded-lg text-xs font-bold whitespace-nowrap"
            >
              {viewMode === 'completed' ? <CheckCircle size={14} className="text-green-600"/> : <BookOpen size={14}/>}
              {viewMode === 'completed' ? 'Showing Sends' : 'Showing All'}
            </button>
            
            <select 
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-bold border-none outline-none"
            >
              <option value="All">All Grades</option>
              <option value="6B+">6B+</option>
              <option value="6C">6C</option>
              <option value="6C+">6C+</option>
              <option value="7A">7A</option>
            </select>
          </div>

          {/* 3. List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {displayList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No climbs found matching filters.</div>
            ) : (
              displayList.map((climb, i) => (
                <div key={i} className={`p-3 rounded-lg border flex justify-between items-center ${climb.isDone ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent opacity-60'}`}>
                   <div>
                     <div className="font-bold text-sm text-slate-800">{climb.name}</div>
                     <div className="text-xs text-slate-500">{climb.grade} • {climb.date || 'Not sent'}</div>
                   </div>
                   {climb.isDone && (
                     <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                       {climb.rating}/5
                     </div>
                   )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

export default function MoonboardApp() {
  const [people, setPeople] = useState<Person[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  
  // Accordion State: 1 = Calendar, 2 = Leaderboard, 3 = Logbook
  // By default, maybe have Calendar open?
  const [openSection, setOpenSection] = useState<number | null>(1);

  const toggleSection = (id: number) => {
    setOpenSection(openSection === id ? null : id);
  };

  // Data Loading
  useEffect(() => {
    const unsubP = onSnapshot(collection(db, 'users'), s => setPeople(s.docs.map(d => ({id:d.id, ...d.data()} as Person))));
    const unsubB = onSnapshot(collection(db, 'benchmarks'), s => setBenchmarks(s.docs.map(d => ({id:d.id, ...d.data()} as Benchmark))));
    return () => { unsubP(); unsubB(); };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      
      {/* Description / Header */}
      <div className="bg-slate-900 text-white p-6 pb-12 rounded-b-[2rem] shadow-lg mb-[-1rem]">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-yellow-400" /> MoonBoard Race
          </h1>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed max-w-md">
          Track your benchmarks, organize sessions, and compete for the grade crown. 
          Use the tools below to manage your training.
        </p>
      </div>

      {/* Accordion Container */}
      <div className="px-4 space-y-4 relative z-10">
        
        {/* Box 1: Calendar */}
        <AccordionItem 
          title="Session Calendar" 
          icon={Calendar} 
          isOpen={openSection === 1} 
          onClick={() => toggleSection(1)}
        >
          <CalendarModule people={people} />
        </AccordionItem>

        {/* Box 2: Leaderboard */}
        <AccordionItem 
          title="Race Leaderboards" 
          icon={Trophy} 
          isOpen={openSection === 2} 
          onClick={() => toggleSection(2)}
        >
          <LeaderboardModule people={people} benchmarks={benchmarks} />
        </AccordionItem>

        {/* Box 3: Logbook */}
        <AccordionItem 
          title="Climber Logbooks" 
          icon={BookOpen} 
          isOpen={openSection === 3} 
          onClick={() => toggleSection(3)}
        >
          <LogbookModule people={people} benchmarks={benchmarks} />
        </AccordionItem>

      </div>
    </div>
  );
}
