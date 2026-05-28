import Image from 'next/image';

const transportImages: Record<string, { src: string; alt: string }> = {
  train: {
    src: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=80&h=80&fit=crop&auto=format',
    alt: 'Влак',
  },
  bus: {
    src: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=80&h=80&fit=crop&auto=format',
    alt: 'Автобус',
  },
  minibus: {
    src: 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=80&h=80&fit=crop&auto=format',
    alt: 'Бус',
  },
};

export default function TransportImage({ type, size = 48 }: { type: string; size?: number }) {
  const img = transportImages[type] ?? transportImages.bus;
  return (
    <Image
      src={img.src}
      alt={img.alt}
      width={size}
      height={size}
      className="rounded-lg object-cover"
    />
  );
}
