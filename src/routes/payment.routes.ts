import { Router } from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth';
import { addCredits } from '../services/credit.service';
import { pgPool } from '../database/connection';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

router.use(authenticate);

const CREDIT_PACKAGES = {
  starter: { credits: 100, price: 2900 }, // $29
  pro: { credits: 500, price: 7900 }, // $79
  enterprise: { credits: 2000, price: 19900 } // $199
};

router.post('/create-checkout', async (req, res, next) => {
  try {
    const { package: packageName } = req.body;
    const userId = req.user!.id;

    if (!CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES]) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    const pkg = CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${packageName.charAt(0).toUpperCase() + packageName.slice(1)} Package`,
              description: `${pkg.credits} credits`
            },
            unit_amount: pkg.price
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      metadata: {
        userId,
        packageName,
        credits: pkg.credits.toString()
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
});

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, credits } = session.metadata!;

      // Add credits to user
      await addCredits(userId, parseInt(credits), session.id);

      // Record transaction
      await pgPool.query(
        `INSERT INTO transactions (user_id, type, amount, credits, stripe_payment_id, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, 'credit', session.amount_total! / 100, parseInt(credits), session.id, 'completed']
      );
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error}`);
  }
});

export default router;
