import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import ConfirmationForm from "./ConfirmationForm";
import { ConfirmationNextStep } from "@/lib/auth/types";
import { toConfirmationDescription } from "@/lib/auth/utils";

export interface ConfirmationDialogProps {
  username: string;
  nextStep: ConfirmationNextStep | null;
  defaultMessageSent?: boolean;
  onConfirm?: () => void;
}

export default function ConfirmationDialog({
  nextStep,
  ...props
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={nextStep != null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogDescription>
            {nextStep != null ? toConfirmationDescription(nextStep) : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {nextStep != null ? (
          <ConfirmationForm nextStep={nextStep} {...props} />
        ) : (
          <></>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
