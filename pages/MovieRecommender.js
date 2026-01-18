import Layout from "../components/layout"
import Link from "next/link";
import MovieCard from "../components/movie"
import React, { useState, useEffect } from 'react';

export default function MovieRecommender() {
    const [toRate, setToRate] = useState([]);

    const [recs, setRecs] = useState([]);

    const [ratings, setRatings] = useState({})

    const updateRating = (movieId, rating) => {
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
    <div className="m-10">
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
                showRating={false}
            />
        ))}
    </div>
    </div>
    )
}