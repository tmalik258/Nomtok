/**
 * Page: Contact
 * Rendering: SSR (public page, no user-specific data)
 * Reason: Static contact page with form
 * Last Updated: 2025-01-13
 */
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/utils";
import { ContactForm } from "./_components/contact-form";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  return (
    <div className="min-h-screen bg-cream py-12 my-auto px-4">
      <div className="max-w-2xl m-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-gray-600 mb-6">
            Have a question or feedback? We&apos;d love to hear from you. Fill
            out the form below or reach us directly at{" "}
            <a
              href="mailto:nomtok12@gmail.com"
              className="text-orange-600 hover:underline cursor-pointer"
            >
              nomtok12@gmail.com
            </a>
            .
          </p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Contact Us | Nomtok",
    description:
      "Get in touch with Nomtok. Send us your questions, feedback, or inquiries.",
    path: "/contact",
    type: "website",
    keywords: ["contact", "support", "help", "inquiry"],
    imageUrl: "/hero-main.jpg",
  });
}
