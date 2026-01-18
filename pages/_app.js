import '../styles/globals.css';
import { Libre_Franklin } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'

const librefranklin = Libre_Franklin({
    subsets: ['latin'],
    weight: ["400"],
    variable: '--font-librefranklin',
  })

const GA_MEASUREMENT_ID = 'G-T5TJ893ZKF' 

export default function App({ Component, pageProps }) {
    return (
            <main className={`${librefranklin.variable} font-sans`}>
                <Component {...pageProps} />
                <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
            </main>
    )
}