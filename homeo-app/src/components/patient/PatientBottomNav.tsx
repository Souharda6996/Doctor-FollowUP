'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Pill, FileText, MessageSquare, Calendar } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/patient/home',         icon: Home,          label: 'Home'     },
  { href: '/patient/medicines',    icon: Pill,          label: 'Meds'     },
  { href: '/patient/reports',      icon: FileText,      label: 'Reports'  },
  { href: '/patient/quick-ask',    icon: MessageSquare, label: 'Ask'      },
  { href: '/patient/appointments', icon: Calendar,      label: 'Visits'   },
];

export default function PatientBottomNav() {
  const pathname = usePathname();

  return (
    <div className="bottom-nav max-w-md mx-auto">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link key={href} href={href} className="flex-1">
            <div className={`nav-item ${isActive ? 'text-[#1A6BFF]' : 'text-slate-400'}`}>
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="patient-nav-indicator"
                    className="absolute -inset-1.5 bg-[#1A6BFF]/10 rounded-xl"
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                )}
                <Icon className={`w-5 h-5 transition-colors duration-200 relative z-10 ${isActive ? 'text-[#1A6BFF]' : 'text-slate-400'}`} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive ? 'text-[#1A6BFF]' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
