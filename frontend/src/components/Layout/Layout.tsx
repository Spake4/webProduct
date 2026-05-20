import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-[#0d0d12]">
      <Sidebar />
      <main className="flex-1 ml-[72px] lg:ml-56 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
