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
  icons: {
    icon: "/assets/flaticon.ico",
  },
};

// Keep server rendering close to the GCP backend (Mumbai)
export const preferredRegion = ["bom1"];

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
  // Fetch settings dynamically with caching
  let settings = { data: { whatsapp: {}, footerContact: {} } };
  let globals = { data: {} };

  try {
    const settingsRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/settings`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );
    if (settingsRes.ok) {
      settings = await settingsRes.json();
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }

  try {
    const globalsRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/site_global`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );
    if (globalsRes.ok) {
      globals = await globalsRes.json();
    }
  } catch (error) {
    console.error('Failed to fetch site globals:', error);
  }

  const whatsappNumber = settings?.data?.whatsapp?.number || "";
  const footerContact = settings?.data?.footerContact || {};
  const tracking = settings?.data?.tracking || {};
  const gtmId = String(tracking?.gtmId || "").trim();
  const fbPixel = String(tracking?.fbPixel || "").trim();
  const extraScripts = String(tracking?.extraScripts || "").trim();
  const siteGlobal = globals?.data || {};
  console.log("Site Global Data:", siteGlobal);

  return (
    <html lang="en">
      <head>
        {gtmId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
                `,
              }}
            />
          </>
        )}
        {fbPixel && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${fbPixel}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
        {extraScripts && (
          <script dangerouslySetInnerHTML={{ __html: extraScripts }} />
        )}
      </head>
      <body className={`${poppins.className} ${poppins.variable} ${geistMono.variable}`}>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {fbPixel && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(fbPixel)}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
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
