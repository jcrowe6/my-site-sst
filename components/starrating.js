import React, { useState } from 'react';
//import './StarRating.css'; // Optional for better styling

const StarRating = ({rating = undefined, onRatingChange}) => {
  const handleClick = (index) => {
    onRatingChange(index + 1);
  };

  return (
    <div className='flex gap-1 cursor-pointer mx-4'>
      {[...Array(5)].map((_, index) => (
        <span
          key={index}
          onClick={() => handleClick(index)}
          className='lg:text-2xl md:'
          style={{
            color: rating !== undefined && index < rating ? 'gold' : 'grey',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;