import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * API dành riêng cho Admin/Biên tập viên lấy dữ liệu gốc để chỉnh sửa.
 * Không thực hiện bất kỳ hình thức Obfuscation hay Render HTML nào.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const supabase = await createClient();
    
    // 1. Kiểm tra quyền hạn người dùng
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'mod')) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 2. Lấy dữ liệu thô từ Database
    const { data: chapter, error } = await supabase
      .from("chapters")
      .select("content_json")
      .eq("id", id)
      .single();

    if (error || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // 3. Trả về dữ liệu gốc (RAW JSON)
    return NextResponse.json({ 
      data: chapter.content_json || { type: 'doc', content: [] }, 
      is_rendered: false,
      source: 'db-raw'
    });

  } catch (error) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
