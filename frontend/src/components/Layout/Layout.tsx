import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export const Layout = () => {
  return (
    <div className="flex min-h-screen">
      {/* Global animated aurora background */}
      <div className="aurora" aria-hidden />
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden ml-[72px] lg:ml-56 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
