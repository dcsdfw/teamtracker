import { NavLink } from 'react-router-dom'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'

export default function Navigation() {
  return (
    <Sheet>
      <SheetTrigger>☰ Menu</SheetTrigger>
      <SheetContent>
        <nav className="space-y-4">
          <NavLink
            to="/manager-dashboard"
            className={({ isActive }) =>
              isActive ? 'font-bold text-blue-600' : 'text-gray-700'
            }
          >
            Manager Dashboard
          </NavLink>

          <NavLink
            to="/time-tracker"
            className={({ isActive }) =>
              isActive ? 'font-bold text-blue-600' : 'text-gray-700'
            }
          >
            Time Tracker
          </NavLink>

          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              isActive ? 'font-bold text-blue-600' : 'text-gray-700'
            }
          >
            Calendar
          </NavLink>

          <NavLink
            to="/login"
            className="text-red-500"
            onClick={() => localStorage.clear()}
          >
            Logout
          </NavLink>
        </nav>
      </SheetContent>
    </Sheet>
  )
} 