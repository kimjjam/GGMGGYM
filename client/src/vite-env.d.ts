/// <reference types="vite/client" />

// 여기에 우리가 쓰는 환경변수를 선언해 두면 TS가 타입을 압니다.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
