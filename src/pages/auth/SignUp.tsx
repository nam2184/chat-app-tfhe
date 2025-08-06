import { Loader } from '@/components';
import { zodResolver } from "@hookform/resolvers/zod";
import React from 'react';
import { usePostAuthSignUp } from '@/lib/kubb';
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import Layout from './layout';

const signUpSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email"),
});

const SignUp: React.FC = () => {
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      password: '',
      first_name: '',
      surname: '',
      email: '',
    },
  });

  const postAuthSignUpMutation = usePostAuthSignUp();

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    try {
      await postAuthSignUpMutation.mutateAsync({ data });
    } catch (e: unknown) {
      if (e instanceof Error) {
        form.setError("root", {
          message: e.message,
        });
      }
    }
  };

  React.useEffect(() => {
    if (postAuthSignUpMutation.data) {
      navigate('/'); // or redirect to /login if you prefer
    }
  }, [navigate, postAuthSignUpMutation]);

  return (
    <Layout>
      <main>
        <section className="auto-limit-w flex min-h-96 flex-col items-center justify-center gap-6">
          <h2 className="text-4xl font-bold">Create your account</h2>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex min-w-80 flex-col gap-3"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Surname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={postAuthSignUpMutation.isPending}>
                {postAuthSignUpMutation.isPending ? 'Signing Up...' : 'Sign Up'}
              </Button>
              <FormMessage>{form.formState.errors.root?.message}</FormMessage>
            </form>
          </Form>
        </section>

        <section className="auto-limit-w flex min-h-[300px] items-center justify-center">
          <div className="flex max-w-96 flex-col gap-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">
                Already have an account?
              </h2>
              <p>Log in to start chatting with end-to-end encryption.</p>
            </div>
            <Button asChild>
              <Link to="/login">Log In</Link>
            </Button>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export { SignUp };

