"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  highlight_color: string | null;
}

function isAlternate(s: Schedule): boolean {
  return (s.friday || "").toLowerCase().includes("wfh");
}

const COLOR_OPTIONS = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fef9c3" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Red", value: "#fecaca" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Pink", value: "#fce7f3" },
  { label: "Cyan", value: "#cffafe" },
];

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
    highlight_color: "",
  });

  const supabase = createClient();

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("schedules").select("*").order("id");
      if (error) throw error;
      if (data) {
        const reg = (data as unknown as Schedule[]).filter((s) => !isAlternate(s));
        const alt = (data as unknown as Schedule[]).filter((s) => isAlternate(s));
        const sortByNum = (a: Schedule, b: Schedule) => {
          const na = parseInt(a.task.match(/^(\d+)/)?.[1] || "0");
          const nb = parseInt(b.task.match(/^(\d+)/)?.[1] || "0");
          return na - nb;
        };
        setSchedules([...reg.sort(sortByNum), ...alt.sort(sortByNum)]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [supabase]);

  const openAddDialog = () => {
    setEditingSchedule(null);
    const maxNum = schedules.reduce((max, s) => {
      const m = s.task.match(/^(\d+)\./);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    setForm({ task: `${maxNum + 1}. `, monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", target: "", remarks: "", highlight_color: "" });
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
      highlight_color: schedule.highlight_color || "",
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
        friday: form.friday || null,
        target: form.target || null,
        remarks: form.remarks || null,
        highlight_color: form.highlight_color || null,
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
    } finally { setSaving(false); }
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

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" description={`${schedules.length} task schedules`} icon={Calendar}>
        <Button onClick={openAddDialog} className="gap-2"><Plus className="h-4 w-4" />Add Task</Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : schedules.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">No schedules found.</div>
          ) : (
            <div className="bg-white dark:bg-zinc-950 overflow-x-auto">
              <table className="w-full border-collapse text-xs table-fixed">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[14%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-2 py-2.5 text-center font-bold">Task</th>
                    <th className="border border-border px-2 py-2.5 text-center font-bold">MON</th>
                    <th className="border border-border px-2 py-2.5 text-center font-bold">TUE</th>
                    <th className="border border-border px-2 py-2.5 text-center font-bold">WED</th>
                    <th className="border border-border px-2 py-2.5 text-center font-bold">THU</th>
                    <th className="border border-border px-2 py-2.5 text-center font-bold">FRI</th>
                    <th className="border border-border px-2 py-2.5 text-center font-bold">TARGET</th>
                    <th className="border border-border px-2 py-2.5 text-center font-bold">REMARKS</th>
                    <th className="border border-border px-2 py-2.5 text-center font-bold sticky right-0 bg-muted/50 w-[60px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule, index) => {
                    const color = schedule.highlight_color;
                    const baseClass = index % 2 === 0 ? "bg-background" : "bg-muted/30";
                    const rowClass = color ? "" : baseClass;
                    const rowStyle = color ? { backgroundColor: color } : undefined;
                    return (
                      <tr key={schedule.id} className={`${rowClass} hover:brightness-95 transition-all`} style={rowStyle}>
                        <td className="border border-border px-2 py-2 font-medium text-sm break-words">{schedule.task.replace(/^(\d+)\./, "$1. ")}</td>
                        <td className="border border-border px-2 py-2 text-sm break-words">{schedule.monday || "-"}</td>
                        <td className="border border-border px-2 py-2 text-sm break-words">{schedule.tuesday || "-"}</td>
                        <td className="border border-border px-2 py-2 text-sm break-words">{schedule.wednesday || "-"}</td>
                        <td className="border border-border px-2 py-2 text-sm break-words">{schedule.thursday || "-"}</td>
                        <td className="border border-border px-2 py-2 text-sm break-words">{schedule.friday || "-"}</td>
                        <td className="border border-border px-2 py-2 text-sm break-words">{schedule.target || "-"}</td>
                        <td className="border border-border px-2 py-2 text-sm break-words">{schedule.remarks || "-"}</td>
                        <td className="border border-border px-2 py-2 sticky right-0 bg-inherit">
                          <div className="flex gap-1 justify-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(schedule)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(schedule.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editingSchedule ? "Edit Task" : "Add New Task"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="col-span-2 space-y-2">
              <Label>Task *</Label>
              <Textarea value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} placeholder="Enter task description" rows={2} />
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
              <Label>Row Color</Label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`h-7 w-7 rounded-md border-2 transition-all ${form.highlight_color === c.value ? "border-gray-900 dark:border-white ring-2 ring-offset-1 ring-gray-400" : "border-border"} ${c.value ? "hover:scale-110" : ""}`}
                    style={c.value ? { backgroundColor: c.value } : { background: "linear-gradient(135deg, #e5e7eb 25%, #fff 25%, #fff 50%, #e5e7eb 50%, #e5e7eb 75%, #fff 75%)" }}
                    onClick={() => setForm({ ...form, highlight_color: c.value })}
                    title={c.label}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color"
                    value={form.highlight_color || "#ffffff"}
                    onChange={(e) => setForm({ ...form, highlight_color: e.target.value })}
                    className="h-7 w-7 rounded-md border border-border cursor-pointer"
                    title="Custom color"
                  />
                </div>
              </div>
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
