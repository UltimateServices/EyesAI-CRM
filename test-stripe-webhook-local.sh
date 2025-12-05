#!/bin/bash

echo "🔧 Stripe CLI Local Testing Setup"
echo "================================="
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI is not installed"
    echo "Install with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "✅ Stripe CLI installed: $(stripe --version)"
echo ""

# Check if logged in
echo "Checking Stripe authentication..."
if stripe config --list &> /dev/null; then
    echo "✅ Stripe CLI is authenticated"
else
    echo "⚠️  Stripe CLI not authenticated"
    echo "Run: stripe login"
    exit 1
fi
echo ""

# Show current configuration
echo "Current Stripe Configuration:"
echo "----------------------------"
stripe config --list 2>/dev/null | head -5
echo ""

# Instructions
echo "📋 Next Steps:"
echo ""
echo "1. Start your dev server:"
echo "   npm run dev"
echo ""
echo "2. In a new terminal, forward webhooks:"
echo "   stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo ""
echo "3. Copy the webhook signing secret (whsec_xxx) and add to .env:"
echo "   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx"
echo ""
echo "4. Restart your dev server"
echo ""
echo "5. Test webhook:"
echo "   stripe trigger checkout.session.completed"
echo ""
echo "6. Or start webhook forwarding with this command:"
echo "   stripe listen --forward-to localhost:3000/api/webhooks/stripe --print-secret"
echo ""

# Offer to start listening
echo "🚀 Ready to start? (This will show you the webhook secret)"
echo ""
read -p "Start Stripe webhook listener now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🎯 Starting Stripe webhook listener..."
    echo "📝 Copy the webhook signing secret below and add it to your .env file"
    echo "🔄 Then restart your dev server (npm run dev)"
    echo ""
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
fi
