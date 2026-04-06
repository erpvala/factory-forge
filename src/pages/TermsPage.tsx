// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-slate-300">
          This is the active terms route used by footer and policy links.
          It prevents dead navigation and keeps route behavior consistent.
        </p>
        <ul className="list-disc pl-6 text-slate-300 space-y-2">
          <li>Use of services requires compliance with platform policies.</li>
          <li>Role-based access applies to protected modules and data.</li>
          <li>Operational and billing events are logged for accountability.</li>
        </ul>
        <Link to="/" className="inline-block text-cyan-400 hover:text-cyan-300">Back to home</Link>
      </div>
    </div>
  );
}
