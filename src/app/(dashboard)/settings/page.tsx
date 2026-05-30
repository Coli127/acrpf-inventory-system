"use client";

import { useEffect, useState, useId } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Settings,
  Loader2,
  User,
  Shield,
  Code,
  AtSign,
  ChevronDown,
  ChevronUp,
  Info,
  Building2,
  CircleCheck,
  AlertTriangle,
} from "lucide-react";
import type { Profile } from "@/lib/types";

import {
  Collapsible as CollapsiblePrimitive,
} from "@base-ui/react/collapsible";

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <CollapsiblePrimitive.Root open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsiblePrimitive.Trigger className="flex w-full items-center justify-between p-6 pb-0 text-left cursor-pointer">
          <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-normal pb-6">
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
          <div className="pb-6 text-muted-foreground">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CollapsiblePrimitive.Trigger>
        <CollapsiblePrimitive.Panel>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </CollapsiblePrimitive.Panel>
      </Card>
    </CollapsiblePrimitive.Root>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nicknameId = useId();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");
        const metadataName = user.user_metadata?.full_name || "";

        // Also try to read from profiles table (may fail due to RLS)
        let finalName = metadataName;
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData && !profileErr) {
          finalName = profileData.full_name || metadataName;
          setProfile({
            id: user.id,
            full_name: finalName,
            avatar_url: null,
            role: "admin",
            created_at: user.created_at || new Date().toISOString(),
          });
        } else {
          setProfile({
            id: user.id,
            full_name: finalName,
            avatar_url: null,
            role: "admin",
            created_at: user.created_at || new Date().toISOString(),
          });
        }
        setNickname(finalName);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [supabase]);

  const validateNickname = (value: string): string | null => {
    if (!value.trim()) return "Nickname cannot be empty";
    if (value.trim().length < 2)
      return "Nickname must be at least 2 characters";
    if (value.length > 50) return "Nickname must be 50 characters or less";
    if (!/^[a-zA-Z0-9\s]+$/.test(value))
      return "Only letters, numbers, and spaces allowed";
    return null;
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    if (value === (profile?.full_name || "")) {
      setNicknameError("");
    } else if (value.trim()) {
      setNicknameError(validateNickname(value) || "");
    } else {
      setNicknameError("");
    }
  };

  const handleUpdateProfile = async () => {
    const error = validateNickname(nickname);
    if (error) {
      setNicknameError(error);
      return;
    }
    const uid = profile?.id || userId;
    if (!uid) {
      toast.error("User not found");
      return;
    }
    setSaving(true);
    try {
      const trimmed = nickname.trim();

      // Update auth user metadata (always works)
      const { error: authErr } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });

      // Also try updating profiles table (may fail due to RLS)
      let dbUpdated = false;
      try {
        const { error: dbErr } = await supabase
          .from("profiles")
          .update({ full_name: trimmed })
          .eq("id", uid);
        if (!dbErr) dbUpdated = true;
      } catch {}

      if (authErr) {
        throw authErr;
      }

      const updatedProfile = { ...profile, full_name: trimmed } as Profile;
      setProfile(updatedProfile);
      setNickname(trimmed);
      setNicknameError("");
      setConfirmOpen(false);
      toast.success("Display name updated!");
    } catch (err: unknown) {
      console.error("Profile update error:", err);
      toast.error(
        err instanceof Error ? err.message : "Update failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-2xl mx-auto">
        <PageHeader
          title="Settings"
          description="Manage your account and preferences"
          icon={Settings}
        />

        {/* ── Account / Profile ── */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            <User className="h-4 w-4" />
            Account & Profile
          </h2>
          <Card className="overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Avatar + Email row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-chart-3 text-white text-xl font-bold">
                    {getInitials(profile?.full_name || null)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-lg truncate">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <AtSign className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {userEmail || "No email available"}
                    </span>
                  </p>
                </div>
              </div>

              <Separator />

              {/* Nickname field */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor={nicknameId} className="text-sm font-medium">
                    Nickname / Display Name
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      This is the name others will see in the system
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      id={nicknameId}
                      value={nickname}
                      onChange={handleNicknameChange}
                      placeholder="e.g., John Doe"
                      className={nicknameError ? "border-destructive" : ""}
                      aria-invalid={!!nicknameError}
                    />
                    {nicknameError && (
                      <p className="text-xs text-destructive mt-1">
                        {nicknameError}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={
                      saving ||
                      !nickname.trim() ||
                      nickname.trim() === (profile?.full_name || "") ||
                      !!nicknameError
                    }
                    className="shrink-0"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {saving ? "Saving..." : "Update Display Name"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Role & Permissions ── */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            <Shield className="h-4 w-4" />
            Role & Permissions
          </h2>
          <CollapsibleSection title="Role & Permissions" icon={Shield}>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">Admin</p>
                  <p className="text-sm text-muted-foreground">
                    Full access to all features and settings
                  </p>
                </div>
              </div>
              <Badge variant="default" className="shrink-0">
                Active
              </Badge>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                Permission Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "View inventory items",
                  "Add & edit items",
                  "Delete items",
                  "Manage categories",
                  "View reports",
                  "Manage settings",
                ].map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-md bg-muted/30"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {perm}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center">
                    Role determines what you can access in the system
                  </TooltipContent>
                </Tooltip>
                <span>Contact an administrator to change your role</span>
              </div>
            </div>
          </CollapsibleSection>
        </section>

        {/* ── About ── */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            <Building2 className="h-4 w-4" />
            System
          </h2>
          <CollapsibleSection title="About" icon={Info}>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <p className="font-semibold">ACRPF</p>
                <p className="text-xs text-muted-foreground">
                  Advanced Clay Reef Production Facility
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">v1.0.0</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Code className="h-3.5 w-3.5" />
                  Created by
                </span>
                <span className="font-medium">Nico</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                <span className="text-muted-foreground">Facility</span>
                <span className="font-medium">ACRPF Headquarters</span>
              </div>
            </div>
          </CollapsibleSection>
        </section>
      </div>

      {/* ── Confirm Change ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <DialogTitle className="text-center">Confirm Change</DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              This will update your display name.
            </p>
          </DialogHeader>

          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Current
              </p>
              <p className="text-base text-muted-foreground">
                {profile?.full_name || "User"}
              </p>
            </div>

            <div className="flex justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                New
              </p>
              <p className="text-base font-bold text-primary break-all">
                {nickname}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {saving ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}