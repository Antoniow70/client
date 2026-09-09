import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Mail, ArrowLeft, RefreshCw, Check } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';
import { verifyRecoveryOtp, updateUserPassword, requestPasswordRecovery } from '../services/authApi';
import PasswordStrengthMeter from '../../../shared/ui/PasswordStrengthMeter';
import { maskOtp, normalizeEmail, validateEmail, cleanDigits } from '../../../shared/utils';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Estados de palavra-passe
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de validação OTP
  const [emailInput, setEmailInput] = useState(searchParams.get('email') || '');
  const [otpCode, setOtpCode] = useState('');

  // Estados de controle e feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resending, setResending] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // 1. Extrai parâmetros da URL (Query e Hash)
      const tokenHash = searchParams.get('token_hash');
      const code = searchParams.get('code');
      const emailParam = searchParams.get('email');
      if (emailParam && mounted) {
        setEmailInput(emailParam);
      }

      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const errorDesc = hashParams.get('error_description');

      // Se o hash do Supabase trouxe erro de link expirado
      if (errorDesc) {
        const decoded = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
        if (mounted) {
          setError(
            decoded.includes('expired') || decoded.includes('invalid')
              ? 'O link de e-mail expirou ou foi inspecionado pelo servidor de e-mail. Utilize o código de 8 dígitos abaixo ou solicite um novo link.'
              : decoded
          );
        }
      }

      // 2. Se houver token_hash direto no query param (link institucional gerado pelo backend)
      if (tokenHash) {
        try {
          const data = await verifyRecoveryOtp({ token_hash: tokenHash });
          if (data?.session && mounted) {
            setHasValidSession(true);
            setError('');
            // Limpa parâmetros da URL para segurança e evitar repetição
            window.history.replaceState({}, document.title, window.location.pathname);
            setCheckingSession(false);
            return;
          }
        } catch (verifyErr) {
          console.warn('Falha na validação automática do token_hash:', verifyErr.message);
          if (mounted) {
            setError('O link de recuperação expirou ou já foi utilizado. Por favor, introduza o código de 8 dígitos enviado para o seu e-mail.');
          }
        }
      }

      // 3. Se houver código PKCE
      if (code) {
        try {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeErr && data?.session && mounted) {
            setHasValidSession(true);
            setError('');
            window.history.replaceState({}, document.title, window.location.pathname);
            setCheckingSession(false);
            return;
          }
        } catch (err) {
          console.warn('Erro ao trocar código por sessão:', err);
        }
      }

      // 4. Verifica sessão já ativa ou token em memória
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          setHasValidSession(true);
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    // Observa mudanças de estado de autenticação (ex: recuperação de senha)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session && mounted) {
        setHasValidSession(true);
        setCheckingSession(false);
      }
    });

    initAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [searchParams]);

  // Validação manual de OTP de 8 dígitos
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = normalizeEmail(emailInput);
    const cleanOtp = cleanDigits(otpCode);

    if (!cleanEmail || !cleanOtp) return;

    const emailVal = validateEmail(cleanEmail);
    if (!emailVal.isValid) {
      setError(emailVal.error);
      return;
    }

    if (cleanOtp.length < 6) {
      setError('Por favor, introduza o código de verificação recebido por e-mail.');
      return;
    }

    setError('');
    setResendSuccess('');
    setLoading(true);

    try {
      const data = await verifyRecoveryOtp({
        email: cleanEmail,
        token: cleanOtp
      });

      if (data?.session) {
        setHasValidSession(true);
        setError('');
      } else {
        setError('Não foi possível estabelecer sessão. Verifique o código e tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao validar código OTP:', err);
      const msg = err.message || 'Código de verificação inválido ou expirado. Verifique os 8 dígitos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reenviar e-mail de recuperação
  const handleResend = async () => {
    const cleanEmail = normalizeEmail(emailInput);
    if (!cleanEmail) {
      setError('Por favor, indique o seu e-mail para receber um novo link.');
      return;
    }

    const emailVal = validateEmail(cleanEmail);
    if (!emailVal.isValid) {
      setError(emailVal.error);
      return;
    }

    setError('');
    setResendSuccess('');
    setResending(true);

    try {
      const res = await requestPasswordRecovery(cleanEmail);
      setResendSuccess(res.message || 'Novo link e código de recuperação enviados com sucesso!');
    } catch (err) {
      console.error('Erro ao reenviar recuperação:', err);
      setError(err.message || 'Falha ao reenviar e-mail. Tente novamente em instantes.');
    } finally {
      setResending(false);
    }
  };

  // Submissão da nova palavra-passe
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await updateUserPassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 3000);
    } catch (err) {
      console.error('Erro ao atualizar palavra-passe:', err);
      setError(err.message || 'Falha ao redefinir palavra-passe. A sessão pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-poloBlue/15 via-brand-poloBlue/20 to-slate-200 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md p-8 rounded-2xl border border-slate-200/80 dark:border-dark-muted/15 shadow-xl shadow-slate-200/30 dark:shadow-black/20 w-full max-w-md space-y-6"
      >
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img
              src="/images/logo alem.jpg"
              alt="Logo ALEM"
              className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-slate-200/80 dark:border-dark-muted/30"
            />
          </div>
          <h1 className="text-2xl font-bold text-brand-bigStone dark:text-white tracking-tight">
            {hasValidSession ? 'Nova Palavra-passe' : 'Recuperar Acesso'}
          </h1>
          <p className="text-sm text-brand-eastBay dark:text-dark-muted">
            {hasValidSession
              ? 'Defina a nova palavra-passe para a sua conta de administrador'
              : 'Confirme a sua identidade para redefinir a palavra-passe'}
          </p>
        </div>

        {/* 1. Loading inicial de validação */}
        {checkingSession ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-green-600" />
            <span className="text-xs text-slate-500 font-medium">A validar sessão de recuperação...</span>
          </div>
        ) : success ? (
          /* 2. Tela de Sucesso */
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-brand-bigStone dark:text-dark-text text-lg">
                Palavra-passe Atualizada!
              </h2>
              <p className="text-xs text-brand-eastBay dark:text-dark-muted leading-relaxed">
                A sua palavra-passe foi redefinida com sucesso. A redirecionar para a tela de login em instantes...
              </p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="w-full inline-flex items-center justify-center rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 text-xs transition-colors shadow-sm cursor-pointer"
            >
              Ir para o Login Agora
            </button>
          </div>
        ) : hasValidSession ? (
          /* 3. Formulário de Nova Palavra-passe (Sessão Válida) */
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-feedback-errorLight dark:bg-feedback-error/10 border border-feedback-errorBorder dark:border-feedback-error/25 text-feedback-error text-xs px-4 py-3 rounded-xl">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="form-label">Nova Palavra-passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pr-10"
                  placeholder="Mínimo de 6 a 8 caracteres"
                  required
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-green-600 dark:text-dark-muted dark:hover:text-white transition-colors cursor-pointer"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            <div className="space-y-1">
              <label className="form-label">Confirmar Nova Palavra-passe</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input pr-10"
                  placeholder="Repita a palavra-passe"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-green-600 dark:text-dark-muted dark:hover:text-white transition-colors cursor-pointer"
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && (
                <div className="flex items-center gap-1.5 text-xs pt-1">
                  {password === confirmPassword ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <Check size={13} strokeWidth={3} />
                      As palavras-passe coincidem
                    </span>
                  ) : (
                    <span className="text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium">
                      <AlertCircle size={13} />
                      As palavras-passe não coincidem
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 text-[14px] shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-green-500/20"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  A atualizar...
                </>
              ) : (
                'Atualizar Palavra-passe'
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="text-xs font-semibold text-slate-500 hover:text-brand-bigStone dark:hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Voltar ao Login
              </button>
            </div>
          </form>
        ) : (
          /* 4. Formulário de Validação de Código OTP (Quando o link expirou ou foi pré-clicado) */
          <div className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-feedback-errorLight dark:bg-feedback-error/10 border border-feedback-errorBorder dark:border-feedback-error/25 text-feedback-error text-xs px-4 py-3 rounded-xl leading-relaxed">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {resendSuccess && (
              <div className="flex items-start gap-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-300 text-xs px-4 py-3 rounded-xl leading-relaxed">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
                <span>{resendSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="form-label">E-mail Administrativo</label>
                <div className="relative">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (error) setError('');
                    }}
                    onBlur={() => setEmailInput((prev) => normalizeEmail(prev))}
                    placeholder="admin@alem.mz"
                    required
                    disabled={loading}
                    className="form-input pl-10"
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="form-label">Código de Segurança (8 Dígitos)</label>
                  <span className="text-[11px] text-slate-400">Verifique o seu e-mail</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(maskOtp(e.target.value));
                      if (error) setError('');
                    }}
                    placeholder="Ex: 5374 9388"
                    required
                    disabled={loading}
                    autoFocus
                    className="form-input pl-10 tracking-[4px] font-mono text-base font-bold text-center"
                  />
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 text-[14px] shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-green-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    A validar código...
                  </>
                ) : (
                  'Validar Código e Prosseguir'
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 dark:border-dark-muted/10 space-y-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || !emailInput}
                className="w-full text-xs font-semibold text-green-700 dark:text-green-400 hover:underline flex items-center justify-center gap-1.5 py-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                {resending ? 'A enviar novo código...' : 'Reenviar código para o e-mail'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="text-xs font-semibold text-slate-500 hover:text-brand-bigStone dark:hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Voltar ao Login
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
