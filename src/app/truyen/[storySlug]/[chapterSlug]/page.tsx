import { ReaderProvider } from "@/features/reader/context/ReaderContext";
import { ReaderLayout } from "@/features/reader/components/ReaderLayout";

export default function ChapterPage() {
  // Demo content
  const storyTitle = "Tiên Nghịch (Xian Ni)";
  const chapterTitle = "Chương 1: Thiếu niên rèn sắt";
  
  return (
    <ReaderProvider>
      <ReaderLayout 
        storyTitle={storyTitle} 
        chapterTitle={chapterTitle}
        prevChapter="#"
        nextChapter="#"
      >
        <p>
          Trong một ngôi làng nhỏ hẻo lánh phía Bắc Triệu quốc, có một thiếu niên tên là Vương Lâm. Hắn sinh ra trong một gia đình thợ rèn nghèo, từ nhỏ đã quen với tiếng búa đập và hơi nóng hừng hực của lò lửa.
        </p>
        <p>
          "Vương Lâm, mau mang nước lại đây!" Tiếng gọi của cha hắn vang lên từ trong gian nhà bốc khói nghi ngút.
        </p>
        <p>
          Vương Lâm gạt mồ hôi trên trán, vội vàng bê thùng nước lạnh đến bên bệ rèn. Hắn nhìn cha mình đang miệt mài với thanh sắt đỏ rực, trong ánh mắt lộ ra một tia khao khát. Hắn không muốn cả đời chỉ gắn bó với búa rèn này, hắn muốn được giống như những vị tiên nhân trong truyền thuyết, có thể cưỡi mây đạp gió, trường sinh bất lão.
        </p>
        <p>
          Hôm nay là ngày đại phái Hằng Nhạc đến làng tuyển chọn đệ tử. Đây là cơ hội duy nhất để hắn thay đổi vận mệnh của mình.
        </p>
        <p>
          Vương Lâm hít một hơi thật sâu, bàn tay nắm chặt. Hắn biết tư chất của mình bình thường, nhưng hắn có một trái tim kiên định hơn bất kỳ ai.
        </p>
        <p>
          "Cha, con muốn đi thử vận may tại Hằng Nhạc phái." Vương Lâm lấy hết can đảm nói.
        </p>
        <p>
          Cha hắn ngừng tay búa, nhìn đứa con trai duy nhất với ánh mắt phức tạp. Sau một hồi im lặng, ông thở dài: "Đi đi, con trai. Đừng để mình phải hối hận như ta."
        </p>
      </ReaderLayout>
    </ReaderProvider>
  );
}
