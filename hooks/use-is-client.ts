import { useEffect, useState } from 'react';

/**
 * クライアントサイドでのみtrueを返すフック
 * hydrationエラーを防ぐために使用
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
