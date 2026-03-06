
export type UserRole = 'admin' | 'professor' | 'student';
export type AgeCategory = 'Infantil' | 'Adulto';

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
  schedule: string;
  days: string;
  color: string;
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
