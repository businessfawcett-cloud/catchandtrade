'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0f1a2e 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-poke-gold hover:text-white mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-rajdhani font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-lg text-poke-text-muted">
          <p className="text-lg mb-6">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Account information (email, username, display name)</li>
              <li>Profile information you choose to share</li>
              <li>Portfolio and collection data</li>
              <li>Transaction history</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Provide and maintain our services</li>
              <li>Process your transactions</li>
              <li>Send you important updates and notifications</li>
              <li>Improve and personalize your experience</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Service providers who help operate our platform</li>
              <li>Other users (according to your profile settings)</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">4. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">5. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal information at any time through your account settings.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-rajdhani font-bold text-white mb-4">6. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us through the app.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
