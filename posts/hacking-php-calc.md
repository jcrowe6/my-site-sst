---
title: 'Hacking "PHP Calculator" // CTF writeup'
date: '2023-10-27'
---
*[Updated in 2023, originally written in 2021 on my old site]*

---

This is a writeup for the web hacking challenge 'PHP Calculator', one of the web hacking challenges
in the [SIGPwny](https://sigpwny.com/) CTF.

[Here's](http://phpcalc.chal.sigpwny.com/) a link to the challenge, if it's still hosted. Obviously, this article is a big spoiler.

## Looking for an attack

The target for this challenge is a basic calculator web app. It works as you'd expect, and even has some cool trig functions you can use. It also has a link to the PHP source code right at the top. 

![](/images/phpc1.png)

On the backend, it takes the URL parameter `expr`, and sets the calculator's output to be the result of applying `check_expr()`.

![](/images/phpc2.png )

`check_expr()` puts our input through 3 tests.

- Must be shorter than 0135 (octal, in decimal 93) characters long 
- Cannot have any spaces, tabs, newlines, backslashes, quotes, or brackets
- If there are letters or underscores, then the entire word that they make up must be in an approved list of strings. 
These strings are the [PHP math functions](http://php.net/manual/en/ref.math.php).
(about 50 functions, mostly things like 'sin', 'cos', 'pow', 'rand', 'floor', etc.)

If we pass these checks, our input is sent to a function called evaluate_expr(), *which just does a literal `eval()` of the input string*,
interpreting it as PHP code. Red flag! Our goal now is to get some code in here that will return the flag file's contents.

## Testing ideas

It would be nice to just send a `system()` call in here and be done, but the real challenge is in circumventing the 'security' implemented in `check_expr`.

I couldn't find a way around the strict regex. Remember, any character or symbol that isn't a function in the whitelist is denied. So I thought to work with what we're given, and started looking through the PHP `math` functions for something to construct a payload with.

We're looking for any function that returns something other than just a number - but like I said, most of these are just plain old math functions with numeric outputs. 

The first thing that jumped out at me was the function `base_convert`

![](/images/phpc3.png)

As you can see, this returns a string, not a number! And better yet, if we set the `$to_base` argument to 36, 
the number gets converted into an alphanumeric sequence that can include all characters a-z! 
This means, using an online base36 to decimal converter, we can find numbers that, when put through this
(whitelisted) function, return whatever lowercase word we want.

![](/images/phpc4.png)

Awesome! Let's do 'system(ls)'!

![](/images/phpc5.png)

Amazing! We can even see the file `flag.php`, just waiting for us! 

At this point, I think I have it. All we have to do is construct `system(cat flag.php)`. 

Unfortunately, this requires the space and period characters, which we can't make from base_convert(). 
But, we *can* make `chr()`, which can take in an ASCII value and give us any character, great! Now, we can construct a full payload that is a concatenation of these parts (`.` is the string concatenation operator in PHP, apparently)

```php
base_convert(1751504350,10,36). // system
(base_convert(15941,10,36).     // (cat
base_convert(16191,10,36)(32).  // chr(32)  /space
base_convert(727432,10,36).     // flag    
base_convert(16191,10,36)(46).  // chr(46)  / period
base_convert(33037,10,36))      // php)
// => system(cat flag.php)
```

Great, just paste it in, and...

![](/images/phpc6.png)

Too long. The payload has to be less than 93 characters. Well, we don't necessarily need get 
*just* `flag.php`'s contents. How about `system(cat *)`, which is:
```php
base_convert(1751504350,10,36). // system
(base_convert(15941,10,36).     // (cat
base_convert(16191,10,36)(32).  // chr(32) = space
base_convert(16191,10,36)(42))  // chr(42) = *
```


This is unfortunately still too long - 117 characters. So close!  This is where I really got stuck. 
I tried other approaches, looked through all kinds of possible PHP or linux commands that could be useful
and shorter, but I eventually found that
to get further, we'll have to get creative with how we can create strings.

## Getting creative

So, the real issue here is that putting in a single special character, like a space or an asterisk,
currently requires 29 characters of payload, as in `base_convert(16191,10,36)(42)` is needed to make `*`. 
It would be really, really awesome if I could somehow *modify* a whole string, and convert some characters
into new ones. E.g. use `base convert()` to create something like `z7fkp`, perform some function on it, and it becomes
`cat *`

This is starting to sound very encryption-ey, and I thought about XORing strings together. The `^` operator
is in fact allowed, and some quick testing showed we can new characters this way. 

Before, the only output I could get is lowercase letters, since that's what `base_convert` returns, but you can see here that XORing two `base_convert` outputs gets us a *capital* F!

![](/images/phpc7.png)

I found that PHP XORs strings together by just XORing each character's ASCII together, left to right. Using this info, I wrote a
Python script that tried all the possible combinations of XORs of characters we can make with base_convert (0-9, a-z)

![](/images/phpc8.png)

Hmm. Mostly control characters, a few capital letters, and none of the precious spaces, asterisks, or lowercase letters we need.

Well, how about 2 XORs?
Since 36\*36\*36 is a big number, I just searched to see if there was some combination that would produce an asterisk. And:

![](/images/phpc9.png)

`'1'^'a'^'z'` gives us an `*`! I made a quick change and had it look up the rest of the characters in 
`cat *`, and found this combination.

![](/images/phpc10.png)

Taking each column to be a string of text, we essentially just need to have `'11111'^'111aa'^'catpz'`, and we 
should get a `cat *` to put in our `base_convert`ed `system()` call! 

Also, I noticed that `11111` and `111aa` are valid hexadecimal numbers, and another allowed function is
`dechex()`, which we can use to make these strings without having to type the longer `base_convert`. 

So! Here's the final payload:
```php
base_convert(1751504350,10,36) // system
(dechex(69905)^                // (11111^
dechex(70058)^                 // 111aa^
base_convert(20660471,10,36))  // catpz)
// => system(cat *)
```

This comes in at a cool 88 characters long. Below you can see it plugged into the site, and alongside
the broken page, at the top of the source, we have:

![](/images/phpc11.png)

The solution flag! 

Thank you for reading, I hope you enjoyed! :)