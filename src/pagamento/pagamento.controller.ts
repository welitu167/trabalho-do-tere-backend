import React, { useState } from 'react';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import api from '../api/api';

export default function CartaoPagamento(): React.ReactElement {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const pagar = async () => {
    if (!stripe || !elements) {
      setStatus('Stripe não carregado corretamente');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);

      if (!cardNumberElement) {
        setStatus('Preencha o número do cartão');
        setLoading(false);
        return;
      }

      const { error: paymentMethodError, paymentMethod } = await (stripe as any).createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: 'Nome do Cliente',
          email: 'cliente@email.com',
        },
      });

      if (paymentMethodError) {
        setStatus(`Erro: ${paymentMethodError.message}`);
        setLoading(false);
        return;
      }

      const { data } = await api.post('/criar-pagamento-cartao', {
        amount: 1000,
        currency: 'brl',
        paymentMethodId: paymentMethod.id,
      });

      const { clientSecret } = data;

      if (!clientSecret) {
        setStatus('Erro: Client Secret não recebido');
        setLoading(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await (stripe as any).confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) {
        setStatus(`Erro: ${confirmError.message}`);
      } else if (paymentIntent?.status === 'succeeded') {
        setStatus('Pagamento aprovado com sucesso!');
      } else {
        setStatus(`Status: ${paymentIntent?.status}`);
      }
    } catch (err) {
      const e = err as any;
      setStatus(`Erro inesperado: ${e?.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const cardOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      },
      invalid: {
        color: '#e5424d',
        ':focus': {
          color: '#e5424d',
        },
      },
    },
    hidePostalCode: true,
  };

  const statusClass = (s: string) => {
    if (!s) return '';
    if (s.includes('Erro') || s.includes('erro')) return 'mt-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200';
    if (s.includes('aprovado') || s.includes('sucesso')) return 'mt-4 p-3 rounded-md bg-green-50 text-green-700 border border-green-200';
    return 'mt-4 p-3 rounded-md bg-blue-50 text-blue-700 border border-blue-200';
  };

  return React.createElement(
    'div',
    { className: 'max-w-md mx-auto p-6 bg-white rounded-lg shadow-md' },
    React.createElement('h2', { className: 'text-2xl font-bold mb-6' }, 'Pagamento com Cartão'),
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement(
        'div',
        null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Número do cartão'),
        React.createElement('div', { className: 'p-3 border border-gray-300 rounded-md' }, React.createElement(CardNumberElement, { options: cardOptions }))
      ),
      React.createElement(
        'div',
        { className: 'grid grid-cols-2 gap-4' },
        React.createElement(
          'div',
          null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Validade (MM/AA)'),
          React.createElement('div', { className: 'p-3 border border-gray-300 rounded-md' }, React.createElement(CardExpiryElement, { options: cardOptions }))
        ),
        React.createElement(
          'div',
          null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'CVC'),
          React.createElement('div', { className: 'p-3 border border-gray-300 rounded-md' }, React.createElement(CardCvcElement, { options: cardOptions }))
        )
      )
    ),
    React.createElement(
      'button',
      {
        onClick: pagar as any,
        disabled: loading || !stripe,
        className: 'mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium',
      },
      loading ? 'Processando...' : 'Pagar R$ 10,00'
    ),
    status
      ? React.createElement(
          'div',
          { className: statusClass(status) },
          React.createElement('p', { className: 'text-sm' }, status)
        )
      : null
  );
}