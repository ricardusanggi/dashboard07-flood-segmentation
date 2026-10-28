import { useState } from "react";

export default function useConfirm() {
  const confirm = (message: string) => {
    return new Promise<boolean>((resolve) => {
      const ok = window.confirm(message);
      resolve(ok);
    });
  };

  return confirm;
}