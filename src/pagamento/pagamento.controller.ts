import { Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' });

class PagamentoController {
  async createPaymentIntent(req: Request, res: Response) {
    try {
      // amount em centavos
      const { amount, currency = 'brl' } = req.body as { amount?: number; currency?: string };
      if (!amount) return res.status(400).json({ mensagem: 'amount é obrigatório (em centavos)' });

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_types: ['card'],
      });

      // Debug: log id and client_secret to help diagnose frontend problems
      try {
        console.debug('Stripe PaymentIntent criado:', {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret ? '[REDACTED]' : null,
        });
      } catch (e) {
        // ignore logging errors
      }

      return res.status(200).json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
    } catch (err) {
      if (err instanceof Error) return res.status(400).json({ mensagem: err.message });
      return res.status(400).json({ mensagem: 'Erro desconhecido ao criar PaymentIntent' });
    }
  }
}

export default new PagamentoController();