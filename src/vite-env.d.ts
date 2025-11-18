/// <reference types="vite/client" />

declare module "*.md?raw" {
  const content: string;
  export default content;
}

declare module "*.md?url" {
  const src: string;
  export default src;
}
