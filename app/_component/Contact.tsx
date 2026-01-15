"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [showTerms, setShowTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const toggleTerms = () => {
    setShowTerms(!showTerms);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/user/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: data.message || "Message sent successfully!",
        });
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setSubmitStatus({
          type: "error",
          message: data.error || "Failed to send message. Please try again.",
        });
      }
    } catch (error) {
      let errorMessage = "Network error. Please check your connection and try again.";
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }
      setSubmitStatus({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <section className="bg-[#f7f9fa] pt-12 pb-0 px-2" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12"
      >
        {/* Form */}
        <form className="flex-1 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="font-bold text-xl mb-2">Send Us a Message</div>

          {/* Status Message */}
          {submitStatus.type && (
            <div
              className={`p-3 rounded ${
                submitStatus.type === "success"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-red-100 text-red-700 border border-red-300"
              }`}
            >
              {submitStatus.message}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                className="border border-[#008db3] rounded px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-[#00c6fb] text-[#0a2236] disabled:opacity-50"
              />
            </div>
            <div className="flex-1 flex flex-col">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                className="border border-[#008db3] rounded px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-[#00c6fb] text-[#0a2236] disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className="border border-[#008db3] rounded px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-[#00c6fb] text-[#0a2236] disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col">
            <textarea
              name="message"
              placeholder="Message"
              value={formData.message}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className="border border-[#008db3] rounded px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-[#00c6fb] text-[#0a2236] min-h-[80px] disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#007399] hover:bg-[#005f7a] disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded transition-colors w-full md:w-auto disabled:cursor-not-allowed"
            >
              {isSubmitting ? "SENDING..." : "SEND MESSAGE"}
            </button>
            <span className="text-sm text-gray-600">
              By submitting, you agree to our{" "}
              <button
                type="button"
                onClick={toggleTerms}
                className="text-[#007399] hover:underline focus:outline-none font-bold"
              >
                Terms & Conditions
              </button>
            </span>
          </div>
        </form>

        {/* Contact Info */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="text-[#008db3] font-semibold tracking-widest mb-2 uppercase">
            Contact Us
          </div>
          <div className="text-3xl font-bold text-[#0a2236] mb-2">
            Get In Touch!
          </div>
          {/* <p className="text-[#5a6a7a] mb-4">
            Proin laoreet nisi vitae pharetra mattis, etiam luctus suscipit.
            Augue molestie a etiam quis tincidunt est, et efficitur ipsum nunc
            bibendum ut risus et vehicula proin tempus.
          </p> */}
          <div className="flex items-start mb-4">
            <FaPhoneAlt className="text-2xl mr-3 mt-1 text-[#00c6fb]" />
            <div>
              <div className="font-bold">Call Us</div>
              <div>+1 604 551 3023</div>
            </div>
          </div>
          <div className="flex items-start mb-4">
            <FaEnvelope className="text-2xl mr-3 mt-1 text-[#00c6fb]" />
            <div>
              <div className="font-bold">Email Us</div>
              <div>info.accufin@gmail.com</div>
            </div>
          </div>
          <div className="flex items-start">
            <FaMapMarkerAlt className="text-2xl mr-3 mt-1 text-[#00c6fb]" />
            <div>
              <div className="font-bold">Office Address</div>
              <div>8-3015 Trethewey Street, Abbotsford, BC V2T 3R4</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Map */}
      <div className="w-full mt-12">
        <iframe
          title="Google Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2602.991943081101!2d-122.34926502373044!3d49.05622607932473!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5485d9b47a768c6b%3A0x287ac716e6a77d46!2s8-3015%20Trethewey%20St%2C%20Abbotsford%2C%20BC%20V2T%203R4!5e0!3m2!1sen!2sca!4v1722310300000!5m2!1sen!2sca"
          width="100%"
          height="350"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-none grayscale w-full"
        ></iframe>
      </div>
      {showTerms && (
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
      )}
    </section>
  );
}
