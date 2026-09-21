"use client";

import { FC, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Building2 as BuildingIcon, X, Loader2 } from "lucide-react";
import { DialogClose } from "@/components/ui/dialog";

export type ActionKind = "create" | "delete" | "edit";
export type EntityKind = "user" | "organisation";

interface CreateDeleteFormProps {
  action: ActionKind;
  entity: EntityKind;
  defaultEmail?: string;
  defaultRole?: string;
  defaultIsActive?: boolean;
  userId?: string;
  isSubmitting?: boolean;
  onSubmit?: (email: string, userId?: string, role?: string, isActive?: boolean) => void;
  className?: string;
  onClose?: () => void;
  showClose?: boolean;
}

export const CreateDeleteForm: FC<CreateDeleteFormProps> = ({
  action,
  entity,
  defaultEmail = "",
  defaultRole = "USER",
  defaultIsActive = true,
  userId,
  isSubmitting = false,
  onSubmit,
  className = "",
  onClose,
  showClose = true,
}) => {
  const [email, setEmail] = useState<string>(defaultEmail || "");
  const [role, setRole] = useState<string>(defaultRole);
  const [isActive, setIsActive] = useState<boolean>(defaultIsActive);

  const actionLabel = action === "delete" ? "Delete" : action === "edit" ? "Edit" : "Create";
  const entityLabel = entity === "organisation" ? "Organisation" : "User";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      if (action === 'delete') {
        onSubmit('', userId);
      } else if (action === 'edit') {
        onSubmit(email, userId, role, isActive);
      } else {
        onSubmit(email, undefined, role, isActive);
      }
    }
  };

  const Icon = entity === "organisation" ? BuildingIcon : UserIcon;

  return (
    <Card className={`relative w-[420px] shadow-lg ${className}`}>
      {showClose && (
        <DialogClose asChild>
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none z-10"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogClose>
      )}
      <CardHeader className="pb-0">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Icon className="h-6 w-6 text-[hsl(var(--sidebar-primary))]" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {actionLabel} {entityLabel}
          </CardTitle>
        </div>
        <div className="h-px bg-gray-200 -mx-6" />
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {action !== 'delete' ? (
            <>
              {/* <div className="space-y-6"> */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="email" className="text-base whitespace-nowrap w-16">
                      Email:
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email (e.g. user@example.com)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1"
                    />
                    </div>
                    <div className="flex items-center gap-4">
                  {/* </div>
                  <small className="hint pl-20 text-gray-500">Example: user@example.com</small>
                </div>

                <div className="flex items-center gap-4"> */}
                  <Label className="text-base whitespace-nowrap w-16">Role:</Label>
                  <div className="flex gap-2 flex-1">
                    {[
                      { value: "ADMIN", label: "Admin" },
                      { value: "USER", label: "Member" }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRole(value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium flex-1 ${
                          role === value
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Label className="text-base whitespace-nowrap w-16">Status:</Label>
                  <div className="flex gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => setIsActive(true)}
                      className={`px-4 py-2 rounded-full text-sm font-medium flex-1 ${
                        isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsActive(false)}
                      className={`px-4 py-2 rounded-full text-sm font-medium flex-1 ${
                        !isActive
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center mb-4">
              <p className="text-gray-600">
                Are you sure you want to delete this user?<br />
                <span className="font-medium">{email}</span>
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            variant={action === "delete" ? "destructive" : "default"}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {`${actionLabel}ing...`}
              </>
            ) : (
              `${actionLabel} ${entityLabel}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateDeleteForm;