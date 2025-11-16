import { Navbar } from "@/components/layout/navbar";
import ErrorBoundary from "@/components/error-boundary";
import Footer from "@/components/layout/footer";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/utils";

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

export const metadata: Metadata = buildPageMetadata({
  title: "Discover Restaurants by Influencers",
  description:
    "Find the best places to eat in your city, curated by top food influencers.",
  path: "/",
  type: "website",
  keywords: ["restaurants", "influencers", "city", "food"],
  imageUrl: "/hero-main.jpg",
});
