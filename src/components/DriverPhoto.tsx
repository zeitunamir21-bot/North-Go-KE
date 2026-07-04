import { useEffect, useState } from "react";
import { signDriverPhotoUrl } from "@/lib/driver-photo";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  fallback?: string;
};

/**
 * Renders a driver photo from a private storage bucket by resolving a
 * short-lived signed URL on the client. Accepts either a stored full public
 * URL (legacy rows) or a bare object path.
 */
export function DriverPhoto({ src, fallback, alt = "", ...rest }: Props) {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResolved(null);
    signDriverPhotoUrl(src).then((url) => {
      if (!cancelled) setResolved(url ?? fallback ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [src, fallback]);

  if (!resolved) {
    return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)} aria-label={alt} />;
  }
  return <img {...rest} src={resolved} alt={alt} />;
}
