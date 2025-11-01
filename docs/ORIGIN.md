We're going to setup a fan-made version of "The Floor", a new gameshow from Fox. You can read more about the format of the show here: https://en.wikipedia.org/wiki/The_Floor_(American_game_show)

This is what we're going to do together: program an interactive webapp which can be used to play The Floor. Here are the general guidelines
1. The application should be made in React using TypeScript
2. We should use best practices in development (unit testing, code linting and formatting enforced automatically)
2. It supports an arbitrary number of players with unique topic categories and associated slide shows
  i. For the purpose of this game, we only consider the most simple version of the challenge where two dueling players take turns in a chess-clock like manner, naming what's on the slide
3. The application will be run by a gamemaster who determines what answers are right and wrong
4. We should be able to do this entirely with a frontend, using browser storage to maintain any state we need
5. I'm your mentor and companion, ask me any questions you have and I'll be happy to answer. It's best that we communicate clearly and avoid misaligned assumptions as this will resolve pain points before they're embedded in the code.
6. You have a Playwright MCP available to test with. You can use it to check functionality and if you can't, you can always set things up for me to check and I'll let you know.

Specification:
1. I already have slides ready for all of the contestants in the form of Google Slides
  i. Here's what's on each slide
    a. An image
      1. Sometimes the background is transparent, we should use white as a fallback background
      2. The whole image must be shown to avoid cropping important parts
    b. The correct answer as a speaker note
    c. Potentially one or more censorship boxes which cover identifying text in the image
      1. These boxes **must** be preserved, specifically their position and size relative to the image, when converting slides to this appliation
      2. Color must also be preserved, as they're colored to blend in with the background images
  ii. We'll need to conver these images into a format for this application. We could do, like, jekyll slides but that might be overkill for this. Let me know what the best format to get these slides to you is (pptx, pdf, etc).
2. There should be a master dashboard to control the game
  i. It displays a list of all game contestants
    a. We see the contestant's name, number of wins, and category
    b. Contestants who have lost are greyed out
  ii. The game master can select two contestants along with whose topic will be used and begin a duel
3. Once in a duel, there should be two views, the audience view and the master view
  i. In the audience view
    a. We see the full image in question displayed on a slide. If the image's aspect ratio does not match the display, we should allow letterboxing rather than risk cutting off an important part of the image.
    b. At the top is a clock bar. It displays both dueler's names on the left and right side as well as their remaining time, and which player is currently active
    c. When an answer is skipped, the correct answer is displayed on screen in the center of the clock bar for 3 seconds (these three seconds are counted against the skipping player), then control transfers to the inactive player
  ii. In the master view
    a. We have two buttons, one with the correct answer displayed and one with "skip"
    b. When the correct answer is clicked, control of the board transfers to the other player
    c. When skip is clicked, the answer is shown as described in 3(i)(c) and if the skipping player's time goes <=0, they lose

We're going to do the following:
1. Review all documentation, do research, and think deeply about this application
2. Review https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices because you **must** adhere to these best practices to the best of your ability in the next steps.
3. Write a formal specification into SPEC.md
4. Break down the work to be done into a feature set and list of tasks to be done, writing high-level implementation prompts in a folder for each task. These should be more like ACs and less like code snippets of exactly what to implement.
