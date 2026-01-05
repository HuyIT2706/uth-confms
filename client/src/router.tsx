

import { createBrowserRouter } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import TestAuth from './TestAuth' 
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Forbidden from './pages/Forbidden'
import NotFound from './pages/NotFound'
import ErrorPage from './pages/ErrorPage'
import PCManage from './pages/PCManage'
import DecisionNotice from './pages/DecisionNotice'
import CameraReady from './pages/CameraReady'
import CreateCFP from './pages/CreateCFP'


const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <TestAuth /> }, 
      { path: 'register', element: <Register /> },
      { path: 'login', element: <Login /> },
      { path: 'profile', element: <Profile /> },
      { path: 'forbidden', element: <Forbidden /> },
      { path: '*', element: <NotFound /> },
      { path: 'create-cfp', element: <CreateCFP /> },
      { path: 'pc-manage', element: <PCManage /> },
      { path: 'camera-ready', element: <CameraReady /> },
      { path: 'decision-notice', element: <DecisionNotice /> },
    ],
  },
])

export default router