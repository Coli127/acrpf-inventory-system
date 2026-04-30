"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Calendar } from "lucide-react";

interface Schedule {
  id: string;
  task: string;
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  target: string | null;
  remarks: string | null;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("schedules").select("*").order("id");
        if (error) throw error;
        if (data) setSchedules(data as unknown as Schedule[]);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description={`${schedules.length} task schedules`}
        icon={Calendar}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Work Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Task</TableHead>
                  <TableHead>MONDAY</TableHead>
                  <TableHead>TUESDAY</TableHead>
                  <TableHead>WEDNESDAY</TableHead>
                  <TableHead>THURSDAY</TableHead>
                  <TableHead>FRIDAY</TableHead>
                  <TableHead className="w-[200px]">TARGET</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                      No schedule records found. Import from Excel file.
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.slice(0, 50).map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.task}</TableCell>
                      <TableCell>{schedule.monday || "-"}</TableCell>
                      <TableCell>{schedule.tuesday || "-"}</TableCell>
                      <TableCell>{schedule.wednesday || "-"}</TableCell>
                      <TableCell>{schedule.thursday || "-"}</TableCell>
                      <TableCell>{schedule.friday || "-"}</TableCell>
                      <TableCell>{schedule.target || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}