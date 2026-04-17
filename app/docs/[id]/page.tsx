import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DocsDetailRedirectPage({ params }: Props) {
  await params;
  redirect("/legal");
}
