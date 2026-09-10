import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Check, X, Shield, ShieldCheck } from 'lucide-react';
import { evaluatePasswordStrength } from '../utils/validators';

/**
 * Componente visual de medidor de forca e seguranca da palavra-passe.
 * Exibe barra de progresso em 4 segmentos e checklist dinamico de criterios.
 *
 * @param {object} props
 * @param {string} props.password Palavra-passe a ser avaliada
 * @param {boolean} [props.showCriteria=true] Se deve exibir o checklist de criterios
 * @param {string} [props.className=''] Classes CSS adicionais
 */
export default function PasswordStrengthMeter({ password = '', showCriteria = true, className = '' }) {
  const analysis = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  const { score, label, colorBg, colorText, checks } = analysis;

  const criteriaList = [
    { key: 'hasMinLength', text: 'Minimo de 8 caracteres', pass: checks.hasMinLength },
    { key: 'hasCase', text: 'Letras maiuscula e minuscula', pass: checks.hasLower && checks.hasUpper },
    { key: 'hasNumber', text: 'Pelo menos 1 numero', pass: checks.hasNumber },
    { key: 'hasSpecial', text: 'Caractere especial (!@#$...)', pass: checks.hasSpecial }
  ];

  return (
    <div className={`space-y-2.5 pt-1.5 ${className}`}>
      {/* Cabecalho da forca */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-dark-muted">
          {score >= 3 ? (
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          ) : (
            <Shield size={14} className="shrink-0" />
          )}
          <span>Seguranca:</span>
        </div>
        <span className={`font-semibold ${colorText} transition-colors duration-200`}>
          {label}
        </span>
      </div>

      {/* Barra de progresso segmentada em 4 niveis */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => {
          const isActive = score >= step;
          return (
            <div
              key={step}
              className="h-full rounded-full bg-slate-200 dark:bg-dark-muted/20 overflow-hidden"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isActive ? '100%' : '0%' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`h-full ${isActive ? colorBg : 'bg-transparent'} rounded-full`}
              />
            </div>
          );
        })}
      </div>

      {/* Checklist de criterios opcionais */}
      {showCriteria && (
        <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {criteriaList.map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-1.5 text-[11px] transition-colors duration-150 ${
                item.pass
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-slate-400 dark:text-dark-muted/70'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                  item.pass
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-dark-muted/20 text-slate-400'
                }`}
              >
                {item.pass ? <Check size={10} strokeWidth={3} /> : <X size={9} />}
              </div>
              <span className="truncate">{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
