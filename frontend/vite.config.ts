


// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react({
      // ⚠️ 여기에 styled-components를 위한 Babel 설정을 추가합니다.
      babel: {
        plugins: [
          [
            'babel-plugin-styled-components',
            {
              // 컴포넌트 이름을 더 쉽게 디버깅할 수 있도록 활성화합니다.
              displayName: true, 
              // 파일 이름 정보는 필요하지 않다면 false로 설정하여 간결하게 유지합니다.
              fileName: false 
            }
          ]
        ]
      }
    }),
    tsconfigPaths()
  ],
  // 기본 설정 (필요에 따라 추가/수정 가능)
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});