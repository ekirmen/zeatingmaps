import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-300 py-2">
      <button
        className="w-full text-left font-medium focus:outline-none"
        onClick={() => setOpen(!open)}
      >
        {question}
      </button>
      {open && <p className="mt-1 text-sm">{answer}</p>}
    </div>
  );
};

const FaqWidget = () => {
  const { t } = useTranslation();
  const faqs = [
    {
      question: t('faq.q1', '¿Cómo compro entradas?'),
      answer: t(
        'faq.a1',
        'Selecciona el evento deseado, elige tus asientos y completa el proceso de pago.'
      ),
    },
    {
      question: t('faq.q2', '¿Puedo obtener un reembolso?'),
      answer: t(
        'faq.a2',
        'Dependerá de las políticas del evento. Contacta con soporte si tienes dudas.'
      ),
    },
    {
      question: t('faq.q3', '¿Dónde encuentro mis tickets?'),
      answer: t(
        'faq.a3',
        'Tras la compra podrás descargarlos desde tu perfil o desde el enlace enviado a tu correo.'
      ),
    },
  ];

  return (
    <div className="max-w-xl mx-auto my-4">
      <h2 className="text-2xl font-bold mb-4">{t('faq.title', 'Preguntas Frecuentes')}</h2>
      {faqs.map((faq, idx) => (
        <FaqItem key={idx} question={faq.question} answer={faq.answer} />
      ))}
    </div>
  );
};

export default FaqWidget;
