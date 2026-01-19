import Layout from "../components/layout";
import Head from 'next/head';
import Link from 'next/link'

export default function Projects() {
    return (
    <Layout>
        <Head>
        <title>Projects</title>
        </Head>
        
        <h1 className='text-4xl pb-2'>Projects</h1>
        <p className="text-xl">Where I put medium-sized things that I've made, usually after being nerd sniped by some interesting problem</p>
        <section className="pt-5">
        <Project
            title="Boardally"
            link="https://www.boardally.io/"
            desc="A RAG application to help keep board game nights running smoothly. Choose the game, ask about a rule you can't remember, and Boardally prompts an LLM with the rulebook to retrieve exactly what you need to know."
            used="[Python, Flask, Numpy]"
        />
        <Project
            title="Movie Recommender"
            link="/MovieRecommender"
            desc="Rate some movies, get recommendations. Demo of item-item collaborative filtering using the MovieLens 1M dataset."
            used="[Python, Flask, Numpy]"
        />
        <Project
            title="Advent of Code 2023"
            link="https://github.com/jcrowe6/AoC-23"
            desc="My solutions to some of the Advent of Code 2023 problems - I only made it to day 17 before the 'amount of time to solve the problem'
             line and the 'amount of non-holiday activity time' line intersected"
            used="[Python]"
        />
        <Project
            title="Solitaire Solver"
            link="https://github.com/jcrowe6/solitaire_solver"
            desc="Solitaire engine written in C, and a Gymnasium environment that wraps it, to train an agent with reinforcement learning. "
            used="[C, Python, Gymnasium]"
        />
        <Project
            title="Pascal's Mod Triangle"
            link="https://github.com/jcrowe6/pascals-mod-triangle/blob/master/pascals%20mod%20triangle.ipynb"
            desc="A visual exploration of Pascal's Triangle in different moduli."
            used="[Jupyter Notebook, Matplotlib]"
        />
        <Project
            title="Peg Game Analysis"
            link="https://github.com/jcrowe6/peg-game-analysis/blob/master/peg%20game%20analysis.ipynb"
            desc= 'Numerical analysis and data visualization of the many ways to solve the "peg game" (from cracker barrel)'
            used="[Jupyter Notebook, Matplotlib]"
        />
        <Project
            title="Markov Chain Sentences"
            link="https://github.com/jcrowe6/markov_page"
            desc="Webapp that takes a link to a webpage and uses Markov chaining / bigram to create a new, strange sentence from it. (Used to be hosted on my old site but haven't gotten around to restarting it)"
            used="[Python, Flask, Numpy, BeautifulSoup]"
        />
        <Project
            title="Optimal Hangman"
            link="https://github.com/jcrowe6/optimal-hangman-web"
            desc="Webapp and API I created that uses simple statistics to compute the optimal letter guesses for a game of hangman. (Used to be hosted on my old site but haven't gotten around to restarting it)"
            used="[Python, Flask]"
        />
        <Project
            title="Orpheus"
            link="https://github.com/jcrowe6/orpheus"
            desc= "Short 2D sidescroller game, inspired by the ancient myth of Orpheus and his descent to the underworld. Written in 2 weeks for my Classical Civilizations 115 final project."
            used="[Python, PyGame]"
        />
        <Project
            title="PHP Calculator Writeup"
            link="/posts/hacking-php-calc"
            desc="Writeup of my solution to the PHP Calculator challenge from PwnyCTF / UIUC's cybersecurity club CTF."
            used="[PHP]"
        />
        <Project
            title="Wikipedia Graph Analysis"
            link="https://github.com/jcrowe6/wiki_graph"
            desc="Final team project in data structures course, wrote a graph implementation to parse then analyze a dataset of Wikipedia hyperlinks, about 25 million edges in size. I was responsible for implementing the graph class, BFS, and Kosaraju's algorithm. "
            used="[C++]"
        />
        <Project
            title="Super Checkers"
            link="https://github.com/jcrowe6/CheckersGame"
            desc="Multiplayer checkers game for Android. I implemented the polling/netcode in the app and designed the API for the server."
            used="[Java, Android, Python, Flask]"
        />
        </section>
    </Layout>
    );
}

interface ProjectProps {
  title: string;
  link: string;
  desc: string;
  used: string;
}

function Project({title, link, desc, used}: ProjectProps) {
    return (
        <div className='pb-4'>
        <h1 className='text-2xl'><Link className="cool-link" href={link} target="_blank"> {title} </Link></h1>
        <p className="text-lg">{desc}</p>
        <p className='text-md text-gray-600'>{used}</p>
        </div>
    )
}