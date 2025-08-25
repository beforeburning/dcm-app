import { RouteObject } from "react-router-dom";
import PageLayout from "../layout";
import ListPage from "../pages/list";
import DetailPage from "../pages/detail";
import LoginPage from "../pages/login";
import AdminPage from "../pages/admin";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/list",
    element: (
      <PageLayout>
        <ListPage />
      </PageLayout>
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
    path: "/admin",
    element: (
      <PageLayout>
        <AdminPage />
      </PageLayout>
    ),
  },
];

export default routes;
