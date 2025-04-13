"use server";

export function getCurrentTime() {
  return Math.floor(Date.now() / 1000);
}
