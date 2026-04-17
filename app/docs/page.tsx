import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "부동산 정책 자료실",
  description: "정책 자료는 /legal 페이지로 통합되었습니다.",
  robots: { index: false, follow: true },
};

export default function DocsListPage() {
  return (
    <main className="docs-page container" style={{ maxWidth: 1160, margin: "0 auto", padding: "16px" }}>
      <h3 className="mt-4 mb-3">부동산 정책 자료실</h3>
      <p>
        해당 문서는 <Link href="/legal">/legal</Link> 페이지로 통합되었습니다.
      </p>
    </main>
  );
}
