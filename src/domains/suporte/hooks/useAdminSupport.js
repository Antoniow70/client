import { useState } from 'react';
import axiosClient from '../../../shared/lib/axiosClient';
import { 
  getMessages, 
  deleteMessage as deleteMessageService, 
  updateMessageStatus as updateMessageStatusService, 
  updateMessageReadStatus as updateMessageReadStatusService, 
  bulkUpdateMessageStatus as bulkUpdateMessageStatusService 
} from '../services/suporteApi';
import { exportSupportPDF } from '../utils/pdfExport';

export function useAdminSupport(openConfirm, onRefreshAll, onRegisterAsBeneficiaryCallback) {
  const [messages, setMessages] = useState([]);
  const [localStatuses, setLocalStatuses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_support_statuses') || '{}');
    } catch {
      return {};
    }
  });
  const [supportSearch, setSupportSearch] = useState('');
  const [supportFilterStart, setSupportFilterStart] = useState('');
  const [supportFilterEnd, setSupportFilterEnd] = useState('');
  const [supportReadFilter, setSupportReadFilter] = useState('Todos');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchMessages = async () => {
    try {
      const res = await getMessages();
      const rawData = res?.data || [];
      const savedStatuses = (() => {
        try {
          return JSON.parse(localStorage.getItem('admin_support_statuses') || '{}');
        } catch {
          return {};
        }
      })();
      setMessages(rawData.map(m => ({
        ...m,
        status: savedStatuses[m.id] || m.status || 'Novo'
      })));
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleUpdateMessageStatus = async (id, status) => {
    try {
      const currentMsg = messages.find(m => m.id === id);
      if (currentMsg && (currentMsg.status === 'Aprovado' || currentMsg.status === 'Aceitado') && status === 'Pendente') {
        alert('Uma vez aprovado, o pedido nao pode voltar para o estado anterior.');
        return;
      }

      if (status === 'Recusado') {
        openConfirm({
          title: 'Recusar Pedido de Apoio',
          message: 'Tem a certeza? Ao marcar como Recusado, o registo sera eliminado permanentemente.',
          confirmText: 'Recusar e Eliminar',
          cancelText: 'Cancelar',
          type: 'danger',
          onConfirm: async () => {
            try {
              await deleteMessageService(id);
              const updatedStatuses = { ...localStatuses };
              delete updatedStatuses[id];
              setLocalStatuses(updatedStatuses);
              try { localStorage.setItem('admin_support_statuses', JSON.stringify(updatedStatuses)); } catch {}
              setMessages(prev => prev.filter(m => m.id !== id));
              if (onRefreshAll) onRefreshAll();
              if (isMessageModalOpen) setIsMessageModalOpen(false);
            } catch (error) {
              console.error('Error deleting message:', error);
            }
          }
        });
        return;
      }

      const updatedStatuses = { ...localStatuses, [id]: status };
      setLocalStatuses(updatedStatuses);
      try { localStorage.setItem('admin_support_statuses', JSON.stringify(updatedStatuses)); } catch {}
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
      await updateMessageStatusService(id, status);
      if (onRefreshAll) onRefreshAll();
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const handleUpdateMessageReadStatus = async (id, newReadStatus) => {
    try {
      await updateMessageReadStatusService(id, newReadStatus);
      await fetchMessages();
      if (onRefreshAll) onRefreshAll();
    } catch (error) {
      console.error('Error updating message read status:', error);
    }
  };

  const handleRecuseAndRemove = async (id) => {
    await deleteMessageService(id);
    setIsMessageModalOpen(false);
    await fetchMessages();
    if (onRefreshAll) onRefreshAll();
  };

  const handleRegisterAsBeneficiary = async (selectedMsg) => {
    if (onRegisterAsBeneficiaryCallback) {
      onRegisterAsBeneficiaryCallback(selectedMsg);
    }
    await updateMessageStatusService(selectedMsg.id, 'Aceitado');
    await fetchMessages();
    if (onRefreshAll) onRefreshAll();
  };

  const openMessage = (msg) => {
    setSelectedMessage(msg);
    if (msg.read_status !== 'Lido') {
      handleUpdateMessageReadStatus(msg.id, 'Lido');
      msg.read_status = 'Lido';
    }
    setIsMessageModalOpen(true);
  };

  const handleDeleteMessage = (id) => {
    openConfirm({
      title: 'Eliminar Pedido de Apoio',
      message: 'Tem a certeza que deseja eliminar este pedido permanentemente? Esta acao e irreversivel.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteMessageService(id);
          await fetchMessages();
          if (onRefreshAll) onRefreshAll();
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }
    });
  };

  const getFilteredMessages = () => {
    let filtered = messages;
    
    if (supportReadFilter === 'Lidos') {
      filtered = filtered.filter(m => m.read_status === 'Lido');
    } else if (supportReadFilter === 'Nao Lidos') {
      filtered = filtered.filter(m => m.read_status === 'Nao Lido');
    }

    if (supportFilterStart) {
      const start = new Date(supportFilterStart + 'T00:00:00');
      filtered = filtered.filter(m => new Date(m.created_at) >= start);
    }
    if (supportFilterEnd) {
      const end = new Date(supportFilterEnd + 'T23:59:59');
      filtered = filtered.filter(m => new Date(m.created_at) <= end);
    }

    if (supportSearch) {
      const search = supportSearch.toLowerCase();
      filtered = filtered.filter(m => 
        (m.name && m.name.toLowerCase().includes(search)) ||
        (m.email && m.email.toLowerCase().includes(search)) ||
        (m.created_at && new Date(m.created_at).toLocaleDateString('pt-PT').includes(search))
      );
    }

    return filtered;
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

  const handleExportSupportPDF = async () => {
    try {
      const filtered = getFilteredMessages();
      exportSupportPDF(filtered, {
        readFilter: supportReadFilter,
        search: supportSearch,
        filterStart: supportFilterStart,
        filterEnd: supportFilterEnd,
      });
    } catch (clientErr) {
      console.error('Client PDF export failed, fallback to server:', clientErr);
      const start = supportFilterStart || '2025-01-01';
      const end = supportFilterEnd || new Date().toISOString().split('T')[0];
      await triggerReportDownload(start, end, 'support', `relatorio_pedidos_apoio_${start}_a_${end}.pdf`);
    }
  };

  return {
    messages,
    setMessages,
    supportSearch,
    setSupportSearch,
    supportFilterStart,
    setSupportFilterStart,
    supportFilterEnd,
    setSupportFilterEnd,
    supportReadFilter,
    setSupportReadFilter,
    isMessageModalOpen,
    setIsMessageModalOpen,
    selectedMessage,
    setSelectedMessage,
    fetchMessages,
    handleUpdateMessageStatus,
    handleUpdateMessageReadStatus,
    handleRecuseAndRemove,
    handleRegisterAsBeneficiary,
    openMessage,
    handleDeleteMessage,
    getFilteredMessages,
    handleExportSupportPDF
  };
}
