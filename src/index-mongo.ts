import dotenv from 'dotenv';
// Load environment variables as early as possible
dotenv.config();

import express from 'express';
import cors from 'cors';
import rotasAutenticadas from './rotas/rotas-autenticadas.js';
import rotasNaoAutenticadas from './rotas/rotas-nao-autenticadas.js';
import errorHandler from './middleware/errorHandler.js';
import Stripe from 'stripe';

// Validate STRIPE_SECRET_KEY to avoid using a publishable key by mistake
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('FATAL: STRIPE_SECRET_KEY não está definida. Configure sua Secret Key (começa com "sk_") no arquivo .env.');
  process.exit(1);
}
if (stripeKey.startsWith('pk_')) {
  console.error('FATAL: STRIPE_SECRET_KEY parece ser uma Publishable Key (pk_...). Use a Secret Key (sk_test_... ou sk_live_...) no backend.');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: '2022-11-15' });

const app = express();
app.use(cors());
app.use(express.json());

app.use(rotasNaoAutenticadas);
app.use(rotasAutenticadas);

// Expose publishable key to frontend to avoid mismatched key issues
app.get('/config', (req, res) => {
  const publishable = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLIC_KEY || null;
  if (!publishable) {
    return res.status(500).json({ mensagem: 'Publishable key não configurada no backend.' });
  }
  return res.json({ publishableKey: publishable });
});

// Middleware de tratamento de erros, verificar erros e validações(DEVE ser o ÚLTIMO)
app.use(errorHandler);

const port = process.env.PORT || 8000;
const host = process.env.HOST || 'localhost';
app.listen(port, () => {
    console.log(`Server is running at http://${host}:${port}/`);
});

//rota de teste do pagamento com cartão - STRIPE
app.post("/criar-pagamento-cartao", async (req, res) => {
  //Buscar o carrinho do usuário que está no token para pegar o amount
  //O amount aqui é em centavos, tem que fazer a conversão
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000,
      currency: "brl",
      payment_method_types: ["card"],
      metadata: {
        pedido_id: "123",
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    if (err instanceof Error)
      return res.status(400).json({ mensagem: err.message });
    res.status(400).json({ mensagem: "Erro de pagamento desconhecido!" });
  }
});