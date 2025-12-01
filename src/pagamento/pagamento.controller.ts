import { Request, Response } from "express";
import Stripe from 'stripe';

class PagamentoController {
    async createPaymentIntent(req: Request, res: Response) {
        try {
            const { amount, currency } = req.body as { amount: number; currency?: string };
            if (!amount || typeof amount !== 'number') {
                return res.status(400).json({ error: 'amount (number, in cents) is required' });
            }

            const secretKey = process.env.STRIPE_SECRET_KEY;
            if (!secretKey) {
                return res.status(500).json({ error: 'Stripe secret key not configured on server' });
            }

            const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: currency || 'brl',
                payment_method_types: ['card']
            });

            return res.status(200).json({ clientSecret: paymentIntent.client_secret });
        } catch (err: any) {
            console.error('Error creating PaymentIntent:', err);
            return res.status(500).json({ error: 'Erro ao criar PaymentIntent' });
        }
    }
}

export default new PagamentoController();
