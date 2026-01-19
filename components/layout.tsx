import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Stars from './stars';
import { ReactNode } from 'react';

const name = 'Jeremiah Crowell';
export const siteTitle = 'Jeremiah Crowell';

interface LayoutProps {
  children: ReactNode;
  home?: boolean;
}

export default function Layout({ children, home }: LayoutProps) {

  return (
  <>
  <Stars animate={home ?? false}/>
  <div className="container mx-auto my-12 px-5 max-w-3xl">
      <Head>
        <meta
          name="description"
          content="Portfolio and personal site of Jeremiah Crowell"
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <header className='flex flex-col items-center'>
        {home ? (
          <>
            <Image
              priority
              src="/images/hs7.jpg"
              className='rounded-[80px] transition-all hover:-translate-y-1 hover:rounded-[40px] duration-300'
              height={144}
              width={144}
              alt=""
            />
            <h1 className='text-3xl md:text-4xl text-nowrap font-bold p-5'>{name}</h1>
          </>
        ) : (
          <>
            <Link href="/">
              <Image
                priority
                src="/images/hs7.jpg"
                className='rounded-[80px] transition-all hover:-translate-y-1 hover:rounded-[30px] duration-300'
                height={108}
                width={108}
                alt=""
              />
            </Link>
            <h2 className='text-2xl text-nowrap font-bold p-5'>
              <Link href="/" className='text-inherit'>
                {name}
              </Link>
            </h2>
          </>
        )}
      </header>
      <main className=''>{children}</main>
      {!home && (
        <div className='my-8'>
          <Link className='text-xl cool-link' href="/">← Back to home</Link>
        </div>
      )}
    </div>
    </>
  );
}