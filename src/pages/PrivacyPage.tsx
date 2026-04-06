// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-slate-300">
          This page is the active privacy policy route for the platform.
          It replaces dead links and keeps navigation stable.
        </p>
        <ul className="list-disc pl-6 text-slate-300 space-y-2">
          <li>We collect only the data required to operate platform services.</li>
          <li>Access controls and role-based permissions protect sensitive data.</li>
          <li>Security and audit modules track privileged operations.</li>
        </ul>
        <Link to="/" className="inline-block text-cyan-400 hover:text-cyan-300">Back to home</Link>
      </div>
    </div>
  );
}
