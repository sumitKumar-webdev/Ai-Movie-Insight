"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutUser } from "@/app/store/auth-store";

export type ActionUse =
  | "edit"
  | "add"
  | "delete"
  | "import"
  | "export"
  | "view"
  | "download";

export type ModalProps = {
  type: "warning" | "info";
  actionUse: ActionUse;
  actionValue: string;
  data?: Record<string, unknown> | string;
};

export const useHandleAction = () => {
  const router = useRouter();
  const [modalProps, setModalProps] = useState<ModalProps | null>(null);

  const handleAction = async (
    action: "navigate" | "modal" | "api",
    actionValue = "",
    data?: Record<string, unknown> | string,
    actionUse?: ActionUse,
  ) => {
    switch (action) {
      case "navigate":
        if (typeof data === "string" && data.trim()) {
          router.push(data);
          break;
        }

        if (actionUse === "view") {
          const userId =
            typeof data === "object" && data !== null && "user_id" in data
              ? data.user_id
              : undefined;
          if (typeof userId === "string") {
            router.push(`/${actionValue}/${userId}`);
            break;
          }
        }

        if (actionValue) {
          router.push(actionValue.startsWith("/") ? actionValue : `/${actionValue}`);
        }
        break;

      case "api":
        if (actionValue === "logout") {
          await logoutUser();
          router.replace("/auth/login");
          router.refresh();
        }
        break;

      case "modal":
        if (actionUse === "delete") {
          setModalProps({ type: "warning", actionUse, actionValue, data });
        } else if (actionUse === "edit") {
          setModalProps({ type: "info", actionUse, actionValue, data });
        }
        break;

      default:
        break;
    }
  };

  const closeModal = () => setModalProps(null);

  return { handleAction, modalProps, closeModal };
};
