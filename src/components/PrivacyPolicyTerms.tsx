import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyTerms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFD]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEF] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            title="Back to App"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <Shield className="w-5 h-5 text-[#7C5CFC]" />
          <h1 className="font-display font-black text-gray-900 text-lg">Privacy Policy & Terms of Service</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        
        {/* Privacy Policy Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-[#7C5CFC] rounded-full"></div>
            <h2 className="font-display font-black text-gray-900 text-2xl">Privacy Policy</h2>
          </div>
          <p className="text-xs text-gray-400">Last updated: June 2025</p>

          <div className="bg-white border border-[#EBEBEF] rounded-2xl p-6 space-y-5 text-sm text-gray-700 leading-relaxed">
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">1. Information We Collect</h3>
              <p>We collect information you provide directly to us, including:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Account information (name, email address, password)</li>
                <li>Gmail account credentials for sending emails (OAuth tokens)</li>
                <li>Contact lists and email campaign data you upload or create</li>
                <li>Usage data and analytics related to your campaigns</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">2. How We Use Your Information</h3>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Provide, maintain, and improve our email campaign services</li>
                <li>Send emails on your behalf through connected Gmail accounts</li>
                <li>Monitor campaign performance and provide analytics</li>
                <li>Communicate with you about service updates and support</li>
                <li>Ensure compliance with applicable laws and our terms of service</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">3. Data Storage & Security</h3>
              <p>
                Your data is stored securely on our servers with encryption at rest and in transit. 
                OAuth tokens for Gmail accounts are stored securely and are only used for authorized email sending. 
                We implement industry-standard security measures to protect your personal information.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">4. Data Sharing</h3>
              <p>
                We do not sell, trade, or rent your personal information to third parties. 
                We may share information only in the following circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or valid legal processes</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">5. Data Retention</h3>
              <p>
                We retain your personal data for as long as your account is active or as needed to provide services. 
                You may request deletion of your account and associated data at any time by contacting our support team.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">6. Your Rights</h3>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Access, update, or delete your personal information</li>
                <li>Revoke Gmail OAuth access at any time</li>
                <li>Export your campaign data</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">7. Cookies & Tracking</h3>
              <p>
                We use essential cookies and local storage to maintain your session and preferences. 
                We do not use third-party tracking cookies for advertising purposes.
              </p>
            </div>
          </div>
        </section>

        {/* Terms of Service Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-[#7C5CFC] rounded-full"></div>
            <h2 className="font-display font-black text-gray-900 text-2xl">Terms of Service</h2>
          </div>
          <p className="text-xs text-gray-400">Last updated: June 2025</p>

          <div className="bg-white border border-[#EBEBEF] rounded-2xl p-6 space-y-5 text-sm text-gray-700 leading-relaxed">
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">1. Acceptance of Terms</h3>
              <p>
                By accessing or using our email campaign platform, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">2. Service Description</h3>
              <p>
                Our platform provides email campaign management tools, including Gmail account integration, 
                contact list management, campaign scheduling, and analytics. The service is provided "as is" 
                and we reserve the right to modify or discontinue features at any time.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">3. Account Responsibilities</h3>
              <p>You are responsible for:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring your use complies with applicable laws and regulations</li>
                <li>Obtaining proper consent from email recipients</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">4. Acceptable Use Policy</h3>
              <p>You agree NOT to use our service to:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Send unsolicited spam or bulk emails without recipient consent</li>
                <li>Distribute malware, phishing content, or fraudulent messages</li>
                <li>Violate any applicable anti-spam laws (CAN-SPAM, GDPR, etc.)</li>
                <li>Harvest email addresses without consent</li>
                <li>Impersonate others or misrepresent your identity</li>
                <li>Exceed Gmail's sending limits or abuse Google's terms of service</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">5. Gmail Integration</h3>
              <p>
                By connecting your Gmail account, you authorize our platform to send emails on your behalf. 
                You acknowledge that you are solely responsible for the content of emails sent through our service 
                and must comply with Google's Terms of Service and Gmail's usage policies.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">6. Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including loss of profits, data, or business opportunities, 
                arising from your use of the service. Our total liability shall not exceed the amount paid by you 
                in the twelve months preceding the claim.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">7. Termination</h3>
              <p>
                We reserve the right to suspend or terminate your account at any time if you violate these terms 
                or engage in activities that harm our platform or other users. Upon termination, your right to 
                use the service ceases immediately.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">8. Changes to Terms</h3>
              <p>
                We may update these terms from time to time. Continued use of the service after changes 
                constitutes acceptance of the modified terms. We will notify users of significant changes 
                via email or in-app notification.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">9. Contact</h3>
              <p>
                If you have questions about these terms or our privacy practices, please contact our support team 
                through the platform.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-6 border-t border-[#EBEBEF]">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Equinox Mail Platform. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
