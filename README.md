## Setup

You can use an existing sveltekit project and install this package in your project with
`npm install sveltekit-ui`

or to start a new project with a starter template (recommended). In your terminal cd into a folder you want to put your project files in such as /projects/my-project-all to use as the parent folder for stuff related to your project (but replace "my-project" with your own project name)

`npx create-sveltekit-ui-site my-project`

## Open Code Editor

`code .` should open the project in your code editor such as vscode

## Update Package

It's possible the starter template is a few updates behind. Check for updates by running `ncu -u`. You should run that periodically to keep the latest version of our components

## Developing

Once you've created a project and installed dependencies start a development server:

```bash
npm i
npm run dev
```

## Browser

That should spit out a url like http://localhost:5173/ where you should see your starting website.

## Branding

You'll want to create a Logo at some point and use that in the nav bar, browser tab, google search results, etc. If you can make an svg that is best but an image will work as well. If you are advanced I like https://affinity.serif.com/en-us/designer/ for macbook to make my logos and other graphics. It has a generous free trial period too.

I like https://jakearchibald.github.io/svgomg/ to minify svg code and set to viewbox etc. Then you can generate favicons with https://realfavicongenerator.net

download the favicons and drop them in the folder called static and overwrite the existing example ones. You dont need favicon.ico. Also add favicon.svg and favicon-inactive.svg if you want to show different icon when the browser tab is inactive (not at all a priority though)

Refer to https://www.sveltekit-ui.com. for documentation

Ask an ai for help if you have issues in your setup process.
