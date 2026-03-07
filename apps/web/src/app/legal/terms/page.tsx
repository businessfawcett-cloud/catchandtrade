'use client';

import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-poke-gold hover:text-white mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-rajdhani font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert prose-lg text-poke-text-muted">
          <p className="text-lg mb-6">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using Catch & Trade, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">2. Use License</h2>
            <p>Permission is granted to temporarily use Catch & Trade for personal, non-commercial use only.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">4. Marketplace Rules</h2>
            <p>All card listings must be accurate and lawful. We reserve the right to remove any listing that violates our policies.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">5. Disclaimer</h2>
            <p>Catch & Trade is provided &quot;as is&quot; without warranty of any kind. We do not guarantee the accuracy or completeness of any card valuations.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">6. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us through the app.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
