"use client";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";

export default function DiscoverMorePage() {
    return (
        <div className="bg-white md:pt-[120px] pt-[150px]">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
                <div className="prose prose-lg max-w-none text-gray-700">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#0a2236] mb-8">
                        Your Financial Frustrations, Solved
                    </h1>

                    <p className="text-lg mb-8">
                        We understand the frustration of complex regulations, time-consuming paperwork, and financial uncertainty. That's why we focus on solving your real-world challenges:
                    </p>

                    <ul className="space-y-4 mb-10">
                        <li className="flex items-start gap-3">
                            <span className="text-[#00c6fb] font-bold">•</span>
                            <span><strong>Clarity from Complexity:</strong> Transforming raw numbers into clear, actionable intelligence you can understand and use.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-[#00c6fb] font-bold">•</span>
                            <span><strong>Time Reclaimed:</strong> Freeing you from administrative burdens to focus on your core business and passion.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-[#00c6fb] font-bold">•</span>
                            <span><strong>Confidence in Compliance:</strong> Proactively navigating regulations so you avoid surprises and sleep soundly.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-[#00c6fb] font-bold">•</span>
                            <span><strong>Risk Mitigation:</strong> Identifying potential financial pitfalls early and developing strategies to safeguard your success.</span>
                        </li>
                    </ul>

                    <p className="text-lg mb-10 bg-[#f8fafc] p-6 rounded-lg border-l-4 border-[#00c6fb]">
                        Experience accounting support that's responsive, accessible, and genuinely invested in your goals. Let us handle the numbers, so you can lead with vision.
                    </p>

                    <div className="mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2236] mb-6">
                            We combine accuracy, transparency, and strategic insight
                        </h2>
                        <p className="mb-6">
                            We combine accuracy, transparency, and strategic insight to streamline your finances and fuel your success. Our expert team follows the highest accounting standards, ensuring compliance, minimizing risks, and maximizing profitability. Whether you're a small business or a growing enterprise, trust us to keep your finances clear, compliant, and future-ready.
                        </p>
                        <p>
                            But we know it's about more than just numbers. We understand the real challenges you face every day:
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        <div className="bg-[#f8fafc] p-6 rounded-lg">
                            <h3 className="font-bold text-lg mb-4 text-[#0a2236]">The Pain Points We Solve</h3>
                            <ul className="space-y-3">
                                {[
                                    "The Overwhelm: Juggling invoices, payroll, taxes, and reports while trying to run your business",
                                    "The Fog: Making decisions without clear financial insight",
                                    "The Time Sink: Endless bookkeeping tasks stealing hours from your mission",
                                    "The Compliance Anxiety: Fear of costly mistakes or audits",
                                    "The Growth Uncertainty: Unsure about true financial health and cash flow"
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <span className="text-[#00c6fb]">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-[#f0f7ff] p-6 rounded-lg">
                            <h3 className="font-bold text-lg mb-4 text-[#0a2236]">Our Solutions</h3>
                            <ul className="space-y-3">
                                {[
                                    "Transform Complexity into Clarity",
                                    "Reclaim Your Most Valuable Asset: Time",
                                    "Replace Compliance Worry with Confidence",
                                    "Mitigate Risk & Safeguard Your Success"
                                ].map((item, index) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <span className="text-[#008db3] font-bold">{index + 1}.</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2236] mb-6">
                            Experience Partnership-Driven Accounting
                        </h2>
                        <p className="mb-6">
                            Forget the stereotype of the distant, reactive accountant. We're committed to being:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 mb-8">
                            {[
                                "Responsive: Your questions matter",
                                "Accessible: Reach us when you need us",
                                "Proactive: We look for opportunities",
                                "Genuinely Invested: Your success is our success"
                            ].map((item) => (
                                <div key={item} className="flex items-start gap-2 bg-[#f8fafc] p-4 rounded-lg">
                                    <span className="text-[#00c6fb]">•</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center bg-[#f0f7ff] p-8 rounded-xl">
                        <h3 className="text-2xl font-bold text-[#0a2236] mb-4">Ready to replace financial frustration with clarity?</h3>
                        <p className="mb-6">
                            Let us handle the complexities of your finances, so you can focus on what you do best: leading your business to greater success.
                        </p>
                        {/* <button className="bg-[#00c6fb] hover:bg-[#008db3] text-white font-bold py-3 px-8 rounded-lg transition-colors">
                            Get Started Today
                        </button> */}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}