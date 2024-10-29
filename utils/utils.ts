import type { Env } from "../types/env";

export const spacedStr = (str: string | number, length = 20) => {
  if (typeof str === "number") {
    str = str.toString();
  }
  return str.padEnd(length, " ");
};

export const ParameterBuilder = (params: Record<string, any>) => {
  return (
    "?" +
    Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&")
  );
};

export const GetEnv = (key: Env, defaultValue: string) => {
  if (process.env[key]) {
    return process.env[key];
  }
  return defaultValue;
};

export const MakeQueryString = (q: { [key: string]: any }) =>
  q
    ? `?${Object.keys(q)
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(q[k])}`)
        .join("&")}`
    : "";
