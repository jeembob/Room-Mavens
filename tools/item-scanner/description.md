Goal is to make a scanner that look for card html in the dom:

-Div class="overlay-card"
-Extract text for class=name div as card name
-Extract the image itself from the image tag
-create a itemcards.json
-store images in images/Items

Example DOM element containing card

<div class="overlay-card svelte-mhrxqn"><svg class="fs_image item svelte-rnmcpg" role="img" aria-label="Winged Shoes" viewBox="0 0 400 600"><g transform=" "><image width="400" height="600" preserveAspectRatio="xMidYMin meet" transform="" href="/public/images/byid/8640.image.webp"></image></g></svg> <p class="name top-half align-start justify-start germania shadow svelte-mhrxqn">Winged Shoes</p> <p class="cost germania shadow svelte-mhrxqn">15</p> <div class="overlay icon equip-slot svelte-18gp9n6"><svg class="icon small svelte-18gp9n6" fill="currentColor" stroke="currentColor"><svg xmlns="http://www.w3.org/2000/svg" viewBox="-28.35 0 485.56 485.56">
  <defs>
    <mask id="legs" fill="#000">
      <rect width="100%" height="100%" fill="#fff"></rect>
      <path d="m220.74 93.9-.6 3.86c-.95 6.1-1.91 12.34-2.88 18.63-.2 1.28-.4 2.56-.62 3.85H131.9a13.17 13.17 0 1 1 0-26.34zm-6.98 44.65c-.17 1.16-.35 2.31-.54 3.46-1 6.34-2 12.58-2.88 18.63-.22 1.43-.43 2.85-.65 4.25H131.9a13.17 13.17 0 1 1 0-26.34zm-6.83 44.64c-.27 1.84-.54 3.64-.79 5.4-1 6.92-1.86 13.21-2.55 18.64-.1.79-.2 1.55-.29 2.3h-65.59a13.17 13.17 0 0 1 0-26.34zm5.5 70.98h-68.9a13.17 13.17 0 0 1 0-26.34h58.36a28.59 28.59 0 0 0 .73 3.85c1.36 5.16 4.13 11.55 7.79 18.63.66 1.27 1.34 2.56 2 3.86"></path>
    </mask>
  </defs>
  <g mask="url(#legs)">
    <path d="M428.86 405.21c-87.35 85-193.32 73.36-193.32 73.36s0-5.81-3.49-16.3c-22.13-4.66-75.7-1.16-81.52-1.16s-17.47 18.63-21 24.45c-15.13 0-103.65-25.62-117.62-43.09-7-22.13 15.14-152.56 27.95-211.95C-22.99 61.65 7.29 12.78 7.29 12.78c64-21 101.31-12.82 138.58 1.16s80.35 5.82 83.85 9.31c1.44 1.45-3.13 32.87-9 70.68l-.6 3.86c-.95 6.1-1.91 12.34-2.88 18.63-.2 1.28-.4 2.56-.62 3.85-1 6.11-1.92 12.25-2.88 18.31-.17 1.16-.35 2.31-.54 3.46-1 6.34-2 12.58-2.88 18.63-.22 1.43-.43 2.85-.65 4.25-1 6.38-1.9 12.52-2.76 18.3-.27 1.84-.54 3.64-.79 5.4-1 6.92-1.86 13.21-2.55 18.64-.1.79-.2 1.55-.29 2.3a163.08 163.08 0 0 0-1.53 16.33 17.31 17.31 0 0 0 .12 2 27.21 27.21 0 0 0 .74 3.85c1.35 5.16 4.12 11.55 7.78 18.63.66 1.27 1.34 2.56 2 3.86 15.65 28.81 43.39 66.23 47.53 75.34 74.54-1.16 111.8 17.47 111.8 17.47l33.77-7s22.14 15.14 23.3 65.22"></path>
  </g>
</svg>
</svg>    </div> <p class="code top-half align-start justify-end germania shadow svelte-mhrxqn">2</p> <div class="purchased top-half align-start justify-start svelte-1yf1vwd"><div class="overlay icon svelte-18gp9n6"><svg class="icon small svelte-18gp9n6" fill="#6B7C9B" stroke="black"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -15.495 259.44 259.44">
 <g transform-origin="center" transform="scale(0.95)">
  <path stroke="#000" stroke-width="5%" style="paint-order: stroke;" d="M73.72 228.44s21-12.61 29.44-29.43 5.78-24.71 5.78-24.71 15.24 0 17.61-15.77c7.62 6.31 18.92 8.15 26.81 3.42 6.57 4.73 26.87 4.34 33.64-7.1 7.62-12.88 3.25-19.71 1.84-22.87 4.47 1.32 7.89.53 12.88-1.57 5 2.89 24.91 10.53 41-.79 7.1-5 13.41-13.14 13.41-23.13 7.88-11 1.31-43.9-14.72-49.94 0-6.83-21.29-23.92-33.12-23.66-4.2-7.36-13.67-16.29-25.76-16.29-9.72-10.52-27.59-15.51-43.63-13.14-12.09-6.05-23.39-2.9-30.49-.15A42.15 42.15 0 0 0 81.6 5.03C65.83 7.4 56.9 12.66 53.22 19.75c-18.95 7.62-32.61 21.82-33.14 38.38C9.57 67.59 6.41 77.84 8.51 85.46c-8.67 8.15-12.09 21.82-3.67 28.81-3.16 15.87 7.35 25.86 21 26.39-27.58 18.92 23.68 54.67 54.96 52.56.52 6.58-.79 24.71-7.1 35.22"></path>
  </g>
</svg>
</svg>    </div></div> <div class="text bottom-half align-end justify-start">0/2</div>  </div>