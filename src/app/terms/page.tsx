"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans antialiased">
      
      {/* Main 2-Column Layout */}
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        
        {/* Left Sticky Sidebar (Table of Contents) */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-8 space-y-4 text-xs font-mono border-l border-zinc-800 pl-4 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
            <div className="pb-2 border-b border-zinc-800/80">
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-white transition font-mono font-bold">
                <ArrowLeft className="w-4 h-4" /> Back to Application
              </Link>
            </div>
            <p className="font-bold text-white tracking-widest uppercase text-[11px]">Table of Contents</p>
            <nav className="space-y-2 text-zinc-400">
              <a href="#section-1" className="block hover:text-emerald-400 transition">1. Intermediary Status</a>
              <a href="#section-2" className="block hover:text-emerald-400 transition">2. Disclaimer of Liability</a>
              <a href="#section-3" className="block hover:text-emerald-400 transition">3. User Conduct</a>
              <a href="#section-4" className="block hover:text-emerald-400 transition">4. Privacy Policy &amp; DPDP Act</a>
              <a href="#section-5" className="block hover:text-emerald-400 transition">5. Video Processing</a>
              <a href="#section-6" className="block hover:text-emerald-400 transition">6. Intellectual Property</a>
              <a href="#section-7" className="block hover:text-emerald-400 transition">7. Copyright Complaints</a>
              <a href="#section-8" className="block hover:text-emerald-400 transition">8. Virtual Tokens</a>
              <a href="#section-9" className="block hover:text-emerald-400 transition">9. Account Security</a>
              <a href="#section-10" className="block hover:text-emerald-400 transition">10. Refund Policy</a>
              <a href="#section-11" className="block hover:text-emerald-400 transition">11. Third-Party Services</a>
              <a href="#section-12" className="block hover:text-emerald-400 transition">12. Governing Law</a>
              <a href="#section-13" className="block hover:text-emerald-400 transition">13. Class Action Waiver</a>
              <a href="#section-14" className="block hover:text-emerald-400 transition">14. Grievance Officer</a>
              <a href="#section-15" className="block hover:text-emerald-400 transition">15. Updates to Terms</a>
            </nav>
            <div className="pt-4 border-t border-zinc-800/80">
              <Link href="/refund" className="text-emerald-400 hover:underline block text-[11px]">
                → Refund Policy
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Content Area (Humanized Clean Text) */}
        <main className="flex-1 space-y-10 text-[14px] leading-relaxed text-zinc-300">
          
          {/* Document Header */}
          <div className="border-b border-zinc-800 pb-6 space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-display">
              Terms of Service &amp; Privacy Policy
            </h1>
            <p className="text-zinc-400 text-xs font-mono">
              Governed under the Information Technology Act, 2000, Digital Personal Data Protection Act, 2023 &amp; Copyright Act, 1957 (India).
            </p>
          </div>

          {/* Clean Humanized Summary Banner */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl text-xs text-zinc-300 font-sans leading-relaxed">
            Welcome to CronoBash. We believe your study sessions should be productive, supportive, and private. We process video streams locally on your device for focus tracking and do not store or sell your personal data. Below are the terms governing your use of our platform.
          </div>

          {/* SECTION 1 */}
          <section id="section-1" className="space-y-4 pt-2 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              1. Technical Intermediary Status &amp; Infrastructure Scope
            </h2>
            <p>
              1.1 CronoBash (&quot;Platform&quot;, &quot;Operators&quot;, &quot;We&quot;, &quot;Us&quot;, &quot;Our&quot;) operates strictly as an automated technical intermediary under Section 79 of the Information Technology Act, 2000 (India) read with Rule 3 of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. Real-time focus evaluation is performed locally in your browser using WebAssembly (WASM) computer vision models. The Platform provides technical infrastructure for peer-to-peer WebRTC video stream routing, session timers, and study utilities. We do not initiate user video streams, select stream recipients, modify transmitted data, or exercise editorial control over user communications.
            </p>
            <p>
              1.2 The Platform is provided as a voluntary self-improvement tool for study discipline tracking. It is NOT an educational institution, accredited training provider, financial service, or gaming service. Access is subject to your compliance with all applicable local, state, national, and international laws.
            </p>
            <p>
              1.3 Pursuant to Section 6(1) and Section 8(2) of the Digital Personal Data Protection Act, 2023, by creating an account or accessing the Platform, you confirm that you are at least 18 years of age, or, if you are between 13 and 17 years old, that you have obtained consent from a parent or legal guardian. Registration by individuals under 13 years of age is strictly prohibited.
            </p>
          </section>

          {/* SECTION 2 */}
          <section id="section-2" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              2. Disclaimer of Warranties &amp; Limitation of Liability
            </h2>
            <p>
              2.1 To the maximum extent permitted by applicable law, the Platform, software architecture, focus detection algorithms, timer engines, and associated content are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, express or implied. We do not guarantee that the service will be uninterrupted, timely, secure, or error-free.
            </p>
            <p>
              2.2 Under no circumstances shall Platform operators, founders, developers, or affiliates be liable for any indirect, incidental, consequential, or special damages (including loss of data, revenue, or work disruption) arising out of your access to or use of the Service. In all cases, our maximum aggregate liability for any claims related to this agreement is capped at INR ₹100 or the total fees paid by you in the preceding 30 days, whichever is lower.
            </p>
            <p>
              2.3 CronoBash provides productivity tracking tools. We do not guarantee academic results, exam performance, or grade improvements. Focus scores are informational productivity metrics only.
            </p>
          </section>

          {/* SECTION 3 */}
          <section id="section-3" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              3. User Conduct, Asymmetric Risk &amp; Indemnification
            </h2>
            <p>
              3.1 Collaborative study rooms operate as peer-to-peer WebRTC video relays. We do not actively moderate or inspect private user streams in real time. Participation in group study rooms is undertaken at your own risk.
            </p>
            <p>
              3.2 You agree to defend, indemnify, and hold harmless CronoBash, its operators, and developers from any third-party claims, liabilities, or legal costs arising out of your conduct in study rooms, your violation of these Terms, or your infringement of third-party intellectual property or privacy rights.
            </p>
            <p>
              3.3 You agree to reimburse CronoBash for any reasonable legal defense costs incurred as a result of defending against any lawsuit or administrative proceeding brought by you or on your behalf in violation of these Terms.
            </p>
          </section>

          {/* SECTION 4 */}
          <section id="section-4" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              4. Privacy Policy &amp; Digital Personal Data Protection (DPDP Act, 2023)
            </h2>
            <p>
              4.1 In compliance with Section 5 and Section 6 of the Digital Personal Data Protection Act, 2023 (India), data collection is limited strictly to operational needs: basic profile details (email, full name, avatar URL) for account access, and numerical session statistics (focus score percentage and study session length) for your personal dashboard.
            </p>
            <p>
              4.2 Pursuant to Sections 11, 12, and 13 of the DPDP Act 2023, you have rights to access, correct, or request deletion of your personal data. You may withdraw consent at any time by closing your account or contacting our Grievance Officer.
            </p>
            <p>
              4.3 Pursuant to Section 9 of the DPDP Act 2023, processing of data for minors aged 13 to 17 requires parental or legal guardian consent. CronoBash does not conduct behavioral ad tracking or targeted profiling on any users.
            </p>
          </section>

          {/* SECTION 5 */}
          <section id="section-5" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              5. Client-Side Video Processing &amp; Telemetry Warranty
            </h2>
            <p>
              5.1 Your webcam stream is evaluated locally inside your browser using WebAssembly (WASM) vision models. Your optical telemetry is calculated in your device memory to produce numerical focus scores.
            </p>
            <p>
              5.2 We do not record, store, or transmit your raw video streams, facial images, or biometric geometry matrices to any server. By using the platform, you grant permission for your local browser environment to process focus scores locally, while releasing CronoBash from liability related to local hardware workload or device battery usage.
            </p>
          </section>

          {/* SECTION 6 */}
          <section id="section-6" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              6. Intellectual Property Rights
            </h2>
            <p>
              6.1 All source code, application architecture, WebAssembly vision models, user interface designs, branding (&quot;CronoBash&quot;), logos, and focus algorithms are the exclusive intellectual property of Platform Operators, protected under the Copyright Act, 1957 (India) and international intellectual property laws.
            </p>
            <p>
              6.2 Unauthorized scraping, automated data harvesting, reverse engineering, decompiling, or cloning of CronoBash software or UI components is strictly prohibited and constitutes a violation of the Copyright Act, 1957 and Section 43 of the IT Act, 2000.
            </p>
          </section>

          {/* SECTION 7 */}
          <section id="section-7" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              7. Copyright Complaints &amp; Takedown Policy
            </h2>
            <p>
              7.1 We respect intellectual property rights. If you believe any content on CronoBash infringes your copyright, please send a written takedown notice to cronobash@gmail.com containing proof of ownership, exact material location, and your contact details.
            </p>
            <p>
              7.2 In accordance with Rule 3(1)(d) of the IT Intermediary Rules 2021, upon receiving a verified written notice, access to the reported infringing material will be disabled within 36 hours.
            </p>
          </section>

          {/* SECTION 8 */}
          <section id="section-8" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              8. Virtual Tokens &amp; Study Points
            </h2>
            <p>
              8.1 Virtual tokens, streak points, and badges displayed on the platform are non-monetary entertainment counters meant strictly for personal study motivation.
            </p>
            <p>
              8.2 Focus tokens have ZERO cash value, cannot be converted into real currency or rewards, and do not constitute bank deposits, financial balances, or gaming/gambling stakes.
            </p>
          </section>

          {/* SECTION 9 */}
          <section id="section-9" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              9. Account Security &amp; Termination
            </h2>
            <p>
              9.1 To protect our student community, we enforce strict platform security. Under Rule 3(1)(b) of the IT Intermediary Rules 2021, we reserve the right to restrict or terminate accounts that engage in platform abuse, harassment, or security manipulation.
            </p>
            <p>
              9.2 If an account is suspended or terminated for severe violations of these Terms or community safety rules, active access passes and virtual study counters are forfeited without cash compensation.
            </p>
          </section>

          {/* SECTION 10 */}
          <section id="section-10" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              10. Refund Policy &amp; Billing Discrepancies
            </h2>
            <p>
              10.1 All purchases of paid features, subscriptions, and optional digital passes on CronoBash are final and non-refundable. Refunds are not issued for user mistakes, change of mind, local internet disconnections, or device incompatibility.
            </p>
            <p>
              10.2 Automatic refunds for duplicate billing charges caused by banking network timeouts are processed automatically by payment gateways under Reserve Bank of India (RBI) rules. For detailed billing steps, please read our dedicated <Link href="/refund" className="text-emerald-400 underline font-semibold">Refund Policy</Link>.
            </p>
          </section>

          {/* SECTION 11 */}
          <section id="section-11" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              11. Third-Party Services &amp; Infrastructure
            </h2>
            <p>
              11.1 We use trusted cloud hosting and WebRTC signaling services to route study room connections. We are not responsible for temporary network disruptions caused by external ISP or third-party cloud infrastructure outages.
            </p>
            <p>
              11.2 The Platform may contain links to third-party sites. We do not control and are not responsible for the privacy practices or content of external websites.
            </p>
          </section>

          {/* SECTION 12 */}
          <section id="section-12" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              12. Governing Law &amp; Arbitration
            </h2>
            <p>
              12.1 These Terms are governed by and construed in accordance with the laws of India, subject to the jurisdiction of the civil courts at New Delhi, India.
            </p>
            <p>
              12.2 Any legal dispute or claim arising out of these Terms shall be resolved through binding arbitration under the Indian Arbitration &amp; Conciliation Act, 1996, by a sole arbitrator appointed by mutual agreement. The venue of arbitration shall be New Delhi, India, conducted in English.
            </p>
          </section>

          {/* SECTION 13 */}
          <section id="section-13" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              13. Class Action Waiver
            </h2>
            <p>
              13.1 You agree to resolve any disputes with CronoBash on an individual basis, and waive any right to bring or participate in any class action lawsuit, public interest litigation, or representative legal proceeding.
            </p>
          </section>

          {/* SECTION 14 */}
          <section id="section-14" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              14. Account Deletion &amp; Grievance Redressal
            </h2>
            <p>
              14.1 Account data is retained while your account is active. When you delete your account, your personal data is removed from active databases except where retention is required by Indian law.
            </p>
            <p>
              14.2 In accordance with Rule 3(2)(a) of the IT Intermediary Rules 2021 and Section 10 of the DPDP Act 2023, user grievances or privacy inquiries may be directed to our designated compliance desk:
            </p>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2 text-xs font-mono">
              <p><strong className="text-white">Designation:</strong> Grievance &amp; Legal Compliance Officer, CronoBash Platform</p>
              <p><strong className="text-white">Official Grievance Email:</strong> <a href="mailto:cronobash@gmail.com" className="text-emerald-400 underline font-bold">cronobash@gmail.com</a></p>
              <p><strong className="text-white">Legal &amp; Copyright Desk:</strong> <a href="mailto:cronobash@gmail.com" className="text-emerald-400 underline font-bold">cronobash@gmail.com</a></p>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              We acknowledge formal grievance emails within 48 business hours and resolve verified issues within statutory timelines under Indian law.
            </p>
          </section>

          {/* SECTION 15 */}
          <section id="section-15" className="space-y-4 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              15. Updates to Terms &amp; Severability
            </h2>
            <p>
              15.1 If any provision of these Terms is found to be invalid or unenforceable, that specific provision shall be enforced to the maximum extent permitted, and the remaining provisions shall remain in full force.
            </p>
            <p>
              15.2 We may update these Terms of Service and Privacy Policy from time to time. We will notify users of major updates via platform banner or email. Continued use of CronoBash after updates are posted constitutes acceptance of revised terms.
            </p>
            <p>
              15.3 These Terms constitute the complete legal contract between you and CronoBash under the Indian Contract Act, 1872.
            </p>
          </section>

        </main>
      </div>

    </div>
  );
}
