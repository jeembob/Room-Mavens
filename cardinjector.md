Goal: make a chrome extension image injector that replaces an image references with local one based on text-matching of text within an element family. We are replacing the represetntaiton of game card from a blank card with html text to the complete card with all the text on it as an image.

The extension needs to find the scenario where the text matches an image name (after some basic parsing) and that text is encased in an element with an img tag. This is to identify it is a card, and not just the name of the card written.

The webpage text uses the formal name with caps and spaces, the card jpeg's name to be injected is "[lowercased with hyphens].jpeg. For example:

On web-page: 'Fearsome Taunt'
card nme: 'fearsome-taunt.jpeg'

Here's how most parent elements will look.

1. the parent object is in an svg element
2. image's have a href="/public/images/byid/..." structure
3. Below it is a text which contains the name to be matched.

The injector should behave as follow
1. Dynamically or on detected DOM change, correctly detect the scenario by finding the tag, the image link and matching text post-parsing
2. Replace the image reference with the local version, currently in ./images/Bruiser
3. Make all text elements in the parent "card" elemnt transparent (so it is non-destructive but not)

Here is an example:

<svg fill="#5E7EBD" stroke="#5E7EBD" viewBox="0 0 400 560" class="normal status3 svelte-100h3ob selected">
    <image href="/public/images/byid/8946.image.webp" width="100%"></image>
    <text x="50%" y="34" stroke="none" fill="#000" font-size="25" text-anchor="middle" dominant-baseline="central" style="font-family: GermaniaOne;">Fearsome Taunt</text>
    <text x="32" y="34" stroke="none" fill="#000" font-size="30" text-anchor="middle" dominant-baseline="central" style="font-family: PirataOne;">X</text>
    <text x="50%" y="50%" stroke="none" fill="#fff" font-size="48" text-anchor="middle" dominant-baseline="central" style="font-family: PirataOne;">10</text>
    <rect fill="black" stroke="none" x="360" y="5" width="35" height="35"></rect>
    <svg class="icon" color="" fill="currentColor" width="25" height="25" x="365" y="10" stroke="currentColor">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -9.63 228.81 228.81">
  <path d="M228.8 11.09c-5.4-8.58-22.4-13.2-38.06-10.15-7.53 10.4-55.83 95.58-84.37 144.5-30.46-21.67-59.37-42.93-59.97-43.3-20.22.8-33.76 7.35-46.4 20.12 7.47 5.9 75.55 58.37 112.08 87.28 22.41-37.32 113.14-193 116.72-198.45"></path>
</svg>
</svg><
/svg>

While i expect this structure to be consistent, I'm not sure about the order. The key will be to detect text card names that match local card names (in this directories images folder) after the transformation from formal name to lowercase/hyphenated.

other key notes:

Target site url:
https://gloomhaven.smigiel.us/

Sample of image:
images/Bruiser/balanced-measure.jpeg


Updating: 
I think the websites DOM will update dynamically given it is a webapp to manage a card-based game called Gloomhaven. I am not sure the best practice, but it should be able to detect DOM changes given the cards can move around.



