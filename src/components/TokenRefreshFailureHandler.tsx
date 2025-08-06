import * as React from "react";
import { Hub } from "aws-amplify/utils";
import { useAuthenticator } from "@aws-amplify/ui-react";

export function TokenRefreshFailureHandler({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { signOut } = useAuthenticator();

  React.useEffect(() => {
    return Hub.listen("auth", async ({ payload }) => {
      switch (payload.event) {
        case "tokenRefresh_failure":
          signOut();
          break;
      }
    });
    // signOut changes and triggers rerenders, causing race condition! Ignore it at all costs in the deps!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}
