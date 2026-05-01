import Image from 'next/image';
import { COMPLIANCE } from '@/lib/tripadvisor/compliance';
import type { TaLocationDetails } from '@/lib/tripadvisor/types';

type Props = {
  details: TaLocationDetails;
};

export function TripadvisorRating({ details }: Props) {
  if (!details.rating_image_url || !details.web_url) return null;

  const numReviews = details.num_reviews ? parseInt(details.num_reviews, 10) : 0;

  return (
    <a
      href={details.web_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 group"
      aria-label={COMPLIANCE.REQUIRED_LINK_LABEL}
    >
      <div className="flex items-center gap-3">
        {/* Tripadvisor bubble rating — must use TA's own image, never custom stars */}
        <Image
          src={details.rating_image_url}
          alt={`${details.rating ?? '?'} out of 5 bubbles`}
          width={132}
          height={24}
          unoptimized
        />
        {numReviews > 0 && (
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {numReviews.toLocaleString()} reviews
          </span>
        )}
      </div>

      {/* Tripadvisor logo — must appear adjacent to every rating */}
      <div className="flex items-center gap-1.5">
        <Image
          src={COMPLIANCE.REQUIRED_LOGO_URL}
          alt="Tripadvisor"
          width={115}
          height={18}
          unoptimized
        />
        <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
          {COMPLIANCE.REQUIRED_LINK_LABEL} ↗
        </span>
      </div>
    </a>
  );
}
