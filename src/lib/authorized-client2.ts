interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

const fetchAuthSession = (): AuthSession | null => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      console.log("fetching auth session")
      if (!accessToken || !refreshToken) {
        return null;
      }
      return { accessToken, refreshToken };
};

export type RequestConfig<TData = unknown> = {
  baseURL?: string;
  url?: string;
  method: "GET" | "PUT" | "PATCH" | "POST" | "DELETE";
  params?: object;
  data?: TData | FormData;
  responseType?:
    | "arraybuffer"
    | "blob"
    | "document"
    | "json"
    | "text"
    | "stream";
  signal?: AbortSignal;
  headers?: HeadersInit;
};

export type ResponseConfig<TData = unknown> = {
  data: TData;
  status: number;
  statusText: string;
};

export const fetchClient = async <
  TData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TError = unknown,
  TVariables = unknown,
>(
  config: RequestConfig<TVariables>,
): Promise<ResponseConfig<TData>> => {
  const headers = new Headers(config.headers);

  if (!headers.has("Authorization")) {
    try {
      const session =  fetchAuthSession();
      if (session?.accessToken != null) {
        headers.set(
          "Authorization",
          `Bearer ${session.accessToken.toString()}`,
        );
      }
    } catch {
      console.warn("No session could be loaded for API request.");
    }
  }

  if (
    ["POST", "PATCH", "REPLACE"].includes(config.method.toUpperCase()) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  // to auto generate form boundary
  if (
    config.data instanceof FormData &&
    headers.get("Content-Type") === "multipart/form-data"
  ) {
    headers.delete("Content-Type");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params = new URLSearchParams(config.params as any);
  const url = `${import.meta.env.VITE_HE_BASE_URL}${config.url}${params.toString() !== "" ? `?${params.toString()}` : ""}`;
  const response = await fetch(
    url,
    {
      method: config.method.toUpperCase(),
      body:
        headers.get("Content-Type") === "application/json"
          ? JSON.stringify(config.data)
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (config.data as any),
      signal: config.signal,
      headers,
    },
  );

  const responseText = await response.text();
  if (!response.ok) {
    const errorData = JSON.parse(responseText);
    const error = new Error();
    Object.assign(error, errorData);
    error.message =
      errorData?.error?.message ??
      errorData?.message ??
      "Unknown error occurred";
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = responseText;
  if (responseText.length !== 0) {
    try {
      data = JSON.parse(responseText);
    } catch {
      console.warn(`Failed to deserialize JSON in response: ${responseText}`);
    }
  }

  return {
    data,
    status: response.status,
    statusText: response.statusText,
  };
};

export default fetchClient;
