"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

function isAlternate(s: Schedule): boolean {
  return (s.friday || "").toLowerCase().includes("wfh");
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    task: "",
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    target: "",
    remarks: "",
    group: "regular" as "regular" | "alternate",
  });

  const supabase = createClient();

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

  useEffect(() => { fetchData(); }, [supabase]);

  const openAddDialog = () => {
    setEditingSchedule(null);
    setForm({
      task: "",
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      target: "",
      remarks: "",
      group: "regular",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setForm({
      task: schedule.task,
      monday: schedule.monday || "",
      tuesday: schedule.tuesday || "",
      wednesday: schedule.wednesday || "",
      thursday: schedule.thursday || "",
      friday: schedule.friday || "",
      target: schedule.target || "",
      remarks: schedule.remarks || "",
      group: isAlternate(schedule) ? "alternate" : "regular",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.task) { toast.error("Task is required"); return; }
    setSaving(true);

    try {
      const payload = {
        task: form.task,
        monday: form.monday || null,
        tuesday: form.tuesday || null,
        wednesday: form.wednesday || null,
        thursday: form.thursday || null,
        friday: form.group === "alternate" ? (form.friday || "WFH") : form.friday || null,
        target: form.target || null,
        remarks: form.remarks || null,
      };

      if (editingSchedule) {
        const { error } = await supabase.from("schedules").update(payload).eq("id", editingSchedule.id);
        if (error) throw error;
        toast.success("Task updated!");
      } else {
        const { error } = await supabase.from("schedules").insert(payload);
        if (error) throw error;
        toast.success("Task added!");
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
      toast.success("Task deleted!");
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    }
  };

  const regularSchedules = schedules.filter((s) => !isAlternate(s));
  const alternateSchedules = schedules.filter((s) => isAlternate(s));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description={`${schedules.length} task schedules`}
        icon={Calendar}
      >
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </PageHeader>

      {/* Weekly Work Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Weekly Work Schedule</CardTitle>
            <Badge variant="outline" className="text-xs">{regularSchedules.length} tasks</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScheduleTable
            data={regularSchedules}
            loading={loading}
            onEdit={openEditDialog}
            onDelete={handleDelete}
            emptyMsg="No regular schedule records found."
          />
        </CardContent>
      </Card>

      {/* Updated / Alternate Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Updated / Alternate Schedule</CardTitle>
            <Badge variant="outline" className="text-xs">{alternateSchedules.length} tasks</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScheduleTable
            data={alternateSchedules}
            loading={loading}
            onEdit={openEditDialog}
            onDelete={handleDelete}
            emptyMsg="No alternate schedule records found."
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? "Edit Task" : "Add New Task"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="col-span-2 space-y-2">
              <Label>Task *</Label>
              <Textarea
                value={form.task}
                onChange={(e) => setForm({ ...form, task: e.target.value })}
                placeholder="Enter task description"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Monday</Label>
              <Input value={form.monday} onChange={(e) => setForm({ ...form, monday: e.target.value })} placeholder="Assigned to..." />
            </div>
            <div className="space-y-2">
              <Label>Tuesday</Label>
              <Input value={form.tuesday} onChange={(e) => setForm({ ...form, tuesday: e.target.value })} placeholder="Assigned to..." />
            </div>
            <div className="space-y-2">
              <Label>Wednesday</Label>
              <Input value={form.wednesday} onChange={(e) => setForm({ ...form, wednesday: e.target.value })} placeholder="Assigned to..." />
            </div>
            <div className="space-y-2">
              <Label>Thursday</Label>
              <Input value={form.thursday} onChange={(e) => setForm({ ...form, thursday: e.target.value })} placeholder="Assigned to..." />
            </div>
            <div className="space-y-2">
              <Label>Friday</Label>
              <Input value={form.friday} onChange={(e) => setForm({ ...form, friday: e.target.value })} placeholder="Assigned to..." />
            </div>
            <div className="space-y-2">
              <Label>Target</Label>
              <Input value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="Target..." />
            </div>
            <div className="space-y-2">
              <Label>Group</Label>
              <Select value={form.group} onValueChange={(v) => setForm({ ...form, group: v as "regular" | "alternate", friday: v === "alternate" && !form.friday ? "WFH" : form.friday })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Schedule</SelectItem>
                  <SelectItem value="alternate">Alternate Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Remarks</Label>
              <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks..." rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSchedule ? "Update" : "Add"} Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScheduleTable({
  data,
  loading,
  onEdit,
  onDelete,
  emptyMsg,
}: {
  data: Schedule[];
  loading: boolean;
  onEdit: (s: Schedule) => void;
  onDelete: (id: string) => void;
  emptyMsg: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-950">
      <div className="max-w-full mx-auto">
        <Table className="border-collapse w-full table-fixed">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="border border-border text-center font-bold">Task</TableHead>
              <TableHead className="border border-border text-center font-bold">MONDAY</TableHead>
              <TableHead className="border border-border text-center font-bold">TUESDAY</TableHead>
              <TableHead className="border border-border text-center font-bold">WEDNESDAY</TableHead>
              <TableHead className="border border-border text-center font-bold">THURSDAY</TableHead>
              <TableHead className="border border-border text-center font-bold">FRIDAY</TableHead>
              <TableHead className="border border-border text-center font-bold">TARGET</TableHead>
              <TableHead className="border border-border text-center font-bold">REMARKS</TableHead>
              <TableHead className="border border-border text-center font-bold w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-32 border border-border">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-32 text-muted-foreground border border-border">
                  {emptyMsg}
                </TableCell>
              </TableRow>
            ) : (
              data.map((schedule, index) => (
                <TableRow key={schedule.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <TableCell className="border border-border font-medium text-sm break-words">
                    {schedule.task.replace(/^(\d+)\./, "$1. ")}
                  </TableCell>
                  <TableCell className="border border-border text-sm break-words">{schedule.monday || "-"}</TableCell>
                  <TableCell className="border border-border text-sm break-words">{schedule.tuesday || "-"}</TableCell>
                  <TableCell className="border border-border text-sm break-words">{schedule.wednesday || "-"}</TableCell>
                  <TableCell className="border border-border text-sm break-words">{schedule.thursday || "-"}</TableCell>
                  <TableCell className="border border-border text-sm break-words">{schedule.friday || "-"}</TableCell>
                  <TableCell className="border border-border text-sm break-words">{schedule.target || "-"}</TableCell>
                  <TableCell className="border border-border text-sm break-words">{schedule.remarks || "-"}</TableCell>
                  <TableCell className="border border-border">
                    <div className="flex gap-1 justify-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(schedule)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(schedule.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
