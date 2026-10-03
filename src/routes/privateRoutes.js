import { lazy } from "react";

export const privateRoutes = [
  {
    name: "Dashboard",
    path: "/dashboard",
    component: lazy(() => import("../pages/Dashboard")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Add Menu",
    path: "/add-menu",
    component: lazy(() => import("../pages/MenuManagement/AddMenu.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Users",
    path: "/users",
    component: lazy(() => import("../pages/UserManagement/Users.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Company Types",
    path: "/company-types",
    component: lazy(() => import("../pages/CompanyManagement/CompanyType.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "User Types",
    path: "/user-types",
    component: lazy(() => import("../pages/UserManagement/UserTypes.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Company",
    path: "/company",
    component: lazy(() => import("../pages/CompanyManagement/Company.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Assign Menu For Super Admin",
    path: "/assign-menu-all",
    component: lazy(() => import("../pages/MenuManagement/AssignMenu.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Assign Menu",
    path: "/assign-menu",
    component: lazy(() => import("../pages/MenuManagement/AssignMenuUser.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "User Details",
    path: "/user-details",
    component: lazy(() => import("../pages/UserManagement/UserDetails.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Category Management",
    path: "/category-management",
    component: lazy(() => import("../pages/ProductsManagement/Category.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Brands Management",
    path: "/brands-management",
    component: lazy(() => import("../pages/ProductsManagement/Brand.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Units Management",
    path: "/units-management",
    component: lazy(() => import("../pages/ProductsManagement/Unit.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Attributes",
    path: "/attributes",
    component: lazy(() => import("../pages/ProductsManagement/Attribute.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Products",
    path: "/products",
    component: lazy(() => import("../pages/ProductsManagement/Product.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Product Types",
    path: "/product-types",
    component: lazy(() => import("../pages/ProductsManagement/ProductType.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Barcodes",
    path: "/barcodes",
    component: lazy(() => import("../pages/ProductsManagement/Barcode.jsx")),
    isPrivate: true,
    showInMenu: true,
  },

  // ─── Inventory Management ───
  {
    name: "Suppliers",
    path: "/suppliers",
    component: lazy(() => import("../pages/Inventory/Supplier.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Warehouses",
    path: "/warehouses",
    component: lazy(() => import("../pages/Inventory/Warehouse.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Product Suppliers",
    path: "/product-suppliers",
    component: lazy(() =>
      import("../pages/Inventory/ProductSupplier.jsx")
    ),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Stock",
    path: "/stock",
    component: lazy(() => import("../pages/Inventory/Stock.jsx")),
    isPrivate: true,
    showInMenu: true,
  },
  {
    name: "Stock Movements",
    path: "/stock-movements",
    component: lazy(() =>
      import("../pages/Inventory/StockMovement.jsx")
    ),
    isPrivate: true,
    showInMenu: true,
  },
];