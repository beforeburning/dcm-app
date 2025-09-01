import { RouteObject } from "react-router-dom";
import PageLayout from "../layout";
import ListPage from "../pages/list";
import DetailPage from "../pages/detail";
import LoginPage from "../pages/login";
import AdminPage from "../pages/admin";
import UploadPage from "../pages/upload";
import EditPage from "../pages/edit";
import ProtectedRoute from "../components/ProtectedRoute";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/list",
    element: (
      <ProtectedRoute>
        <PageLayout>
          <ListPage />
        </PageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/detail/:id",
    element: (
      <PageLayout>
        <DetailPage />
      </PageLayout>
    ),
  },
  {
    path: "/original/:id",
    element: (
      <PageLayout>
        <DetailPage />
      </PageLayout>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <PageLayout>
          <AdminPage />
        </PageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/upload",
    element: (
      <ProtectedRoute>
        <PageLayout>
          <UploadPage />
        </PageLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/edit/:id",
    element: (
      <ProtectedRoute>
        <PageLayout>
          <EditPage />
        </PageLayout>
      </ProtectedRoute>
    ),
  },
];

export default routes;
