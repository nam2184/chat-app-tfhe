import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import * as z from "zod";
import * as React from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "~/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "~/components/ui/command";
import { cn } from "~/lib/utils";
import { getCountries, CountryCode } from "libphonenumber-js";
import { alpha2ToNumeric, numericToAlpha2 } from "i18n-iso-countries";
import countryCodeMap from "react-phone-number-input/locale/en.json";
import flags from "react-phone-number-input/flags";
import { ChevronsUpDown } from "lucide-react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useGetOrg, usePatchOrg } from "~/lib/kubb";
import { fetchUserAttributes } from "@aws-amplify/auth";
import { useAuthenticator } from "@aws-amplify/ui-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const organisationFormSchema = z.object({
  companyName: z.string().min(1, { message: "Required" }),
  country: z.enum(getCountries() as [CountryCode, ...CountryCode[]]),
  adminName: z.string().min(1, { message: "Required" }),
  adminEmail: z.string().email(),
  orgRole: z.string(),
  portfolio: z.string(),
});

export default function OrganisationForm() {
  const { authStatus } = useAuthenticator();
  const queryClient = useQueryClient();

  const getOrgQuery = useGetOrg({
    query: {
      suspense: true,
      throwOnError: false,
    },
  });
  const patchOrgMutation = usePatchOrg({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getOrgQuery.queryKey,
          refetchType: "all",
        });
      },
    },
  });

  const onSubmit = async (values: z.infer<typeof organisationFormSchema>) => {
    await patchOrgMutation.mutateAsync({
      data: {
        name: values.companyName,
        country_code: parseInt(alpha2ToNumeric(values.country) ?? "0"),
        role: values.orgRole,
      },
    });
  };

  const userAttributesQuery = useSuspenseQuery({
    queryKey: ["userAttributes", authStatus],
    queryFn: fetchUserAttributes,
  });

  const name = [
    userAttributesQuery.data?.given_name,
    userAttributesQuery.data?.family_name,
  ]
    .filter((val) => val != null)
    .join(" ");

  const form = useForm<z.infer<typeof organisationFormSchema>>({
    resolver: zodResolver(organisationFormSchema),
    values: {
      adminEmail: userAttributesQuery.data?.email ?? "",
      adminName: name ?? "",
      companyName: getOrgQuery.data?.name ?? "",
      country: numericToAlpha2(
        getOrgQuery.data?.country_code ?? 36,
      ) as CountryCode,
      orgRole: "Head contractor",
      portfolio: "",
    },
  });

  const [countrySelectOpen, setCountrySelectOpen] = React.useState(false);

  return (
    <Form {...form}>
      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-32">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => {
              const Flag = flags[field.value];
              return (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Popover
                    open={countrySelectOpen}
                    onOpenChange={setCountrySelectOpen}
                  >
                    <FormControl>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
                          role="combobox"
                          className={cn(
                            "w-full gap-1 flex rounded-lg px-3 justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            <div className="flex gap-2 items-center">
                              {Flag != null ? (
                                <span
                                  className="bg-foreground/20 flex h-4 w-6
                                    overflow-hidden rounded-sm"
                                >
                                  <Flag title={field.value} />
                                </span>
                              ) : (
                                <></>
                              )}
                              <span>{countryCodeMap[field.value]}</span>
                            </div>
                          ) : (
                            "Select country"
                          )}
                          <ChevronsUpDown
                            className="ml-2 h-4 w-4 shrink-0 opacity-50"
                          />
                        </Button>
                      </PopoverTrigger>
                    </FormControl>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)]
                      p-0">
                      <Command
                        filter={(_value, search, keywords) => {
                          for (const keyword of keywords ?? []) {
                            if (
                              keyword
                                .toLowerCase()
                                .includes(search.toLowerCase())
                            ) {
                              return 1;
                            }
                          }
                          return 0;
                        }}
                      >
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            {getCountries().map((countryCode) => {
                              const countryName =
                                countryCodeMap[
                                  countryCode as keyof countryCodeMap
                                ];
                              const Flag = flags[countryCode];
                              return (
                                <CommandItem
                                  className="gap-2"
                                  value={countryCode}
                                  key={countryCode}
                                  onSelect={() => {
                                    setCountrySelectOpen(false);
                                    form.setValue("country", countryCode);
                                  }}
                                  keywords={[countryName, countryCode]}
                                >
                                  {Flag != null ? (
                                    <span
                                      className="bg-foreground/20 flex h-4 w-6
                                        overflow-hidden rounded-sm"
                                    >
                                      <Flag title={countryCode} />
                                    </span>
                                  ) : (
                                    <></>
                                  )}

                                  <span>{countryName}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-32">
          <FormField
            control={form.control}
            name="adminName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admin Name</FormLabel>
                <FormControl>
                  <Input disabled={true} placeholder="Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="adminEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admin Email</FormLabel>
                <FormControl>
                  <Input
                    disabled={true}
                    placeholder="jane.doe@acme.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-32">
          <FormField
            control={form.control}
            name="orgRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Role</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                      <SelectItem value="Head contractor">
                        Head Contractor
                      </SelectItem>
                      <SelectItem value="Sub contractor">
                        Sub Contractor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="portfolio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portfolio</FormLabel>
                <FormControl>
                  <Input placeholder="Test" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button>Save</Button>
      </form>
    </Form>
  );
}
