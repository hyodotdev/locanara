interface ProOnlyProps {
  children: React.ReactNode;
  /**
   * Optional fallback content for community tier
   */
  fallback?: React.ReactNode;
}

/**
 * Wrapper component that only renders children in Pro docs.
 *
 * This is the Community edition - Pro content is never shown.
 * For Pro features, see https://docs-pro.locanara.com
 */
export default function ProOnly({ fallback = null }: ProOnlyProps) {
  return <>{fallback}</>;
}

/**
 * Wrapper component that only renders children in Community docs.
 *
 * This is the Community edition - always renders children.
 */
export function CommunityOnly({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
