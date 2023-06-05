Title: How to use Brittle
Created at: 2023-06-04

---

Brittle is a markdown extension that supports inline JS templates, like in ejs.

Brittle was created in 40 minutes. Therefore, Brittle is kind of brittle. But it works.

Also, it uses eval. So only use it with markdown text you trust. I am not responsible
for thermonuclear war.

# Running

10 + 10 is [=`10 + 10`].

The following list was generated with Brittle:

[`for (let x = 1; x <= 5; x++) {`]
[=`x`]. This is 'a' repeated [=`x`] times: [=`'a'.repeat(x)`][`}`]

The above is the output of the following Brittle template:

```md
# Running

10 + 10 is \[=`10 + 10`].

The following list was generated with Brittle:

\[`for (let x = 1; x <= 5; x++) {`]
\[=`x`]. This is the string 'a' repeated \[=`x`] times: \[=`'a'.repeat(x)`]
\[`}`]
```
