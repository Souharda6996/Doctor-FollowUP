'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Calendar, MessageSquare, Bell } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/doctor/dashboard' },
  { icon: Users, label: 'Patients', href: '/doctor/patients' },
  { icon: Calendar, label: 'Follow-ups', href: '/doctor/followups' },
  { icon: MessageSquare, label: 'AI Chat', href: '/doctor/ai-assistant' },
  { icon: Bell, label: 'Alerts', href: '/doctor/alerts' },
];

export default function DoctorMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav lg:hidden">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className="nav-item">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-xl transition-all duration-200 ${
                active ? 'bg-blue-600' : 'text-slate-400'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />
            </motion.div>
            <span className={`text-[10px] font-medium leading-tight ${active ? 'text-blue-600' : 'text-slate-400'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
