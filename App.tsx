import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Plus, Trash2, Medal, X, Check } from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
import { db } from './firebase'; // Import your firebase config

// --- 1. Types ---

type Grade = '6B+' | '6C' | '6C+' | '7A' | '7A+' | '7B' | '7B+' | '7C' | '8A' | '8B+';

interface Benchmark {
  id: string;
  name: string;
  grade: Grade;
}

interface Completion {
  benchmarkId: string;
  rating: number; // 1-5
  date: string;
  gradeSuggestion: Grade;
}

interface Person {
  id: string;
  name: string;
  color: string;
  completions: Completion[];
}

interface RaceDefinition {
  id: string;
  name: string;
  targetGrades: Grade[];
}

// --- 2. The Log Ascent Modal Component ---

const LogAscentModal = ({ 
  isOpen, 
  onClose, 
  racer, 
  benchmarks 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  racer: Person | null;
  benchmarks: Benchmark[];
}) => {
  if (!isOpen || !racer) return null;

  const [formData, setFormData] = useState({
    benchmarkId: '',
    rating: 3,
    gradeSuggestion: '6C' as Grade,
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.benchmarkId) return;

    // Firebase: Add completion to the user's array
    const userRef = doc(db, 'users', racer.id);
    await updateDoc(userRef, {
      completions: arrayUnion({
        benchmarkId: formData.benchmarkId,
        rating: Number(formData.rating),
        date: formData.date,
        gradeSuggestion: formData.gradeSuggestion
      })
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Log Ascent for {racer.name}</h2>
          <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Benchmark Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Benchmark</label>
            <select 
              className="w-full border border-slate-300 rounded-lg p-2"
              required
              onChange={e => setFormData({...formData, benchmarkId: e.target.value})}
            >
              <option value="">Select a climb...</option>
              {benchmarks.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.grade})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rating (1-5)</label>
              <input 
                type="number" min="1" max="5"
                className="w-full border border-slate-300 rounded-lg p-2"
                value={formData.rating}
                onChange={e => setFormData({...formData, rating: Number(e.target.value)})}
              />
            </div>
            {/* Grade Suggestion */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grade Feel</label>
              <select 
                className="w-full border border-slate-300 rounded-lg p-2"
                value={formData.gradeSuggestion}
                onChange={e => setFormData({...formData, gradeSuggestion: e.target.value as Grade})}
              >
                {['6B+', '6C', '6C+', '7A', '7A+'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input 
              type="date"
              className="w-full border border-slate-300 rounded-lg p-2"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition flex justify-center items-center gap-2 mt-4"
          >
            <Check size={20} /> Log It!
          </button>
        </form>
      </div>
    </div>
  );
};

// --- 3. Main Component ---

export default function MoonboardRace() {
  const [people, setPeople] = useState<Person[]>([]);
  const [allBenchmarks, setAllBenchmarks] = useState<Benchmark[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRacer, setSelectedRacer] = useState<Person | null>(null);

  // Load Data from Firebase Realtime
  useEffect(() => {
    // 1. Listen to Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Person[];
      setPeople(usersData);
    });

    // 2. Listen to Benchmarks
    const unsubBenchmarks = onSnapshot(collection(db, 'benchmarks'), (snapshot) => {
      const benchData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Benchmark[];
      setAllBenchmarks(benchData);
    });

    return () => {
      unsubUsers();
      unsubBenchmarks();
    };
  }, []);

  const races: RaceDefinition[] = [
    { id: 'race1', name: 'The Warmup Cup (6B+)', targetGrades: ['6B+'] },
    { id: 'race2', name: 'The Crusher Derby (6C-6C+)', targetGrades: ['6C', '6C+'] },
  ];

  const handleAddPerson = async () => {
    const name = prompt("Enter climber name:");
    if (!name) return;
    
    await addDoc(collection(db, 'users'), {
      name,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      completions: []
    });
  };

  const handleRemovePerson = async (id: string) => {
    if(confirm("Remove this climber?")) {
      await deleteDoc(doc(db, 'users', id));
    }
  };

  const openLogModal = (person: Person) => {
    setSelectedRacer(person);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Moonboard Derby
          </h1>
          <p className="text-slate-500">Live race tracking powered by Firestore</p>
        </div>
        <button 
          onClick={handleAddPerson}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={18} /> Add Climber
        </button>
      </header>

      <div className="space-y-12">
        {races.map((race) => (
          <RaceTrack 
            key={race.id} 
            race={race} 
            people={people} 
            allBenchmarks={allBenchmarks}
            onRemovePerson={handleRemovePerson}
            onLogAscent={openLogModal} // Pass the opener down
          />
        ))}
      </div>

      <LogAscentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        racer={selectedRacer}
        benchmarks={allBenchmarks}
      />
    </div>
  );
}

// --- 4. The Race Track (Updated with Log Button) ---

const RaceTrack = ({ 
  race, 
  people, 
  allBenchmarks,
  onRemovePerson,
  onLogAscent 
}: { 
  race: RaceDefinition, 
  people: Person[], 
  allBenchmarks: Benchmark[],
  onRemovePerson: (id: string) => void,
  onLogAscent: (p: Person) => void
}) => {
  
  const raceBenchmarks = useMemo(() => 
    allBenchmarks.filter(b => race.targetGrades.includes(b.grade)),
  [allBenchmarks, race]);

  const totalDistance = raceBenchmarks.length;

  const racers = useMemo(() => {
    return people.map(person => {
      const completedIds = new Set(person.completions?.map(c => c.benchmarkId) || []);
      const validCompletions = raceBenchmarks.filter(b => completedIds.has(b.id));
      const score = validCompletions.length;
      const percentage = totalDistance === 0 ? 0 : (score / totalDistance) * 100;
      return { ...person, score, percentage };
    }).sort((a, b) => b.score - a.score);
  }, [people, raceBenchmarks, totalDistance]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">{race.name}</h2>
        <span className="text-sm bg-slate-700 px-3 py-1 rounded-full">
           Target: {race.targetGrades.join(', ')} • Total Problems: {totalDistance}
        </span>
      </div>

      <div className="p-6 space-y-8 relative">
        <div className="absolute right-6 top-0 bottom-0 w-px border-r-2 border-dashed border-slate-300 z-0 flex flex-col justify-end pb-2">
           <span className="text-xs text-slate-400 text-right pr-2">FINISH</span>
        </div>

        {racers.map((racer) => (
          <div key={racer.id} className="relative z-10 group">
            {/* Header Row for each Racer */}
            <div className="flex items-center gap-4 mb-2">
              <div className="w-24 text-sm font-bold text-slate-700 truncate">{racer.name}</div>
              <div className="text-xs text-slate-400 w-24">
                {racer.score} / {totalDistance}
              </div>
              
              {/* Action Buttons (Visible on Hover) */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onLogAscent(racer)}
                  className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200"
                >
                  Log Ascent
                </button>
                <button onClick={() => onRemovePerson(racer.id)} className="text-slate-300 hover:text-red-500">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
            
            {/* Track */}
            <div className="h-10 bg-slate-100 rounded-lg relative w-full border border-slate-200">
              <div 
                className="absolute top-0 bottom-0 transition-all duration-1000 ease-out flex items-center"
                style={{ width: `${Math.max(racer.percentage, 5)}%` }}
              >
                <div 
                  className="absolute inset-0 opacity-20 rounded-l-lg"
                  style={{ backgroundColor: racer.color }}
                ></div>
                <div className="absolute right-0 translate-x-1/2 -mt-2 filter drop-shadow-sm transform hover:scale-110 transition-transform">
                  <HorseIcon color={racer.color} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HorseIcon = ({ color }: { color: string }) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill={color} stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 18a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
    <path d="M15 18a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
    <path d="M6 15v-5a3 3 0 0 1 3 -3h7.614a2 2 0 0 1 1.64 .854l2.746 4.146" />
    <path d="M5.5 8.5l2.5 -2.5h8.497" />
    <path d="M13 13v5.5" />
  </svg>
);