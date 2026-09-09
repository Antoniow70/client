import { useState, useEffect } from 'react';
import { Smartphone, Building2, CheckCircle, ArrowRight, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getProjects } from '../../projetos';
import { submitDonation } from '../services/doacoesApi';
import {
  maskPhone,
  cleanPhone,
  cleanString,
  normalizeEmail,
  formatTitleCase,
  validateEmail,
  validatePhone,
  validateName
} from '../../../shared/utils';

export default function Doar() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    causa: '',
    valor: '',
    mensagem: '',
    metodoPagamento: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const paymentDetails = {
    'mpesa': {
      icon: <Smartphone className="w-6 h-6 text-feedback-error" />,
      title: 'M-Pesa',
      number: '84 196 9548',
      instruction: 'Transferencia direta via menu *150#'
    },
    'emola': {
      icon: <Smartphone className="w-6 h-6 text-orange-500" />,
      title: 'E-Mola',
      number: '84 196 9548',
      instruction: 'Transferencia direta via menu *155#'
    },
    'transferencia': {
      icon: <Building2 className="w-6 h-6 text-brand-horizon" />,
      title: 'Transferencia Bancaria',
      number: 'MZ59 0000 0000 0000 0000 0 (Millennium BIM)',
      instruction: 'Envie o comprovativo para info@alem.mz'
    }
  };

  const quickAmounts = ['200', '500', '1000', '2500', '5000'];

  const [causas, setCausas] = useState(['Geral']);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await getProjects();
        if (data) {
          setCausas(['Geral', ...data.map(p => p.name)]);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    }
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'telefone') {
      formattedValue = maskPhone(value);
    } else if (name === 'valor') {
      formattedValue = value.replace(/[^\d.]/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    const nameVal = validateName(formData.nome);
    if (!nameVal.isValid) newErrors.nome = nameVal.error;

    const emailVal = validateEmail(formData.email);
    if (!emailVal.isValid) newErrors.email = emailVal.error;

    const phoneVal = validatePhone(formData.telefone, {
      method: formData.metodoPagamento
    });
    if (!phoneVal.isValid) newErrors.telefone = phoneVal.error;

    if (!formData.causa) newErrors.causa = 'Selecione uma causa a apoiar.';
    if (!formData.metodoPagamento) newErrors.metodoPagamento = 'Selecione um meio de pagamento.';

    if (formData.valor) {
      const num = parseFloat(formData.valor);
      if (isNaN(num) || num <= 0) {
        newErrors.valor = 'Introduza um valor válido superior a zero.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        const paymentMap = {
          'mpesa': 'M-Pesa',
          'emola': 'E-Mola',
          'transferencia': 'Transferencia Bancaria'
        };

        const cleanEmail = normalizeEmail(formData.email);
        const cleanTel = cleanPhone(formData.telefone);
        const cleanNom = cleanString(formData.nome);

        await submitDonation({
          nome: cleanNom,
          email: cleanEmail,
          telefone: cleanTel,
          causa: formData.causa,
          valor: parseFloat(formData.valor) || 0,
          mensagem: cleanString(formData.mensagem) || null,
          metodo_pagamento: paymentMap[formData.metodoPagamento] || formData.metodoPagamento
        });

        setIsSubmitted(true);
      } catch (err) {
        console.error('Error saving donation:', err);
        alert('Ocorreu um erro ao submeter a sua doacao. Por favor, tente novamente.');
      }
    }
  };

  return (
    <div className="relative min-h-screen pb-24 bg-brand-bigStone">
      {/* Blurred Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/images/Doar.jpg"
          alt="Background"
          className="w-full h-full object-cover opacity-80 blur-sm scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-950/50" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-16 mb-4 text-left space-y-3">
        <span className="inline-flex items-center rounded-lg bg-blue-600 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
          Apoie a Nossa Causa
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Cada doacao e uma vida transformada
        </h1>
      </div>

      {/* Form Section */}
      <section className="max-w-2xl mx-auto px-6 relative z-20">
        <div className="bg-white dark:bg-dark-surface rounded-md shadow-sm p-8 md:p-10 border border-brand-poloBlue/20 dark:border-dark-muted/10 transition-colors">

          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6"
              >
                <div className="w-20 h-20 bg-feedback-successLight text-feedback-success rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-brand-bigStone dark:text-dark-text">Obrigado pela sua Doacao!</h2>
                <p className="text-brand-bigStone dark:text-dark-muted max-w-md mx-auto leading-relaxed text-sm">
                  A sua generosidade fara a diferenca na vida de muitas criancas. Recebera um email com os detalhes e o recibo da sua contribuicao.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ nome: '', email: '', telefone: '', causa: '', valor: '', mensagem: '', metodoPagamento: '' });
                  }}
                  className="mt-6 btn-ghost"
                >
                  Fazer nova doacao
                </button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-brand-bigStone dark:text-dark-text">Formulario de Doacao</h2>
                  <p className="text-brand-bigStone dark:text-dark-muted text-xs mt-1">Os dados estao seguros e encriptados (Nao preencha se a doacao for anonima)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nome Completo */}
                  <div className="space-y-1">
                    <label className="form-label !text-brand-bigStone dark:!text-dark-text">Nome Completo *</label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      onBlur={() => setFormData(prev => ({ ...prev, nome: formatTitleCase(prev.nome) }))}
                      className={`form-input ${errors.nome ? 'border-feedback-error focus:ring-feedback-error/10 focus:border-feedback-error' : ''}`}
                      placeholder="Introduza o seu nome"
                    />
                    {errors.nome && <p className="text-feedback-error text-[11px] mt-1">{errors.nome}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="form-label !text-brand-bigStone dark:!text-dark-text">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => setFormData(prev => ({ ...prev, email: normalizeEmail(prev.email) }))}
                      className={`form-input ${errors.email ? 'border-feedback-error focus:ring-feedback-error/10 focus:border-feedback-error' : ''}`}
                      placeholder="seu@email.com"
                    />
                    {errors.email && <p className="text-feedback-error text-[11px] mt-1">{errors.email}</p>}
                  </div>

                  {/* Contacto Telefonico */}
                  <div className="space-y-1">
                    <label className="form-label !text-brand-bigStone dark:!text-dark-text">Contacto Telefonico *</label>
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      className={`form-input ${errors.telefone ? 'border-feedback-error focus:ring-feedback-error/10 focus:border-feedback-error' : ''}`}
                      placeholder="84 123 4567 ou +258..."
                    />
                    {formData.metodoPagamento === 'mpesa' && !errors.telefone && (
                      <p className="text-[11px] text-rose-500 font-medium pt-0.5">Para M-Pesa, utilize um número Vodacom (84 ou 85).</p>
                    )}
                    {formData.metodoPagamento === 'emola' && !errors.telefone && (
                      <p className="text-[11px] text-orange-500 font-medium pt-0.5">Para E-Mola, utilize um número Movitel (86 ou 87).</p>
                    )}
                    {errors.telefone && <p className="text-feedback-error text-[11px] mt-1">{errors.telefone}</p>}
                  </div>

                  {/* Causa a Apoiar */}
                  <div className="space-y-1">
                    <label className="form-label !text-brand-bigStone dark:!text-dark-text">Causa a Apoiar *</label>
                    <div className="relative">
                      <select
                        name="causa"
                        value={formData.causa}
                        onChange={handleChange}
                        className={`form-input appearance-none cursor-pointer pr-10 ${errors.causa ? 'border-feedback-error focus:ring-feedback-error/10 focus:border-feedback-error' : ''}`}
                      >
                        <option value="" disabled>Selecione uma causa</option>
                        {causas.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    {errors.causa && <p className="text-feedback-error text-[11px] mt-1">{errors.causa}</p>}
                  </div>

                  {/* Valor da Contribuição */}
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="form-label !text-brand-bigStone dark:!text-dark-text">Valor da Contribuição (MT)</label>
                      <span className="text-[11px] text-slate-400">Opcional no registo (MZN)</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        name="valor"
                        inputMode="numeric"
                        value={formData.valor}
                        onChange={handleChange}
                        className={`form-input pr-12 font-semibold ${errors.valor ? 'border-feedback-error focus:ring-feedback-error/10 focus:border-feedback-error' : ''}`}
                        placeholder="Ex: 500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        MT
                      </span>
                    </div>
                    {errors.valor && <p className="text-feedback-error text-[11px] mt-1">{errors.valor}</p>}

                    {/* Quick Amount Chips */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">Sugestões rápidas:</span>
                      {quickAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, valor: amt }));
                            if (errors.valor) setErrors(prev => ({ ...prev, valor: '' }));
                          }}
                          className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer border ${
                            formData.valor === amt
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-dark-bg dark:text-dark-text dark:border-dark-muted/20'
                          }`}
                        >
                          {amt} MT
                        </button>
                      ))}
                    </div>
                  </div>



                  {/* Metodo de Pagamento */}
                  <div className="space-y-3 md:col-span-2 mt-2">
                    <label className="form-label !text-brand-bigStone dark:!text-white">Meio de Contribuicao (Selecione uma das opcoes abaixo) *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {Object.entries(paymentDetails).map(([key, details]) => (
                        <div
                          key={key}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, metodoPagamento: key }));
                            if (errors.metodoPagamento) setErrors(prev => ({ ...prev, metodoPagamento: '' }));
                          }}
                          className={`relative flex flex-col p-4 cursor-pointer rounded-xl border transition-all ${
                            formData.metodoPagamento === key
                              ? 'border-brand-primary bg-brand-poloBlue/20 ring-2 ring-brand-primary/10 shadow-sm dark:bg-brand-horizon/20 dark:border-brand-horizon dark:ring-brand-horizon/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-brand-poloBlue/15 dark:bg-dark-bg/50 dark:border-dark-muted/20 dark:hover:bg-dark-bg dark:hover:border-dark-muted/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <div className="p-1.5 bg-brand-poloBlue/15 dark:bg-dark-surface rounded-lg border border-brand-poloBlue/20 dark:border-dark-muted/10">
                              {details.icon}
                            </div>
                            <span className="font-bold text-brand-bigStone dark:text-white text-xs">{details.title}</span>
                          </div>

                          {/* Expanded Details when selected */}
                          <AnimatePresence>
                            {formData.metodoPagamento === key && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-3 mt-3 border-t border-slate-200/60 text-left">
                                  <p className="text-[9px] text-brand-bigStone dark:text-dark-muted uppercase tracking-wider font-semibold mb-0.5 opacity-70">Dados da Conta</p>
                                  <p className="font-bold text-brand-bigStone dark:text-white text-xs break-all leading-tight">{details.number}</p>
                                  <p className="text-[10px] text-brand-bigStone dark:text-dark-muted mt-1.5 leading-snug opacity-80">{details.instruction}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                    {errors.metodoPagamento && <p className="text-feedback-error text-[11px] mt-1">{errors.metodoPagamento}</p>}
                  </div>

                  {/* Mensagem Opcional */}
                  <div className="space-y-1 md:col-span-2 mt-2">
                    <label className="form-label !text-brand-bigStone dark:!text-dark-text">Mensagem (Opcional)</label>
                    <textarea
                      name="mensagem"
                      value={formData.mensagem}
                      onChange={handleChange}
                      rows="3"
                      className="form-input resize-none h-20"
                      placeholder="Gostaria de deixar alguma mensagem ou observacao?"
                    />
                  </div>

                </div>

                <div className="pt-6 border-t border-brand-poloBlue/20 dark:border-dark-muted/10 flex items-center justify-between flex-wrap gap-4 mt-6">
                  <p className="text-xs text-brand-bigStone dark:text-dark-muted leading-normal max-w-sm">
                    Ao confirmar, aceita os nossos <a href="#" className="text-brand-horizon hover:underline">Termos de Doacao</a>.
                  </p>
                  <button
                    type="submit"
                    className="btn-primary w-full sm:w-auto text-sm px-6 py-3"
                  >
                    Confirmar Doacao <ArrowRight size={16} />
                  </button>
                </div>

              </motion.form>
            )}
          </AnimatePresence>

        </div>
      </section>
    </div>
  );
}
