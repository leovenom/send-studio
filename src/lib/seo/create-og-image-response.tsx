import { ImageResponse } from "next/og";
import {
  OgImageLayout,
  type OgImageProps,
  ogImageContentType,
  ogImageSize,
} from "@/lib/seo/og-image";

export function createOgImageResponse(props: OgImageProps) {
  return new ImageResponse(<OgImageLayout {...props} />, { ...ogImageSize });
}

export { ogImageSize as size, ogImageContentType as contentType };
