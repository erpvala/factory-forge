// @ts-nocheck
import { ReactNode } from 'react';
import ValaAISidebar from './ValaAISidebar';

interface Props {
  children: ReactNode;
}

export default function ValaAILayout({ children }: Props) {
  return (
    <div className="flex h-screen bg-[#090c14] text-white overflow-hidden">
      <ValaAISidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
