import type { Metadata } from "next";
import SearchResultsPage from "@/components/SearchResultsPage";

export const metadata: Metadata = {
  title: "아파트 검색"
};

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = (params.q ?? "").trim();
  return <SearchResultsPage initialQuery={initialQuery} />;
}
