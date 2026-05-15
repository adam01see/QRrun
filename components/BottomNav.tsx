'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, QrCode, Trophy, Map } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',    icon: Home,    label: 'Home'    },
  { href: '/world',        icon: Map,     label: 'World'   },
  { href: '/friends',      icon: Users,   label: 'Friends' },
  { href: '/profile',      icon: QrCode,  label: 'My QR'  },
  { href: '/achievements', icon: Trophy,  label: 'Awards'  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/60">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2 pb-safe">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors"
            >
              <Icon
                size={22}
                className={active ? 'text-green-400' : 'text-zinc-500'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-green-400' : 'text-zinc-500'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
