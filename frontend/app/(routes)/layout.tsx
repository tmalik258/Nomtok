import { Navbar } from "@/components/layout/navbar";
import ErrorBoundary from "@/components/error-boundary";
import Footer from "@/components/layout/footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <div>{children}</div>
      </ErrorBoundary>
      <Footer />
    </>
  );
};

export default Layout;
