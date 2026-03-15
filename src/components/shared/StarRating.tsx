import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
    value: number;
    onChange?: (rating: number) => void;
    size?: 'sm' | 'md' | 'lg';
    readonly?: boolean;
    showValue?: boolean;
    className?: string;
}

const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
};

const StarRating = ({
    value,
    onChange,
    size = 'md',
    readonly = false,
    showValue = false,
    className,
}: StarRatingProps) => {
    const [hoverValue, setHoverValue] = useState(0);

    const displayValue = hoverValue || value;
    const starSize = sizeMap[size];

    return (
        <div className={cn('flex items-center gap-1', className)}>
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= displayValue;
                const isHalf = !isFilled && star - 0.5 <= displayValue;

                return (
                    <button
                        key={star}
                        type="button"
                        disabled={readonly}
                        className={cn(
                            'transition-all duration-150 focus:outline-none',
                            readonly
                                ? 'cursor-default'
                                : 'cursor-pointer hover:scale-110 active:scale-95'
                        )}
                        onClick={() => !readonly && onChange?.(star)}
                        onMouseEnter={() => !readonly && setHoverValue(star)}
                        onMouseLeave={() => !readonly && setHoverValue(0)}
                    >
                        <Star
                            className={cn(
                                starSize,
                                'transition-colors duration-150',
                                isFilled
                                    ? 'fill-amber-400 text-amber-400'
                                    : isHalf
                                        ? 'fill-amber-400/50 text-amber-400'
                                        : readonly
                                            ? 'fill-gray-200 text-gray-200'
                                            : 'fill-gray-200 text-gray-300 hover:fill-amber-200 hover:text-amber-300'
                            )}
                        />
                    </button>
                );
            })}
            {showValue && (
                <span
                    className={cn(
                        'font-semibold text-gray-700 ml-1',
                        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'
                    )}
                >
                    {value > 0 ? value.toFixed(1) : '—'}
                </span>
            )}
        </div>
    );
};

export default StarRating;
