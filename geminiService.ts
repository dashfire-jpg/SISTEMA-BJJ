
import { GoogleGenAI } from "@google/genai";

export const getDojoInsights = async (athletes: any[], transactions: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const activeCount = athletes.filter(a => a.status === 'active').length;
  const attendanceAvg = athletes.reduce((acc, a) => acc + a.attendanceCount, 0) / (athletes.length || 1);
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  
  const imminentPayments = athletes.filter(a => {
    const today = new Date().getDate();
    return a.paymentDay - today <= 3 && a.paymentDay >= today;
  }).length;

  const dataSummary = {
    totalAlunos: athletes.length,
    alunosAtivos: activeCount,
    mediaPresenca: attendanceAvg.toFixed(1),
    saldoCaixa: (income - expense).toFixed(2),
    pagamentosPendentes: imminentPayments
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é o "Sensei Virtual", consultor mestre de academias de Jiu-Jitsu. 
      Analise estes dados reais do dojo e dê uma instrução curta (máx 3 parágrafos) focada em crescimento e retenção:
      
      DADOS: ${JSON.stringify(dataSummary)}
      
      Regras:
      1. Use terminologia de BJJ (pressão, ajuste, técnica, rola, tatame).
      2. Seja motivador mas realista sobre as finanças.
      3. Se houver muitos pagamentos próximos, sugira uma ação de cobrança ética.
      4. Comece com "OSS, Mestre!" e termine com uma frase de impacto de artes marciais.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Mantenha o foco no tatame e o controle rigoroso da presença. A técnica supera a força. OSS!";
  }
};
