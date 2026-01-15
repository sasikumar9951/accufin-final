"use client";

type ShowTermsProps = {
  readonly toggleTerms: () => void;
};

export default function ShowTerms({ toggleTerms }: ShowTermsProps) {
  return (
    <div className="fixed inset-0 bg-[#00000043] backdrop-blur-[3px] bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 pt-0 pb-0">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-4">
          <h2 className="text-2xl font-bold">Privacy Policy</h2>
          <button
            onClick={toggleTerms}
            className="text-gray-500 hover:text-gray-700 focus:outline-none text-2xl"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="space-y-6">
          <div className="border-b pb-2">
            <p className="font-semibold">Effective Date: March 1, 2025</p>
            <p className="font-semibold">Last Updated: March 1, 2025</p>
          </div>

          <p className="text-lg">
            Accufin Services Inc. is committed to protecting the privacy and
            security of your personal information. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your data
            when you use our bookkeeping, accounting, and payroll services
            in Canada.
          </p>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">1. Information We Collect</h3>
            <p>
              We collect only information necessary to deliver our services,
              including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Personal Identifiers:</strong> Name, address, phone,
                email, SIN (for payroll)
              </li>
              <li>
                <strong>Business Details:</strong> Business name, CRA
                business number, incorporation documents
              </li>
              <li>
                <strong>Financial Data:</strong> Bank statements, invoices,
                receipts, tax filings, expense reports, payroll records
              </li>
              <li>
                <strong>Technical Information:</strong> IP address, browser
                type, usage data (via website analytics)
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">
              2. How We Use Your Information
            </h3>
            <p>Your data is used strictly for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Providing bookkeeping, accounting, tax, or payroll services
              </li>
              <li>
                Filing documents with the CRA (e.g., GST/HST, T4s, corporate
                taxes)
              </li>
              <li>Communicating service updates or regulatory changes</li>
              <li>Improving our services and website experience</li>
              <li>
                Complying with legal obligations (e.g., audits, anti-fraud
                laws)
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">
              3. How We Share Your Information
            </h3>
            <p>We do not sell your data. Disclosures are limited to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Regulatory Bodies:</strong> CRA, Revenu Québec, or
                other tax authorities as legally required
              </li>
              <li>
                <strong>Third-Party Service Providers:</strong> Secure cloud
                accounting platforms (e.g., QuickBooks, Xero), payroll
                software, or encrypted document storage tools—all bound by
                confidentiality agreements
              </li>
              <li>
                <strong>Legal Compliance:</strong> If compelled by court
                order, subpoena, or lawful request
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">4. Data Security</h3>
            <p>
              We implement rigorous measures to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Encryption:</strong> Data transmitted/stored via
                SSL/TLS encryption
              </li>
              <li>
                <strong>Access Controls:</strong> Role-based access limited
                to authorized staff
              </li>
              <li>
                <strong>Secure Tools:</strong> Industry-standard platforms
                (e.g., QuickBooks Secure, Xero)
              </li>
              <li>
                <strong>Training:</strong> Staff trained in privacy best
                practices and PIPEDA compliance
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">5. Data Retention</h3>
            <p>We retain your information only as long as necessary:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Active Clients:</strong> For the duration of our
                service agreement
              </li>
              <li>
                <strong>Inactive Clients:</strong> 7 years (to comply with
                CRA record-keeping requirements)
              </li>
            </ul>
            <p>After this period, data is securely destroyed.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">6. Your Rights</h3>
            <p>Under PIPEDA, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Access:</strong> Request a copy of your personal
                data
              </li>
              <li>
                <strong>Correct:</strong> Update inaccurate or incomplete
                information
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Opt out of non-essential
                communications (e.g., newsletters)
              </li>
              <li>
                <strong>Complain:</strong> Contact the Office of the Privacy
                Commissioner of Canada if concerned about our practices
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">
              7. Cross-Border Data Transfers
            </h3>
            <p>
              Your data is stored in Canada whenever possible. If
              transferred internationally (e.g., via cloud servers in the
              U.S.), we ensure providers comply with PIPEDA-equivalent
              safeguards (e.g., GDPR for EU data).
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">8. Cookies & Tracking</h3>
            <p>Our website may use cookies to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Enhance user experience (e.g., login sessions)</li>
              <li>
                Collect anonymized analytics (via tools like Google
                Analytics)
              </li>
            </ul>
            <p>You can disable cookies via your browser settings.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">9. Children's Privacy</h3>
            <p>
              Our services are not directed to individuals under 18. We do
              not knowingly collect their data.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">
              10. Updates to This Policy
            </h3>
            <p>
              We may update this policy to reflect legal changes. The "Last
              Updated" date will be revised, and significant changes will be
              communicated via email or our website.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">11. Contact Us</h3>
            <p>For privacy requests or questions:</p>
            <p>
              Email:{" "}
              <a
                href="mailto:info.accufin@gmail.com"
                className="text-[#007399] hover:underline"
              >
                info.accufin@gmail.com
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end sticky bottom-0 bg-white py-4">
          <button
            onClick={toggleTerms}
            className="bg-[#007399] hover:bg-[#005f7a] text-white font-semibold px-6 py-2 rounded transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}


