import type { Moment } from "moment";

declare global {
  interface Window {
    moment: (...args: any[]) => Moment;
  }
}

declare module "*.svelte" {
  export { SvelteComponent as default } from "svelte";
}

export {};
