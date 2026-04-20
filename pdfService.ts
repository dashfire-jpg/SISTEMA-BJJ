
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Athlete, Transaction, AdminProfile, TrainingClass, QTSItem } from './types';

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

export const generateQTSPDF = (items: QTSItem[], classes: TrainingClass[], admin: AdminProfile | null, weeklyPlanning: string) => {
  const doc = new jsPDF() as any;
  const dateStr = new Date().toLocaleDateString('pt-BR');
  
  // Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('QTS - QUADRO DE TRABALHO SEMANAL', 15, 20);
  
  doc.setFontSize(10);
  doc.text(`${admin?.dojoName || 'ACADEMIA BJJ'} | Emissão: ${dateStr}`, 15, 30);
  
  // Weekly Planning Section
  if (weeklyPlanning) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FOCO TÉCNICO DA SEMANA:', 15, 55);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const splitPlanning = doc.splitTextToSize(weeklyPlanning, 180);
    doc.text(splitPlanning, 15, 65);
  }
  
  // Schedule Table
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const tableData: any[] = [];
  
  // Group items by time slot for a better visual representation
  const timeSlots = Array.from(new Set(items.map(i => i.schedule))).sort();
  
  timeSlots.forEach(slot => {
    const row = [slot];
    days.forEach(day => {
      const itemsInSlot = items.filter(i => 
        i.schedule === slot && 
        i.day === day.substring(0, 3)
      );
      row.push(itemsInSlot.map(i => {
        const cls = classes.find(c => c.id === i.classId);
        const name = cls?.name || 'Aula';
        return i.topic ? `${name}\n[${i.topic}]` : name;
      }).join('\n\n'));
    });
    tableData.push(row);
  });
  
  doc.autoTable({
    startY: weeklyPlanning ? 85 : 55,
    head: [['Horário', ...days]],
    body: tableData,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 3, halign: 'center', valign: 'middle' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25 }
    },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('OSS! - DISCIPLINA E RESPEITO SEMPRE', 105, 285, { align: 'center' });
  
  doc.save(`QTS_${admin?.dojoName || 'Academia'}_${dateStr.replace(/\//g, '-')}.pdf`);
};

export const generateCompetitionPDF = (
  athletes: Athlete[], 
  admin: AdminProfile | null
) => {
  const doc = new jsPDF() as any;
  const dateStr = new Date().toLocaleDateString('pt-BR');
  
  // Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTROLE DE COMPETIÇÃO', 15, 20);
  
  doc.setFontSize(10);
  doc.text(`${admin?.dojoName || 'ACADEMIA BJJ'} | Emissão: ${dateStr}`, 15, 30);
  
  // Table
  const tableData = athletes.map(a => [
    a.name.toUpperCase(),
    a.belt.toUpperCase(),
    a.competitionCategory?.toUpperCase() || a.category.toUpperCase(),
    a.competitionWeight?.toUpperCase() || (a.weight ? `${a.weight} KG` : '-'),
    a.fightTime || '________' // Blank space for manual filling if not provided
  ]);
  
  doc.autoTable({
    startY: 50,
    head: [['Atleta', 'Faixa', 'Categoria', 'Peso', 'Horário da Luta']],
    body: tableData,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 5 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('BOA SORTE AOS GUERREIROS! OSS!', 105, 285, { align: 'center' });
  
  doc.save(`Controle_Competicao_${dateStr.replace(/\//g, '-')}.pdf`);
};

export const generateRankingPDF = (
  athletes: Athlete[], 
  admin: AdminProfile | null,
  type: 'Mensal' | 'Geral'
) => {
  const doc = new jsPDF() as any;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
  
  // Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RANKING DE FREQUÊNCIA', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`${type === 'Mensal' ? `AVALIAÇÃO MENSAL - ${monthName}` : 'RANKING GERAL'}`, 105, 32, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`${admin?.dojoName || 'ACADEMIA BJJ'} | Emissão: ${dateStr}`, 105, 40, { align: 'center' });
  
  // Table
  const tableData = athletes.map((a, idx) => [
    `${idx + 1}º`,
    a.name.toUpperCase(),
    a.belt.toUpperCase(),
    type === 'Mensal' ? 
      (a.attendanceLog?.filter(d => new Date(d).getMonth() === now.getMonth() && new Date(d).getFullYear() === now.getFullYear()).length || 0) : 
      a.attendanceCount
  ]);
  
  doc.autoTable({
    startY: 55,
    head: [['Pos', 'Guerreiro(a)', 'Faixa', 'Treinos']],
    body: tableData,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 12, halign: 'center' },
    styles: { fontSize: 11, cellPadding: 6, halign: 'center', valign: 'middle' },
    columnStyles: {
      1: { halign: 'left', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('A CONSTÂNCIA É O CAMINHO PARA A EXCELÊNCIA. OSS!', 105, 285, { align: 'center' });
  
  doc.save(`Ranking_${type}_${admin?.dojoName || 'Academia'}_${dateStr.replace(/\//g, '-')}.pdf`);
};

export const generateManagementReport = (
  athletes: Athlete[], 
  transactions: Transaction[],
  admin: AdminProfile | null
) => {
  const doc = new jsPDF() as any;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE GESTÃO MENSAL', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`${admin?.dojoName || 'ACADEMIA BJJ'} | Referência: ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}`, 105, 32, { align: 'center' });
  doc.text(`Emissão: ${dateStr}`, 105, 40, { align: 'center' });
  
  // Stats summary
  const activeAthletes = athletes.filter(a => a.status === 'active');
  const churnedThisMonth = athletes.filter(a => {
    if (a.status === 'inactive') return true;
    const joinDate = new Date(a.joinDate);
    const tenureDays = (now.getTime() - joinDate.getTime()) / (1000 * 3600 * 24);
    // Consider "left quickly" if tenure < 60 days and no attendance in last 15 days
    const lastAttendanceDate = a.lastAttendance ? new Date(a.lastAttendance) : null;
    const daysSinceLastAttendance = lastAttendanceDate ? (now.getTime() - lastAttendanceDate.getTime()) / (1000 * 3600 * 24) : 999;
    return tenureDays < 60 && daysSinceLastAttendance > 15;
  });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('RESUMO DA ACADEMIA', 15, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Alunos Ativos: ${activeAthletes.length}`, 15, 70);
  doc.text(`Alunos com Risco de Evasão / Saída Rápida: ${churnedThisMonth.length}`, 15, 75);

  // Table
  const tableData = activeAthletes.map(a => {
    const monthlyAttendance = a.attendanceLog?.filter(d => {
      const date = new Date(d);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length || 0;

    const athleteTransactions = transactions.filter(t => t.athleteId === a.id && t.type === 'income');
    const lastPayment = athleteTransactions.length > 0 ? 
      new Date(Math.max(...athleteTransactions.map(t => new Date(t.date).getTime()))).toLocaleDateString('pt-BR') : 
      'SEM REGISTRO';

    return [
      a.name.toUpperCase(),
      a.belt.toUpperCase(),
      monthlyAttendance.toString(),
      `DIA ${a.paymentDay}`,
      lastPayment
    ];
  });
  
  doc.autoTable({
    startY: 85,
    head: [['Atleta', 'Faixa', 'Presenças (Mês)', 'Vencimento', 'Último Pagto']],
    body: tableData,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Relatório gerado para auxílio na retenção e controle financeiro. OSS!', 105, 285, { align: 'center' });
  
  doc.save(`Gestao_Mensal_${dateStr.replace(/\//g, '-')}.pdf`);
};

export const generateSystemReport = (
  athletes: Athlete[],
  transactions: Transaction[],
  classes: TrainingClass[],
  admin: AdminProfile | null
) => {
  const doc = new jsPDF() as any;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  
  // Header
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SYSBJJ - DASHBOARD DO ADMINISTRADOR', 105, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`RELATÓRIO TÉCNICO DE USO E CONTROLE DE ACESSO`, 105, 35, { align: 'center' });
  doc.text(`EMISSÃO: ${dateStr} | EXCLUSIVO: ${admin?.email || 'ADMINISTRADOR'}`, 105, 43, { align: 'center' });
  
  // Stats Block
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('ESTATÍSTICAS GERAIS', 15, 65);
  
  const stats = [
    ['Total de Atletas Cadastrados', athletes.length.toString()],
    ['Atletas Ativos', athletes.filter(a => a.status === 'active').length.toString()],
    ['Total de Turmas', classes.length.toString()],
    ['Total de Transações', transactions.length.toString()],
    ['Volume em Caixa', `R$ ${transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0).toFixed(2)}`]
  ];

  doc.autoTable({
    startY: 70,
    body: stats,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
  });

  // User Access List
  doc.setFontSize(14);
  doc.text('CONTROLE DE ACESSO (USUÁRIOS/ATLETAS)', 15, 115);

  const userData = athletes.map(a => [
    a.accessId,
    a.name.toUpperCase(),
    a.status === 'active' ? 'ATIVO' : 'INATIVO',
    a.lastAttendance ? new Date(a.lastAttendance).toLocaleDateString('pt-BR') : 'NUNCA',
    a.attendanceCount.toString()
  ]);

  doc.autoTable({
    startY: 120,
    head: [['ID ACESSO', 'NOME COMPLETO', 'STATUS', 'ÚLTIMA ENTRADA', 'TOTAL PRESENÇAS']],
    body: userData,
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9 },
    styles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // Security Note
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Este documento contém informações confidenciais de uso interno do administrador Master.', 105, 285, { align: 'center' });
  doc.text('SYSBJJ - Inteligência em Gestão de Artes Marciais', 105, 290, { align: 'center' });

  doc.save(`Relatorio_Sistema_${dateStr.replace(/\//g, '-')}.pdf`);
};
