import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  
  if (slug === "bricks") {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, unit_price")
      .ilike("name", "%brick%")
      .limit(1)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Product not found" }, { status: 404 });
}
