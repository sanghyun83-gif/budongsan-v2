import HomeMap from "@/components/HomeMap";

export default function Home() {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>budongsan-v2</h1>
      <p style={{ marginBottom: 20, color: "#475569" }}>
        Clean rebuild baseline. Only Kakao Maps and data.go.kr apartment trade integration are carried over.
      </p>
      <HomeMap />
    </main>
  );
}

