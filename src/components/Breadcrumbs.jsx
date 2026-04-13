import { useLocation, Link } from "react-router-dom";

const Breadcrumbs = () => {
  const location = useLocation();

  // Hard-coded breadcrumb mappings for each route
  const breadcrumbMap = {
    "/dashboard": [{ label: "Dashboard", path: "/dashboard" }],
    "/connect-wallet": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Connect Wallet", path: "/connect-wallet" },
    ],
    "/registerip": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Register IP", path: "/registerip" },
    ],
    "/assets": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "My Assets", path: "/assets" },
    ],
    "/profile": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "My Profile", path: "/profile" },
    ],
  };

  // Function to match dynamic routes
  const getBreadcrumbs = () => {
    const pathname = location.pathname;

    // Check for exact matches first
    if (breadcrumbMap[pathname]) {
      return breadcrumbMap[pathname];
    }

    // Check for dynamic routes
    if (pathname.match(/^\/assets\/[^/]+$/)) {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "My Assets", path: "/assets" },
        { label: "Asset Details", path: pathname },
      ];
    }

    if (pathname.match(/^\/edit-asset\/[^/]+$/)) {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "My Assets", path: "/assets" },
        { label: "Edit Asset", path: pathname },
      ];
    }

    if (pathname.match(/^\/assets\/[^/]+\/certify$/)) {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "My Assets", path: "/assets" },
        { label: "Certify Asset", path: pathname },
      ];
    }

    if (pathname.match(/^\/assets\/[^/]+\/confirmation$/)) {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "My Assets", path: "/assets" },
        { label: "Asset Confirmation", path: pathname },
      ];
    }

    // Default empty breadcrumb
    return [];
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <div className="container mx-auto">
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-400">/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-700 font-medium">
                  {breadcrumb.label}
                </span>
              ) : (
                <Link
                  to={breadcrumb.path}
                  className="text-blue-600 hover:text-blue-800 transition"
                >
                  {breadcrumb.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
