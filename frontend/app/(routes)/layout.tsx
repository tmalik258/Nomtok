import { Navbar } from "@/components/layout/navbar";
import ErrorBoundary from "@/components/error-boundary";
import Footer from "@/components/layout/footer";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/utils";
// import Script from "next/script";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <div>{children}</div>
        {/* <Script id="falcon-ai-widget">
          {`
          window.FalconConfig = { 
            theme: "#ff5100", 
            textColor: "#ffffff",
            name: "Nomtok Assistant",
            targetDomain: "nomtok.com" 
          };
          (function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
          g.src="https://falconxoft.com/api/widget"; g.async=true;
          s.parentNode.insertBefore(g,s);
          }(document,"script"));
        `}
        </Script> */}
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
