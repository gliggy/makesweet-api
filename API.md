Hello, good evening, and welcome, to makesweet's API!
Here's how to use it:
1. get a computer
2. get curl
3. send a POST request with things in it
4. receive a response
5. do whatever you want with it.


examples (assuming MAKESWEET_API is set as env var):
-------

send only text (use &text for more text)
```
curl -X POST $MAKESWEET_API/make/heart-locket?text=hello -o hello.gif
```
-------

send only images (for multiple images, repeat with another -F)
```
curl -X POST $MAKESWEET_API/make/heart-locket -F "images[]=@image.jpg" -o animation.gif
```
-------

send both text and images
```
curl -X POST $MAKESWEET_API/make/heart-locket?text=squirrel -F "images[]=@image.jpg" -o animation.gif
```
-------

the default is images go before text, use &textfirst=1 to make text go first
