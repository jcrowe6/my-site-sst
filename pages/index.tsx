import Head from 'next/head';
import Link from 'next/link'
import Layout, { siteTitle } from '../components/layout';
import React from 'react';
import { getSortedPostsData, PostData } from '../libs/posts';
import Date from '../components/date'

export async function getStaticProps() {
  const allPostsData = getSortedPostsData();
  return {
    props: {
      allPostsData,
    },
  };
}

interface HomeProps {
  allPostsData: PostData[];
}

export default function Home({ allPostsData }: HomeProps) {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className='text-xl md:text-2xl py-5 space-y-3'>
        <CycleName />
        <p>I'm a <span className='underline underline-offset-1 decoration-blue-500'>software developer</span> with a CS + Statistics background and a passion for machine learning and data science.
          I'm working at John Deere and completed a <span className='underline underline-offset-1 decoration-blue-500'>Master's of Data Science</span> at UIUC </p>
        <div className='py-4 flex justify-center space-x-20'>
          <Link className='cool-link' target='_blank' href="/jcrowell_resume.pdf">⇒ Résumé</Link>
          <Link className='cool-link' target='_blank' href="mailto:jeremiah.c2001@gmail.com">⇒ Email</Link>
        </div>
        <p>I also just generally like learning and making cool stuff. My other endeavours include...</p>
        <ul className='list-disc list-inside'>
          <li>Building <Link className='cool-link' target="_blank" href="https://www.boardally.io/">Boardally</Link></li>
          <li>Myriad side <Link className='cool-link' href="/projects">projects</Link></li>
          <li>Amateur <Link className='cool-link' target="_blank" href="https://www.instagram.com/jay_cr0well/">astrophotography</Link></li>
          
        </ul>
      </section>

      <section className='py-5'>
        <h1 className='text-3xl pb-3'>Blog</h1>
        <ul>
          {allPostsData.map(({ id, date, title }) => (
            <li className='pb-4' key={id}>
            <p className='text-2xl'><Link className='cool-link' href={`/posts/${id}`}>{title}</Link></p>
            <p className='text-lg text-gray-600'><Date dateString={date} /></p>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}

interface CycleNameState {
  num: number;
  names: string[];
}

class CycleName extends React.Component<{}, CycleNameState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      num: 0,
      names: ["Jeremiah", "Jay", "Jerry", "JP", "j4yb0ne"],
    }
  }

  changeText = () => {
    this.setState({ num: (this.state.num < (this.state.names.length - 1) ? (this.state.num + 1) : 0) })
  }

  render() {
    return <p>
      Hi! I'm <span className='cursor-default cool-link ' onClick={this.changeText}>{this.state.names[this.state.num]}</span>
    </p>
  }
}