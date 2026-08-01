import Image, { type ImageProps } from 'next/image';

export interface AppImageProps
  extends Omit<
    ImageProps,
    'alt' | 'fill' | 'height' | 'loading' | 'sizes' | 'src' | 'width'
  > {
  alt: string;
  height: number;
  loading: 'eager' | 'lazy';
  sizes: string;
  src: string;
  width: number;
}

export function AppImage({
  alt,
  className,
  height,
  loading,
  sizes,
  src,
  width,
  ...props
}: AppImageProps) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('AppImage width and height must be finite positive numbers.');
  }

  return (
    <Image
      {...props}
      alt={alt}
      className={['ds-app-image', className].filter(Boolean).join(' ')}
      height={height}
      loading={loading}
      sizes={sizes}
      src={src}
      width={width}
    />
  );
}
