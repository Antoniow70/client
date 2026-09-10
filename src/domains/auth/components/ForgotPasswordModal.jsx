import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { requestPasswordRecovery } from '../services/authApi';
import { normalizeEmail, validateEmail } from '../../../shared/utils';

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(initialEmail || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      setError('Por favor, introduza o seu endereco de e-mail.');
      return;
    }

    const valResult = validateEmail(cleanEmail);
    if (!valResult.isValid) {
      setError(valResult.error);
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await requestPasswordRecovery(cleanEmail);
      setSuccess(res.message || 'Se o endereco estiver registado, recebera um link de recuperacao por e-mail.');
    } catch (err) {
      console.error('Erro ao solicitar recuperacao:', err);
      const msg = err.message || err.response?.data?.message || 'Ocorreu um erro ao processar o pedido. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-dark-surface w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-dark-muted/20 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-slate-100 dark:border-dark-muted/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center border border-green-200/60 dark:border-green-800/40">
                  <Mail size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-bigStone dark:text-dark-text tracking-tight">
                    Recuperar Palavra-passe
                  </h2>
                  <p className="text-xs text-brand-eastBay dark:text-dark-muted">
                    Acesso administrativo da ALEM
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-dark-text rounded-lg hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {success ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-brand-bigStone dark:text-dark-text text-base">
                      Instrucoes Enviadas!
                    </h3>
                    <p className="text-xs text-brand-eastBay dark:text-dark-muted leading-relaxed px-2">
                      {success}
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        handleClose();
                        navigate(`/admin/recuperar-senha?email=${encodeURIComponent(email)}`);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <KeyRound size={14} />
                      Ja recebi o codigo (Inserir agora)
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-full inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-bg dark:hover:bg-dark-muted/20 text-slate-700 dark:text-dark-text font-semibold py-2 px-4 text-xs transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-xs text-brand-eastBay dark:text-dark-muted leading-relaxed">
                    Introduza o e-mail da sua conta de administrador. Enviaremos um link de recuperacao para definir uma nova palavra-passe.
                  </p>

                  {error && (
                    <div className="flex items-center gap-2 bg-feedback-errorLight dark:bg-feedback-error/10 border border-feedback-errorBorder dark:border-feedback-error/25 text-feedback-error text-xs px-3.5 py-2.5 rounded-xl">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="form-label">E-mail Administrativo</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError('');
                        }}
                        onBlur={() => setEmail((prev) => normalizeEmail(prev))}
                        placeholder="admin@alem.mz"
                        required
                        disabled={loading}
                        className="form-input pl-10"
                        autoFocus
                      />
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-dark-muted dark:hover:text-dark-text rounded-xl hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors"
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 text-xs shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-4 focus:ring-green-500/20"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          A enviar...
                        </>
                      ) : (
                        'Enviar Link de Recuperacao'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
