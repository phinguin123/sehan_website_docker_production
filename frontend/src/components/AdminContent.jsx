import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import AdminDashboardPage from '../Pages/AdminDashboardPage'
import AdminPrivateRoutes from './AdminPrivateRoutes'

// routes config
import adminRoutes from '../adminRoutes'

const AdminContent = () => {
  return (
      <Suspense fallback={<CSpinner color="primary" />}>
        {/* <Routes>
          {routes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              )
            )
          })}
          <Route path="/" element={<Navigate to="dashboard" replace />} />
        </Routes> */}
        <Routes>

        <Route element={<AdminPrivateRoutes />}>
        {adminRoutes.map((adminRoute, idx) => {
              return (
                adminRoute.element && (
                  <Route
                    key={idx}
                    path={adminRoute.path}
                    exact={adminRoute.exact}
                    name={adminRoute.name}
                    element={<adminRoute.element />}
                  />
                )
              )
            })}
          {/* <Route path="/dashboard" element={<AdminDashboardPage />} /> */}
        </Route>  
          
          <Route path="/" element={<Navigate to="/secure-sehan-admin/dashboard" replace />} />
        </Routes>
      </Suspense>
  )
}

export default React.memo(AdminContent)
