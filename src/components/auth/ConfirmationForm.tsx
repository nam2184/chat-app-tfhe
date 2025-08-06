import * as React from "react";
import ConfirmationCodeForm from "./ConfirmationCodeForm";
import ConfirmationPasswordNewForm from "./ConfirmationPasswordNewForm";
import { ConfirmationNextStep } from "@/lib/auth/types";
import ConfirmationPasswordResetForm from "./ConfirmationPasswordResetForm";

export interface ConfirmationFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  username: string;
  nextStep: ConfirmationNextStep;
  defaultMessageSent?: boolean;
  onConfirm?: () => void;
}

export default function ConfirmationForm(props: ConfirmationFormProps) {
  if ("signUpStep" in props.nextStep) {
    switch (props.nextStep.signUpStep) {
      case "CONFIRM_SIGN_UP":
        return <ConfirmationCodeForm {...props} />;
    }
  }
  if ("signInStep" in props.nextStep) {
    switch (props.nextStep.signInStep) {
      case "CONFIRM_SIGN_UP":
      case "CONFIRM_SIGN_IN_WITH_EMAIL_CODE":
      case "CONFIRM_SIGN_IN_WITH_SMS_CODE":
        return <ConfirmationCodeForm {...props} />;
      case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED":
        return <ConfirmationPasswordNewForm {...props} />;
    }
  }
  if ("resetPasswordStep" in props.nextStep) {
    switch (props.nextStep.resetPasswordStep) {
      case "CONFIRM_RESET_PASSWORD_WITH_CODE":
        return <ConfirmationPasswordResetForm {...props} />;
    }
  }

  return <></>;
}
