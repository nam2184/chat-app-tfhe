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
import { confirmSignIn } from "@aws-amplify/auth";
import * as React from "react";

const codelessPasswordResetSchema = z.object({
  password: z.string().min(1, "Required"),
});

export interface ConfirmationPasswordNewFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  onConfirm?: () => void;
}

export default function ConfirmationPasswordNewForm({
  onConfirm,
  ...props
}: ConfirmationPasswordNewFormProps) {
  const form = useForm<z.infer<typeof codelessPasswordResetSchema>>({
    resolver: zodResolver(codelessPasswordResetSchema),
    defaultValues: {
      password: "",
    },
  });
  const onSubmit = async ({
    password,
  }: z.infer<typeof codelessPasswordResetSchema>) => {
    try {
      await confirmSignIn({
        challengeResponse: password,
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
  return (
    <Form {...form}>
      <form {...props} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="password" placeholder="Password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormMessage>{form.formState.errors.root?.message}</FormMessage>
          <Button type="submit">Confirm</Button>
        </div>
      </form>
    </Form>
  );
}
