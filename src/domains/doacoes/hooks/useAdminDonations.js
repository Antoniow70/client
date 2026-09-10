import { useState } from 'react';
import axiosClient from '../../../shared/lib/axiosClient';
import { 
  getDonations, 
  updateDonationStatus as updateDonationStatusService 
} from '../services/doacoesApi';
import { exportDonationsPDF } from '../../suporte/utils/pdfExport';

export function useAdminDonations(openConfirm, onRefreshAll) {
  const [donations, setDonations] = useState([]);
  const [donationSearch, setDonationSearch] = useState('');
  const [donationReadFilter, setDonationReadFilter] = useState('Todos');
  const [donationFilterStart, setDonationFilterStart] = useState('');
  const [donationFilterEnd, setDonationFilterEnd] = useState('');

  const fetchDonations = async () => {
    try {
      const res = await getDonations();
      setDonations(res?.data || []);
    } catch (err) {
      console.error('Error fetching donations:', err);
    }
  };

  const getFilteredDonations = () => {
    return donations.filter(d => {
      // 1. Pesquisa por texto
      if (donationSearch && donationSearch.trim()) {
        const q = donationSearch.toLowerCase().trim();
        const nome = (d.nome || '').toLowerCase();
        const email = (d.email || '').toLowerCase();
        const telefone = (d.telefone || '').toLowerCase();
        const causa = (d.causa || '').toLowerCase();
        const dataStr = d.created_at ? new Date(d.created_at).toLocaleDateString('pt-PT') : '';
        const match = nome.includes(q) || email.includes(q) || telefone.includes(q) || causa.includes(q) || dataStr.includes(q);
        if (!match) return false;
      }

      // 2. Filtro de Leitura / Estado
      if (donationReadFilter && donationReadFilter !== 'Todos') {
        const isRead = d.read_status === 'Lido' || d.status === 'Recebido' || d.status === 'Confirmado' || d.lido === true;
        if (donationReadFilter === 'Lidos' && !isRead) return false;
        if (donationReadFilter === 'Nao Lidos' && isRead) return false;
      }

      // 3. Filtro por período
      if (donationFilterStart || donationFilterEnd) {
        if (!d.created_at) return true;
        const date = new Date(d.created_at);
        if (isNaN(date.getTime())) return true;
        const start = donationFilterStart ? new Date(donationFilterStart + 'T00:00:00') : null;
        const end = donationFilterEnd ? new Date(donationFilterEnd + 'T23:59:59') : null;
        if (start && date < start) return false;
        if (end && date > end) return false;
      }

      return true;
    });
  };

  const triggerReportDownload = async (startDate, endDate, type, defaultFilename) => {
    try {
      const start = startDate || '2025-01-01';
      const end = endDate || new Date().toISOString().split('T')[0];
      
      const response = await axiosClient.get('/reports', {
        params: { startDate: start, endDate: end, type },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF report:', err);
      alert('Erro ao gerar relatorio em PDF no servidor.');
    }
  };

  const handleExportDonationsPDF = async () => {
    try {
      const filtered = getFilteredDonations();
      exportDonationsPDF(filtered, { filterStart: donationFilterStart, filterEnd: donationFilterEnd });
    } catch (clientErr) {
      console.error('Error exporting donations PDF on client, attempting server fallback:', clientErr);
      const start = donationFilterStart || '2025-01-01';
      const end = donationFilterEnd || new Date().toISOString().split('T')[0];
      await triggerReportDownload(start, end, 'donations', `relatorio_doacoes_${start}_a_${end}.pdf`);
    }
  };

  const handleUpdateDonationStatus = async (id, newStatus) => {
    try {
      if (newStatus === 'Nao Recebido' || newStatus === 'Recusado') {
        openConfirm({
          title: 'Eliminar Registo de Doacao',
          message: 'Tem a certeza? Ao marcar como Nao Recebido, o registo de doacao sera eliminado permanentemente.',
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
          type: 'danger',
          onConfirm: async () => {
            try {
              await updateDonationStatusService(id, newStatus);
              await fetchDonations();
              if (onRefreshAll) onRefreshAll();
            } catch (error) {
              console.error('Error updating donation status:', error);
            }
          }
        });
        return;
      }
      setDonations(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
      await updateDonationStatusService(id, newStatus);
      await fetchDonations();
      if (onRefreshAll) onRefreshAll();
    } catch (error) {
      console.error('Error updating donation status:', error);
      await fetchDonations();
    }
  };

  return {
    donations,
    setDonations,
    donationSearch,
    setDonationSearch,
    donationReadFilter,
    setDonationReadFilter,
    donationFilterStart,
    setDonationFilterStart,
    donationFilterEnd,
    setDonationFilterEnd,
    fetchDonations,
    getFilteredDonations,
    handleExportDonationsPDF,
    handleUpdateDonationStatus
  };
}
