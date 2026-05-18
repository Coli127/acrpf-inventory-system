import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { customer_id, quantity, price, total, notes, product_id } = body;

    if (!customer_id || !quantity) {
      return NextResponse.json({ error: "Customer and quantity are required" }, { status: 400 });
    }

    const qty = parseInt(quantity);
    const unitPrice = parseFloat(price) || 0;
    const amount = parseFloat(total) || (qty * unitPrice);

    if (qty < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
    }

    if (unitPrice <= 0) {
      return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 });
    }

    let userId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch { /* session optional */ }

    const { data: order, error } = await supabase
      .from("purchase_orders")
      .insert({
        customer_id,
        notes,
        total_amount: amount,
        created_by: userId,
        status: "draft",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { error: itemError } = await supabase
      .from("purchase_order_items")
      .insert({
        order_id: order.id,
        product_id: product_id || null,
        quantity: qty,
        unit_price: unitPrice,
      });

    if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    console.error("Orders API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
