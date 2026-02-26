## 1. Repo setup
- Set up new repo as [Nx](https://nx.dev/docs/getting-started/intro) monorepo
- Libraries
    - plugins (Contains all the plugins like Table of contents, MermaidJs, Edit-this-Page link generation, helpfulness rating widget, etc)
    - Mermaid diagrams are rendered client side using mermaidjs library. lazy-load the Mermaid library only on pages that contain ```mermaid blocks
    - search (Contains code to generate search index for documents)
    - theme (Contains Angular UI components for overall application shell to display documents like header, footer, side navigation, search, etc)
    - renderer (Contains code to render the entire document, uses plugins as needed. Uses [markedjs](https://marked.js.org/) to render HTML. Handles static asset processing/copying)
    - api (Contains API code to create a presigned S3 url and fetches content from S3. Uses [NestJs](https://nestjs.com/))
    - portal (Contains Angular UI code for the entire portal. Uses components from theme. Contains the shell app with routing to landing page, documents etc)
    - cli (contains cli code to preview documents changes locally and render the documents in Jenkins pipeline)
    - preview (contains Angular shell to preview documents locally)
    - tools (contains tools for linting and governance checks that uses taxonomy, yaml formatter, inclusive-language checker, style-guide enforcement, etc)
    - telemetry (Contains logic for tracking page views, search analytics, and feedback events)
    - shared-types (Contains shared TypeScript interfaces/types for Taxonomy, Frontmatter, and API responses used by CLI, API, and Portal)


- apps
    - api (Contains API's to fetch documents, navigation, search, publish etc. Uses api library. Uses [NestJs](https://nestjs.com/) framework)
    - portal (Contains app for the entire portal. Uses portal library). Uses Angular framework)
    - cli (contains exportable cli package to preview documents changes locally)
    - preview (contains Angular app to preview documents locally)
- scripts
    - ci (contains Jenkins scripts uses render library to render documents, uses search library to create search index and publish to S3 by calling publish API to get pre-singed S3 url. Uses cli library)
- taxonomy (contains yaml files to maintain overall site taxonomy)
- sample-docs (contains markdown content structured in nesting folder like domain -> system -> products, example domain (infrastructure) -> system (object store) -> product (S3). Each folder typically would be in its own repo next to the implementation. These documents are uses to prove the solutions.)

## Technology
- Frontend uses Angular framework
- Uses playwright for e2e tests
- Uses Angular recommendation mentioned here for AI https://angular.dev/ai/develop-with-ai only for copilot
- workspace is managed by Nx and uses AI recommendations mentioned here https://nx.dev/docs/getting-started/ai-setup  only for copilot
- All libs and apps use esbuild for building, eslint for linting, vitest for unit testing
- Backend uses NestJs framework
- Use FlexSearch for search https://github.com/nextapps-de/flexsearch
- Uses js-yaml to parse Frontmatter


## 2 Docs setup
- Each docs repo contain markdown files and a docs.yaml metadata file
- metadata includes fields like title, description, owner, product, system, domain, version, etc
- The solution needs a taxonomy that is maintained centrally at the platform git repo inside taxonomy folder in yaml/ json format. This taxonomy is used to define documentation categories.
- They taxonomy follow domain -> system -> product hierarchy. For example, domain (Infrastructure) -> system (Object Store) -> product (S3)
- sample-docs folder contain up to 15 product documentation in the above mentioned hierarchy. These product documentation are typical enterprise level documents belong various technical domains like infrastructure, security, application lifecycle etc. Ideally they would be in different git repos but these will sample documents be used to test the solution
- The docs.yaml in each documents folder contains metadata to identify domain, system and product. 
- During the CI process, the CLI should validate the metadata to make sure the domain and system are defined in the taxonomy maintained at the documents platform. This could be via an API call
- The NestJS publish API is responsible for parsing the docs.yaml of the incoming publish request, upserting this metadata (domain, system, product, S3 path) into the central Database, and invalidating any necessary caches. This acts as the "Catalog Registry" that powers the dynamic landing page.
- Use the S3 object structure to prevent overwriting versions (e.g., s3://bucket/{domain}/{system}/{product}/{version}/). The publish API accepts versions and the Portal routing knows how to resolve /docs/infrastructure/object-store/s3/v1.2.0.
- the cli must extract the "last updated" timestamp from Git commit history during build time and embed it in the published artifact.


# 3 Pages setup
- There are two pages, landing page and documentation page
- Both pages contain header, footer, and breadcrumbs
- landing page
    - The header contains title "Enterprise Documentation"
    - The main page is two column layout. left side navigation and right side product tiles.
    - side navigation contains domain -> system hierarchy. By selecting system or domain the corresponding products are filtered.
    - side navigation is derived from taxonomy and product to domain/ system association is from docs.yaml in each documentation site. Similar to how Amazon docs site works https://docs.aws.amazon.com/
    - Product tiles have tile and small description. These comes from docs.yaml in each documentation site
    - When the product is selected corresponding documentation site page is opened.
- documentation page
    - Displays the selected documentation site
    - uses 3 column layout.
    - left: product documentation site navigation
    - middle: selected document
    - right: table of contents of the selected document
    - breadcrumbs is updated with Home icon and path to selected documentation site, example Home-> domain - system -> product. When clicked on home icon, user is taken to landing page. For now, domain, system and products are not links
    - search box is displayed on the top right header. When searched results are displayed similar to how backstage docs work https://backstage.io/docs/overview/what-is-backstage
    - When a search result is selected, it takes to the appropriate document page
    - On the header selected document title is displayed
    - Footer displays feedback, edit this page links, Content Freshness & Trust badges.
    - Add a version dropdown in the header.
- sample-docs
    - Use an environment file with local vs prod property
    - In local mode, use the documentation in sample-docs
    - In prod mode, docs are fetched from S3 and docs.yaml is fetched from a database. Don't implement prod mode code yet but just create stubs so I can implement them later.
    - use service pattern to use local vs prod implementation as needed
- Styles
    - On the top right of the header a light/ dark mode icons are displayed to select light or dark mode theme.
    - styles are maintained in /static folder
    - Use modern, elegant and sleek styles
    - Use modern HTML and CSS features mentioned in https://web.dev/css#the-latest-in-css-and-ui-design and https://moderncss.dev/

# To do (later)
- cross-linking strategy
