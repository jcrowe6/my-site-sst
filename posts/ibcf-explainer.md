---
title: 'UBCF vs. IBCF explained'
date: '2024-12-31'
---

Recommending stuff is always fun.

You learn about what somebody likes, it reminds you of something else, you tell them about it, and they 
may or may not go on to enjoy something new, all because of you and your elegant taste!

However, if you want to make *quick* recommendations for *lots* of people, you have an interesting data science problem -
and unlike simple regression or classification, there is no one correct answer for what to recommend. 

In this post I explain one basic way to make recommendations called **Item-Based Collaborative Filtering** or **IBCF**, 
which is what I used to create [this demo](/MovieRecommender) where you can rate some movies and see what else you might like.


## Show me something I'd rate highly, please

So to make recommendations in reality, you take a lot of information about an individual's tastes, their 
opinions on different topics, past things they have read/watched/used, etc. and come up with an elegant answer.

Online though, you don't often have that kind of nuance of information, so you ask users to summarize their opinions
about different items with a single rating - usually with a "like"/"dislike" button or a 5-star scale.

So, let's assume our data looks like this - you have `n` users and `m` items. Each user can rate each item up to once, with 
a number where higher = likes it more.

| user_id | item_1 | item_2 | item_3 | ... | item_m |
|---------|--------|--------|--------|-----|--------|
| u1      | 5      | 2      |        | ... | 1      |
| u2      | 5      | 3      | 5      | ... |        |
| ...     | ...    | ...    | ...    | ... | ...    |
| un      | 2      | 5      |        | ... |        |

The goal is this: *given a new or existing user's ratings, recommend some items that they haven't rated, but would probably rate highly*

Obviously, there's no one right answer, but IBCF is a reasonable choice, and I'll show you why.

## Find people with similar taste!

If you're like me, this is your first thought. 

For a given user `A`, maybe we can find another user `B` with similar ratings, and recommend something that `B` rated highly that `A` hasn't rated.

To illustrate this, let's look at a simplified version of the data, and suppose we wanted to recommend something for user `u1`

| user_id | item_1 | item_2 | item_3 | item_4 |
|---------|--------|--------|--------|--------|
| *u1*      | *5*      | *2*      |        | *1*      |
| u2      | 5      | 3      | 5      |        |
| u3      | 2      | 5      | 1      |        |

We can compute the similarity between `u1`'s row vector `[5,2,nan,1]` and all the other row vectors (just `[5,3,5,nan]` and `[2,5,1,nan]` in this example).
We can use cosine for this, but we need to decide what to do with the `nan` values (items users haven't rated). A simple choice is to 
just compare the *intersection* of the vectors / only compute the similarity between users based on items *they both have rated*.

So, we can just compute the similarity of `u1` and `u2` as the cosine similarity of `[5,2]` and `[5,3]`: about 0.99. And for `u1` and `u3`, the cosine 
similarity of `[5,2]` and `[2,5]`: about 0.69.

Now, to guess what `u1` might rate `item_3`, we can use the other 2 user's ratings to estimate this *weighted by their similarity to `u1`*. 
For this example, since `u1` is most similar to `u2`, `u2`'s review of `item_3`, 5, will have more weight. And in fact, the final
weighted average estimate of about 3.2 is on the "higher" end of the spectrum

Now, imagine applying this process across many items, then picking the 
top `k` estimated ratings to use as your recommendation! 

This is actually called **User-Based Collaborative Filtering** - because we're comparing *users* directly and *collaboratively* using their
reviews to estimate for new users.

## Ok thanks, but what's IBCF?

Okay! UBCF is perfectly reasonable, but it can break down in application when **there are more users than items** 
or **user's reviews are sparse**.

Since it requires computing the similarity between all users, if you have millions of users, this is a very expensive operation,
and you need to recompute it frequently - every time a new user is added/updated.

Also, since you need to compare users on item's they've both reviewed, if their reviews are sparse across all items, it will be 
difficult to find *any* other users to compare to.

This is where the cleverness of IBCF comes in - instead of computing the similarity of all users, compute the **similarity between all items**.

Think of it like this: an item in our data is a column vector, characterized by a distribution of reviews across all the users. Items with high 
cosine similarity tend to *be reviewed similarly by the same users*. 

How does this help recommend to a new user though? Well, in order to fill in our guess for what `u1` would rate `item_3`, 
we can average their *existing reviews for other items, weighted by their similarity to `item_3`*.

To really see this, I'll again walk through an example like before.

| user_id | item_1 | item_2 | item_3 | item_4 |
|---------|--------|--------|--------|--------|
| u1      | 5      | 2      |        | 1      |
| u2      | 5      | 3      | *5*      |        |
| u3      | 2      | 5      | *1*      |        |

We're iterested in what `u1` might rate `item_3`. First, we compute the similarity of `item_3`'s column vector `[nan,5,1]` to all other items' column
vectors, and see this will be highest with `item_1`/`[5,5,2]` - (it's 0.98), lowest with `item_2`/`[2,3,5]` - (it's 0.67), and undefined / nan for
 `item_4`/`[1,nan,nan]` (since they have
no overlap.)

Then, to estimate `u1`'s `item_3` rating, we take a weighted average of their existing reviews, `[5,2,1]`, using those similarities, `[0.98,0.67,nan]`, and 
again, get a number around 3.2.

## Conclusion

A final note is that IBCF and UBCF do not yield the exact same results. IBCF may tend to recommend *complementary* items - those that 
"go together" like tea and teacups, while UBCF may tend to *alternative* items - those that you could pick "instead" like black tea and green tea.

There is a **lot** more to recommendation systems these days, but collaborative filtering is certainly not useless by any means, and it
helps to understand the basics. 

I truly hope you got something out of this. Let me know what you think via email (on site homepage) or [LinkedIn](https://linkedin.com/in/jeremiah-crowell).

Thanks for reading!






