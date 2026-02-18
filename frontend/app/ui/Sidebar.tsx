"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Home, BarChart2, UploadCloud, Globe } from 'lucide-react';

const links = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart2 },
  { name: 'Admin Panel', href: '/admin', icon: UploadCloud },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 flex flex-col z-50 shadow-sm"
    >
      <div className="p-6 border-b border-gray-50 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">IHR</div>
        <span className="font-semibold text-lg tracking-tight text-gray-900">Compliance</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link href="/" className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
            pathname === '/' ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        )}>
            <Home className="w-5 h-5" />
            <span>Home</span>
        </Link>

        {links.map((link) => {
          const LinkIcon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium shadow-sm ring-1 ring-blue-100"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"
                />
              )}
              <LinkIcon className={clsx("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-blue-600")} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400">
           <Globe className="w-4 h-4" />
           <span>Region: Americas</span>
        </div>
      </div>
    </motion.aside>
  );
}
