import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api-client";

export async function GET() {
  try {
    const supabase = createApiClient();
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, email, phone")
      .order("name");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Customers GET error:", error);
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

    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
      })
      .select("id, name")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Customers POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
