import {
  ResetPasswordOutput,
  SignInOutput,
  SignUpOutput,
} from "@aws-amplify/auth";

export type ConfirmationNextStep =
  | SignUpOutput["nextStep"]
  | SignInOutput["nextStep"]
  | ResetPasswordOutput["nextStep"];
