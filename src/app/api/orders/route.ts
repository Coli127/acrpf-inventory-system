import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api-client";

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const items = searchParams.get("items");
    const customerId = searchParams.get("customer_id");
    const count = searchParams.get("count");

    if (id && items === "true") {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select("*, product:products(name, sku)")
        .eq("order_id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ items: data || [] });
    }

    if (id) {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, customer:customers(name)")
        .eq("id", id)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    if (count === "true" && customerId) {
      const { count: total, error } = await supabase
        .from("purchase_orders")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ count: total || 0 });
    }

    if (customerId) {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, customer:customers(name)")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data || []);
    }

    const { data, error } = await supabase
      .from("purchase_orders")
      .select("*, customer:customers(name)")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (error: unknown) {
    console.error("Orders GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient();
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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createApiClient();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 });
    }

    const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createApiClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const { error: itemsError } = await supabase.from("purchase_order_items").delete().eq("order_id", id);
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

    const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
