import { ConfirmationNextStep } from "./types";

export function toConfirmationDescription(nextStep: ConfirmationNextStep) {
  if ("signUpStep" in nextStep) {
    switch (nextStep.signUpStep) {
      case "CONFIRM_SIGN_UP":
        return `Please enter the code sent to your via ${nextStep.codeDeliveryDetails.deliveryMedium!.toLowerCase()} to ${nextStep.codeDeliveryDetails!.destination} to continue.`;
    }
  }

  if ("signInStep" in nextStep) {
    switch (nextStep.signInStep) {
      case "CONFIRM_SIGN_IN_WITH_SMS_CODE":
      case "CONFIRM_SIGN_IN_WITH_EMAIL_CODE":
        return `Please enter the code sent to your via ${nextStep.codeDeliveryDetails!.deliveryMedium!.toLowerCase()} to ${nextStep.codeDeliveryDetails!.destination} to continue.`;
      case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED":
        return "Please enter a new password to continue.";
    }
  }

  if ("resetPasswordStep" in nextStep) {
    switch (nextStep.resetPasswordStep) {
      case "CONFIRM_RESET_PASSWORD_WITH_CODE":
        return `Please enter the code sent to your via ${nextStep.codeDeliveryDetails!.deliveryMedium!.toLowerCase()} to ${nextStep.codeDeliveryDetails!.destination} and a new password to continue.`;
    }
  }

  return "Please confirm to continue.";
}
