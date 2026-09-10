import { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';

/**
 * Admin login screen with Supabase auth integration.
 */
export default function AdminLogin({ email, setEmail, password, setPassword, handleLogin, loginError, loginLoading }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-poloBlue/15 via-brand-poloBlue/20 to-slate-200 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md p-8 rounded-2xl border border-slate-200/80 dark:border-dark-muted/15 shadow-xl shadow-slate-200/30 dark:shadow-black/20 w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img
              src="/images/logo alem.jpg"
              alt="Logo ALEM"
              className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-slate-200/80 dark:border-dark-muted/30"
            />
          </div>
          <h1 className="text-2xl font-bold text-brand-bigStone dark:text-white tracking-tight">Admin ALEM</h1>
          <p className="text-sm text-brand-eastBay dark:text-dark-muted">Acesso restrito a equipa de gestao</p>
        </div>

        {loginError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-feedback-errorLight dark:bg-feedback-error/10 border border-feedback-errorBorder dark:border-feedback-error/25 text-feedback-error text-sm px-4 py-3 rounded-xl"
          >
            {loginError}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => setEmail(e.target.value.trim().toLowerCase())}
              className="form-input"
              placeholder="admin@alem.mz"
              required
              disabled={loginLoading}
            />
          </div>
          <div className="space-y-1">
            <label className="form-label">Palavra-passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pr-10"
                placeholder="••••••••"
                required
                disabled={loginLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-horizon dark:text-dark-muted dark:hover:text-white transition-colors cursor-pointer"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-xs font-semibold text-brand-horizon dark:text-brand-poloBlue hover:underline cursor-pointer"
              >
                Esqueceu a palavra-passe?
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 text-[14px] shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] dark:bg-green-600 dark:hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed mt-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-green-500/20"
            disabled={loginLoading}
          >
            {loginLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                A autenticar...
              </>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>
      </motion.div>

      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        initialEmail={email}
      />
    </div>
  );
}
