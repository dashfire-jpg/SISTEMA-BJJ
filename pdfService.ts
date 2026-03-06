
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Athlete, Transaction, AdminProfile } from './types';

// Fix: Using any for doc type to bypass incomplete type definitions in some environments 
// and to support jspdf-autotable without complex interface augmentation.
export const generateFinancialReport = (
  transactions: Transaction[], 
  admin: AdminProfile | null, 
  period: 'Mensal' | 'Anual'
) => {
  const doc = new jsPDF() as any;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  
  // Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SYSBJJ - RELATÓRIO FINANCEIRO', 15, 20);
  
  doc.setFontSize(10);
  doc.text(`${admin?.dojoName || 'ACADEMIA BJJ'} | Emissão: ${dateStr}`, 15, 30);
  
  // Stats
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text(`Período: ${period}`, 15, 55);
  
  doc.setFontSize(12);
  doc.text(`Total Entradas: R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, 65);
  doc.text(`Total Saídas: R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, 72);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Saldo Final: R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, 82);
  
  // Table
  const tableData = transactions.map(t => [
    new Date(t.date).toLocaleDateString('pt-BR'),
    t.description.toUpperCase(),
    t.type === 'income' ? 'ENTRADA' : 'SAÍDA',
    `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  ]);
  
  doc.autoTable({
    startY: 90,
    head: [['Data', 'Descrição', 'Tipo', 'Valor']],
    body: tableData,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  doc.save(`Relatorio_Financeiro_${period}_${dateStr.replace(/\//g, '-')}.pdf`);
};

export const generateBirthdayMural = (athletes: Athlete[], admin: AdminProfile | null) => {
  const doc = new jsPDF() as any;
  const now = new Date();
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
  
  // Decorative Header
  doc.setFillColor(245, 158, 11); // Amber 500
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.text('ANIVERSARIANTES', 105, 25, { align: 'center' });
  doc.setFontSize(20);
  doc.text(monthName, 105, 40, { align: 'center' });
  
  const birthdays = athletes.filter(a => {
    if (!a.birthDate) return false;
    return new Date(a.birthDate).getMonth() === now.getMonth();
  }).sort((a, b) => new Date(a.birthDate).getDate() - new Date(b.birthDate).getDate());
  
  if (birthdays.length === 0) {
    doc.setFontSize(14);
    doc.text('Nenhum aniversário este mês.', 105, 80, { align: 'center' });
  } else {
    const tableData = birthdays.map(a => [
      new Date(a.birthDate).getDate().toString().padStart(2, '0'),
      a.name.toUpperCase(),
      a.belt.toUpperCase()
    ]);
    
    doc.autoTable({
      startY: 60,
      head: [['Dia', 'Guerreiro(a)', 'Faixa']],
      body: tableData,
      headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42], fontSize: 14 },
      styles: { fontSize: 12, cellPadding: 8 },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
        2: { cellWidth: 40 }
      }
    });
  }
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${admin?.dojoName || 'NOSSA ACADEMIA'} - FAMÍLIA UNIDA, OSS!`, 105, 285, { align: 'center' });
  
  doc.save(`Mural_Aniversariantes_${monthName}.pdf`);
};
