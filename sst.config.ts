/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "my-site-sst",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    new sst.aws.StaticSite("MyWeb", {
      build: {
        command: "npm run build",
        output: "out",
      },
      domain: {
        name: "jcrowell.net",
        redirects: ["www.jcrowell.net"],
      },
    });
  },
});
