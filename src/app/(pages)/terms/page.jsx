import TermsContent from "@/components/terms/TermsContent";
import { parsePolicy } from "@/lib/policy";

export async function generateMetadata() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API}/api/policy`, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  });

  const data = await res.json();

  return {
    title: "Terms & Conditions | TravelWonder",
    description: data.terms?.slice(0, 150) || "Terms & Conditions",
  };
}

async function getTerms() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API}/api/policy`, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  });
  return res.json();
}

export default async function TermsPage() {
  const { terms } = await getTerms();
  const sections = parsePolicy(terms || "");

  return <TermsContent sections={sections} />;
}
