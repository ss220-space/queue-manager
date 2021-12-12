// These reference imports provide type definitions for things like styled-jsx and css modules
/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next/image-types/global" />

namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production"
    PORT?: string
    REDIS_URL: URL
  }
}
