import PolicyContent from "@/components/policy/PolicyContent";
import { parsePolicy } from "@/lib/policy";

export async function generateMetadata() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API}/api/policy`, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  });
  const data = await res.json();

  return {
    title: "Privacy Policy | TravelWonder",
    description: data.policies?.slice(0, 150) || "",
  };
}

async function getPolicy() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API}/api/policy`, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  });
  return res.json();
}

export default async function PrivacyPolicyPage() {
  const { policies } = await getPolicy();
  const sections = parsePolicy(policies);

  return <PolicyContent sections={sections} />;
}
