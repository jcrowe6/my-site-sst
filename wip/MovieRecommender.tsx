import Layout from "../components/layout"
import Link from "next/link";
import MovieCard from "../components/movie"
import React, { useState, useEffect } from 'react';

type Movie = [string, string];

interface Ratings {
  [key: string]: number;
}

export default function MovieRecommender() {
    const [toRate, setToRate] = useState<Movie[]>([]);

    const [recs, setRecs] = useState<Movie[]>([]);

    const [ratings, setRatings] = useState<Ratings>({})

    const updateRating = (movieId: string, rating: number) => {
        setRatings((prevRatings) => ({
          ...prevRatings,
          [movieId]: rating,
        }));
      };

    const getRecommendations = () => {
        fetch('/api/movieapi/recommend', 
            {
                method: 'post',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(ratings)
            }
        )
            .then(response => response.json())
            .then(json => setRecs(json["recs"]))
            .catch(error => console.error(error));
    }

    useEffect(() => {
        fetch('/api/movieapi/getInitialMovies', )
          .then(response => response.json())
          .then(json => setToRate(json["recs"]))
          .catch(error => console.error(error));
      }, []);
    
    

    return (
    <div className="relative">
    {/* Overlay for blocking interactions */}
    <div className="fixed inset-0 bg-black bg-opacity-40 z-40 pointer-events-auto" />

    {/* Banner message */}
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white text-black p-8 text-center shadow-2xl rounded-2xl max-w-2xl">
        <h2 className="text-3xl font-bold mb-2">⚠️ Temporarily Down ⚠️</h2>
        <p className="text-lg bg-white">This demo is currently unavailable while I'm migrating the site to SST.</p>
    </div>

    {/* Existing content - visible but not clickable */}
    <div className="m-10 pointer-events-none">
    <h1 className='text-4xl pb-2'>Movie Recommendation App</h1>
    <p className="text-lg pb-5">
        Project 4 by Jeremiah Crowell (jcrowe6) for CS 598 PSL. 
        <br/>
        Implements 
        <Link className='cool-link px-2' target="_blank" href="https://en.wikipedia.org/wiki/Item-item_collaborative_filtering">
         Item-based collaborative filtering
        </Link>
        based on the
        <Link className='cool-link px-2' target="_blank" href="https://grouplens.org/datasets/movielens/1m/">
        MovieLens 1M Dataset
        </Link>
        <br/>
        You can find my code for this
        <Link className='cool-link px-2' target="_blank" href="https://github.com/jcrowe6/movie-recommender-api">
        here
        </Link>
        </p>
    <h1 className='text-3xl pb-10'>Rate some movies:</h1>
    <div className="grid grid-cols-2 md:grid-cols-10 gap-4">
        {toRate.map(([id,title]) => (
            <MovieCard 
                key={id}
                movieid={id} 
                title={title}
                rating={ratings[id]}
                onRatingChange={(rating) => updateRating(id,rating)}
            />
        ))}
    </div>
    <hr className="my-8"/>
    <button className='text-3xl mb-8 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded'
            onClick={getRecommendations}>
        Get Recommendations!
    </button>
    <div className="grid grid-cols-2 md:grid-cols-10 gap-4">
        {recs.map(([id,title]) => (
            <MovieCard
                key={id}
                movieid={id}
                title={title}
                rating={0}
                showRating={false}
            />
        ))}
    </div>
    </div>
    </div>
    )
}