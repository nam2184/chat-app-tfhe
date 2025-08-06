import { Loader } from '@/components'
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useContext } from 'react'
import { PostAuthResponse, usePostAuth } from '@/lib/kubb'
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
import { Link, NavLink, useNavigate } from "react-router";
import ConfirmationDialog from "@/components/auth/ConfirmationDialog";
import { loadCredentials } from '@/hooks';
import Layout from './layout';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});


const SignIn: React.FC = () => {
    const navigate = useNavigate()

    const form = useForm<z.infer<typeof loginSchema>>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
        username: "",
        password: "",
      },
    });

    const postAuthMutation = usePostAuth()

    const onSubmit = React.useCallback(
      async ({ username, password }: z.infer<typeof loginSchema>) => {
        try {
          const response = await postAuthMutation.mutateAsync({ 
            data : {
              username: username,
              password: password,
            }
          });
          await loadCredentials(response)  
        } catch (e: unknown) {
            if (e instanceof Error) {
              form.setError("root", {
                message: e.message,
              });
         }
        }
      },
      [form, postAuthMutation],
  );
    

    React.useEffect(() => {
        if (postAuthMutation.data?.user) {
            navigate('/chat')
        }
    }, [navigate, postAuthMutation, loadCredentials])

    //if (authLoading) {
        //return <Loader />
    //}

    
  const onConfirm = postAuthMutation.mutateAsync;

  return (
    <Layout>
      <main>
        <section
          className="auto-limit-w flex min-h-96 flex-col items-center
            justify-center gap-6"
        >
          <h2 className="text-4xl font-bold">Chat app Portal</h2>
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
                  </FormItem>
                )}
              />
              <div className="flex gap-3">
                <Button className="flex-1" type="submit">
                  Log In
                </Button>
                <Button className="flex-1" asChild>
                  <NavLink to="/password-reset">Forgot Password</NavLink>
                </Button>
              </div>
              <FormMessage>{form.formState.errors.root?.message}</FormMessage>
            </form>
          </Form>
        </section>
        <section
          className="auto-limit-w flex min-h-[600px] items-center justify-center"
        >
          <div className="flex max-w-96 flex-col gap-6">
            <div className="space-y-3">
              <h2 className="text-4xl font-bold">
                Don&apos;t have an account yet?
              </h2>
              <div>
                Subscribe and message anyone E2EE  
              </div>
            </div>
            <Button asChild>
              <Link to="/signup">Sign Up Now</Link>
            </Button>
          </div>
          {/* <img className="h" /> */}
        </section>
        </main>

      </Layout>
      );
}

export { SignIn }

