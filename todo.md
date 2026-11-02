### Soon
- [x] ~~add line of best fit to the score over time graph instead of just having the line graph that is smooth.~~
- [x] ~~add different colors for double bogey and another color for tripe and worse, and then put gold for ace / eagle~~
- [ ] add other data analysis

### Hard
- [ ] Add saving courses
- [ ] Add c1 and c2 and drive distance and angle and stuff like that


### things that are wrong with it
- [x] ~~The round history tracks overall for all courses, but this data is wrong because different courses have different lengths and pars~~
    - ~~If there is an overall score tracker it should be the average +/- over under par. So that it is normalized throughout all courses~~
- [x] ~~The hole by hole average is overall, not on a per course basis~~
- [x] ~~The detailed round history hole analysis is wrong for the colors if the par is not 3. It also displays the incorrect pars for this.~~
- [x] ~~the save round button does not have feedback, meaning you don't know if you have clicked it or not. MAYBE make it so it goes to the scores tab after it saves it.~~
- [ ] The course name does not remove whitespace at the end, in case you accidentally put a space at the end
- [ ] The saved rounds in localStorage don't save the pars for each hole respectively with the scores
- [ ] The least squares line is not that helpful without a key saying ex: "-0.2 per round played". AKA needs a slope key
- [ ] The course name box should be the whole horizontal distance of the screen at the bottom for that input box.