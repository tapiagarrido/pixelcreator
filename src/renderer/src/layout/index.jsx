import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { FaHome } from 'react-icons/fa'


const LayoutPage = () => {
  return (
    <>
      <div className='h-screen bg-gradient-to-br from-gray-100 to-gray-50'>
        <nav className='bg-gray-300 shadow-lg p-1 border-b-2 border-gray-400'>
          <div className='px-2 py-1'>
            <Link className='text-gray-700 text-xl' to={"/"}>
              <FaHome/>
            </Link>
          </div>
        </nav>
        <div className="">
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* Outlet para manejar las rutas anidadas */}
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}

export default LayoutPage
