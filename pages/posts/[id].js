import Layout from '../../components/layout';
import { getAllPostIds, getPostData } from '../../libs/posts';
import Head from 'next/head'
import Date from '../../components/date'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm';
import Image from 'next/image'
import Link from 'next/link';
import { Prism } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';


export async function getStaticProps({ params }) {
  const {
    id,
    data,
    content
  } = await getPostData(params.id);

  return {
    props: {
      id,
      content,
      data
    },
  };
}

export async function getStaticPaths() {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

export default function Post({ data, content }) {
  return (
    <Layout>
      <Head>
        <title>{data.title}</title>
      </Head>
      <article>
        <h1 className='text-4xl text-center font-bold pb-3'>{data.title}</h1>
        <p className='text-gray-400 text-lg pb-3'><Date dateString={data.date} /></p>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className='text-lg leading-relaxed space-y-3'
          children={content}
          components={{
            h2: ({ children }) => <h2 className="text-3xl font-bold pt-5 pb-2">{children}</h2>,
            ul: ({children}) => <ul className='list-disc list-outside ms-8 py-2 text-lg'>{children}</ul>,
            a: ({children, href}) => <Link className='cool-link' href={href} target='_blank' children={children}/>,
            img: ({src, alt, ...props}) => 
              <Image 
                className='py-5 mx-auto' 
                width={0} 
                height={0} 
                sizes="100vw" 
                style={{ width: '80%', height: 'auto' }} 
                src={src} alt={alt} {...props}/>,
            
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <Prism
                className='text-md'
                children={String(children).replace(/\n$/, '')}
                style={atomDark}
                language={match[1]}
                {...props}
                />
              ) : (
                <span className='font-mono bg-gray-700 border-gray-700 border-x-4 border-y-1 rounded-md'>
                {children}
                </span>
              );
              },

            table: ({children}) => <div className='overflow-x-auto'><table className='mx-auto w-11/12 text-left rtl:text-right text-gray-500 dark:text-gray-400'>{children}</table></div>,
            tr: ({children}) => <tr className='bg-white border-b dark:bg-gray-800 dark:border-gray-700'>{children}</tr>,
            th: ({children}) => <th className='px-6 py-4 text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>{children}</th>,  
            td: ({children}) => <td className='px-6 py-4'>{children}</td>  
          }}
        />
      </article>
    </Layout>
  );
}

/* export default function Post({ postData }) {
    return (
      <Layout>
        <Head>
          <title>{postData.title}</title>
        </Head>
        <article>
          <h1 className='text-4xl text-center font-bold pb-3'>{postData.title}</h1>
          <p className='text-gray-400 text-lg pb-3'><Date dateString={postData.date} /></p>
          <div className='space-y-8 [&>p]:text-lg [&>p]:leading-relaxed md:[&>p]:text-xl md:[&>p]:leading-relaxed
                          [&_a]:cool-link 
                          [&>h2]:text-3xl [&>h2]:font-bold 
                          [&>ul]:list-inside [&>ul]:list-disc [&>ul]:text-xl 
                          [&_img]:px-20
                          [&>code]:language-html' 
                          dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
        </article>
      </Layout>
    );
  } */

