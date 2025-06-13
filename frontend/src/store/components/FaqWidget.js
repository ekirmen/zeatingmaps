import React, { useState } from 'react';

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
  const faqs = [
    {
      question: '¿Cómo compro entradas?',
      answer:
        'Selecciona el evento deseado, elige tus asientos y completa el proceso de pago.'
    },
    {
      question: '¿Puedo obtener un reembolso?',
      answer:
        'Dependerá de las políticas del evento. Contacta con soporte si tienes dudas.'
    },
    {
      question: '¿Dónde encuentro mis tickets?',
      answer:
        'Tras la compra podrás descargarlos desde tu perfil o desde el enlace enviado a tu correo.'
    }
  ];

  return (
    <div className="max-w-xl mx-auto my-4">
      <h2 className="text-2xl font-bold mb-4">Preguntas Frecuentes</h2>
      {faqs.map((faq, idx) => (
        <FaqItem key={idx} question={faq.question} answer={faq.answer} />
      ))}
    </div>
  );
};

export default FaqWidget;
