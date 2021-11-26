How to use the makesweet api:
-------

  1. get a computer
  2. get curl
  3. send a POST request with things in it
  4. receive a response
  5. do whatever you want with it.

examples:

-------

send only text (use &text for more text):
```
curl -H "Authorization: key" -XPOST https://api.makesweet.com/make/heart-locket?text=hello -o hello.gif
```
-------

send only images (for multiple images, repeat with another -F):
```
curl -H "Authorization: key" -XPOST https://api.makesweet.com/make/heart-locket -F "images[]=@image.jpg" -o animation.gif
```
-------

send both text and images:
```
curl -H "Authorization: key" -XPOST https://api.makesweet.com/make/heart-locket?text=squirrel -F "images[]=@image.jpg" -o animation.gif
```
-------

send stuff with text border:
```
curl -H "Authorization: key" -XPOST "https://api.makesweet.com/make/heart-locket?text=a+frog,%0Aa+very,+very+coolfrog&textborder=200" -F images=@frog.jpg -o frog.gif
```
-------

the default is images go before text, use &textfirst=1 to make text go first.
