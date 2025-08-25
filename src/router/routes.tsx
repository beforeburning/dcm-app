import { RouteObject } from 'react-router-dom'
import PageLayout from '../layout'
import ListPage from '../pages/list'
import DetailPage from '../pages/detail'
import LoginPage from '../pages/login'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <LoginPage />
  },
  {
    path: '/list',
    element: (
      <PageLayout>
        <ListPage />
      </PageLayout>
    )
  },
  {
    path: '/detail/:id',
    element: (
      <PageLayout>
        <DetailPage />
      </PageLayout>
    )
  }
]

export default routes
