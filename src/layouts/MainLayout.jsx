import Navbar from "../components/Navbar";
import Breadcrumbs from "../components/Breadcrumbs";

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Navbar */}
      <div className="sticky top-0 z-50">
        <Navbar />
        <Breadcrumbs />
      </div>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
