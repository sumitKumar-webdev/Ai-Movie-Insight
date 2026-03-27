export type ActionType = "navigate" | "modal" | "api";

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

export type HandleAction<TData = Record<string, unknown> | string> = (
  action: ActionType,
  actionValue?: string,
  data?: TData,
  actionUse?: ActionUse,
) => void | Promise<void>;
