import Link from 'next/link';
import Image from 'next/image';

function getRelationSlug(relation) {
  if (!relation) return '';
  if (typeof relation === 'string') return relation;
  if (typeof relation.slug === 'string') return relation.slug;
  return '';
}

export const FlyerCard = ({ flyer }) => {
  const destinationSlug = getRelationSlug(flyer?.destination);
  const tourSlug = getRelationSlug(flyer?.tour);
  const url =
    flyer?.type === 'destination' && destinationSlug
      ? `/destination/${destinationSlug}`
      : flyer?.type === 'tour' && tourSlug
        ? `/tour/${tourSlug}`
        : null;
  const cardClassName = `group rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${
    url ? 'cursor-pointer' : 'cursor-default'
  }`;

  const card = (
    <div className={cardClassName}>
      <div className='relative aspect-[3/4] overflow-hidden'>
        <Image
          src={flyer?.image}
          alt={flyer?.title}
          fill
          className='object-cover transition-transform duration-300 group-hover:scale-105'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px'
        />

        <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />

        <div className='absolute bottom-0 left-0 right-0 p-4 text-white'>
          <h3 className='text-lg font-semibold mb-1'>{flyer?.title}</h3>

          <p className='text-sm opacity-90 whitespace-normal break-words'>
            {flyer?.description}
          </p>
        </div>
      </div>
    </div>
  );

  if (!url) return card;

  return <Link href={url}>{card}</Link>;
};
