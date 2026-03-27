---
title: 'Solving the Whole Year Puzzle with Z3'
date: '2025-06-05'
---

I was given the [Whole Year Puzzle](https://www.palmettopuzzleworks.net/product-page/the-whole-year-puzzle) by Palmetto for Christmas
last year, and pretty much immediately knew I'd end up doing this.

It's one of those tile puzzles where you have a set of tetris-like pieces ([polyominoes](https://en.wikipedia.org/wiki/Polyomino))
that you have to fit into a grid - the trick with this one being to leave just the 2 cells corresponding to the day uncovered.

It's a great puzzle that I would spend like 5 minutes on in the morning, but not one that I would solve every day! And, whenever I'd fail,
the vindictive little goblin in my brain inched closer to taking total control and making a program to find *every* solution
for *every* day, just to really show this laser-cut piece of plywood who's boss - (and to find out if some days *really are* harder
than others or if I just get lucky sometimes)

Spoiler, every day *is* a different difficulty. Also, I believe that with a slight tweak, the puzzle can be substantially improved.

## Problem Formulation

The first algorithm I found when I started to research solving these tiling puzzles was [Knuth's Algorithm X](https://en.wikipedia.org/wiki/Knuth%27s_Algorithm_X).

I didn't end up using DLX since I was more interested in learning how to use a SAT solver (Z3 is actually an SMT solver, I know), but the problem 
formulation Knuth uses in DLX made it much easier to set up.

Basically, we convert the puzzle into a matrix. Each row of the matrix corresponds to *a valid placement of a polyomino onto the empty puzzle*
and each column corresponds to *a particular cell of the puzzle*. A picture will hopefully help illustrate this.

![](/images/ys1.png)

In this simplified setup, we just need to fully cover a 2x2 puzzle grid with 2 very simple tiles. I've numbered each cell and assigned it 
a column in the matrix.

![](/images/ys2.png)

We begin filling the matrix by placing the first tile and recording which cells it covers with 1's. Also, we need to remember that this first
row corresponds to this polyomino particular polyomino, but this isn't illustrated.

![](/images/ys3.png)

This process is repeated until all possible polyomino placements have been recorded. We now have the entire puzzle stored as this matrix.

In this formulation, it's easy to see what polyomino placements can be chosen to cover a particular cell: for example, the 0 cell is covered by all
but one placement of the tromino, and only one placement of the monomino. 

Also, the puzzle is now reduced to picking rows of the matrix (picking placements of polyominos) such that each column is covered exactly once 
(every cell is covered exactly once). 
To make sure you only use each tile just once, you can either keep track of them seperately (which is what I did) or encode 
each tile's use with additional columns that are 1 for any placement where it is used.

## To Z3

Now, with this matrix in hand, you can simply feed it to DLX and get all the solutions very quickly. 

However, if you're interested in learning about Z3, read on to see how easily we can set it up using this representation.

First, we need to make a solver, and a Z3 Bool variable for every possible placement.

```python
solver = Solver()
# inc_mtx is the numpy array representation of the puzzle
placement_bools = [Bool(f"p_{i}") for i in range(inc_mtx.shape[0])]
```

Then, we can iterate over each column of our matrix (every cell of the puzzle), and add a condition to the solver 
that exactly one of the placements that covers it must be used (unless we want to leave that cell open, in which
case we require none to be used)

```python
for j in range(inc_mtx.shape[1]):
    # Get all indices with a 1 (placement covers this cell)
    placement_idxs = np.argwhere(inc_mtx[:,j]).flatten() 

    # Convert indices to associated Bool variables
    covering_bools = [placement_bools[i] for i in placement_idxs]

    # Either require exactly 1 or 0 be used depending on the day
    # j1 and j2 are the columns / cells wanted uncovered today
    cell_is_today = (j == j1) or (j == j2) 
    solver.add(PbEq(
            [(v, 1) for v in covering_bools], 
            0 if cell_is_today else 1)
        )
```

Finally, we need to require each polyomino not be used more than once, by requiring that exactly one placement of 
each polyomino be used

```python
# poly_is maps polyominos to all the 
# row-indices of their placements in the matrix
for poly, idxs in poly_is.items():
    poly_bools = [placement_bools[i] for i in idxs]
    solver.add(PbEq([(v, 1) for v in poly_bools], 1))
```

And that's it! Now we can just call `solver.check()` and `solver.model()` to get a solution for any day of the year!

But, if you want to enumerate all of the solutions, you need to repeatedly ask Z3 to find you new solutions, by adding 
new constraints like so:

```python
while solver.check() == sat:
    model = solver.model()
    n_solns += 1
    # Require next solution to be different 
    # in at least 1 variable than this one
    not_last_soln = Or([v != model[v] for v in placement_bools]) 
    solver.add(not_last_soln)
```

## Results 

To see how difficult each day is, I plotted the log of the number of solutions for each day of the year with `calplot`, with fewer solutions 
(more difficult puzzle) being red, and more solutions being blue

![](/images/year_heatmap.png)

As you can see, each day is different. Also, the main factor in difficulty is the month. 

## Improvement

Not satisfied, because there isn't an easy way to tell each day how difficult of a puzzle it is, I became curious as to if a 
different arrangement of the underlying months and days would give a more satisfying plot.

So, I enumerated all the solutions for all the pairs (this is where using DLX would have saved me like half an hour of waiting)
and sorted them, and came up with the following arrangement:

![](/images/wypv2.png)

This arrangement places the months on increasingly more difficult cells interpolated from the easiest to the hardest. For the days, I simply 
put them in the exact easiest-hardest arrangement for January, though other sortings would likely lead to a more consistent increase in difficulty 
for every month. Here's the results:

![](/images/year_heatmapv2.png)

I'll let you decide if this admittedly far less intuitive arrangement of days is worth the knowledge that the puzzle you're solving gets more difficult every day.

That's all! If you want to check out my code you can find the whole notebook [here](https://github.com/jcrowe6/whole-year-puzzle-z3/blob/master/yearsat.ipynb) on my Github.

Thanks for reading!

