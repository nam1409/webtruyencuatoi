import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thư Viện Truyện | Khám Phá Light Novel Đặc Sắc",
  description: "Khám phá hàng ngàn bộ truyện Light Novel, truyện chữ đa dạng thể loại. Tìm kiếm những câu chuyện hấp dẫn nhất từ cộng đồng tác giả độc lập.",
  openGraph: {
    title: "Thư Viện Truyện - ZenStory",
    description: "Khám phá kho tàng truyện Light Novel cao cấp tại ZenStory.",
    type: "website",
  },
};

export default function DiscoveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
