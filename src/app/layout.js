import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from "react-toastify";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import WhatsAppButton from "@/components/common/Whatapp";

export const metadata = {
  title: {
    default: "Galaxy Travelers",
    template: "%s | Galaxy Travelers",
  },
};

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist-sans", // reuse existing CSS var for sans
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export default async function RootLayout({ children }) {
  // Fetch settings dynamically
  const settings = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_API}/api/settings`,
    {
      cache: "no-store",
    }
  ).then((r) => r.json());
  const globals = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_API}/api/site_global`,
    {
      cache: "no-store",
    }
  ).then((r) => r.json());

  const whatsappNumber = settings?.data?.whatsapp?.number || "";
  const footerContact = settings?.data?.footerContact || {};
  const siteGlobal = globals?.data || {};
  console.log("Site Global Data:", siteGlobal);

  return (
    <html lang="en">
      <body className={`${poppins.className} ${poppins.variable} ${geistMono.variable}`}>
        <ReactQueryProvider>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
            {/* SITE NAV */}
            <Navbar />

            {/* PAGE CONTENT */}
            {children}

            {/* FOOTER */}
            <Footer footer={footerContact} global={siteGlobal} />

            {/* GLOBAL WHATSAPP BUTTON */}
            {whatsappNumber && <WhatsAppButton phone={whatsappNumber} />}

            <ToastContainer />
          </GoogleOAuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
