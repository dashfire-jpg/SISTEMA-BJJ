
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, CalendarCheck, DollarSign, Trophy, Plus, Menu, X, LogOut, 
  Medal, CheckCircle2, Home, Star, UserPlus, 
  Edit, ArrowRight, Clock, Database, Download, FileJson, 
  ShieldAlert, RotateCcw, VolumeX, Fingerprint, Calendar as CalendarIcon, 
  Info, Bell, Cake, ChevronRight, Play, Pause, Trash2, Upload, LayoutDashboard,
  Smartphone, UserCheck, Layers, Filter, FileText, Printer, Save
} from 'lucide-react';
import { Athlete, Transaction, AppView, Belt, AdminProfile, TrainingClass } from './types';
import { getDojoInsights } from './geminiService';
import { generateFinancialReport, generateBirthdayMural } from './pdfService';

const BELT_COLORS: Record<string, string> = {
  'Branca': '#f8fafc',
  'Cinza': '#64748b',
  'Amarela': '#fbbf24',
  'Laranja': '#f97316',
  'Verde': '#16a34a',
  'Azul': '#2563eb',
  'Roxa': '#7c3aed',
  'Marrom': '#78330f',
  'Preta': '#0f172a'
};

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/2906/2906474.png";

const BeltBadge: React.FC<{ belt: Belt; degrees: number }> = ({ belt, degrees }) => (
  <div className="flex items-center gap-2">
    <div 
      className="h-4 w-12 sm:h-5 sm:w-16 rounded shadow-inner border border-slate-800 flex relative overflow-hidden shrink-0"
      style={{ backgroundColor: BELT_COLORS[belt] || '#fff' }}
    >
      <div className={`absolute right-0 top-0 bottom-0 w-4 sm:w-5 ${belt === 'Preta' ? 'bg-red-600' : 'bg-slate-950'} flex items-center justify-center gap-0.5 px-0.5`}>
        {Array.from({ length: Math.min(degrees, 4) }).map((_, i) => (
          <div key={i} className="w-[1px] sm:w-[1.5px] h-2 sm:h-3 bg-white" />
        ))}
      </div>
    </div>
    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter text-slate-400 truncate">{belt}</span>
  </div>
);

const PWAInstallPrompt: React.FC<{ logoUrl: string }> = ({ logoUrl }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    // Show prompt for iOS if not standalone
    if (ios && !standalone) {
      setShowPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[300] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-[2.5rem] shadow-2xl flex flex-col gap-4 max-w-sm backdrop-blur-xl bg-slate-900/90">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
            <img 
              src={logoUrl} 
              alt="SYSBJJ Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-black uppercase italic text-lg leading-none">Instalar SYSBJJ</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Acesse mais rápido do seu tatame</p>
          </div>
          <button onClick={() => setShowPrompt(false)} className="text-slate-500 hover:text-white p-2">
            <X size={24} />
          </button>
        </div>

        {isIOS ? (
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <p className="text-slate-300 text-[11px] font-medium leading-relaxed">
              Para instalar no seu iPhone:<br/>
              1. Toque no ícone de <span className="text-amber-500 font-bold">Compartilhar</span> (quadrado com seta) abaixo.<br/>
              2. Role para baixo e toque em <span className="text-amber-500 font-bold">Adicionar à Tela de Início</span>.
            </p>
          </div>
        ) : (
          <button 
            onClick={handleInstall}
            className="w-full bg-amber-500 text-slate-950 font-black py-5 rounded-2xl hover:bg-amber-400 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <Smartphone size={20} /> Instalar Agora
          </button>
        )}
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

type AlarmType = 'buzzer' | 'bell' | 'MATE' | 'FIM';

const App: React.FC = () => {
  const STORAGE_KEY_ATHLETES = 'sistemabjj_athletes_prod';
  const STORAGE_KEY_TRANSACTIONS = 'sistemabjj_transactions_prod';
  const STORAGE_KEY_ADMIN = 'sistemabjj_admin_prod';
  const STORAGE_KEY_CLASSES = 'sistemabjj_classes_prod';

  const [athletes, setAthletes] = useState<Athlete[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEY_ATHLETES) || '[]'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEY_TRANSACTIONS) || '[]'));
  const [classes, setClasses] = useState<TrainingClass[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEY_CLASSES) || '[]'));
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(() => JSON.parse(localStorage.getItem(STORAGE_KEY_ADMIN) || 'null'));
  const [logoPreview, setLogoPreview] = useState<string>(adminProfile?.logoUrl || DEFAULT_LOGO);

  // UI State
  const [user, setUser] = useState<{name: string, role: string} | null>(() => {
    const admin = JSON.parse(localStorage.getItem(STORAGE_KEY_ADMIN) || 'null');
    return admin ? { name: admin.name, role: 'admin' } : null;
  });
  const [view, setView] = useState<AppView>(AppView.Login);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'athlete' | 'transaction' | 'class'>('athlete');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // Timer State
  const [timeLeft, setTimeLeft] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmType>('buzzer');
  const [manualMin, setManualMin] = useState(5);
  const [manualSec, setManualSec] = useState(0);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Persistência
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ATHLETES, JSON.stringify(athletes));
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
    if (adminProfile) localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(adminProfile));
  }, [athletes, transactions, classes, adminProfile]);

  useEffect(() => {
    if (!adminProfile?.registered && view !== AppView.AdminRegistration) {
      setView(AppView.AdminRegistration);
    }
  }, [adminProfile]);

  useEffect(() => {
    if (user?.role === 'admin' && athletes.length > 0 && view === AppView.Dashboard) {
      getDojoInsights(athletes, transactions).then(setAiInsight);
    }
  }, [view, user, athletes.length]);

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerIntervalRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      triggerAlarm();
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isTimerRunning, timeLeft]);

  const triggerAlarm = () => {
    stopAlarm();
    setIsAlarmPlaying(true);
    const play = () => {
      if (['MATE', 'FIM'].includes(selectedAlarm)) {
        const msg = new SpeechSynthesisUtterance(selectedAlarm === 'MATE' ? 'MATÊ!' : 'FIM DE ROUND!');
        msg.lang = 'pt-BR';
        window.speechSynthesis.speak(msg);
      } else {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(selectedAlarm === 'buzzer' ? 140 : 880, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 1.2);
      }
    };
    alarmIntervalRef.current = window.setInterval(play, 3500);
    play();
  };

  const stopAlarm = () => {
    setIsAlarmPlaying(false);
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    window.speechSynthesis.cancel();
  };

  const stats = useMemo(() => {
    const today = new Date().getDate();
    const currentMonth = new Date().getMonth();
    const imminent = athletes.filter(a => a.status === 'active' && (a.paymentDay === today || (a.paymentDay > today && a.paymentDay - today <= 3)));
    const birthdays = athletes.filter(a => a.birthDate && new Date(a.birthDate).getMonth() === currentMonth);
    const ranking = [...athletes].sort((a, b) => b.attendanceCount - a.attendanceCount);
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { imminent, birthdays, ranking, balance: income - expense, income, expense };
  }, [athletes, transactions]);

  const markAttendance = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setAthletes(prev => prev.map(a => a.id === id && a.lastAttendance !== today ? { ...a, attendanceCount: a.attendanceCount + 1, lastAttendance: today } : a));
  };

  const navigateTo = (v: AppView) => { 
    setView(v); 
    setIsMobileMenuOpen(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleLogout = () => {
    setUser(null);
    setView(AppView.Login);
    setIsMobileMenuOpen(false);
  };

  const exportData = () => {
    const data = { athletes, transactions, classes, adminProfile };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_bjj_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.athletes) setAthletes(data.athletes);
        if (data.transactions) setTransactions(data.transactions);
        if (data.classes) setClasses(data.classes);
        if (data.adminProfile) setAdminProfile(data.adminProfile);
        alert("Backup restaurado com sucesso! OSS!");
      } catch (err) {
        alert("Erro ao importar backup. Verifique o arquivo.");
      }
    };
    reader.readAsText(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback?: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      if (callback) callback(base64);
    };
    reader.readAsDataURL(file);
  };

  // VISTAS
  if (view === AppView.AdminRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          const f = new FormData(e.currentTarget); 
          const newAdmin = { 
            name: f.get('name'), 
            dojoName: f.get('dojoName'), 
            logoUrl: logoPreview,
            password: '', 
            registered: true 
          }; 
          setAdminProfile(newAdmin as any); 
          setUser({ name: newAdmin.name as string, role: 'admin' });
          setView(AppView.Dashboard);
        }} className="bg-slate-900 p-8 sm:p-12 rounded-[3rem] border border-slate-800 w-full max-w-xl shadow-2xl space-y-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div className="relative group mx-auto w-32 h-32">
            <div className="w-32 h-32 bg-amber-500 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden">
              <img src={logoPreview} alt="Logo" className="w-24 h-24 object-contain" />
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl cursor-pointer">
              <Upload size={32} className="text-white" />
              <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e)} className="hidden" />
            </label>
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Ativar SYSBJJ</h2>
          <div className="space-y-6 text-left">
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Seu Nome Mestre</label><input required name="name" placeholder="NOME DO SENSEI" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl text-white font-black uppercase text-xs focus:ring-2 focus:ring-amber-500 outline-none" /></div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Nome da Academia</label><input required name="dojoName" placeholder="EX: GRACIE BARRA" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl text-white font-black uppercase text-xs focus:ring-2 focus:ring-amber-500 outline-none" /></div>
            <p className="text-[9px] text-slate-500 font-bold uppercase text-center">Toque no ícone acima para escolher seu logo</p>
          </div>
          <button type="submit" className="w-full bg-amber-500 text-slate-950 font-black p-6 rounded-2xl uppercase italic text-sm hover:bg-white active:scale-95 transition-all shadow-xl tracking-widest">Ativar Sistema OSS!</button>
        </form>
      </div>
    );
  }

  if (view === AppView.Login || !user) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-white">
            <div className="bg-slate-900 p-10 sm:p-16 rounded-[4rem] border border-slate-800 w-full max-w-lg shadow-[0_30px_100px_rgba(0,0,0,0.6)] text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                <div className="w-24 h-24 bg-amber-500 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl transform group-hover:rotate-6 transition-transform overflow-hidden">
                   <img src={adminProfile?.logoUrl || DEFAULT_LOGO} alt="Logo" className="w-16 h-16 object-contain" />
                </div>
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2 leading-none">SYSBJJ</h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-12">{adminProfile?.dojoName || "Portal de Acesso"}</p>
                
                <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => { setUser({ name: adminProfile?.name || 'Mestre', role: 'admin' }); setView(AppView.Dashboard); }} className="w-full bg-white text-slate-950 font-black p-6 rounded-2xl hover:bg-amber-500 transition-all uppercase italic text-sm flex items-center justify-center gap-3 active:scale-95 shadow-xl group">
                       <LayoutDashboard size={20} /> Acessar Painel <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => { setView(AppView.Ranking); setUser({ name: 'Visitante', role: 'student' }); }} className="w-full bg-slate-800 text-white font-black p-6 rounded-2xl hover:bg-slate-700 transition-all uppercase italic text-sm flex items-center justify-center gap-3 active:scale-95 border border-slate-700">
                       <Trophy size={20} className="text-amber-500" /> Ver Ranking
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-['Inter'] selection:bg-amber-500 relative">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="w-64 lg:w-72 bg-slate-900 border-r border-slate-800 p-6 hidden md:flex flex-col gap-6 sticky top-0 h-screen z-50">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg overflow-hidden shrink-0">
            <img src={adminProfile?.logoUrl || DEFAULT_LOGO} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">SYSBJJ</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
          {[
            { v: AppView.Dashboard, i: Home, t: "Início" },
            { v: AppView.Classes, i: Layers, t: "Aulas / Turmas" },
            { v: AppView.Athletes, i: Users, t: "Alunos" },
            { v: AppView.Attendance, i: CalendarCheck, t: "Chamada" },
            { v: AppView.Finance, i: DollarSign, t: "Financeiro" },
            { v: AppView.Ranking, i: Trophy, t: "Ranking" },
            { v: AppView.Birthdays, i: Cake, t: "B-Days" },
            { v: AppView.Timer, i: Clock, t: "Timer" },
            { v: AppView.Settings, i: Database, t: "Ajustes" }
          ].map(item => (
            <button key={item.v} onClick={() => navigateTo(item.v)} className={`w-full flex items-center space-x-3 p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${view === item.v ? 'bg-amber-500 text-slate-950 shadow-xl' : 'text-slate-400 hover:bg-slate-800'}`}>
              <item.i size={18} /><span>{item.t}</span>
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="w-full flex items-center space-x-3 p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-red-500 hover:bg-red-500/10 transition-all mt-auto"><LogOut size={16}/> Sair</button>
      </aside>

      <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-y-auto pb-32 md:pb-12 max-w-full">
        {/* DASHBOARD */}
        {view === AppView.Dashboard && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center text-amber-500 shadow-xl"><Medal size={28}/></div>
                  <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{adminProfile?.dojoName}</h2>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Sensei: {user.name} OSS!</p>
                  </div>
                </div>
             </header>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => navigateTo(AppView.Classes)} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-all shadow-lg active:scale-95"><p className="text-[10px] font-black text-slate-500 uppercase mb-2">Turmas</p><p className="text-3xl font-black text-white">{classes.length}</p></div>
                <div onClick={() => navigateTo(AppView.Athletes)} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-all shadow-lg active:scale-95"><p className="text-[10px] font-black text-slate-500 uppercase mb-2">Matrículas</p><p className="text-3xl font-black text-white">{athletes.length}</p></div>
                <div onClick={() => navigateTo(AppView.Finance)} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 border-b-emerald-500 cursor-pointer shadow-lg active:scale-95"><p className="text-[10px] font-black text-emerald-500 uppercase mb-2">Caixa</p><p className="text-3xl font-black text-white">R$ {stats.balance.toFixed(0)}</p></div>
                <div onClick={() => navigateTo(AppView.Birthdays)} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 border-b-indigo-500 shadow-lg cursor-pointer active:scale-95"><p className="text-[10px] font-black text-indigo-500 uppercase mb-2">B-Days</p><p className="text-3xl font-black text-white">{stats.birthdays.length}</p></div>
             </div>

             <div className="bg-amber-500 text-slate-950 p-8 sm:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border-2 border-amber-400">
                <Star size={140} className="absolute -bottom-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000" />
                <div className="flex items-center gap-2 mb-4">
                  <Star size={20} fill="currentColor"/>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter">Sensei IA Insight</h3>
                </div>
                <p className="text-sm sm:text-base font-bold italic leading-relaxed whitespace-pre-line relative z-10">"{aiInsight || "Ajustando o kimono... Preparando sua consultoria. OSS!"}"</p>
             </div>
          </div>
        )}

        {/* TURMAS */}
        {view === AppView.Classes && (
           <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500 max-w-6xl mx-auto">
             <header className="flex justify-between items-center gap-4">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Aulas / Turmas</h2>
                <button onClick={() => { setForm({ name: '', schedule: '19:00 - 20:30', days: 'Seg, Qua, Sex', color: '#f59e0b' }); setEditId(null); setModalType('class'); setIsModalOpen(true); }} className="bg-amber-500 text-slate-950 px-5 py-3 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Plus size={18} /> Nova Turma</button>
             </header>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.length > 0 ? classes.map(cls => (
                   <div key={cls.id} className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl hover:border-amber-500/50 transition-all">
                      <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: cls.color }}></div>
                      <h4 className="text-xl font-black uppercase italic text-white mb-2">{cls.name}</h4>
                      <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">{cls.schedule}</p>
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6">{cls.days}</p>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-slate-400">
                            <Users size={16}/>
                            <span className="text-[10px] font-black uppercase">{athletes.filter(a => a.classId === cls.id).length} Alunos</span>
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setForm(cls); setEditId(cls.id); setModalType('class'); setIsModalOpen(true); }} className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"><Edit size={16}/></button>
                            <button onClick={() => { if(confirm("Deseja apagar esta turma?")) setClasses(prev => prev.filter(c => c.id !== cls.id)); }} className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                         </div>
                      </div>
                   </div>
                )) : (
                   <div className="col-span-full p-20 text-center opacity-20 border-2 border-dashed border-slate-800 rounded-[3rem]">
                      <Layers size={64} className="mx-auto mb-4"/>
                      <p className="text-xs font-black uppercase tracking-widest">Nenhuma turma configurada</p>
                   </div>
                )}
             </div>
           </div>
        )}

        {/* ALUNOS */}
        {view === AppView.Athletes && (
           <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
             <header className="flex justify-between items-center gap-4">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Guerreiros</h2>
                <button onClick={() => { setForm({ name: '', belt: 'Branca', paymentDay: 10, category: 'Adulto', degrees: 0, classId: '', birthDate: '', status: 'active' }); setEditId(null); setModalType('athlete'); setIsModalOpen(true); }} className="bg-amber-500 text-slate-950 px-5 py-3 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Plus size={18} /> Novo Atleta</button>
             </header>
             <div className="grid grid-cols-1 gap-3">
                {athletes.length > 0 ? athletes.map(ath => (
                   <div key={ath.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl hover:border-slate-700 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center font-black text-amber-500 italic shadow-inner">OSS</div>
                           <div className="overflow-hidden">
                              <p className="font-black uppercase text-sm italic truncate text-white">{ath.name}</p>
                              <div className="flex items-center gap-3">
                                <BeltBadge belt={ath.belt} degrees={ath.degrees} />
                                {ath.classId && (
                                   <span className="text-[8px] font-black uppercase text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                      {classes.find(c => c.id === ath.classId)?.name}
                                   </span>
                                )}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                           <div className="flex gap-2">
                              <button onClick={() => { setForm(ath); setEditId(ath.id); setModalType('athlete'); setIsModalOpen(true); }} className="p-4 bg-slate-800 rounded-xl text-slate-400 hover:text-amber-500 transition-all active:scale-90"><Edit size={20} /></button>
                              <button onClick={() => { if(confirm("Deseja remover este atleta?")) setAthletes(prev => prev.filter(a => a.id !== ath.id)); }} className="p-4 bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-all active:scale-90"><Trash2 size={20} /></button>
                           </div>
                        </div>
                   </div>
                )) : (
                  <div className="p-20 text-center opacity-20 border-2 border-dashed border-slate-800 rounded-[3rem]">
                    <Users size={64} className="mx-auto mb-4"/>
                    <p className="text-xs font-black uppercase tracking-widest">Nenhum atleta cadastrado</p>
                  </div>
                )}
             </div>
           </div>
        )}

        {/* CHAMADA */}
        {view === AppView.Attendance && (
           <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
             <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Lista de Presença</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                   <Filter size={18} className="text-slate-500"/>
                   <select 
                      value={selectedClassId} 
                      onChange={e => setSelectedClassId(e.target.value)}
                      className="flex-1 sm:flex-none bg-slate-900 border border-slate-800 text-[10px] font-black uppercase text-white p-3 rounded-xl outline-none"
                    >
                      <option value="all">TODOS OS ALUNOS</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {athletes
                  .filter(a => a.status === 'active' && (selectedClassId === 'all' || a.classId === selectedClassId))
                  .map(ath => {
                   const isPresentToday = ath.lastAttendance === new Date().toISOString().split('T')[0];
                   return (
                     <button key={ath.id} onClick={() => !isPresentToday && markAttendance(ath.id)} className={`p-7 rounded-[2.5rem] border transition-all flex items-center justify-between text-left group shadow-lg ${isPresentToday ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800 active:scale-95'}`}>
                        <div className="overflow-hidden pr-4">
                          <p className={`font-black uppercase italic text-sm truncate ${isPresentToday ? 'text-emerald-500' : 'text-white'}`}>{ath.name}</p>
                          <div className="flex items-center gap-2">
                             <BeltBadge belt={ath.belt} degrees={ath.degrees} />
                          </div>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${isPresentToday ? 'bg-emerald-500 text-white shadow-xl' : 'bg-slate-800 text-slate-700'}`}>
                           {isPresentToday ? <CheckCircle2 size={28}/> : <Plus size={28}/>}
                        </div>
                     </button>
                   );
                })}
             </div>
           </div>
        )}

        {/* FINANCEIRO */}
        {view === AppView.Finance && (
          <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
             <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Gestão Financeira</h2>
                <div className="flex gap-3 w-full sm:w-auto">
                   <button onClick={() => { setForm({ type: 'income', date: new Date().toISOString().split('T')[0], amount: 0, description: '' }); setModalType('transaction'); setIsModalOpen(true); }} className="flex-1 sm:flex-none bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">Receita</button>
                   <button onClick={() => { setForm({ type: 'expense', date: new Date().toISOString().split('T')[0], amount: 0, description: '' }); setModalType('transaction'); setIsModalOpen(true); }} className="flex-1 sm:flex-none bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">Despesa</button>
                </div>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl"><p className="text-[10px] font-black text-slate-500 uppercase mb-2">Saldo Atual</p><p className={`text-4xl font-black ${stats.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>R$ {stats.balance.toFixed(2)}</p></div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 border-b-emerald-500 shadow-xl"><p className="text-[10px] font-black text-emerald-500 uppercase mb-2">Entradas</p><p className="text-4xl font-black text-white">R$ {stats.income.toFixed(0)}</p></div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 border-b-red-600 shadow-xl"><p className="text-[10px] font-black text-red-600 uppercase mb-2">Saídas</p><p className="text-4xl font-black text-white">R$ {stats.expense.toFixed(0)}</p></div>
             </div>

             <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-wrap gap-4 items-center justify-between shadow-xl">
                <div><h4 className="text-sm font-black uppercase text-white mb-1">Exportar Relatórios</h4><p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Documentos em formato PDF prontos para impressão</p></div>
                <div className="flex gap-3">
                   <button onClick={() => generateFinancialReport(transactions, adminProfile, 'Mensal')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] transition-all"><FileText size={16} className="text-amber-500"/> PDF Mensal</button>
                   <button onClick={() => generateFinancialReport(transactions, adminProfile, 'Anual')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] transition-all"><FileText size={16} className="text-amber-500"/> PDF Anual</button>
                </div>
             </div>

             <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/50 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      <tr><th className="px-8 py-6">Data</th><th className="px-8 py-6">Descrição</th><th className="px-8 py-6 text-right">Valor</th><th className="px-8 py-6"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {transactions.length > 0 ? transactions.slice().reverse().map(t => (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-8 py-6 text-xs text-slate-500 font-mono">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-8 py-6 font-black uppercase text-xs tracking-wide">{t.description}</td>
                          <td className={`px-8 py-6 text-right font-black tabular-nums ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>{t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}</td>
                          <td className="px-8 py-6 text-right">
                             <button onClick={() => setTransactions(prev => prev.filter(item => item.id !== t.id))} className="text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="p-20 text-center opacity-20 font-black uppercase tracking-widest text-xs">Nenhum lançamento registrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}

        {/* ANIVERSARIANTES */}
        {view === AppView.Birthdays && (
          <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto pb-10">
             <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">B-Days da Equipe</h2>
                  <p className="text-[10px] font-black uppercase text-slate-600 mt-2 tracking-[0.3em]">Comemorações deste Mês</p>
                </div>
                <button onClick={() => generateBirthdayMural(athletes, adminProfile)} className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all">
                   <Printer size={18}/> PDF para Mural
                </button>
             </header>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {stats.birthdays.length > 0 ? stats.birthdays.map(ath => (
                  <div key={ath.id} className="p-10 bg-indigo-500/5 border border-indigo-500/20 rounded-[3rem] flex flex-col items-center gap-6 text-center shadow-2xl group hover:border-indigo-500/50 transition-all">
                    <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform"><Cake size={40}/></div>
                    <div>
                      <p className="font-black text-white uppercase italic text-2xl tracking-tighter mb-1">{ath.name}</p>
                      <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Nasc: {new Date(ath.birthDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <BeltBadge belt={ath.belt} degrees={ath.degrees} />
                  </div>
                )) : (
                  <div className="col-span-full p-24 text-center border-2 border-dashed border-slate-900 rounded-[3rem] opacity-30">
                    <Cake size={80} className="mx-auto mb-6 text-slate-700" />
                    <p className="text-[11px] font-black uppercase tracking-widest">Nenhum guerreiro completa ano este mês.</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* RANKING */}
        {view === AppView.Ranking && (
           <div className="space-y-8 animate-in fade-in max-w-2xl mx-auto pb-10">
              <header className="text-center"><h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Ranking Frequência</h2></header>
              <div className="space-y-4">
                 {stats.ranking.length > 0 ? stats.ranking.map((ath, idx) => (
                   <div key={ath.id} className={`p-8 rounded-[3rem] border flex items-center gap-6 shadow-2xl transition-all ${idx === 0 ? 'bg-amber-500 border-amber-400 text-slate-950 scale-[1.03]' : 'bg-slate-900 border-slate-800 text-white'}`}>
                      <div className={`text-4xl font-black italic w-16 text-center shrink-0 ${idx === 0 ? 'text-slate-950' : 'text-slate-700'}`}>{idx + 1}º</div>
                      <div className="flex-1 overflow-hidden">
                         <p className="font-black uppercase italic text-lg truncate leading-none mb-1">{ath.name}</p>
                         <p className={`text-[10px] font-black uppercase tracking-widest ${idx === 0 ? 'text-slate-900' : 'text-slate-500'}`}>{ath.attendanceCount} TREINOS</p>
                      </div>
                      <BeltBadge belt={ath.belt} degrees={ath.degrees} />
                   </div>
                 )) : (
                   <p className="text-center opacity-30 uppercase font-black py-10">Sem treinos registrados</p>
                 )}
              </div>
           </div>
        )}

        {/* TIMER */}
        {view === AppView.Timer && (
          <div className="flex flex-col items-center gap-12 animate-in zoom-in-95 duration-500 max-w-4xl mx-auto pb-10">
             <header className="text-center"><h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Tatame Clock</h2></header>
             {isAlarmPlaying && (
               <button onClick={stopAlarm} className="bg-red-600 text-white p-8 rounded-[2.5rem] w-full animate-pulse flex items-center justify-between shadow-2xl ring-4 ring-red-600/20 z-[100]">
                  <div className="flex items-center gap-4"><Bell className="animate-bounce" size={32}/><span className="font-black italic uppercase text-lg tracking-tighter">Round Finalizado! OSS!</span></div>
                  <VolumeX size={32}/>
               </button>
             )}
             <div className="bg-slate-900 p-12 sm:p-24 rounded-[5rem] border border-slate-800 shadow-2xl flex flex-col items-center gap-12 relative w-full border-b-amber-500/50 group">
                <div className="text-[120px] sm:text-[190px] font-black text-white tabular-nums tracking-tighter leading-none drop-shadow-[0_0_60px_rgba(251,191,36,0.4)] transition-transform duration-500">{formatTime(timeLeft)}</div>
                
                <div className="flex items-center gap-4 sm:gap-10">
                   <div className="flex flex-col items-center">
                      <input type="number" min="0" value={manualMin} onChange={e => { const m = Math.max(0, parseInt(e.target.value) || 0); setManualMin(m); setTimeLeft(m * 60 + manualSec); }} className="w-24 sm:w-32 p-5 sm:p-7 bg-slate-950 rounded-3xl text-center text-4xl sm:text-5xl font-black text-white border border-slate-700 outline-none focus:ring-4 focus:ring-amber-500 shadow-2xl transition-all" /><span className="text-[9px] sm:text-[11px] font-black uppercase text-slate-600 mt-4 tracking-[0.2em] italic">Minutos</span>
                   </div>
                   <div className="text-4xl font-black text-slate-700 mt-[-20px]">:</div>
                   <div className="flex flex-col items-center">
                      <input type="number" min="0" max="59" value={manualSec} onChange={e => { const s = Math.min(59, Math.max(0, parseInt(e.target.value) || 0)); setManualSec(s); setTimeLeft(manualMin * 60 + s); }} className="w-24 sm:w-32 p-5 sm:p-7 bg-slate-950 rounded-3xl text-center text-4xl sm:text-5xl font-black text-white border border-slate-700 outline-none focus:ring-4 focus:ring-amber-500 shadow-2xl transition-all" /><span className="text-[9px] sm:text-[11px] font-black uppercase text-slate-600 mt-4 tracking-[0.2em] italic">Segundos</span>
                   </div>
                </div>

                <div className="flex items-center gap-8">
                   <button onClick={() => { setIsTimerRunning(!isTimerRunning); stopAlarm(); }} className={`w-32 h-32 sm:w-36 sm:h-36 rounded-[3.5rem] flex items-center justify-center transition-all shadow-2xl active:scale-90 ring-[12px] ${isTimerRunning ? 'bg-red-600 ring-red-600/10 shadow-red-600/20' : 'bg-emerald-500 ring-emerald-500/10 shadow-emerald-500/20'}`}>{isTimerRunning ? <Pause size={60} /> : <Play size={60} className="ml-3" fill="currentColor" />}</button>
                   <button onClick={() => { setIsTimerRunning(false); setTimeLeft(manualMin * 60 + manualSec); stopAlarm(); }} className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-400 active:scale-95 transition-all hover:text-white shadow-xl border border-slate-700"><RotateCcw size={36}/></button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-xl">
                  {(['buzzer', 'bell', 'MATE', 'FIM'] as AlarmType[]).map(a => (
                    <button key={a} onClick={() => { setSelectedAlarm(a); stopAlarm(); }} className={`p-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg border ${selectedAlarm === a ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}>{a}</button>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* AJUSTES / BACKUP */}
        {view === AppView.Settings && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 max-w-4xl mx-auto pb-10">
            <header><h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Ajustes & Backup</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl space-y-6">
                  <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center"><Download size={32}/></div>
                  <div><h3 className="text-xl font-black uppercase text-white italic">Exportar Tudo</h3><p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">Salve todos os alunos, turmas e caixa em um arquivo.</p></div>
                  <button onClick={exportData} className="w-full bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white p-5 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-3"><Save size={18}/> Gerar Backup</button>
               </div>
               <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl space-y-6">
                  <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center"><Upload size={32}/></div>
                  <div><h3 className="text-xl font-black uppercase text-white italic">Restaurar Dados</h3><p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">Recupere informações de um backup anterior.</p></div>
                  <label className="w-full bg-slate-800 hover:bg-indigo-500 text-white p-5 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-3 cursor-pointer"><Upload size={18}/> Selecionar Arquivo <input type="file" accept=".json" onChange={importData} className="hidden" /></label>
               </div>
               <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl space-y-6 md:col-span-2">
                  <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center"><Medal size={32}/></div>
                  <div><h3 className="text-xl font-black uppercase text-white italic">Identidade Visual</h3><p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">Personalize o logo da sua academia.</p></div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-3">Logo da Academia</label>
                      <div className="flex flex-col sm:flex-row gap-6 items-center">
                        <div className="w-32 h-32 bg-slate-800 rounded-3xl border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl">
                          <img src={adminProfile?.logoUrl || DEFAULT_LOGO} alt="Preview" className="w-24 h-24 object-contain" />
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                          <label className="block w-full bg-amber-500 text-slate-950 font-black p-5 rounded-2xl text-center uppercase italic text-xs cursor-pointer hover:bg-white transition-all active:scale-95 shadow-lg">
                            <Upload size={18} className="inline mr-2" /> Escolher Imagem
                            <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, (url) => setAdminProfile(prev => prev ? {...prev, logoUrl: url} : null))} className="hidden" />
                          </label>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-600 uppercase ml-2">Ou use uma URL externa</label>
                            <input 
                              type="text" 
                              placeholder="https://..."
                              value={adminProfile?.logoUrl || ''} 
                              onChange={e => {
                                const url = e.target.value;
                                setAdminProfile(prev => prev ? {...prev, logoUrl: url} : null);
                                setLogoPreview(url || DEFAULT_LOGO);
                              }}
                              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none font-black text-[10px] focus:ring-2 focus:ring-amber-500" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAV MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/98 backdrop-blur-3xl border-t border-slate-800 flex justify-around p-4 pb-8 z-[60] shadow-[0_-20px_60px_rgba(0,0,0,0.8)]">
         <button onClick={() => navigateTo(AppView.Dashboard)} className={`flex flex-col items-center gap-1.5 transition-all ${view === AppView.Dashboard ? 'text-amber-500' : 'text-slate-600'}`}><Home size={24}/><span className="text-[9px] font-black uppercase tracking-widest">Início</span></button>
         <button onClick={() => navigateTo(AppView.Classes)} className={`flex flex-col items-center gap-1.5 transition-all ${view === AppView.Classes ? 'text-amber-500' : 'text-slate-600'}`}><Layers size={24}/><span className="text-[9px] font-black uppercase tracking-widest">Aulas</span></button>
         <button onClick={() => navigateTo(AppView.Timer)} className={`flex flex-col items-center gap-1.5 transition-all ${view === AppView.Timer ? 'text-amber-500' : 'text-slate-600'}`}><Clock size={24}/><span className="text-[9px] font-black uppercase tracking-widest">Timer</span></button>
         <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-1.5 text-slate-600 active:text-amber-500"><Menu size={24}/><span className="text-[9px] font-black uppercase tracking-widest">Mais</span></button>
      </nav>

      {/* MODAL GLOBAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/96 backdrop-blur-2xl z-[300] flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] w-full max-w-xl p-10 sm:p-12 shadow-[0_0_120px_rgba(0,0,0,0.8)] animate-in zoom-in-95 overflow-y-auto max-h-[92vh] border-b-amber-500/50 custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                  {editId ? 'Editar' : 'Novo'} {modalType === 'athlete' ? 'Atleta' : modalType === 'transaction' ? 'Lançamento' : 'Turma'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-600 hover:text-white transition-colors p-2"><X size={36}/></button>
              </div>
              
              <div className="space-y-6">
                {modalType === 'athlete' && (
                  <>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Nome Completo</label><input type="text" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs focus:ring-2 focus:ring-amber-500" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Faixa</label><select value={form.belt} onChange={e => setForm({...form, belt: e.target.value})} className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs uppercase"><option value="Branca">Branca</option><option value="Cinza">Cinza</option><option value="Amarela">Amarela</option><option value="Laranja">Laranja</option><option value="Verde">Verde</option><option value="Azul">Azul</option><option value="Roxa">Roxa</option><option value="Marrom">Marrom</option><option value="Preta">Preta</option></select></div>
                      <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Graus</label><input type="number" min="0" max="4" value={form.degrees || 0} onChange={e => setForm({...form, degrees: parseInt(e.target.value)})} className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Aniversário</label><input type="date" value={form.birthDate || ''} onChange={e => setForm({...form, birthDate: e.target.value})} className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs" /></div>
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Turma</label><select value={form.classId || ''} onChange={e => setForm({...form, classId: e.target.value})} className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs uppercase"><option value="">Sem Turma</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Vencimento (Dia)</label><input type="number" min="1" max="31" value={form.paymentDay || 10} onChange={e => setForm({...form, paymentDay: parseInt(e.target.value)})} className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs" /></div>
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Categoria</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs uppercase"><option value="Adulto">Adulto</option><option value="Infantil">Infantil</option></select></div>
                    </div>
                  </>
                )}

                {modalType === 'class' && (
                  <>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Nome da Turma</label><input type="text" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="Iniciantes, No-Gi, Kids..." className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs" /></div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Horário</label><input type="text" value={form.schedule || ''} onChange={e => setForm({...form, schedule: e.target.value})} placeholder="19:00 - 20:30" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs" /></div>
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Dias</label><input type="text" value={form.days || ''} onChange={e => setForm({...form, days: e.target.value})} placeholder="Seg, Qua, Sex" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs" /></div>
                    </div>
                  </>
                )}

                {modalType === 'transaction' && (
                  <>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Descrição</label><input type="text" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} placeholder="Mensalidade Aluno X, Aluguel..." className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs" /></div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Valor R$</label><input type="number" step="0.01" value={form.amount || 0} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs" /></div>
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-3">Data</label><input type="date" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-5 bg-slate-800 border border-slate-700 rounded-3xl text-white outline-none font-black text-xs" /></div>
                    </div>
                  </>
                )}
              </div>
              
              <button onClick={() => {
                if(modalType === 'athlete') {
                  if(editId) setAthletes(prev => prev.map(a => a.id === editId ? {...a, ...form} : a));
                  else setAthletes(prev => [...prev, { ...form, id: Date.now().toString(), accessId: Math.floor(1000 + Math.random() * 9000).toString() }]);
                } else if(modalType === 'transaction') {
                  setTransactions(prev => [...prev, { ...form, id: Date.now().toString() }]);
                } else if(modalType === 'class') {
                  if(editId) setClasses(prev => prev.map(c => c.id === editId ? {...c, ...form} : c));
                  else setClasses(prev => [...prev, { ...form, id: Date.now().toString(), color: '#f59e0b' }]);
                }
                setIsModalOpen(false);
              }} className="w-full mt-10 bg-amber-500 text-slate-950 font-black p-7 rounded-[2.5rem] transition-all uppercase italic text-sm shadow-2xl active:scale-95 hover:bg-white tracking-widest">Salvar OSS!</button>
           </div>
        </div>
      )}

      {/* MENU MOBILE EXPANDIDO */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/99 z-[100] flex flex-col p-8 pt-24 animate-in fade-in slide-in-from-bottom-5 backdrop-blur-3xl overflow-hidden">
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-10 right-10 bg-slate-800 text-white p-5 rounded-3xl shadow-2xl z-[110]"><X size={36}/></button>
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-16 text-center">
            <h2 className="text-4xl font-black italic uppercase text-white mb-10 tracking-tighter">SYSBJJ</h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                { v: AppView.Dashboard, i: Home, t: "Painel Principal", color: "text-amber-500" },
                { v: AppView.Classes, i: Layers, t: "Aulas / Turmas", color: "text-amber-500" },
                { v: AppView.Athletes, i: Users, t: "Alunos / Matrículas", color: "text-amber-500" },
                { v: AppView.Attendance, i: CalendarCheck, t: "Lista de Chamada", color: "text-emerald-500" },
                { v: AppView.Finance, i: DollarSign, t: "Controle Financeiro", color: "text-indigo-500" },
                { v: AppView.Settings, i: Database, t: "Ajustes & Backup", color: "text-slate-400" }
              ].map(item => (
                <button key={item.v} onClick={() => navigateTo(item.v)} className="flex items-center gap-7 bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] text-white font-black uppercase text-xs active:bg-slate-800 active:border-amber-500 shadow-2xl transition-all">
                  <div className={`${item.color} shrink-0`}><item.i size={34}/></div><span className="tracking-[0.2em]">{item.t}</span>
                </button>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-7 bg-red-600/10 border border-red-600/20 p-8 rounded-[2.5rem] text-red-600 font-black uppercase text-xs mt-8 active:scale-95 transition-all shadow-xl"><LogOut size={34}/> Sair</button>
            </div>
          </div>
        </div>
      )}

      <PWAInstallPrompt logoUrl={adminProfile?.logoUrl || DEFAULT_LOGO} />
    </div>
  );
};

export default App;
