const withMDX = require('@next/mdx')()

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  output: 'standalone',
  turbopack: {
    resolveAlias: {
      mdx: require.resolve('@mdx-js/react'),
    },
  },
}

module.exports = withMDX(nextConfig)