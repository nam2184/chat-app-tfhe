import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "~/components/ui/input";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { confirmSignUp, resendSignUpCode } from "@aws-amplify/auth";
import * as React from "react";

const codeConfirmationSchema = z.object({
  code: z.string().min(1, "Required"),
});

export interface ConfirmationCodeFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  username: string;
  defaultMessageSent?: boolean;
  onConfirm?: () => void;
}

export default function ConfirmationCodeForm({
  username,
  onConfirm,
  defaultMessageSent,
  ...props
}: ConfirmationCodeFormProps) {
  const [messageSent, setMessageSent] = React.useState(
    defaultMessageSent ?? false,
  );
  const form = useForm<z.infer<typeof codeConfirmationSchema>>({
    resolver: zodResolver(codeConfirmationSchema),
    defaultValues: {
      code: "",
    },
  });
  const onSubmit = async ({ code }: z.infer<typeof codeConfirmationSchema>) => {
    try {
      await confirmSignUp({
        confirmationCode: code,
        username,
      });
      onConfirm?.();
    } catch (e: unknown) {
      if (e instanceof Error) {
        form.setError("root", {
          message: e.message,
        });
      }
    }
  };
  const onSend = React.useCallback(async () => {
    await resendSignUpCode({
      username,
    });
    setMessageSent(true);
  }, [username]);
  return (
    <Form {...form}>
      <form {...props} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button type="button" onClick={onSend}>
              {messageSent ? "Resend" : "Send"}
            </Button>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormMessage>{form.formState.errors.root?.message}</FormMessage>
          <Button type="submit">Confirm</Button>
        </div>
      </form>
    </Form>
  );
}
