---
title: "Pascal's (modulo) triangle"
date: '2026-08-19'
---

It's well known that if you take [Pascal's triangle](https://en.wikipedia.org/wiki/Pascal's_triangle), and mark the odd numbers black and the even numbers white, the [Sierpiński triangle](https://en.wikipedia.org/wiki/Sierpi%C5%84ski_triangle) emerges.

![](/images/Sierpinski_Pascal_triangle.png)

One day back in my college English class I was pondering this, and thought - "what makes modulo 2 so special? what kind of patterns emerge if you instead color the numbers which are 0 modulo 3, or 4, or 57?"

As soon as class was over I cobbled together a script to explore this idea, which did all the plotting in `matplotlib` and was extremely inefficient.

But it did it's job, and generated some cool pictures! Here's the result for modulus = 42 and 100 rows of Pascal's triangle

![](/images/42.png)

Well, I was mostly satisfied with that, but even now this problem pops up in my head not-infrequently. There were some really interesting patterns that emerged, but the
script was way too slow to really explore it all that well. 

So, I decided to revisit this, and make a little browser toy using HTML5's `<canvas>` element and some JS. [Here it is!](/pascals-triangle)

This is exactly what I was wanting back when I first thought of this. Plus, I was able to add some animated modes to scratch a particular itch I've had with this problem, in regards to visualizing about one remainder being colored at a time, and "scrolling" through them to see where they appear in the triangle.

![](/images/anim1.gif)

It's surprisingly enthralling, downright fun to play with, and honestly pretty beautiful. I don't understand the math as much as I'd like - would love answers to questions like:
- Why, regardless of modulus, does remainder 0 stay "dense" and create those upside-down triangles? 
    - Why doesn't that happen for any other remainders?
- Why do prime moduli look like that?

So that'll be what I ponder when I come back and play with this going forward. But this post is just to put this out there for anyone else to explore.

Highly recommend going in there and clicking the "Randomize" button just to see what happens. Let me know if the explainations for the coloring modes need refining. Thanks!