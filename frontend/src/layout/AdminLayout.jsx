import React from 'react'
import AdminContent from '../components/AdminContent'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'

const AdminLayout = () => {
  return (
    <div>
      <AdminSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AdminHeader />
        <div className="body flex-grow-1">
          <AdminContent />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
