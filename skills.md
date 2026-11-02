### ALWAYS TRUE
Follow this to a tee
- The saved scores JSON needs to be backwards compatible for any changes that are made
- Keep all css to style.css, don't put it inline in the html
- This website is hosted on github pages. There is NO BACKEND. Therefore everything will have to work with a frontend only.
- Don't rewrite things that don't need re-written. There is no need to completely rewrite an entire js file if you just need to update a function or add a new method.
- No refactoring without EXPLICIT PERMISSION
- Don't change the way it looks on a whim. Read style.css to see what the design ux/ui language is already.
- **This website is a disc golf phone webapp, Non bloated only useful features.**
- **This app does not look AI at all. Don't add dashed boxes around things, or any other AI like css stylings.**


### How to read the files
todo.md has the todos for the project
- "things that are wrong with it": These are the errors and the bugs that need to be fixed
- "Soon": these are the things that are in the short term, features that want to be added
- "Hard": These are the things that are in the future of the project, but are hard to implement right now

index.html is the front end for the home page

scores.html is the front end for the scores page, this is where all the data science magic is displayed. The js for this is scores.js, where all of the data science magic happens.

style.css is the css for the project. This is not react based or any other css projects. Just vanilla css

app.js is the homepage javascript file.

scores.js is the scores javascript file.
- The main thing with this is that the data is helpful and easy to read. The graphs must be informational without being too complicated.
