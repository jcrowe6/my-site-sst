import Image from "next/image"
import StarRating from "./starrating"
import { ReactNode } from 'react';

interface MovieCardProps {
  children?: ReactNode;
  movieid: string;
  title: string;
  rating: number;
  onRatingChange?: (rating: number) => void;
  showRating?: boolean;
}

export default function MovieCard({children, movieid, title, rating, onRatingChange, showRating=true}: MovieCardProps) {
    return (
        <>
        <div className="flex flex-col items-center h-75">
            <img
                src = {`https://liangfgithub.github.io/MovieImages/${movieid}.jpg?raw=true`}
                //className='rounded-[80px] transition-all hover:-translate-y-1 hover:rounded-[40px] duration-300'
                height={150}
                width={100}
            />
            <div className="lg:h-14 lg:text-sm md:h-20 md:text-xs text-center">
            <p>{title}</p>
            </div>
            {showRating && onRatingChange && <StarRating rating={rating} onRatingChange={onRatingChange}/>}
        </div>
        </>
    )
}