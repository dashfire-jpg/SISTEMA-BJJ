
export type UserRole = 'admin' | 'professor' | 'student';
export type AgeCategory = 
  | 'Mirim' | 'Infantil' | 'Infanto-Juvenil' | 'Juvenil' 
  | 'Adulto' | 'Master 1' | 'Master 2' | 'Master 3' | 'Master 4' | 'Master 5' | 'Master 6' | 'Master 7';

export type AdultBelt = 'Branca' | 'Azul' | 'Roxa' | 'Marrom' | 'Preta';
export type KidsBelt = 'Branca' | 'Cinza' | 'Amarela' | 'Laranja' | 'Verde';
export type Belt = AdultBelt | KidsBelt;

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  cep: string;
}

export interface AdminProfile {
  name: string;
  dojoName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  registered: boolean;
  logoUrl?: string;
  monetization?: {
    showAds: boolean;
    customBannerUrl?: string;
    customBannerLink?: string;
    adClientId?: string;
    adSlotId?: string;
  };
}

export interface TrainingClass {
  id: string;
  name: string;
  color: string;
}

export interface QTSItem {
  id: string;
  classId: string;
  day: string;
  schedule: string;
  topic?: string;
}

export interface Athlete {
  id: string;
  accessId: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  joinDate: string;
  paymentDay: number;
  status: 'active' | 'inactive';
  attendanceCount: number;
  lastAttendance?: string;
  belt: Belt;
  degrees: number;
  category: AgeCategory;
  weight?: number;
  weightCategory?: string;
  classId?: string; 
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  medicalNotes: string;
  allergies: string;
  medications: string;
  address: Address;
  termsAccepted: boolean;
  profileComplete: boolean;
  photoUrl?: string;
  inCompetition?: boolean;
  competitionCategory?: string;
  competitionWeight?: string;
  fightTime?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
  category: string;
  athleteId?: string;
  status: 'pending' | 'verified';
}

export enum AppView {
  Login = 'login',
  Dashboard = 'dashboard', 
  Athletes = 'athletes',
  Attendance = 'attendance',
  Finance = 'finance',
  Ranking = 'ranking',
  Birthdays = 'birthdays',
  Timer = 'timer',
  AdminRegistration = 'admin-registration',
  Settings = 'settings',
  Classes = 'classes',
  QTS = 'qts'
}
